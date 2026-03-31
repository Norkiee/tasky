import React, { useState, useEffect } from 'react';
import { Button } from '../components/Button';
import { Select } from '../components/Select';
import {
  getProjects,
  getEpics,
  getFeatures,
  getStories,
  Project,
  Epic,
  Feature,
  Story,
  AuthError,
} from '../services/api';

interface HierarchySelection {
  project: Project;
  epic?: Epic;
  feature?: Feature;
  story: Story;
}

interface SelectProjectScreenProps {
  accessToken: string;
  savedProjectId?: string;
  savedEpicId?: string;
  savedFeatureId?: string;
  savedStoryId?: string;
  onContinue: (selection: HierarchySelection) => void;
  onSessionExpired: () => void;
  onBack: () => void;
}

export function SelectProjectScreen({
  accessToken,
  savedProjectId,
  savedEpicId,
  savedFeatureId,
  savedStoryId,
  onContinue,
  onSessionExpired,
  onBack,
}: SelectProjectScreenProps): React.ReactElement {
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectId, setProjectId] = useState(savedProjectId || '');
  const [epics, setEpics] = useState<Epic[]>([]);
  const [epicId, setEpicId] = useState(savedEpicId || '');
  const [features, setFeatures] = useState<Feature[]>([]);
  const [featureId, setFeatureId] = useState(savedFeatureId || '');
  const [stories, setStories] = useState<Story[]>([]);
  const [storyId, setStoryId] = useState(savedStoryId || '');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch projects on mount
  useEffect(() => {
    let cancelled = false;

    const loadProjects = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await getProjects(accessToken);
        if (cancelled) return;
        setProjects(data);
        if (savedProjectId && data.some(p => p.id === savedProjectId)) {
          setProjectId(savedProjectId);
        }
      } catch (err) {
        if (cancelled) return;
        if (err instanceof AuthError) {
          onSessionExpired();
        } else {
          setError(err instanceof Error ? err.message : 'Failed to load projects');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadProjects();
    return () => { cancelled = true; };
  }, [accessToken, savedProjectId, onSessionExpired]);

  // Fetch epics when project changes
  useEffect(() => {
    if (!projectId) {
      setEpics([]);
      setEpicId('');
      return;
    }

    let cancelled = false;

    const loadEpics = async () => {
      setLoading(true);
      setEpics([]);
      setEpicId('');
      setFeatures([]);
      setFeatureId('');
      setStories([]);
      setStoryId('');
      try {
        const data = await getEpics(accessToken, projectId);
        if (cancelled) return;
        setEpics(data);
        if (savedEpicId && data.some(e => e.id === savedEpicId)) {
          setEpicId(savedEpicId);
        }
      } catch (err) {
        if (cancelled) return;
        if (err instanceof AuthError) {
          onSessionExpired();
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadEpics();
    return () => { cancelled = true; };
  }, [accessToken, projectId, savedEpicId, onSessionExpired]);

  // Fetch features when epic changes
  useEffect(() => {
    if (!epicId) {
      setFeatures([]);
      setFeatureId('');
      return;
    }

    let cancelled = false;

    const loadFeatures = async () => {
      setLoading(true);
      setFeatures([]);
      setFeatureId('');
      setStories([]);
      setStoryId('');
      try {
        const data = await getFeatures(accessToken, epicId);
        if (cancelled) return;
        setFeatures(data);
        if (savedFeatureId && data.some(f => f.id === savedFeatureId)) {
          setFeatureId(savedFeatureId);
        }
      } catch (err) {
        if (cancelled) return;
        if (err instanceof AuthError) {
          onSessionExpired();
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadFeatures();
    return () => { cancelled = true; };
  }, [accessToken, epicId, savedFeatureId, onSessionExpired]);

  // Fetch stories when feature changes
  useEffect(() => {
    if (!featureId) {
      setStories([]);
      setStoryId('');
      return;
    }

    let cancelled = false;

    const loadStories = async () => {
      setLoading(true);
      setStories([]);
      setStoryId('');
      try {
        const data = await getStories(accessToken, featureId);
        if (cancelled) return;
        setStories(data);
        if (savedStoryId && data.some(s => s.id === savedStoryId)) {
          setStoryId(savedStoryId);
        }
      } catch (err) {
        if (cancelled) return;
        if (err instanceof AuthError) {
          onSessionExpired();
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadStories();
    return () => { cancelled = true; };
  }, [accessToken, featureId, savedStoryId, onSessionExpired]);

  const selectedProject = projects.find(p => p.id === projectId);
  const selectedEpic = epics.find(e => e.id === epicId);
  const selectedFeature = features.find(f => f.id === featureId);
  const selectedStory = stories.find(s => s.id === storyId);

  const canContinue = !!(selectedProject && selectedStory);

  const handleContinue = () => {
    if (!canContinue || !selectedProject || !selectedStory) return;

    onContinue({
      project: selectedProject,
      epic: selectedEpic,
      feature: selectedFeature,
      story: selectedStory,
    });
  };

  return (
    <div className="screen">
      <div className="screen-header">
        <h2>Select Story</h2>
        <p>Choose which user story to generate tasks for</p>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="select-group">
        <Select
          label="Project"
          value={projectId}
          onChange={(val) => setProjectId(val)}
          placeholder={loading && projects.length === 0 ? 'Loading...' : 'Select a project'}
          options={projects.map((p) => ({ value: p.id, label: p.name }))}
        />

        {projectId && (
          <Select
            label="Epic"
            value={epicId}
            onChange={(val) => setEpicId(val)}
            placeholder={loading ? 'Loading...' : epics.length === 0 ? 'No epics' : 'Select an epic'}
            options={epics.map((e) => ({ value: e.id, label: e.title }))}
          />
        )}

        {epicId && (
          <Select
            label="Feature"
            value={featureId}
            onChange={(val) => setFeatureId(val)}
            placeholder={loading ? 'Loading...' : features.length === 0 ? 'No features' : 'Select a feature'}
            options={features.map((f) => ({ value: f.id, label: f.title }))}
          />
        )}

        {featureId && (
          <Select
            label="User Story"
            value={storyId}
            onChange={(val) => setStoryId(val)}
            placeholder={loading ? 'Loading...' : stories.length === 0 ? 'No stories' : 'Select a story'}
            options={stories.map((s) => ({ value: s.id, label: s.title }))}
          />
        )}
      </div>

      <div className="screen-footer">
        <Button onClick={handleContinue} disabled={!canContinue} fullWidth>
          Continue
        </Button>
        <Button onClick={onBack} variant="text" fullWidth>
          Back
        </Button>
      </div>
    </div>
  );
}
