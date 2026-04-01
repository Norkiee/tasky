import Anthropic from '@anthropic-ai/sdk';
import { ExtractedWorkItems, FrameData, TaskInput } from './types';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const EXTRACTION_PROMPT = `Extract work items from this document. Return JSON only, no markdown:

{
  "epics": [{
    "title": "...",
    "description": "...",
    "features": [{
      "title": "...",
      "description": "...",
      "stories": [{
        "title": "As a [user], I can [action] so that [benefit]",
        "description": "...",
        "acceptance_criteria": "- Criterion 1\\n- Criterion 2"
      }]
    }]
  }]
}

Rules:
- Epic: Large initiative spanning multiple features
- Feature: Shippable capability that delivers value
- Story: User-facing outcome in "As a... I can... so that..." format
- Include clear acceptance criteria for stories
- Be specific and actionable`;

const TASK_GENERATION_PROMPT = `You are a design lead reviewing a Figma frame to generate focused design tasks.

{contextBlock}

{flowBlock}

Story:
Title: {storyTitle}
Description: {storyDescription}

Instructions:
- Use design language only — verbs like "design", "create", "refine", "update", "define", "explore", "iterate", "polish", "layout", "style". Never use "implement", "build", "code", "develop", "deploy".
- Generate only tasks that are genuinely necessary based on what you see and what the context tells you.
- Be specific. Reference actual elements visible in the frame (e.g. "Refine the empty state illustration in the activity feed", not "Design the screen").
- Aim for 2–5 tasks per frame. Do not pad with generic tasks.

Return JSON only, no markdown:

{
  "tasks": [{
    "title": "Brief task title using design verbs",
    "description": "What specifically needs to be designed or refined, and why",
    "acceptance_criteria": "- Measurable design criterion\\n- Another criterion",
    "complexity": "S|M|L",
    "source_frame_id": "frame_id",
    "source_frame_name": "Frame Name"
  }]
}

Complexity:
S = Minor tweak, copy or colour change (< 2 hrs)
M = New component, layout exploration, multiple states (2–8 hrs)
L = Full screen design, complex interaction, design system change (> 8 hrs)`;

export async function extractWorkItems(content: string): Promise<ExtractedWorkItems> {
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    messages: [
      {
        role: 'user',
        content: `${EXTRACTION_PROMPT}\n\nDocument content:\n${content}`,
      },
    ],
  });

  const text = response.content[0].type === 'text' ? response.content[0].text : '';
  return JSON.parse(stripMarkdownFences(text));
}

function stripMarkdownFences(text: string): string {
  return text.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/i, '').trim();
}

interface SectionContext {
  sectionName: string;
  frameNames: string[];
  frameIndex: number;
  totalFrames: number;
}

export async function generateTasksForFrame(
  frame: FrameData,
  context?: string,
  storyTitle?: string,
  storyDescription?: string,
  sectionContext?: SectionContext
): Promise<TaskInput[]> {
  // Build context block — given priority if provided
  const contextBlock = context
    ? `⚡ Designer context (treat this as the primary directive):
"${context}"

If this context describes a specific change, update, or addition to an existing design, generate tasks ONLY for that specific change — do not generate tasks for the entire screen. The context overrides what you see in the frame if they differ in scope.`
    : `No designer context provided — generate tasks based on what you observe in the frame.`;

  // Build flow block — only when frame belongs to a named section
  const flowBlock = sectionContext
    ? `User flow context:
This frame is part of the "${sectionContext.sectionName}" flow (screen ${sectionContext.frameIndex + 1} of ${sectionContext.totalFrames}).
Flow sequence: ${sectionContext.frameNames.map((n, i) => i === sectionContext.frameIndex ? `[${n}]` : n).join(' → ')}

Read this as a connected experience. Consider how this screen fits into the journey — what the user is coming from and going to — and let that inform the tasks. The bracketed frame name is the one you are analysing.`
    : '';

  const prompt = TASK_GENERATION_PROMPT
    .replace('{contextBlock}', contextBlock)
    .replace('{flowBlock}', flowBlock)
    .replace('{storyTitle}', storyTitle || 'Not specified')
    .replace('{storyDescription}', storyDescription || 'Not specified');

  // Build supplementary text context
  const frameDescription = [
    `Frame: "${frame.name}" (${frame.width || 0}x${frame.height || 0})`,
    frame.textContent?.length ? `Text content: ${frame.textContent.join(', ')}` : null,
    frame.componentNames?.length ? `Components: ${frame.componentNames.join(', ')}` : null,
    frame.nestedFrameNames?.length ? `Child frames: ${frame.nestedFrameNames.join(', ')}` : null,
  ].filter(Boolean).join('\n');

  // Build message content — use image if available
  const content: Array<
    | { type: 'image'; source: { type: 'base64'; media_type: 'image/png'; data: string } }
    | { type: 'text'; text: string }
  > = [];

  if (frame.imageBase64) {
    content.push({
      type: 'image',
      source: {
        type: 'base64',
        media_type: 'image/png',
        data: frame.imageBase64,
      },
    });
  }

  content.push({
    type: 'text',
    text: `${prompt}\n\n${frameDescription}`,
  });

  const response = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 2048,
    messages: [
      {
        role: 'user',
        content,
      },
    ],
  });

  const text = response.content[0].type === 'text' ? response.content[0].text : '';
  const parsed = JSON.parse(stripMarkdownFences(text));

  return (parsed.tasks || []).map((task: TaskInput) => ({
    ...task,
    source_frame_id: frame.id,
    source_frame_name: frame.name,
  }));
}
