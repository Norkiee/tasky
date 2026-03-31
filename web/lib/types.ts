export interface Project {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  context: string | null;
  created_at: string;
  updated_at: string;
}

export interface Document {
  id: string;
  project_id: string;
  name: string;
  type: 'pdf' | 'docx' | 'txt' | 'md' | 'transcript';
  content: string | null;
  file_path: string | null;
  status: 'pending' | 'processing' | 'extracted' | 'failed';
  created_at: string;
}

export interface Extraction {
  id: string;
  document_id: string;
  type: 'epic' | 'feature' | 'story';
  title: string;
  description: string | null;
  acceptance_criteria: string | null;
  confidence: number | null;
  status: 'pending' | 'approved' | 'rejected';
  parent_extraction_id: string | null;
  created_at: string;
}

export interface Epic {
  id: string;
  project_id: string;
  title: string;
  description: string | null;
  azure_id: string | null;
  created_at: string;
}

export interface Feature {
  id: string;
  epic_id: string;
  title: string;
  description: string | null;
  azure_id: string | null;
  created_at: string;
}

export interface Story {
  id: string;
  feature_id: string;
  title: string;
  description: string | null;
  acceptance_criteria: string | null;
  azure_id: string | null;
  created_at: string;
}

export interface Task {
  id: string;
  story_id: string;
  title: string;
  description: string | null;
  acceptance_criteria: string | null;
  complexity: 'S' | 'M' | 'L' | null;
  source_frame_id: string | null;
  source_frame_name: string | null;
  copied_at: string | null;
  created_at: string;
}

export interface TaskInput {
  title: string;
  description?: string;
  acceptance_criteria?: string;
  complexity?: 'S' | 'M' | 'L';
  source_frame_id?: string;
  source_frame_name?: string;
}

export interface FrameData {
  id: string;
  name: string;
  imageBase64?: string;
  textContent?: string[];
  componentNames?: string[];
  nestedFrameNames?: string[];
  width?: number;
  height?: number;
}

export interface GenerateTasksRequest {
  frames: FrameData[];
  context?: string;
  storyTitle?: string;
  storyDescription?: string;
}

export interface ExtractedWorkItems {
  epics: {
    title: string;
    description: string;
    features: {
      title: string;
      description: string;
      stories: {
        title: string;
        description: string;
        acceptance_criteria: string;
      }[];
    }[];
  }[];
}
