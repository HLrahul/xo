# ⭕ Multiplayer Tic-Tac-Toe (XO) ❌

A modern, real-time multiplayer game built with a **React** frontend and a server-authoritative **Nakama** backend.

## 🏗️ Project Architecture

This is a mono-repo project split into two main components:

- **[`/client`](./client/README.md)**: The React + TypeScript frontend built with Vite.
- **[`/server`](./server/README.md)**: The Go-based Nakama game server plugin and infrastructure.

## ✨ Key Features

- **Real-time Core**: Powered by WebSockets for instant move synchronization and matchmaking.
- **Server-Authoritative**: Game logic and win conditions are calculated on the server to prevent cheating.
- **Real-time Online Count**: Live tracking of players across all instances using Nakama streams.
- **Graceful Disconnects**: Detection of tab closure or room leaving to notify opponents immediately.
- **Supabase Integration**: Uses Supabase PostgreSQL for persistent user accounts and session storage.
- **Responsive Design**: Premium UI with smooth animations and layout adjustments for mobile.

## 🚀 Quick Start

### 1. Backend Setup
1.  Navigate to `/server`.
2.  Create your `.env` file from `.env.example`.
3.  Run `docker compose up --build`.

### 2. Frontend Setup
1.  Navigate to `/client`.
2.  Install dependencies: `npm install`.
3.  Create your `.env` file from `.env.example`.
4.  Run `npm run dev`.

## 🛠️ Technology Stack

- **Frontend**: React, TypeScript, Vite, Lucide Icons.
- **Backend**: Go (Nakama plugin), Nakama 3.25.0.
- **Database**: PostgreSQL (Supabase).
- **Deployment**: Docker & Docker Compose.

---
Built by Rahul
