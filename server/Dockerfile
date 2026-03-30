# Step 1: Build the Go plugin using the official Nakama builder
FROM heroiclabs/nakama-pluginbuilder:3.25.0 AS builder

# Base image already has necessary tools and environmental variables
WORKDIR /builder

# Copy go.mod and go.sum for caching
COPY go.mod go.sum ./
RUN go mod download

# Copy the rest of the code
COPY . .

# Build the plugin as a shared object (.so)
# We use CGO_ENABLED=1 because Nakama plugins are dynamic libraries
RUN CGO_ENABLED=1 go build --trimpath --mod=readonly -buildmode=plugin -o ./tictactoe.so cmd/plugin/main.go

# Step 2: Runtime image
FROM heroiclabs/nakama:3.25.0

# Copy the compiled plugin from the builder
COPY --from=builder /builder/tictactoe.so /nakama/data/modules/

# Copy the local config file
COPY local.yml /nakama/data/

# Start Nakama with migrations and configuration
# We use /bin/sh -c to allow environment variable expansion
CMD /nakama/nakama migrate up --config /nakama/data/local.yml && \
    /nakama/nakama --config /nakama/data/local.yml \
    --socket.server_key "${SOCKET_SERVER_KEY}" \
    --session.encryption_key "${SESSION_ENCRYPTION_KEY}"
