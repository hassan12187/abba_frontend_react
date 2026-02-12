import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Trash2, Save, Calendar, User, FileText } from 'lucide-react';
import InputField from '../../components/reusable/InputField'; 
import SelectField from '../../components/reusable/SelectField';
import { useNavigate } from 'react-router-dom';

const CreateFeeInvoice = ({ onBack, onSave }) => {
  // --- Mock Data (Replace with your actual API hooks) ---
  const navigate=useNavigate();
  const students = [
    { id: 1, name: 'Aisha Khan', room: 'A-101' },
    { id: 2, name: 'Bilal Ahmed', room: 'B-205' },
    { id: 3, name: 'Sara Malik', room: 'A-203' },
  ];

  const feeTemplates = [
    { id: 't1', name: 'Standard Monthly', items: [{ description: 'Room Rent', amount: 5000 }, { description: 'Mess Charges', amount: 3000 }] },
    { id: 't2', name: 'Deluxe Monthly', items: [{ description: 'Room Rent', amount: 8000 }, { description: 'Mess Charges', amount: 3500 }] },
    { id: 't3', name: 'Maintenance Only', items: [{ description: 'Maintenance', amount: 1500 }] },
  ];

  // --- State ---
  const [formData, setFormData] = useState({
    studentId: '',
    room: '', 
    billingMonth: new Date().toISOString().slice(0, 7), // YYYY-MM
    dueDate: '',
    lineItems: [{ description: 'Room Rent', amount: 0 }],
  });

  // --- Calculations ---
  const totalAmount = formData.lineItems.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);

  // --- Handlers ---
  const handleStudentChange = (e) => {
    const sId = e.target.value;
    const student = students.find(s => s.id == sId);
    setFormData({ 
      ...formData, 
      studentId: sId,
      room: student ? student.room : '' 
    });
  };

  const applyTemplate = (e) => {
    const templateId = e.target.value;
    const template = feeTemplates.find(t => t.id === templateId);
    if (template) {
      setFormData(prev => ({ ...prev, lineItems: [...template.items] }));
    }
  };

  const handleLineItemChange = (index, field, value) => {
    const newItems = [...formData.lineItems];
    newItems[index][field] = field === 'amount' ? parseFloat(value) : value;
    setFormData({ ...formData, lineItems: newItems });
  };

  const addLineItem = () => {
    setFormData({
      ...formData,
      lineItems: [...formData.lineItems, { description: '', amount: 0 }]
    });
  };

  const removeLineItem = (index) => {
    const newItems = formData.lineItems.filter((_, i) => i !== index);
    setFormData({ ...formData, lineItems: newItems });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.studentId) return alert('Please select a student');
    
    const payload = { ...formData, totalAmount, status: 'Pending' };
    console.log("Submitting:", payload);
    if(onSave) onSave(payload);
  };

  return (
    <div className="container-fluid p-4">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="h4 mb-0 text-dark">Create New Invoice</h2>
        <button className="btn btn-outline-secondary d-flex align-items-center gap-2" onClick={()=>(navigate(-1))}>
          <ArrowLeft size={18} /> Back to List
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="row">
          
          {/* Left Column: Student & Invoice Info */}
          <div className="col-lg-8">
            <div className="room-form-section mb-4">
              <div className="section-card shadow-sm bg-white p-4 rounded">
                <h4 className="section-title d-flex align-items-center gap-2 mb-3 border-bottom pb-2">
                  <User color='#3498db' size={20} />
                  Student Details
                </h4>
                
                <div className="row g-3">
                  <div className="col-md-6">
                    <SelectField label="Student Name" name="studentId" value={formData.studentId} onChange={handleStudentChange}>
                      <option value="">-- Select Student --</option>
                      {students.map(s => <option key={s.id} value={s.id}>{s.name} ({s.room})</option>)}
                    </SelectField>
                  </div>
                  <div className="col-md-6">
                    <InputField label="Room Number" name="room" value={formData.room} readonly={true} placeholder="Auto-filled" />
                  </div>
                  <div className="col-md-6">
                    <InputField type="month" label="Billing Month" name="billingMonth" value={formData.billingMonth} onChange={(e) => setFormData({...formData, billingMonth: e.target.value})} />
                  </div>
                  <div className="col-md-6">
                    <InputField type="date" label="Due Date" name="dueDate" value={formData.dueDate} onChange={(e) => setFormData({...formData, dueDate: e.target.value})} />
                  </div>
                </div>
              </div>
            </div>

            {/* Line Items Section */}
            <div className="room-form-section">
              <div className="section-card shadow-sm bg-white p-4 rounded">
                <div className="d-flex justify-content-between align-items-center mb-3 border-bottom pb-2">
                  <h4 className="section-title mb-0 d-flex align-items-center gap-2">
                    <FileText color='#3498db' size={20} />
                    Fee Breakdown
                  </h4>
                  <div className="w-50">
                     {/* Template Selector */}
                     <select className="form-control form-select form-select-sm" onChange={applyTemplate}>
                        <option value="">Load from Template...</option>
                        {feeTemplates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                     </select>
                  </div>
                </div>

                <div className="table-responsive">
                  <table className="table table-borderless align-middle">
                    <thead className="table-light">
                      <tr>
                        <th style={{width: '60%'}}>Description</th>
                        <th style={{width: '30%'}}>Amount (₹)</th>
                        <th style={{width: '10%'}}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {formData.lineItems.map((item, index) => (
                        <tr key={index}>
                          <td>
                            <input 
                              type="text" 
                              className="form-control"
                              placeholder="e.g. Room Rent"
                              value={item.description}
                              onChange={(e) => handleLineItemChange(index, 'description', e.target.value)}
                              required
                            />
                          </td>
                          <td>
                            <input 
                              type="number" 
                              className="form-control text-end"
                              placeholder="0"
                              min="0"
                              value={item.amount}
                              onChange={(e) => handleLineItemChange(index, 'amount', e.target.value)}
                              required
                            />
                          </td>
                          <td className="text-center">
                            {formData.lineItems.length > 1 && (
                              <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => removeLineItem(index)}>
                                <Trash2 size={16} />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                <button type="button" className="btn btn-outline-primary btn-sm mt-2" onClick={addLineItem}>
                  <Plus size={16} className="me-1" /> Add Fee Item
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Summary */}
          <div className="col-lg-4 mt-4 mt-lg-0">
             <div className="section-card shadow-sm bg-white p-4 rounded sticky-top" style={{top: '20px'}}>
                <h4 className="section-title mb-3 border-bottom pb-2">Payment Summary</h4>
                
                <div className="d-flex justify-content-between mb-2 text-secondary">
                  <span>Total Items:</span>
                  <span>{formData.lineItems.length}</span>
                </div>
                
                <div className="d-flex justify-content-between mb-4">
                   <h5 className="fw-bold">Total Amount:</h5>
                   <h4 className="fw-bold text-primary">₹{totalAmount.toLocaleString()}</h4>
                </div>

                <div className="d-grid gap-2">
                  <button type="submit" className="btn btn-primary py-2 d-flex justify-content-center align-items-center gap-2">
                    <Save size={18} /> Generate Invoice
                  </button>
                  <button type="button" className="btn btn-light border" onClick={onBack}>
                    Cancel
                  </button>
                </div>
             </div>
          </div>

        </div>
      </form>
    </div>
  );
};

export default CreateFeeInvoice;