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

// Generate tasks from Figma frames
export interface GenerateRequest {
  frames: {
    id: string;
    name: string;
    imageBase64: string;
  }[];
  context?: string;
  storyTitle?: string;
  storyDescription?: string;
}

export async function generateTasks(
  token: string,
  payload: GenerateRequest
): Promise<{ tasks: TaskInput[] }> {
  return request('/api/generate', {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
}

// Legacy support - convert to new format
export async function generateWorkItems(
  token: string,
  frames: FrameData[],
  context?: string,
  storyTitle?: string,
  storyDescription?: string
): Promise<{ frameWorkItems: FrameWorkItems[] }> {
  const result = await request<{ tasks: TaskInput[] }>('/api/generate', {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({
      frames: frames.map(f => ({
        id: f.id,
        name: f.name,
        imageBase64: f.imageBase64,
      })),
      context,
      storyTitle,
      storyDescription,
    }),
  });

  // Group tasks by their source frame
  const frameMap = new Map<string, FrameWorkItems>();

  for (const frame of frames) {
    frameMap.set(frame.id, {
      frameId: frame.id,
      frameName: frame.name,
      sectionName: frame.sectionName,
      workItems: [],
    });
  }

  for (const task of result.tasks) {
    const frameId = task.source_frame_id || frames[0]?.id;
    const frameWorkItems = frameMap.get(frameId);
    if (frameWorkItems) {
      frameWorkItems.workItems.push({
        id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        title: task.title,
        description: task.description,
        selected: true,
      });
    }
  }

  return {
    frameWorkItems: Array.from(frameMap.values()),
  };
}
