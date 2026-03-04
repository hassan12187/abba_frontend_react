import React, { useState } from 'react';
import './Payments.css';
import { usePaymentQuery } from '../../components/hooks/usePaymentQuery';
import { useCustom } from '../../Store/Store';
import Pagination from '../../components/Layout/Pagination';
import { PostService } from '../../Services/Services';
import { useDebounce } from '../../components/hooks/useDebounce';
import { useMutation, useQueryClient } from '@tanstack/react-query';

// --- Interfaces ---
interface UseCustomInterface {
  token: string;
}

interface Payment {
  id: string;
  student_roll_no: string;
  student_name: string;
  totalAmount: number;
  paymentMethod: 'cash' | 'online';
  paymentDate: string;
}

interface PaymentFormData {
  student_roll_no: string;
  totalAmount: string;
  paymentMethod: string;
}

const Payments = () => {
  const { token } = (useCustom() as UseCustomInterface) || { token: "" };
  const queryClient = useQueryClient();
  
  const [currentPage, setCurrentPage] = useState(1);
  const [receiptData, setReceiptData] = useState<Payment | null>(null); // Fixed: Added missing state

  // Fixed: Standardized inputVal to always be an object for consistency
  const [inputVal, setInputVal] = useState({
    student_roll_no: "",
    paymentDate: ""
  });

  const [formData, setFormData] = useState<PaymentFormData>({
    student_roll_no: '',
    totalAmount: '',
    paymentMethod: 'cash'
  });

  const [filters, setFilters] = useState({
    student_roll_no: '',
    paymentDate: ''
  });

  const [editIndex, setEditIndex] = useState<number | null>(null);

  // --- Queries & Mutations ---
  const { data, isLoading } = usePaymentQuery(currentPage - 1, token, filters.student_roll_no, filters.paymentDate);

  const mutate = useMutation({
    mutationFn: async (fmData: PaymentFormData) => await PostService("/api/admin/payment", fmData, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["page"] });
      setFormData({
        student_roll_no: '',
        totalAmount: '',
        paymentMethod: 'cash'
      });
    }
  });

  // --- Handlers ---
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const updateFilters = useDebounce((name: string, value: string) => {
    setFilters(prev => ({ ...prev, [name]: value }));
  }, 500);

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setInputVal(prev => ({ ...prev, [name]: value }));
    updateFilters(name, value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    mutate.mutate(formData);
  };

  const handleEdit = (index: number) => {
    setEditIndex(index);
  };

  const handleDelete = (index: number) => {
    console.log("Delete index:", index);
  };

  const cancelEdit = () => {
    setEditIndex(null);
    setFormData({
      student_roll_no: '',
      totalAmount: '',
      paymentMethod: 'cash'
    });
  };

  const clearFilters = () => {
    if (!filters.student_roll_no && !filters.paymentDate) return;
    setInputVal({ student_roll_no: "", paymentDate: "" });
    setFilters({ student_roll_no: '', paymentDate: '' });
  };

  const exportToExcel = () => {
    alert('Export to Excel functionality would be implemented here');
  };

  const printReceipt = (payment: Payment) => {
    setReceiptData(payment);
    
    setTimeout(() => {
      const printWindow = window.open('', '_blank');
      if (!printWindow) return;

      printWindow.document.write(`
        <html>
          <head>
            <title>Payment Receipt</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; }
              .receipt-container { width: 80mm; border: 1px solid #eee; padding: 10px; margin: auto; }
              .header { text-align: center; border-bottom: 1px solid #000; }
              .receipt-details p { display: flex; justify-content: space-between; margin: 5px 0; }
              @media print { .receipt-container { border: none; } }
            </style>
          </head>
          <body>
            <div class="receipt-container">
              <div class="header"><h2>Hostel System</h2><h3>Receipt</h3></div>
              <div class="receipt-details">
                <p><strong>Receipt No:</strong> <span>${payment.id}</span></p>
                <p><strong>Reg No:</strong> <span>${payment.student_roll_no}</span></p>
                <p><strong>Name:</strong> <span>${payment.student_name}</span></p>
                <p><strong>Amount:</strong> <span>PKR ${payment.totalAmount.toLocaleString()}</span></p>
                <p><strong>Method:</strong> <span>${payment.paymentMethod}</span></p>
                <p><strong>Date:</strong> <span>${new Date(payment.paymentDate).toLocaleDateString()}</span></p>
              </div>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }, 100);
  };

  const totalAmount = data?.data?.reduce((sum: number, payment: any) => sum + (payment.totalAmount || 0), 0) || 0;

  const getPaymentMethodBadge = (method: string) => {
    const methodConfig: Record<string, { label: string, class: string }> = {
      cash: { label: 'Cash', class: 'badge-cash' },
      online: { label: 'Online', class: 'badge-online' }
    };
    const config = methodConfig[method] || { label: method, class: 'badge-default' };
    return <span className={`payment-badge ${config.class}`}>{config.label}</span>;
  };

  return (
    <div className="payments-page">
      <div className="page-header">
        <h2><i className="fas fa-credit-card"></i> Payments Management</h2>
      </div>

      <div className="payment-form-section">
        <div className="section-card">
          <h4 className="section-title">
            <i className="fas fa-plus-circle"></i>
            {editIndex !== null ? 'Edit Payment' : 'Process New Payment'}
          </h4>
          <form onSubmit={handleSubmit} className="payment-form">
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Student Registration No *</label>
                <input
                  type="text"
                  name="student_roll_no"
                  className="form-control"
                  value={formData.student_roll_no}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Amount (PKR) *</label>
                <input
                  type="number"
                  name="totalAmount"
                  className="form-control"
                  value={formData.totalAmount}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Payment Method *</label>
                <select
                  name="paymentMethod"
                  className="form-control"
                  value={formData.paymentMethod}
                  onChange={handleInputChange}
                  required
                >
                  <option value="cash">Cash</option>
                  <option value="online">Online</option>
                </select>
              </div>
            </div>
            <div className="form-actions">
              <button type="submit" className="action btn btn-view active">
                <i className="fas fa-save"></i> {editIndex !== null ? 'Update' : 'Save'}
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="filters-section">
        <div className="section-card">
          <div className="filters-row">
            <div className="filter-group">
              <label>Search by Reg No</label>
              <input
                type="text"
                name="student_roll_no"
                className="form-control"
                value={inputVal.student_roll_no}
                onChange={handleFilterChange}
              />
            </div>
            <div className="filter-group">
              <label>Date</label>
              <input
                type="date"
                name="paymentDate"
                className="form-control"
                value={inputVal.paymentDate}
                onChange={handleFilterChange}
              />
            </div>
            <button className="btn btn-outline-secondary" onClick={clearFilters}>Clear</button>
            <button className="btn btn-success" onClick={exportToExcel}>Export</button>
          </div>
        </div>
      </div>

      <div className="payments-table-section">
        <div className="section-card">
          <div className="card-header-enhanced">
            <h3 className="card-title">Payment History</h3>
            <div className="total-payments">
              Total Amount: <span className="total-amount">PKR {totalAmount.toLocaleString()}</span>
            </div>
          </div>
          <div className="table-container">
            <table className="payments-table">
              <thead>
                <tr>
                  <th>Student Roll No.</th>
                  <th>Amount</th>
                  <th>Method</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan={5}>Loading...</td></tr>
                ) : data?.data?.length > 0 ? (
                  data.data.map((payment: Payment, index: number) => (
                    <tr key={payment.id || index} className="payment-row text-center">
                      <td>{payment.student_roll_no}</td>
                      <td>PKR {payment.totalAmount?.toLocaleString()}</td>
                      <td>{getPaymentMethodBadge(payment.paymentMethod)}</td>
                      <td>{new Date(payment.paymentDate).toLocaleDateString()}</td>
                      <td className='d-flex'>
                        <button className='action btn btn-view' onClick={() => printReceipt(payment)}><i className="fas fa-print"></i></button>
                        <button className='action btn btn-edit' onClick={() => handleEdit(index)}><i className="fas fa-edit"></i></button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan={5}>No payments found</td></tr>
                )}
              </tbody>
            </table>
            <Pagination currentPage={currentPage} setCurrentPage={setCurrentPage} length={data?.totalCount || 0} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Payments;