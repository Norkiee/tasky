import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const { user, error: authError, supabase } = await getAuthenticatedUser(request);
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const featureId = request.nextUrl.searchParams.get('featureId');
  if (!featureId) {
    return NextResponse.json({ error: 'featureId is required' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('stories')
    .select('*')
    .eq('feature_id', featureId)
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
  const { feature_id, title, description, acceptance_criteria } = body;

  if (!feature_id || !title) {
    return NextResponse.json({ error: 'feature_id and title are required' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('stories')
    .insert({ feature_id, title, description, acceptance_criteria })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
