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

export default router;
