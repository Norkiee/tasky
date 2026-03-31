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

const TASK_GENERATION_PROMPT = `You are analyzing Figma design frames to generate development tasks.

Context about the project:
{context}

Story being implemented:
Title: {storyTitle}
Description: {storyDescription}

For each frame, identify specific implementation tasks. Return JSON only, no markdown:

{
  "tasks": [{
    "title": "Brief task title",
    "description": "What needs to be implemented",
    "acceptance_criteria": "- Specific criteria\\n- Another criterion",
    "complexity": "S|M|L",
    "source_frame_id": "frame_id",
    "source_frame_name": "Frame Name"
  }]
}

Complexity guide:
- S: Simple styling, copy changes, minor tweaks (< 2 hours)
- M: Component implementation, moderate logic (2-8 hours)
- L: Complex features, multiple components, significant logic (> 8 hours)

Be specific about UI elements, interactions, and states shown in the designs.`;

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

export async function generateTasks(
  frames: FrameData[],
  context?: string,
  storyTitle?: string,
  storyDescription?: string
): Promise<TaskInput[]> {
  const prompt = TASK_GENERATION_PROMPT
    .replace('{context}', context || 'No additional context provided')
    .replace('{storyTitle}', storyTitle || 'Not specified')
    .replace('{storyDescription}', storyDescription || 'Not specified');

  const imageContent = frames.map((frame) => ({
    type: 'image' as const,
    source: {
      type: 'base64' as const,
      media_type: 'image/png' as const,
      data: frame.imageBase64,
    },
  }));

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    messages: [
      {
        role: 'user',
        content: [
          ...imageContent,
          {
            type: 'text',
            text: `${prompt}\n\nFrame IDs and names:\n${frames.map((f) => `- ${f.id}: ${f.name}`).join('\n')}`,
          },
        ],
      },
    ],
  });

  const text = response.content[0].type === 'text' ? response.content[0].text : '';
  const parsed = JSON.parse(stripMarkdownFences(text));
  return parsed.tasks;
}
