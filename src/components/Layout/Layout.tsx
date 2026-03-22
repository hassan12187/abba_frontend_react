import React, { useEffect, useState ,useRef} from 'react';
import Header from './Header';
import Footer from './Footer';
import './Layout.css';
import { Outlet } from 'react-router-dom';
import Sidebar from './SideBar';
import { useCustom } from '../../Store/Store';
import Axios from '../../Services/Axios';

const REFRESH_MS=13*60*1000;

const useTokenRefresh=()=>{
  const {setToken}=useCustom() as {setToken:(t:string|null)=>void};
  const intervalRef=useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(()=>{
    intervalRef.current = setInterval(async()=>{
      try{
        const res=await Axios.post("/api/auth/refresh",{},{withCredentials:true})
        setToken(res.data.accessToken)
      }catch{
        setToken(null);
      }
    },REFRESH_MS);
    return()=>{
      if(intervalRef.current)clearInterval(intervalRef.current)
    };
  },[setToken])
};

const Layout: React.FC = () => {
useTokenRefresh();
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);
  
  // Accessing the store with type safety

  const toggleSidebar = (): void => {
    // Logic for sidebar state toggle
    setSidebarOpen((prev) => !prev);
  };

  return (
    <div 
      className={`layout-wrapper ${sidebarOpen ? '' : 'sidebar-collapsed'}`} 
    >
      {/* Passing the state as a prop to Sidebar */}
      <Sidebar isOpen={sidebarOpen} />
      
      <div className="main-content-wrapper" >
        {/* Passing the toggle function as a prop to Header */}
        <Header onToggleSidebar={toggleSidebar} />
        
        <main className="main-content page-wrapper">
          <Outlet />
        </main>
        
        <Footer />
      </div>
    </div>
  );
};

export default Layout;