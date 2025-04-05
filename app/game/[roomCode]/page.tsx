"use client"

import { useEffect, useState } from "react"
import { useParams, useSearchParams } from "next/navigation"
import { io, type Socket } from "socket.io-client"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import GameBoard from "@/components/game-board"
import PlayerHand from "@/components/player-hand"
import WaitingRoom from "@/components/waiting-room"
import GameOver from "@/components/game-over"
import type { Tile, GameState } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"

export default function GameRoom() {
  const params = useParams()
  const searchParams = useSearchParams()
  const { toast } = useToast()

  const roomCode = params.roomCode as string
  const playerName = searchParams.get("name") || "Guest"
  const isHost = searchParams.get("host") === "true"

  const [socket, setSocket] = useState<Socket | null>(null)
  const [gameState, setGameState] = useState<GameState>({
    status: "waiting",
    players: [],
    board: [],
    currentPlayer: "",
    winner: null,
    scores: {},
  })
  const [playerHand, setPlayerHand] = useState<Tile[]>([])
  const [playerId, setPlayerId] = useState<string>("")
  const [isConnected, setIsConnected] = useState(false)
  const [validMoves, setValidMoves] = useState<{ left: number | null; right: number | null }>({
    left: null,
    right: null,
  })

  useEffect(() => {
    // Connect to the Socket.io server
    const socketUrl = process.env.NODE_ENV === "development" ? "http://localhost:3001" : window.location.origin

    console.log("Connecting to socket server at:", socketUrl)

    const newSocket = io(socketUrl, {
      query: {
        roomCode,
        playerName,
        isHost: isHost ? "true" : "false",
      },
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    })

    newSocket.on("connect", () => {
      console.log("Connected to game server with ID:", newSocket.id)
      setIsConnected(true)
      setPlayerId(newSocket.id)
      toast({
        title: "Connected to game server",
        description: `Room code: ${roomCode}`,
      })
    })

    newSocket.on("connect_error", (error) => {
      console.error("Connection error:", error)
      toast({
        title: "Connection error",
        description: "Could not connect to game server. Please try again.",
        variant: "destructive",
      })
    })

    newSocket.on("disconnect", () => {
      setIsConnected(false)
      toast({
        title: "Disconnected from game server",
        description: "Attempting to reconnect...",
        variant: "destructive",
      })
    })

    newSocket.on("gameState", (state: GameState) => {
      setGameState(state)
    })

    newSocket.on("playerHand", (hand: Tile[]) => {
      setPlayerHand(hand)
    })

    newSocket.on("validMoves", (moves: { left: number | null; right: number | null }) => {
      setValidMoves(moves)
    })

    newSocket.on("error", (message: string) => {
      toast({
        title: "Game Error",
        description: message,
        variant: "destructive",
      })
    })

    setSocket(newSocket)

    return () => {
      newSocket.disconnect()
    }
  }, [roomCode, playerName, isHost, toast])

  const startGame = () => {
    if (socket && isHost) {
      socket.emit("startGame", roomCode)
    }
  }

  const placeTile = (tile: Tile, position: "left" | "right") => {
    if (socket && gameState.currentPlayer === playerId) {
      socket.emit("placeTile", { roomCode, tile, position })
    }
  }

  const drawTile = () => {
    if (socket && gameState.currentPlayer === playerId) {
      socket.emit("drawTile", roomCode)
    }
  }

  const playAgain = () => {
    if (socket && isHost) {
      socket.emit("resetGame", roomCode)
    }
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
        <Card className="p-8 text-center">
          <h2 className="text-xl font-bold mb-4">Connecting to game server...</h2>
          <p className="text-muted-foreground">Please wait while we connect you to the game.</p>
        </Card>
      </div>
    )
  }

  if (gameState.status === "waiting") {
    return <WaitingRoom roomCode={roomCode} players={gameState.players} isHost={isHost} onStartGame={startGame} />
  }

  if (gameState.status === "over") {
    return <GameOver winner={gameState.winner} scores={gameState.scores} isHost={isHost} onPlayAgain={playAgain} />
  }

  const isPlayerTurn = gameState.currentPlayer === playerId

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col p-4">
      <div className="mb-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold">Room: {roomCode}</h1>
        <div className="text-right">
          <p className="font-medium">
            {isPlayerTurn
              ? "Your turn"
              : `${gameState.players.find((p) => p.id === gameState.currentPlayer)?.name}'s turn`}
          </p>
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        <div className="mb-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {gameState.players.map((player) => (
            <Card key={player.id} className={`p-3 ${player.id === gameState.currentPlayer ? "bg-primary/10" : ""}`}>
              <p className="font-medium truncate">{player.name}</p>
              <p className="text-sm text-muted-foreground">Tiles: {player.tileCount}</p>
            </Card>
          ))}
        </div>

        <div className="flex-1 overflow-auto mb-4">
          <GameBoard board={gameState.board} validMoves={validMoves} />
        </div>

        <div className="mt-auto">
          <PlayerHand tiles={playerHand} isPlayerTurn={isPlayerTurn} validMoves={validMoves} onPlaceTile={placeTile} />

          <div className="mt-4 flex justify-center">
            <Button onClick={drawTile} disabled={!isPlayerTurn} variant="outline">
              Draw Tile
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

