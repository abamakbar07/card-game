"use client"

import { useState } from "react"
import type { Tile } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface PlayerHandProps {
  tiles: Tile[]
  isPlayerTurn: boolean
  validMoves: {
    left: number | null
    right: number | null
  }
  onPlaceTile: (tile: Tile, position: "left" | "right") => void
}

export default function PlayerHand({ tiles, isPlayerTurn, validMoves, onPlaceTile }: PlayerHandProps) {
  const [selectedTile, setSelectedTile] = useState<Tile | null>(null)

  const canPlaceLeft = (tile: Tile) => {
    return isPlayerTurn && validMoves.left !== null && (tile.left === validMoves.left || tile.right === validMoves.left)
  }

  const canPlaceRight = (tile: Tile) => {
    return (
      isPlayerTurn && validMoves.right !== null && (tile.left === validMoves.right || tile.right === validMoves.right)
    )
  }

  const handlePlaceTile = (tile: Tile, position: "left" | "right") => {
    onPlaceTile(tile, position)
    setSelectedTile(null)
  }

  if (tiles.length === 0) {
    return (
      <div className="h-24 flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg">
        <p className="text-muted-foreground">Waiting for tiles...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-wrap justify-center gap-2 p-2 bg-gray-200 rounded-lg">
      {tiles.map((tile, index) => {
        const canPlace = canPlaceLeft(tile) || canPlaceRight(tile)

        return (
          <DropdownMenu key={`${tile.left}-${tile.right}-${index}`}>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className={`
                  p-0 h-auto bg-white border-2 border-gray-800 rounded-md shadow-md
                  ${canPlace ? "ring-2 ring-primary ring-offset-2" : ""}
                  ${!isPlayerTurn ? "opacity-70" : ""}
                `}
                disabled={!isPlayerTurn || !canPlace}
              >
                <div className="w-16 h-8 flex items-center">
                  <div className="h-full w-1/2 border-r-2 border-gray-800 flex items-center justify-center">
                    {Array.from({ length: tile.left }).map((_, i) => (
                      <div key={i} className="w-1 h-1 bg-black rounded-full m-0.5" />
                    ))}
                  </div>
                  <div className="h-full w-1/2 flex items-center justify-center">
                    {Array.from({ length: tile.right }).map((_, i) => (
                      <div key={i} className="w-1 h-1 bg-black rounded-full m-0.5" />
                    ))}
                  </div>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center">
              {canPlaceLeft(tile) && (
                <DropdownMenuItem onClick={() => handlePlaceTile(tile, "left")}>Place on left</DropdownMenuItem>
              )}
              {canPlaceRight(tile) && (
                <DropdownMenuItem onClick={() => handlePlaceTile(tile, "right")}>Place on right</DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )
      })}
    </div>
  )
}

