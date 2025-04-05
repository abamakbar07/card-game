"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import type { Player } from "@/lib/types"

interface GameOverProps {
  winner: Player | null
  scores: Record<string, number>
  isHost: boolean
  onPlayAgain: () => void
}

export default function GameOver({ winner, scores, isHost, onPlayAgain }: GameOverProps) {
  const sortedScores = Object.entries(scores).sort(([, scoreA], [, scoreB]) => scoreB - scoreA)

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Game Over</CardTitle>
          {winner && <CardDescription>{winner.name} has won the game!</CardDescription>}
        </CardHeader>
        <CardContent className="space-y-4">
          <h3 className="text-sm font-medium mb-2">Final Scores:</h3>
          <ul className="space-y-2">
            {sortedScores.map(([playerId, score], index) => (
              <li key={playerId} className="p-2 bg-white rounded-md flex justify-between items-center">
                <span>{playerId === winner?.id ? `${winner.name} 👑` : playerId}</span>
                <span className="font-medium">{score} points</span>
              </li>
            ))}
          </ul>
        </CardContent>
        <CardFooter>
          {isHost ? (
            <Button className="w-full" onClick={onPlayAgain}>
              Play Again
            </Button>
          ) : (
            <p className="text-center w-full text-muted-foreground">Waiting for the host to start a new game...</p>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}

