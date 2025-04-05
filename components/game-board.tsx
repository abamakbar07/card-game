"use client"

import { useRef, useEffect } from "react"
import type { Tile } from "@/lib/types"

interface GameBoardProps {
  board: Tile[]
  validMoves: {
    left: number | null
    right: number | null
  }
}

export default function GameBoard({ board, validMoves }: GameBoardProps) {
  const boardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Scroll to the center of the board when it changes
    if (boardRef.current) {
      boardRef.current.scrollLeft = (boardRef.current.scrollWidth - boardRef.current.clientWidth) / 2
    }
  }, [board])

  if (board.length === 0) {
    return (
      <div className="h-40 flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg">
        <p className="text-muted-foreground">The board is empty. Place the first tile!</p>
      </div>
    )
  }

  return (
    <div ref={boardRef} className="relative h-40 overflow-x-auto whitespace-nowrap py-4 px-8">
      <div className="inline-flex items-center h-full">
        {board.map((tile, index) => {
          const isLeftEnd = index === 0
          const isRightEnd = index === board.length - 1
          const isValidLeft = isLeftEnd && validMoves.left !== null
          const isValidRight = isRightEnd && validMoves.right !== null

          // Determine orientation (horizontal or vertical)
          const isVertical = tile.isDouble || (index > 0 && index < board.length - 1 && index % 3 === 0)

          return (
            <div
              key={`${tile.left}-${tile.right}-${index}`}
              className={`
                inline-block mx-1 relative
                ${isValidLeft || isValidRight ? "animate-pulse" : ""}
              `}
            >
              <div
                className={`
                  bg-white border-2 border-gray-800 rounded-md shadow-md
                  flex items-center justify-center
                  ${isVertical ? "h-24 w-12 flex-col" : "w-24 h-12 flex-row"}
                `}
              >
                <div
                  className={`
                  flex items-center justify-center
                  ${isVertical ? "w-full h-1/2 border-b-2 border-gray-800" : "h-full w-1/2 border-r-2 border-gray-800"}
                `}
                >
                  {Array.from({ length: tile.left }).map((_, i) => (
                    <div key={i} className="w-1.5 h-1.5 bg-black rounded-full m-0.5" />
                  ))}
                </div>
                <div
                  className={`
                  flex items-center justify-center
                  ${isVertical ? "w-full h-1/2" : "h-full w-1/2"}
                `}
                >
                  {Array.from({ length: tile.right }).map((_, i) => (
                    <div key={i} className="w-1.5 h-1.5 bg-black rounded-full m-0.5" />
                  ))}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

