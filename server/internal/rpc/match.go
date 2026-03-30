package rpc

import (
	"context"
	"database/sql"
	"encoding/json"

	"github.com/heroiclabs/nakama-common/runtime"
)

const GlobalStreamMode uint8 = 123

// JoinGlobal adds a user's session to the custom global stream and
// returns the current online count.
// Real-time count updates are pushed automatically via
// Nakama's stream presence events.
func JoinGlobal(
	ctx context.Context,
	logger runtime.Logger,
	db *sql.DB,
	nk runtime.NakamaModule,
	payload string,
) (string, error) {
	userId, ok := ctx.Value(runtime.RUNTIME_CTX_USER_ID).(string)
	if !ok || userId == "" {
		return "", nil
	}

	sessionId, ok := ctx.Value(runtime.RUNTIME_CTX_SESSION_ID).(string)
	if !ok || sessionId == "" {
		return "", nil
	}

	_, err := nk.StreamUserJoin(GlobalStreamMode, "", "", "global_lobby", userId, sessionId, false, false, "")
	if err != nil {
		logger.Error("Failed to join global stream: %v", err)
		return `{"online_count": 0}`, nil
	}

	// Return the current count so the client has an initial value
	count, err := nk.StreamCount(GlobalStreamMode, "", "", "global_lobby")
	if err != nil {
		logger.Error("Error counting stream presences: %v", err)
		return `{"online_count": 0}`, nil
	}

	response := map[string]int{"online_count": count}
	out, _ := json.Marshal(response)
	return string(out), nil
}
