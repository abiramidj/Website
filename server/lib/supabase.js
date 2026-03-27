import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables');
}

export const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

/**
 * Verify a JWT token and return the user.
 * Throws if the token is invalid or missing.
 */
export async function verifyToken(token) {
  if (!token) throw Object.assign(new Error('No authorization token provided'), { status: 401 });

  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data?.user) {
    throw Object.assign(new Error('Invalid or expired token'), { status: 401 });
  }
  return data.user;
}

/**
 * Get the role of a user from the profiles table.
 * Returns 'student' by default.
 */
export async function getUserRole(userId) {
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('role')
    .eq('user_id', userId)
    .single();

  if (error || !data) return 'student';
  return data.role;
}
