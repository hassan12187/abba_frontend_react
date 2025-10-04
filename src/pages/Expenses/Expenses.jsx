import React, { useState, useEffect } from 'react';
import './Expenses.css';

const Expenses = () => {
  const [expenses, setExpenses] = useState([]);
  const [filteredExpenses, setFilteredExpenses] = useState([]);
  const [formData, setFormData] = useState({
    expense_type: '',
    description: '',
    amount: ''
  });
  const [editIndex, setEditIndex] = useState(null);
  const [filters, setFilters] = useState({
    type: '',
    date: ''
  });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Sample initial data
  useEffect(() => {
    const sampleExpenses = [
      {
        id: 1,
        expense_type: 'salary',
        description: 'Staff salaries for January',
        amount: 50000,
        date: '2024-01-15'
      },
      {
        id: 2,
        expense_type: 'normal expense',
        description: 'Electricity bill',
        amount: 15000,
        date: '2024-01-10'
      },
      {
        id: 3,
        expense_type: 'asset',
        description: 'New furniture purchase',
        amount: 75000,
        date: '2024-01-05'
      }
    ];
    setExpenses(sampleExpenses);
    setFilteredExpenses(sampleExpenses);
  }, []);

  // Filter expenses when filters change
  useEffect(() => {
    let filtered = expenses;

    if (filters.type) {
      filtered = filtered.filter(expense => expense.expense_type === filters.type);
    }

    if (filters.date) {
      filtered = filtered.filter(expense => expense.date === filters.date);
    }

    setFilteredExpenses(filtered);
    setCurrentPage(1);
  }, [filters, expenses]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (editIndex !== null) {
      // Update existing expense
      const updatedExpenses = expenses.map((expense, index) =>
        index === editIndex 
          ? { ...expense, ...formData, amount: parseFloat(formData.amount) }
          : expense
      );
      setExpenses(updatedExpenses);
      setEditIndex(null);
    } else {
      // Add new expense
      const newExpense = {
        id: expenses.length + 1,
        ...formData,
        amount: parseFloat(formData.amount),
        date: new Date().toISOString().split('T')[0]
      };
      setExpenses(prev => [...prev, newExpense]);
    }

    // Reset form
    setFormData({
      expense_type: '',
      description: '',
      amount: ''
    });
  };

  const handleEdit = (index) => {
    const expenseToEdit = expenses[index];
    setFormData({
      expense_type: expenseToEdit.expense_type,
      description: expenseToEdit.description,
      amount: expenseToEdit.amount.toString()
    });
    setEditIndex(index);
  };

  const handleDelete = (index) => {
    if (window.confirm('Are you sure you want to delete this expense?')) {
      const updatedExpenses = expenses.filter((_, i) => i !== index);
      setExpenses(updatedExpenses);
    }
  };

  const cancelEdit = () => {
    setEditIndex(null);
    setFormData({
      expense_type: '',
      description: '',
      amount: ''
    });
  };

  const clearFilters = () => {
    setFilters({
      type: '',
      date: ''
    });
  };

  const exportToExcel = () => {
    // In a real app, this would generate and download an Excel file
    alert('Export to Excel functionality would be implemented here');
    console.log('Exporting expenses:', filteredExpenses);
  };

  // Pagination logic
  const totalPages = Math.ceil(filteredExpenses.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentExpenses = filteredExpenses.slice(startIndex, startIndex + itemsPerPage);

  const goToPage = (page) => {
    setCurrentPage(page);
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  // Calculate total expenses
  const totalExpenses = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);

  const getExpenseTypeBadge = (type) => {
    const typeConfig = {
      salary: { label: 'Salary', class: 'badge-salary' },
      'normal expense': { label: 'Normal Expense', class: 'badge-normal' },
      asset: { label: 'Asset', class: 'badge-asset' }
    };

    const config = typeConfig[type] || { label: type, class: 'badge-default' };
    return <span className={`expense-badge ${config.class}`}>{config.label}</span>;
  };

  return (
    <div className="expenses-page">
      <div className="page-header">
        <h2>
          <i className="fas fa-money-bill-wave"></i>
          Expenses Management
        </h2>
        <p>Track and manage all hostel expenses</p>
      </div>

      {/* Expense Form */}
      <div className="expense-form-section">
        <div className="section-card">
          <h4 className="section-title">
            <i className="fas fa-plus-circle"></i>
            {editIndex !== null ? 'Edit Expense' : 'Add New Expense'}
          </h4>
          <form onSubmit={handleSubmit} className="expense-form">
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="expense_type" className="form-label">
                  Expense Type <span className="required">*</span>
                </label>
                <select
                  id="expense_type"
                  name="expense_type"
                  className="form-control"
                  value={formData.expense_type}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select Expense Type</option>
                  <option value="salary">Salary</option>
                  <option value="normal expense">Normal Expense</option>
                  <option value="asset">Asset</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="amount" className="form-label">
                  Amount (PKR) <span className="required">*</span>
                </label>
                <input
                  type="number"
                  id="amount"
                  name="amount"
                  className="form-control"
                  value={formData.amount}
                  onChange={handleInputChange}
                  placeholder="Enter amount"
                  required
                />
              </div>
            </div>

            <div className="form-group full-width">
              <label htmlFor="description" className="form-label">
                Description <span className="required">*</span>
              </label>
              <input
                type="text"
                id="description"
                name="description"
                className="form-control"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Enter expense description"
                required
              />
            </div>

            <div className="form-actions">
              <button type="submit" className="btn btn-primary">
                <i className="fas fa-save"></i>
                {editIndex !== null ? 'Update Expense' : 'Save Expense'}
              </button>
              {editIndex !== null && (
                <button type="button" className="btn btn-secondary" onClick={cancelEdit}>
                  <i className="fas fa-times"></i>
                  Cancel Edit
                </button>
              )}
            </div>
          </form>
        </div>
      </div>

      {/* Filters Section */}
      <div className="filters-section">
        <div className="section-card">
          <h4 className="section-title">
            <i className="fas fa-filter"></i>
            Filter Expenses
          </h4>
          <div className="filters-row">
            <div className="filter-group">
              <label htmlFor="searchType" className="form-label">Expense Type</label>
              <select
                id="searchType"
                name="type"
                className="form-control"
                value={filters.type}
                onChange={handleFilterChange}
              >
                <option value="">All Types</option>
                <option value="salary">Salary</option>
                <option value="normal expense">Normal Expense</option>
                <option value="asset">Asset</option>
              </select>
            </div>

            <div className="filter-group">
              <label htmlFor="searchExpenseDate" className="form-label">Date</label>
              <input
                type="date"
                id="searchExpenseDate"
                name="date"
                className="form-control"
                value={filters.date}
                onChange={handleFilterChange}
              />
            </div>

            <div className="filter-group">
              <label className="form-label invisible">Actions</label>
              <button className="btn btn-outline-secondary w-100" onClick={clearFilters}>
                <i className="fas fa-times"></i>
                Clear Filters
              </button>
            </div>

            <div className="filter-group">
              <label className="form-label invisible">Export</label>
              <button className="btn btn-success w-100" onClick={exportToExcel}>
                <i className="fas fa-file-excel"></i>
                Export to Excel
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="expenses-table-section">
        <div className="section-card">
          <div className="card-header-enhanced">
            <h3 className="card-title">
              <i className="fas fa-receipt"></i>
              Expenses List
            </h3>
            <div className="total-expenses">
              Total Expenses: <span className="total-amount">PKR {totalExpenses.toLocaleString()}</span>
            </div>
          </div>

          <div className="table-container">
            <div className="table-responsive">
              <table className="expenses-table">
                <thead>
                  <tr>
                    <th>Expense Type</th>
                    <th>Description</th>
                    <th className="amount-column">Amount</th>
                    <th className="date-column">Date</th>
                    <th className="actions-column">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentExpenses.length > 0 ? (
                    currentExpenses.map((expense, index) => (
                      <tr key={expense.id} className="expense-row">
                        <td>
                          {getExpenseTypeBadge(expense.expense_type)}
                        </td>
                        <td className="description-cell">
                          {expense.description}
                        </td>
                        <td className="amount-cell">
                          PKR {expense.amount.toLocaleString()}
                        </td>
                        <td className="date-cell">
                          {new Date(expense.date).toLocaleDateString()}
                        </td>
                        <td className="actions-cell">
                          <div className="action-buttons">
                            <button
                              className="btn btn-sm btn-edit"
                              onClick={() => handleEdit(expenses.findIndex(e => e.id === expense.id))}
                              title="Edit"
                            >
                              <i className="fas fa-edit"></i>
                            </button>
                            <button
                              className="btn btn-sm btn-delete"
                              onClick={() => handleDelete(expenses.findIndex(e => e.id === expense.id))}
                              title="Delete"
                            >
                              <i className="fas fa-trash"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="no-data">
                        <i className="fas fa-inbox"></i>
                        No expenses found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="pagination-container">
                <nav className="pagination-nav">
                  <button
                    className="pagination-btn"
                    onClick={goToPreviousPage}
                    disabled={currentPage === 1}
                  >
                    <i className="fas fa-chevron-left"></i>
                    Previous
                  </button>

                  <div className="page-numbers">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                      <button
                        key={page}
                        className={`page-number ${currentPage === page ? 'active' : ''}`}
                        onClick={() => goToPage(page)}
                      >
                        {page}
                      </button>
                    ))}
                  </div>

                  <button
                    className="pagination-btn"
                    onClick={goToNextPage}
                    disabled={currentPage === totalPages}
                  >
                    Next
                    <i className="fas fa-chevron-right"></i>
                  </button>
                </nav>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Expenses;