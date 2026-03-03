import React, { useState, useEffect, useRef,type ChangeEvent } from 'react';
import { Chart, registerables,type ChartConfiguration } from 'chart.js';
import 'Report';
import { useCustom } from '../../Store/Store';
import useCustomQuery from '../../components/hooks/useCustomQuery';

// Register Chart.js components
Chart.register(...registerables);

// --- Interfaces for Type Safety ---
interface TrendChartItem {
  name: string;
  Income: number;
  Expense: number;
}

interface ExpensePieItem {
  category: string;
  amount: number;
}

interface PaymentRecord {
  _id: string;
  student_roll_no: string;
  totalAmount: number;
  paymentDate: string;
  paymentMethod: string;
}

interface ExpenseRecord {
  id: string;
  description: string;
  amount: number;
  date: string;
  expense_type: string;
}

interface ReportData {
  summaryCard: {
    total_enrolled_students: number;
    total_payments_period: number;
    total_expenses_period: number;
  };
  charts: {
    trendChart: TrendChartItem[];
    expensePieChart: ExpensePieItem[];
  };
  recentActivity: {
    payments: PaymentRecord[];
    expenses: ExpenseRecord[];
  };
}

interface Filters {
  month: string;
  fromDate: string;
  toDate: string;
}

const Reports: React.FC = () => {
  const [filters, setFilters] = useState<Filters>({
    month: '',
    fromDate: '',
    toDate: ''
  });

  const { token } = useCustom() as { token: string };
  
  // Refs for HTML Elements
  const chartRef = useRef<HTMLCanvasElement | null>(null);
  const pieChartRef = useRef<HTMLCanvasElement | null>(null);
  
  // Refs for Chart Instances
  const incomeExpenseChart = useRef<Chart | null>(null);
  const expensePieChart = useRef<Chart | null>(null);

  const { data: reportData, isFetched } = useCustomQuery(
    "/api/admin/report",
    token,
    "report_dashboard"
  );

  useEffect(() => {
    if (reportData && isFetched) {
      // Clean up previous instances
      if (incomeExpenseChart.current) incomeExpenseChart.current.destroy();
      if (expensePieChart.current) expensePieChart.current.destroy();

      const incomeExpenseCtx = chartRef.current?.getContext('2d');
      if (incomeExpenseCtx && reportData?.charts?.trendChart) {
        incomeExpenseChart.current = new Chart(incomeExpenseCtx, {
          type: 'bar',
          data: {
            labels: reportData.charts.trendChart.map((item:any) => item?.name),
            datasets: [
              {
                label: 'Income',
                data: reportData.charts.trendChart.map((item:any) => item?.Income),
                backgroundColor: 'rgba(39, 174, 96, 0.8)',
                borderColor: 'rgba(39, 174, 96, 1)',
                borderWidth: 1
              },
              {
                label: 'Expenses',
                data: reportData.charts.trendChart.map((item:any) => item?.Expense),
                backgroundColor: 'rgba(231, 76, 60, 0.8)',
                borderColor: 'rgba(231, 76, 60, 1)',
                borderWidth: 1
              }
            ]
          },
          options: {
            responsive: true,
            plugins: {
              legend: { position: 'top' },
              title: { display: true, text: 'Monthly Income vs Expenses' }
            },
            scales: {
              y: {
                beginAtZero: true,
                ticks: {
                  callback: function (value) {
                    return 'PKR ' + (Number(value) / 1000).toFixed(0) + 'K';
                  }
                }
              }
            }
          }
        });
      }

      // Expense Pie Chart
      const expensePieCtx = pieChartRef.current?.getContext('2d');
      if (expensePieCtx && reportData?.charts.expensePieChart) {
        expensePieChart.current = new Chart(expensePieCtx, {
          type: 'pie',
          data: {
            labels: reportData.charts.expensePieChart.map((item:any) => item.category),
            datasets: [
              {
                data: reportData.charts.expensePieChart.map((item:any) => item.amount),
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
              legend: { position: 'bottom' },
              title: { display: true, text: 'Expenses by Category' }
            }
          }
        });
      }
    }

    return () => {
      if (incomeExpenseChart.current) incomeExpenseChart.current.destroy();
      if (expensePieChart.current) expensePieChart.current.destroy();
    };
  }, [isFetched, reportData]);

  const handleFilterChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFilterReports = (): void => {
    console.log('Filtering reports with:', filters);
    alert('Reports filtered based on selected criteria');
  };

  const handleClearFilters = (): void => {
    setFilters({
      month: '',
      fromDate: '',
      toDate: ''
    });
  };

  const exportToPDF = (): void => {
    alert('PDF export functionality would be implemented here');
  };

  const exportToExcel = (): void => {
    alert('Excel export functionality would be implemented here');
  };

  const printReport = (): void => {
    window.print();
  };

  const totalPayments = reportData?.summaryCard?.total_payments_period || 0;
  const totalExpenses = reportData?.summaryCard?.total_expenses_period || 0;
  const balance = totalPayments - totalExpenses;

  return (
    <div className="reports-page">
      <div className="page-header">
        <h2>
          <i className="fas fa-chart-bar"></i>
          Financial Reports
        </h2>
        <p>Comprehensive financial analysis and insights</p>
      </div>

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

      <div className="report-content">
        <div className="summary-cards">
          <div className="stats-grid">
            <div className="stat-card primary">
              <div className="stat-icon">
                <i className="fas fa-users"></i>
              </div>
              <div className="stat-content">
                <h3>Total Students</h3>
                <div className="stat-value">{reportData?.summaryCard?.total_enrolled_students || 0}</div>
                <p className="stat-description">Currently enrolled</p>
              </div>
            </div>

            <div className="stat-card success">
              <div className="stat-icon">
                <i className="fas fa-money-bill-wave"></i>
              </div>
              <div className="stat-content">
                <h3>Total Payments</h3>
                <div className="stat-value">PKR {totalPayments.toLocaleString()}</div>
                <p className="stat-description">Total income</p>
              </div>
            </div>

            <div className="stat-card danger">
              <div className="stat-icon">
                <i className="fas fa-receipt"></i>
              </div>
              <div className="stat-content">
                <h3>Total Expenses</h3>
                <div className="stat-value">PKR {totalExpenses.toLocaleString()}</div>
                <p className="stat-description">Total expenditure</p>
              </div>
            </div>
          </div>
        </div>

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
                    <td className="amount positive">PKR {totalPayments.toLocaleString()}</td>
                    <td className="percentage">100%</td>
                  </tr>
                  <tr>
                    <td className="category-name">
                      <i className="fas fa-arrow-up danger-icon"></i>
                      Expenses
                    </td>
                    <td className="amount negative">PKR {totalExpenses.toLocaleString()}</td>
                    <td className="percentage">
                      {totalPayments > 0 ? ((totalExpenses / totalPayments) * 100).toFixed(1) : 0}%
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
                        {totalPayments > 0 ? ((balance / totalPayments) * 100).toFixed(1) : 0}%
                      </strong>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

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

        <div className="detailed-tables">
          <div className="table-section">
            <div className="section-card">
              <div className="table-header">
                <h4 className="section-title">
                  <i className="fas fa-credit-card"></i>
                  Payments Details
                </h4>
                <div className="table-summary">
                  Total: PKR {totalPayments.toLocaleString()}
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
                    {reportData?.recentActivity?.payments?.map((payment:any) => (
                      <tr key={payment?._id}>
                        <td className="student-cell">{payment?.student_roll_no}</td>
                        <td className="amount-cell positive">PKR {payment?.totalAmount.toLocaleString()}</td>
                        <td className="date-cell">{new Date(payment?.paymentDate).toLocaleDateString()}</td>
                        <td className="method-cell">
                          <span className={`method-badge ${payment?.paymentMethod.toLowerCase()}`}>
                            {payment?.paymentMethod}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="table-section">
            <div className="section-card">
              <div className="table-header">
                <h4 className="section-title">
                  <i className="fas fa-receipt"></i>
                  Expenses Details
                </h4>
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
                    {reportData?.recentActivity?.expenses?.map((expense:any) => (
                      <tr key={expense.id}>
                        <td className="description-cell">{expense.description}</td>
                        <td className="amount-cell negative">PKR {expense.amount.toLocaleString()}</td>
                        <td className="date-cell">{new Date(expense.date).toLocaleDateString()}</td>
                        <td className="category-cell">
                          <span className={`category-badge ${expense?.expense_type?.toLowerCase() || ""}`}>
                            {expense.expense_type || "- "}
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