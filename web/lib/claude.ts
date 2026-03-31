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

const TASK_GENERATION_PROMPT = `You are a design lead analyzing Figma design frames to generate design tasks.

Context about the project:
{context}

Story being worked on:
Title: {storyTitle}
Description: {storyDescription}

For each frame, identify specific design tasks. Use design language — verbs like "create", "design", "refine", "update", "define", "explore", "iterate", "polish", "layout", "style". Never use development language like "implement", "build", "code", "develop", "deploy".

Return JSON only, no markdown:

{
  "tasks": [{
    "title": "Brief task title using design verbs",
    "description": "What needs to be designed or refined",
    "acceptance_criteria": "- Specific design criteria\\n- Another criterion",
    "complexity": "S|M|L",
    "source_frame_id": "frame_id",
    "source_frame_name": "Frame Name"
  }]
}

Complexity guide:
- S: Minor tweaks, copy changes, color adjustments (< 2 hours)
- M: New component design, layout exploration, multiple states (2-8 hours)
- L: Full screen design, complex interactions, design system updates (> 8 hours)

Focus on visual design, layout, typography, spacing, interactions, states, and user experience.`;

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

export async function generateTasksForFrame(
  frame: FrameData,
  context?: string,
  storyTitle?: string,
  storyDescription?: string
): Promise<TaskInput[]> {
  const prompt = TASK_GENERATION_PROMPT
    .replace('{context}', context || 'No additional context provided')
    .replace('{storyTitle}', storyTitle || 'Not specified')
    .replace('{storyDescription}', storyDescription || 'Not specified');

  // Build a text description of the frame
  const frameDescription = [
    `Frame: "${frame.name}" (${frame.width || 0}x${frame.height || 0})`,
    frame.textContent?.length ? `Text content: ${frame.textContent.join(', ')}` : null,
    frame.componentNames?.length ? `Components: ${frame.componentNames.join(', ')}` : null,
    frame.nestedFrameNames?.length ? `Child frames: ${frame.nestedFrameNames.join(', ')}` : null,
  ].filter(Boolean).join('\n');

  const response = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 2048,
    messages: [
      {
        role: 'user',
        content: `${prompt}\n\n${frameDescription}`,
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
