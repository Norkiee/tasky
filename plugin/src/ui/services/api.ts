import { FrameData, FrameWorkItems } from '../types';

declare const VITE_API_URL: string | undefined;
const API_URL = (typeof VITE_API_URL !== 'undefined' ? VITE_API_URL : null) || 'http://localhost:3000';

export class AuthError extends Error {
  constructor(message: string = 'Session expired') {
    super(message);
    this.name = 'AuthError';
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  const contentType = response.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');

  if (!response.ok) {
    if (response.status === 401) {
      throw new AuthError('Session expired. Please log in again.');
    }
    if (isJson) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }
    throw new Error(`HTTP ${response.status}: Request failed`);
  }

  if (!isJson) {
    throw new Error('Invalid response from server');
  }

  return response.json();
}

function authHeaders(token: string): Record<string, string> {
  return { Authorization: `Bearer ${token}` };
}

// Auth
export function getPluginLoginUrl(code: string): string {
  return `${API_URL}/auth/plugin?code=${encodeURIComponent(code)}`;
}

export async function pollPluginAuth(
  code: string
): Promise<{ status: 'pending' } | { status: 'complete'; session: Session; email: string }> {
  return request(`/api/auth/plugin/poll?code=${encodeURIComponent(code)}`);
}

export interface Session {
  access_token: string;
  refresh_token: string;
  expires_at: number;
}

// Projects
export interface Project {
  id: string;
  name: string;
  description: string | null;
  context: string | null;
}

export async function getProjects(token: string): Promise<Project[]> {
  return request('/api/projects', {
    headers: authHeaders(token),
  });
}

// Epics
export interface Epic {
  id: string;
  project_id: string;
  title: string;
  description: string | null;
}

export async function getEpics(token: string, projectId: string): Promise<Epic[]> {
  return request(`/api/epics?projectId=${encodeURIComponent(projectId)}`, {
    headers: authHeaders(token),
  });
}

// Features
export interface Feature {
  id: string;
  epic_id: string;
  title: string;
  description: string | null;
}

export async function getFeatures(token: string, epicId: string): Promise<Feature[]> {
  return request(`/api/features?epicId=${encodeURIComponent(epicId)}`, {
    headers: authHeaders(token),
  });
}

// Stories
export interface Story {
  id: string;
  feature_id: string;
  title: string;
  description: string | null;
  acceptance_criteria: string | null;
}

export async function getStories(token: string, featureId: string): Promise<Story[]> {
  return request(`/api/stories?featureId=${encodeURIComponent(featureId)}`, {
    headers: authHeaders(token),
  });
}

// Tasks
export interface TaskInput {
  title: string;
  description?: string;
  acceptance_criteria?: string;
  complexity?: 'S' | 'M' | 'L';
  source_frame_id?: string;
  source_frame_name?: string;
}

export interface Task {
  id: string;
  story_id: string;
  title: string;
  description: string | null;
  acceptance_criteria: string | null;
  complexity: 'S' | 'M' | 'L' | null;
}

export async function saveTasks(
  token: string,
  storyId: string,
  tasks: TaskInput[]
): Promise<Task[]> {
  return request('/api/tasks', {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ story_id: storyId, tasks }),
  });
}

// Generate tasks for a single frame
async function generateTasksForFrame(
  token: string,
  frame: FrameData,
  context?: string,
  storyTitle?: string,
  storyDescription?: string
): Promise<TaskInput[]> {
  const result = await request<{ tasks: TaskInput[] }>('/api/generate', {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({
      frame: {
        id: frame.id,
        name: frame.name,
        imageBase64: frame.imageBase64,
        textContent: frame.textContent,
        componentNames: frame.componentNames,
        nestedFrameNames: frame.nestedFrameNames,
        width: frame.width,
        height: frame.height,
      },
      context,
      storyTitle,
      storyDescription,
    }),
  });
  return result.tasks;
}

// Generate work items for all frames, one at a time, with progress callback
export async function generateWorkItems(
  token: string,
  frames: FrameData[],
  context?: string,
  storyTitle?: string,
  storyDescription?: string,
  onFrameComplete?: (frameId: string) => void
): Promise<{ frameWorkItems: FrameWorkItems[] }> {
  const frameWorkItemsList: FrameWorkItems[] = [];

  for (const frame of frames) {
    const tasks = await generateTasksForFrame(token, frame, context, storyTitle, storyDescription);

    frameWorkItemsList.push({
      frameId: frame.id,
      frameName: frame.name,
      sectionName: frame.sectionName,
      workItems: tasks.map(task => ({
        id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        title: task.title,
        description: task.description,
        selected: true,
      })),
    });

    onFrameComplete?.(frame.id);
  }

  return { frameWorkItems: frameWorkItemsList };
}
