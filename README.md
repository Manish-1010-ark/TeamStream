# TeamStream

> A modern, all-in-one collaboration suite for remote teams.

[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![Socket.io](https://img.shields.io/badge/Socket.io-black?style=for-the-badge&logo=socket.io&badgeColor=010101)](https://socket.io/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Liveblocks](https://img.shields.io/badge/Liveblocks-000000?style=for-the-badge&logo=liveblocks&logoColor=white)](https://liveblocks.io/)

[Live Demo →](https://team-stream-wine.vercel.app/)

![TeamStream Dashboard](https://raw.githubusercontent.com/Manish-1010-ark/TeamStream/main/screenshots/dashboard.png)

## About the Project

In today's remote work environment, teams find themselves constantly context-switching between 10+ different applications—Slack for messaging, Trello for tasks, Google Docs for documents, Miro for whiteboarding, and Zoom for calls. This fragmented workflow kills productivity, creates information silos, and makes collaboration unnecessarily complex.

**TeamStream** brings all your core collaboration tools under one roof. Built for modern remote teams, it combines real-time chat, task management, document editing, whiteboarding, and video conferencing into a single, unified platform. No more tab-switching, no more lost context—just seamless collaboration.

Whether you're managing a sprint, brainstorming ideas, or catching up with your team, TeamStream provides everything you need in one beautiful, intuitive interface.

## ✨ Core Features

- 🔐 **Authentication** - Complete user authentication flow with signup, login, password recovery, and secure session management powered by Supabase Auth.

- 🏢 **Workspace Management** - Create unlimited workspaces for different teams or projects. Invite members and switch between workspaces seamlessly from a unified dashboard.

- 💬 **Real-time Chat** - Persistent, workspace-wide messaging with instant delivery. Stay connected with your team through Socket.IO-powered real-time communication.

- 📋 **Collaborative Task Board** - Kanban-style task management with multiple boards per workspace. Drag-and-drop cards, assign team members, and see updates in real-time as your team moves tasks across columns.

- 📝 **Collaborative Documents** - Google Docs-style rich text editing with real-time collaboration. See your teammates' cursors, edits, and selections as they type, powered by TipTap and Liveblocks.

- 🎨 **Collaborative Whiteboard** - Full-featured digital whiteboard for visual collaboration. Draw shapes, add text, create arrows, resize elements, and see everyone's cursors in real-time with Liveblocks.

- 📹 **Video Conferencing** - Google Meet-style video calls with pre-call device checks, waiting lobby, and live participant management. Built with PeerJS for peer-to-peer connections and Socket.IO for signaling.

- 👥 **Workspace Info & Presence** - View workspace details, manage members, and see who's online with real-time presence indicators. Know at a glance who's available for collaboration.

## 🛠️ Tech Stack

### Frontend

- **React** - UI library for building interactive interfaces
- **Vite** - Lightning-fast build tool and dev server
- **React Router** - Client-side routing and navigation
- **Tailwind CSS** - Utility-first CSS framework for rapid styling
- **Socket.IO Client** - Real-time bidirectional communication
- **Liveblocks** - Real-time collaboration infrastructure
- **PeerJS** - WebRTC peer-to-peer connections for video/audio
- **TipTap** - Headless rich-text editor framework
- **@dnd-kit/core** - Drag-and-drop functionality for Kanban boards

### Backend

- **Node.js** - JavaScript runtime environment
- **Express** - Minimal and flexible web application framework
- **Socket.IO** - Real-time event-based communication
- **Supabase** - PostgreSQL database and authentication service
- **Liveblocks (Node SDK)** - Server-side collaboration API
- **JWT** - Secure token-based authentication

## 🖼️ Screenshots

<details>
<summary>Click to expand screenshots gallery</summary>

<table>
  <tr>
    <td align="center">
      <img src="https://raw.githubusercontent.com/Manish-1010-ark/TeamStream/main/screenshots/landing_page.png" alt="Landing Page" width="400"/>
      <br />
      <sub><b>Landing Page</b></sub>
    </td>
    <td align="center">
      <img src="https://raw.githubusercontent.com/Manish-1010-ark/TeamStream/main/screenshots/login.png" alt="Login" width="400"/>
      <br />
      <sub><b>Login & Authentication</b></sub>
    </td>
  </tr>
  <tr>
    <td align="center">
      <img src="https://raw.githubusercontent.com/Manish-1010-ark/TeamStream/main/screenshots/dashboard.png" alt="Dashboard" width="400"/>
      <br />
      <sub><b>Workspace Dashboard</b></sub>
    </td>
    <td align="center">
      <img src="https://raw.githubusercontent.com/Manish-1010-ark/TeamStream/main/screenshots/chat.png" alt="Chat" width="400"/>
      <br />
      <sub><b>Real-time Chat</b></sub>
    </td>
  </tr>
  <tr>
    <td align="center">
      <img src="https://raw.githubusercontent.com/Manish-1010-ark/TeamStream/main/screenshots/taskboard.png" alt="Task Board" width="400"/>
      <br />
      <sub><b>Kanban Task Board</b></sub>
    </td>
    <td align="center">
      <img src="https://raw.githubusercontent.com/Manish-1010-ark/TeamStream/main/screenshots/documents.png" alt="Documents" width="400"/>
      <br />
      <sub><b>Collaborative Documents</b></sub>
    </td>
  </tr>
  <tr>
    <td align="center" colspan="2">
      <img src="https://raw.githubusercontent.com/Manish-1010-ark/TeamStream/main/screenshots/whiteboard.png" alt="Whiteboard" width="400"/>
      <br />
      <sub><b>Collaborative Whiteboard</b></sub>
    </td>
  </tr>
</table>

</details>

## 🚀 Getting Started

Follow these steps to get TeamStream running on your local machine.

### Prerequisites

Before you begin, ensure you have the following installed and set up:

- **Node.js** (v16 or higher) - [Download here](https://nodejs.org/)
- **npm** or **yarn** package manager
- **Supabase Account** - [Sign up for free](https://supabase.com/)
- **Liveblocks Account** - [Sign up for free](https://liveblocks.io/)

### Backend Setup

1. Navigate to the backend directory:

   ```bash
   cd backend
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create your environment file:

   ```bash
   cp .env.example .env
   ```

4. Configure your environment variables in `backend/.env`:

   - **`SUPABASE_URL`** - Your Supabase project URL (found in Project Settings → API)
   - **`SUPABASE_KEY`** - Your Supabase service role key (found in Project Settings → API)
   - **`LIVEBLOCKS_SECRET_KEY`** - Your Liveblocks secret key (found in Liveblocks Dashboard → API Keys)
   - **`JWT_SECRET`** - A secure random string for signing JWT tokens (generate one with `openssl rand -base64 32`)

5. Start the backend development server:

   ```bash
   npm run dev
   ```

   The backend server should now be running on `http://localhost:3001`

### Frontend Setup

1. Navigate to the frontend directory:

   ```bash
   cd frontend
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create your environment file:

   ```bash
   cp .env.example .env
   ```

4. Configure your environment variables in `frontend/.env`:

   - **`VITE_API_URL`** - Backend API URL (default: `http://localhost:3001`)
   - **`VITE_SUPABASE_URL`** - Your Supabase project URL (same as backend)
   - **`VITE_SUPABASE_ANON_KEY`** - Your Supabase anon/public key (found in Project Settings → API)

5. Start the frontend development server:

   ```bash
   npm run dev
   ```

   The frontend application should now be running on `http://localhost:5173`

6. Open your browser and navigate to `http://localhost:5173` to see TeamStream in action!

## 🔑 Environment Variables

### Backend (`backend/.env.example`)

```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_KEY=your_supabase_service_role_key
LIVEBLOCKS_SECRET_KEY=your_liveblocks_secret_key
JWT_SECRET=your_jwt_secret_string
```

**Where to find these values:**

- `SUPABASE_URL` and `SUPABASE_KEY`: Supabase Dashboard → Project Settings → API
- `LIVEBLOCKS_SECRET_KEY`: Liveblocks Dashboard → Project → API Keys
- `JWT_SECRET`: Generate a secure random string (e.g., using `openssl rand -base64 32`)

### Frontend (`frontend/.env.example`)

```env
VITE_API_URL=http://localhost:3001
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

**Where to find these values:**

- `VITE_API_URL`: Your backend server URL (use `http://localhost:3001` for local development)
- `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`: Supabase Dashboard → Project Settings → API

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---

**Built with ❤️ for remote teams everywhere**
