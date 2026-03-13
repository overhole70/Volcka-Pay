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
      return await res.json();
    },
    signUp: async ({ email, password, options }: any) => {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, fullName: options?.data?.fullName }),
      });
      return await res.json();
    },
    signOut: async () => {
      // In a real app, we would clear the session on the server too
      localStorage.removeItem('supabase.auth.token');
    },
    getSession: async () => {
      // Mock session for now
      return { data: { session: null } };
    },
    onAuthStateChange: (callback: any) => {
      // Mock subscription
      return { data: { subscription: { unsubscribe: () => {} } } };
    },
    refreshSession: async () => {
      return { data: { session: null }, error: null };
    },
    resend: async () => {
      return { error: null };
    }
  }
} as any;
