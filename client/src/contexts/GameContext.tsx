import React, { createContext, useContext, useState, useEffect } from "react";

import { v4 as uuidv4 } from "uuid";
import { Session, type Socket } from "@heroiclabs/nakama-js";

import { nakamaClient } from "../lib/nakamaClient";

interface GameContextType {
  session: Session | null;
  socket: Socket | null;
  username: string | null;
  matchId: string | null;
  setMatchId: (id: string | null) => void;
  authenticate: (username: string) => Promise<void>;
  logout: () => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [matchId, setMatchId] = useState<string | null>(null);

  // Attempt to auto-login if they have a saved UUID
  useEffect(() => {
    let isMounted = true;
    let autoSocket: typeof socket = null;

    const savedId = localStorage.getItem("nakama_device_id");
    if (savedId) {
      nakamaClient
        .authenticateDevice(savedId, false)
        .then(async (newSession) => {
          if (!isMounted) return;
          setSession(newSession);

          const account = await nakamaClient.getAccount(newSession);

          if (!isMounted) return;
          setUsername(account.user?.username || null);

          autoSocket = nakamaClient.createSocket(false, false);
          await autoSocket.connect(newSession, true);

          // Join the global lobby so presence works (but check mounted again)
          if (!isMounted) {
            autoSocket.disconnect(false);
            return;
          }
          await autoSocket.rpc("join_global");
          setSocket(autoSocket);
        })
        .catch(() => {
          if (!isMounted) return;
          localStorage.removeItem("nakama_device_id");
        });
    }

    return () => {
      isMounted = false;
      if (autoSocket) autoSocket.disconnect(false);
    };
  }, []);

  // Manual trigger when user clicks Start Game
  const authenticate = async (newUsername: string) => {
    let savedId = localStorage.getItem("nakama_device_id");
    const isNew = !savedId;

    if (isNew) {
      savedId = uuidv4();
      localStorage.setItem("nakama_device_id", savedId);
    }

    try {
      const newSession = await nakamaClient.authenticateDevice(
        savedId as string,
        true,
        newUsername,
      );
      setSession(newSession);
      setUsername(newUsername);

      const newSocket = nakamaClient.createSocket(false, false);
      await newSocket.connect(newSession, true);
      await newSocket.rpc("join_global");

      setSocket(newSocket);
    } catch (error) {
      if (isNew) {
        localStorage.removeItem("nakama_device_id");
      }
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem("nakama_device_id");

    if (socket) socket.disconnect(false);
    setSession(null);
    setSocket(null);
    setUsername(null);
    setMatchId(null);
  };

  return (
    <GameContext.Provider
      value={{
        session,
        socket,
        username,
        matchId,
        setMatchId,
        authenticate,
        logout,
      }}
    >
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const context = useContext(GameContext);

  if (context === undefined) {
    throw new Error("useGame must be used within a GameProvider");
  }

  return context;
}
