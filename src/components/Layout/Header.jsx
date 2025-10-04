import React from 'react';
{/* <div className="sidebar-footer">
        <button className="logout-btn" onClick={handleLogout}>
          <i className="fas fa-sign-out-alt"></i>
          <span>Logout</span>
        </button>
      </div> */}
const Header = ({ onToggleSidebar }) => {
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
            <div className="btn btn-secondary dropdown-toggle d-flex align-items-center gap-2 bg-light text-dark border-0" data-bs-toggle="dropdown" aria-expanded="false">
            <i className="fas fa-user-circle"></i>
            <span>Admin</span>
            </div>
            <div className="btn-group">
  <ul className="dropdown-menu dropdown-menu-end">
    <li><button className="dropdown-item" type="button">Logout</button></li>
  </ul>
</div>
          </div>
          <button className="notification-btn">
            <i className="fas fa-bell"></i>
            <span className="notification-badge">3</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;