// ─────────────────────────────────────────────────────────────────────────────
// socket.client.ts
// Single Socket.io client instance shared across the whole frontend.
// Connect once after login, disconnect on logout.
// ─────────────────────────────────────────────────────────────────────────────
import { io, Socket } from "socket.io-client"

const BASE = (import.meta as any).env?.VITE_API_URL ?? "http://localhost:8000"
// const BASE = "http://localhost:8000"

let socket: Socket | null = null

/** Call once after login with the access token. */
export function connectSocket(accessToken: string): Socket {
  if (socket?.connected) return socket

  socket = io(BASE, {
    auth:           { token: accessToken },
    reconnection:   true,
    reconnectionAttempts: 10,
    reconnectionDelay:    1500,
    transports:     ["websocket"],
  })

  socket.on("connect_error", (err) => {
    // Token expired mid-session — header will handle refresh via /auth/refresh
    if (err.message === "Invalid token" || err.message === "Authentication required") {
      console.warn("[Socket] Auth error — token may have expired.")
    }
  })

  return socket
}

/** Call on logout. */
export function disconnectSocket(): void {
  socket?.disconnect()
  socket = null
}

/** Get the current socket instance (null if not connected). */
export function getSocket(): Socket | null {
  return socket
}