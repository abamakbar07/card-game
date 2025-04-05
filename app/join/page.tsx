"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"

export default function JoinGame() {
  const router = useRouter()
  const [playerName, setPlayerName] = useState("")
  const [roomCode, setRoomCode] = useState("")
  const [isJoining, setIsJoining] = useState(false)
  const [error, setError] = useState("")

  const handleJoinGame = () => {
    if (!playerName.trim() || !roomCode.trim()) {
      setError("Please enter your name and room code")
      return
    }

    setIsJoining(true)
    setError("")

    // In a real app, we would validate the room code on the server here
    setTimeout(() => {
      router.push(`/game/${roomCode}?name=${encodeURIComponent(playerName)}`)
    }, 1000)
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Join Game</CardTitle>
          <CardDescription>Enter a room code to join an existing game</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Your Name</Label>
            <Input
              id="name"
              placeholder="Enter your name"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="code">Room Code</Label>
            <Input
              id="code"
              placeholder="Enter room code"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
            />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
        </CardContent>
        <CardFooter>
          <Button
            className="w-full"
            onClick={handleJoinGame}
            disabled={!playerName.trim() || !roomCode.trim() || isJoining}
          >
            {isJoining ? "Joining Game..." : "Join Game"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

