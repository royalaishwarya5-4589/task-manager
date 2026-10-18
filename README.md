# TaskFlow — Full-Stack Task Management System

A modern, database-driven task management application built with **Next.js, React, TypeScript, and Supabase**. TaskFlow provides a centralized dashboard for organizing tasks, managing priorities, tracking progress, and monitoring deadlines.

## Overview

TaskFlow simplifies everyday task management through user authentication, persistent database storage, task lifecycle management, search, filtering, and dashboard statistics.

This project demonstrates practical full-stack development concepts, including client-side state management, authentication integration, CRUD operations, PostgreSQL database integration, and real-time event handling.

## Key Features

- **User Authentication:** Account registration, sign-in, and account recovery.
- **Task CRUD Operations:** Create, view, update, and delete tasks.
- **Task Status Management:** Track tasks as Pending, In Progress, or Completed.
- **Priority Management:** Assign Low, Medium, or High priority.
- **Deadline Tracking:** Set due dates and identify overdue tasks.
- **Search and Filtering:** Find tasks using search terms and status filters.
- **Dashboard Analytics:** View task totals, task statuses, and overdue counts.
- **Real-Time Updates:** Synchronize database changes using Supabase Realtime, when configured.
- **Responsive Interface:** Manage tasks across desktop and mobile screen sizes.
- **Cloud Database:** Persist task data using Supabase PostgreSQL.

## Technology Stack

| Category | Technology |
|---|---|
| Framework | Next.js |
| UI Library | React |
| Language | TypeScript |
| Backend Services | Supabase |
| Database | PostgreSQL |
| Authentication | Supabase Auth |
| Real-Time Updates | Supabase Realtime |
| Package Manager | npm |
| Version Control | Git and GitHub |

## Application Architecture

TaskFlow uses a modern web application architecture:

1. **Presentation Layer:** Next.js and React render the user interface.
2. **Application Layer:** TypeScript manages application logic, forms, and task operations.
3. **Authentication Layer:** Supabase Auth manages user authentication and sessions.
4. **Data Layer:** PostgreSQL stores task records and related information.
5. **Real-Time Layer:** Supabase Realtime delivers database change events to subscribed clients when enabled.

## Task Workflow

Each task can contain:

- Title
- Description
- Status
- Priority
- Due date
- Creation timestamp

Tasks can move through the following workflow:

`Pending` → `In Progress` → `Completed`

## Project Structure

```text
task-manager/
├── public/
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── globals.css
│   └── lib/
│       └── supabase.ts
├── .gitignore
├── package.json
├── package-lock.json
├── tsconfig.json
└── README.md
```

*Note: This is a representative structure. Your actual project may contain additional files.*

## Prerequisites

- Node.js and npm
- Git
- A Supabase account and project

## Installation and Setup

### 1. Clone the Repository

```bash
git clone https://github.com/royalaishwarya5-4589/task-manager.git
```

### 2. Navigate to the Project

```bash
cd task-manager
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Configure Environment Variables

Create a `.env.local` file in the project root and add your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_publishable_or_anon_key
```

Replace the placeholders with the correct values from your Supabase project.

**Security:** Never commit `.env.local`, service-role keys, database passwords, or other privileged credentials to GitHub.

### 5. Configure Supabase

In your Supabase project:

1. Create the `tasks` table with the columns expected by the application.
2. Configure Supabase Authentication.
3. Enable Row Level Security (RLS) on the `tasks` table.
4. Configure policies that restrict users to their own task records.
5. Enable the table for Supabase Realtime if the application uses real-time subscriptions.

Ensure that the database column names and data types match the application code.

### 6. Start the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 7. Create a Production Build

```bash
npm run build
```

To run the production build locally:

```bash
npm run start
```

## Environment Variables

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase client publishable or legacy anonymous key |

Variables prefixed with `NEXT_PUBLIC_` are exposed to browser code. Do not place privileged secrets in these variables. Database access must be protected with appropriate authorization and RLS policies.

## Security Considerations

- Keep `.env.local` out of version control.
- Enable and verify RLS policies for user-owned tasks.
- Validate user input before database writes.
- Restrict users to their own task records.
- Never expose Supabase service-role keys in client-side code.
- Test authentication, session expiry, and account recovery.

## Testing Checklist

- [ ] New users can register and existing users can sign in.
- [ ] Account recovery works as expected.
- [ ] Users can create, view, edit, and delete tasks.
- [ ] Status and priority changes persist after refreshing.
- [ ] Search and filtering work correctly.
- [ ] Due dates and overdue indicators are accurate.
- [ ] Real-time updates work if enabled.
- [ ] Users cannot access another user's tasks.
- [ ] The interface works on desktop and mobile.
- [ ] The production build completes successfully.

## Future Enhancements

- Calendar-based task scheduling
- Advanced sorting and filtering
- Task labels and categories
- Notifications and deadline reminders
- Team collaboration and shared projects
- Productivity reports and activity history
- Automated testing and continuous integration

## Project Objectives

TaskFlow was developed to apply modern web development concepts to a practical productivity application. It combines frontend development, authentication, relational database storage, CRUD operations, and real-time synchronization.

## Author

**Jyothi Aiswarya**

GitHub: [@royalaishwarya5-4589](https://github.com/royalaishwarya5-4589)

## Repository

[View TaskFlow on GitHub](https://github.com/royalaishwarya5-4589/task-manager)

---

*TaskFlow — Organize tasks. Track progress. Get things done.*
