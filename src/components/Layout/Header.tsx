"use client"

import React, {
  useState, useEffect, useRef, useCallback,
  useMemo, memo,
} from "react"
import { useNavigate }   from "react-router-dom"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  Menu, Bell, BellOff, X, LogOut, Settings,
  User, ChevronDown, Sun, Moon,
  FileText, CreditCard, AlertCircle,
  CheckCircle2, Home, Receipt, RefreshCw,
} from "lucide-react"
import { useCustom }     from "../../Store/Store"
import { useTheme }      from "../../Store/ThemeContext"
import { getSocket }     from "../../Services/socket.client"
import {
  AdminNotificationAPI,
  NOTIFICATION_CFG,
  type Notification,
  type NotificationType,
} from "./notification.api.js"

// ─── Helpers ──────────────────────────────────────────────────────────────────
function relativeTime(ts: string): string {
  const diff = (Date.now() - new Date(ts).getTime()) / 1000
  if (diff < 60)    return "just now"
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return new Date(ts).toLocaleDateString("en-IN", { day:"numeric", month:"short" })
}

function useClickOutside(ref: React.RefObject<HTMLElement>, cb: () => void) {
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) cb()
    }
    document.addEventListener("mousedown", h)
    return () => document.removeEventListener("mousedown", h)
  }, [ref, cb])
}

// Icon per notification type
const TYPE_ICON: Partial<Record<NotificationType, React.ReactNode>> = {
  new_application:      <FileText     size={14}/>,
  application_accepted: <CheckCircle2 size={14}/>,
  application_approved: <CheckCircle2 size={14}/>,
  application_rejected: <X            size={14}/>,
  payment_received:     <CreditCard   size={14}/>,
  complaint_submitted:  <AlertCircle  size={14}/>,
  complaint_resolved:   <CheckCircle2 size={14}/>,
  invoice_generated:    <Receipt      size={14}/>,
  room_assigned:        <Home         size={14}/>,
  subscription_expiring:<RefreshCw    size={14}/>,
}

// Deep-link map: where to navigate when a notification is clicked
const ENTITY_ROUTE: Record<string, string> = {
  application:  "/applications",
  invoice:      "/fee-invoice",
  complaint:    "/complaints",
  payment:      "/payments",
  subscription: "/mess-subscription",
}

// ─── Notification panel ───────────────────────────────────────────────────────
function NotificationPanel({
  items, onRemove, onClear, onMarkAllRead, onNavigate,
}: {
  items:         Notification[]
  onRemove:      (id: string) => void
  onClear:       () => void
  onMarkAllRead: () => void
  onNavigate:    (n: Notification) => void
}) {
  const unread = items.filter(n => !n.isRead).length

  return (
    <div style={{
      position:"absolute", top:"calc(100% + 10px)", right:0,
      width:380, maxHeight:500,
      background:"var(--card)", border:"1px solid var(--border)",
      borderRadius:16, boxShadow:"var(--shadow)",
      zIndex:9999, display:"flex", flexDirection:"column",
      overflow:"hidden", animation:"fadeUp .2s ease",
    }}>
      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"14px 16px", borderBottom:"1px solid var(--border)", flexShrink:0 }}>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <Bell size={15} color="var(--accent)" />
          <span style={{ fontSize:13, fontWeight:700, color:"var(--text-pri)" }}>Notifications</span>
          {unread > 0 && (
            <span style={{ padding:"1px 7px", borderRadius:20, background:"var(--accent)", color:"#fff", fontSize:10, fontWeight:800 }}>
              {unread}
            </span>
          )}
        </div>
        <div style={{ display:"flex", gap:10 }}>
          {unread > 0 && (
            <button onClick={onMarkAllRead} style={{ background:"none", border:"none", cursor:"pointer", fontSize:11, fontWeight:600, color:"var(--accent)" }}>
              Mark all read
            </button>
          )}
          {items.length > 0 && (
            <button onClick={onClear} style={{ background:"none", border:"none", cursor:"pointer", fontSize:11, fontWeight:600, color:"var(--text-muted)" }}>
              Clear all
            </button>
          )}
        </div>
      </div>

      {/* List */}
      <div style={{ overflowY:"auto", flex:1 }}>
        {items.length === 0 ? (
          <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"48px 20px", gap:12, color:"var(--text-muted)" }}>
            <BellOff size={32} style={{ opacity:.3 }} />
            <span style={{ fontSize:13 }}>You're all caught up</span>
          </div>
        ) : (
          items.map((n, i) => {
            const cfg = NOTIFICATION_CFG[n.type] ?? { color:"var(--text-muted)", bg:"var(--input-bg)" }
            return (
              <div
                key={n._id}
                onClick={() => onNavigate(n)}
                style={{
                  display:"flex", alignItems:"flex-start", gap:12,
                  padding:"13px 16px",
                  borderBottom: i < items.length - 1 ? "1px solid var(--border)" : "none",
                  cursor:"pointer",
                  background: n.isRead ? "transparent" : `color-mix(in srgb, ${cfg.color} 5%, var(--card))`,
                  transition:"background .15s",
                }}
                onMouseEnter={e => (e.currentTarget.style.background = "var(--card-hover)")}
                onMouseLeave={e => (e.currentTarget.style.background = n.isRead ? "transparent" : `color-mix(in srgb, ${cfg.color} 5%, var(--card))`)}
              >
                {/* Icon */}
                <div style={{ width:34, height:34, borderRadius:10, flexShrink:0, background:cfg.bg, color:cfg.color, display:"flex", alignItems:"center", justifyContent:"center" }}>
                  {TYPE_ICON[n.type] ?? <Bell size={14}/>}
                </div>

                {/* Content */}
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:13, fontWeight: n.isRead ? 500 : 700, color:"var(--text-pri)", marginBottom:2, display:"flex", alignItems:"center", gap:6 }}>
                    {n.title}
                    {!n.isRead && <span style={{ width:6, height:6, borderRadius:"50%", background:cfg.color, flexShrink:0 }} />}
                  </div>
                  <div style={{ fontSize:12, color:"var(--text-sec)", lineHeight:1.4, overflow:"hidden", display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical" }}>
                    {n.message}
                  </div>
                  <div style={{ fontSize:10, color:"var(--text-muted)", marginTop:4 }}>
                    {relativeTime(n.createdAt)}
                  </div>
                </div>

                {/* Remove */}
                <button
                  onClick={e => { e.stopPropagation(); onRemove(n._id) }}
                  style={{ background:"none", border:"none", cursor:"pointer", color:"var(--text-muted)", display:"flex", padding:2, borderRadius:6, flexShrink:0, marginTop:2 }}
                  onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.color = "var(--red)")}
                  onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.color = "var(--text-muted)")}
                >
                  <X size={12}/>
                </button>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

// ─── User menu ────────────────────────────────────────────────────────────────
function UserMenu({ username, onLogout, onSettings }: {
  username: string; onLogout: () => void; onSettings: () => void
}) {
  return (
    <div style={{ position:"absolute", top:"calc(100% + 10px)", right:0, background:"var(--card)", border:"1px solid var(--border)", borderRadius:14, boxShadow:"var(--shadow)", zIndex:9999, minWidth:180, padding:6, animation:"fadeUp .15s ease" }}>
      <div style={{ padding:"10px 12px 8px", borderBottom:"1px solid var(--border)", marginBottom:4 }}>
        <div style={{ fontSize:13, fontWeight:700, color:"var(--text-pri)" }}>{username}</div>
        <div style={{ fontSize:11, color:"var(--text-muted)", marginTop:2 }}>Administrator</div>
      </div>
      {[
        { icon:<Settings size={14}/>, label:"Settings", action:onSettings, danger:false },
        { icon:<LogOut   size={14}/>, label:"Logout",   action:onLogout,   danger:true  },
      ].map(item => (
        <button key={item.label} onClick={item.action}
          style={{ width:"100%", display:"flex", alignItems:"center", gap:10, padding:"9px 12px", border:"none", background:"transparent", borderRadius:8, cursor:"pointer", color:item.danger?"var(--red)":"var(--text-sec)", fontSize:13, fontWeight:500, transition:"background .1s" }}
          onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.background = item.danger ? "rgba(239,68,68,.08)" : "var(--card-hover)")}
          onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.background = "transparent")}
        >
          {item.icon}{item.label}
        </button>
      ))}
    </div>
  )
}

// ─── Theme button ─────────────────────────────────────────────────────────────
function ThemeButton() {
  const { isDark, setMode } = useTheme()
  // const isDark = theme === "dark"
  return (
    <button onClick={() => setMode(isDark ? "light" : "dark")} title={`Switch to ${isDark?"light":"dark"} mode`}
      style={{ width:36, height:36, borderRadius:10, border:"1px solid var(--border)", background:"transparent", color:"var(--text-sec)", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", transition:"all .2s" }}
      onMouseEnter={e => { const el = e.currentTarget as HTMLButtonElement; el.style.background="var(--accent-lo)"; el.style.color="var(--accent)"; el.style.borderColor="var(--accent)" }}
      onMouseLeave={e => { const el = e.currentTarget as HTMLButtonElement; el.style.background="transparent"; el.style.color="var(--text-sec)"; el.style.borderColor="var(--border)" }}
    >
      {isDark ? <Sun size={16}/> : <Moon size={16}/>}
    </button>
  )
}

// ─── Main Header ──────────────────────────────────────────────────────────────
const Header = memo<{ onToggleSidebar: () => void }>(({ onToggleSidebar }) => {
  const { setToken, token } = useCustom() as { setToken:(t:string|null)=>void; token:string }
  const navigate     = useNavigate()
  const qc           = useQueryClient()

  const [showNotif, setShowNotif] = useState(false)
  const [showUser,  setShowUser]  = useState(false)
  const [localNew,  setLocalNew]  = useState<Notification[]>([])   // socket-pushed, not yet in query cache

  const notifRef = useRef<HTMLDivElement>(null!)
  const userRef  = useRef<HTMLDivElement>(null!)

  useClickOutside(notifRef, () => setShowNotif(false))
  useClickOutside(userRef,  () => setShowUser(false))

  // ── Fetch notifications from REST ─────────────────────────────────────────
  const { data } = useQuery({
    queryKey:  ["notifications", "admin"],
    queryFn:   () => AdminNotificationAPI.getAll({ limit: 30 }, token),
    staleTime: 60_000,
    enabled:   !!token,
  })

  // ── Live socket notifications ─────────────────────────────────────────────
  useEffect(() => {
    const socket = getSocket()
    if (!socket) return

    const handler = (n: Notification) => {
      // Prepend to localNew so it appears instantly in the panel
      setLocalNew(prev => {
        if (prev.some(x => x._id === n._id)) return prev
        return [n, ...prev]
      })
      // Also invalidate the query so the full list refreshes in background
      qc.invalidateQueries({ queryKey: ["notifications", "admin"] })
    }

    socket.on("notification", handler)
    return () => { socket.off("notification", handler) }
  }, [qc])

  // Merge socket-pushed items with query data, deduplicating by _id
  const notifications: Notification[] = useMemo(() => {
    const queryItems = data?.data ?? []
    const merged     = [...localNew, ...queryItems]
    const seen       = new Set<string>()
    return merged.filter(n => {
      if (seen.has(n._id)) return false
      seen.add(n._id); return true
    })
  }, [data?.data, localNew])

  const unread = useMemo(() => notifications.filter(n => !n.isRead).length, [notifications])

  // ── Mark all read ─────────────────────────────────────────────────────────
  const markAllMutation = useMutation({
    mutationFn: () => AdminNotificationAPI.markAllRead(token),
    onSuccess: () => {
      setLocalNew(p => p.map(n => ({ ...n, isRead: true })))
      qc.setQueryData(["notifications", "admin"], (old: any) =>
        old ? { ...old, data: old.data.map((n: Notification) => ({ ...n, isRead: true })), unreadCount: 0 } : old
      )
    },
  })

  // Mark all read when panel opens
  const toggleNotif = useCallback(() => {
    setShowNotif(p => {
      if (!p && unread > 0) markAllMutation.mutate()
      return !p
    })
    setShowUser(false)
  }, [unread, markAllMutation])

  // ── Remove one ────────────────────────────────────────────────────────────
  const handleRemove = useCallback((id: string) => {
    setLocalNew(p => p.filter(n => n._id !== id))
    qc.setQueryData(["notifications", "admin"], (old: any) =>
      old ? { ...old, data: old.data.filter((n: Notification) => n._id !== id) } : old
    )
    AdminNotificationAPI.deleteOne(id, token).catch(console.error)
  }, [token, qc])

  // ── Clear all ─────────────────────────────────────────────────────────────
  const handleClear = useCallback(() => {
    setLocalNew([])
    qc.setQueryData(["notifications", "admin"], (old: any) =>
      old ? { ...old, data: [], total: 0, unreadCount: 0 } : old
    )
    AdminNotificationAPI.clearAll(token).catch(console.error)
  }, [token, qc])

  // ── Navigate on click ─────────────────────────────────────────────────────
  const handleNavigate = useCallback((n: Notification) => {
    const route = n.entityType ? ENTITY_ROUTE[n.entityType] : null
    if (route) navigate(route)
    setShowNotif(false)
  }, [navigate])

  // ── Logout ────────────────────────────────────────────────────────────────
  const handleLogout = async () => {
    try {
      await fetch(`${(import.meta as any).env?.VITE_API_URL ?? "http://localhost:8000/api"}/auth/logout`, {
        method: "POST", credentials: "include",
        headers: { Authorization: `Bearer ${token}` },
      })
    } catch { /* fire-and-forget */ }
    const { disconnectSocket } = await import("../../Services/socket.client.js")
    disconnectSocket()
    setToken(null)
    navigate("/login")
  }

  return (
    <header style={{ background:"var(--surface)", borderBottom:"1px solid var(--border)", position:"sticky", top:0, zIndex:100, flexShrink:0 }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 24px", height:60, gap:16 }}>

        {/* Hamburger */}
        <button onClick={onToggleSidebar}
          style={{ width:36, height:36, borderRadius:10, flexShrink:0, border:"1px solid var(--border)", background:"transparent", color:"var(--text-sec)", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", transition:"all .2s" }}
          onMouseEnter={e => { const el = e.currentTarget as HTMLButtonElement; el.style.background="var(--accent-lo)"; el.style.color="var(--accent)"; el.style.borderColor="var(--accent)" }}
          onMouseLeave={e => { const el = e.currentTarget as HTMLButtonElement; el.style.background="transparent"; el.style.color="var(--text-sec)"; el.style.borderColor="var(--border)" }}
        >
          <Menu size={17}/>
        </button>

        {/* Title */}
        <div style={{ flex:1, minWidth:0 }}>
          <span style={{ fontSize:15, fontWeight:700, color:"var(--text-pri)", fontFamily:"'DM Sans',sans-serif", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis", display:"block" }}>
            Hostel Management System
          </span>
        </div>

        {/* Right actions */}
        <div style={{ display:"flex", alignItems:"center", gap:8, flexShrink:0 }}>
          <ThemeButton />

          {/* Notification bell */}
          <div ref={notifRef} style={{ position:"relative" }}>
            <button onClick={toggleNotif} title="Notifications"
              style={{ width:36, height:36, borderRadius:10, position:"relative", border:`1px solid ${showNotif?"var(--accent)":"var(--border)"}`, background:showNotif?"var(--accent-lo)":"transparent", color:showNotif?"var(--accent)":"var(--text-sec)", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", transition:"all .2s" }}
              onMouseEnter={e => { if (showNotif) return; const el = e.currentTarget as HTMLButtonElement; el.style.background="var(--accent-lo)"; el.style.color="var(--accent)"; el.style.borderColor="var(--accent)" }}
              onMouseLeave={e => { if (showNotif) return; const el = e.currentTarget as HTMLButtonElement; el.style.background="transparent"; el.style.color="var(--text-sec)"; el.style.borderColor="var(--border)" }}
            >
              <Bell size={17}/>
              {unread > 0 && (
                <span style={{ position:"absolute", top:-3, right:-3, minWidth:17, height:17, borderRadius:9, background:"var(--red)", color:"#fff", fontSize:9, fontWeight:800, display:"flex", alignItems:"center", justifyContent:"center", padding:"0 4px", border:"2px solid var(--surface)" }}>
                  {unread > 99 ? "99+" : unread}
                </span>
              )}
            </button>

            {showNotif && (
              <NotificationPanel
                items={notifications}
                onRemove={handleRemove}
                onClear={handleClear}
                onMarkAllRead={() => markAllMutation.mutate()}
                onNavigate={handleNavigate}
              />
            )}
          </div>

          {/* User */}
          <div ref={userRef} style={{ position:"relative" }}>
            <button onClick={() => { setShowUser(p=>!p); setShowNotif(false) }}
              style={{ display:"flex", alignItems:"center", gap:8, padding:"6px 10px 6px 8px", borderRadius:12, border:`1px solid ${showUser?"var(--accent)":"var(--border)"}`, background:showUser?"var(--accent-lo)":"transparent", cursor:"pointer", transition:"all .2s" }}
              onMouseEnter={e => { if (showUser) return; const el = e.currentTarget as HTMLButtonElement; el.style.background="var(--card-hover)"; el.style.borderColor="var(--border-hover)" }}
              onMouseLeave={e => { if (showUser) return; const el = e.currentTarget as HTMLButtonElement; el.style.background="transparent"; el.style.borderColor="var(--border)" }}
            >
              <div style={{ width:26, height:26, borderRadius:8, background:"var(--accent-lo)", border:"1px solid rgba(99,102,241,.3)", color:"var(--accent)", display:"flex", alignItems:"center", justifyContent:"center" }}>
                <User size={14}/>
              </div>
              <span style={{ fontSize:13, fontWeight:600, color:showUser?"var(--accent)":"var(--text-sec)" }}>Admin</span>
              <ChevronDown size={13} color={showUser?"var(--accent)":"var(--text-muted)"} style={{ transform:showUser?"rotate(180deg)":"none", transition:"transform .2s" }}/>
            </button>
            {showUser && (
              <UserMenu
                username="Admin"
                onLogout={handleLogout}
                onSettings={() => { navigate("/settings"); setShowUser(false) }}
              />
            )}
          </div>
        </div>
      </div>
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </header>
  )
})

export default Header