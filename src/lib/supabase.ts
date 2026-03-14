// Proxy client that calls the backend instead of using the Supabase SDK directly
// This keeps sensitive keys on the server.
export const supabase = {
  auth: {
    signInWithPassword: async ({ email, password }: any) => {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const json = await res.json();
      if (!res.ok || json.error) return { data: { user: null, session: null }, error: { message: json.error || 'Login failed' } };
      
      if (json.user) {
        localStorage.setItem('supabase.auth.token', JSON.stringify(json));
      }
      // Trigger auth state change manually since we're mocking
      window.dispatchEvent(new CustomEvent('supabase.auth.change', { detail: json }));
      
      return { data: json, error: null };
    },
    signUp: async ({ email, password, options }: any) => {
      const fullName = options?.data?.full_name || options?.data?.fullName || 'مستخدم';
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, fullName }),
      });
      const json = await res.json();
      if (!res.ok || json.error) return { data: { user: null, session: null }, error: { message: json.error || 'Registration failed' } };
      
      if (json.user) {
        localStorage.setItem('supabase.auth.token', JSON.stringify(json));
      }
      window.dispatchEvent(new CustomEvent('supabase.auth.change', { detail: json }));
      
      return { data: json, error: null };
    },
    signOut: async () => {
      localStorage.removeItem('supabase.auth.token');
      window.dispatchEvent(new CustomEvent('supabase.auth.change', { detail: null }));
    },
    getSession: async () => {
      const stored = localStorage.getItem('supabase.auth.token');
      if (stored) {
        try {
          return { data: { session: JSON.parse(stored) } };
        } catch (e) {
          return { data: { session: null } };
        }
      }
      return { data: { session: null } };
    },
    onAuthStateChange: (callback: any) => {
      const handler = (e: any) => {
        callback('SIGNED_IN', e.detail);
      };
      window.addEventListener('supabase.auth.change', handler);
      return { data: { subscription: { unsubscribe: () => window.removeEventListener('supabase.auth.change', handler) } } };
    },
    refreshSession: async () => {
      return { data: { session: null }, error: null };
    },
    resend: async () => {
      return { error: null };
    }
  }
} as any;
