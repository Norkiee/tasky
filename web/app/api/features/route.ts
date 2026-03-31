import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const { user, error: authError, supabase } = await getAuthenticatedUser(request);
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const epicId = request.nextUrl.searchParams.get('epicId');
  if (!epicId) {
    return NextResponse.json({ error: 'epicId is required' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('features')
    .select('*')
    .eq('epic_id', epicId)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const { user, error: authError, supabase } = await getAuthenticatedUser(request);
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { epic_id, title, description } = body;

  if (!epic_id || !title) {
    return NextResponse.json({ error: 'epic_id and title are required' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('features')
    .insert({ epic_id, title, description })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
