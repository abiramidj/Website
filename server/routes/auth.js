import { Router } from 'express';
import { verifyToken, supabaseAdmin } from '../lib/supabase.js';

const router = Router();

// GET /api/auth/profile — returns the calling user's profile using service role key (bypasses RLS)
router.get('/profile', async (req, res) => {
  try {
    const token = (req.headers.authorization || '').replace('Bearer ', '');
    const user  = await verifyToken(token);

    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error) {
      // Profile row missing — return a default student profile shape
      return res.json({ user_id: user.id, full_name: '', role: 'student' });
    }

    res.json(data);
  } catch (err) {
    res.status(err.status || 401).json({ error: err.message });
  }
});

export default router;
