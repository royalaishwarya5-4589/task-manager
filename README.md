# TaskFlow — Task Management Application

TaskFlow is a full-stack task management application built with Next.js, TypeScript, and Supabase.

## Features

- User authentication and account management
- Create, view, edit, and delete tasks
- Task status tracking: Pending, In Progress, and Completed
- Task priorities and due dates
- Search and filter tasks
- Dashboard statistics
- Supabase database integration
- Real-time task updates
- Responsive user interface

## Tech Stack

- Next.js
- React
- TypeScript
- Supabase Authentication
- Supabase PostgreSQL
- Supabase Realtime

## Getting Started

1. Clone this repository.
2. Install dependencies using `npm install`.
3. Configure your Supabase URL and publishable key in `.env.local`.
4. Start the development server using `npm run dev`.
5. Open `http://localhost:3000` in your browser.

## Environment Variables

Configure the following variables in `.env.local` using your own Supabase project credentials:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Never commit `.env.local` or other files containing secrets to GitHub.

## Project

Built as a full-stack task management application for learning and demonstrating authentication, database operations, and real-time updates.
