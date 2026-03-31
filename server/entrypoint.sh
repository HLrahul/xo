#!/bin/sh

# Build the connection string from environment variables
DB_URL="postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}"

# Run migrations
/nakama/nakama migrate up --database.address "$DB_URL"

# Start Nakama server
exec /nakama/nakama --config /nakama/data/local.yml \
    --database.address "$DB_URL" \
    --socket.server_key "${SOCKET_SERVER_KEY}" \
    --session.encryption_key "${SESSION_ENCRYPTION_KEY}"
