import React, { useState } from 'react';
import { Search, Eye, Plus, Calendar, DollarSign, CreditCard, X, CheckCircle, AlertCircle, Clock } from 'lucide-react';
// import InputField from '../../components/reusable/InputField';
// import SelectField from '../../components/reusable/SelectField';
import useCustomQuery from '../../components/hooks/useCustomQuery';
import { useCustom } from '../../Store/Store';
// import CreateFeeInvoice from './createFeeInvoice';
import { Navigate, useNavigate } from 'react-router-dom';
import Pagination from '../../components/Layout/Pagination';

const FeeInvoiceUI = () => {
  const [userRole, setUserRole] = useState('admin'); // 'admin' or 'student'
  const [view, setView] = useState('list'); // 'list' or 'detail'
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const {token}=useCustom();
   const [currentPage, setCurrentPage] = useState(1);
  const navigate=useNavigate();
  const {data:feeInvoice,isLoading}=useCustomQuery('/api/admin/fee-invoice',token,'fee-invoice');
console.log(feeInvoice);
  // Sample data
  const [invoices, setInvoices] = useState([
    {
      id: 1,
      invoiceNumber: 'INV-2025-001',
      studentName: 'Aisha Khan',
      room: 'A-101',
      roomType: 'Standard',
      billingMonth: 'January 2025',
      totalAmount: 8500,
      paidAmount: 8500,
      balanceDue: 0,
      status: 'Paid',
      dueDate: '2025-01-10',
      lineItems: [
        { description: 'Room Rent', amount: 5000 },
        { description: 'Maintenance', amount: 500 },
        { description: 'Mess Charges', amount: 3000 }
      ],
      payments: [
        { date: '2025-01-05', amount: 8500, method: 'Bank Transfer' }
      ]
    },
    {
      id: 2,
      invoiceNumber: 'INV-2025-002',
      studentName: 'Bilal Ahmed',
      room: 'B-205',
      roomType: 'Deluxe',
      billingMonth: 'January 2025',
      totalAmount: 11800,
      paidAmount: 5000,
      balanceDue: 6800,
      status: 'Partially Paid',
      dueDate: '2025-01-10',
      lineItems: [
        { description: 'Room Rent', amount: 8000 },
        { description: 'Maintenance', amount: 800 },
        { description: 'Mess Charges', amount: 3000 }
      ],
      payments: [
        { date: '2025-01-03', amount: 5000, method: 'Cash' }
      ]
    },
    {
      id: 3,
      invoiceNumber: 'INV-2025-003',
      studentName: 'Sara Malik',
      room: 'A-203',
      roomType: 'Standard',
      billingMonth: 'January 2025',
      totalAmount: 8500,
      paidAmount: 0,
      balanceDue: 8500,
      status: 'Overdue',
      dueDate: '2025-01-05',
      lineItems: [
        { description: 'Room Rent', amount: 5000 },
        { description: 'Maintenance', amount: 500 },
        { description: 'Mess Charges', amount: 3000 }
      ],
      payments: []
    },
    {
      id: 4,
      invoiceNumber: 'INV-2025-004',
      studentName: 'Hassan Ali',
      room: 'C-101',
      roomType: 'Standard',
      billingMonth: 'January 2025',
      totalAmount: 8500,
      paidAmount: 0,
      balanceDue: 8500,
      status: 'Pending',
      dueDate: '2025-01-15',
      lineItems: [
        { description: 'Room Rent', amount: 5000 },
        { description: 'Maintenance', amount: 500 },
        { description: 'Mess Charges', amount: 3000 }
      ],
      payments: []
    }
  ]);

  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    method: 'Cash',
    date: new Date().toISOString().split('T')[0]
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'Paid':
        return 'bg-green-100 text-green-800';
      case 'Partially Paid':
        return 'bg-yellow-100 text-yellow-800';
      case 'Pending':
        return 'bg-blue-100 text-blue-800';
      case 'Overdue':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Paid':
        return <CheckCircle size={16} />;
      case 'Partially Paid':
        return <Clock size={16} />;
      case 'Pending':
        return <Clock size={16} />;
      case 'Overdue':
        return <AlertCircle size={16} />;
      default:
        return null;
    }
  };

  const handleAddPayment = () => {
    if (!paymentForm.amount || parseFloat(paymentForm.amount) <= 0) return;

    const payment = {
      date: paymentForm.date,
      amount: parseFloat(paymentForm.amount),
      method: paymentForm.method
    };

    const updatedInvoices = invoices.map(inv => {
      if (inv.id === selectedInvoice.id) {
        const newPaidAmount = inv.paidAmount + payment.amount;
        const newBalanceDue = inv.totalAmount - newPaidAmount;
        let newStatus = 'Pending';
        
        if (newBalanceDue === 0) {
          newStatus = 'Paid';
        } else if (newPaidAmount > 0) {
          newStatus = 'Partially Paid';
        }

        return {
          ...inv,
          paidAmount: newPaidAmount,
          balanceDue: newBalanceDue,
          status: newStatus,
          payments: [...inv.payments, payment]
        };
      }
      return inv;
    });

    setInvoices(updatedInvoices);
    setSelectedInvoice(updatedInvoices.find(inv => inv.id === selectedInvoice.id));
    setShowPaymentModal(false);
    setPaymentForm({ amount: '', method: 'Cash', date: new Date().toISOString().split('T')[0] });
  };

  const handleMarkAsPaid = () => {
    const remaining = selectedInvoice.balanceDue;
    if (remaining > 0) {
      setPaymentForm({ ...paymentForm, amount: remaining.toString() });
      setShowPaymentModal(true);
    }
  };

  // Admin Invoice List View
  const AdminListView = () => (
    <div>
      <div>
        <div>
          <div className='room-form-section'>
            <div className='section-card'>
              <h4 className='section-title'>Create New Invoice</h4>
              <button className='action btn btn-view active' onClick={()=>{
                navigate("/create/fee-invoice");
              }}>
                <Calendar size={20} />
                Create New Invoices
              </button>
            </div>
          </div>

          <div className="p-6">
            <div>
               <table className="expenses-table">
                <thead>
                  <tr>
                    <th>Invoice No.</th>
                    <th>Student</th>
                    <th>Room</th>
                    <th>Billing Month</th>
                    <th>Total</th>
                    <th>Paid</th>
                    <th>Balance</th>
                    <th>Status</th>
                    <th>Due Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                      <tbody>
                  {feeInvoice?.map((invoice,index) => (
                    <tr key={index}>
                      <td className="roll-no-cell">{invoice?.invoiceNumber}</td>
                      <td className='roll-no-cell'>{invoice?.student_name}</td>
                      <td>{invoice?.room_no||"-"}</td>
                      <td>{invoice?.billingMonth}</td>
                      <td className='roll-no-cell'>
                        ₹{invoice?.totalAmount?.toLocaleString()}
                      </td>
                      <td className='roll-no-cell'>
                        ₹{invoice?.totalPaid?.toLocaleString()}
                      </td>
                      <td className='roll-no-cell'>
                        <span className={invoice?.balanceDue > 0 ? 'text-red-600 font-medium' : 'text-gray-600'}>
                          ₹{invoice?.balanceDue?.toLocaleString() || 0}
                        </span>
                      </td>
                      <td>
                        <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded ${getStatusColor(invoice?.status)}`}>
                          {getStatusIcon(invoice?.status)}
                          {invoice?.status}
                        </span>
                      </td>
                      <td className="roll-no-cell">{new Date(invoice?.dueDate).toLocaleDateString()}</td>
                      <td className="actions-cell">
                        <div className="action-buttons">
                             <button
                              className="action btn btn-sm btn-view"
                              onClick={() => {setSelectedInvoice(invoice);
                              setView('detail');
                              }}
                              title="View Details"
                            >
                              <i className="fas fa-eye"></i>
                            </button>
                          {/* <button
                            onClick={() => {
                              setSelectedInvoice(invoice);
                              setView('detail');
                            }}
                            className="p-1 text-blue-600 hover:text-blue-700"
                            title="View"
                          >
                            <Eye size={18} />
                          </button> */}
                          {invoice.status !== 'Paid' && (
                            <button
                              onClick={() => {
                                setSelectedInvoice(invoice);
                                setShowPaymentModal(true);
                              }}
                              className="action btn btn-sm btn-assign"
                              title="Add Payment"
                            >
                              <Plus size={18} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {feeInvoice?.length === 0 && (
                <div className="text-center py-12">
                  <DollarSign size={48} className="mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-500 text-lg">No invoices found</p>
                  <p className="text-gray-400 text-sm mt-2">Try adjusting your filters</p>
                </div>
              )}
              <Pagination currentPage={currentPage} setCurrentPage={setCurrentPage} length={[]} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Student Dashboard View
  const StudentDashboardView = () => (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-semibold text-gray-800 mb-6">My Fee Invoices</h1>
        
        {invoices.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <DollarSign size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 text-lg">No invoices available</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {invoices.map((invoice) => (
              <div key={invoice.id} className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Invoice Number</p>
                      <p className="text-lg font-semibold text-gray-900">{invoice.invoiceNumber}</p>
                    </div>
                    <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded ${getStatusColor(invoice.status)}`}>
                      {getStatusIcon(invoice.status)}
                      {invoice.status}
                    </span>
                  </div>

                  <div className="space-y-3 mb-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Billing Month</span>
                      <span className="text-sm font-medium text-gray-900">{invoice.billingMonth}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Total Amount</span>
                      <span className="text-sm font-semibold text-gray-900">₹{invoice.totalAmount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Paid Amount</span>
                      <span className="text-sm text-green-600">₹{invoice.paidAmount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                      <span className="text-sm font-medium text-gray-700">Balance Due</span>
                      <span className={`text-sm font-bold ${invoice.balanceDue > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        ₹{invoice.balanceDue.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedInvoice(invoice);
                      setView('detail');
                    }}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center justify-center gap-2"
                  >
                    <Eye size={16} />
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  // Invoice Detail View
  const InvoiceDetailView = () => (
   <div className="container-fluid bg-light min-vh-100 py-4 py-md-5">
  <div className="container" style={{ maxWidth: '850px' }}>
    {/* Back Button */}
    <button
      type="button"
      onClick={() => setView(userRole === 'admin' ? 'list' : 'dashboard')}
      className="btn btn-outline-secondary mb-4 d-flex align-items-center gap-2"
    >
      ← Back to {userRole === 'admin' ? 'Invoices' : 'Dashboard'}
    </button>

    <div className="card shadow-sm border-0">
      {/* Header Section */}
      <div className="card-header bg-light border-bottom py-4 px-4">
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-start gap-3">
          <div>
            <h2 className="h4 fw-bold text-dark mb-2">{selectedInvoice.invoiceNumber}</h2>
            <div className="text-muted small">
              <p className="mb-1"><span className="fw-bold">Student:</span> {selectedInvoice.studentName}</p>
              <p className="mb-1"><span className="fw-bold">Room:</span> {selectedInvoice.room}</p>
              <p className="mb-1"><span className="fw-bold">Billing Month:</span> {selectedInvoice.billingMonth}</p>
              <p className="mb-0"><span className="fw-bold">Due Date:</span> {selectedInvoice.dueDate}</p>
            </div>
          </div>
          {/* Ensure getStatusColor returns Bootstrap classes like 'bg-success text-white' */}
          <span className={`badge d-inline-flex align-items-center gap-2 p-2 px-3 fw-medium ${getStatusColor(selectedInvoice.status)}`}>
            {getStatusIcon(selectedInvoice.status)}
            {selectedInvoice.status}
          </span>
        </div>
      </div>

      <div className="card-body p-4">
        {/* Charges Section */}
        <div className="mb-5">
          <h3 className="h6 fw-bold text-uppercase text-muted mb-3">Charges</h3>
          <div className="list-group border rounded shadow-none">
            {selectedInvoice.lineItems.map((item, idx) => (
              <div key={idx} className="list-group-item d-flex justify-content-between align-items-center py-3">
                <span className="text-secondary">{item.description}</span>
                <span className="fw-bold text-dark">₹{item.amount.toLocaleString()}</span>
              </div>
            ))}
            <div className="list-group-item d-flex justify-content-between align-items-center bg-primary bg-opacity-10 py-3 fw-bold">
              <span className="text-dark">Total Amount</span>
              <span className="text-primary">₹{selectedInvoice.totalAmount.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Payment Summary Grid */}
        <div className="mb-5">
          <h3 className="h6 fw-bold text-uppercase text-muted mb-3">Payment Summary</h3>
          <div className="row g-3">
            <div className="col-md-4">
              <div className="bg-light rounded p-3 h-100">
                <p className="small text-muted mb-1">Total Amount</p>
                <p className="h4 fw-bold mb-0 text-dark">₹{selectedInvoice.totalAmount.toLocaleString()}</p>
              </div>
            </div>
            <div className="col-md-4">
              <div className="bg-success bg-opacity-10 rounded p-3 h-100 border border-success border-opacity-10">
                <p className="small text-muted mb-1 text-success">Total Paid</p>
                <p className="h4 fw-bold mb-0 text-success">₹{selectedInvoice.paidAmount.toLocaleString()}</p>
              </div>
            </div>
            <div className="col-md-4">
              <div className={`rounded p-3 h-100 border ${selectedInvoice.balanceDue > 0 ? 'bg-danger bg-opacity-10 border-danger border-opacity-10' : 'bg-success bg-opacity-10 border-success border-opacity-10'}`}>
                <p className="small text-muted mb-1">Balance Due</p>
                <p className={`h4 fw-bold mb-0 ${selectedInvoice.balanceDue > 0 ? 'text-danger' : 'text-success'}`}>
                  ₹{selectedInvoice.balanceDue.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Payment History Table */}
        {selectedInvoice.payments.length > 0 && (
          <div className="mb-5">
            <h3 className="h6 fw-bold text-uppercase text-muted mb-3">Payment History</h3>
            <div className="table-responsive border rounded">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th className="ps-4 fw-bold small text-uppercase">Date</th>
                    <th className="fw-bold small text-uppercase">Method</th>
                    <th className="pe-4 text-end fw-bold small text-uppercase">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedInvoice.payments.map((payment, idx) => (
                    <tr key={idx}>
                      <td className="ps-4 text-dark">{payment.date}</td>
                      <td className="text-muted">{payment.method}</td>
                      <td className="pe-4 text-end fw-bold text-dark">₹{payment.amount.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Admin Actions */}
        {userRole === 'admin' && (
          <div className="d-flex flex-wrap gap-3 pt-3 border-top">
            <button
              onClick={() => setShowPaymentModal(true)}
              disabled={selectedInvoice.status === 'Paid'}
              className="action btn btn-view active d-flex align-items-center gap-2 px-4 shadow-sm"
            >
              <Plus size={18} />
              Add Payment
            </button>
            <button
              onClick={handleMarkAsPaid}
              disabled={selectedInvoice.balanceDue === 0}
              className="action btn btn-assign active d-flex align-items-center gap-2 px-4"
            >
              <CheckCircle size={18} />
              Mark as Paid
            </button>
          </div>
        )}
      </div>
    </div>
  </div>
</div>
  );

  return (
    <div>
      {/* Role Switcher for Demo */}
      {/* <div className="bg-gray-800 text-white p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-semibold">Fee Invoices</h1>
          <div className="flex gap-2">
            <button
              onClick={() => {
                setUserRole('admin');
                setView('list');
              }}
              className={`px-4 py-2 rounded ${userRole === 'admin' ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'}`}
            >
              Admin View
            </button>
            <button
              onClick={() => {
                setUserRole('student');
                setView('dashboard');
              }}
              className={`px-4 py-2 rounded ${userRole === 'student' ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'}`}
            >
              Student View
            </button>
          </div>
        </div>
      </div> */}
   <div className="page-header">
        <h2>
          <i className="fas fa-bed"></i>
          Fee Invoices
        </h2>
        <p>Manage student invoices, fees</p>
      </div>
      {/* Main Content */}
      {view === 'list' && userRole === 'admin' && <AdminListView />}
      {view === 'dashboard' && userRole === 'student' && <StudentDashboardView />}
      {view === 'detail' && <InvoiceDetailView />}

      {/* Payment Modal */}
      {showPaymentModal && (
      <div 
  className="modal d-block" 
  style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }} 
  tabIndex="-1"
>
  <div className="modal-dialog modal-dialog-centered">
    <div className="modal-content shadow">
      {/* Modal Header */}
      <div className="modal-header border-0 pb-0">
        <h5 className="modal-title fw-bold text-light">Add Payment</h5>
        <button
          type="button"
          className="btn-close shadow-none"
          onClick={() => {
            setShowPaymentModal(false);
            setPaymentForm({ 
              amount: '', 
              method: 'Cash', 
              date: new Date().toISOString().split('T')[0] 
            });
          }}
          aria-label="Close"
        ></button>
      </div>

      {/* Modal Body */}
      <div className="modal-body p-4">
        <div className="mb-3">
          <label className="form-label small fw-bold text-secondary">
            Amount *
          </label>
          <input
            type="number"
            className="form-control"
            value={paymentForm.amount}
            onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
            placeholder="0.00"
          />
          {selectedInvoice && (
            <div className="form-text text-muted mt-1">
              Remaining balance: ₹{selectedInvoice.balanceDue.toLocaleString()}
            </div>
          )}
        </div>

        <div className="mb-3">
          <label className="form-label small fw-bold text-secondary">
            Payment Method
          </label>
          <select
            className="form-select"
            value={paymentForm.method}
            onChange={(e) => setPaymentForm({ ...paymentForm, method: e.target.value })}
          >
            <option value="Cash">Cash</option>
            <option value="Bank Transfer">Bank Transfer</option>
            <option value="UPI">UPI</option>
            <option value="Card">Card</option>
            <option value="Cheque">Cheque</option>
          </select>
        </div>

        <div className="mb-0">
          <label className="form-label small fw-bold text-secondary">
            Payment Date
          </label>
          <input
            type="date"
            className="form-control"
            value={paymentForm.date}
            onChange={(e) => setPaymentForm({ ...paymentForm, date: e.target.value })}
          />
        </div>
      </div>

      {/* Modal Footer */}
      <div className="modal-footer border-0 p-4 pt-0 d-flex gap-2">
        <button
          type="button"
          onClick={() => {
            setShowPaymentModal(false);
            setPaymentForm({ 
              amount: '', 
              method: 'Cash', 
              date: new Date().toISOString().split('T')[0] 
            });
          }}
          className="btn btn-outline-secondary flex-grow-1"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleAddPayment}
          className="btn btn-primary flex-grow-1 d-flex align-items-center justify-content-center gap-2"
        >
          <CreditCard size={18} />
          Add Payment
        </button>
      </div>
    </div>
  </div>
</div>
      )}
    </div>
  );
};

export default FeeInvoiceUI;