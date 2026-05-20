import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

/**
 * Root page: redirects authenticated users to dashboard, others to login.
 */
export default async function RootPage(): Promise<never> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    redirect('/dashboard');
  }

  redirect('/login');
}
