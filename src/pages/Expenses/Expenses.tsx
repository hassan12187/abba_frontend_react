import React, { useMemo, useState } from 'react';
import './Expenses.css';
import useExpenseQuery from '../../components/hooks/useExpenseQuery';
import { useCustom } from '../../Store/Store';
import Pagination from '../../components/Layout/Pagination';
import { PostService } from '../../Services/Services';
import { useDebounce } from '../../components/hooks/useDebounce';
import Modal from '../../components/reusable/Modal';
import FilterSection from '../../components/reusable/FilterSection';
import SelectField from '../../components/reusable/SelectField';
import InputField from '../../components/reusable/InputField';
import useSpecificQuery from '../../components/hooks/useSpecificQuery';

// Interfaces for better type safety
interface UseCustomInterface {
  token: string;
}

interface Expense {
  _id: string;
  expense_type: string;
  description: string;
  amount: number;
  date: string;
}

const expenseFields = [
  {
    type: "select",
    id: "expense_type",
    name: "expense_type",
    label: "Expense Type",
    options: (
      <>
        <option hidden>Select Any Status</option>
        <option value="salary">Salary</option>
        <option value="normal expense">Normal Expense</option>
        <option value="asset">Asset</option>
      </>
    )
  },
  {
    type: "text",
    id: "description",
    name: "description",
    placeholder: "Expense Description",
    label: "Expense Description"
  },
  {
    type: "text",
    id: "amount",
    name: "amount",
    placeholder: "Expense Amount",
    label: "Expense Amount"
  },
  {
    type: "date",
    id: "date",
    name: "date",
    label: "Date"
  },
];

const Expenses = () => {
  // Fix: Destructure with a fallback to avoid "null" assignment error
  const { token } = (useCustom() as UseCustomInterface) || { token: "" };

  const [showModal, setShowModal] = useState<{show:boolean,mode:string}>({ show: false, mode: "view" });
  const [expenseId, setExpenseId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    expense_type: '',
    description: '',
    amount: ''
  });

  const [instantVals, setInstandVals] = useState({
    type: "",
    date: ""
  });

  const [filters, setFilters] = useState({
    type: '',
    date: ''
  });

  const [currentPage, setCurrentPage] = useState(1);

  // Queries
  const { data, isLoading } = useExpenseQuery(currentPage - 1, token, filters.type, filters.date);
  
  // Fix: Only pass URL if expenseId is not null
  const { data: specificData } = useSpecificQuery(
    expenseId ? `/api/admin/expense/${expenseId}` : '',
    expenseId || '',
    token,
    'expense_id'
  );

  const memoizedData = useMemo(() => specificData || {}, [specificData]);

  // Handlers with proper Event types
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const updateFilters = useDebounce(
    (name: string, value: string) => {
      setFilters(prev => ({ ...prev, [name]: value }));
    }, 500
  );

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setInstandVals(prev => ({ ...prev, [name]: value }));
    updateFilters(name, value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    PostService("/api/admin/expense", formData, token);
    setFormData({ expense_type: '', description: '', amount: '' });
  };

  const handleEdit = (eid: string) => {
    setExpenseId(eid);
    setShowModal({ show: true, mode: "edit" });
  };

  const handleDelete = (index: number) => {
    console.log("Delete index:", index);
    // Implementation for delete
  };

  const clearFilters = () => {
    setInstandVals({ type: '', date: '' });
    setFilters({ type: '', date: '' });
  };

  const getExpenseTypeBadge = (type: string) => {
    const typeConfig: Record<string, { label: string, class: string }> = {
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

      <div className="expense-form-section">
        <div className="section-card">
          <h4 className="section-title">
            <i className="fas fa-plus-circle"></i>
            Add New Expense
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
                <i className="fas fa-save"></i> Save Expense
              </button>
            </div>
          </form>
        </div>
      </div>

      <FilterSection heading={'Filter Expenses'}>
        <SelectField name={'type'} id={'type'} value={instantVals.type} onChange={handleFilterChange}>
          <option value="">All Types</option>
          <option value="salary">Salary</option>
          <option value="asset">Asset</option>
          <option value="food">Food</option>
          <option value="maintenance">Maintenance</option>
        </SelectField>
        <InputField type={'date'} id={'date'} name={'date'} value={instantVals.date} onChange={handleFilterChange} />
        <button className="btn btn-outline-secondary" onClick={clearFilters}>Clear</button>
      </FilterSection>

      <div className="expenses-table-section">
        <div className="section-card">
          <div className="card-header-enhanced">
            <h3 className="card-title">
              <i className="fas fa-receipt"></i> Expenses List
            </h3>
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
                  {isLoading ? (
                    <tr><td colSpan={5}>Loading...</td></tr>
                  ) : data?.data?.length > 0 ? (
                    data.data.map((expense: Expense, index: number) => (
                      <tr key={expense._id || index} className="expense-row">
                        <td>{getExpenseTypeBadge(expense.expense_type)}</td>
                        <td className="description-cell">{expense.description}</td>
                        <td className="amount-cell">PKR {expense.amount?.toLocaleString()}</td>
                        <td className="date-cell">{new Date(expense.date).toLocaleDateString()}</td>
                        <td className="actions-cell">
                          <div className="action-buttons">
                            <button className="action btn btn-sm btn-edit" onClick={() => handleEdit(expense._id)}>
                              <i className="fas fa-edit"></i>
                            </button>
                            <button className="action btn btn-sm btn-delete" onClick={() => handleDelete(index)}>
                              <i className="fas fa-trash"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="no-data">No expenses found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <Pagination currentPage={currentPage} setCurrentPage={setCurrentPage} length={data?.totalCount || 0} />
          </div>
        </div>
      </div>

      {showModal.show && (
        <Modal 
          setShowModal={setShowModal} 
          mode={"edit"} 
          modalTitle={"Expenses Info"} 
          fields={expenseFields} 
          data={memoizedData} 
          actionButtons={
            <button className="btn btn-success">
              <i className="fas fa-edit"></i> Edit
            </button>
          } 
        />
      )}
    </div>
  );
};

export default Expenses;