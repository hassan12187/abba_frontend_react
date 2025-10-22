import React, { useState, useEffect } from 'react';
import './AdminDashboard.css';
import {NavLink, useNavigate} from "react-router-dom";

const AdminDashboard = () => {
  const navigate=useNavigate();
  const [stats, setStats] = useState({
    totalStudents: 0,
    occupiedRooms: 0,
    paymentsDone: 0,
    pendingApplications: 0
  });

  const [recentActivities, setRecentActivities] = useState([]);

  useEffect(() => {
    // Mock data - replace with API calls
    const loadDashboardData = () => {
      setStats({
        totalStudents: 156,
        occupiedRooms: 42,
        paymentsDone: 128,
        pendingApplications: 18
      });

      setRecentActivities([
        {
          id: 1,
          type: 'application',
          message: 'New student application received',
          time: '2 hours ago',
          icon: 'fas fa-file-alt',
          color: 'info'
        },
        {
          id: 2,
          type: 'payment',
          message: 'Payment received from Student #123',
          time: '5 hours ago',
          icon: 'fas fa-credit-card',
          color: 'success'
        },
        {
          id: 3,
          type: 'room',
          message: 'Room 204 has been allocated',
          time: '1 day ago',
          icon: 'fas fa-bed',
          color: 'warning'
        }
      ]);
    };

    loadDashboardData();
  }, []);

  const StatCard = ({ title, value, icon, color, description }) => (
    <div className={`stat-card ${color}`}>
      <div className="stat-icon">
        <i className={icon}></i>
      </div>
      <div className="stat-content">
        <h3>{title}</h3>
        <div className="stat-value">{value}</div>
        <p className="stat-description">{description}</p>
      </div>
    </div>
  );

  return (
    <div className="dashboard-page">
      {/* Page Header */}
      <div className="page-header">
        <h2>Dashboard Overview</h2>
        <p>Welcome back! Here's what's happening with your hostel today.</p>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <StatCard
          title="Total Students"
          value={stats.totalStudents}
          icon="fas fa-users"
          color="primary"
          description="Currently enrolled"
        />
        <StatCard
          title="Occupied Rooms"
          value={stats.occupiedRooms}
          icon="fas fa-bed"
          color="success"
          description="72% occupancy rate"
        />
        <StatCard
          title="Payments Done"
          value={stats.paymentsDone}
          icon="fas fa-credit-card"
          color="warning"
          description="This month"
        />
        <StatCard
          title="Pending Applications"
          value={stats.pendingApplications}
          icon="fas fa-file-alt"
          color="danger"
          description="Require review"
        />
      </div>

      {/* Recent Activities */}
      <div className="dashboard-section">
        <div className="section-header">
          <h3>Recent Activities</h3>
          <button className="btn btn-outline-primary">
            <i className="fas fa-list"></i>
            View All Activities
          </button>
        </div>
        <div className="activities-list">
          {recentActivities.map(activity => (
            <div key={activity.id} className="activity-item">
              <div className={`activity-icon ${activity.color}`}>
                <i className={activity.icon}></i>
              </div>
              <div className="activity-content">
                <p className="activity-message">{activity.message}</p>
                <span className="activity-time">{activity.time}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="dashboard-section">
        <div className="section-header">
          <h3>Quick Actions</h3>
        </div>
        <div className="quick-actions-grid">
          <button className="quick-action-btn" onClick={()=>navigate('/applications')}>
            <i className="fas fa-user-plus"></i>
            <span>  Add New Student</span>
          </button>
          <button className="quick-action-btn" onClick={()=>navigate('/rooms')}>
            <i className="fas fa-bed"></i>
            <span>Manage Rooms</span>
          </button>
          <button className="quick-action-btn" onClick={()=>navigate('/payments')}>
            <i className="fas fa-file-invoice-dollar"></i>
            <span>Process Payments</span>
          </button>
          <button className="quick-action-btn" onClick={()=>navigate('/reports')}>
            <i className="fas fa-chart-bar"></i>
            <span>View Reports</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;