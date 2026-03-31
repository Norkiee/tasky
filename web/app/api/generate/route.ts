import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/supabase/server';
import { generateTasksForFrame } from '@/lib/claude';
import { GenerateTasksRequest, TaskInput } from '@/lib/types';

export const maxDuration = 60;

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
    const allTasks: TaskInput[] = [];

    // Process frames one at a time to avoid timeout/size limits
    for (const frame of frames) {
      const tasks = await generateTasksForFrame(frame, context, storyTitle, storyDescription);
      allTasks.push(...tasks);
    }

    return NextResponse.json({ tasks: allTasks });
  } catch (error) {
    console.error('Generate error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Task generation failed' },
      { status: 500 }
    );
  }
}
