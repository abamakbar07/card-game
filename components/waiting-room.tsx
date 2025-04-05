"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import type { Player } from "@/lib/types"
import { Copy } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface WaitingRoomProps {
  roomCode: string
  players: Player[]
  isHost: boolean
  onStartGame: () => void
}

export default function WaitingRoom({ roomCode, players, isHost, onStartGame }: WaitingRoomProps) {
  const { toast } = useToast()

  const copyRoomCode = () => {
    navigator.clipboard.writeText(roomCode)
    toast({
      title: "Room code copied",
      description: "Share this code with your friends to join the game",
    })
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Waiting Room</CardTitle>
          <CardDescription>Share this room code with your friends to join the game</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-muted rounded-md">
            <span className="font-mono text-lg tracking-widest">{roomCode}</span>
            <Button variant="ghost" size="icon" onClick={copyRoomCode}>
              <Copy className="h-4 w-4" />
            </Button>
          </div>

          <div>
            <h3 className="text-sm font-medium mb-2">Players ({players.length}/4):</h3>
            <ul className="space-y-2">
              {players.map((player) => (
                <li key={player.id} className="p-2 bg-white rounded-md flex justify-between items-center">
                  <span>{player.name}</span>
                  {player.isHost && (
                    <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded">Host</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
        <CardFooter>
          {isHost ? (
            <Button className="w-full" onClick={onStartGame} disabled={players.length < 2}>
              {players.length < 2 ? "Waiting for more players..." : "Start Game"}
            </Button>
          ) : (
            <p className="text-center w-full text-muted-foreground">Waiting for the host to start the game...</p>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}

