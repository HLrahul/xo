import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { Users, LogOut, Play, Share2 } from "lucide-react";

import { useGame } from "../contexts/GameContext";

import logo from "../assets/xo.jpg";

export default function Home() {
  const {
    session,
    socket,
    setMatchId,
    authenticate,
    logout,
    username,
    onlineCount,
  } = useGame();
  const navigate = useNavigate();

  const [isSearching, setIsSearching] = useState(false);
  const [showNameDialog, setShowNameDialog] = useState(false);
  const [inputName, setInputName] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [showCancelPrompt, setShowCancelPrompt] = useState(false);
  const [matchmakerTicket, setMatchmakerTicket] = useState<string | null>(null);
  const [searchTimeoutId, setSearchTimeoutId] = useState<any>(null);
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    if (socket) {
      socket.onmatchmakermatched = (matchmakerResult) => {
        setIsSearching(false);
        setShowCancelPrompt(false);
        if (searchTimeoutId) clearTimeout(searchTimeoutId);

        setMatchId(matchmakerResult.match_id);
        navigate("/game");
      };
    }
    return () => {
      if (socket) socket.onmatchmakermatched = () => {};
    };
  }, [socket, navigate, setMatchId, searchTimeoutId]);

  const handleStartClick = () => {
    if (session) {
      startMatchmaking();
    } else {
      setErrorMsg("");
      setShowNameDialog(true);
    }
  };

  const handleCreateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputName.trim()) return;
    setErrorMsg("");

    try {
      await authenticate(inputName.trim());

      setShowNameDialog(false);

      startMatchmaking();
    } catch (err: any) {
      let errorStr = "";

      try {
        if (err && typeof err.text === "function") {
          errorStr = await err.text();
        } else if (err && err.message) {
          errorStr = err.message;
        } else {
          errorStr = String(err);
        }
      } catch (parseAttempt) {
        errorStr = String(err);
      }

      if (errorStr.toLowerCase().includes("already in use")) {
        setErrorMsg("Username is already taken. Please choose another.");
      } else {
        setErrorMsg("Failed to create account. Try again.");
      }
    }
  };

  const startMatchmaking = async () => {
    if (!socket) return;
    try {
      setIsSearching(true);
      setShowCancelPrompt(false);

      // Execute matchmaking ticket creation
      const response = await socket.addMatchmaker("*", 2, 2);
      setMatchmakerTicket(response.ticket);

      // Start the 10-second prompt timer
      const tid = setTimeout(() => {
        setShowCancelPrompt(true);
      }, 10000);
      setSearchTimeoutId(tid);
    } catch (e) {
      setIsSearching(false);
      setShowCancelPrompt(false);
      console.error("Failed to join matchmaking", e);
    }
  };

  const handleCancelMatchmaking = async () => {
    if (socket && matchmakerTicket) {
      try {
        await socket.removeMatchmaker(matchmakerTicket);
      } catch (err) {
        console.error("Failed to cancel ticket", err);
      }
    }

    // Reset all searching state
    setIsSearching(false);
    setShowCancelPrompt(false);
    if (searchTimeoutId) clearTimeout(searchTimeoutId);
    setMatchmakerTicket(null);
  };

  const handleShare = async () => {
    const shareData = {
      title: "Play Tic-Tac-Toe",
      text: "Join me for a game of Multiplayer Tic-Tac-Toe!",
      url: window.location.origin,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.error("Error sharing:", err);
      }
    } else {
      // Fallback: Copy to clipboard
      try {
        await navigator.clipboard.writeText(window.location.origin);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      } catch (err) {
        console.error("Failed to copy:", err);
      }
    }
  };

  return (
    <div
      className="container"
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        flex: 1,
      }}
    >
      <div
        style={{
          position: "absolute",
          top: "2rem",
          right: "2rem",
          display: "flex",
          alignItems: "center",
          gap: "1rem",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            color: "var(--muted-foreground)",
          }}
        >
          <Users size={16} />
          <span style={{ fontSize: "0.875rem" }}>
            {Math.max(onlineCount - 1, 0)} Online
          </span>
        </div>

        <button
          onClick={handleShare}
          className="button secondary"
          style={{
            padding: "0 0.5rem",
            height: "2rem",
            display: "flex",
            alignItems: "center",
            gap: "0.4rem",
            fontSize: "0.8rem",
            color: isCopied ? "#10b981" : "var(--foreground)",
          }}
          title="Share Game URL"
        >
          <Share2 size={14} />
          {isCopied ? "Copied!" : "Share"}
        </button>

        {session && username && (
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <span style={{ fontSize: "0.875rem", fontWeight: 500 }}>
              {username}
            </span>
            <button
              onClick={logout}
              className="button secondary"
              style={{ padding: "0 0.5rem", height: "2rem" }}
              title="Logout / Delete Profile"
            >
              <LogOut size={14} />
            </button>
          </div>
        )}
      </div>

      <div
        className="card"
        style={{ width: "100%", maxWidth: "400px", textAlign: "center" }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            marginBottom: "1rem",
          }}
        >
          <img
            src={logo}
            alt="XO Game Logo"
            style={{
              width: "80px",
              height: "80px",
              objectFit: "cover",
              borderRadius: "1rem",
              boxShadow: "0 8px 16px rgba(0,0,0,0.3)",
            }}
          />
        </div>
        <h1 className="title">Tic Tac Toe</h1>
        <p className="subtitle">Server Authoritative Multiplayer</p>

        <button
          className="button"
          style={{ width: "100%", height: "3rem", fontSize: "1rem" }}
          onClick={handleStartClick}
          disabled={isSearching}
        >
          {isSearching ? (
            "Searching for opponent..."
          ) : (
            <span
              style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
            >
              <Play size={18} fill="currentColor" /> Let's Play
            </span>
          )}
        </button>

        {showCancelPrompt && isSearching && (
          <div
            style={{
              marginTop: "1rem",
              fontSize: "0.875rem",
              color: "var(--muted-foreground)",
            }}
            className="animate-fade-in"
          >
            Taking longer than expected...{" "}
            <button
              onClick={handleCancelMatchmaking}
              style={{
                background: "none",
                border: "none",
                color: "var(--destructive)",
                cursor: "pointer",
                textDecoration: "underline",
                fontWeight: 500,
                padding: 0,
              }}
            >
              Cancel?
            </button>
          </div>
        )}
      </div>

      {showNameDialog && (
        <div className="dialog-overlay">
          <div className="dialog-content">
            <h2 className="title" style={{ marginBottom: "1rem" }}>
              Welcome!
            </h2>
            {errorMsg && (
              <div
                style={{
                  color: "var(--destructive)",
                  fontSize: "0.875rem",
                  marginBottom: "1rem",
                }}
              >
                {errorMsg}
              </div>
            )}
            <form onSubmit={handleCreateProfile}>
              <input
                type="text"
                className="input"
                placeholder="Enter a fun nickname..."
                value={inputName}
                onChange={(e) => setInputName(e.target.value)}
                maxLength={15}
                required
                autoFocus
                style={{ marginBottom: "1rem" }}
              />
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button
                  type="button"
                  className="button secondary"
                  style={{ flex: 1 }}
                  onClick={() => setShowNameDialog(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="button" style={{ flex: 1 }}>
                  Start Game
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
