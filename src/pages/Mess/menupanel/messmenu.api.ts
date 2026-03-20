// const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api"
const BASE_URL = "http://localhost:8000/api/admin"
const ENDPOINT = `${BASE_URL}/menus`

// ─── Types (mirrors backend) ──────────────────────────────────────────────────
export type DayOfWeek = "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday" | "Sunday"
export type MealType  = "breakfast" | "lunch" | "dinner"

export interface Meal {
  items:     string[]
  startTime: string
  endTime:   string
}

export interface MessMenu {
  _id:       string
  dayOfWeek: DayOfWeek
  breakfast: Meal
  lunch:     Meal
  dinner:    Meal
  createdAt: string
  updatedAt: string
}

export interface UpdateMealItemsPayload {
  add?:    string[]
  remove?: string[]
}

export interface UpdateMealTimingPayload {
  startTime?: string
  endTime?:   string
}

export interface UpdateMenuPayload {
  breakfast?: Partial<Meal>
  lunch?:     Partial<Meal>
  dinner?:    Partial<Meal>
}

// ─── Request helper ───────────────────────────────────────────────────────────
async function request<T>(url: string, token: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: {
      "Content-Type":  "application/json",
      "Authorization": `Bearer ${token}`,
    },
    ...options,
  })

  const json = await res.json()
  if (!res.ok) throw new Error(json.message ?? `Request failed: ${res.status}`)
  return json as T
}

// ─── API methods ──────────────────────────────────────────────────────────────
export const MessMenuAPI = {
  getWeekly(token: string): Promise<{ success: boolean; data: MessMenu[] }> {
    return request(`${ENDPOINT}`, token)
  },

  getToday(token: string): Promise<{ success: boolean; data: MessMenu & { currentMeal: string } }> {
    return request(`${ENDPOINT}/today`, token)
  },

  updateMenu(id: string, payload: UpdateMenuPayload, token: string): Promise<{ success: boolean; data: MessMenu }> {
    return request(`${ENDPOINT}/${id}`, token, {
      method: "PATCH",
      body:   JSON.stringify(payload),
    })
  },

  updateMealItems(
    id: string,
    mealType: MealType,
    payload: UpdateMealItemsPayload,
    token: string
  ): Promise<{ success: boolean; data: MessMenu }> {
    return request(`${ENDPOINT}/${id}/${mealType}/items`, token, {
      method: "PATCH",
      body:   JSON.stringify(payload),
    })
  },

  updateMealTiming(
    id: string,
    mealType: MealType,
    payload: UpdateMealTimingPayload,
    token: string
  ): Promise<{ success: boolean; data: MessMenu }> {
    return request(`${ENDPOINT}/${id}/${mealType}/timing`, token, {
      method: "PATCH",
      body:   JSON.stringify(payload),
    })
  },
}