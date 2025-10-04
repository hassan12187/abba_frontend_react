import React, { useState, useEffect } from 'react';
import './Payments.css';
import { useQuery } from '@tanstack/react-query';
import { GetService } from '../../Services/Services';
import { usePaymentQuery } from '../../components/hooks/usePaymentQuery';
import { useCustom } from '../../Store/Store';

const Payments = () => {
  const {token}=useCustom();
  const [currentPage, setCurrentPage] = useState(1);
  const [pages,setPages]=useState([1,2,3]);
  const [formData, setFormData] = useState({
    student_registration_no: '',
    amount: '',
    payment_method: 'cash'
  });
 const {data,isLoading}=usePaymentQuery(currentPage-1,token);
    const [editIndex, setEditIndex] = useState(null);
    const [filters, setFilters] = useState({
      regNo: '',
      date: ''
    });

  const itemsPerPage = 10;

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
            
           
    
    // Reset form
    setFormData({
      student_registration_no: '',
      amount: '',
      payment_method: 'cash'
    });
  };
  
  const handleEdit = (index) => {
    setEditIndex(index);
  };
  
  const handleDelete = (index) => {
   
  };
  
  const cancelEdit = () => {
    setEditIndex(null);
    setFormData({
      student_registration_no: '',
      amount: '',
      payment_method: 'cash'
    });
  };
  
  const clearFilters = () => {
    setFilters({
      regNo: '',
      date: ''
    });
  };
  
  const exportToExcel = () => {
    // In a real app, this would generate and download an Excel file
    alert('Export to Excel functionality would be implemented here');
    console.log('Exporting payments:');
  };
  
  const printReceipt = (payment) => {
    setReceiptData(payment);
    
    // Use setTimeout to ensure state update happens before printing
    setTimeout(() => {
      const printWindow = window.open('', '_blank');
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
        <title>Payment Receipt</title>
        <style>
        @media print {
          body { 
            margin: 0; 
            padding: 10px; 
            font-family: Arial, sans-serif; 
            font-size: 14px;
            background: white;
            }
            .receipt-container {
              width: 80mm;
              margin: 0 auto;
              padding: 15px;
              border: 2px solid #000;
              border-radius: 8px;
              background: white;
              }
              .header { 
                text-align: center; 
                margin-bottom: 15px;
                border-bottom: 2px solid #000;
                padding-bottom: 10px;
                }
                .header h2 { 
                  margin: 0; 
                  font-size: 18px;
                  font-weight: bold;
                  }
                  .receipt-details { 
                    margin: 15px 0; 
                    }
                    .receipt-details p { 
                      margin: 8px 0; 
                      display: flex;
                      justify-content: space-between;
                      }
                      .receipt-details strong { 
                        font-weight: bold;
                        }
                        .footer { 
                          text-align: center; 
                          margin-top: 20px;
                          border-top: 2px solid #000;
                          padding-top: 10px;
                          font-style: italic;
                          }
                          @page { 
                            margin: 0; 
                            size: 80mm auto;
                            }
                            }
                            </style>
                            </head>
          <body>
          <div class="receipt-container">
              <div class="header">
              <h2>Hostel Management System</h2>
              <h3>Payment Receipt</h3>
              </div>
              <div class="receipt-details">
              <p><strong>Receipt No:</strong> <span>${payment.id}</span></p>
              <p><strong>Registration No:</strong> <span>${payment.student_registration_no}</span></p>
              <p><strong>Student Name:</strong> <span>${payment.student_name}</span></p>
              <p><strong>Amount Paid:</strong> <span>PKR ${payment.amount.toLocaleString()}</span></p>
              <p><strong>Payment Method:</strong> <span>${payment.payment_method.charAt(0).toUpperCase() + payment.payment_method.slice(1)}</span></p>
              <p><strong>Date:</strong> <span>${new Date(payment.date).toLocaleDateString()}</span></p>
              <p><strong>Time:</strong> <span>${new Date().toLocaleTimeString()}</span></p>
              </div>
              <div class="footer">
              <p>Thank you for your payment!</p>
              <p>This is a computer generated receipt</p>
              </div>
              </div>
              </body>
              </html>
              `);
              printWindow.document.close();
              printWindow.print();
              printWindow.onafterprint = () => printWindow.close();
            }, 100);
          };
          
          // Pagination logic
          // const currentPayments = data?.payments.slice(startIndex, startIndex + itemsPerPage);
          
          const goToPage = (page) => {
            setCurrentPage(page);
          };
          
          const goToPreviousPage = () => {
            setPages([pages[0]-1,pages[1]-1,pages[2]-1]);
            if (currentPage > 1) {
              setCurrentPage(currentPage - 1);
            }
          };

          const goToNextPage = () => {
            setPages(()=>{
              return [pages[0]+1,pages[1]+1,pages[2]+1];
            });
            setCurrentPage(currentPage+1);
            // if (currentPage < totalPages) {
            //   setCurrentPage(currentPage + 1);
            // }
          };
          
          // Calculate total amount
          const totalAmount = data?.payments?.reduce((sum, payment) => sum + payment.amount, 0);
          
          const getPaymentMethodBadge = (method) => {
            const methodConfig = {
              cash: { label: 'Cash', class: 'badge-cash' },
              online: { label: 'Online', class: 'badge-online' }
            };
            
    const config = methodConfig[method] || { label: method, class: 'badge-default' };
    return <span className={`payment-badge ${config.class}`}>{config.label}</span>;
  };
  
  return (
    <div className="payments-page">
      <div className="page-header">
        <h2>
          <i className="fas fa-credit-card"></i>
          Payments Management
        </h2>
        <p>Process and track student payments</p>
      </div>

      {/* Payment Form */}
      <div className="payment-form-section">
        <div className="section-card">
          <h4 className="section-title">
            <i className="fas fa-plus-circle"></i>
            {editIndex !== null ? 'Edit Payment' : 'Process New Payment'}
          </h4>
          <form onSubmit={handleSubmit} className="payment-form">
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="student_registration_no" className="form-label">
                  Student Registration No <span className="required">*</span>
                </label>
                <input
                  type="text"
                  id="student_registration_no"
                  name="student_registration_no"
                  className="form-control"
                  value={formData.student_registration_no}
                  onChange={handleInputChange}
                  placeholder="Enter registration number"
                  required
                />
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

              <div className="form-group">
                <label htmlFor="payment_method" className="form-label">
                  Payment Method <span className="required">*</span>
                </label>
                <select
                  id="payment_method"
                  name="payment_method"
                  className="form-control"
                  value={formData.payment_method}
                  onChange={handleInputChange}
                  required
                >
                  <option value="cash">Cash</option>
                  <option value="online">Online</option>
                </select>
              </div>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn btn-primary">
                <i className="fas fa-save"></i>
                {editIndex !== null ? 'Update Payment' : 'Save Payment'}
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
            Filter Payments
          </h4>
          <div className="filters-row">
            <div className="filter-group">
              <label htmlFor="searchRegNo" className="form-label">Search by Reg No</label>
              <input
                type="text"
                id="searchRegNo"
                name="regNo"
                className="form-control"
                value={filters.regNo}
                onChange={handleFilterChange}
                placeholder="Enter registration number"
              />
            </div>

            <div className="filter-group">
              <label htmlFor="searchDate" className="form-label">Date</label>
              <input
                type="date"
                id="searchDate"
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

      {/* Payments Table */}
      <div className="payments-table-section">
        <div className="section-card">
          <div className="card-header-enhanced">
            <h3 className="card-title">
              <i className="fas fa-history"></i>
              Payment History
            </h3>
            <div className="total-payments">
              Total Amount: <span className="total-amount">PKR {totalAmount}</span>
            </div>
          </div>

          <div className="table-container">
            <div className="table-responsive">
              <table className="payments-table">
                <thead>
                  <tr>
                    <th>Student Reg No</th>
                    <th className="amount-column">Amount</th>
                    <th className="method-column">Payment Method</th>
                    <th className="date-column">Date</th>
                    <th className="actions-column">Actions</th>
                  </tr>
                </thead>
                <tbody>
                   {data?.payments?.length > 0 ? (
                    data?.payments?.map((payment, index) => (
                      <tr key={index} className="payment-row">
                        <td className="reg-no-cell">
                          <div className="student-info">
                            <div className="reg-no">{payment.student_registration_no}</div>
                            <div className="student-name">{payment.student_name}</div>
                          </div>
                        </td>
                        <td className="amount-cell">
                          <div className="amount-display">
                            <span className="currency">PKR</span>
                            {payment.amount.toLocaleString()}
                          </div>
                        </td>
                        <td className="method-cell">
                          {getPaymentMethodBadge(payment.payment_method)}
                        </td>
                        <td className="date-cell">
                          {new Date(payment.date).toLocaleDateString()}
                        </td>
                        <td className="actions-cell">
                          <div className="action-buttons">
                            <button
                              className="btn btn-sm btn-print"
                              onClick={() => printReceipt(payment)}
                              title="Print Receipt"
                            >
                              <i className="fas fa-print"></i>
                            </button>
                            <button
                              className="btn btn-sm btn-edit"
                              onClick={() => handleEdit(payments.findIndex(p => p.id === payment.id))}
                              title="Edit"
                            >
                              <i className="fas fa-edit"></i>
                            </button>
                            <button
                              className="btn btn-sm btn-delete"
                              onClick={() => handleDelete(payments.findIndex(p => p.id === payment.id))}
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
                        <i className="fas fa-receipt"></i>
                        No payments found
                      </td>
                    </tr>
                  )} 
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {
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
                    {
                    pages.map(page => (
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
                    disabled={data?.payments?.length < itemsPerPage ? true : false}
                  >
                    Next
                    <i className="fas fa-chevron-right"></i>
                  </button>
                </nav>
              </div>
            }
          </div>
        </div>
      </div>
    </div>
  );
};

export default Payments;