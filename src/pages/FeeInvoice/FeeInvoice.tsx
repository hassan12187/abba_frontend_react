import React, { useState } from 'react';
import { Search, Eye, Plus, Calendar, DollarSign, CreditCard, X, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import useCustomQuery from '../../components/hooks/useCustomQuery';
import { useCustom } from '../../Store/Store';
import { useNavigate } from 'react-router-dom';
import Pagination from '../../components/Layout/Pagination';
import { PatchService } from '../../Services/Services';

// --- Interfaces ---
interface LineItem {
  description: string;
  amount: number;
}

interface Payment {
  date: string;
  amount: number;
  method: string;
}

interface Invoice {
  _id: string;
  invoiceNumber: string;
  student_name: string;
  room_no?: string;
  roomType?: string;
  billingMonth: string;
  totalAmount: number;
  totalPaid: number;
  balanceDue: number;
  status: 'Paid' | 'Partially Paid' | 'Pending' | 'Overdue';
  dueDate: string;
  lineItems: LineItem[];
  payments?: Payment[];
}

interface PaymentForm {
  amount: string;
  method: string;
  date: string|undefined;
}

type ViewType = 'list' | 'detail' | 'dashboard';
type UserRole = 'admin' | 'student';

const FeeInvoiceUI: React.FC = () => {
  const [userRole, setUserRole] = useState<UserRole>('admin');
  const [view, setView] = useState<ViewType>('list');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState<boolean>(false);
  const { token } = useCustom();
  const [currentPage, setCurrentPage] = useState<number>(1);
  const navigate = useNavigate();

  // Fetching data with custom hook
  const { data: feeInvoice, isLoading } = useCustomQuery(
    '/api/admin/fee-invoice',
    token,
    'fee-invoice'
  );

  const [paymentForm, setPaymentForm] = useState<PaymentForm>({
    amount: '',
    method: 'Cash',
    date: new Date().toISOString().split('T')[0]
  });

  // --- Helper Functions ---
  const getStatusColor = (status: Invoice['status']): string => {
    switch (status) {
      case 'Paid': return 'bg-green-100 text-green-800';
      case 'Partially Paid': return 'bg-yellow-100 text-yellow-800';
      case 'Pending': return 'bg-blue-100 text-blue-800';
      case 'Overdue': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: Invoice['status']): JSX.Element | null => {
    switch (status) {
      case 'Paid': return <CheckCircle size={16} />;
      case 'Partially Paid':
      case 'Pending': return <Clock size={16} />;
      case 'Overdue': return <AlertCircle size={16} />;
      default: return null;
    }
  };

  const handleAddPayment = async (): Promise<void> => {
    if (!paymentForm.amount || parseFloat(paymentForm.amount) <= 0 || !selectedInvoice) return;

    const paymentPayload = {
      amount: parseInt(paymentForm.amount),
      method: paymentForm.method,
      date: paymentForm.date
    };

    try {
      const result = await PatchService(`/api/admin/fee-invoice/${selectedInvoice._id}`, paymentPayload, token);
      console.log(result);
      setShowPaymentModal(false);
      setPaymentForm({ amount: '', method: 'Cash', date: new Date().toISOString().split('T')[0] });
      // Note: You might want to trigger a refetch here if your useCustomQuery supports it
    } catch (error) {
      console.error("Payment failed", error);
    }
  };

  const handleMarkAsPaid = (): void => {
    if (selectedInvoice && selectedInvoice.balanceDue > 0) {
      setPaymentForm({ 
        ...paymentForm, 
        amount: selectedInvoice.balanceDue.toString() 
      });
      setShowPaymentModal(true);
    }
  };

  // --- Sub-Components ---

  const AdminListView: React.FC = () => (
    <div>
      <div className='room-form-section'>
        <div className='section-card'>
          <h4 className='section-title'>Create New Invoice</h4>
          <button className='action btn btn-view active' onClick={() => navigate("/create/fee-invoice")}>
            <Calendar size={20} /> Create New Invoices
          </button>
        </div>
      </div>

      <div className="p-6">
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
            {feeInvoice?.map((invoice:Invoice, index:number) => (
              <tr key={invoice._id || index}>
                <td className="roll-no-cell">{invoice.invoiceNumber}</td>
                <td className='roll-no-cell'>{invoice.student_name}</td>
                <td>{invoice.room_no || "No Room"}</td>
                <td>{invoice.billingMonth}</td>
                <td className='roll-no-cell'>₹{invoice.totalAmount?.toLocaleString()}</td>
                <td className='roll-no-cell'>₹{invoice.totalPaid?.toLocaleString()}</td>
                <td className='roll-no-cell'>
                  <span className={invoice.balanceDue > 0 ? 'text-red-600 font-medium' : 'text-gray-600'}>
                    ₹{invoice.balanceDue?.toLocaleString() || 0}
                  </span>
                </td>
                <td>
                  <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded ${getStatusColor(invoice.status)}`}>
                    {getStatusIcon(invoice.status)}
                    {invoice.status}
                  </span>
                </td>
                <td className="roll-no-cell">{new Date(invoice.dueDate).toLocaleDateString()}</td>
                <td className="actions-cell">
                  <div className="action-buttons">
                    <button
                      className="action btn btn-sm btn-view"
                      onClick={() => {
                        setSelectedInvoice(invoice);
                        setView('detail');
                      }}
                      title="View Details"
                    >
                      <Eye size={16} />
                    </button>
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
        {!isLoading && feeInvoice?.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No invoices found</p>
          </div>
        )}
        <Pagination currentPage={currentPage} setCurrentPage={setCurrentPage} length={feeInvoice?.length || 0} />
      </div>
    </div>
  );

  const InvoiceDetailView: React.FC = () => {
    if (!selectedInvoice) return null;

    return (
      <div className="container-fluid bg-light min-vh-100 py-4 py-md-5">
        <div className="container" style={{ maxWidth: '850px' }}>
          <button
            type="button"
            onClick={() => setView(userRole === 'admin' ? 'list' : 'dashboard')}
            className="btn btn-outline-secondary mb-4 d-flex align-items-center gap-2"
          >
            ← Back to {userRole === 'admin' ? 'Invoices' : 'Dashboard'}
          </button>

          <div className="card shadow-sm border-0">
            <div className="card-header bg-light border-bottom py-4 px-4">
              <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-start gap-3">
                <div>
                  <h2 className="h4 fw-bold text-dark mb-2">{selectedInvoice.invoiceNumber}</h2>
                  <div className="text-muted small">
                    <p className="mb-1"><span className="fw-bold">Student:</span> {selectedInvoice.student_name}</p>
                    <p className="mb-1"><span className="fw-bold">Room:</span> {selectedInvoice.room_no || "No Room"}</p>
                    <p className="mb-1"><span className="fw-bold">Billing Month:</span> {selectedInvoice.billingMonth}</p>
                    <p className="mb-0"><span className="fw-bold">Due Date:</span> {selectedInvoice.dueDate}</p>
                  </div>
                </div>
                <span className={`badge d-inline-flex align-items-center gap-2 p-2 px-3 fw-medium ${getStatusColor(selectedInvoice.status)}`}>
                  {getStatusIcon(selectedInvoice.status)}
                  {selectedInvoice.status}
                </span>
              </div>
            </div>

            <div className="card-body p-4">
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

              <div className="row g-3 mb-5">
                <div className="col-md-4">
                  <div className="bg-light rounded p-3 h-100">
                    <p className="small text-muted mb-1">Total Amount</p>
                    <p className="h4 fw-bold mb-0 text-dark">₹{selectedInvoice.totalAmount.toLocaleString()}</p>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="bg-success bg-opacity-10 rounded p-3 h-100 border border-success border-opacity-10">
                    <p className="small text-muted mb-1 text-success">Total Paid</p>
                    <p className="h4 fw-bold mb-0 text-success">₹{selectedInvoice.totalPaid.toLocaleString()}</p>
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

              {userRole === 'admin' && (
                <div className="d-flex flex-wrap gap-3 pt-3 border-top">
                  <button
                    onClick={() => setShowPaymentModal(true)}
                    disabled={selectedInvoice.status === 'Paid'}
                    className="action btn btn-view active d-flex align-items-center gap-2 px-4 shadow-sm"
                  >
                    <Plus size={18} /> Add Payment
                  </button>
                  <button
                    onClick={handleMarkAsPaid}
                    disabled={selectedInvoice.balanceDue === 0}
                    className="action btn btn-assign active d-flex align-items-center gap-2 px-4"
                  >
                    <CheckCircle size={18} /> Mark as Paid
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div>
      <div className="page-header">
        <h2><i className="fas fa-file-invoice-dollar me-2"></i> Fee Invoices</h2>
        <p>Manage student invoices and fees</p>
      </div>

      {view === 'list' && userRole === 'admin' && <AdminListView />}
      {view === 'detail' && <InvoiceDetailView />}

      {showPaymentModal && (
        <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content shadow">
              <div className="modal-header border-0 pb-0">
                <h5 className="modal-title fw-bold">Add Payment</h5>
                <button
                  type="button"
                  className="btn-close shadow-none"
                  onClick={() => setShowPaymentModal(false)}
                ></button>
              </div>

              <div className="modal-body p-4">
                <div className="mb-3">
                  <label className="form-label small fw-bold text-secondary">Amount *</label>
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
                  <label className="form-label small fw-bold text-secondary">Payment Method</label>
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
                  <label className="form-label small fw-bold text-secondary">Payment Date</label>
                  <input
                    type="date"
                    className="form-control"
                    value={paymentForm.date}
                    onChange={(e) => setPaymentForm({ ...paymentForm, date: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-footer border-0 p-4 pt-0 d-flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="btn btn-outline-secondary flex-grow-1"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAddPayment}
                  className="btn btn-primary flex-grow-1 d-flex align-items-center justify-content-center gap-2"
                >
                  <CreditCard size={18} /> Add Payment
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