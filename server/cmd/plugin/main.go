package main

import (
	"context"
	"database/sql"

	"github.com/heroiclabs/nakama-common/runtime"

	"xo/server/internal/match"
	"xo/server/internal/rpc"
)

func InitModule(
	ctx context.Context,
	logger runtime.Logger,
	db *sql.DB,
	nk runtime.NakamaModule,
	initializer runtime.Initializer,
) error {

	if err := initializer.RegisterMatchmakerMatched(func(
		ctx context.Context,
		logger runtime.Logger,
		db *sql.DB,
		nk runtime.NakamaModule,
		entries []runtime.MatchmakerEntry,
	) (string, error) {
		logger.Info("Matchmaker matched! Creating a new authoritative match...")

		matchId, err := nk.MatchCreate(ctx, "tictactoe", nil)

		if err != nil {
			logger.Error("Failed to create match: %v", err)
			return "", err
		}

		return matchId, nil
	}); err != nil {
		logger.Error("Unable to register matchmaker hook: %v", err)
		return err
	}

	if err := initializer.RegisterMatch("tictactoe", func(
		ctx context.Context,
		logger runtime.Logger,
		db *sql.DB,
		nk runtime.NakamaModule,
	) (runtime.Match, error) {
		return &match.Match{}, nil
	}); err != nil {
		logger.Error("Unable to register: %v", err)
		return err
	}

	if err := initializer.RegisterRpc("join_global", rpc.JoinGlobal); err != nil {
		logger.Error("Unable to register: %v", err)
		return err
	}

	return nil
}
