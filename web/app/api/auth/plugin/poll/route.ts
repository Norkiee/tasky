import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code');

  if (!code) {
    return NextResponse.json(
      { error: 'Code parameter is required' },
      { status: 400, headers: corsHeaders }
    );
  }

  const supabase = createServiceClient();

  // Fetch the auth code
  const { data, error } = await supabase
    .from('plugin_auth_codes')
    .select('*')
    .eq('code', code)
    .single();

  if (error || !data) {
    return NextResponse.json({ status: 'pending' }, { headers: corsHeaders });
  }

  // Delete the row (one-time use)
  await supabase
    .from('plugin_auth_codes')
    .delete()
    .eq('code', code);

  return NextResponse.json({
    status: 'complete',
    session: {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_at: data.expires_at,
    },
    email: data.email,
  }, { headers: corsHeaders });
}
