import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';

export async function GET(req: Request) {
  const reqUrl = new URL(req.url);
  const code = reqUrl.searchParams.get('code');
  const redirect = reqUrl.searchParams.get('redirect') || '/';

  if (code) {
    const supabase = createRouteHandlerClient({ cookies });
    // Échange le "code" contre une session persistée en cookies
    await supabase.auth.exchangeCodeForSession(code);
  }
  return NextResponse.redirect(new URL(redirect, reqUrl.origin));
}
