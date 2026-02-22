import React, { useState, useEffect, useRef } from 'react';
import { Chart, registerables } from 'chart.js';
import './Report.css';
import { GetService } from '../../Services/Services';
import { useCustom } from '../../Store/Store';
import useCustomQuery from '../../components/hooks/useCustomQuery';

// Register Chart.js components
Chart.register(...registerables);

const Reports = () => {
  const [filters, setFilters] = useState({
    month: '',
    fromDate: '',
    toDate: ''
  });
  // const [reportData, setReportData] = useState({
  //   totalStudents: 0,
  //   totalPayments: 0,
  //   totalExpenses: 0,
  //   payments: [],
  //   expenses: []
  // });
const {token}=useCustom();
  const chartRef = useRef(null);
  const pieChartRef = useRef(null);
  const incomeExpenseChart = useRef(null);
  const expensePieChart = useRef(null);
  const {data:reportData}=useCustomQuery("/api/admin/report",token,"report_dashboard");
  // const getReports=async()=>{
  //   try {
  //     const result = await GetService(,token);
  //     console.log(result);
  //   } catch (error) {
  //     console.log(error);
  //   }
  // };
  // Sample data
  // useEffect(() => {
  //   // getReports();
  //   const sampleData = {
  //     totalStudents: 156,
  //     totalPayments: 450000,
  //     totalExpenses: 320000,
  //     payments: [
  //       { id: 1, student: 'Ali Ahmed (2024-CS-001)', amount: 15000, date: '2024-01-15', method: 'Cash' },
  //       { id: 2, student: 'Sara Bilal (2024-CE-005)', amount: 12000, date: '2024-01-10', method: 'Online' },
  //       { id: 3, student: 'Ahmed Raza (2024-EE-012)', amount: 18000, date: '2024-01-08', method: 'Cash' },
  //       { id: 4, student: 'Fatima Khan (2024-ME-008)', amount: 16000, date: '2024-01-05', method: 'Online' },
  //       { id: 5, student: 'Usman Ali (2024-CS-015)', amount: 14000, date: '2024-01-03', method: 'Cash' }
  //     ],
  //     expenses: [
  //       { id: 1, description: 'Staff Salaries', amount: 150000, date: '2024-01-15', category: 'Salary' },
  //       { id: 2, description: 'Electricity Bill', amount: 45000, date: '2024-01-10', category: 'Utility' },
  //       { id: 3, description: 'Maintenance', amount: 25000, date: '2024-01-08', category: 'Maintenance' },
  //       { id: 4, description: 'Food Supplies', amount: 80000, date: '2024-01-05', category: 'Food' },
  //       { id: 5, description: 'Internet Bill', amount: 20000, date: '2024-01-03', category: 'Utility' }
  //     ]
  //   };
  //   setReportData(sampleData);
  // }, []);

  // Initialize charts when data is loaded
  useEffect(() => {
    if (reportData?.sixMonthAgoData) {
      initializeCharts();
    }

    return () => {
      // Cleanup charts on unmount
      if (incomeExpenseChart.current) {
        incomeExpenseChart.current.destroy();
      }
      if (expensePieChart.current) {
        expensePieChart.current.destroy();
      }
    };
  }, [reportData]);

  const initializeCharts = () => {
    // Income vs Expenses Chart
    const incomeExpenseCtx = chartRef.current?.getContext('2d');
    if (incomeExpenseCtx && !incomeExpenseChart.current) {
      incomeExpenseChart.current = new Chart(incomeExpenseCtx, {
        type: 'bar',
        data: {
          
          labels: reportData?.sixMonthAgoData?.months,
          datasets: [
            {
              label: 'Income',
              data: reportData?.sixMonthAgoData?.incomes,
              backgroundColor: 'rgba(39, 174, 96, 0.8)',
              borderColor: 'rgba(39, 174, 96, 1)',
              borderWidth: 1
            },
            {
              label: 'Expenses',
              data: reportData?.sixMonthAgoData?.expenses,
              backgroundColor: 'rgba(231, 76, 60, 0.8)',
              borderColor: 'rgba(231, 76, 60, 1)',
              borderWidth: 1
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
              text: 'Monthly Income vs Expenses'
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

    // Expense Pie Chart
    const expensePieCtx = pieChartRef.current?.getContext('2d');
    if (expensePieCtx && !expensePieChart.current) {
      const expenseByCategory = reportData?.sixMonthAgoData?.expenses?.reduce((acc, expense) => {
        // console.log(expense);
        // acc[expense.category||] = (acc[expense.category||] || 0) + expense;
        return acc;
      }, {});

      expensePieChart.current = new Chart(expensePieCtx, {
        type: 'pie',
        data: {
          labels: ["Utility","Electricity","Food","Salary","Plumbing","Fuel","Furniture"],
          datasets: [
            {
              data: reportData?.sixMonthAgoData?.expenses,
              backgroundColor: [
                'rgba(52, 152, 219, 0.8)',
                'rgba(155, 89, 182, 0.8)',
                'rgba(243, 156, 18, 0.8)',
                'rgba(39, 174, 96, 0.8)',
                'rgba(231, 76, 60, 0.8)'
              ],
              borderColor: [
                'rgba(52, 152, 219, 1)',
                'rgba(155, 89, 182, 1)',
                'rgba(243, 156, 18, 1)',
                'rgba(39, 174, 96, 1)',
                'rgba(231, 76, 60, 1)'
              ],
              borderWidth: 1
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
              text: 'Expenses by Category'
            }
          }
        }
      });
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFilterReports = () => {
    // In a real app, this would filter data from API
    console.log('Filtering reports with:', filters);
    alert('Reports filtered based on selected criteria');
  };

  const handleClearFilters = () => {
    setFilters({
      month: '',
      fromDate: '',
      toDate: ''
    });
  };

  const exportToPDF = () => {
    // In a real app, implement PDF export using jsPDF and html2canvas
    alert('PDF export functionality would be implemented here');
    console.log('Exporting to PDF...');
  };

  const exportToExcel = () => {
    // In a real app, implement Excel export using SheetJS
    alert('Excel export functionality would be implemented here');
    console.log('Exporting to Excel...');
  };

  const printReport = () => {
    window.print();
  };

  const balance = reportData?.totalPayments - reportData?.totalExpenses;

  return (
    <div className="reports-page">
      <div className="page-header">
        <h2>
          <i className="fas fa-chart-bar"></i>
          Financial Reports
        </h2>
        <p>Comprehensive financial analysis and insights</p>
      </div>

      {/* Filters Section */}
      <div className="filters-section">
        <div className="section-card">
          <h4 className="section-title">
            <i className="fas fa-filter"></i>
            Report Filters
          </h4>
          <div className="filters-grid">
            <div className="filter-group">
              <label htmlFor="reportMonth" className="form-label">Select Month</label>
              <input
                type="month"
                id="reportMonth"
                name="month"
                className="form-control"
                value={filters.month}
                onChange={handleFilterChange}
              />
            </div>

            <div className="filter-group">
              <label htmlFor="reportFrom" className="form-label">From Date</label>
              <input
                type="date"
                id="reportFrom"
                name="fromDate"
                className="form-control"
                value={filters.fromDate}
                onChange={handleFilterChange}
              />
            </div>

            <div className="filter-group">
              <label htmlFor="reportTo" className="form-label">To Date</label>
              <input
                type="date"
                id="reportTo"
                name="toDate"
                className="form-control"
                value={filters.toDate}
                onChange={handleFilterChange}
              />
            </div>

            <div className="filter-actions">
              <label className="form-label invisible">Actions</label>
              <div className="action-buttons">
                <button className="btn btn-primary" onClick={handleFilterReports}>
                  <i className="fas fa-search"></i>
                  Filter Reports
                </button>
                <button className="btn btn-secondary" onClick={handleClearFilters}>
                  <i className="fas fa-times"></i>
                  Clear
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Export Buttons */}
      <div className="export-section">
        <div className="section-card">
          <h4 className="section-title">
            <i className="fas fa-download"></i>
            Export Reports
          </h4>
          <div className="export-buttons">
            <button className="btn btn-danger" onClick={exportToPDF}>
              <i className="fas fa-file-pdf"></i>
              Export PDF
            </button>
            <button className="btn btn-success" onClick={exportToExcel}>
              <i className="fas fa-file-excel"></i>
              Export Excel
            </button>
            <button className="btn btn-dark" onClick={printReport}>
              <i className="fas fa-print"></i>
              Print Report
            </button>
          </div>
        </div>
      </div>

      {/* Report Content */}
      <div className="report-content">
        {/* Summary Cards */}
        <div className="summary-cards">
          <div className="stats-grid">
            <div className="stat-card primary">
              <div className="stat-icon">
                <i className="fas fa-users"></i>
              </div>
              <div className="stat-content">
                <h3>Total Students</h3>
                <div className="stat-value">{reportData?.totalStudents}</div>
                <p className="stat-description">Currently enrolled</p>
              </div>
            </div>

            <div className="stat-card success">
              <div className="stat-icon">
                <i className="fas fa-money-bill-wave"></i>
              </div>
              <div className="stat-content">
                <h3>Total Payments</h3>
                <div className="stat-value">PKR {reportData?.totalPayments.toLocaleString()}</div>
                <p className="stat-description">Total income</p>
              </div>
            </div>

            <div className="stat-card danger">
              <div className="stat-icon">
                <i className="fas fa-receipt"></i>
              </div>
              <div className="stat-content">
                <h3>Total Expenses</h3>
                <div className="stat-value">PKR {reportData?.totalExpenses.toLocaleString()}</div>
                <p className="stat-description">Total expenditure</p>
              </div>
            </div>
          </div>
        </div>

        {/* Financial Summary */}
        <div className="financial-summary">
          <div className="section-card">
            <h4 className="section-title">
              <i className="fas fa-calculator"></i>
              Financial Summary
            </h4>
            <div className="summary-table-container">
              <table className="summary-table">
                <thead>
                  <tr>
                    <th>Category</th>
                    <th>Total Amount</th>
                    <th>Percentage</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="category-name">
                      <i className="fas fa-arrow-down success-icon"></i>
                      Payments (Income)
                    </td>
                    <td className="amount positive">PKR {reportData?.totalPayments.toLocaleString()}</td>
                    <td className="percentage">100%</td>
                  </tr>
                  <tr>
                    <td className="category-name">
                      <i className="fas fa-arrow-up danger-icon"></i>
                      Expenses
                    </td>
                    <td className="amount negative">PKR {reportData?.totalExpenses.toLocaleString()}</td>
                    <td className="percentage">
                      {((reportData?.totalExpenses / reportData?.totalPayments) * 100).toFixed(1)}%
                    </td>
                  </tr>
                  <tr className="balance-row">
                    <td className="category-name">
                      <i className="fas fa-balance-scale"></i>
                      <strong>Net Balance</strong>
                    </td>
                    <td className={`amount ${balance >= 0 ? 'positive' : 'negative'}`}>
                      <strong>PKR {balance.toLocaleString()}</strong>
                    </td>
                    <td className="percentage">
                      <strong>
                        {((balance / reportData?.totalPayments) * 100).toFixed(1)}%
                      </strong>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="charts-section">
          <div className="section-card">
            <h4 className="section-title">
              <i className="fas fa-chart-line"></i>
              Visual Analytics
            </h4>
            <div className="charts-grid">
              <div className="chart-container">
                <h5>Income vs Expenses Trend</h5>
                <canvas ref={chartRef} id="reportChart"></canvas>
              </div>
              <div className="chart-container">
                <h5>Expenses Breakdown</h5>
                <canvas ref={pieChartRef} id="expensePieChart"></canvas>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Tables */}
        <div className="detailed-tables">
          {/* Payments Table */}
          <div className="table-section">
            <div className="section-card">
              <div className="table-header">
                <h4 className="section-title">
                  <i className="fas fa-credit-card"></i>
                  Payments Details
                </h4>
                <div className="table-summary">
                  Total: PKR {reportData?.totalPayments.toLocaleString()}
                </div>
              </div>
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>Amount</th>
                      <th>Date</th>
                      <th>Payment Method</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData?.payments?.map(payment => (
                      <tr key={payment.id}>
                        <td className="student-cell">{payment.student}</td>
                        <td className="amount-cell positive">PKR {payment.amount.toLocaleString()}</td>
                        <td className="date-cell">{new Date(payment.date).toLocaleDateString()}</td>
                        <td className="method-cell">
                          <span className={`method-badge ${payment.method.toLowerCase()}`}>
                            {payment.method}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Expenses Table */}
          <div className="table-section">
            <div className="section-card">
              <div className="table-header">
                <h4 className="section-title">
                  <i className="fas fa-receipt"></i>
                  Expenses Details
                </h4>
                <div className="table-summary">
                  Total: PKR {reportData?.totalExpenses.toLocaleString()}
                </div>
              </div>
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Description</th>
                      <th>Amount</th>
                      <th>Date</th>
                      <th>Category</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData?.expenses?.map(expense => (
                      <tr key={expense.id}>
                        <td className="description-cell">{expense.description}</td>
                        <td className="amount-cell negative">PKR {expense.toLocaleString()}</td>
                        <td className="date-cell">{new Date(expense.date).toLocaleDateString()}</td>
                        <td className="category-cell">
                          <span className={`category-badge ${expense?.category?.toLowerCase()||"-"}`}>
                            {expense.category||"- "}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;