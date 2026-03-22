"use client"

import React, { useState } from "react"
import { NavLink, useNavigate } from "react-router-dom"
import {
  LayoutDashboard, Users, BedDouble, CreditCard,
  BarChart3, FileText, Receipt, Building2,
  AlertCircle, Settings, Layers, FilePlus,
  UtensilsCrossed, ClipboardList, CalendarDays,
   Building, ChevronDown,
} from "lucide-react"

// ─── Nav structure ────────────────────────────────────────────────────────────
interface NavItem {
  path:  string
  icon:  React.ReactNode
  label: string
}

interface NavGroup {
  heading: string
  items:   NavItem[]
}

const NAV_GROUPS: NavGroup[] = [
  {
    heading: "Overview",
    items: [
      { path: "/",            icon: <LayoutDashboard size={16} />, label: "Dashboard"    },
      { path: "/students",    icon: <Users           size={16} />, label: "Students"     },
      { path: "/applications",icon: <FileText        size={16} />, label: "Applications" },
    ],
  },
  {
    heading: "Hostel",
    items: [
      { path: "/blocks",  icon: <Building2  size={16} />, label: "Blocks" },
      { path: "/rooms",   icon: <BedDouble  size={16} />, label: "Rooms"  },
    ],
  },
  {
    heading: "Finance",
    items: [
      { path: "/payments",      icon: <CreditCard size={16} />, label: "Payments"      },
      { path: "/expenses",      icon: <Receipt    size={16} />, label: "Expenses"      },
      { path: "/fee-template",  icon: <Layers     size={16} />, label: "Fee Templates" },
      { path: "/fee-invoice",   icon: <FilePlus   size={16} />, label: "Fee Invoices"  },
      { path: "/reports",       icon: <BarChart3  size={16} />, label: "Reports"       },
    ],
  },
  {
    heading: "Mess",
    items: [
      { path: "/mess-menu",         icon: <UtensilsCrossed size={16} />, label: "Mess Menu"        },
      { path: "/mess-attendance",   icon: <CalendarDays    size={16} />, label: "Attendance"       },
      { path: "/mess-subscription", icon: <ClipboardList   size={16} />, label: "Subscriptions"    },
    ],
  },
  {
    heading: "System",
    items: [
      { path: "/complaints", icon: <AlertCircle size={16} />, label: "Complaints" },
    ],
  },
]

// ─── Collapsible group ────────────────────────────────────────────────────────
function NavGroup({
  group, collapsed,
}: {
  group: NavGroup; collapsed: boolean
}) {
  const [open, setOpen] = useState(true)

  return (
    <div style={{ marginBottom: 4 }}>
      {/* Group heading — hide when sidebar is collapsed */}
      {!collapsed && (
        <button
          onClick={() => setOpen(p => !p)}
          style={{
            width: "100%", display: "flex", alignItems: "center",
            justifyContent: "space-between",
            padding: "5px 16px", background: "none", border: "none",
            cursor: "pointer",
          }}
        >
          <span style={{
            fontSize: 9, fontWeight: 800, letterSpacing: "0.1em",
            textTransform: "uppercase", color: "var(--text-muted)",
          }}>
            {group.heading}
          </span>
          <ChevronDown
            size={11}
            color="var(--text-muted)"
            style={{
              transform: open ? "rotate(0deg)" : "rotate(-90deg)",
              transition: "transform .2s",
            }}
          />
        </button>
      )}

      {/* Items */}
      <div style={{
        overflow: "hidden",
        maxHeight: open || collapsed ? 600 : 0,
        transition: "max-height .25s ease",
      }}>
        {group.items.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === "/"}
            title={collapsed ? item.label : undefined}
            style={({ isActive }) => ({
              display: "flex", alignItems: "center",
              gap: 10,
              padding: collapsed ? "10px 0" : "9px 16px",
              justifyContent: collapsed ? "center" : "flex-start",
              margin: "1px 8px",
              borderRadius: 10,
              border: "none",
              textDecoration: "none",
              fontSize: 13,
              fontWeight: isActive ? 700 : 500,
              color:      isActive ? "var(--accent)"     : "var(--text-muted)",
              background: isActive ? "var(--accent-lo)"  : "transparent",
              borderLeft: isActive && !collapsed
                ? "3px solid var(--accent)"
                : "3px solid transparent",
              transition: "all .15s",
            })}
            onMouseEnter={e => {
              const el = e.currentTarget as HTMLAnchorElement
              if (!el.classList.contains("active")) {
                el.style.background = "var(--card-hover)"
                el.style.color      = "var(--text-sec)"
              }
            }}
            onMouseLeave={e => {
              const el = e.currentTarget as HTMLAnchorElement
              // Let React Router re-apply active styles
              if (!window.location.pathname === (item.path as any)) {
                el.style.background = ""
                el.style.color      = ""
              }
            }}
          >
            {({ isActive }) => (
              <>
                <span style={{
                  color:     isActive ? "var(--accent)" : "var(--text-muted)",
                  flexShrink: 0,
                  display:   "flex",
                }}>
                  {item.icon}
                </span>
                {!collapsed && (
                  <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {item.label}
                  </span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </div>
  )
}

// ─── Main Sidebar ─────────────────────────────────────────────────────────────
interface SidebarProps {
  isOpen: boolean
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen }) => {
  // On mobile isOpen controls visibility; on desktop it controls width (collapsed)
  const collapsed = !isOpen

  return (
    <aside
      style={{
        width:          collapsed ? 0 : 240,
        minWidth:       collapsed ? 0 : 240,
        background:     "var(--surface)",
        borderRight:    "1px solid var(--border)",
        display:        "flex",
        flexDirection:  "column",
        overflow:       "hidden",
        transition:     "width .25s ease, min-width .25s ease",
        flexShrink:     0,
        // On mobile: fixed overlay
        position:       "relative" as const,
      }}
    >
      {/* ── Logo ── */}
      <div style={{
        padding:        "20px 16px 16px",
        borderBottom:   "1px solid var(--border)",
        display:        "flex",
        alignItems:     "center",
        gap:            10,
        flexShrink:     0,
        minWidth:       0,
      }}>
        <div style={{
          width: 34, height: 34, borderRadius: 10, flexShrink: 0,
          background: "var(--accent-lo)", border: "1px solid rgba(99,102,241,.3)",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 0 14px rgba(99,102,241,.2)",
        }}>
          <Building size={17} color="var(--accent)" />
        </div>
        {!collapsed && (
          <div style={{ minWidth: 0, overflow: "hidden" }}>
            <div style={{
              fontSize: 14, fontWeight: 800, color: "var(--text-pri)",
              fontFamily: "'DM Serif Display',serif", whiteSpace: "nowrap",
            }}>
              HostelMS
            </div>
            <div style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 500 }}>
              Admin Panel
            </div>
          </div>
        )}
      </div>

      {/* ── Nav items ── */}
      <nav style={{ flex: 1, overflowY: "auto", overflowX: "hidden", padding: "10px 0" }}>
        {NAV_GROUPS.map(group => (
          <NavGroup key={group.heading} group={group} collapsed={collapsed} />
        ))}
      </nav>

    </aside>
  )
}

export default Sidebar