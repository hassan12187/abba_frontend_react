import React, { createContext, useContext, useState, useEffect, useCallback } from "react"

// ─── Token sets ───────────────────────────────────────────────────────────────
export const themes = {
  dark: {
    "--bg":          "#0c0f1a",
    "--surface":     "#131726",
    "--card":        "#181d2e",
    "--card-hover":  "#1e2338",
    "--border":      "rgba(255,255,255,0.07)",
    "--border-hover":"rgba(99,102,241,0.3)",
    "--accent":      "#6366f1",
    "--accent-lo":   "rgba(99,102,241,0.12)",
    "--accent-glow": "rgba(99,102,241,0.35)",
    "--amber":       "#f59e0b",
    "--green":       "#10b981",
    "--red":         "#ef4444",
    "--text-pri":    "#f1f5f9",
    "--text-sec":    "#94a3b8",
    "--text-muted":  "#475569",
    "--input-bg":    "rgba(255,255,255,0.04)",
    "--scrollbar":   "rgba(255,255,255,0.1)",
    "--overlay":     "rgba(0,0,0,0.75)",
    "--shadow":      "0 40px 80px rgba(0,0,0,0.6)",
    "--stat-shadow": "0 8px 32px rgba(0,0,0,0.4)",
  },
  light: {
    "--bg":          "#f4f6fb",
    "--surface":     "#ffffff",
    "--card":        "#ffffff",
    "--card-hover":  "#f8f9ff",
    "--border":      "rgba(0,0,0,0.08)",
    "--border-hover":"rgba(99,102,241,0.35)",
    "--accent":      "#5558e8",
    "--accent-lo":   "rgba(85,88,232,0.10)",
    "--accent-glow": "rgba(85,88,232,0.20)",
    "--amber":       "#d97706",
    "--green":       "#059669",
    "--red":         "#dc2626",
    "--text-pri":    "#0f172a",
    "--text-sec":    "#475569",
    "--text-muted":  "#94a3b8",
    "--input-bg":    "rgba(0,0,0,0.03)",
    "--scrollbar":   "rgba(0,0,0,0.15)",
    "--overlay":     "rgba(0,0,0,0.45)",
    "--shadow":      "0 24px 60px rgba(0,0,0,0.12)",
    "--stat-shadow": "0 4px 20px rgba(0,0,0,0.08)",
  },
} as const

export type ThemeMode = keyof typeof themes

// ─── Context ──────────────────────────────────────────────────────────────────
interface ThemeContextValue {
  mode:       ThemeMode
  toggle:     () => void
  setMode:    (m: ThemeMode) => void
  isDark:     boolean
  t:          Record<string, string>   // shorthand token accessor
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

// ─── Provider ─────────────────────────────────────────────────────────────────
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>(() => {
    try {
      return (localStorage.getItem("hostel-theme") as ThemeMode) ?? "dark"
    } catch {
      return "dark"
    }
  })

  // Apply CSS variables to :root whenever mode changes
  useEffect(() => {
    const root   = document.documentElement
    const tokens = themes[mode]
    Object.entries(tokens).forEach(([key, val]) => root.style.setProperty(key, val))
    root.setAttribute("data-theme", mode)
    try { localStorage.setItem("hostel-theme", mode) } catch { /* safari private */ }
  }, [mode])

  const setMode    = useCallback((m: ThemeMode) => setModeState(m), [])
  const toggle     = useCallback(() => setModeState(p => p === "dark" ? "light" : "dark"), [])

  const value: ThemeContextValue = {
    mode,
    toggle,
    setMode,
    isDark: mode === "dark",
    t:      themes[mode] as unknown as Record<string, string>,
  }

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error("useTheme must be used inside <ThemeProvider>")
  return ctx
}