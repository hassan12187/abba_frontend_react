import React, { useState } from 'react';
import { Search, Eye, Plus, Calendar, DollarSign, CreditCard, X, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import InputField from '../../components/reusable/InputField';
import SelectField from '../../components/reusable/SelectField';
import useCustomQuery from '../../components/hooks/useCustomQuery';
import { useCustom } from '../../Store/Store';
import CreateFeeInvoice from './createFeeInvoice';
import { Navigate, useNavigate } from 'react-router-dom';

const FeeInvoiceUI = () => {
  const [userRole, setUserRole] = useState('admin'); // 'admin' or 'student'
  const [view, setView] = useState('list'); // 'list' or 'detail'
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const {token}=useCustom();
  const navigate=useNavigate();
  const {data:feeInvoice,isLoading}=useCustomQuery('/api/admin/fee',token,'fee-invoice');
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

  const [searchTerm, setSearchTerm] = useState('');
  const [monthFilter, setMonthFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [roomTypeFilter, setRoomTypeFilter] = useState('');

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
              <button className='btn btn-primary' onClick={()=>{
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
                  {invoices.map((invoice) => (
                    <tr key={invoice.id}>
                      <td className="roll-no-cell">{invoice.invoiceNumber}</td>
                      <td className='roll-no-cell'>{invoice.studentName}</td>
                      <td>{invoice.room}</td>
                      <td>{invoice.billingMonth}</td>
                      <td className='roll-no-cell'>
                        ₹{invoice.totalAmount.toLocaleString()}
                      </td>
                      <td className='roll-no-cell'>
                        ₹{invoice.paidAmount.toLocaleString()}
                      </td>
                      <td className='roll-no-cell'>
                        <span className={invoice.balanceDue > 0 ? 'text-red-600 font-medium' : 'text-gray-600'}>
                          ₹{invoice.balanceDue.toLocaleString()}
                        </span>
                      </td>
                      <td>
                        <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded ${getStatusColor(invoice.status)}`}>
                          {getStatusIcon(invoice.status)}
                          {invoice.status}
                        </span>
                      </td>
                      <td className="roll-no-cell">{invoice.dueDate}</td>
                      <td className="actions-cell">
                        <div className="action-buttons">
                             <button
                              className="btn btn-sm btn-view"
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
                              className="btn btn-sm btn-approve"
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

              {invoices.length === 0 && (
                <div className="text-center py-12">
                  <DollarSign size={48} className="mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-500 text-lg">No invoices found</p>
                  <p className="text-gray-400 text-sm mt-2">Try adjusting your filters</p>
                </div>
              )}
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
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        <button
        type='button'
          onClick={() => setView(userRole === 'admin' ? 'list' : 'dashboard')}
          className="btn btn-primary mb-4"
        >
          ← Back to {userRole === 'admin' ? 'Invoices' : 'Dashboard'}
        </button>

        <div className="bg-white rounded-lg shadow-sm">
          <div className="border-b border-gray-200 px-6 py-4 bg-gray-50">
            <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
              <div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-2">{selectedInvoice.invoiceNumber}</h2>
                <div className="space-y-1 text-sm text-gray-600">
                  <p><span className="font-medium">Student:</span> {selectedInvoice.studentName}</p>
                  <p><span className="font-medium">Room:</span> {selectedInvoice.room}</p>
                  <p><span className="font-medium">Billing Month:</span> {selectedInvoice.billingMonth}</p>
                  <p><span className="font-medium">Due Date:</span> {selectedInvoice.dueDate}</p>
                </div>
              </div>
              <span className={`inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded ${getStatusColor(selectedInvoice.status)}`}>
                {getStatusIcon(selectedInvoice.status)}
                {selectedInvoice.status}
              </span>
            </div>
          </div>

          <div className="p-6 space-y-6 bg bg-dark">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Charges</h3>
              <div className="border border-gray-200 rounded-md overflow-hidden">
                {selectedInvoice.lineItems.map((item, idx) => (
                  <div key={idx} className="flex justify-between px-4 py-3 border-b last:border-b-0 hover:bg-gray-50">
                    <span className="text-gray-700">{item.description}</span>
                    <span className="font-medium text-gray-900">₹{item.amount.toLocaleString()}</span>
                  </div>
                ))}
                <div className="flex justify-between px-4 py-3 bg-blue-50 font-semibold">
                  <span className="text-gray-900">Total Amount</span>
                  <span className="text-blue-700">₹{selectedInvoice.totalAmount.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Summary</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Total Amount</p>
                  <p className="text-2xl font-bold text-gray-900">₹{selectedInvoice.totalAmount.toLocaleString()}</p>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Total Paid</p>
                  <p className="text-2xl font-bold text-green-700">₹{selectedInvoice.paidAmount.toLocaleString()}</p>
                </div>
                <div className={`rounded-lg p-4 ${selectedInvoice.balanceDue > 0 ? 'bg-red-50' : 'bg-green-50'}`}>
                  <p className="text-sm text-gray-600 mb-1">Balance Due</p>
                  <p className={`text-2xl font-bold ${selectedInvoice.balanceDue > 0 ? 'text-red-700' : 'text-green-700'}`}>
                    ₹{selectedInvoice.balanceDue.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            {selectedInvoice.payments.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment History</h3>
                <div className="border border-gray-200 rounded-md overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Date</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Payment Method</th>
                        <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {selectedInvoice.payments.map((payment, idx) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-900">{payment.date}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{payment.method}</td>
                          <td className="px-4 py-3 text-sm text-gray-900 text-right font-medium">
                            ₹{payment.amount.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {userRole === 'admin' && (
              <div className="d-flex">
                <button
                  onClick={() => setShowPaymentModal(true)}
                  disabled={selectedInvoice.status === 'Paid'}
                  className="btn-primary"
                >
                  <Plus size={18} />
                  Add Payment
                </button>
                <button
                  onClick={handleMarkAsPaid}
                  disabled={selectedInvoice.balanceDue === 0}
                  className="btn-success"
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Add Payment</h3>
              <button
                onClick={() => {
                  setShowPaymentModal(false);
                  setPaymentForm({ amount: '', method: 'Cash', date: new Date().toISOString().split('T')[0] });
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount *
                </label>
                <input
                  type="number"
                  value={paymentForm.amount}
                  onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                />
                {selectedInvoice && (
                  <p className="mt-1 text-sm text-gray-500">
                    Remaining balance: ₹{selectedInvoice.balanceDue.toLocaleString()}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Method
                </label>
                <select
                  value={paymentForm.method}
                  onChange={(e) => setPaymentForm({ ...paymentForm, method: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Cash">Cash</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="UPI">UPI</option>
                  <option value="Card">Card</option>
                  <option value="Cheque">Cheque</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Date
                </label>
                <input
                  type="date"
                  value={paymentForm.date}
                  onChange={(e) => setPaymentForm({ ...paymentForm, date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowPaymentModal(false);
                  setPaymentForm({ amount: '', method: 'Cash', date: new Date().toISOString().split('T')[0] });
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAddPayment}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center justify-center gap-2"
              >
                <CreditCard size={18} />
                Add Payment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FeeInvoiceUI;