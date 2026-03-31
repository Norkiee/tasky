import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/supabase/server';
import { generateTasks } from '@/lib/claude';
import { GenerateTasksRequest } from '@/lib/types';

export async function POST(request: NextRequest) {
  const { user, error: authError } = await getAuthenticatedUser(request);
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body: GenerateTasksRequest = await request.json();
  const { frames, context, storyTitle, storyDescription } = body;

  if (!frames || !Array.isArray(frames) || frames.length === 0) {
    return NextResponse.json({ error: 'frames array is required' }, { status: 400 });
  }

  try {
    const tasks = await generateTasks(frames, context, storyTitle, storyDescription);
    return NextResponse.json({ tasks });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Task generation failed' },
      { status: 500 }
    );
  }
}
