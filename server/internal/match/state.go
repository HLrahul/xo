package match

const (
	MarkNone = ""
	MarkX    = "X"
	MarkO    = "O"
)

type MatchState struct {
	Board    [9]string
	NextTurn string
	Players  map[string]string
}

type BroadcastState struct {
	Board    [9]string         `json:"board"`
	NextTurn string            `json:"next_turn"`
	Winner   string            `json:"winner"`
	Players  map[string]string `json:"marks"`
}
