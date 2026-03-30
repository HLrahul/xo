import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { Home } from "lucide-react";
import { nakamaClient } from "../lib/nakamaClient";
import type { MatchData } from "@heroiclabs/nakama-js";

import { useGame } from "../contexts/GameContext";

import logo from "../assets/xo.jpg";

export default function Game() {
  const {
    session,
    socket,
    matchId,
    setMatchId,
    opponentUsername,
    setOpponentUsername,
  } = useGame();
  const navigate = useNavigate();

  const [board, setBoard] = useState<string[]>(Array(9).fill(""));
  const [nextTurn, setNextTurn] = useState<string>("");
  const [mySymbol, setMySymbol] = useState<string>("");
  const [winner, setWinner] = useState<string>("");
  const [opponentLeft, setOpponentLeft] = useState(false);

  useEffect(() => {
    if (!session || !socket || !matchId) {
      navigate("/");
      return;
    }

    const startMatch = async () => {
      try {
        await socket.joinMatch(matchId);
      } catch (err) {
        console.error("Failed to join match. Likely closed.", err);
        navigate("/");
      }
    };

    socket.onmatchdata = (matchstate: MatchData) => {
      if (matchstate.op_code === 2) {
        // OpCode 2: State Update Broadcast
        const data = JSON.parse(new TextDecoder().decode(matchstate.data));

        setBoard(data.board);
        setNextTurn(data.next_turn);
        setWinner(data.winner);

        // Figure out our own symbol and fetch opponent's name
        if (data.marks && session.user_id) {
          if (data.marks[session.user_id]) {
            setMySymbol(data.marks[session.user_id]);
          }
          const opponentId = Object.keys(data.marks).find(
            (id) => id !== session.user_id,
          );
          if (opponentId) {
            nakamaClient
              .getUsers(session, [opponentId])
              .then((users: { users?: Array<{ username?: string }> }) => {
                if (users.users && users.users.length > 0) {
                  setOpponentUsername(users.users[0].username || "Opponent");
                }
              })
              .catch(() => setOpponentUsername("Opponent"));
          }
        }

        // If game over, redirect after 3 seconds
        if (data.winner) {
          setTimeout(() => {
            setMatchId(null);
            navigate("/");
          }, 3500);
        }
      }

      if (matchstate.op_code === 3) {
        // OpCode 3: Opponent left mid-game
        setOpponentLeft(true);
        setTimeout(() => {
          setMatchId(null);
          navigate("/");
        }, 3000);
      }
    };

    startMatch();

    return () => {
      socket.onmatchdata = () => {};
    };
  }, [session, socket, matchId, navigate, setMatchId]);

  const handleCellClick = async (index: number) => {
    if (!socket || !session || !matchId) return;
    if (winner) return; // Game over
    if (board[index] !== "") return; // Taken
    if (nextTurn !== session.user_id) return; // Not our turn

    // Optimistic UI update (wait for server to confirm officially)
    const newBoard = [...board];
    newBoard[index] = mySymbol;
    setBoard(newBoard);
    setNextTurn(""); // Temporarily prevent double clicks

    const payload = JSON.stringify({ position: index });
    try {
      await socket.sendMatchState(matchId, 1, payload);
    } catch (e) {
      console.error("Failed to send move", e);
    }
  };

  if (!matchId) return null;

  const isMyTurn = session?.user_id === nextTurn;
  const gameDisabled = !!winner || opponentLeft;

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
              width: "60px",
              height: "60px",
              objectFit: "cover",
              borderRadius: "12px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
            }}
          />
        </div>
        <h2 className="title">Tic Tac Toe</h2>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "2rem",
            marginBottom: "1.5rem",
            marginTop: "1rem",
          }}
        >
          <div
            style={{
              padding: "0.5rem 1rem",
              borderRadius: "var(--radius)",
              backgroundColor:
                mySymbol === "X" ? "var(--secondary)" : "var(--background)",
            }}
          >
            <span style={{ fontSize: "0.875rem", fontWeight: 600 }}>You</span>
            <div className="X" style={{ fontSize: "2rem", fontWeight: 800 }}>
              {mySymbol || "?"}
            </div>
          </div>
          <div
            style={{
              padding: "0.5rem 1rem",
              borderRadius: "var(--radius)",
              backgroundColor:
                mySymbol !== "X" && mySymbol
                  ? "var(--secondary)"
                  : "var(--background)",
            }}
          >
            <span style={{ fontSize: "0.875rem", fontWeight: 600 }}>
              {opponentUsername || "Opponent"}
            </span>
            <div className="O" style={{ fontSize: "2rem", fontWeight: 800 }}>
              {mySymbol === "X" ? "O" : "X"}
            </div>
          </div>
        </div>

        <div
          className="subtitle"
          style={{
            color: isMyTurn ? "var(--foreground)" : "var(--muted-foreground)",
          }}
        >
          {winner
            ? "Match Finished"
            : isMyTurn
              ? "Your turn!"
              : "Waiting for opponent..."}
        </div>

        <div className="board-grid">
          {board?.map((cell, idx) => (
            <button
              key={idx}
              className={`board-cell ${cell} ${cell ? "taken" : ""}`}
              onClick={() => handleCellClick(idx)}
              disabled={!!cell || !isMyTurn || gameDisabled}
            >
              {cell}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={async () => {
          if (socket && matchId) {
            try {
              await socket.leaveMatch(matchId);
            } catch (e) {
              console.error("Failed to leave match", e);
            }
          }
          setMatchId(null);
          navigate("/");
        }}
        className="button secondary"
        style={{ marginTop: "2rem" }}
      >
        <Home size={16} style={{ marginRight: "0.5rem" }} /> Leave Room
      </button>

      {winner && (
        <div className="dialog-overlay">
          <div className="dialog-content" style={{ textAlign: "center" }}>
            <h2
              style={{
                fontSize: "2.5rem",
                fontWeight: 800,
                marginBottom: "1rem",
                color:
                  winner === mySymbol
                    ? "#10b981"
                    : winner === "DRAW"
                      ? "var(--foreground)"
                      : "#ef4444",
              }}
            >
              {winner === "DRAW"
                ? "DRAW!"
                : winner === mySymbol
                  ? "YOU WON!"
                  : "YOU LOST!"}
            </h2>
            <p className="subtitle">Returning to lobby in 3 seconds...</p>
          </div>
        </div>
      )}

      {opponentLeft && (
        <div className="dialog-overlay">
          <div className="dialog-content" style={{ textAlign: "center" }}>
            <h2
              style={{
                fontSize: "1.75rem",
                fontWeight: 800,
                marginBottom: "0.75rem",
                color: "#f59e0b",
              }}
            >
              {opponentUsername || "Opponent"} left the game
            </h2>
            <p className="subtitle">Returning to lobby in 3 seconds...</p>
          </div>
        </div>
      )}
    </div>
  );
}
