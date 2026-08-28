# Task Assignment Dashboard (Take-Home Assessment)

A polished, full-stack internal admin dashboard built with **Next.js 15+ (App Router)**, **TypeScript**, and **Tailwind CSS**. Designed for engineering and operations leads to seamlessly manage team assignees, create and track deliverables, and monitor project health.

---

## Admin Login Credentials

- **Email**: `admin@example.com`
- **Password**: `password123`

> **Convenience Feature**: The login screen features a 1-click **"Auto-fill Demo Credentials"** button for quick evaluator testing.

---

## Key Features

### 1. Authentication & Route Guarding
- Credentials-based authentication flow backed by server API validation (`/api/auth/login`) and session cookies.
- Server + client-side route protection: unauthenticated users accessing `/dashboard`, `/tasks`, or `/assignees` are redirected to `/login`.
- Session persistence across page reloads.

### 2. Main Dashboard (`/dashboard`)
- **4-Column Metric Cards**: Total Tasks, In Progress Tasks, Completed Tasks, and Active Assignees with live progress metrics and completion rate calculations.
- **Recent Activity Stream**: Real-time audit log of task creations, assignments, status transitions, and team member updates.
- **Deadline Warning Panel**: Clear distinction between **Overdue Tasks** (requiring immediate action) and **Upcoming Deadlines** with countdown tags.
- **Team Workload Distribution**: Visual capacity breakdown per team member showing active vs. completed tasks.

### 3. Task Management (`/tasks` & `/tasks/[id]`)
- **Dual View Modes**:
  - **Data Table View**: Sortable columns (by Title, Priority, Due Date), inline status selectors, assignee previews, and quick action menus.
  - **Kanban Board View**: Column lanes for `Todo`, `In Progress`, and `Completed` with drag-and-drop or one-click status transitions.
- **Multi-Filter Toolbar**: Filter by text search, status (`Todo`, `In Progress`, `Completed`), priority (`Low`, `Medium`, `High`), and assignee (`All`, `Unassigned`, or individual members).
- **Task Modal**: Create and edit tasks with validation for title, description, assignee, priority radio group, status, and due date shortcuts (`Today`, `Tomorrow`, `+1 Wk`).
- **Task Details View (`/tasks/[id]`)**: Full metadata breakdown, assignee contact card, dynamic reassignment, activity timeline, and internal notes log.

### 4. Assignee Management (`/assignees` & `/assignees/[id]`)
- **Assignee Cards Grid**: Displays name, email, role/job title, department, avatar color badge, and active task count.
- **Assignee Modal**: Create and edit team member profiles with email validation and avatar theme customization.
- **Assignee Profile (`/assignees/[id]`)**: Overview hero banner with stats and a dedicated table of all tasks assigned to the member.
- **Documented Deletion Policy**:
  > When an assignee is deleted, all their active tasks are **automatically set to `Unassigned`** (rather than dropped) and an audit entry is logged. The confirmation modal explicitly displays how many active tasks will be safely preserved.

### 5. UI/UX & Micro-interactions
- **Dark & Light Mode**: Seamless dark mode support using Slate/Zinc corporate SaaS tokens and CSS theme persistence.
- **Status & Priority Color Contrast**:
  - Priorities: Low (`bg-slate-100 text-slate-700`), Medium (`bg-amber-100 text-amber-800 border-amber-300`), High (`bg-rose-100 text-rose-800 border-rose-300`).
  - Statuses: Todo (`bg-blue-50 text-blue-700`), In Progress (`bg-purple-50 text-purple-700`), Completed (`bg-emerald-50 text-emerald-700`).
- **Skeletons & Empty States**: Polished loading skeletons for tables/cards and helpful contextual empty states with action triggers.
- **Toast Notifications**: Interactive toast alerts for all mutations (creates, updates, status changes, deletions, and resets).

---


## Setup & Local Development

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start the development server**:
   ```bash
   npm run dev
   ```

3. **Open the application**:
   Navigate to [http://localhost:3000](http://localhost:3000) and sign in with the admin credentials.

4. **Production Build**:
   ```bash
   npm run build
   npm start
   ```

---

## Key Technical Decisions

1. **Next.js App Router API Handlers**: Built REST API route handlers (`app/api/*`) for strict separation of concerns between presentation, validation, and data mutations.
2. **Server-Side Input Validation**: All POST/PUT/PATCH endpoints validate required fields, string lengths, valid enum types (`Priority`, `Status`), and email format before writing to storage.
3. **Optimistic Updates & Event Syncing**: State mutations update the local view smoothly and dispatch cross-component refresh events (`taskflow:task-updated`, `taskflow:assignee-updated`).
4. **Relational Integrity on Deletion**: Decided on the "Safe Unassign" policy when deleting assignees to guarantee zero data loss in internal operational workflows.
5. **Accessibility & Contrast**: Explicit high-contrast color badges, focus rings, semantic table headers, and keyboard shortcuts (`Escape` to close modals, `Enter` to submit).


### Environment Variables

Create a `.env.local` file in the root directory and add the following keys:

```env
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/taskflow
JWT_SECRET=your_super_secret_jwt_key