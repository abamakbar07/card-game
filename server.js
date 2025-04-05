const { createServer } = require("http")
const { Server } = require("socket.io")
const next = require("next")

const dev = process.env.NODE_ENV !== "production"
const app = next({ dev })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  const server = createServer(handle)
  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  })

  // Game rooms storage
  const rooms = new Map()

  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id)

    const roomCode = socket.handshake.query.roomCode
    const playerName = socket.handshake.query.playerName
    const isHost = socket.handshake.query.isHost === "true"

    if (!roomCode || !playerName) {
      socket.emit("error", "Room code and player name are required")
      socket.disconnect()
      return
    }

    // Join room
    socket.join(roomCode)
    console.log(`Player ${playerName} joined room ${roomCode}`)

    // Initialize room if it doesn't exist
    if (!rooms.has(roomCode)) {
      rooms.set(roomCode, {
        players: [],
        status: "waiting",
        board: [],
        boneyard: [],
        currentPlayerIndex: 0,
        scores: {},
      })
    }

    const room = rooms.get(roomCode)

    // Add player to room
    const player = {
      id: socket.id,
      name: playerName,
      isHost: isHost,
      hand: [],
      tileCount: 0,
    }

    room.players.push(player)

    // Update game state for all clients in the room
    io.to(roomCode).emit("gameState", {
      status: room.status,
      players: room.players.map((p) => ({
        id: p.id,
        name: p.name,
        isHost: p.isHost,
        tileCount: p.hand?.length || 0,
      })),
      board: room.board,
      currentPlayer: room.currentPlayerIndex !== undefined ? room.players[room.currentPlayerIndex]?.id : "",
      winner: room.winner || null,
      scores: room.scores,
    })

    // Handle start game
    socket.on("startGame", (roomCode) => {
      const room = rooms.get(roomCode)
      if (!room) return

      if (room.players.length < 2) {
        socket.emit("error", "Need at least 2 players to start the game")
        return
      }

      // Initialize the game
      room.status = "playing"
      room.board = []
      room.boneyard = generateDominoSet()
      room.scores = {}

      // Shuffle the boneyard
      shuffleArray(room.boneyard)

      // Deal tiles to players
      const tilesPerPlayer = 7
      room.players.forEach((player) => {
        player.hand = room.boneyard.splice(0, tilesPerPlayer)
        player.tileCount = player.hand.length
        room.scores[player.id] = 0

        // Send player their hand
        io.to(player.id).emit("playerHand", player.hand)
      })

      // Determine first player (player with highest double or highest tile)
      let highestDouble = -1
      let highestTile = -1
      let firstPlayerIndex = 0

      room.players.forEach((player, index) => {
        player.hand.forEach((tile) => {
          if (tile.left === tile.right) {
            if (tile.left > highestDouble) {
              highestDouble = tile.left
              firstPlayerIndex = index
            }
          } else if (highestDouble === -1) {
            const tileValue = tile.left + tile.right
            if (tileValue > highestTile) {
              highestTile = tileValue
              firstPlayerIndex = index
            }
          }
        })
      })

      room.currentPlayerIndex = firstPlayerIndex

      // Update game state for all clients
      updateGameState(roomCode)
    })

    // Handle place tile
    socket.on("placeTile", ({ roomCode, tile, position }) => {
      const room = rooms.get(roomCode)
      if (!room || room.status !== "playing") return

      const playerIndex = room.players.findIndex((p) => p.id === socket.id)
      if (playerIndex === -1 || playerIndex !== room.currentPlayerIndex) return

      const player = room.players[playerIndex]

      // Find the tile in player's hand
      const tileIndex = player.hand.findIndex((t) => t.left === tile.left && t.right === tile.right)

      if (tileIndex === -1) return

      // Check if the move is valid
      if (!isValidMove(room.board, tile, position)) {
        socket.emit("error", "Invalid move")
        return
      }

      // Remove tile from player's hand
      const [removedTile] = player.hand.splice(tileIndex, 1)
      player.tileCount = player.hand.length

      // Add tile to the board
      if (position === "left") {
        // May need to flip the tile
        if (room.board.length > 0) {
          const leftEnd = room.board[0]
          if (removedTile.right !== leftEnd.left) {
            // Flip the tile
            const temp = removedTile.left
            removedTile.left = removedTile.right
            removedTile.right = temp
          }
        }
        room.board.unshift(removedTile)
      } else {
        // May need to flip the tile
        if (room.board.length > 0) {
          const rightEnd = room.board[room.board.length - 1]
          if (removedTile.left !== rightEnd.right) {
            // Flip the tile
            const temp = removedTile.left
            removedTile.left = removedTile.right
            removedTile.right = temp
          }
        }
        room.board.push(removedTile)
      }

      // Check if player has won
      if (player.hand.length === 0) {
        room.status = "over"
        room.winner = {
          id: player.id,
          name: player.name,
          isHost: player.isHost,
          tileCount: 0,
        }

        // Calculate scores
        calculateScores(room)
      } else {
        // Move to next player
        room.currentPlayerIndex = (room.currentPlayerIndex + 1) % room.players.length

        // Check if the game is blocked
        if (isGameBlocked(room)) {
          room.status = "over"
          calculateScores(room)

          // Find player with lowest hand value
          let lowestValue = Number.POSITIVE_INFINITY
          let winnerId = null

          room.players.forEach((player) => {
            const handValue = player.hand.reduce((sum, tile) => sum + tile.left + tile.right, 0)
            if (handValue < lowestValue) {
              lowestValue = handValue
              winnerId = player.id
            }
          })

          if (winnerId) {
            const winner = room.players.find((p) => p.id === winnerId)
            if (winner) {
              room.winner = {
                id: winner.id,
                name: winner.name,
                isHost: winner.isHost,
                tileCount: winner.hand.length,
              }
            }
          }
        }
      }

      // Send updated hand to player
      socket.emit("playerHand", player.hand)

      // Update game state for all clients
      updateGameState(roomCode)
    })

    // Handle draw tile
    socket.on("drawTile", (roomCode) => {
      const room = rooms.get(roomCode)
      if (!room || room.status !== "playing") return

      const playerIndex = room.players.findIndex((p) => p.id === socket.id)
      if (playerIndex === -1 || playerIndex !== room.currentPlayerIndex) return

      const player = room.players[playerIndex]

      // Check if there are tiles in the boneyard
      if (room.boneyard.length === 0) {
        socket.emit("error", "No tiles left to draw")

        // Check if the player can't make a move
        if (!canPlayerMove(player.hand, room.board)) {
          // Skip to next player
          room.currentPlayerIndex = (room.currentPlayerIndex + 1) % room.players.length
          updateGameState(roomCode)
        }

        return
      }

      // Draw a tile
      const drawnTile = room.boneyard.pop()
      player.hand.push(drawnTile)
      player.tileCount = player.hand.length

      // Send updated hand to player
      socket.emit("playerHand", player.hand)

      // Check if the player can play the drawn tile
      if (canPlayTile(drawnTile, room.board)) {
        // Player keeps their turn
        updateGameState(roomCode)
      } else {
        // Move to next player
        room.currentPlayerIndex = (room.currentPlayerIndex + 1) % room.players.length
        updateGameState(roomCode)
      }
    })

    // Handle reset game
    socket.on("resetGame", (roomCode) => {
      const room = rooms.get(roomCode)
      if (!room) return

      // Reset the game state
      room.status = "waiting"
      room.board = []
      room.boneyard = []
      room.currentPlayerIndex = undefined
      room.winner = null
      room.scores = {}

      // Reset player hands
      room.players.forEach((player) => {
        player.hand = []
        player.tileCount = 0
      })

      // Update game state for all clients
      updateGameState(roomCode)
    })

    // Handle disconnect
    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id)

      const room = rooms.get(roomCode)
      if (!room) return

      // Remove player from room
      const playerIndex = room.players.findIndex((p) => p.id === socket.id)
      if (playerIndex !== -1) {
        room.players.splice(playerIndex, 1)

        // If the room is empty, delete it
        if (room.players.length === 0) {
          rooms.delete(roomCode)
          return
        }

        // If the host left, assign a new host
        if (!room.players.some((p) => p.isHost)) {
          room.players[0].isHost = true
        }

        // If the current player left, move to next player
        if (room.status === "playing" && room.currentPlayerIndex !== undefined) {
          if (playerIndex === room.currentPlayerIndex) {
            room.currentPlayerIndex = room.currentPlayerIndex % room.players.length
          } else if (playerIndex < room.currentPlayerIndex) {
            room.currentPlayerIndex--
          }
        }

        // Update game state for all clients
        updateGameState(roomCode)
      }
    })
  })

  // Helper function to update game state
  function updateGameState(roomCode) {
    const room = rooms.get(roomCode)
    if (!room) return

    // Calculate valid moves for each player
    room.players.forEach((player) => {
      const validMoves = getValidMoves(player.hand, room.board)
      io.to(player.id).emit("validMoves", validMoves)
    })

    // Send game state to all clients
    io.to(roomCode).emit("gameState", {
      status: room.status,
      players: room.players.map((p) => ({
        id: p.id,
        name: p.name,
        isHost: p.isHost,
        tileCount: p.hand?.length || 0,
      })),
      board: room.board,
      currentPlayer: room.currentPlayerIndex !== undefined ? room.players[room.currentPlayerIndex]?.id : "",
      winner: room.winner || null,
      scores: room.scores,
    })
  }

  // Helper function to generate domino set
  function generateDominoSet() {
    const dominoes = []
    for (let i = 0; i <= 6; i++) {
      for (let j = i; j <= 6; j++) {
        dominoes.push({
          left: i,
          right: j,
          isDouble: i === j,
        })
      }
    }
    return dominoes
  }

  // Helper function to shuffle array
  function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[array[i], array[j]] = [array[j], array[i]]
    }
  }

  // Helper function to check if a move is valid
  function isValidMove(board, tile, position) {
    if (board.length === 0) return true

    if (position === "left") {
      const leftEnd = board[0]
      return tile.left === leftEnd.left || tile.right === leftEnd.left
    } else {
      const rightEnd = board[board.length - 1]
      return tile.left === rightEnd.right || tile.right === rightEnd.right
    }
  }

  // Helper function to get valid moves for a player
  function getValidMoves(hand, board) {
    if (board.length === 0) return { left: 0, right: 0 }

    let leftValid = null
    let rightValid = null

    if (board.length > 0) {
      const leftEnd = board[0].left
      const rightEnd = board[board.length - 1].right

      for (const tile of hand) {
        if (tile.left === leftEnd || tile.right === leftEnd) {
          leftValid = leftEnd
        }

        if (tile.left === rightEnd || tile.right === rightEnd) {
          rightValid = rightEnd
        }
      }
    }

    return { left: leftValid, right: rightValid }
  }

  // Helper function to check if a player can make a move
  function canPlayerMove(hand, board) {
    const { left, right } = getValidMoves(hand, board)
    return left !== null || right !== null
  }

  // Helper function to check if a specific tile can be played
  function canPlayTile(tile, board) {
    if (board.length === 0) return true

    const leftEnd = board[0].left
    const rightEnd = board[board.length - 1].right

    return tile.left === leftEnd || tile.right === leftEnd || tile.left === rightEnd || tile.right === rightEnd
  }

  // Helper function to check if the game is blocked
  function isGameBlocked(room) {
    // Game is blocked if no player can make a move and boneyard is empty
    if (room.boneyard.length > 0) return false

    for (const player of room.players) {
      if (canPlayerMove(player.hand, room.board)) {
        return false
      }
    }

    return true
  }

  // Helper function to calculate scores
  function calculateScores(room) {
    room.players.forEach((player) => {
      const handValue = player.hand.reduce((sum, tile) => sum + tile.left + tile.right, 0)

      if (room.winner && player.id === room.winner.id) {
        // Winner gets points from other players' hands
        let points = 0
        room.players.forEach((p) => {
          if (p.id !== player.id) {
            points += p.hand.reduce((sum, tile) => sum + tile.left + tile.right, 0)
          }
        })
        room.scores[player.id] = (room.scores[player.id] || 0) + points
      } else {
        // Losers get negative points for their hand
        room.scores[player.id] = (room.scores[player.id] || 0) - handValue
      }
    })
  }

  const PORT = process.env.PORT || 3001
  server.listen(PORT, () => {
    console.log(`> Server listening on port ${PORT}`)
  })
})

