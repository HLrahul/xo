package match

import (
	"context"
	"database/sql"

	"encoding/json"
	"github.com/heroiclabs/nakama-common/runtime"
)

type Match struct{}

func (m *Match) MatchInit(
	ctx context.Context,
	logger runtime.Logger,
	db *sql.DB,
	nk runtime.NakamaModule,
	params map[string]interface{}) (interface{}, int, string) {

	state := &MatchState{
		Board:   [9]string{},
		Players: make(map[string]string),
	}

	tickRate := 10
	label := "tictactoe"
	return state, tickRate, label
}

func (m *Match) MatchJoinAttempt(
	ctx context.Context,
	logger runtime.Logger,
	db *sql.DB,
	nk runtime.NakamaModule,
	dispatcher runtime.MatchDispatcher,
	tick int64,
	state interface{},
	presence runtime.Presence,
	metadata map[string]string) (interface{}, bool, string) {

	s := state.(*MatchState)

	if len(s.Players) >= 2 {
		return s, false, "Match full"
	}

	return s, true, ""
}

func (m *Match) MatchJoin(
	ctx context.Context,
	logger runtime.Logger,
	db *sql.DB,
	nk runtime.NakamaModule,
	dispatcher runtime.MatchDispatcher,
	tick int64,
	state any,
	presences []runtime.Presence) any {

	s := state.(*MatchState)

	for _, p := range presences {
		if len(s.Players) == 0 {
			s.Players[p.GetUserId()] = MarkX
			s.NextTurn = p.GetUserId()
		} else {
			s.Players[p.GetUserId()] = MarkO
		}
	}

	if len(s.Players) == 2 {
		newState := BroadcastState{
			Board:    s.Board,
			NextTurn: s.NextTurn,
			Winner:   "",
			Players:  s.Players,
		}

		out, _ := json.Marshal(newState)
		dispatcher.BroadcastMessage(2, out, nil, nil, true)
	}

	return s
}

func (m *Match) MatchLeave(
	ctx context.Context,
	logger runtime.Logger,
	db *sql.DB,
	nk runtime.NakamaModule,
	dispatcher runtime.MatchDispatcher,
	tick int64,
	state interface{},
	presences []runtime.Presence) interface{} {

	s := state.(*MatchState)

	// If the game is still active (no winner, board not empty) and 2 players were present,
	// notify the remaining player their opponent left, then close the match.
	gameWasActive := s.NextTurn != "" && len(s.Players) == 2

	for _, p := range presences {
		delete(s.Players, p.GetUserId())
	}

	if gameWasActive {
		msg := []byte(`{"reason": "opponent_left"}`)
		if err := dispatcher.BroadcastMessage(3, msg, nil, nil, true); err != nil {
			logger.Error("Failed to broadcast opponent_left: %v", err)
		}

		logger.Info("Player left mid-game. Closing match.")
		return nil
	}

	return s
}

func (m *Match) MatchLoop(
	ctx context.Context,
	logger runtime.Logger,
	db *sql.DB,
	nk runtime.NakamaModule,
	dispatcher runtime.MatchDispatcher,
	tick int64,
	state interface{},
	messages []runtime.MatchData) interface{} {

	s := state.(*MatchState)

	for _, msg := range messages {
		if msg.GetOpCode() == 1 {
			if msg.GetUserId() != s.NextTurn {
				logger.Warn("Player %s tried to move out of turn", msg.GetUserId())
				continue
			}

			var move struct {
				Position int `json:"position"`
			}

			if err := json.Unmarshal(msg.GetData(), &move); err != nil || move.Position < 0 || move.Position > 8 {
				continue
			}

			if s.Board[move.Position] != MarkNone {
				logger.Warn("Player %s tried to play on a taken cell", msg.GetUserId())
				continue
			}
			playerMark := s.Players[msg.GetUserId()]
			s.Board[move.Position] = playerMark

			// 5. Check winning/draw condition
			winner := checkWinner(s.Board)
			if winner == "" && checkDraw(s.Board) {
				winner = "DRAW"
			}

			// 6. Switch turns (unless the game is over)
			if winner == "" {
				for userId := range s.Players {
					if userId != msg.GetUserId() {
						s.NextTurn = userId
						break
					}
				}
			} else {
				// Game over, no one's turn
				s.NextTurn = ""
			}

			// 7. Broadcast the updated board to the players
			newState := BroadcastState{
				Board:    s.Board,
				NextTurn: s.NextTurn,
				Winner:   winner,
				Players:  s.Players,
			}
			out, _ := json.Marshal(newState)
			dispatcher.BroadcastMessage(2, out, nil, nil, true)

			// 8. If the game is over, we return nil.
			// This tells Nakama to close down this room and boot the players out.
			if winner != "" {
				logger.Info("Match finished with winner: %s. Closing room.", winner)
				return nil
			}
		}
	}

	return s
}

func (m *Match) MatchTerminate(
	ctx context.Context,
	logger runtime.Logger,
	db *sql.DB,
	nk runtime.NakamaModule,
	dispatcher runtime.MatchDispatcher,
	tick int64,
	state interface{},
	graceSeconds int) interface{} {

	return state
}

func (m *Match) MatchSignal(
	ctx context.Context,
	logger runtime.Logger,
	db *sql.DB,
	nk runtime.NakamaModule,
	dispatcher runtime.MatchDispatcher,
	tick int64,
	state interface{},
	data string) (interface{}, string) {

	return state, "signal received"
}
