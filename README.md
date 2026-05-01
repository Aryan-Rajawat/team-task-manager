# TeamFlow — Team Task Manager

A full-stack web application for team project management with role-based access control.

**🌐 Live Demo:** [https://team-task-manager-production-3301.up.railway.app](https://team-task-manager-production-3301.up.railway.app)

![App Preview](https://via.placeholder.com/800x400.png?text=TeamFlow+Task+Manager)

## ✨ Features
- **🔐 Secure Authentication:** JWT-based user Signup/Login.
- **📂 Project Management:** Create, manage, and track team projects.
- **👥 Team Collaboration:** Add members by email and assign project-specific roles.
- **🎯 Interactive Kanban Board:** Drag-and-drop task management (`To Do`, `In Progress`, `Review`, `Done`).
- **📊 Real-time Dashboard:** Track project progress, overdue alerts, and task distribution statistics.
- **🔒 Role-Based Access Control (RBAC):** 
  - **Admins:** Full control over projects, tasks, and team members.
  - **Members:** Can view projects/tasks and update the status of tasks specifically assigned to them.
- **🎨 Premium UI:** Custom-built dark theme with glassmorphism effects and responsive design.

## 🛠️ Tech Stack
- **Backend:** Node.js, Express.js
- **Database:** PostgreSQL (using `pg` driver)
- **Security:** JSON Web Tokens (JWT) + bcryptjs
- **Frontend:** Vanilla HTML/CSS/JS (Single Page Application architecture)
- **Deployment:** Railway

## 🚀 Local Setup Instructions

### Prerequisites
- [Node.js](https://nodejs.org/) (v16 or higher)
- [PostgreSQL](https://www.postgresql.org/) (running locally or via a cloud provider)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Aryan-Rajawat/team-task-manager.git
   cd team-task-manager
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   Copy the example environment file and fill in your details:
   ```bash
   cp .env.example .env
   ```
   *Make sure to update `DATABASE_URL` with your actual local PostgreSQL connection string.*

4. **Initialize the Database**
   This script will automatically create the required tables and schema:
   ```bash
   npm run db:init
   ```

5. **Start the Development Server**
   ```bash
   npm run dev
   ```
   The application will be available at `http://localhost:3000`.

## 📂 Project Structure
- `/server`: Node.js backend logic (API routes, database connection, middleware, schema).
- `/public`: Frontend assets (HTML shell, CSS design system, and Vanilla JS SPA routing logic).

## 📄 License
This project is licensed under the MIT License.
