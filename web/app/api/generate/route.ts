import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/supabase/server';
import { generateTasksForFrame } from '@/lib/claude';
import { TaskInput } from '@/lib/types';

export async function POST(request: NextRequest) {
  const { user, error: authError } = await getAuthenticatedUser(request);
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { frame, context, storyTitle, storyDescription } = body;

  if (!frame || !frame.id || !frame.name) {
    return NextResponse.json({ error: 'frame object with id and name is required' }, { status: 400 });
  }

  try {
    const tasks: TaskInput[] = await generateTasksForFrame(frame, context, storyTitle, storyDescription);
    return NextResponse.json({ tasks });
  } catch (error) {
    console.error('Generate error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Task generation failed' },
      { status: 500 }
    );
  }
}
