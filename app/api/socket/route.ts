import { NextResponse } from "next/server"

// This is a placeholder route handler
// Socket.io needs to be implemented in a separate server
export async function GET() {
  return NextResponse.json({ message: "Socket.io server needs to be run separately" })
}

