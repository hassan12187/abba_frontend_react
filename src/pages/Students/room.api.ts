// const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api"
const BASE_URL = "http://localhost:8000/api/admin"

// ─── Types ────────────────────────────────────────────────────────────────────
export interface Block {
  _id:      string
  block_no: string
  status:   "under construction" | "ready" | "maintenance"
}

export interface Room {
  _id:             string
  room_no:         string
  type:            "Single Seater" | "Double Seater" | "Triple Seater"
  capacity:        number
  available_beds:  number
  fees:            number
  status:          "available" | "occupied" | "maintenance"
  block_id?:       string | Block
  floor?:          string
  block?:          string
}

// ─── Request helper ───────────────────────────────────────────────────────────
async function request<T>(url: string, token: string): Promise<T> {
  const res = await fetch(url, {
    headers: { "Authorization": `Bearer ${token}` },
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.message ?? `Request failed: ${res.status}`)
  return json as T
}

// ─── Unified RoomAPI export (matches student.queries.ts) ─────────────────────
export const RoomAPI = {

  /** GET /blocks?limit=100&sortBy=block_no — block selector dropdown */
  getBlocks(token: string): Promise<{ success: boolean; data: Block[] }> {
    return request(
      `${BASE_URL}/blocks?limit=100&sortBy=block_no&sortOrder=asc`,
      token
    )
  },

  /** GET /blocks/:blockId/rooms?available=true — rooms with free beds */
  getRoomsByBlock(
    blockId: string,
    token:   string
  ): Promise<{ success: boolean; data: Room[] }> {
    return request(
      `${BASE_URL}/blocks/${encodeURIComponent(blockId)}/rooms?available=true`,
      token
    )
  },
}