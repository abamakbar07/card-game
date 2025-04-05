"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { generateRoomCode } from "@/lib/utils"

export default function CreateGame() {
  const router = useRouter()
  const [playerName, setPlayerName] = useState("")
  const [isCreating, setIsCreating] = useState(false)

  const handleCreateGame = () => {
    if (!playerName.trim()) return

    setIsCreating(true)
    const roomCode = generateRoomCode()

    // In a real app, we would create the room on the server here
    setTimeout(() => {
      router.push(`/game/${roomCode}?name=${encodeURIComponent(playerName)}&host=true`)
    }, 1000)
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Create New Game</CardTitle>
          <CardDescription>Set up a new domino game for others to join</CardDescription>
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
        </CardContent>
        <CardFooter>
          <Button className="w-full" onClick={handleCreateGame} disabled={!playerName.trim() || isCreating}>
            {isCreating ? "Creating Game..." : "Create Game"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

