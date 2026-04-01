import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const { user, error: authError, supabase } = await getAuthenticatedUser(request);
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const featureId = request.nextUrl.searchParams.get('featureId');
  const epicId = request.nextUrl.searchParams.get('epicId');

  if (!featureId && !epicId) {
    return NextResponse.json({ error: 'featureId or epicId is required' }, { status: 400 });
  }

  const query = supabase
    .from('stories')
    .select('*')
    .order('created_at', { ascending: false });

  const { data, error } = featureId
    ? await query.eq('feature_id', featureId)
    : await query.eq('epic_id', epicId!);

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
  const { feature_id, epic_id, title, description, acceptance_criteria } = body;

  if (!title || (!feature_id && !epic_id)) {
    return NextResponse.json({ error: 'title and either feature_id or epic_id are required' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('stories')
    .insert({ feature_id: feature_id ?? null, epic_id: epic_id ?? null, title, description, acceptance_criteria })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const { user, error: authError, supabase } = await getAuthenticatedUser(request);
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const id = request.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });

  const body = await request.json();
  const { title, description, acceptance_criteria } = body;

  const { data, error } = await supabase
    .from('stories')
    .update({ title, description, acceptance_criteria })
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(request: NextRequest) {
  const { user, error: authError, supabase } = await getAuthenticatedUser(request);
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const id = request.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });

  const { error } = await supabase.from('stories').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
