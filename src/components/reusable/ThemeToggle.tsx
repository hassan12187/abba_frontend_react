import React, { useState } from "react"
import { Sun, Moon } from "lucide-react"
import { useTheme } from "../../Store/ThemeContext"

interface ThemeToggleProps {
  /** "icon" = compact icon-only button, "pill" = icon + label, "menu" = full dropdown row */
  variant?: "icon" | "pill" | "menu"
  className?: string
}

export function ThemeToggle({ variant = "pill", className }: ThemeToggleProps) {
  const { mode, toggle, isDark } = useTheme()
  const [hovered, setHovered] = useState(false)

  // ── Icon only ─────────────────────────────────────────────────────────────
  if (variant === "icon") {
    return (
      <button
        onClick={toggle}
        title={`Switch to ${isDark ? "light" : "dark"} mode`}
        className={className}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          width: 36, height: 36, borderRadius: 10, border: "1px solid var(--border)",
          background: hovered ? "var(--accent-lo)" : "var(--input-bg)",
          color: hovered ? "var(--accent)" : "var(--text-sec)",
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer", transition: "all .2s", flexShrink: 0,
        }}
      >
        {isDark ? <Sun size={16} /> : <Moon size={16} />}
      </button>
    )
  }

  // ── Pill (icon + label) ───────────────────────────────────────────────────
  if (variant === "pill") {
    return (
      <button
        onClick={toggle}
        className={className}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          padding: "8px 16px", borderRadius: 20,
          border: "1px solid var(--border)",
          background: hovered ? "var(--accent-lo)" : "var(--surface)",
          color: hovered ? "var(--accent)" : "var(--text-sec)",
          fontSize: 12, fontWeight: 600, cursor: "pointer",
          transition: "all .2s", userSelect: "none",
          boxShadow: hovered ? "0 0 0 2px var(--accent-lo)" : "none",
        }}
      >
        {/* Animated track */}
        <span style={{
          position: "relative", width: 32, height: 18, borderRadius: 9,
          background: isDark
            ? "linear-gradient(135deg,#6366f1,#4f46e5)"
            : "linear-gradient(135deg,#f59e0b,#f97316)",
          display: "inline-block", flexShrink: 0,
          transition: "background .3s",
        }}>
          <span style={{
            position: "absolute", top: 2,
            left: isDark ? 2 : 16,
            width: 14, height: 14, borderRadius: "50%", background: "#fff",
            transition: "left .25s cubic-bezier(.4,0,.2,1)",
            boxShadow: "0 1px 4px rgba(0,0,0,.3)",
          }} />
        </span>
        {isDark ? "Dark" : "Light"}
      </button>
    )
  }

  // ── Menu row (for sidebar / dropdown) ─────────────────────────────────────
  return (
    <button
      onClick={toggle}
      className={className}
      style={{
        width: "100%", display: "flex", alignItems: "center", gap: 12,
        padding: "10px 16px", borderRadius: 10, border: "none",
        background: hovered ? "var(--accent-lo)" : "transparent",
        color: "var(--text-sec)", fontSize: 13, fontWeight: 500,
        cursor: "pointer", transition: "all .15s", textAlign: "left",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <span style={{
        width: 32, height: 32, borderRadius: 8, flexShrink: 0,
        display: "flex", alignItems: "center", justifyContent: "center",
        background: isDark ? "rgba(99,102,241,.15)" : "rgba(245,158,11,.15)",
        color: isDark ? "#6366f1" : "#f59e0b",
      }}>
        {isDark ? <Moon size={15} /> : <Sun size={15} />}
      </span>
      <span style={{ flex: 1 }}>
        {isDark ? "Dark Mode" : "Light Mode"}
      </span>
      {/* Toggle track */}
      <span style={{
        position: "relative", width: 36, height: 20, borderRadius: 10, flexShrink: 0,
        background: isDark
          ? "linear-gradient(135deg,#6366f1,#4f46e5)"
          : "rgba(0,0,0,0.12)",
        transition: "background .3s",
      }}>
        <span style={{
          position: "absolute", top: 3,
          left: isDark ? 18 : 3,
          width: 14, height: 14, borderRadius: "50%", background: "#fff",
          transition: "left .25s cubic-bezier(.4,0,.2,1)",
          boxShadow: "0 1px 4px rgba(0,0,0,.25)",
        }} />
      </span>
    </button>
  )
}