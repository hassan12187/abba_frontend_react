import React, { useState } from 'react';
import { ArrowLeft, Plus, Trash2, Save, User, FileText, Search, X, CheckCircle, AlertCircle } from 'lucide-react';
import InputField from '../../components/reusable/InputField'; 
import { useNavigate } from 'react-router-dom';
import { GetService, PostService } from '../../Services/Services';
import { useCustom } from '../../Store/Store';

const CreateFeeInvoice = ({ onBack, onSave }) => {
  const navigate = useNavigate();
  const { token } = useCustom();

  // --- Constants & Templates ---
  const feeTemplates = [
    { id: 't1', name: 'Standard Monthly', items: [{ description: 'Room Rent', amount: 5000 }, { description: 'Mess Charges', amount: 3000 }] },
    { id: 't2', name: 'Deluxe Monthly', items: [{ description: 'Room Rent', amount: 8000 }, { description: 'Mess Charges', amount: 3500 }] },
    { id: 't3', name: 'Maintenance Only', items: [{ description: 'Maintenance', amount: 1500 }] },
  ];

  // --- State Management ---
  const [formData, setFormData] = useState({
    student_id: '',
    student_name: '',
    room_no: '', 
    billingMonth: new Date().toISOString().slice(0, 7), 
    dueDate: '',
    lineItems: [{ description: 'Room Rent', amount: 0 }],
  });

  // Search specific state
  const [searchTerm, setSearchTerm] = useState('');
  const [foundStudent, setFoundStudent] = useState(null); 
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState(null);

  // --- Calculations ---
  const totalAmount = formData.lineItems.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);

  // --- Handlers: Search Logic ---

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;
    
    setIsSearching(true);
    setSearchError(null);
    setFoundStudent(null);

    try {
      const response = await GetService(`/api/admin/fee-invoice/student?q=${searchTerm}`, token);
      console.log(response);
      if (response) {
        setFoundStudent(response); 
      } else {
        setSearchError('No student found with that Name or ID.');
      }
    } catch (error) {
      console.error("Search failed:", error);
      setSearchError('Network error. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const confirmStudentSelection = () => {
    if (!foundStudent) return;
    console.log(foundStudent);
    setFormData(prev => (
      {...prev,
        student_id: foundStudent?.student_id,
        student_name: foundStudent?.student_name,
        room_no: foundStudent?.room_no
      }
    ));
    
    setFoundStudent(null); 
    setSearchError(null);
  };
  const clearSelectedStudent = () => {
    setFormData(prev => ({
      ...prev,
      student_id: '',
      student_name: '',
      room_no: ''
    }));
    setSearchTerm('');
    setFoundStudent(null);
  };

  // --- Handlers: Fee Items ---

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
    setFormData(prev => ({
      ...prev,
      lineItems: [...prev.lineItems, { description: '', amount: 0 }]
    }));
  };

  const removeLineItem = (index) => {
    const newItems = formData.lineItems.filter((_, i) => i !== index);
    setFormData({ ...formData, lineItems: newItems });
  };

  // --- Handlers: Submit ---

  const handleSubmit = async(e) => {
    e.preventDefault();
    
    if (!formData.student_id) {
      alert('Please search and select a student first.');
      return;
    }
    
    // const payload = { 
    //   ...formData, 
    //   totalAmount, 
    //   status: 'Pending',
    //   createdAt: new Date().toISOString()
    // };
    console.log(formData);
    const result = await PostService("/api/admin/fee-invoice",formData,token);
    console.log(result);
    if (onSave) onSave(payload);
  };

  return (
    <div className="container-fluid p-4">
      
      {/* 1. Header Row */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="h4 mb-0 text-dark">Create New Invoice</h2>
        <button 
          className="btn btn-outline-secondary d-flex align-items-center gap-2" 
          onClick={() => navigate(-1)}
        >
          <ArrowLeft size={18} /> Back to List
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="row">
          
          {/* 2. Left Column: Student Search & Form Data */}
          <div className="col-lg-8">
            
            {/* Student Search Section */}
            <div className="room-form-section mb-4">
              <div className="section-card shadow-sm bg-white p-4 rounded">
                <h4 className="section-title d-flex align-items-center gap-2 mb-3 border-bottom pb-2">
                  <User color='#3498db' size={20} />
                  Student Details
                </h4>
                
                <div className="row g-3">
                  <div className="col-12">
                    <label className="form-label fw-bold text-secondary small mb-1">Search Student</label>
                    
                    {/* --- FIXED: FLEXBOX SEARCH BAR --- */}
                    <div className="d-flex w-100 gap-2">
                      <input 
                        type="text" 
                        className={`form-control ${formData.student_id ? 'bg-light' : ''}`}
                        style={{ flex: 1 }} // THIS FORCES INPUT TO TAKE ALL WIDTH
                        placeholder={formData.student_id ? `${formData.student_name}` : "Enter Name or Enrollment ID"}
                        value={formData.student_id ? formData.student_name : searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        disabled={!!formData.student_id}
                        onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
                      />
                      
                      {/* Button stays to the right with natural width */}
                      {formData.student_id ? (
                        <button 
                          className="btn btn-outline-danger border d-flex align-items-center justify-content-center" 
                          type="button" 
                          onClick={clearSelectedStudent}
                          title="Remove Student"
                          style={{ minWidth: '45px' }}
                        >
                          <X size={18} />
                        </button>
                      ) : (
                        <button 
                          className="action btn btn-view active px-3 d-flex align-items-center gap-2" 
                          type="button" 
                          onClick={handleSearch}
                          disabled={isSearching || !searchTerm}
                          style={{ whiteSpace: 'nowrap' }}
                        >
                          {isSearching ? <span className="spinner-border spinner-border-sm"/> : <Search size={18} />}
                          Search
                        </button>
                      )}
                    </div>
                    {/* ---------------------------------- */}

                    {/* Feedback: Error Message */}
                    {searchError && (
                      <div className="alert alert-danger d-flex align-items-center gap-2 mt-2 py-2 small" role="alert">
                        <AlertCircle size={16} /> {searchError}
                      </div>
                    )}

                    {/* Feedback: Success / Selection Card */}
                    {foundStudent && !formData.student_id && (
                      <div className="card mt-3 border-primary shadow-sm bg-light">
                        <div className="card-body d-flex justify-content-between align-items-center p-3">
                          <div>
                            <h6 className="mb-0 fw-bold text-dark">{foundStudent.student_name}</h6>
                            <div className="small text-muted">
                              Room: <span className="fw-medium text-dark">{foundStudent?.room_no}</span> • ID: {foundStudent?.student_roll_no}
                            </div>
                          </div>
                          <button 
                            type="button" 
                            className="action btn-assign active d-flex align-items-center gap-1 shadow-sm"
                            onClick={confirmStudentSelection}
                            style={{borderRadius:"8px",padding:"6px 15px"}}
                          >
                            <CheckCircle size={16} /> Confirm
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Date & Room Fields */}
                     {/* <div className="col-md-6 mt-3">
                    <InputField 
                    type={"text"}
                      label="Student Name" 
                      name="student_name" 
                      value={formData?.student_name} 
                      readonly={true} 
                      placeholder="Auto-filled on selection" 
                    />
                  </div> */}
                  <div className="col-md-6 mt-3">
                    <InputField 
                    type={"text"}
                      label="Room Number" 
                      name="room_no"
                      value={formData?.room_no} 
                      readonly={true} 
                      placeholder="Auto-filled on selection" 
                    />
                  </div>
                  {/* <div className="col-md-6 mt-3"></div> Spacer */}

                  <div className="col-md-6">
                    <InputField 
                      type="month" 
                      label="Billing Month" 
                      name="billingMonth" 
                      value={formData.billingMonth} 
                      onChange={(e) => setFormData({...formData, billingMonth: e.target.value})} 
                    />
                  </div>
                  <div className="col-md-6">
                    <InputField 
                      type="date" 
                      label="Due Date" 
                      name="dueDate" 
                      value={formData.dueDate} 
                      onChange={(e) => setFormData({...formData, dueDate: e.target.value})} 
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Fee Breakdown Section */}
            <div className="room-form-section">
              <div className="section-card shadow-sm bg-white p-4 rounded">
                <div className="d-flex justify-content-between align-items-center mb-3 border-bottom pb-2">
                  <h4 className="section-title mb-0 d-flex align-items-center gap-2">
                    <FileText color='#3498db' size={20} />
                    Fee Breakdown
                  </h4>
                  <div className="w-50">
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
                              <button 
                                type="button" 
                                className="btn btn-sm btn-outline-danger" 
                                onClick={() => removeLineItem(index)}
                                title="Remove Item"
                              >
                                <Trash2 size={16} />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                <button type="button" className="action btn btn-view active btn-sm mt-2" onClick={addLineItem}>
                  <Plus size={16} className="me-1" /> Add Fee Item
                </button>
              </div>
            </div>
          </div>

          {/* 3. Right Column: Summary & Actions */}
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
                  <button 
                    type="submit" 
                    className="action btn btn-view active py-2 d-flex justify-content-center align-items-center gap-2"
                    disabled={!formData?.student_id || totalAmount <= 0}
                  >
                    <Save size={18} /> Generate Invoice
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-light border" 
                    onClick={() => navigate(-1)}
                  >
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