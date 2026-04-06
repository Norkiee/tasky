# [TBD] — Design Workflow Platform

Porting existing Figma plugin to work with a new web app backend instead of Azure DevOps.

## What's Changing

| Component | Before (TaskScribe) | After ([TBD]) |
|-----------|---------------------|---------------|
| Backend | Vercel + Redis + Azure DevOps API | Vercel + Supabase |
| Auth | Microsoft Entra ID OAuth | Supabase Magic Link |
| Data Storage | Azure DevOps Work Items | Supabase PostgreSQL |
| Hierarchy Source | Azure DevOps | Web app (user-created) |
| New Feature | — | Document/transcript upload + AI extraction |

## What's Being Reused

From existing plugin (`plugin/` folder):
- Frame extraction logic (`main.ts`)
- UI components (Button, Input, Select, etc.)
- Screen structure and navigation
- Hooks (useFrameSelection, useAutoResize)
- Codex task generation prompt
- Build setup (Vite, TypeScript)

## New Infrastructure to Set Up

### 1. Supabase Project

1. Go to https://supabase.com → New Project
2. Note down:
   - Project URL: `https://xxxx.supabase.co`
   - Anon Key: `eyJ...`
   - Service Role Key: `eyJ...`

### 2. Supabase Auth (Magic Link)

1. Supabase Dashboard → Authentication → Providers
2. Email should be enabled by default
3. Settings → Auth → Site URL: `https://your-app.vercel.app`
4. Redirect URLs: Add `https://your-app.vercel.app/auth/callback`

### 3. Supabase Storage

1. Dashboard → Storage → New Bucket
2. Name: `documents`
3. Public: OFF
4. Add policy for authenticated users:
```sql
create policy "Users can upload documents"
on storage.objects for insert
to authenticated
with check (bucket_id = 'documents');

create policy "Users can view own documents"
on storage.objects for select
to authenticated
using (bucket_id = 'documents');
```

### 4. Database Schema

Run in Supabase SQL Editor:

```sql
-- Projects
create table projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  description text,
  context text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Documents
create table documents (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade not null,
  name text not null,
  type text not null check (type in ('pdf', 'docx', 'txt', 'md', 'transcript')),
  content text,
  file_path text,
  status text default 'pending' check (status in ('pending', 'processing', 'extracted', 'failed')),
  created_at timestamptz default now()
);

-- Extractions (AI suggestions)
create table extractions (
  id uuid primary key default gen_random_uuid(),
  document_id uuid references documents(id) on delete cascade not null,
  type text not null check (type in ('epic', 'feature', 'story')),
  title text not null,
  description text,
  acceptance_criteria text,
  confidence float,
  status text default 'pending' check (status in ('pending', 'approved', 'rejected')),
  parent_extraction_id uuid references extractions(id),
  created_at timestamptz default now()
);

-- Epics
create table epics (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade not null,
  title text not null,
  description text,
  azure_id text,
  created_at timestamptz default now()
);

-- Features
create table features (
  id uuid primary key default gen_random_uuid(),
  epic_id uuid references epics(id) on delete cascade not null,
  title text not null,
  description text,
  azure_id text,
  created_at timestamptz default now()
);

-- Stories
create table stories (
  id uuid primary key default gen_random_uuid(),
  feature_id uuid references features(id) on delete cascade not null,
  title text not null,
  description text,
  acceptance_criteria text,
  azure_id text,
  created_at timestamptz default now()
);

-- Tasks
create table tasks (
  id uuid primary key default gen_random_uuid(),
  story_id uuid references stories(id) on delete cascade not null,
  title text not null,
  description text,
  acceptance_criteria text,
  complexity text check (complexity in ('S', 'M', 'L')),
  source_frame_id text,
  source_frame_name text,
  copied_at timestamptz,
  created_at timestamptz default now()
);

-- Indexes
create index idx_projects_user_id on projects(user_id);
create index idx_documents_project_id on documents(project_id);
create index idx_extractions_document_id on extractions(document_id);
create index idx_epics_project_id on epics(project_id);
create index idx_features_epic_id on features(epic_id);
create index idx_stories_feature_id on stories(feature_id);
create index idx_tasks_story_id on tasks(story_id);

-- RLS
alter table projects enable row level security;
alter table documents enable row level security;
alter table extractions enable row level security;
alter table epics enable row level security;
alter table features enable row level security;
alter table stories enable row level security;
alter table tasks enable row level security;

create policy "Users own projects" on projects
  for all using (auth.uid() = user_id);

create policy "Users own documents" on documents
  for all using (project_id in (select id from projects where user_id = auth.uid()));

create policy "Users own extractions" on extractions
  for all using (document_id in (
    select d.id from documents d
    join projects p on d.project_id = p.id
    where p.user_id = auth.uid()
  ));

create policy "Users own epics" on epics
  for all using (project_id in (select id from projects where user_id = auth.uid()));

create policy "Users own features" on features
  for all using (epic_id in (
    select e.id from epics e join projects p on e.project_id = p.id where p.user_id = auth.uid()
  ));

create policy "Users own stories" on stories
  for all using (feature_id in (
    select f.id from features f
    join epics e on f.epic_id = e.id
    join projects p on e.project_id = p.id
    where p.user_id = auth.uid()
  ));

create policy "Users own tasks" on tasks
  for all using (story_id in (
    select s.id from stories s
    join features f on s.feature_id = f.id
    join epics e on f.epic_id = e.id
    join projects p on e.project_id = p.id
    where p.user_id = auth.uid()
  ));

-- Updated at trigger
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger projects_updated_at
  before update on projects
  for each row execute function update_updated_at();
```

### 5. Vercel Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
ANTHROPIC_API_KEY=sk-ant-api03-...
```

## Project Structure

```
/
├── web/                          # NEW: Next.js web app
│   ├── app/
│   │   ├── page.tsx             # Landing + login
│   │   ├── auth/callback/page.tsx
│   │   ├── dashboard/page.tsx
│   │   ├── project/[id]/page.tsx
│   │   └── api/
│   │       ├── projects/route.ts
│   │       ├── epics/route.ts
│   │       ├── features/route.ts
│   │       ├── stories/route.ts
│   │       ├── tasks/route.ts
│   │       ├── documents/route.ts
│   │       ├── extract/route.ts    # AI extraction
│   │       └── generate/route.ts   # Task generation
│   ├── components/
│   ├── lib/
│   │   ├── supabase/client.ts
│   │   ├── supabase/server.ts
│   │   ├── Codex.ts
│   │   └── types.ts
│   └── package.json
│
├── plugin/                       # PORTED: Existing plugin code
│   ├── src/
│   │   ├── main.ts              # Keep as-is
│   │   └── ui/
│   │       ├── App.tsx          # Update screen flow
│   │       ├── screens/         # Modify to use new API
│   │       ├── components/      # Keep as-is
│   │       ├── hooks/           # Keep as-is
│   │       └── services/
│   │           └── api.ts       # UPDATE: Point to new endpoints
│   └── package.json
```

## Plugin Changes Required

### 1. Update `api.ts`

Replace Azure DevOps calls with Supabase calls:

```typescript
// OLD (Azure)
const API_URL = 'https://devops-psi.vercel.app/api';

// NEW (Supabase web app)
const API_URL = import.meta.env.VITE_API_URL || 'https://your-app.vercel.app';

// OLD
export async function getOrganizations(sessionId: string) { ... }
export async function getProjects(sessionId: string, org: string) { ... }

// NEW
export async function getProjects(token: string) {
  const res = await fetch(`${API_URL}/api/projects`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.json();
}

export async function getEpics(token: string, projectId: string) {
  const res = await fetch(`${API_URL}/api/epics?projectId=${projectId}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.json();
}

export async function getFeatures(token: string, epicId: string) { ... }
export async function getStories(token: string, featureId: string) { ... }

export async function saveTasks(token: string, storyId: string, tasks: Task[]) {
  const res = await fetch(`${API_URL}/api/tasks`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ story_id: storyId, tasks })
  });
  return res.json();
}
```

### 2. Update Auth Flow

Replace Azure OAuth polling with Supabase magic link:

```typescript
// screens/LoginScreen.tsx

export function LoginScreen() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [token, setToken] = useState('');

  const sendMagicLink = async () => {
    await fetch(`${API_URL}/api/auth/magic-link`, {
      method: 'POST',
      body: JSON.stringify({ email })
    });
    setSent(true);
  };

  const verifyToken = async () => {
    const res = await fetch(`${API_URL}/api/auth/verify`, {
      method: 'POST',
      body: JSON.stringify({ token })
    });
    const { session } = await res.json();
    if (session) {
      await figma.clientStorage.setAsync('session', session);
      // Navigate to next screen
    }
  };

  // ... UI
}
```

### 3. Update Screen Flow

Remove Azure-specific screens:

```
OLD: Home → WorkItemType → ConnectAzure → SelectProject → SelectParent → Context → Generate → Review → Submit → Success

NEW: Home → Login → SelectProject → SelectParent → Context → Generate → Review → Success
```

### 4. Simplify Work Item Types

Remove Epic/Feature/Task selection — only generate Tasks:

```typescript
// Always generate tasks for a selected User Story
// No need for WorkItemTypeScreen
```

## Web App API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/projects` | GET | List user's projects |
| `/api/projects` | POST | Create project |
| `/api/projects/[id]` | GET | Get project with hierarchy |
| `/api/epics` | GET | List epics (filter by projectId) |
| `/api/epics` | POST | Create epic |
| `/api/features` | GET | List features (filter by epicId) |
| `/api/features` | POST | Create feature |
| `/api/stories` | GET | List stories (filter by featureId) |
| `/api/stories` | POST | Create story |
| `/api/tasks` | GET | List tasks (filter by storyId) |
| `/api/tasks` | POST | Bulk create tasks |
| `/api/documents` | POST | Upload document |
| `/api/extract` | POST | Extract work items from document |
| `/api/generate` | POST | Generate tasks from Figma frames |

## Codex Prompts

### Document Extraction

```typescript
const EXTRACTION_PROMPT = `Extract work items from this document. Return JSON:

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
        "acceptance_criteria": "- Criterion 1\n- Criterion 2"
      }]
    }]
  }]
}

Rules:
- Epic: Large initiative
- Feature: Shippable capability
- Story: User-facing outcome in "As a... I can... so that..." format
- Include acceptance criteria for stories`;
```

### Task Generation

Keep existing prompt from TaskScribe, just update the output format.

## Commands

```bash
# Setup
cd web && npm install
cd plugin && npm install

# Development
cd web && npm run dev
cd plugin && npm run dev

# Build
cd web && npm run build
cd plugin && npm run build
```

## Implementation Steps

1. **Create Supabase project** — get credentials
2. **Run database schema** — in SQL editor
3. **Create storage bucket** — for documents
4. **Scaffold web app** — Next.js + Supabase client
5. **Build auth flow** — magic link login
6. **Build CRUD API** — projects, epics, features, stories, tasks
7. **Build dashboard UI** — project list, hierarchy view
8. **Add document upload** — storage + extraction
9. **Port plugin** — copy existing code, update api.ts
10. **Update plugin auth** — magic link flow
11. **Connect plugin to web app** — test full flow
12. **Deploy** — Vercel

## Environment Variables

### Web App (Vercel)
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ANTHROPIC_API_KEY=
```

### Plugin
```
VITE_API_URL=https://your-app.vercel.app
```
