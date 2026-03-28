import { createContext, useContext, useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const API_BASE = (import.meta.env.VITE_API_URL || '') + '/api';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: window.sessionStorage,
    persistSession: true,
  },
});

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // ── Fetch profile via server (service role key — bypasses RLS) ────
  async function fetchProfile(_userId) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return null;

      const res = await fetch(`${API_BASE}/auth/profile`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (!res.ok) return null;

      const data = await res.json();
      if (data) setProfile(data);
      return data ?? null;
    } catch (err) {
      console.error('[fetchProfile]', err.message);
      return null;
    }
  }

  // ── Initial session load + listener for external changes ───────────
  useEffect(() => {
    // 1. Read the current session from localStorage (fast, no network)
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    // 2. React to external auth events only:
    //    - SIGNED_OUT  : another tab signed out, or token revoked
    //    - TOKEN_REFRESHED : keep user object up to date
    //    SIGNED_IN is handled directly by signIn() below
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_OUT') {
          setUser(null);
          setProfile(null);
        } else if (event === 'TOKEN_REFRESHED' && session?.user) {
          setUser(session.user);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // ── Sign up ────────────────────────────────────────────────────────
  async function signUp(email, password, fullName, extra = {}) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name:     fullName,
          designation:   extra.designation   || '',
          institution:   extra.institution   || '',
          specialty:     extra.specialty     || '',
          date_of_birth: extra.dateOfBirth   || '',
        },
      },
    });
    if (error) throw error;
    return data;
  }

  // ── Sign in ────────────────────────────────────────────────────────
  // Sets user + profile directly so caller can navigate immediately.
  // Returns { user, session, profile } — no React state timing dependency.
  async function signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;

    let profileData = null;
    if (data.user) {
      setUser(data.user);
      // session is now stored by supabase client; fetchProfile reads it directly
      profileData = await fetchProfile(data.user.id);
    }
    return { ...data, profile: profileData };
  }

  // ── Sign out ───────────────────────────────────────────────────────
  // scope:'local' = clears localStorage only, no network round-trip.
  // State is cleared immediately; onAuthStateChange(SIGNED_OUT) fires
  // synchronously within the await and is handled above (no-op since
  // state is already null).
  async function signOut() {
    setUser(null);
    setProfile(null);
    await supabase.auth.signOut({ scope: 'local' });
  }

  // ── Helpers ────────────────────────────────────────────────────────
  async function getToken() {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token ?? null;
  }

  async function refreshProfile() {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) await fetchProfile(session.user.id);
  }

  const isAdmin      = profile?.role === 'admin';
  const isSubscribed = isAdmin || ['active', 'trialing'].includes(profile?.subscription_status);

  return (
    <AuthContext.Provider value={{
      user, profile, loading, isAdmin, isSubscribed,
      signUp, signIn, signOut, getToken, refreshProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
