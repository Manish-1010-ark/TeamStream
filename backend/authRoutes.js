// backend/authRoutes.js

import express from 'express';
import { supabase } from './supabaseClient.js';

const router = express.Router();

// Signup Route
router.post('/signup', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }
  const { data, error } = await supabase.auth.signUp({ email, password });

  if (error) {
    return res.status(400).json({ error: error.message });
  }
  res.status(201).json({ user: data.user });
});

// Login Route
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return res.status(400).json({ error: error.message });
  }
  res.status(200).json({ session: data.session });
});

// NEW Forgot Password Route
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: 'http://localhost:5173/update-password', // The URL to your password update page
  });

  if (error) {
    return res.status(400).json({ error: error.message });
  }
  res.status(200).json({ message: 'Password reset email sent.' });
});

export default router;