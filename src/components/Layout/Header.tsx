import React, { useState, useEffect, useRef, useCallback, memo, useMemo,type MouseEvent } from 'react';
import socket from '../../Services/Socket';
import Axios from "../../Services/Axios";
import { useCustom } from "../../Store/Store";
import { useNavigate } from "react-router-dom";
import useNotificationQuery from '../hooks/useNotificationQuery';
import { useMutation } from '@tanstack/react-query';
import { PatchService } from '../../Services/Services';

// --- Interfaces ---

interface NotificationItem {
  _id: string;
  application_id: string;
  message?: string;
  isRead: boolean;
  timestamp?: string | Date;
}

interface HeaderProps {
  onToggleSidebar: () => void;
}

// Typing the Store return value (adjust based on your actual Store structure)
interface CustomStore {
  setToken: (token: string | null) => void;
  token: string;
}

const Header = memo<HeaderProps>(({ onToggleSidebar }) => {
  const { setToken, token } = useCustom() as CustomStore;
  const [state, setState] = useState<NotificationItem[]>([]);
  const [dropdown, setDropDown] = useState<boolean>(false);
  const [showNotifications, setShowNotifications] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Queries
  const { data, isLoading } = useNotificationQuery("/api/notification", token);

  // Socket Logic
  useEffect(() => {
    const handleNewApplication = (notification: NotificationItem) => {
      setState(prev => [notification, ...prev]);
    }
    
    socket.on("newApplication", handleNewApplication);

    return () => {
      socket.off("newApplication", handleNewApplication);
    };
  }, []);

  // Click Outside Logic
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | globalThis.MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Sync Data from Query to State
  useEffect(() => {
    if (data?.data) {
      setState(prev => {
        const existingIds = new Set(prev.map(n => n._id));
        const newOnes = (data.data as NotificationItem[]).filter(p => !existingIds.has(p._id));
        return [...prev, ...newOnes];
      });
    }
  }, [data]);

  const unReadCount = useMemo(() => state.filter(n => !n?.isRead).length, [state]);

  // Mutations
  const { mutate: markRead } = useMutation({
    mutationFn: () => PatchService('/api/notification/mark-read', {}, token),
    onSuccess: () => setState((prev) => prev.map(n => ({ ...n, isRead: true }))),
  });

  const toggleNotifications = useCallback(() => {
    setShowNotifications(prev => !prev);
    if (!showNotifications) {
      markRead();
    }
  }, [showNotifications, markRead]);

  const clearNotifications = () => {
    setState([]);
  };

  const removeNotification = (e: React.MouseEvent, index: number) => {
    e.stopPropagation(); // Prevent navigation when clicking the remove button
    setState((prev) => prev.filter((_, i) => i !== index));
  };

  const handleLogOut = async () => {
    try {
      const result = await Axios.post("/logout", {}, {
        withCredentials: true
      });
      if (result.status === 204) {
        setToken(null);
        navigate("/login");
      }
    } catch (error) {
      console.error(`Logout error: ${error}`);
    }
  };

  if (isLoading) return <h1>Loading...</h1>;

  return (
    <header className="main-header">
      <div className="header-container">
        <button className="sidebar-toggle" onClick={onToggleSidebar}>
          <i className="fas fa-bars"></i>
        </button>
        
        <div className="header-title">
          <h1>Hostel Management System</h1>
        </div>
        
        <div className="header-actions">
          <div className="user-profile">
            <div 
              className="btn btn-light dropdown-toggle d-flex align-items-center gap-2 bg-light text-dark border-0" 
              onClick={() => setDropDown(!dropdown)}
            >
              <i className="fas fa-user-circle"></i>
              <span>Admin</span>
            </div>
            <div className={`btn-group ${dropdown ? "active" : ""}`}>
              <ul className={`dropdown-menu dropdown-menu-end ${dropdown ? "show" : ""}`}>
                <li>
                  <button className="dropdown-item" type="button" onClick={handleLogOut}>
                    Logout
                  </button>
                </li>
              </ul>
            </div>
          </div>
          
          <div className="notification-wrapper" ref={dropdownRef}>
            <button className="notification-btn" onClick={toggleNotifications}>
              <i className="fas fa-bell"></i>
              {unReadCount > 0 && (
                <span className="notification-badge">{unReadCount}</span>
              )}
            </button>
            
            {showNotifications && (
              <div className="notification-dropdown">
                <div className="notification-header">
                  <h6>Notifications</h6>
                  {state.length > 0 && (
                    <button 
                      className="clear-all-btn" 
                      onClick={clearNotifications}
                    >
                      Clear All
                    </button>
                  )}
                </div>
                
                <div className="notification-list">
                  {state.length === 0 ? (
                    <div className="no-notifications">
                      <i className="fas fa-bell-slash"></i>
                      <p>No new notifications</p>
                    </div>
                  ) : (
                    state.map((notification, index) => (
                      <div 
                        key={notification._id || index} 
                        className={`notification-item ${!notification.isRead ? 'unread' : ''}`}
                        onClick={() => navigate(`/application/details/${notification.application_id}`)}
                      >
                        <div className="notification-content">
                          <div className="notification-icon">
                            <i className="fas fa-file-alt"></i>
                          </div>
                          <div className="notification-text">
                            <h6>New Application</h6>
                            <p>{notification.message || 'A new hostel application has been submitted'}</p>
                            {notification.timestamp && (
                              <span className="notification-time">
                                {new Date(notification.timestamp).toLocaleTimeString()}
                              </span>
                            )}
                          </div>
                        </div>
                        <button 
                          className="remove-notification-btn"
                          onClick={(e) => removeNotification(e, index)}
                        >
                          <i className="fas fa-times"></i>
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
});

export default Header;