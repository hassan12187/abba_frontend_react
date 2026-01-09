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
    },
    {
      id: 4,
      name: 'Admission Fee',
      description: 'One-time admission fee',
      category: 'Room',
      frequency: 'OneTime',
      roomType: 'All',
      lineItems: [
        { description: 'Registration', amount: 1000 },
        { description: 'Security Deposit', amount: 5000 }
      ],
      total: 6000
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
      if (!item.description.trim()) {
        newErrors[`lineItem${idx}Desc`] = 'Description is required';
      }
      if (!item.amount || parseFloat(item.amount) <= 0) {
        newErrors[`lineItem${idx}Amount`] = 'Valid amount is required';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validateForm()) return;

    const total = calculateTotal(formData.lineItems);
    
    if (editingTemplate) {
      setTemplates(templates.map(t => 
        t.id === editingTemplate.id 
          ? { ...formData, id: t.id, total }
          : t
      ));
    } else {
      setTemplates([...templates, {
        ...formData,
        id: Date.now(),
        total
      }]);
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
      name: '',
      description: '',
      category: 'Room',
      frequency: 'Monthly',
      roomType: '',
      lineItems: [{ description: '', amount: '' }]
    });
    setEditingTemplate(null);
    setErrors({});
  };

  const addLineItem = () => {
    setFormData({
      ...formData,
      lineItems: [...formData.lineItems, { description: '', amount: '' }]
    });
  };

  const removeLineItem = (idx) => {
    setFormData({
      ...formData,
      lineItems: formData.lineItems.filter((_, i) => i !== idx)
    });
  };

  const updateLineItem = (idx, field, value) => {
    const newLineItems = [...formData.lineItems];
    newLineItems[idx] = { ...newLineItems[idx], [field]: value };
    setFormData({ ...formData, lineItems: newLineItems });
  };

  if (view === 'form') {
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm">
            <div className="border-b border-gray-200 px-6 py-4">
              <h2 className="text-2xl font-semibold text-gray-800">
                {editingTemplate ? 'Edit Fee Template' : 'Create Fee Template'}
              </h2>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Template Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.name ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="e.g., Standard Room Fee"
                  />
                  {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Room Type *
                  </label>
                  <input
                    type="text"
                    value={formData.roomType}
                    onChange={(e) => setFormData({ ...formData, roomType: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.roomType ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="e.g., Standard, Deluxe"
                  />
                  {errors.roomType && <p className="mt-1 text-sm text-red-600">{errors.roomType}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Room">Room</option>
                    <option value="Mess">Mess</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Frequency
                  </label>
                  <select
                    value={formData.frequency}
                    onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="OneTime">One Time</option>
                    <option value="Monthly">Monthly</option>
                    <option value="Quarterly">Quarterly</option>
                    <option value="Yearly">Yearly</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Optional description"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-3">
                  <label className="block text-sm font-medium text-gray-700">
                    Line Items *
                  </label>
                  <button
                    onClick={addLineItem}
                    className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    <Plus size={16} /> Add Item
                  </button>
                </div>

                <div className="space-y-3">
                  {formData.lineItems.map((item, idx) => (
                    <div key={idx} className="flex gap-3 items-start">
                      <div className="flex-1">
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) => updateLineItem(idx, 'description', e.target.value)}
                          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            errors[`lineItem${idx}Desc`] ? 'border-red-500' : 'border-gray-300'
                          }`}
                          placeholder="Description"
                        />
                        {errors[`lineItem${idx}Desc`] && (
                          <p className="mt-1 text-sm text-red-600">{errors[`lineItem${idx}Desc`]}</p>
                        )}
                      </div>
                      <div className="w-32">
                        <input
                          type="number"
                          value={item.amount}
                          onChange={(e) => updateLineItem(idx, 'amount', e.target.value)}
                          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            errors[`lineItem${idx}Amount`] ? 'border-red-500' : 'border-gray-300'
                          }`}
                          placeholder="Amount"
                        />
                        {errors[`lineItem${idx}Amount`] && (
                          <p className="mt-1 text-sm text-red-600">{errors[`lineItem${idx}Amount`]}</p>
                        )}
                      </div>
                      {formData.lineItems.length > 1 && (
                        <button
                          onClick={() => removeLineItem(idx)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded"
                        >
                          <X size={20} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-between items-center pt-4 border-t">
                <div className="text-lg font-semibold text-gray-800">
                  Total Amount: ₹{calculateTotal(formData.lineItems).toLocaleString()}
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      resetForm();
                      setView('list');
                    }}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Save Template
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm">
          <div className="border-b border-gray-200 px-6 py-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <h1 className="text-2xl font-semibold text-gray-800">Fee Templates</h1>
              <button
                onClick={() => setView('form')}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                <Plus size={20} />
                Create Fee Template
              </button>
            </div>
          </div>

          <div className="p-6">
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search templates..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Categories</option>
                <option value="Room">Room</option>
                <option value="Mess">Mess</option>
              </select>
              <select
                value={frequencyFilter}
                onChange={(e) => setFrequencyFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Frequencies</option>
                <option value="OneTime">One Time</option>
                <option value="Monthly">Monthly</option>
                <option value="Quarterly">Quarterly</option>
                <option value="Yearly">Yearly</option>
              </select>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Template Name</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Category</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Frequency</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Room Type</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Total Amount</th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredTemplates.map((template) => (
                    <tr key={template.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{template.name}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded ${
                          template.category === 'Room' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                        }`}>
                          {template.category}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{template.frequency}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{template.roomType}</td>
                      <td className="px-4 py-3 text-sm text-gray-900 text-right font-medium">
                        ₹{template.total.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-sm text-center">
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => setViewTemplate(template)}
                            className="p-1 text-gray-600 hover:text-blue-600"
                            title="View"
                          >
                            <Eye size={18} />
                          </button>
                          <button
                            onClick={() => handleEdit(template)}
                            className="p-1 text-gray-600 hover:text-blue-600"
                            title="Edit"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(template)}
                            className="p-1 text-gray-600 hover:text-red-600"
                            title="Delete"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredTemplates.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  No fee templates found
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Confirm Delete</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete "{deleteConfirm.name}"? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm.id)}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {viewTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-semibold text-gray-900">{viewTemplate.name}</h3>
              <button
                onClick={() => setViewTemplate(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="space-y-4">
              {viewTemplate.description && (
                <div>
                  <p className="text-sm font-medium text-gray-700">Description</p>
                  <p className="text-gray-600">{viewTemplate.description}</p>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-700">Category</p>
                  <p className="text-gray-900">{viewTemplate.category}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Frequency</p>
                  <p className="text-gray-900">{viewTemplate.frequency}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Room Type</p>
                  <p className="text-gray-900">{viewTemplate.roomType}</p>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Line Items</p>
                <div className="border border-gray-200 rounded-md overflow-hidden">
                  {viewTemplate.lineItems.map((item, idx) => (
                    <div key={idx} className="flex justify-between px-4 py-2 border-b last:border-b-0 bg-gray-50">
                      <span className="text-gray-700">{item.description}</span>
                      <span className="font-medium text-gray-900">₹{item.amount.toLocaleString()}</span>
                    </div>
                  ))}
                  <div className="flex justify-between px-4 py-3 bg-blue-50 font-semibold">
                    <span className="text-gray-900">Total</span>
                    <span className="text-blue-700">₹{viewTemplate.total.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setViewTemplate(null)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                Close
              </button>
              <button
                onClick={() => {
                  handleEdit(viewTemplate);
                  setViewTemplate(null);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Edit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FeeTemplateAdmin;