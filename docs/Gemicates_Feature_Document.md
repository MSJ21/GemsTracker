# Gemicates — Complete Product Feature Document

**Product Name:** Gems Tracker  
**Full Brand Name:** Gemicates  
**Version:** 2.0  
**Document Type:** Product Feature Specification  
**Date:** April 2026

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Product Vision & Goals](#2-product-vision--goals)
3. [User Roles & Access Control](#3-user-roles--access-control)
4. [Core Modules & Features](#4-core-modules--features)
   - 4.1 Authentication & Profile
   - 4.2 Task Management
   - 4.3 Project Management
   - 4.4 Sprint & Agile Planning
   - 4.5 Time Tracking
   - 4.6 Goals & OKRs
   - 4.7 Reporting & Analytics
   - 4.8 Team & Organization
   - 4.9 Notifications & Announcements
   - 4.10 Admin Control Panel
   - 4.11 Personal Productivity Tools
5. [Feature Matrix by Role](#5-feature-matrix-by-role)
6. [Technical Architecture](#6-technical-architecture)
7. [Data Models Overview](#7-data-models-overview)
8. [API Reference Summary](#8-api-reference-summary)
9. [Security & Compliance](#9-security--compliance)
10. [Glossary](#10-glossary)

---

## 1. Executive Summary

**Gemicates** (branded as **Gems Tracker**) is an all-in-one project and task management platform built for modern teams. It combines the simplicity of individual task tracking with the power of Agile sprint planning, OKR goal management, organizational hierarchy, real-time notifications, and deep analytics — all under a single unified interface.

Gemicates is designed to serve both **administrators** who need organizational visibility and control, and **team members** who need a focused, distraction-free workspace to manage their daily work.

### Key Highlights

| Metric | Value |
|--------|-------|
| Total API Endpoints | 150+ |
| Core Modules | 12 |
| Frontend Pages | 23 |
| Database Models | 25+ |
| Supported Roles | Admin, Manager, Member |
| Export Formats | CSV, Excel (.xlsx), PDF |
| Auth Method | JWT (24-hour tokens) |

---

## 2. Product Vision & Goals

### Vision
To provide teams of every size with a unified workspace that connects daily work to long-term organizational objectives — with Agile tooling, time intelligence, and transparent reporting built in from day one.

### Core Goals
- **Clarity** — Every team member sees exactly what they need to do today, this week, and this sprint.
- **Accountability** — Audit logs, time tracking, and activity histories make work visible and measurable.
- **Agility** — Native sprint management, backlog grooming, and kanban boards support Scrum teams out of the box.
- **Alignment** — OKR Goals connect individual task work to company-level objectives.
- **Simplicity** — A clean, fast UI with keyboard shortcuts, quick filters, and saved presets minimizes friction.

---

## 3. User Roles & Access Control

Gemicates implements a **two-tier role system** with granular, module-level permissions.

### 3.1 Administrator
Full system access including:
- Create and manage Entities, Projects, Users
- Configure site settings, mail settings, task statuses
- View all tasks, reports, and audit logs across all users
- Manage announcements
- View and edit the organizational hierarchy
- Review and approve leave requests

### 3.2 User (Team Member)
Scoped access to assigned work:
- View only their assigned projects
- Create, edit, and delete their own tasks
- Participate in sprints (if project manager)
- Log time, add comments, manage subtasks
- View personal reports and dashboards
- Manage own profile, notes, and filter presets

### 3.3 Project Manager (within a project)
Elevated access at the project level:
- Create and manage sprints
- Add/remove project members
- Assign tasks to team members
- Start and complete sprints
- Edit or delete sprint issues

### 3.4 Access Summary

| Action | Admin | Manager | Member |
|--------|-------|---------|--------|
| Manage Entities | ✅ | ❌ | ❌ |
| Manage Projects | ✅ | ❌ | ❌ |
| Manage Users | ✅ | ❌ | ❌ |
| Manage Site Settings | ✅ | ❌ | ❌ |
| View All Reports | ✅ | ❌ | ❌ |
| Create Sprints | ✅ | ✅ | ❌ |
| Assign Tasks | ✅ | ✅ | ❌ |
| Add Project Members | ✅ | ✅ | ❌ |
| Create/Edit Own Tasks | ✅ | ✅ | ✅ |
| Log Time | ✅ | ✅ | ✅ |
| View Personal Reports | ✅ | ✅ | ✅ |
| Create Announcements | ✅ | ❌ | ❌ |
| Review Leave Requests | ✅ | ❌ | ❌ |

---

## 4. Core Modules & Features

---

### 4.1 Authentication & Profile

#### Login
- Email + password authentication
- JWT token issued on successful login (24-hour expiry)
- Token stored client-side; auto-refresh on expiry
- Redirect to role-appropriate dashboard

#### User Profile
- Update display name and email address
- Upload profile avatar (JPEG, PNG, GIF, WebP — max 2 MB)
- Change password (requires current password)
- Profile data reflected system-wide (comments, task assignments, notifications)

---

### 4.2 Task Management

The heart of Gemicates. Every unit of work in the system is a **Task**.

#### Task Fields
| Field | Type | Description |
|-------|------|-------------|
| Title | Text | Required, descriptive task name |
| Description | Rich Text | Optional detail |
| Project | Reference | Which project this task belongs to |
| Issue Type | Enum | Story, Bug, Task, Epic |
| Status | Enum | Configurable (default: Pending, In Progress, Done) |
| Priority | Enum | Low, Medium, High, Critical |
| Hours Spent | Number | 0–24 hours logged |
| Task Date | Date | Date the work was performed |
| Due Date | Date | Optional deadline |
| Assignee | User | Team member responsible |
| Story Points | Number | Agile estimation (0–100) |
| Sprint | Reference | Associated sprint |
| Repeat Type | Enum | Daily, Weekly |
| Repeat Until | Date | End date for recurring tasks |

#### Task Operations
- **Create** — Individual form with all fields, or quick-create from dashboard
- **Edit** — Full field editing with history preserved
- **Delete** — Soft delete with admin restore capability
- **Clone / Recur** — Generate daily or weekly recurring instances
- **Bulk Import** — Upload Excel (.xlsx) file with task rows
- **Bulk Delete** — Select multiple tasks and delete in one action
- **Export** — Download filtered task list as Excel or PDF
- **Cycle Status** — Click status badge to advance through statuses in sequence

#### Task Views
- **List View** — Sortable, paginated table with all columns
- **Kanban View** — Drag-and-drop cards grouped by status columns (columns reflect custom statuses)

#### Task Filters
- Project
- Status (custom-configurable)
- Priority
- Date range (with quick presets: Today, This Week, This Month)
- Free-text search (title, project name)
- Saved filter presets (named, reusable)

#### Task Detail
Clicking any task opens the **Task Detail Modal** with:
- Full description
- Subtask checklist
- Comments thread
- Active timer controls
- Time entry history
- Task links/dependencies
- Watcher list
- Activity/audit log

#### Subtasks
- Add multiple subtasks to any task
- Mark subtasks as done (progress shown as badge on parent)
- Drag to reorder subtasks
- Subtask completion count displayed on parent card

#### Comments
- Add threaded comments on any task
- Edit or delete own comments
- Admin can delete any comment
- Timestamp + avatar shown per comment

#### Task Links / Dependencies
| Link Type | Description |
|-----------|-------------|
| relates_to | General relationship |
| depends_on | This task depends on another |
| blocks | This task blocks another |
| duplicates | This task is a duplicate of another |

#### Task Watchers
- Any user can watch a task
- Watchers receive notifications when task is updated
- Show/hide watcher list in task detail

#### Task Activity Log
- Automatic audit trail for every task change
- Records: field changed, old value, new value, who made the change, timestamp

---

### 4.3 Project Management

#### Project Fields
| Field | Type | Description |
|-------|------|-------------|
| Name | Text | Project name |
| Description | Text | Optional description |
| Entity | Reference | Parent entity/business unit |
| Status | Enum | Active, On Hold, Completed |
| Start Date | Date | Project kick-off date |
| End Date | Date | Target completion date |

#### Project Features
- Admins create and manage all projects
- Projects are scoped under **Entities** (business units)
- Users see only projects they are assigned to
- **Project Member Roles** — Each member has a role: Manager or Member
- **Milestone Tracking** — Named milestones with due dates and status (Open / Completed)
- **Task Aggregation** — Total tasks, completed tasks, total hours shown per project
- **Pinned Projects** — Users can pin up to N projects for quick dashboard access

#### Project Dashboard Stats
- Task completion percentage
- Hours logged
- Number of active sprints
- Milestone status overview

---

### 4.4 Sprint & Agile Planning

Full Scrum-style sprint management is built into every project.

#### Sprint Lifecycle
```
Planning ──► Active ──► Completed
```

| Status | Description |
|--------|-------------|
| Planning | Sprint is being set up; tasks can be added |
| Active | Sprint is running; team is working on tasks |
| Completed | Sprint is finished; tasks can be reviewed |

#### Sprint Fields
| Field | Description |
|-------|-------------|
| Name | Sprint identifier (e.g., "Sprint 1") |
| Goal | Optional text goal for the sprint |
| Start Date | When the sprint begins |
| End Date | When the sprint ends |
| Story Points | Total vs. Done (auto-calculated) |
| Task Count | Issues in sprint vs. done |

#### Sprint Kanban Board
- Columns driven by **custom task statuses** (configured in Settings)
- **Drag-and-drop** cards between status columns
- Optimistic UI updates (instant visual feedback, background sync)
- Cards show: issue type icon, title, priority dot, story points, subtask count, time logged, due date, assignee avatar

#### Sprint Issue Cards
- **Click** to open full Task Detail modal
- **Edit** — Pencil icon (managers only)
- **Delete** — Trash icon with confirmation dialog (managers only)
- **Drag** — Reorder or move between columns

#### Backlog
- Tasks not assigned to any sprint appear in the **Backlog**
- Managers can select backlog tasks and move them to a sprint
- Backlog grouped per project

#### Create Issue Modal
- Issue type selector (Story, Bug, Task, Epic)
- Title, description, status, priority, story points, due date
- Assignee picker (visual member list)
- Status options reflect custom statuses from Settings

#### Sprint Stats
- Progress bar showing story point completion percentage
- Issue type breakdown badges (count per type)
- Date range displayed in sprint header

---

### 4.5 Time Tracking

#### Manual Logging
- Every task records **Hours Spent** (0–24)
- Logged at time of task creation or update
- Aggregated in reports and dashboards

#### Active Timer
- Start a live timer on any task
- Only one timer can run at a time per user
- **Stop** to record the elapsed time as seconds
- Timer entries listed in Task Detail
- Active timer visible system-wide (persists on navigation)

#### Time Reports
- **Weekly summary**: this week vs. last week hours
- **Hours by project**: breakdown per project
- **Admin view**: all users' hours, filterable

---

### 4.6 Goals & OKRs

Gemicates includes a full **Objectives and Key Results (OKR)** module.

#### Goal Fields
| Field | Description |
|-------|-------------|
| Title | Objective statement |
| Description | Additional context |
| Owner | User responsible |
| Due Date | Target date |
| Status | Active / Completed |
| Progress | Auto-calculated from key results (%) |

#### Key Results
Each goal can have multiple Key Results:
| Field | Description |
|-------|-------------|
| Title | What we're measuring |
| Target | The goal value |
| Current Value | Current progress |
| Unit | E.g., %, users, revenue |

- Progress percentage auto-calculated as `(current / target * 100)%`
- Goal progress = average of all key result progress values

#### OKR Views
- List all goals with progress bars
- Expand individual goal to see/edit key results
- Quick update: inline current value editing

---

### 4.7 Reporting & Analytics

#### Admin Reports
- **All Tasks Report** — Full task list with filters (user, project, status, priority, date range)
- **User Activity Table** — Tasks logged per user per day
- **Tasks per Project** — Distribution across projects
- **Hours by Project** — Time investment breakdown
- **CSV Export** — Download filtered report

#### User Reports
- **Personal Task Summary** — All own tasks
- **Status Summary** — Count by status (pending, in-progress, done)
- **Hours by Project** — Own time per project
- **Weekly Summary** — This week vs. last week

#### Dashboard Analytics (Admin)
- Total users, entities, projects, tasks
- Deadline alerts (projects overdue)
- Recent task activity
- User activity heatmap

#### Dashboard Analytics (User)
- **Activity Streak** — Consecutive days with at least one task logged
- Weekly task count (this week vs. last week)
- Quick stats (today's tasks, pending, in-progress)
- Pinned projects with completion indicators
- Mini calendar view

---

### 4.8 Team & Organization

#### Entities
Top-level organizational units (business divisions, departments):
- Create, edit, delete, restore entities
- Each project belongs to one entity
- Users can be assigned to multiple entities

#### Departments
Sub-unit organizational structure:
- Hierarchical (parent-child departments)
- Department head assignment
- Nested structure for large organizations

#### Org Chart
- Visual tree of all users and their managers
- Admin can drag-and-drop to reassign managers
- Recursive hierarchy rendered as collapsible tree

#### Leave Management
| Leave Type | Description |
|------------|-------------|
| Annual | Paid time off |
| Sick | Medical leave |
| Personal | Personal days |

- Team members submit leave requests with date range and reason
- Admins review (Approve / Reject)
- Status: Pending → Approved / Rejected
- History of all requests visible to admin

#### Project Members
- Admins assign users to projects
- Each member gets a role: **Manager** or **Member**
- Managers get elevated actions within the project (sprint management, issue edit/delete)
- Member list shown on project and sprint views

---

### 4.9 Notifications & Announcements

#### Notifications
Automatic, real-time notifications for key events:
| Trigger | Notification |
|---------|-------------|
| Task assigned to you | "You have been assigned to: [Task]" |
| Added to a project | "You have been added to project: [Project]" |
| New sprint started | "Sprint [Name] has started" |
| New announcement | "New announcement: [Title]" |

- Bell icon with unread count badge
- Mark individual notifications as read
- Mark all as read
- Link to relevant page embedded in notification

#### Announcements
- Admins create announcements with title and body
- All active users receive a notification immediately on publish
- Announcements page shows read/unread status per user
- Admins can delete announcements

---

### 4.10 Admin Control Panel

#### Site Settings
- **Site Name** — Displayed in header and browser title
- **Site Logo** — Upload custom logo (file upload with preview)
- **Task Statuses** — Configure custom status labels (e.g., "Review", "Blocked") that replace defaults across all task views, Kanban columns, and sprint boards
- Remove logo option

#### Mail Settings (SMTP)
- SMTP Host, Port, Username, Password
- Sender name and from address
- App URL configuration
- **Test Email** — Send a test email to the logged-in admin
- Config persisted to `.env` file

#### Audit Log
- Entity-level change history
- Records: entity type, entity ID, action (create/update/delete), user, changes diff, timestamp
- Filterable by entity type, entity ID

#### User Management
- Full user CRUD with soft delete and restore
- Send **invite email** when creating a new user (with temporary password link)
- Assign users to projects and entities
- Upload user avatar
- Toggle user status (active / inactive)

---

### 4.11 Personal Productivity Tools

#### Notes
- Private, per-user notes
- Title and body
- Pin important notes to top
- Quick access from sidebar

#### Filter Presets
- Save complex task filter combinations as named presets
- Load a preset to instantly re-apply all filters
- Delete presets when no longer needed

#### Pinned Projects
- Pin frequently-used projects for quick navigation
- Pinned projects shown on user dashboard
- Show task completion progress per pinned project

#### Keyboard Shortcuts
| Shortcut | Action |
|----------|--------|
| `T` | New task (Tasks page) |
| `Ctrl + N` | New task (Tasks page) |

---

## 5. Feature Matrix by Role

| Feature | Admin | Manager | Member |
|---------|-------|---------|--------|
| **TASKS** | | | |
| Create tasks | ✅ | ✅ | ✅ |
| Edit own tasks | ✅ | ✅ | ✅ |
| Delete own tasks | ✅ | ✅ | ✅ |
| Edit any task | ✅ | ❌ | ❌ |
| Delete any task | ✅ | ❌ | ❌ |
| Bulk import (Excel) | ✅ | ✅ | ✅ |
| Export tasks | ✅ | ✅ | ✅ |
| Assign tasks to others | ✅ | ✅ | ❌ |
| Spawn recurring tasks | ✅ | ❌ | ❌ |
| **SPRINTS** | | | |
| Create sprint | ✅ | ✅ | ❌ |
| Edit sprint | ✅ | ✅ | ❌ |
| Start / Complete sprint | ✅ | ✅ | ❌ |
| Add issues to sprint | ✅ | ✅ | ❌ |
| Edit sprint issues | ✅ | ✅ | ❌ |
| Delete sprint issues | ✅ | ✅ | ❌ |
| View sprint board | ✅ | ✅ | ✅ |
| Drag issues between columns | ✅ | ✅ | ❌ |
| **PROJECTS** | | | |
| Create / edit projects | ✅ | ❌ | ❌ |
| Add project members | ✅ | ✅ | ❌ |
| Set member roles | ✅ | ✅ | ❌ |
| Create milestones | ✅ | ✅ | ❌ |
| **ADMIN** | | | |
| Manage users | ✅ | ❌ | ❌ |
| Manage entities | ✅ | ❌ | ❌ |
| Site settings | ✅ | ❌ | ❌ |
| Mail settings | ✅ | ❌ | ❌ |
| View audit log | ✅ | ❌ | ❌ |
| Create announcements | ✅ | ❌ | ❌ |
| Manage org chart | ✅ | ❌ | ❌ |
| Review leave requests | ✅ | ❌ | ❌ |
| **PERSONAL** | | | |
| Notes | ✅ | ✅ | ✅ |
| Filter presets | ✅ | ✅ | ✅ |
| Pin projects | ✅ | ✅ | ✅ |
| Profile settings | ✅ | ✅ | ✅ |
| Submit leave | ✅ | ✅ | ✅ |
| OKR Goals | ✅ | ✅ | ✅ |
| Personal reports | ✅ | ✅ | ✅ |
| Admin reports | ✅ | ❌ | ❌ |

---

## 6. Technical Architecture

### Stack
| Layer | Technology |
|-------|------------|
| Frontend | React 18 + TypeScript, Vite |
| State Management | TanStack React Query v5, Zustand |
| Forms | React Hook Form + Zod validation |
| UI | Tailwind CSS v3 |
| Drag & Drop | @dnd-kit/core |
| Backend | PHP (Custom MVC Framework) |
| Database | PostgreSQL |
| Auth | JWT (Custom Core\JWT) |
| File Storage | Local server storage |
| Mail | SMTP (configurable via admin panel) |

### Architecture Pattern
```
Browser (React SPA)
       │
       ▼
REST API (PHP Router)
       │
       ▼
Controllers (Business Logic)
       │
       ▼
Models (Core\Model — PDO/PostgreSQL)
       │
       ▼
PostgreSQL Database
```

### Frontend Architecture
- **Single Page Application** with React Router
- **API layer** — 25 dedicated API client modules (axios-based)
- **Query caching** — TanStack Query with 5-minute stale time for reference data
- **Optimistic updates** — Drag-and-drop status changes update UI immediately
- **Role-based rendering** — Admin/user layouts determined at router level
- **Shared hooks** — `useTaskStatuses`, `usePagination`, `useSort` for reuse

---

## 7. Data Models Overview

### Core Entities

```
Entity
  └── Projects
        ├── ProjectMembers (users with roles)
        ├── Milestones
        ├── Sprints
        │     └── Tasks (sprint issues)
        └── Tasks (backlog)
              ├── Subtasks
              ├── Comments
              ├── TimeEntries
              ├── TaskLinks
              ├── TaskWatchers
              └── TaskActivity

Users
  ├── Notifications
  ├── Announcements (read status)
  ├── Notes
  ├── Goals
  │     └── KeyResults
  ├── FilterPresets
  ├── PinnedProjects
  └── LeaveRequests

System
  ├── Settings (key-value)
  ├── AuditLog
  ├── Departments
  └── Roles / Permissions
```

---

## 8. API Reference Summary

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/login | Login |
| GET | /api/auth/me | Current user |

### Tasks
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/tasks | List tasks |
| POST | /api/tasks | Create task |
| PUT | /api/tasks/{id} | Update task |
| DELETE | /api/tasks/{id} | Delete task |
| POST | /api/tasks/bulk | Bulk create |
| POST | /api/tasks/spawn-recurring | Spawn recurring instances |

### Sprints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/projects/{id}/sprints | List sprints |
| POST | /api/projects/{id}/sprints | Create sprint |
| GET | /api/sprints/{id} | Sprint detail with tasks |
| PUT | /api/sprints/{id} | Update sprint |
| DELETE | /api/sprints/{id} | Delete sprint |
| POST | /api/sprints/{id}/tasks | Add task to sprint |
| GET | /api/projects/{id}/backlog | Get backlog |

### Projects
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/admin/projects | All projects (admin) |
| POST | /api/admin/projects | Create project |
| PUT | /api/admin/projects/{id} | Update project |
| DELETE | /api/admin/projects/{id} | Delete project |
| GET | /api/user/projects | My projects |

### Reports
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/admin/reports | Admin report |
| GET | /api/admin/reports/export | CSV export |
| GET | /api/user/reports | Personal report |

> **Full API Reference:** 150+ endpoints across 30 controllers. Contact the development team for the complete OpenAPI specification.

---

## 9. Security & Compliance

### Authentication
- **JWT tokens** with 24-hour expiry
- Tokens validated on every protected API request
- Password hashing with **bcrypt** (cost factor 12)
- No plaintext credentials stored anywhere

### Authorization
- Role-based middleware on every API route
- Users cannot access other users' data (strict ownership checks)
- Admin-only routes protected at the middleware layer
- Project-manager actions require membership with manager role in the specific project

### Data Protection
- **Soft deletes** — No permanent deletion; all records can be restored
- **Audit log** — Entity-level changes tracked with user attribution
- **File uploads** — MIME type validation, 2MB size limit, server-side only

### Input Validation
- All API inputs sanitized and validated server-side
- Frontend validation via Zod schemas (client-side UX only)
- SQL injection prevention via PDO prepared statements
- XSS prevention via context-aware output encoding

### Mail Security
- SMTP credentials stored in `.env` (not in database)
- Passwords masked in admin mail settings API response

---

## 10. Glossary

| Term | Definition |
|------|------------|
| **Entity** | Top-level organizational unit (e.g., a division or business unit) |
| **Project** | A container for tasks and sprints, belonging to an entity |
| **Sprint** | A time-boxed iteration used in Agile/Scrum development |
| **Backlog** | Tasks not yet assigned to any sprint |
| **Issue** | A task within a sprint context (story, bug, task, or epic) |
| **Story Points** | Relative effort estimate for a task |
| **OKR** | Objectives and Key Results — a goal-setting framework |
| **Milestone** | A significant checkpoint within a project |
| **Watcher** | A user who subscribes to updates on a task |
| **Manager** | A project member with elevated permissions |
| **Soft Delete** | Marking a record as deleted without removing it from the database |
| **Recurring Task** | A task that automatically generates repeated instances (daily/weekly) |
| **Filter Preset** | A saved combination of task filters for quick reuse |
| **Audit Log** | A chronological record of changes made to entities in the system |
| **Activity Streak** | Consecutive days on which a user has logged at least one task |
| **JWT** | JSON Web Token — the authentication mechanism used by the API |

---

*Document prepared for Gemicates — Gems Tracker v2.0*  
*© 2026 Gemicates. All rights reserved.*
