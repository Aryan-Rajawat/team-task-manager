# TeamFlow — Team Task Manager

A full-stack web application for team project management with role-based access control.

## Features
- 🔐 JWT Authentication (Signup/Login)
- 📂 Project creation and management
- 👥 Team member management with roles (Admin/Member)
- 📋 Task creation, assignment, and status tracking
- 🎯 Kanban board with drag-and-drop
- 📊 Dashboard with task statistics and overdue alerts
- 🔒 Role-based access control (Admin/Member)

## Tech Stack
- **Backend**: Node.js, Express.js
- **Database**: PostgreSQL
- **Auth**: JWT + bcrypt
- **Frontend**: Vanilla HTML/CSS/JS (SPA)
- **Deployment**: Railway

## Setup
1. Clone the repo
2. `npm install`
3. Set environment variables (see `.env.example`)
4. `npm start`

## Environment Variables
- `DATABASE_URL` — PostgreSQL connection string
- `JWT_SECRET` — Secret key for JWT signing
- `PORT` — Server port (default: 3000)
