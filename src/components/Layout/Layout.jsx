import React, { useState } from 'react';
import Header from './Header';
// import Sidebar from './Sidebar';
import Footer from './Footer';
import './Layout.css';
import { Outlet } from 'react-router-dom';
import Sidebar from './SideBar';
import { useCustom } from '../../Store/Store';

// // In Layout.jsx, update the logout button in Sidebar.jsx
// const handleLogout = () => {
//   if (window.confirm('Are you sure you want to logout?')) {
//     localStorage.removeItem('isAuthenticated');
//     localStorage.removeItem('user');
//     window.location.href = '/login';
//   }
// };

// In Layout.jsx - Sidebar component
// const handleLogout = () => {
//   if (window.confirm('Are you sure you want to logout?')) {
//     // Clear all auth data
//     localStorage.removeItem('isAuthenticated');
//     localStorage.removeItem('user');
//     localStorage.removeItem('token');
    
//     // Redirect to login
//     window.location.href = '/login';
//   }
// };
const style={
  backgroundColor:"black",
  color:"#fff"
};
const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const {toggleDarkMode}=useCustom();

  const toggleSidebar = () => {
    if(sidebarOpen){

    }else{
      
    }
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className={`layout-wrapper ${sidebarOpen ? '' : 'sidebar-collapsed'}`} style={toggleDarkMode ? style : null}>
      <Sidebar isOpen={sidebarOpen} />
      <div className="main-content-wrapper">
        <Header onToggleSidebar={toggleSidebar} />
        <main className="main-content">
          <Outlet/>
        </main>
        <Footer />
      </div>
    </div>
  );
};

export default Layout;