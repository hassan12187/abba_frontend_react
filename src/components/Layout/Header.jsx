import { useState, useEffect, useRef,  useCallback, memo, useMemo } from 'react';
import socket from '../../Services/Socket';
import Axios from "../../Services/Axios";
import {useCustom} from "../../Store/Store";
import {NavLink, useNavigate} from "react-router-dom";
import useNotificationQuery from '../hooks/useNotificationQuery';
import { useMutation } from '@tanstack/react-query';
import { PatchService } from '../../Services/Services';

const Header = memo(({ onToggleSidebar }) => {
  const {setToken,token}=useCustom();
  const [state, setState] = useState([]);
  const [dropdown,setDropDown]=useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const {data,isLoading}=useNotificationQuery("/api/notification",token);
  useEffect(() => {
    const handleNewApplication=(notification)=>{
      setState(prev=> [notification,...prev]);
    }
    socket.on("newApplication",handleNewApplication);

    return () => {
      socket.off("newApplication");
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  useEffect(()=>{
    if(data?.data){
      setState(prev=>{
          const existingIds = new Set(prev.map(n=>n._id));
          const newOnes= prev.filter(p => !existingIds.has(p._id) );
          return [...prev,...newOnes];
      });
    };
    return ()=>null;
  },[data]);
const unReadCount=useMemo(()=>state.filter(n=>!n?.isRead).length,[state]);
const {mutate:markRead} = useMutation({
  mutationFn:()=>PatchService('/api/notification/mark-read',{},token),
  onSuccess:()=>setState((prev)=>prev.map(n => ({...n,isRead:true}))),
});
  const toggleNotifications = useCallback(() => {
    setShowNotifications(!showNotifications);
    markRead();
  },[markRead]);

  const clearNotifications = () => {
    setState([]);
  };
  const removeNotification = (index) => {
    setState((prev) => prev.filter((_, i) => i !== index));
  };
  const handleLogOut=async()=>{
    try {
      const result = await Axios.post("/logout",{},{
        withCredentials:true
      });
      if(result.status==204){
        setToken(null);
        navigate("/login")
      }
    } catch (error) {
      console.log(`errro ${error}`);
    }
  };
  if(isLoading)return <h1>Loading...</h1>;
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
            <div className="btn btn-light dropdown-toggle d-flex align-items-center gap-2 bg-light text-dark border-0" onClick={()=>setDropDown(!dropdown)}>
              <i className="fas fa-user-circle"></i>
              <span>Admin</span>
            </div>
            <div className={`btn-group ${dropdown ? "active" : ""}`}>
              <ul className="dropdown-menu dropdown-menu-end">
                <li><button className="dropdown-item" type="button" onClick={handleLogOut}>Logout</button></li>
              </ul>
            </div>
          </div>
          
          <div className="notification-wrapper" ref={dropdownRef}>
            <button className="notification-btn" onClick={toggleNotifications}>
              <i className="fas fa-bell"></i>
              {
              unReadCount > 0 && (
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
                      <div key={index} className="notification-item" onClick={()=>navigate(`/application/details/${notification.application_id}`)}>
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
                          onClick={() => removeNotification(index)}
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