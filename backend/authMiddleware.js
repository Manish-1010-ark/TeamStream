// backend/authMiddleware.js
import { supabase } from './supabaseClient.js';

export const requireAuth = async (req, res, next) => {
  const { authorization } = req.headers;

  if (!authorization) {
    return res.status(401).json({ error: 'Authorization token required' });
  }

  const token = authorization.split(' ')[1];

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) {
      throw new Error('Invalid token');
    }
    req.user = user; // Attach user to the request
    next();
  } catch (error) {
    res.status(401).json({ error: 'Request is not authorized' });
  }
};