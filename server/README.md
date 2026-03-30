# 🎮 Nakama Game Server (Backend) 🚀

This is the server-authoritative backend for the Multiplayer Tic-Tac-Toe game, built using the **Nakama** game server framework and **Go**.

## ✨ Features

- **Server-Authoritative Logic**: Match state and moves are validated on the server to ensure fair play.
- **Real-time Matchmaking**: Uses Nakama's matchmaker to pair players based on criteria.
- **Global Presence Stream**: Implements a custom stream (mode 123) for real-time tracking of all online players.
- **Mid-game Reliability**: Automatically detects when a player disconnects or leaves, notifying the opponent and closing the match cleanly.
- **Cloud Database**: Integrated with **Supabase PostgreSQL** for persistence and user accounts.

## 🚀 Tech Stack

- **Server Core**: [Nakama](https://heroiclabs.com/nakama/) (3.25.0)
- **Language**: [Go](https://golang.org/) (1.23)
- **Database**: [PostgreSQL](https://www.postgresql.org/) (Hosted on Supabase)
- **Containerization**: [Docker](https://www.docker.com/) & [Docker Compose](https://docs.docker.com/compose/)

## 🛠️ Getting Started

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running.
- A **Supabase** project for the PostgreSQL database.

### 1. Environment Configuration

Create a `.env` file in this directory based on `.env.example`:

```env
# Database Configuration (Supabase)
DB_USER=postgres.[PROJECT_REF]
DB_PASSWORD=[YOUR_PASSWORD]
DB_HOST=aws-1-[REGION].pooler.supabase.com
DB_PORT=5432
DB_NAME=postgres

# Security Keys
SESSION_ENCRYPTION_KEY=your-long-secret-key
SOCKET_SERVER_KEY=your-socket-server-key
```

> [!IMPORTANT]
> **Supabase Connection**: Use the **Session Pooler** endpoint (port 5432) instead of the direct database port (6543) to ensure stable IPv4/IPv6 compatibility within Docker.

### 2. Running the Server

Run the following command to build the Go plugin and start the Nakama server:

```bash
docker compose up --build
```

The server will be available at:
- **API**: `http://localhost:7350`
- **Console**: `http://localhost:7351` (Login: `admin` / `password`)

## 📁 Project Structure

- `cmd/plugin/`: Standard Nakama Go entry point.
- `internal/match/`: Core Tic-Tac-Toe match handler (`MatchJoin`, `MatchLeave`, `MatchLoop`).
- `internal/rpc/`: RPC functions for joining the global stream and returning counts.
- `local.yml`: Nakama configuration file (logs, ports, security).

---
Built with ⚡ and Nakama
