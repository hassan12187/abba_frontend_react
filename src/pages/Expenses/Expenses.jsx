import { useState } from 'react';
import './Expenses.css';
import useExpenseQuery from '../../components/hooks/useExpenseQuery';
import { useCustom } from '../../Store/Store';
import Pagination from '../../components/Layout/Pagination';
import { PostService } from '../../Services/Services';
import { useDebounce } from '../../components/hooks/useDebounce';
import Modal from '../../components/reusable/Modal';

const Expenses = () => {
  const {token}=useCustom();
  const [showModal,setShowModal]=useState({show:false,mode:"view"});
  const [formData, setFormData] = useState({
    expense_type: '',
    description: '',
    amount: ''
  });
  const [instantVals,setInstandVals]=useState({
    type:"",
    date:""
  });
  const [filters, setFilters] = useState({
    type: '',
    date: ''
  });
  const [currentPage, setCurrentPage] = useState(1);
  const {data,isLoading}=useExpenseQuery(currentPage-1,token,filters.type,filters.date);
  console.log(data);


  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  const updateFilters=useDebounce(
    (name,value)=>{
   setFilters(prev => {
      return {...prev,[name]:value};
    });
    },500
  );
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setInstandVals((prev)=>{
      return {...prev,[name]:value};
    })
    updateFilters(name,value);
  };
  console.log(filters);
  const handleSubmit = async(e) => {
    e.preventDefault();

    // if (editIndex !== null) {
    //   // Update existing expense
    //   const updatedExpenses = expenses.map((expense, index) =>
    //     index === editIndex 
    //       ? { ...expense, ...formData, amount: parseFloat(formData.amount) }
    //       : expense
    //   );
    //   setExpenses(updatedExpenses);
    //   setEditIndex(null);
    // } else {
    //   // Add new expense
    //   const newExpense = {
    //     id: expenses.length + 1,
    //     ...formData,
    //     amount: parseFloat(formData.amount),
    //     date: new Date().toISOString().split('T')[0]
    //   };
    //   setExpenses(prev => [...prev, newExpense]);
    // }
    PostService("/api/admin/expense",formData,token);
    // Reset form
    setFormData({
      expense_type: '',
      description: '',
      amount: ''
    });
  };

  const handleEdit = (index) => {
    setShow
    setEditIndex(index);
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

  // Calculate total expenses
  // const totalExpenses = data?.reduce((sum, expense) => sum + expense.amount, 0);

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
            {/* {editIndex !== null ? 'Edit Expense' : 'Add New Expense'} */}
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
                {/* {editIndex !== null ? 'Update Expense' : 'Save Expense'} */}
              </button>
              {/* {editIndex !== null && (
                <button type="button" className="btn btn-secondary" onClick={cancelEdit}>
                  <i className="fas fa-times"></i>
                  Cancel Edit
                </button>
              )} */}
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
              <label htmlFor="type" className="form-label">Expense Type</label>
              <select
                id="type"
                name="type"
                className="form-control"
                value={instantVals.type}
                onChange={handleFilterChange}
              >
                <option value="">All Types</option>
                <option value="salary">Salary</option>
                <option value="normal expense">Normal Expense</option>
                <option value="asset">Asset</option>
              </select>
            </div>

            <div className="filter-group">
              <label htmlFor="date" className="form-label">Date</label>
              <input
                type="date"
                id="date"
                name="date"
                className="form-control"
                value={instantVals.date}
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
              {/* Total Expenses: <span className="total-amount">PKR {totalExpenses.toLocaleString()}</span> */}
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
                  {data?.data?.length > 0 ? (
                    data?.data?.map((expense, index) => (
                      <tr key={index} className="expense-row">
                        <td>
                          {getExpenseTypeBadge(expense?.expense_type)}
                        </td>
                        <td className="description-cell">
                          {expense?.description}
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
                              onClick={() => handleEdit(data?.findIndex(e => e.id === expense?._id))}
                              title="Edit"
                            >
                              <i className="fas fa-edit"></i>
                            </button>
                            <button
                              className="btn btn-sm btn-delete"
                              onClick={() => handleDelete(data?.findIndex(e => e.id === expense?._id))}
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
                <Pagination currentPage={currentPage} setCurrentPage={setCurrentPage} length={data?.length} />
     
          </div>
        </div>
      </div>
      {
        showModal.show && <Modal  />
      }
    </div>
  );
};

export default Expenses;