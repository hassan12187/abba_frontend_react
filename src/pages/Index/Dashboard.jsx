import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Chart, registerables } from 'chart.js';
import './Dashboard.css';

// Register Chart.js components
Chart.register(...registerables);

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalRooms: 0,
    monthlyPayments: 0,
    monthlyExpenses: 0,
    pendingApplications: 0,
    occupiedRooms: 0,
    availableRooms: 0
  });

  const feesChartRef = useRef(null);
  const roomsChartRef = useRef(null);
  const feesChartInstance = useRef(null);
  const roomsChartInstance = useRef(null);

  // Sample data
  useEffect(() => {
    const sampleStats = {
      totalStudents: 156,
      totalRooms: 45,
      monthlyPayments: 450000,
      monthlyExpenses: 320000,
      pendingApplications: 12,
      occupiedRooms: 32,
      availableRooms: 13
    };
    setStats(sampleStats);
  }, []);

  // Initialize charts
  useEffect(() => {
    if (stats.totalStudents > 0) {
      initializeCharts();
    }

    return () => {
      // Cleanup charts on unmount
      if (feesChartInstance.current) {
        feesChartInstance.current.destroy();
      }
      if (roomsChartInstance.current) {
        roomsChartInstance.current.destroy();
      }
    };
  }, [stats]);

  const initializeCharts = () => {
    // Fees Collection Chart
    const feesCtx = feesChartRef.current?.getContext('2d');
    if (feesCtx && !feesChartInstance.current) {
      feesChartInstance.current = new Chart(feesCtx, {
        type: 'line',
        data: {
          labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
          datasets: [
            {
              label: 'Fee Collection (PKR)',
              data: [380000, 420000, 390000, 450000, 480000, 520000, 510000, 490000, 530000, 550000, 520000, 580000],
              borderColor: '#3498db',
              backgroundColor: 'rgba(52, 152, 219, 0.1)',
              borderWidth: 3,
              fill: true,
              tension: 0.4
            }
          ]
        },
        options: {
          responsive: true,
          plugins: {
            legend: {
              position: 'top',
            },
            title: {
              display: true,
              text: 'Monthly Fee Collection Trend'
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                callback: function(value) {
                  return 'PKR ' + (value / 1000).toFixed(0) + 'K';
                }
              }
            }
          }
        }
      });
    }

    // Room Status Chart
    const roomsCtx = roomsChartRef.current?.getContext('2d');
    if (roomsCtx && !roomsChartInstance.current) {
      roomsChartInstance.current = new Chart(roomsCtx, {
        type: 'doughnut',
        data: {
          labels: ['Occupied', 'Available', 'Maintenance'],
          datasets: [
            {
              data: [stats.occupiedRooms, stats.availableRooms, stats.totalRooms - stats.occupiedRooms - stats.availableRooms],
              backgroundColor: [
                'rgba(39, 174, 96, 0.8)',
                'rgba(52, 152, 219, 0.8)',
                'rgba(243, 156, 18, 0.8)'
              ],
              borderColor: [
                'rgba(39, 174, 96, 1)',
                'rgba(52, 152, 219, 1)',
                'rgba(243, 156, 18, 1)'
              ],
              borderWidth: 2
            }
          ]
        },
        options: {
          responsive: true,
          plugins: {
            legend: {
              position: 'bottom',
            },
            title: {
              display: true,
              text: 'Room Occupancy Distribution'
            }
          }
        }
      });
    }
  };

  const quickActions = [
    {
      title: 'Student Applications',
      icon: 'fas fa-file-alt',
      count: stats.pendingApplications,
      color: 'warning',
      path: '/applications',
      description: 'Pending review'
    },
    {
      title: 'Manage Students',
      icon: 'fas fa-users',
      count: stats.totalStudents,
      color: 'primary',
      path: '/students',
      description: 'Total enrolled'
    },
    {
      title: 'Room Management',
      icon: 'fas fa-bed',
      count: stats.totalRooms,
      color: 'success',
      path: '/rooms',
      description: 'Manage rooms'
    },
    {
      title: 'Payment Processing',
      icon: 'fas fa-credit-card',
      count: stats.monthlyPayments,
      color: 'info',
      path: '/payments',
      description: 'This month'
    }
  ];

  const recentActivities = [
    {
      id: 1,
      type: 'payment',
      message: 'Payment received from Ali Ahmed',
      amount: 15000,
      time: '2 hours ago',
      icon: 'fas fa-money-bill-wave',
      color: 'success'
    },
    {
      id: 2,
      type: 'application',
      message: 'New application from Sara Khan',
      time: '5 hours ago',
      icon: 'fas fa-user-plus',
      color: 'info'
    },
    {
      id: 3,
      type: 'maintenance',
      message: 'Room 201 maintenance completed',
      time: '1 day ago',
      icon: 'fas fa-tools',
      color: 'warning'
    },
    {
      id: 4,
      type: 'expense',
      message: 'Electricity bill paid',
      amount: 45000,
      time: '2 days ago',
      icon: 'fas fa-receipt',
      color: 'danger'
    }
  ];

  const handleQuickAction = (path) => {
    navigate(path);
  };

  const formatCurrency = (amount) => {
    return 'PKR ' + amount.toLocaleString();
  };

  const getPercentage = (value, total) => {
    return ((value / total) * 100).toFixed(1) + '%';
  };

  return (
    <div className="dashboard-page">
      {/* Header Section */}
      <div className="dashboard-header">
        <div className="header-content">
          <h1>
            <i className="fas fa-tachometer-alt"></i>
            Dashboard Overview
          </h1>
          <p>Welcome to Mehran Hostel Management System</p>
        </div>
        <div className="header-actions">
          <div className="date-display">
            <i className="fas fa-calendar-alt"></i>
            {new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </div>
        </div>
      </div>

      {/* Quick Stats Section */}
      <div className="stats-section">
        <div className="stats-grid">
          {quickActions.map((action, index) => (
            <div 
              key={index} 
              className={`stat-card ${action.color}`}
              onClick={() => handleQuickAction(action.path)}
            >
              <div className="stat-icon">
                <i className={action.icon}></i>
              </div>
              <div className="stat-content">
                <h3>{action.title}</h3>
                <div className="stat-value">
                  {action.color === 'info' ? formatCurrency(action.count) : action.count}
                </div>
                <p className="stat-description">{action.description}</p>
              </div>
              <div className="stat-arrow">
                <i className="fas fa-chevron-right"></i>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Financial Overview */}
      <div className="financial-overview">
        <div className="section-card">
          <h3 className="section-title">
            <i className="fas fa-chart-line"></i>
            Financial Overview
          </h3>
          <div className="financial-grid">
            <div className="financial-card income">
              <div className="financial-icon">
                <i className="fas fa-arrow-down"></i>
              </div>
              <div className="financial-content">
                <h4>Monthly Income</h4>
                <div className="financial-value">{formatCurrency(stats.monthlyPayments)}</div>
                <div className="financial-trend positive">
                  <i className="fas fa-arrow-up"></i>
                  12.5% from last month
                </div>
              </div>
            </div>

            <div className="financial-card expenses">
              <div className="financial-icon">
                <i className="fas fa-arrow-up"></i>
              </div>
              <div className="financial-content">
                <h4>Monthly Expenses</h4>
                <div className="financial-value">{formatCurrency(stats.monthlyExpenses)}</div>
                <div className="financial-trend negative">
                  <i className="fas fa-arrow-up"></i>
                  8.2% from last month
                </div>
              </div>
            </div>

            <div className="financial-card profit">
              <div className="financial-icon">
                <i className="fas fa-balance-scale"></i>
              </div>
              <div className="financial-content">
                <h4>Net Profit</h4>
                <div className="financial-value">
                  {formatCurrency(stats.monthlyPayments - stats.monthlyExpenses)}
                </div>
                <div className="financial-trend positive">
                  <i className="fas fa-arrow-up"></i>
                  {getPercentage(stats.monthlyPayments - stats.monthlyExpenses, stats.monthlyPayments)} margin
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="charts-section">
        <div className="charts-grid">
          <div className="chart-card">
            <div className="chart-header">
              <h4>
                <i className="fas fa-chart-line"></i>
                Monthly Fee Collection
              </h4>
              <div className="chart-actions">
                <button className="btn btn-sm btn-outline">
                  <i className="fas fa-download"></i>
                  Export
                </button>
              </div>
            </div>
            <div className="chart-container">
              <canvas ref={feesChartRef}></canvas>
            </div>
          </div>

          <div className="chart-card">
            <div className="chart-header">
              <h4>
                <i className="fas fa-bed"></i>
                Room Status Distribution
              </h4>
              <div className="chart-stats">
                <div className="room-stat">
                  <span className="dot occupied"></span>
                  {stats.occupiedRooms} Occupied
                </div>
                <div className="room-stat">
                  <span className="dot available"></span>
                  {stats.availableRooms} Available
                </div>
              </div>
            </div>
            <div className="chart-container">
              <canvas ref={roomsChartRef}></canvas>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activities & Quick Actions */}
      <div className="bottom-section">
        <div className="bottom-grid">
          {/* Recent Activities */}
          <div className="activity-card">
            <div className="card-header">
              <h4>
                <i className="fas fa-history"></i>
                Recent Activities
              </h4>
              <button className="btn btn-sm btn-outline">
                View All
              </button>
            </div>
            <div className="activity-list">
              {recentActivities.map(activity => (
                <div key={activity.id} className="activity-item">
                  <div className={`activity-icon ${activity.color}`}>
                    <i className={activity.icon}></i>
                  </div>
                  <div className="activity-content">
                    <p className="activity-message">{activity.message}</p>
                    <div className="activity-meta">
                      <span className="activity-time">{activity.time}</span>
                      {activity.amount && (
                        <span className="activity-amount">
                          {formatCurrency(activity.amount)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="actions-card">
            <div className="card-header">
              <h4>
                <i className="fas fa-bolt"></i>
                Quick Actions
              </h4>
            </div>
            <div className="actions-grid">
              <button 
                className="action-btn primary"
                onClick={() => navigate('/admission')}
              >
                <i className="fas fa-user-plus"></i>
                <span>New Admission</span>
              </button>
              
              <button 
                className="action-btn success"
                onClick={() => navigate('/payments')}
              >
                <i className="fas fa-credit-card"></i>
                <span>Process Payment</span>
              </button>
              
              <button 
                className="action-btn warning"
                onClick={() => navigate('/applications')}
              >
                <i className="fas fa-file-alt"></i>
                <span>Review Applications</span>
              </button>
              
              <button 
                className="action-btn info"
                onClick={() => navigate('/reports')}
              >
                <i className="fas fa-chart-bar"></i>
                <span>Generate Report</span>
              </button>
              
              <button 
                className="action-btn danger"
                onClick={() => navigate('/expenses')}
              >
                <i className="fas fa-receipt"></i>
                <span>Add Expense</span>
              </button>
              
              <button 
                className="action-btn secondary"
                onClick={() => navigate('/rooms')}
              >
                <i className="fas fa-door-open"></i>
                <span>Manage Rooms</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* System Status */}
      <div className="system-status">
        <div className="section-card">
          <h3 className="section-title">
            <i className="fas fa-server"></i>
            System Status
          </h3>
          <div className="status-grid">
            <div className="status-item online">
              <div className="status-indicator"></div>
              <div className="status-content">
                <h5>Database</h5>
                <p>All systems operational</p>
              </div>
            </div>
            <div className="status-item online">
              <div className="status-indicator"></div>
              <div className="status-content">
                <h5>Payment Gateway</h5>
                <p>Connected and active</p>
              </div>
            </div>
            <div className="status-item online">
              <div className="status-indicator"></div>
              <div className="status-content">
                <h5>Backup System</h5>
                <p>Last backup: 2 hours ago</p>
              </div>
            </div>
            <div className="status-item maintenance">
              <div className="status-indicator"></div>
              <div className="status-content">
                <h5>Email Service</h5>
                <p>Scheduled maintenance</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;