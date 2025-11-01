// backend/workspaceRoutes.js
import express from "express";
import slugify from "slugify";
import { supabase } from "./supabaseClient.js";
import { requireAuth } from "./authMiddleware.js";

const router = express.Router();
router.use(requireAuth);

// ============================================================================
// WORKSPACE ROUTES
// ============================================================================

// GET all workspaces for the current user
router.get("/", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("workspace_members")
      .select("workspaces(id, name, slug)")
      .eq("user_id", req.user.id);

    if (error) {
      console.error("Error fetching user workspaces:", error);
      return res.status(500).json({ error: error.message });
    }

    const workspaces = data ? data.map((item) => item.workspaces) : [];
    res.status(200).json(workspaces);
  } catch (error) {
    console.error("Unexpected error in GET /workspaces:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET a single workspace by SLUG (FIXED - Corrected join syntax)
router.get("/:slug", async (req, res) => {
  try {
    const { slug } = req.params;
    console.log(`🔍 [GET WORKSPACE] Fetching workspace with slug: ${slug}`);

    // First, get the workspace without the join
    const { data: workspace, error } = await supabase
      .from("workspaces")
      .select("id, name, slug, created_at, owner_id")
      .eq("slug", slug)
      .single();

    console.log(`📊 [GET WORKSPACE] Query result:`, { workspace, error });

    if (error || !workspace) {
      console.error(`❌ [GET WORKSPACE] Workspace not found: ${slug}`, error);
      return res.status(404).json({ error: "Workspace not found." });
    }

    // Verify user is a member of this workspace
    const { data: membership, error: memberError } = await supabase
      .from("workspace_members")
      .select("user_id")
      .eq("workspace_id", workspace.id)
      .eq("user_id", req.user.id)
      .single();

    if (memberError || !membership) {
      return res.status(403).json({
        error: "Access denied. You are not a member of this workspace.",
      });
    }

    // Now get the owner's profile separately
    const { data: ownerProfile, error: profileError } = await supabase
      .from("profiles")
      .select("username")
      .eq("id", workspace.owner_id)
      .single();

    if (profileError) {
      console.warn("Could not fetch owner profile:", profileError);
    }

    // Format the response to include owner information
    const response = {
      id: workspace.id,
      name: workspace.name,
      slug: workspace.slug,
      created_at: workspace.created_at,
      owner_id: workspace.owner_id,
      owner_name: ownerProfile?.username || "Unknown",
    };

    console.log(`✅ [GET WORKSPACE] Successfully fetched workspace:`, response);
    res.status(200).json(response);
  } catch (error) {
    console.error("Error fetching workspace:", error);
    res.status(500).json({ error: error.message });
  }
});

// POST to create a new workspace
router.post("/create", async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ error: "Workspace name is required." });
    }

    // Slug Generation Logic
    let slug = slugify(name, { lower: true, strict: true });
    let isUnique = false;
    let counter = 1;

    while (!isUnique) {
      const { data } = await supabase
        .from("workspaces")
        .select("slug")
        .eq("slug", slug);

      if (!data || data.length === 0) {
        isUnique = true;
      } else {
        slug = `${slugify(name, { lower: true, strict: true })}-${counter}`;
        counter++;
      }
    }

    const { data: workspace, error: wsError } = await supabase
      .from("workspaces")
      .insert({ name: name, owner_id: req.user.id, slug: slug })
      .select()
      .single();

    if (wsError) {
      console.error("Error creating workspace:", wsError);
      return res.status(500).json({ error: wsError.message });
    }

    const { error: memberError } = await supabase
      .from("workspace_members")
      .insert({ workspace_id: workspace.id, user_id: req.user.id });

    if (memberError) {
      console.error("Error adding creator to workspace:", memberError);
      return res.status(500).json({ error: memberError.message });
    }

    res.status(201).json(workspace);
  } catch (error) {
    console.error("Unexpected error creating workspace:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST to join an existing workspace
router.post("/join", async (req, res) => {
  try {
    const { workspace_id } = req.body;
    if (!workspace_id) {
      return res.status(400).json({ error: "Workspace ID is required." });
    }

    const { error } = await supabase
      .from("workspace_members")
      .insert({ workspace_id: workspace_id, user_id: req.user.id });

    if (error) {
      if (error.code === "23505") {
        return res.status(409).json({
          error: "You are already a member of this workspace.",
        });
      }
      if (error.code === "23503") {
        return res.status(404).json({ error: "Workspace not found." });
      }
      console.error("Error joining workspace:", error);
      return res.status(500).json({ error: error.message });
    }

    res.status(200).json({ message: "Successfully joined workspace." });
  } catch (error) {
    console.error("Unexpected error joining workspace:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE - Leave a workspace
router.delete("/:slug/leave", async (req, res) => {
  try {
    const { slug } = req.params;
    const userId = req.user.id;

    // 1. Fetch the workspace to get its ID and owner
    const { data: workspace, error: wsError } = await supabase
      .from("workspaces")
      .select("id, owner_id, name")
      .eq("slug", slug)
      .single();

    if (wsError || !workspace) {
      return res.status(404).json({ error: "Workspace not found." });
    }

    // 2. Check if the user is the owner
    if (workspace.owner_id === userId) {
      return res.status(403).json({
        error:
          "Owner cannot leave the workspace. Please delete it or transfer ownership.",
      });
    }

    // 3. Remove the user from workspace_members
    const { error: deleteError } = await supabase
      .from("workspace_members")
      .delete()
      .eq("workspace_id", workspace.id)
      .eq("user_id", userId);

    if (deleteError) {
      console.error("Error removing member:", deleteError);
      return res.status(500).json({ error: deleteError.message });
    }

    // 4. Emit Socket.IO event to notify other members
    const io = req.app.get("socketio");
    if (io) {
      io.to(slug).emit("member_left_workspace", {
        workspaceSlug: slug,
        userId: userId,
        workspaceName: workspace.name,
      });
    }

    console.log(`✅ User ${userId} left workspace ${slug}`);

    res.status(200).json({
      message: "Successfully left workspace.",
      workspaceId: workspace.id,
    });
  } catch (error) {
    console.error("Error leaving workspace:", error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// WORKSPACE MEMBERS ROUTES
// ============================================================================

// GET all members for a specific workspace (FIXED - Corrected join syntax)
router.get("/:slug/members", async (req, res) => {
  try {
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

    // Verify user is a member
    const { data: membership } = await supabase
      .from("workspace_members")
      .select("user_id")
      .eq("workspace_id", workspace.id)
      .eq("user_id", req.user.id)
      .single();

    if (!membership) {
      return res.status(403).json({ error: "Access denied" });
    }

    // Get all member user IDs first
    const { data: memberEntries, error: membersError } = await supabase
      .from("workspace_members")
      .select("user_id")
      .eq("workspace_id", workspace.id);

    if (membersError) {
      console.error("Error fetching member entries:", membersError);
      return res.status(500).json({ error: membersError.message });
    }

    if (!memberEntries || memberEntries.length === 0) {
      return res.status(200).json([]);
    }

    // Get profile information for all members
    const userIds = memberEntries.map((member) => member.user_id);
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, username")
      .in("id", userIds);

    if (profilesError) {
      console.error("Error fetching profiles:", profilesError);
      return res.status(500).json({ error: profilesError.message });
    }

    // Create a map for quick lookup
    const profileMap = new Map();
    profiles?.forEach((profile) => {
      profileMap.set(profile.id, profile);
    });

    // Format the response
    const formattedMembers = memberEntries.map((member) => {
      const profile = profileMap.get(member.user_id);
      return {
        id: member.user_id,
        username: profile?.username || "Unknown User",
      };
    });

    res.status(200).json(formattedMembers);
  } catch (error) {
    console.error("Error in members route:", error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// MESSAGE ROUTES
// ============================================================================

// GET all messages for a specific workspace
router.get("/:slug/messages", async (req, res) => {
  try {
    const { slug } = req.params;

    const { data: workspace, error: wsError } = await supabase
      .from("workspaces")
      .select("id")
      .eq("slug", slug)
      .single();

    if (wsError || !workspace) {
      return res.status(404).json({ error: "Workspace not found" });
    }

    const { data: messages, error: msgError } = await supabase
      .from("messages_with_profiles")
      .select("*")
      .eq("workspace_id", workspace.id)
      .order("created_at", { ascending: true });

    if (msgError) {
      console.error("Error fetching messages:", msgError);
      return res.status(500).json({ error: msgError.message });
    }

    res.status(200).json(messages || []);
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// BOARD ROUTES
// ============================================================================

router.get("/:slug/boards", async (req, res) => {
  try {
    const { slug } = req.params;
    const { data: workspace } = await supabase
      .from("workspaces")
      .select("id")
      .eq("slug", slug)
      .single();

    if (!workspace) {
      return res.status(404).json({ error: "Workspace not found" });
    }

    const { data: boards, error } = await supabase
      .from("boards")
      .select("*")
      .eq("workspace_id", workspace.id)
      .order("created_at");

    if (error) throw error;
    res.status(200).json(boards || []);
  } catch (error) {
    console.error("Error fetching boards:", error);
    res.status(500).json({ error: error.message });
  }
});

router.post("/:slug/boards", async (req, res) => {
  try {
    const { slug } = req.params;
    const { title } = req.body;
    const { data: workspace } = await supabase
      .from("workspaces")
      .select("id")
      .eq("slug", slug)
      .single();

    if (!workspace) {
      return res.status(404).json({ error: "Workspace not found" });
    }

    const { data: newBoard, error } = await supabase
      .from("boards")
      .insert({ title, workspace_id: workspace.id })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(newBoard);
  } catch (error) {
    console.error("Error creating board:", error);
    res.status(500).json({ error: error.message });
  }
});

router.get("/boards/:boardId", async (req, res) => {
  try {
    const { boardId } = req.params;
    const { data: board, error } = await supabase.rpc("get_full_board", {
      p_board_id: boardId,
    });

    if (error) throw error;
    if (!board) return res.status(404).json({ error: "Board not found" });
    res.status(200).json(board);
  } catch (error) {
    console.error("Error fetching board:", error);
    res.status(500).json({ error: error.message });
  }
});

router.delete("/boards/:boardId", async (req, res) => {
  try {
    const { boardId } = req.params;
    const { error } = await supabase.from("boards").delete().eq("id", boardId);
    if (error) throw error;
    res.status(204).send();
  } catch (error) {
    console.error("Error deleting board:", error);
    res.status(500).json({ error: error.message });
  }
});

router.patch("/board/positions", async (req, res) => {
  try {
    const { lists, workspaceSlug } = req.body;
    if (!lists || !workspaceSlug) {
      return res
        .status(400)
        .json({ error: "Lists and workspace slug are required." });
    }

    for (const list of lists) {
      const { id: listId, tasks: taskIds } = list;
      for (let position = 0; position < taskIds.length; position++) {
        const taskId = taskIds[position];
        const { error } = await supabase
          .from("tasks")
          .update({ list_id: listId, position: position })
          .eq("id", taskId);
        if (error) throw error;
      }
    }

    const io = req.app.get("socketio");
    io.to(workspaceSlug).emit("board_updated");

    res.status(200).json({ message: "Board positions updated successfully" });
  } catch (error) {
    console.error("Error updating board positions:", error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// LIST ROUTES
// ============================================================================

router.post("/boards/:boardId/lists", async (req, res) => {
  try {
    const { boardId } = req.params;
    const { title, workspaceSlug } = req.body;
    if (!title || !workspaceSlug) {
      return res
        .status(400)
        .json({ error: "Title and workspace slug are required." });
    }

    const { count, error: countError } = await supabase
      .from("lists")
      .select("*", { count: "exact", head: true })
      .eq("board_id", boardId);

    if (countError) throw countError;
    const newPosition = count || 0;

    const { data: newList, error: insertError } = await supabase
      .from("lists")
      .insert({ board_id: boardId, title: title, position: newPosition })
      .select()
      .single();

    if (insertError) throw insertError;

    const io = req.app.get("socketio");
    io.to(workspaceSlug).emit("board_updated");

    res.status(201).json({ ...newList, tasks: [] });
  } catch (error) {
    console.error("Error creating list:", error);
    res.status(500).json({ error: error.message });
  }
});

router.patch("/lists/:listId", async (req, res) => {
  try {
    const { listId } = req.params;
    const { title, workspaceSlug } = req.body;
    if (!title || !workspaceSlug) {
      return res
        .status(400)
        .json({ error: "Title and workspace slug are required." });
    }

    const { data: updatedList, error } = await supabase
      .from("lists")
      .update({ title: title })
      .eq("id", listId)
      .select()
      .single();

    if (error) throw error;

    const io = req.app.get("socketio");
    io.to(workspaceSlug).emit("board_updated");

    res.status(200).json(updatedList);
  } catch (error) {
    console.error("Error updating list:", error);
    res.status(500).json({ error: error.message });
  }
});

router.delete("/lists/:listId", async (req, res) => {
  try {
    const { listId } = req.params;
    const { workspaceSlug } = req.body;
    if (!workspaceSlug) {
      return res.status(400).json({ error: "Workspace slug is required." });
    }

    const { error } = await supabase.from("lists").delete().eq("id", listId);
    if (error) throw error;

    const io = req.app.get("socketio");
    io.to(workspaceSlug).emit("board_updated");

    res.status(204).send();
  } catch (error) {
    console.error("Error deleting list:", error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// TASK ROUTES
// ============================================================================

router.post("/lists/:listId/tasks", async (req, res) => {
  try {
    const { listId } = req.params;
    const { content, workspaceSlug } = req.body;
    if (!content || !workspaceSlug) {
      return res
        .status(400)
        .json({ error: "Content and workspace slug are required." });
    }

    const { count, error: countError } = await supabase
      .from("tasks")
      .select("*", { count: "exact", head: true })
      .eq("list_id", listId);

    if (countError) throw countError;
    const newPosition = count || 0;

    const { data: newTask, error: insertError } = await supabase
      .from("tasks")
      .insert({
        list_id: listId,
        content: content,
        position: newPosition,
        created_by: req.user.id,
      })
      .select()
      .single();

    if (insertError) throw insertError;

    const io = req.app.get("socketio");
    io.to(workspaceSlug).emit("board_updated");

    res.status(201).json(newTask);
  } catch (error) {
    console.error("Error creating task:", error);
    res.status(500).json({ error: error.message });
  }
});

router.patch("/tasks/:taskId", async (req, res) => {
  try {
    const { taskId } = req.params;
    const { content, workspaceSlug } = req.body;
    if (!content || !workspaceSlug) {
      return res
        .status(400)
        .json({ error: "Content and workspace slug are required." });
    }

    const { data: updatedTask, error: updateError } = await supabase
      .from("tasks")
      .update({ content: content })
      .eq("id", taskId)
      .select()
      .single();

    if (updateError) throw updateError;

    const io = req.app.get("socketio");
    io.to(workspaceSlug).emit("board_updated");

    res.status(200).json(updatedTask);
  } catch (error) {
    console.error("Error updating task:", error);
    res.status(500).json({ error: error.message });
  }
});

router.delete("/tasks/:taskId", async (req, res) => {
  try {
    const { taskId } = req.params;
    const { workspaceSlug } = req.body;
    if (!workspaceSlug) {
      return res.status(400).json({ error: "Workspace slug is required." });
    }

    const { error } = await supabase.from("tasks").delete().eq("id", taskId);
    if (error) throw error;

    const io = req.app.get("socketio");
    io.to(workspaceSlug).emit("board_updated");

    res.status(204).send();
  } catch (error) {
    console.error("Error deleting task:", error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// DOCUMENT ROUTES
// ============================================================================

router.get("/:slug/documents", async (req, res) => {
  try {
    const { slug } = req.params;
    const { data: workspace } = await supabase
      .from("workspaces")
      .select("id")
      .eq("slug", slug)
      .single();

    if (!workspace) {
      return res.status(404).json({ error: "Workspace not found" });
    }

    const { data: documents, error } = await supabase
      .from("documents")
      .select("id, title, last_modified")
      .eq("workspace_id", workspace.id)
      .order("last_modified", { ascending: false });

    if (error) throw error;
    res.status(200).json(documents || []);
  } catch (error) {
    console.error("Error fetching documents:", error);
    res.status(500).json({ error: error.message });
  }
});

router.post("/:slug/documents", async (req, res) => {
  try {
    const { slug } = req.params;
    const { title } = req.body;
    const { data: workspace } = await supabase
      .from("workspaces")
      .select("id")
      .eq("slug", slug)
      .single();

    if (!workspace) {
      return res.status(404).json({ error: "Workspace not found" });
    }

    const { data: newDocument, error } = await supabase
      .from("documents")
      .insert({ title, workspace_id: workspace.id })
      .select("id, title")
      .single();

    if (error) throw error;
    res.status(201).json(newDocument);
  } catch (error) {
    console.error("Error creating document:", error);
    res.status(500).json({ error: error.message });
  }
});

router.patch("/documents/:documentId", async (req, res) => {
  try {
    const { documentId } = req.params;
    const { title } = req.body;
    if (!title) {
      return res.status(400).json({ error: "Title is required." });
    }

    const { data: updatedDocument, error } = await supabase
      .from("documents")
      .update({ title: title, last_modified: new Date().toISOString() })
      .eq("id", documentId)
      .select("id, title")
      .single();

    if (error) throw error;
    res.status(200).json(updatedDocument);
  } catch (error) {
    console.error("Error updating document:", error);
    res.status(500).json({ error: error.message });
  }
});

router.delete("/documents/:documentId", async (req, res) => {
  try {
    const { documentId } = req.params;
    const { error } = await supabase
      .from("documents")
      .delete()
      .eq("id", documentId);

    if (error) throw error;
    res.status(204).send();
  } catch (error) {
    console.error("Error deleting document:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
