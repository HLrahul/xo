package rpc

import (
	"context"
	"database/sql"
	"encoding/json"

	"github.com/heroiclabs/nakama-common/runtime"
)

const GlobalStreamMode uint8 = 123

// JoinGlobal adds a user's session to the custom global stream so they can be counted
func JoinGlobal(ctx context.Context, logger runtime.Logger, db *sql.DB, nk runtime.NakamaModule, payload string) (string, error) {
	userId, ok := ctx.Value(runtime.RUNTIME_CTX_USER_ID).(string)
	if !ok || userId == "" {
		return "", nil // Ignore anonymous callers
	}
	sessionId, ok := ctx.Value(runtime.RUNTIME_CTX_SESSION_ID).(string)
	if !ok || sessionId == "" {
		return "", nil
	}

	_, err := nk.StreamUserJoin(GlobalStreamMode, "", "", "global_lobby", userId, sessionId, false, false, "")
	if err != nil {
		logger.Error("Failed to join global stream: %v", err)
	}
	return `{"success": true}`, nil
}

func GetOnlineCount(
	ctx context.Context,
	logger runtime.Logger,
	db *sql.DB,
	nk runtime.NakamaModule,
	payload string,
) (string, error) {
	count, err := nk.StreamCount(GlobalStreamMode, "", "", "global_lobby")

	if err != nil {
		logger.Error("Error counting stream presences: %v", err)
		return `{"online_count": 0}`, nil
	}

	response := map[string]int{"online_count": count}
	out, err := json.Marshal(response)

	if err != nil {
		return `{"online_count": 0}`, nil
	}

	return string(out), nil
}
