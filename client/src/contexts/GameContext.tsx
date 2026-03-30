import React, { createContext, useContext, useState, useEffect } from "react";

import { v4 as uuidv4 } from "uuid";
import { Session, type Socket } from "@heroiclabs/nakama-js";

import { nakamaClient } from "../lib/nakamaClient";


interface GameContextType {
  session: Session | null;
  socket: Socket | null;
  username: string | null;
  opponentUsername: string | null;
  matchId: string | null;
  onlineCount: number;
  setMatchId: (id: string | null) => void;
  setOpponentUsername: (name: string | null) => void;
  authenticate: (username: string) => Promise<void>;
  logout: () => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [opponentUsername, setOpponentUsername] = useState<string | null>(null);
  const [matchId, setMatchId] = useState<string | null>(null);
  const [onlineCount, setOnlineCount] = useState<number>(0);

  useEffect(() => {
    if (!socket) {
      setOnlineCount(0);
      return;
    }

    const selfUserId = session?.user_id;

    socket.onstreampresence = (event) => {
      if (event.stream?.mode !== 123) return;

      // Filter out self — initial count from join_global already includes us
      const joins = (event.joins || []).filter((p) => p.user_id !== selfUserId);
      const leaves = (event.leaves || []).filter(
        (p) => p.user_id !== selfUserId,
      );

      if (joins.length === 0 && leaves.length === 0) return;

      setOnlineCount((prev) =>
        Math.max(0, prev + joins.length - leaves.length),
      );
    };

    return () => {
      socket.onstreampresence = () => {};
    };
  }, [socket, session]);

  // Joins the global stream and sets the authoritative initial count from the RPC.
  // The onstreampresence listener (set via useEffect) filters self-events,
  // so the RPC count is the single source of truth for the initial value.
  const joinGlobalAndSetCount = async (sock: Socket) => {
    try {
      const res = await sock.rpc("join_global");
      const payload = res.payload;
      if (payload) {
        const data =
          typeof payload === "string" ? JSON.parse(payload) : payload;
        // Override with authoritative count from server (self-join event already filtered)
        setOnlineCount(data.online_count || 0);
      }
    } catch (e) {
      console.error("Failed to join global stream", e);
    }
  };

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

          if (!isMounted) {
            autoSocket.disconnect(false);
            return;
          }

          // Set socket first so onstreampresence listener is attached,
          // then call RPC — the RPC response overwrites any race-counted self-join
          setSocket(autoSocket);
          await joinGlobalAndSetCount(autoSocket);
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

      setSocket(newSocket);
      await joinGlobalAndSetCount(newSocket);
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
    setOpponentUsername(null);
    setMatchId(null);
    setOnlineCount(0);
  };

  return (
    <GameContext.Provider
      value={{
        session,
        socket,
        username,
        opponentUsername,
        matchId,
        onlineCount,
        setMatchId,
        setOpponentUsername,
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
