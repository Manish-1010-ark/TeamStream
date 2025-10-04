// backend/workspaceRoutes.js
import express from "express";
import slugify from "slugify";
import { supabase } from "./supabaseClient.js";
import { requireAuth } from "./authMiddleware.js";

const router = express.Router();
router.use(requireAuth);

// GET all workspaces for the current user
router.get("/", async (req, res) => {
  const { data, error } = await supabase
    .from("workspace_members")
    .select("workspaces(id, name, slug)")
    .eq("user_id", req.user.id);

  if (error) return res.status(500).json({ error: error.message });
  res.status(200).json(data.map((item) => item.workspaces));
});

// GET a single workspace by SLUG (The old /:id route has been removed)
router.get("/:slug", async (req, res) => {
  const { slug } = req.params;
  const { data, error } = await supabase
    .from("workspaces")
    .select("id, name, slug")
    .eq("slug", slug)
    .single();

  if (error) return res.status(404).json({ error: "Workspace not found." });
  res.status(200).json(data);
});

// POST to create a new workspace (FIXED with slug generation)
router.post("/create", async (req, res) => {
  const { name } = req.body;
  if (!name)
    return res.status(400).json({ error: "Workspace name is required." });

  // --- Slug Generation Logic ---
  let slug = slugify(name, { lower: true, strict: true });
  let isUnique = false;
  let counter = 1;

  while (!isUnique) {
    const { data } = await supabase
      .from("workspaces")
      .select("slug")
      .eq("slug", slug);
    if (data.length === 0) {
      isUnique = true;
    } else {
      slug = `${slugify(name, { lower: true, strict: true })}-${counter}`;
      counter++;
    }
  }
  // --- End Slug Logic ---

  const { data: workspace, error: wsError } = await supabase
    .from("workspaces")
    .insert({ name: name, owner_id: req.user.id, slug: slug })
    .select()
    .single();

  if (wsError) return res.status(500).json({ error: wsError.message });

  const { error: memberError } = await supabase
    .from("workspace_members")
    .insert({ workspace_id: workspace.id, user_id: req.user.id });

  if (memberError) return res.status(500).json({ error: memberError.message });

  res.status(201).json(workspace);
});

// POST to join an existing workspace
router.post("/join", async (req, res) => {
  const { workspace_id } = req.body;
  if (!workspace_id) {
    return res.status(400).json({ error: "Workspace ID is required." });
  }

  const { error } = await supabase
    .from("workspace_members")
    .insert({ workspace_id: workspace_id, user_id: req.user.id });

  // Error code '23505' is for unique violation (user is already a member)
  // Error code '23503' is for foreign key violation (workspace doesn't exist)
  if (error) {
    if (error.code === "23505") {
      return res
        .status(409)
        .json({ error: "You are already a member of this workspace." });
    }
    if (error.code === "23503") {
      return res.status(404).json({ error: "Workspace not found." });
    }
    return res.status(500).json({ error: error.message });
  }

  res.status(200).json({ message: "Successfully joined workspace." });
});

// GET all messages for a specific workspace
router.get("/:slug/messages", async (req, res) => {
  const { slug } = req.params;

  // First, get the workspace ID from the slug
  const { data: workspace, error: wsError } = await supabase
    .from("workspaces")
    .select("id")
    .eq("slug", slug)
    .single();

  if (wsError || !workspace) {
    return res.status(404).json({ error: "Workspace not found" });
  }

  // Then, fetch messages by querying our new view
  const { data: messages, error: msgError } = await supabase
    .from("messages_with_profiles") // Query the new view
    .select("*") // Select all its columns
    .eq("workspace_id", workspace.id) // Filter by the correct workspace ID
    .order("created_at", { ascending: true });

  if (msgError) return res.status(500).json({ error: msgError.message });

  res.status(200).json(messages);
});

// GET the entire task board for a specific workspace
router.get("/:slug/board", async (req, res) => {
  try {
    const { slug } = req.params;

    // Call our new database function to get the complete, nested board data
    const { data: board, error } = await supabase.rpc("get_full_board", {
      p_workspace_slug: slug,
    });

    if (error) throw error;

    if (!board) {
      return res
        .status(404)
        .json({ error: "Board not found for this workspace" });
    }

    res.status(200).json(board);
  } catch (error) {
    console.error("Error fetching board:", error);
    res.status(500).json({ error: error.message });
  }
});

// This is the special endpoint for saving drag-and-drop changes
router.patch("/board/positions", async (req, res) => {
  try {
    const { lists, workspaceSlug } = req.body;
    if (!lists || !workspaceSlug) {
      return res.status(400).json({ error: "Missing required data." });
    }

    // Call our database function to perform the bulk update
    const { error } = await supabase.rpc("update_task_positions", {
      p_lists: lists,
    });

    if (error) throw error;

    // After a successful update, emit an event to other clients
    // Note: We'll need to pass `io` to this file for this to work (see next file)
    const io = req.app.get("socketio");
    io.to(workspaceSlug).emit("board_updated");

    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error updating positions:", error);
    res.status(500).json({ error: error.message });
  }
});

// POST to create a new task in a list
router.post("/lists/:listId/tasks", async (req, res) => {
  try {
    const { listId } = req.params;
    const { content, workspaceSlug } = req.body;
    if (!content || !workspaceSlug) {
      return res
        .status(400)
        .json({ error: "Content and workspace slug are required." });
    }

    // 1. Get the current number of tasks in the list to determine the new position
    const { count, error: countError } = await supabase
      .from("tasks")
      .select("*", { count: "exact", head: true })
      .eq("list_id", listId);

    if (countError) throw countError;
    const newPosition = count || 0;

    // 2. Insert the new task
    const { data: newTask, error: insertError } = await supabase
      .from("tasks")
      .insert({
        list_id: listId,
        content: content,
        position: newPosition,
        created_by: req.user.id, // From our auth middleware
      })
      .select()
      .single();

    if (insertError) throw insertError;

    // 3. Emit a real-time event to other users
    const io = req.app.get("socketio");
    io.to(workspaceSlug).emit("board_updated");

    // 4. Return the newly created task
    res.status(201).json(newTask);
  } catch (error) {
    console.error("Error creating task:", error);
    res.status(500).json({ error: error.message });
  }
});

// POST to create a new list on a board
router.post("/boards/:boardId/lists", async (req, res) => {
  try {
    const { boardId } = req.params;
    const { title, workspaceSlug } = req.body;
    if (!title || !workspaceSlug) {
      return res
        .status(400)
        .json({ error: "Title and workspace slug are required." });
    }

    // 1. Get the current list count to determine the new position
    const { count, error: countError } = await supabase
      .from("lists")
      .select("*", { count: "exact", head: true })
      .eq("board_id", boardId);

    if (countError) throw countError;
    const newPosition = count || 0;

    // 2. Insert the new list
    const { data: newList, error: insertError } = await supabase
      .from("lists")
      .insert({
        board_id: boardId,
        title: title,
        position: newPosition,
      })
      .select()
      .single();

    if (insertError) throw insertError;

    // 3. Emit a real-time event to sync other clients
    const io = req.app.get("socketio");
    io.to(workspaceSlug).emit("board_updated");

    // 4. Return the new list (it will be empty of tasks initially)
    res.status(201).json({ ...newList, tasks: [] });
  } catch (error) {
    console.error("Error creating list:", error);
    res.status(500).json({ error: error.message });
  }
});

// PATCH to update a task's content
router.patch("/tasks/:taskId", async (req, res) => {
  try {
    const { taskId } = req.params;
    const { content, workspaceSlug } = req.body;
    if (!content || !workspaceSlug) {
      return res.status(400).json({ error: "Content and workspace slug are required." });
    }

    // 1. Update the task in the database
    const { data: updatedTask, error: updateError } = await supabase
      .from("tasks")
      .update({ content: content })
      .eq("id", taskId)
      .select()
      .single();

    if (updateError) throw updateError;
    
    // 2. Emit the real-time event to other clients
    const io = req.app.get('socketio');
    io.to(workspaceSlug).emit('board_updated');

    // 3. Return the updated task data
    res.status(200).json(updatedTask);
  } catch (error) {
    console.error("Error updating task:", error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE a task
router.delete("/tasks/:taskId", async (req, res) => {
  try {
    const { taskId } = req.params;
    const { workspaceSlug } = req.body; // Pass slug for real-time update
    if (!workspaceSlug) {
      return res.status(400).json({ error: "Workspace slug is required." });
    }

    // 1. Delete the task from the database
    const { error } = await supabase.from("tasks").delete().eq("id", taskId);
    if (error) throw error;

    // 2. Emit the real-time event to other clients
    const io = req.app.get('socketio');
    io.to(workspaceSlug).emit('board_updated');

    // 3. Respond with a success status
    res.status(204).send(); // 204 No Content is a standard success response for DELETE
  } catch (error) {
    console.error("Error deleting task:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
