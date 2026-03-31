import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { code, access_token, refresh_token, expires_at, email } = body;

  if (!code || !access_token || !refresh_token) {
    return NextResponse.json(
      { error: 'Missing required fields' },
      { status: 400 }
    );
  }

  const supabase = createServiceClient();

  const { error } = await supabase
    .from('plugin_auth_codes')
    .upsert({
      code,
      access_token,
      refresh_token,
      expires_at,
      email,
    });

  if (error) {
    return NextResponse.json(
      { error: 'Failed to store auth code' },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
