-- Allow stories to live directly under an epic (no feature required)
ALTER TABLE stories
  ADD COLUMN IF NOT EXISTS epic_id UUID REFERENCES epics(id) ON DELETE CASCADE;

-- Make feature_id nullable (was previously required)
ALTER TABLE stories
  ALTER COLUMN feature_id DROP NOT NULL;

-- Ensure at least one parent is set (feature_id or epic_id)
ALTER TABLE stories
  ADD CONSTRAINT stories_has_parent CHECK (
    feature_id IS NOT NULL OR epic_id IS NOT NULL
  );

-- Index for fetching stories by epic directly
CREATE INDEX IF NOT EXISTS stories_epic_id_idx ON stories(epic_id);
