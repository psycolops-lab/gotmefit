// // // /lib/supabaseServer.ts
// // import { createServerClient, type CookieOptions } from '@supabase/ssr';
// // import { cookies } from 'next/headers';

// // export function createClient() {
// //   // `cookies()` gives you the cookie store; you don’t need to import any type.
// //   const cookieStore = cookies();

// //   return createServerClient(
// //     process.env.NEXT_PUBLIC_SUPABASE_URL!,
// //     process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
// //     {
// //       cookies: {
// //         get: (name: string) => (cookieStore.get(name) as { value?: string } | undefined)?.value,
// //         set: (name: string, value: string, options: CookieOptions) => {
// //           try {
// //             // Guard against environments that don't allow cookie mutation (like RSCs)
// //             (cookieStore as any).set?.({ name, value, ...options });
// //           } catch (error) {
// //             console.error('Error setting cookie:', error);
// //           }
// //         },
// //         remove: (name: string, options: CookieOptions) => {
// //           try {
// //             (cookieStore as any).set?.({ name, value: '', ...options });
// //           } catch (error) {
// //             console.error('Error removing cookie:', error);
// //           }
// //         },
// //       },
// //     }
// //   );
// // }
// /lib/supabaseServer.ts
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { CookieOptions } from '@supabase/ssr';

export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll().map(cookie => ({
            name: cookie.name,
            value: cookie.value,
          }));
        },
        setAll(cookiesToSet: { name: string; value: string; options?: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set({ name, value, ...options });
          });
        },
      },
    }
  );
}

// get: (name: string) => (cookieStore.get(name) as { value?: string } | undefined)?.value,