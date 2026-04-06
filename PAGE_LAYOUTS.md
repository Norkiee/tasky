# Page Layouts & Components

This document describes the exact structure of each page. Follow these layouts precisely.

---

## Global Layout

Every page uses this shell:

```
┌──────────────────────────────────────────────────────────────────┐
│ ┌────────┐                                                       │
│ │Sidebar │  Main Content Area                                    │
│ │ 56px   │                                                       │
│ │        │  ┌─────────────────────────────────────────────────┐  │
│ │ Icons  │  │ Header Bar (56px height)                        │  │
│ │ only   │  ├─────────────────────────────────────────────────┤  │
│ │        │  │                                                 │  │
│ │        │  │ Page Content                                    │  │
│ │        │  │                                                 │  │
│ │        │  │                                                 │  │
│ │        │  │                                                 │  │
│ │ ────── │  ├─────────────────────────────────────────────────┤  │
│ │Avatar  │  │ Footer Bar (40px height) - optional             │  │
│ └────────┘  └─────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
```

### Sidebar Component

```tsx
// components/Sidebar.tsx

<aside className="w-[56px] h-screen bg-transparent border-r border-white/[0.06] flex flex-col items-center py-4 px-2 gap-1">
  
  {/* Primary Action */}
  <button className="w-10 h-10 rounded-[10px] bg-accent/15 flex items-center justify-center text-accent mb-2">
    <PlusIcon className="w-5 h-5" />
  </button>
  
  {/* Navigation Icons */}
  <NavIcon icon={UsersIcon} />
  <NavIcon icon={ClockIcon} />
  <NavIcon icon={GridIcon} active />
  <NavIcon icon={SparklesIcon} />
  <NavIcon icon={MessageIcon} />
  <NavIcon icon={HelpIcon} />
  
  {/* Spacer */}
  <div className="flex-1" />
  
  {/* User Avatar */}
  <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-white text-sm font-medium">
    A
  </div>
  
</aside>

// NavIcon component
function NavIcon({ icon: Icon, active = false }) {
  return (
    <button className={`
      w-10 h-10 rounded-[10px] flex items-center justify-center
      ${active 
        ? 'bg-accent/15 text-accent' 
        : 'text-text-tertiary hover:bg-white/5 hover:text-text-secondary'
      }
    `}>
      <Icon className="w-5 h-5" />
    </button>
  )
}
```

### Header Bar Component

```tsx
// components/Header.tsx

<header className="h-[56px] px-6 flex items-center justify-between border-b border-white/[0.06]">
  
  {/* Left: Title or Breadcrumb */}
  <div>
    <span className="text-sm font-medium text-white">Page Title</span>
  </div>
  
  {/* Right: Actions */}
  <div className="flex items-center gap-3">
    {/* Search */}
    <div className="flex items-center gap-2 bg-bg-secondary border border-white/10 rounded-lg px-3 py-2 w-[200px]">
      <SearchIcon className="w-4 h-4 text-text-tertiary" />
      <span className="text-sm text-text-tertiary">Search</span>
    </div>
    
    {/* Primary Button */}
    <button className="bg-accent text-white rounded-lg px-4 py-2 text-sm font-medium">
      New project
    </button>
  </div>
  
</header>
```

### Footer Bar Component (optional)

```tsx
// components/Footer.tsx

<footer className="h-10 px-6 flex items-center justify-between border-t border-white/[0.06]">
  
  {/* Left: Count */}
  <span className="text-xs text-text-tertiary">3 projects</span>
  
  {/* Right: Status Pill */}
  <div className="bg-bg-secondary border border-white/10 rounded-full px-3 py-1 text-xs">
    <span className="text-text-secondary">Tasks</span>
    <span className="text-text-tertiary ml-1">0 active</span>
  </div>
  
</footer>
```

---

## Page: Login

Centered card on dark background. No sidebar.

```tsx
// app/page.tsx (or app/login/page.tsx)

<main className="min-h-screen bg-bg-primary flex items-center justify-center p-6">
  
  <div className="w-full max-w-[380px] bg-bg-secondary border border-white/10 rounded-2xl p-8">
    
    {/* Logo + Name */}
    <div className="flex items-center gap-3 mb-6">
      <div className="w-9 h-9 bg-accent rounded-lg flex items-center justify-center">
        <ClipboardIcon className="w-5 h-5 text-white" />
      </div>
      <span className="text-lg font-medium text-white">[TBD]</span>
    </div>
    
    {/* Subtitle */}
    <p className="text-sm text-text-secondary mb-6">
      Sign in to your workspace
    </p>
    
    {/* Email Input */}
    <div className="mb-4">
      <label className="block text-xs text-text-tertiary mb-2">Email</label>
      <input 
        type="email"
        placeholder="you@company.com"
        className="w-full bg-bg-input border border-white/10 rounded-lg px-4 py-3 text-sm text-white placeholder:text-text-tertiary focus:border-white/20 outline-none"
      />
    </div>
    
    {/* Submit Button */}
    <button className="w-full bg-accent text-white rounded-lg py-3 text-sm font-medium mb-4">
      Send magic link
    </button>
    
    {/* Helper Text */}
    <p className="text-xs text-text-tertiary text-center">
      We'll email you a link to sign in
    </p>
    
  </div>
  
</main>
```

---

## Page: Dashboard (Projects List)

Grid of project cards with thumbnails.

```tsx
// app/dashboard/page.tsx

<div className="flex h-screen bg-bg-primary">
  <Sidebar />
  
  <main className="flex-1 flex flex-col">
    
    {/* Header */}
    <header className="h-[56px] px-6 flex items-center justify-between border-b border-white/[0.06]">
      <span className="text-sm font-medium text-white">All projects</span>
      <div className="flex items-center gap-3">
        <SearchInput />
        <button className="bg-accent text-white rounded-lg px-4 py-2 text-sm font-medium">
          New project
        </button>
      </div>
    </header>
    
    {/* Content */}
    <div className="flex-1 p-6 overflow-auto">
      <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4">
        
        {/* Project Cards */}
        {projects.map(project => (
          <ProjectCard key={project.id} project={project} />
        ))}
        
        {/* New Project Card (Empty State) */}
        <button className="bg-bg-secondary border border-dashed border-white/10 rounded-xl h-[200px] flex flex-col items-center justify-center gap-2 hover:border-white/20">
          <div className="w-10 h-10 rounded-[10px] bg-white/5 flex items-center justify-center">
            <PlusIcon className="w-5 h-5 text-text-tertiary" />
          </div>
          <span className="text-sm text-text-tertiary">New project</span>
        </button>
        
      </div>
    </div>
    
    {/* Footer */}
    <footer className="h-10 px-6 flex items-center justify-between border-t border-white/[0.06]">
      <span className="text-xs text-text-tertiary">{projects.length} projects</span>
      <StatusPill label="Tasks" value="0 active" />
    </footer>
    
  </main>
</div>
```

### Project Card Component

```tsx
// components/ProjectCard.tsx

<div className="bg-bg-secondary border border-white/10 rounded-xl overflow-hidden hover:border-white/15 cursor-pointer transition-colors">
  
  {/* Thumbnail */}
  <div className="h-[140px] bg-bg-input">
    {/* Project thumbnail or gradient placeholder */}
  </div>
  
  {/* Info */}
  <div className="p-4">
    <h3 className="text-sm font-medium text-white mb-1 truncate">
      {project.name}
    </h3>
    <p className="text-xs text-text-tertiary">
      Edited {formatDate(project.updated_at)} by {project.user}
    </p>
  </div>
  
</div>
```

---

## Page: Project Detail (Hierarchy)

Tree view with collapsible items.

```tsx
// app/project/[id]/page.tsx

<div className="flex h-screen bg-bg-primary">
  <Sidebar />
  
  <main className="flex-1 flex flex-col">
    
    {/* Header with Breadcrumb */}
    <header className="px-6 py-4 border-b border-white/[0.06]">
      <p className="text-xs text-text-tertiary mb-1">
        Projects / {project.name}
      </p>
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-medium text-white">{project.name}</h1>
        <button className="text-text-secondary border border-white/10 rounded-lg px-4 py-2 text-sm hover:border-white/15">
          Upload docs
        </button>
      </div>
    </header>
    
    {/* Tabs */}
    <div className="px-6 border-b border-white/[0.06] flex gap-6">
      <button className="text-sm font-medium text-white py-3 border-b-2 border-accent">
        Hierarchy
      </button>
      <button className="text-sm text-text-tertiary py-3 hover:text-text-secondary">
        Documents
      </button>
    </div>
    
    {/* Hierarchy Tree */}
    <div className="flex-1 p-6 overflow-auto">
      
      {epics.map(epic => (
        <TreeItem key={epic.id} type="epic" item={epic}>
          {epic.features.map(feature => (
            <TreeItem key={feature.id} type="feature" item={feature}>
              {feature.stories.map(story => (
                <TreeItem key={story.id} type="story" item={story}>
                  <TaskList tasks={story.tasks} />
                </TreeItem>
              ))}
            </TreeItem>
          ))}
        </TreeItem>
      ))}
      
      {/* Add Epic Button */}
      <button className="w-full mt-3 py-3 border border-dashed border-white/10 rounded-lg text-sm text-text-tertiary hover:border-white/15">
        + Add epic
      </button>
      
    </div>
    
  </main>
</div>
```

### Tree Item Component

```tsx
// components/TreeItem.tsx

const badgeColors = {
  epic: 'bg-purple-500/15 text-purple-400',
  feature: 'bg-green-500/15 text-green-400',
  story: 'bg-blue-500/15 text-blue-400',
}

function TreeItem({ type, item, children, level = 0 }) {
  const [expanded, setExpanded] = useState(true)
  
  return (
    <div style={{ marginLeft: level * 24 }}>
      
      {/* Item Row */}
      <div 
        className={`
          flex items-center gap-2 px-3 py-2.5 rounded-lg cursor-pointer
          ${type === 'epic' ? 'bg-bg-secondary' : ''}
          ${type === 'story' ? 'bg-bg-secondary border border-white/10' : ''}
        `}
        onClick={() => setExpanded(!expanded)}
      >
        {/* Chevron */}
        <ChevronIcon 
          className={`w-4 h-4 text-text-tertiary transition-transform ${expanded ? 'rotate-0' : '-rotate-90'}`}
        />
        
        {/* Badge */}
        <span className={`text-[11px] px-2 py-0.5 rounded ${badgeColors[type]}`}>
          {type.charAt(0).toUpperCase() + type.slice(1)}
        </span>
        
        {/* Title */}
        <span className={`text-sm ${type === 'epic' ? 'font-medium text-white' : 'text-white'}`}>
          {item.title}
        </span>
        
        {/* Task Count (for stories) */}
        {type === 'story' && (
          <span className="ml-auto text-xs text-text-tertiary">
            {item.tasks?.length || 0} tasks
          </span>
        )}
      </div>
      
      {/* Children */}
      {expanded && children && (
        <div className="mt-1">
          {children}
        </div>
      )}
      
    </div>
  )
}
```

### Task List Component

```tsx
// components/TaskList.tsx

function TaskList({ tasks }) {
  return (
    <div className="ml-6 mt-1 bg-bg-secondary rounded-lg p-2">
      
      {tasks.map((task, i) => (
        <div 
          key={task.id}
          className={`
            flex items-center gap-3 px-2 py-2
            ${i < tasks.length - 1 ? 'border-b border-white/[0.06]' : ''}
          `}
        >
          <input 
            type="checkbox" 
            className="w-3.5 h-3.5 accent-accent"
          />
          <span className="text-sm text-text-secondary flex-1">
            {task.title}
          </span>
          <ComplexityBadge complexity={task.complexity} />
          <button className="text-text-tertiary hover:text-text-secondary">
            <CopyIcon className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
      
      {/* Copy All Button */}
      <div className="pt-2 text-right">
        <button className="text-xs text-text-secondary border border-white/10 rounded-md px-3 py-1.5 hover:border-white/15">
          Copy all
        </button>
      </div>
      
    </div>
  )
}

function ComplexityBadge({ complexity }) {
  const colors = {
    S: 'bg-green-500/15 text-green-400',
    M: 'bg-amber-500/15 text-amber-400',
    L: 'bg-red-500/15 text-red-400',
  }
  return (
    <span className={`text-[10px] px-1.5 py-0.5 rounded ${colors[complexity]}`}>
      {complexity}
    </span>
  )
}
```

---

## Page: Upload & Extract

Split view: upload on left, extraction preview on right.

```tsx
// app/project/[id]/upload/page.tsx

<div className="flex h-screen bg-bg-primary">
  <Sidebar />
  
  <main className="flex-1 flex flex-col">
    
    {/* Header */}
    <header className="px-6 py-4 border-b border-white/[0.06]">
      <p className="text-xs text-text-tertiary mb-1">
        Projects / {project.name} / Upload
      </p>
      <h1 className="text-lg font-medium text-white">Add content</h1>
    </header>
    
    {/* Content - Two Columns */}
    <div className="flex-1 p-6 grid grid-cols-2 gap-6 overflow-auto">
      
      {/* Left: Upload */}
      <div>
        <h2 className="text-sm font-medium text-white mb-3">Upload documents</h2>
        
        {/* Dropzone */}
        <div className="border-2 border-dashed border-white/10 rounded-xl p-8 text-center mb-6 hover:border-white/15 cursor-pointer">
          <UploadIcon className="w-8 h-8 text-text-tertiary mx-auto mb-2" />
          <p className="text-sm text-text-secondary mb-1">Drag & drop or click to upload</p>
          <p className="text-xs text-text-tertiary">PDF, DOCX, TXT, MD</p>
        </div>
        
        <h2 className="text-sm font-medium text-white mb-3">Or paste transcript</h2>
        
        {/* Textarea */}
        <textarea 
          placeholder="Paste your Teams meeting transcript here..."
          className="w-full h-[120px] bg-bg-input border border-white/10 rounded-lg p-3 text-sm text-white placeholder:text-text-tertiary resize-none focus:border-white/20 outline-none"
        />
        
        {/* Extract Button */}
        <button className="w-full mt-4 bg-accent text-white rounded-lg py-3 text-sm font-medium">
          Extract work items
        </button>
      </div>
      
      {/* Right: Extraction Preview */}
      <div>
        <h2 className="text-sm font-medium text-white mb-3">Extracted items</h2>
        
        <div className="bg-bg-secondary rounded-xl p-3 max-h-[400px] overflow-auto">
          
          {extractions.map(epic => (
            <ExtractionItem key={epic.id} type="epic" item={epic}>
              {epic.features.map(feature => (
                <ExtractionItem key={feature.id} type="feature" item={feature}>
                  {feature.stories.map(story => (
                    <ExtractionItem key={story.id} type="story" item={story} />
                  ))}
                </ExtractionItem>
              ))}
            </ExtractionItem>
          ))}
          
        </div>
        
        {/* Actions */}
        <div className="flex gap-2 mt-4">
          <button className="flex-1 text-sm text-text-secondary border border-white/10 rounded-lg py-2 hover:border-white/15">
            Select all
          </button>
          <button className="flex-1 bg-accent text-white rounded-lg py-2 text-sm font-medium">
            Approve selected
          </button>
        </div>
      </div>
      
    </div>
    
  </main>
</div>
```

### Extraction Item Component

```tsx
// components/ExtractionItem.tsx

function ExtractionItem({ type, item, children, level = 0 }) {
  const badgeColors = {
    epic: 'bg-purple-500/15 text-purple-400',
    feature: 'bg-green-500/15 text-green-400',
    story: 'bg-blue-500/15 text-blue-400',
  }
  
  const confidenceColor = item.confidence >= 0.8 
    ? 'bg-green-500/15 text-green-400'
    : 'bg-amber-500/15 text-amber-400'
  
  return (
    <div style={{ marginLeft: level * 16 }} className="mb-1">
      
      <div className="flex items-center gap-2 p-2 bg-bg-primary rounded-md">
        <input type="checkbox" defaultChecked className="w-3.5 h-3.5 accent-accent" />
        <span className={`text-[10px] px-1.5 py-0.5 rounded ${badgeColors[type]}`}>
          {type.charAt(0).toUpperCase() + type.slice(1)}
        </span>
        <span className="text-xs text-white flex-1 truncate">{item.title}</span>
        <span className={`text-[10px] px-1.5 py-0.5 rounded ${confidenceColor}`}>
          {Math.round(item.confidence * 100)}%
        </span>
      </div>
      
      {children && (
        <div className="mt-1">
          {React.Children.map(children, child => 
            React.cloneElement(child, { level: level + 1 })
          )}
        </div>
      )}
      
    </div>
  )
}
```

---

## Page: Invite Modal

Floating modal over dashboard.

```tsx
// components/InviteModal.tsx

{/* Overlay */}
<div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
  
  {/* Modal */}
  <div className="w-full max-w-md bg-bg-secondary border border-white/10 rounded-2xl p-6">
    
    {/* Header */}
    <div className="flex items-center justify-between mb-5">
      <h2 className="text-sm font-medium text-white">Invite to workspace</h2>
      <button className="text-text-tertiary hover:text-text-secondary">
        <XIcon className="w-5 h-5" />
      </button>
    </div>
    
    {/* Input Row */}
    <div className="flex gap-2 mb-3">
      <input 
        type="email"
        placeholder="colleague@company.com"
        className="flex-1 bg-bg-input border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-text-tertiary"
      />
      <select className="bg-bg-secondary border border-white/10 rounded-lg px-3 py-2 text-sm text-white">
        <option>Can Edit</option>
        <option>Can View</option>
      </select>
      <button className="bg-accent text-white rounded-lg px-4 py-2 text-sm font-medium">
        Invite
      </button>
    </div>
    
    {/* Helper */}
    <p className="text-xs text-text-tertiary mb-6">
      Members can access any project in the organization.
    </p>
    
    {/* Footer */}
    <div className="flex items-center justify-between pt-4 border-t border-white/[0.06]">
      <div className="flex items-center gap-2 text-xs text-text-tertiary">
        <InfoIcon className="w-4 h-4" />
        <span>Workspaces are billed by member</span>
      </div>
      <button className="flex items-center gap-1 bg-bg-tertiary border border-white/10 rounded-lg px-3 py-1.5 text-sm text-text-secondary">
        Copy Link
        <ChevronDownIcon className="w-4 h-4" />
      </button>
    </div>
    
  </div>
  
</div>
```

---

## Toast Notification

Fixed position, bottom of screen.

```tsx
// components/Toast.tsx

<div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
  <div className="bg-bg-tertiary border border-white/10 rounded-xl px-4 py-3 flex items-center gap-3">
    <CheckIcon className="w-4 h-4 text-green-400" />
    <span className="text-sm text-white">
      An invitation has been sent to colleague@company.com
    </span>
  </div>
</div>
```

---

## Summary: Key Structural Patterns

| Pattern | Details |
|---------|---------|
| **Sidebar** | 56px wide, icon-only, top icon is accent-colored add button, avatar at bottom |
| **Header** | 56px height, title left, search + actions right |
| **Cards** | #141414 bg, 1px border white/10, 12px radius, thumbnail + info below |
| **Tree items** | Indented 24px per level, chevron + badge + title, bg only on epic and story levels |
| **Badges** | 11px text, 4px radius, colored bg/text matching category |
| **Inputs** | #0D0D0D bg, white/10 border, 8px radius, 12-14px padding |
| **Buttons** | Primary = accent bg, Secondary = transparent + border, 8px radius |
| **Modals** | 16px radius, 24px padding, dark overlay at 80% opacity |
| **Toasts** | 12px radius, centered at bottom, icon + message |
