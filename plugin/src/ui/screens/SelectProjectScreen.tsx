import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '../components/Button';
import { Select } from '../components/Select';
import {
  getProjects,
  getEpics,
  getFeatures,
  getStories,
  updateProject,
  deleteProject,
  updateEpic,
  deleteEpic,
  updateFeature,
  deleteFeature,
  updateStory,
  deleteStory,
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

  // ── Load projects ──────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await getProjects(accessToken);
        if (cancelled) return;
        setProjects(data);
        if (savedProjectId && data.some(p => p.id === savedProjectId)) setProjectId(savedProjectId);
      } catch (err) {
        if (cancelled) return;
        if (err instanceof AuthError) onSessionExpired();
        else setError(err instanceof Error ? err.message : 'Failed to load projects');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [accessToken, savedProjectId, onSessionExpired]);

  // ── Load epics when project changes ────────────────────────────────
  useEffect(() => {
    if (!projectId) { setEpics([]); setEpicId(''); return; }
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setEpics([]); setEpicId('');
      setFeatures([]); setFeatureId('');
      setStories([]); setStoryId('');
      try {
        const data = await getEpics(accessToken, projectId);
        if (cancelled) return;
        setEpics(data);
        if (savedEpicId && data.some(e => e.id === savedEpicId)) setEpicId(savedEpicId);
      } catch (err) {
        if (cancelled) return;
        if (err instanceof AuthError) onSessionExpired();
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [accessToken, projectId, savedEpicId, onSessionExpired]);

  // ── Load features + stories-under-epic when epic changes ───────────
  useEffect(() => {
    if (!epicId) { setFeatures([]); setFeatureId(''); setStories([]); setStoryId(''); return; }
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setFeatures([]); setFeatureId('');
      setStories([]); setStoryId('');
      try {
        const [featuresData, storiesData] = await Promise.all([
          getFeatures(accessToken, epicId),
          getStories(accessToken, { epicId }),
        ]);
        if (cancelled) return;
        setFeatures(featuresData);
        setStories(storiesData);
        if (savedFeatureId && featuresData.some(f => f.id === savedFeatureId)) setFeatureId(savedFeatureId);
        if (savedStoryId && storiesData.some(s => s.id === savedStoryId)) setStoryId(savedStoryId);
      } catch (err) {
        if (cancelled) return;
        if (err instanceof AuthError) onSessionExpired();
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [accessToken, epicId, savedFeatureId, savedStoryId, onSessionExpired]);

  // ── Load stories when feature changes ──────────────────────────────
  useEffect(() => {
    if (!featureId) {
      // Revert to stories under the epic directly
      if (!epicId) return;
      let cancelled = false;
      setStories([]); setStoryId('');
      const load = async () => {
        setLoading(true);
        try {
          const data = await getStories(accessToken, { epicId });
          if (cancelled) return;
          setStories(data);
        } catch (err) {
          if (cancelled) return;
          if (err instanceof AuthError) onSessionExpired();
        } finally {
          if (!cancelled) setLoading(false);
        }
      };
      load();
      return () => { cancelled = true; };
    }

    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setStories([]); setStoryId('');
      try {
        const data = await getStories(accessToken, { featureId });
        if (cancelled) return;
        setStories(data);
        if (savedStoryId && data.some(s => s.id === savedStoryId)) setStoryId(savedStoryId);
      } catch (err) {
        if (cancelled) return;
        if (err instanceof AuthError) onSessionExpired();
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [accessToken, featureId, epicId, savedStoryId, onSessionExpired]);

  // ── Edit / Delete handlers ─────────────────────────────────────────

  const handleEditProject = useCallback(async (id: string, name: string) => {
    await updateProject(accessToken, id, { name });
    setProjects(prev => prev.map(p => p.id === id ? { ...p, name } : p));
  }, [accessToken]);

  const handleDeleteProject = useCallback(async (id: string) => {
    await deleteProject(accessToken, id);
    setProjects(prev => prev.filter(p => p.id !== id));
    if (projectId === id) {
      setProjectId('');
      setEpics([]); setEpicId('');
      setFeatures([]); setFeatureId('');
      setStories([]); setStoryId('');
    }
  }, [accessToken, projectId]);

  const handleEditEpic = useCallback(async (id: string, title: string) => {
    await updateEpic(accessToken, id, { title });
    setEpics(prev => prev.map(e => e.id === id ? { ...e, title } : e));
  }, [accessToken]);

  const handleDeleteEpic = useCallback(async (id: string) => {
    await deleteEpic(accessToken, id);
    setEpics(prev => prev.filter(e => e.id !== id));
    if (epicId === id) {
      setEpicId('');
      setFeatures([]); setFeatureId('');
      setStories([]); setStoryId('');
    }
  }, [accessToken, epicId]);

  const handleEditFeature = useCallback(async (id: string, title: string) => {
    await updateFeature(accessToken, id, { title });
    setFeatures(prev => prev.map(f => f.id === id ? { ...f, title } : f));
  }, [accessToken]);

  const handleDeleteFeature = useCallback(async (id: string) => {
    await deleteFeature(accessToken, id);
    setFeatures(prev => prev.filter(f => f.id !== id));
    if (featureId === id) {
      setFeatureId('');
      // Reload stories under epic
      if (epicId) {
        getStories(accessToken, { epicId }).then(setStories).catch(() => {});
      }
    }
  }, [accessToken, featureId, epicId]);

  const handleEditStory = useCallback(async (id: string, title: string) => {
    await updateStory(accessToken, id, { title });
    setStories(prev => prev.map(s => s.id === id ? { ...s, title } : s));
  }, [accessToken]);

  const handleDeleteStory = useCallback(async (id: string) => {
    await deleteStory(accessToken, id);
    setStories(prev => prev.filter(s => s.id !== id));
    if (storyId === id) setStoryId('');
  }, [accessToken, storyId]);

  // ── Derived ────────────────────────────────────────────────────────

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
          onChange={setProjectId}
          placeholder={loading && projects.length === 0 ? 'Loading...' : 'Select a project'}
          options={projects.map(p => ({ value: p.id, label: p.name }))}
          onEditOption={(id, name) => handleEditProject(id, name)}
          onDeleteOption={(id) => handleDeleteProject(id)}
        />

        {projectId && (
          <Select
            label="Epic"
            value={epicId}
            onChange={setEpicId}
            placeholder={loading ? 'Loading...' : epics.length === 0 ? 'No epics' : 'Select an epic'}
            options={epics.map(e => ({ value: e.id, label: e.title }))}
            onEditOption={(id, title) => handleEditEpic(id, title)}
            onDeleteOption={(id) => handleDeleteEpic(id)}
          />
        )}

        {epicId && (
          <Select
            label="Feature (optional)"
            value={featureId}
            onChange={setFeatureId}
            placeholder={loading ? 'Loading...' : features.length === 0 ? 'No features' : 'Select a feature'}
            options={[
              { value: '', label: 'No feature — use epic directly', isStatic: true },
              ...features.map(f => ({ value: f.id, label: f.title })),
            ]}
            onEditOption={(id, title) => handleEditFeature(id, title)}
            onDeleteOption={(id) => handleDeleteFeature(id)}
          />
        )}

        {epicId && (
          <Select
            label="User Story"
            value={storyId}
            onChange={setStoryId}
            placeholder={loading ? 'Loading...' : stories.length === 0 ? 'No stories' : 'Select a story'}
            options={stories.map(s => ({ value: s.id, label: s.title }))}
            onEditOption={(id, title) => handleEditStory(id, title)}
            onDeleteOption={(id) => handleDeleteStory(id)}
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
