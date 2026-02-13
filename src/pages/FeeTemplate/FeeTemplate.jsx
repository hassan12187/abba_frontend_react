import React, { useState } from 'react';
import { Plus, Search, Edit2, Trash2, X, Eye } from 'lucide-react';

const FeeTemplateAdmin = () => {
  const [view, setView] = useState('list');
  const [templates, setTemplates] = useState([
    {
      id: 1,
      name: 'Standard Room Fee',
      description: 'Monthly room charges for standard rooms',
      category: 'Room',
      frequency: 'Monthly',
      roomType: 'Standard',
      lineItems: [
        { description: 'Room Rent', amount: 5000 },
        { description: 'Maintenance', amount: 500 }
      ],
      total: 5500
    },
    {
      id: 2,
      name: 'Deluxe Room Fee',
      description: 'Monthly room charges for deluxe rooms',
      category: 'Room',
      frequency: 'Monthly',
      roomType: 'Deluxe',
      lineItems: [
        { description: 'Room Rent', amount: 8000 },
        { description: 'Maintenance', amount: 800 }
      ],
      total: 8800
    },
    {
      id: 3,
      name: 'Mess Charges',
      description: 'Monthly mess and food charges',
      category: 'Mess',
      frequency: 'Monthly',
      roomType: 'N/A',
      lineItems: [
        { description: 'Food Charges', amount: 3000 }
      ],
      total: 3000
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [frequencyFilter, setFrequencyFilter] = useState('');
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [viewTemplate, setViewTemplate] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'Room',
    frequency: 'Monthly',
    roomType: '',
    lineItems: [{ description: '', amount: '' }]
  });

  const [errors, setErrors] = useState({});

  const filteredTemplates = templates.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          t.roomType.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !categoryFilter || t.category === categoryFilter;
    const matchesFrequency = !frequencyFilter || t.frequency === frequencyFilter;
    return matchesSearch && matchesCategory && matchesFrequency;
  });

  const calculateTotal = (lineItems) => {
    return lineItems.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Template name is required';
    if (!formData.roomType.trim()) newErrors.roomType = 'Room type is required';
    
    formData.lineItems.forEach((item, idx) => {
      if (!item.description.trim()) newErrors[`lineItem${idx}Desc`] = 'Required';
      if (!item.amount || parseFloat(item.amount) <= 0) newErrors[`lineItem${idx}Amount`] = 'Invalid';
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validateForm()) return;
    const total = calculateTotal(formData.lineItems);
    
    if (editingTemplate) {
      setTemplates(templates.map(t => t.id === editingTemplate.id ? { ...formData, id: t.id, total } : t));
    } else {
      setTemplates([...templates, { ...formData, id: Date.now(), total }]);
    }
    resetForm();
    setView('list');
  };

  const handleEdit = (template) => {
    setEditingTemplate(template);
    setFormData({ ...template });
    setView('form');
  };

  const handleDelete = (id) => {
    setTemplates(templates.filter(t => t.id !== id));
    setDeleteConfirm(null);
  };

  const resetForm = () => {
    setFormData({
      name: '', description: '', category: 'Room', frequency: 'Monthly',
      roomType: '', lineItems: [{ description: '', amount: '' }]
    });
    setEditingTemplate(null);
    setErrors({});
  };

  const updateLineItem = (idx, field, value) => {
    const newLineItems = [...formData.lineItems];
    newLineItems[idx] = { ...newLineItems[idx], [field]: value };
    setFormData({ ...formData, lineItems: newLineItems });
  };

  if (view === 'form') {
    return (
      <div className="container-fluid bg-light min-vh-100 py-4">
        <div className="container" style={{ maxWidth: '800px' }}>
          <div className="card shadow-sm">
            <div className="card-header bg-white py-3">
              <h2 className="h4 mb-0 font-weight-bold">
                {editingTemplate ? 'Edit Fee Template' : 'Create Fee Template'}
              </h2>
            </div>

            <div className="card-body p-4">
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label small font-weight-bold">Template Name *</label>
                  <input
                    type="text"
                    className={`form-control ${errors.name ? 'is-invalid' : ''}`}
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Standard Room Fee"
                  />
                  {errors.name && <div className="invalid-feedback">{errors.name}</div>}
                </div>

                <div className="col-md-6">
                  <label className="form-label small font-weight-bold">Room Type *</label>
                  <input
                    type="text"
                    className={`form-control ${errors.roomType ? 'is-invalid' : ''}`}
                    value={formData.roomType}
                    onChange={(e) => setFormData({ ...formData, roomType: e.target.value })}
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label small font-weight-bold">Category</label>
                  <select
                    className="form-select"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  >
                    <option value="Room">Room</option>
                    <option value="Mess">Mess</option>
                  </select>
                </div>

                <div className="col-md-6">
                  <label className="form-label small font-weight-bold">Frequency</label>
                  <select
                    className="form-select"
                    value={formData.frequency}
                    onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                  >
                    <option value="OneTime">One Time</option>
                    <option value="Monthly">Monthly</option>
                    <option value="Quarterly">Quarterly</option>
                    <option value="Yearly">Yearly</option>
                  </select>
                </div>

                <div className="col-12">
                  <label className="form-label small font-weight-bold">Description</label>
                  <textarea
                    className="form-control"
                    rows="2"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
              </div>

              <div className="mt-4">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h6 className="mb-0 font-weight-bold">Line Items *</h6>
                  <button 
                    onClick={() => setFormData({...formData, lineItems: [...formData.lineItems, { description: '', amount: '' }]})}
                    className="btn btn-sm btn-outline-primary d-flex align-items-center gap-1"
                  >
                    <Plus size={14} /> Add Item
                  </button>
                </div>

                {formData.lineItems.map((item, idx) => (
                  <div key={idx} className="row g-2 mb-2 align-items-start">
                    <div className="col">
                      <input
                        type="text"
                        className={`form-control form-control-sm ${errors[`lineItem${idx}Desc`] ? 'is-invalid' : ''}`}
                        placeholder="Description"
                        value={item.description}
                        onChange={(e) => updateLineItem(idx, 'description', e.target.value)}
                      />
                    </div>
                    <div className="col-3">
                      <input
                        type="number"
                        className={`form-control form-control-sm ${errors[`lineItem${idx}Amount`] ? 'is-invalid' : ''}`}
                        placeholder="Amount"
                        value={item.amount}
                        onChange={(e) => updateLineItem(idx, 'amount', e.target.value)}
                      />
                    </div>
                    {formData.lineItems.length > 1 && (
                      <div className="col-auto">
                        <button onClick={() => setFormData({...formData, lineItems: formData.lineItems.filter((_, i) => i !== idx)})} className="btn btn-sm btn-outline-danger">
                          <X size={16} />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="card-footer bg-white p-4 d-flex justify-content-between align-items-center">
              <span className="h5 mb-0 font-weight-bold">Total: ₹{calculateTotal(formData.lineItems).toLocaleString()}</span>
              <div className="d-flex gap-2">
                <button onClick={() => { resetForm(); setView('list'); }} className="btn btn-light border">Cancel</button>
                <button onClick={handleSave} className="btn btn-primary px-4">Save Template</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid bg-light min-vh-100 py-4">
      <div className="container-xl">
        <div className="card shadow-sm border-0">
          <div className="card-header bg-white py-3 border-bottom">
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
              <h1 className="h3 mb-0 font-weight-bold text-dark">Fee Templates</h1>
              <button onClick={() => setView('form')} className="action btn btn-view active">
                <Plus size={20} /> Create Fee Template
              </button>
            </div>
          </div>

          <div className="card-body p-4">
            <div className="row g-3 mb-4">
              <div className="col-md-6 col-lg-4">
                <div className="input-group">
                  <span className="input-group-text bg-white border-end-0 text-muted">
                    <Search size={18} />
                  </span>
                  <input
                    type="text"
                    className="form-control border-start-0 ps-0"
                    placeholder="Search templates..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <div className="col-6 col-md-3 col-lg-2">
                <select className="form-select" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
                  <option value="">All Categories</option>
                  <option value="Room">Room</option>
                  <option value="Mess">Mess</option>
                </select>
              </div>
              <div className="col-6 col-md-3 col-lg-2">
                <select className="form-select" value={frequencyFilter} onChange={(e) => setFrequencyFilter(e.target.value)}>
                  <option value="">All Frequencies</option>
                  <option value="OneTime">One Time</option>
                  <option value="Monthly">Monthly</option>
                </select>
              </div>
            </div>

            <div className="table-responsive">
              <table className="table table-hover align-middle">
                <thead className="table-light">
                  <tr>
                    <th className="border-0">Template Name</th>
                    <th className="border-0">Category</th>
                    <th className="border-0">Frequency</th>
                    <th className="border-0">Room Type</th>
                    <th className="border-0 text-end">Total Amount</th>
                    <th className="border-0 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTemplates.map((template) => (
                    <tr key={template.id}>
                      <td className="font-weight-bold">{template.name}</td>
                      <td>
                        <span className={`status-badge ${template.category === 'Room' ? 'badge-default' : 'badge-available'}`}>
                          {template.category}
                        </span>
                      </td>
                      <td>{template.frequency}</td>
                      <td>{template.roomType}</td>
                      <td className="text-end font-weight-bold">₹{template.total.toLocaleString()}</td>
                      <td>
                        <div className="d-flex justify-content-center gap-1">
                          <button onClick={() => setViewTemplate(template)} className="action btn btn-sm btn-view">
                     <i className="fas fa-eye"></i>
                            </button>
                          <button onClick={() => handleEdit(template)} className="action btn btn-sm btn-edit"> <i className="fas fa-edit"></i></button>
                          <button onClick={() => setDeleteConfirm(template)} className="action btn btn-sm btn-delete"><i className="fas fa-trash"></i></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredTemplates.length === 0 && (
                <div className="text-center py-5 text-muted">No fee templates found</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Manual Modal Overlay for Delete & View (Bootstrap Styled) */}
      {(deleteConfirm || viewTemplate) && (
        <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center" 
             style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
          
          {deleteConfirm && (
            <div className="card shadow" style={{ width: '100%', maxWidth: '400px' }}>
              <div className="card-body p-4 text-center">
                <h5 className="card-title mb-3">Confirm Delete</h5>
                <p className="text-muted">Are you sure you want to delete "<strong>{deleteConfirm.name}</strong>"?</p>
                <div className="d-flex justify-content-center gap-2 mt-4">
                  <button onClick={() => setDeleteConfirm(null)} className="btn btn-light border px-4">Cancel</button>
                  <button onClick={() => handleDelete(deleteConfirm.id)} className="btn btn-danger px-4">Delete</button>
                </div>
              </div>
            </div>
          )}

          {viewTemplate && (
            <div className="card shadow" style={{ width: '100%', maxWidth: '600px' }}>
              <div className="card-header bg-white d-flex justify-content-between align-items-center py-3">
                <h5 className="mb-0">{viewTemplate.name}</h5>
                <button onClick={() => setViewTemplate(null)} className="btn-close shadow-none"></button>
              </div>
              <div className="card-body p-4">
                <div className="row g-4">
                  <div className="col-12">
                    <label className="text-muted small d-block mb-1 font-weight-bold">Description</label>
                    <p>{viewTemplate.description || 'No description provided'}</p>
                  </div>
                  <div className="col-4">
                    <label className="text-muted small d-block mb-1 font-weight-bold">Category</label>
                    <p className="mb-0">{viewTemplate.category}</p>
                  </div>
                  <div className="col-4">
                    <label className="text-muted small d-block mb-1 font-weight-bold">Frequency</label>
                    <p className="mb-0">{viewTemplate.frequency}</p>
                  </div>
                  <div className="col-4">
                    <label className="text-muted small d-block mb-1 font-weight-bold">Room Type</label>
                    <p className="mb-0">{viewTemplate.roomType}</p>
                  </div>
                  <div className="col-12">
                    <label className="text-muted small d-block mb-2 font-weight-bold">Line Items</label>
                    <div className="list-group">
                      {viewTemplate.lineItems.map((item, idx) => (
                        <div key={idx} className="list-group-item d-flex justify-content-between bg-light">
                          <span>{item.description}</span>
                          <span className="font-weight-bold">₹{item.amount.toLocaleString()}</span>
                        </div>
                      ))}
                      <div className="list-group-item d-flex justify-content-between bg-primary text-white font-weight-bold">
                        <span>Total</span>
                        <span>₹{viewTemplate.total.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="d-flex justify-content-end gap-2 mt-4">
                  <button onClick={() => setViewTemplate(null)} className="btn btn-light border">Close</button>
                  <button onClick={() => { handleEdit(viewTemplate); setViewTemplate(null); }} className="btn btn-primary">Edit</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FeeTemplateAdmin;