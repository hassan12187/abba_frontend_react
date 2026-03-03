import React, { useState,type CSSProperties } from 'react';
import Header from './Header';
import Footer from './Footer';
import './Layout';
import { Outlet } from 'react-router-dom';
import Sidebar from './SideBar';
import { useCustom } from '../../Store/Store';

// --- Interfaces ---

interface CustomStore {
  toggleDarkMode?: boolean;
  // Add other store properties here as needed
}

// Defining the dark mode styles using React's CSSProperties type
const darkModeStyle: CSSProperties = {
  backgroundColor: "black",
  color: "#fff"
};

const Layout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);
  
  // Accessing the store with type safety
  const { toggleDarkMode } = useCustom() as CustomStore;

  const toggleSidebar = (): void => {
    // Logic for sidebar state toggle
    setSidebarOpen((prev) => !prev);
  };

  return (
    <div 
      className={`layout-wrapper ${sidebarOpen ? '' : 'sidebar-collapsed'}`} 
      style={toggleDarkMode ? darkModeStyle : undefined}
    >
      {/* Passing the state as a prop to Sidebar */}
      <Sidebar isOpen={sidebarOpen} />
      
      <div className="main-content-wrapper">
        {/* Passing the toggle function as a prop to Header */}
        <Header onToggleSidebar={toggleSidebar} />
        
        <main className="main-content">
          <Outlet />
        </main>
        
        <Footer />
      </div>
    </div>
  );
};

export default Layout;