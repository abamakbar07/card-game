export interface Tile {
  left: number
  right: number
  isDouble?: boolean
}

export interface Player {
  id: string
  name: string
  isHost: boolean
  tileCount: number
}

export interface GameState {
  status: "waiting" | "playing" | "over"
  players: Player[]
  board: Tile[]
  currentPlayer: string
  winner: Player | null
  scores: Record<string, number>
}

