# ⭕ Multiplayer Tic-Tac-Toe (Client) ❌

A modern, real-time multiplayer Tic-Tac-Toe game built with **React**, **TypeScript**, and **Vite**, powered by a **Nakama** game server.

## ✨ Features

- **Real-time Matchmaking**: Find opponents instantly using Nakama's matchmaker.
- **Authoritative Gameplay**: Game logic runs on the server to prevent cheating.
- **Live Online Count**: See how many players are online in real-time via WebSocket streams.
- **Opponent Presence**: Get notified immediately if your opponent leaves or disconnects mid-game.
- **Persistent Profiles**: Automatic device-based authentication with customizable nicknames.
- **Premium UI**: Sleek design with smooth transitions, custom icons, and responsive layouts.

## 🚀 Tech Stack

- **Frontend**: [React](https://reactjs.org/) + [TypeScript](https://www.typescriptlang.org/)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Backend Communication**: [@heroiclabs/nakama-js](https://github.com/heroiclabs/nakama-js)

## 🛠️ Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- A running [Nakama Server](../server/README.md)

### Installation

1. Navigate to the client directory:
   ```bash
   cd client
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure the Nakama connection:
   Edit `src/lib/nakamaClient.ts` if you need to change the server host or port (defaults to `localhost:7350`).

4. Start the development server:
   ```bash
   npm run dev
   ```

## 🎮 How to Play

1. **Enter a Nickname**: Set your name to be identified by opponents.
2. **"Let's Play"**: Click the button to enter the matchmaking queue.
3. **Win the Game**: Get three in a row (horizontally, vertically, or diagonally) to win!
4. **Fair Play**: If you leave the room or close the tab, the game ends and your opponent is notified.

---
Built with ❤️ by Rahul
