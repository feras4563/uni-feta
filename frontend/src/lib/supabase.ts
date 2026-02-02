// DEPRECATED: This file is no longer used. The system now uses JWT authentication.
// If you see this error, some files are still importing from this file.
// Please update them to use the new JWT authentication system.

// Mock Supabase client to prevent initialization errors
// This allows gradual migration from Supabase to JWT auth
export const supabase = {
  from: (table: string) => ({
    select: () => Promise.reject(new Error('Supabase is deprecated. Use api-client.ts instead')),
    insert: () => Promise.reject(new Error('Supabase is deprecated. Use api-client.ts instead')),
    update: () => Promise.reject(new Error('Supabase is deprecated. Use api-client.ts instead')),
    delete: () => Promise.reject(new Error('Supabase is deprecated. Use api-client.ts instead')),
    upsert: () => Promise.reject(new Error('Supabase is deprecated. Use api-client.ts instead')),
  }),
  auth: {
    signUp: () => Promise.reject(new Error('Supabase auth is deprecated. Use JWT auth instead')),
    signIn: () => Promise.reject(new Error('Supabase auth is deprecated. Use JWT auth instead')),
    signOut: () => Promise.reject(new Error('Supabase auth is deprecated. Use JWT auth instead')),
    getSession: () => Promise.resolve({ data: { session: null }, error: null }),
    getUser: () => Promise.resolve({ data: { user: null }, error: null }),
    admin: {
      createUser: () => Promise.reject(new Error('Supabase auth is deprecated. Use JWT auth instead')),
    },
  },
  storage: {
    from: () => ({
      upload: () => Promise.reject(new Error('Supabase storage is deprecated')),
      download: () => Promise.reject(new Error('Supabase storage is deprecated')),
    }),
  },
};

console.warn('⚠️ Supabase client is deprecated. System is using JWT authentication.');
console.warn('Update your code to use lib/api-client.ts instead of lib/supabase.ts');
