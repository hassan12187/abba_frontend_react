import { useNavigate, useLocation, NavLink } from 'react-router-dom';

const Sidebar = ({ isOpen }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { path: '/', icon: 'fas fa-tachometer-alt', label: 'Dashboard' },
    { path: '/students', icon: 'fas fa-users', label: 'Students' },
    { path: '/rooms', icon: 'fas fa-bed', label: 'Rooms' },
    { path: '/payments', icon: 'fas fa-credit-card', label: 'Payments' },
    { path: '/reports', icon: 'fas fa-chart-bar', label: 'Reports' },
    { path: '/applications', icon: 'fas fa-file-alt', label: 'Applications' },
    { path: '/expenses', icon: 'fas fa-money-bill-wave', label: 'Expenses' },
    {path:'/settings',icon: 'fas fa-money-bill-wave', label: 'Settings'}
  ];

  const isActive = (path) => {
    return location.pathname === path;
  };

  const handleNavigation = (path) => {
    navigate(path);
  };

  const handleLogout = () => {
    // Add logout logic here
    console.log('Logging out...');
  };
  return (
    <aside className={`sidebar-custom ${isOpen ? 'open' : 'closed'}`}>
      <div className="sidebar-header">
        <div className="logo">
          <i className="fas fa-hotel"></i>
          <span>Hostel Admin</span>
        </div>
      </div>
      
      <nav className="sidebar-nav">
        {menuItems.map((item) => (
          <NavLink to={`${item.path}`} className={`nav-item ${isActive(item.path) ? 'active':'' }`}>
          {/* <button */}
            {/* key={item.path} */}
            {/* className={`${isActive(item.path) ? 'active' : ''}`} */}
            {/* // onClick={() => handleNavigation(item.path)} */}
            {/* > */}
            <i className={item.icon}></i>
            <span>{item.label}</span>
          {/* </button> */}
            </NavLink>
        ))}
      </nav>
      
      
    </aside>
  );
};

export default Sidebar;