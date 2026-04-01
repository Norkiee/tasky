import React, { useState, useCallback } from 'react';
import { FrameData, WorkItem, FrameWorkItems, PluginStorage } from './types';
import { useFrameSelection } from './hooks/useFrameSelection';
import { useAuth } from './hooks/useAuth';
import { usePluginStorage } from './hooks/usePluginStorage';
import { useAutoResize } from './hooks/useAutoResize';
import { generateWorkItems, saveTasks, Project, Epic, Feature, Story, Session, TaskInput } from './services/api';
import { HomeScreen } from './screens/HomeScreen';
import { LoginScreen } from './screens/LoginScreen';
import { SelectProjectScreen } from './screens/SelectProjectScreen';
import { ContextScreen } from './screens/ContextScreen';
import { GeneratingScreen } from './screens/GeneratingScreen';
import { ReviewScreen } from './screens/ReviewScreen';
import { SubmittingScreen } from './screens/SubmittingScreen';
import { SuccessScreen } from './screens/SuccessScreen';

type Screen = 'home' | 'login' | 'select-project' | 'context' | 'generating' | 'review' | 'submitting' | 'success';

interface HierarchySelection {
  project: Project;
  epic?: Epic;
  feature?: Feature;
  story: Story;
}

export function App(): React.ReactElement {
  const [screen, setScreen] = useState<Screen>('home');
  const [error, setError] = useState<string | null>(null);

  const { frames, frameCount, sectionCount, requestFrames } = useFrameSelection();
  const auth = useAuth();
  const { storage, updateStorage } = usePluginStorage();
  const containerRef = useAutoResize();

  // Selection state
  const [selection, setSelection] = useState<HierarchySelection | null>(null);

  // Generated work items
  const [frameWorkItems, setFrameWorkItems] = useState<FrameWorkItems[]>([]);
  const [completedFrameIds, setCompletedFrameIds] = useState<Set<string>>(new Set());

  // Submission state
  const [submittedIds, setSubmittedIds] = useState<Set<string>>(new Set());
  const [savedCount, setSavedCount] = useState(0);

  // Flow: home → login → select-project → context → generating → review → submitting → success

  const handleContinueFromHome = useCallback(() => {
    requestFrames();
    if (!auth.isAuthenticated) {
      setScreen('login');
    } else {
      setScreen('select-project');
    }
  }, [requestFrames, auth.isAuthenticated]);

  const handleLogin = useCallback((session: Session, email: string) => {
    auth.setSession(session, email);
    setScreen('select-project');
  }, [auth]);

  const handleProjectSelected = useCallback((sel: HierarchySelection) => {
    setSelection(sel);
    updateStorage({
      projectId: sel.project.id,
      epicId: sel.epic?.id,
      featureId: sel.feature?.id,
      storyId: sel.story.id,
    });
    setScreen('context');
  }, [updateStorage]);

  const handleSessionExpired = useCallback(() => {
    auth.logout();
    setScreen('login');
  }, [auth]);

  const handleGenerate = useCallback(
    async (context?: string) => {
      setScreen('generating');
      setCompletedFrameIds(new Set());
      setError(null);

      try {
        const { frameWorkItems: generated } = await generateWorkItems(
          auth.accessToken!,
          frames,
          context,
          selection?.story.title,
          selection?.story.description || undefined,
          (frameId) => {
            setCompletedFrameIds((prev) => new Set([...prev, frameId]));
          }
        );
        setFrameWorkItems(generated);
        setScreen('review');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Generation failed');
        setScreen('context');
      }
    },
    [frames, auth.accessToken, selection]
  );

  const handleWorkItemUpdate = useCallback(
    (frameId: string, workItemId: string, updates: Partial<WorkItem>) => {
      setFrameWorkItems((prev) =>
        prev.map((fwi) =>
          fwi.frameId === frameId
            ? {
                ...fwi,
                workItems: fwi.workItems.map((item) =>
                  item.id === workItemId ? { ...item, ...updates } : item
                ),
              }
            : fwi
        )
      );
    },
    []
  );

  const handleWorkItemToggle = useCallback((frameId: string, workItemId: string) => {
    setFrameWorkItems((prev) =>
      prev.map((fwi) =>
        fwi.frameId === frameId
          ? {
              ...fwi,
              workItems: fwi.workItems.map((item) =>
                item.id === workItemId ? { ...item, selected: !item.selected } : item
              ),
            }
          : fwi
      )
    );
  }, []);

  const getSelectedWorkItems = useCallback(() => {
    const items: WorkItem[] = [];
    for (const fwi of frameWorkItems) {
      for (const item of fwi.workItems) {
        if (item.selected) {
          items.push(item);
        }
      }
    }
    return items;
  }, [frameWorkItems]);

  const handleSubmit = useCallback(async () => {
    const selectedItems = getSelectedWorkItems();
    if (selectedItems.length === 0 || !selection) return;

    setScreen('submitting');
    setSubmittedIds(new Set());

    try {
      const tasks: TaskInput[] = selectedItems.map((item) => ({
        title: item.title,
        description: item.description,
      }));

      const savedTasks = await saveTasks(auth.accessToken!, selection.story.id, tasks);
      setSavedCount(savedTasks.length);
      setSubmittedIds(new Set(selectedItems.map((item) => item.id)));
      setScreen('success');
    } catch (err) {
      if (err instanceof Error && err.name === 'AuthError') {
        handleSessionExpired();
      } else {
        setError(err instanceof Error ? err.message : 'Submission failed');
        setScreen('review');
      }
    }
  }, [getSelectedWorkItems, selection, auth.accessToken, handleSessionExpired]);

  const handleGoHome = useCallback(() => {
    setFrameWorkItems([]);
    setSavedCount(0);
    setError(null);
    setSelection(null);
    setCompletedFrameIds(new Set());
    setSubmittedIds(new Set());
    setScreen('home');
  }, []);

  // Get tasks for submitting screen
  const getTasksForSubmitting = useCallback(() => {
    const selectedItems = getSelectedWorkItems();
    return selectedItems.map((item) => ({
      taskId: item.id,
      title: item.title,
      description: item.description,
      tags: [],
      parentStoryId: 0,
    }));
  }, [getSelectedWorkItems]);

  return (
    <div className="plugin-container" ref={containerRef}>
      {error && screen !== 'generating' && screen !== 'submitting' && (
        <div className="error-message">{error}</div>
      )}

      {screen === 'home' && (
        <HomeScreen
          frameCount={frameCount}
          sectionCount={sectionCount}
          email={auth.email}
          onContinue={handleContinueFromHome}
          onSignOut={auth.isAuthenticated ? auth.logout : undefined}
        />
      )}

      {screen === 'login' && (
        <LoginScreen
          onLogin={handleLogin}
          onBack={() => setScreen('home')}
        />
      )}

      {screen === 'select-project' && (
        <SelectProjectScreen
          accessToken={auth.accessToken!}
          savedProjectId={storage.projectId}
          savedEpicId={storage.epicId}
          savedFeatureId={storage.featureId}
          savedStoryId={storage.storyId}
          onContinue={handleProjectSelected}
          onSessionExpired={handleSessionExpired}
          onBack={() => setScreen('home')}
        />
      )}

      {screen === 'context' && (
        <ContextScreen
          frames={frames}
          workItemType="Task"
          parentTitle={selection?.story.title || ''}
          onGenerate={handleGenerate}
          onBack={() => setScreen('select-project')}
        />
      )}

      {screen === 'generating' && (
        <GeneratingScreen
          frames={frames}
          workItemType="Task"
          completedFrameIds={completedFrameIds}
        />
      )}

      {screen === 'review' && (
        <ReviewScreen
          frameWorkItems={frameWorkItems}
          workItemType="Task"
          selectedTags={[]}
          parentTitle={selection?.story.title || ''}
          onWorkItemUpdate={handleWorkItemUpdate}
          onWorkItemToggle={handleWorkItemToggle}
          onRemoveTag={() => {}}
          onSubmit={handleSubmit}
          onBack={() => setScreen('context')}
        />
      )}

      {screen === 'submitting' && (
        <SubmittingScreen
          tasks={getTasksForSubmitting()}
          workItemType="Task"
          completedTaskIds={submittedIds}
        />
      )}

      {screen === 'success' && (
        <SuccessScreen
          count={savedCount}
          workItemType="Task"
          parentTitle={selection?.story.title || ''}
          onGoHome={handleGoHome}
        />
      )}
    </div>
  );
}
