import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const { user, error: authError, supabase } = await getAuthenticatedUser(request);
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const storyId = request.nextUrl.searchParams.get('storyId');
  if (!storyId) {
    return NextResponse.json({ error: 'storyId is required' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('story_id', storyId)
    .order('created_at', { ascending: true });

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
  const { story_id, tasks } = body;

  if (!story_id || !tasks || !Array.isArray(tasks)) {
    return NextResponse.json({ error: 'story_id and tasks array are required' }, { status: 400 });
  }

  const tasksToInsert = tasks.map((task: {
    title: string;
    description?: string;
    acceptance_criteria?: string;
    complexity?: string;
    source_frame_id?: string;
    source_frame_name?: string;
  }) => ({
    story_id,
    title: task.title,
    description: task.description,
    acceptance_criteria: task.acceptance_criteria,
    complexity: task.complexity,
    source_frame_id: task.source_frame_id,
    source_frame_name: task.source_frame_name,
  }));

  const { data, error } = await supabase
    .from('tasks')
    .insert(tasksToInsert)
    .select();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
