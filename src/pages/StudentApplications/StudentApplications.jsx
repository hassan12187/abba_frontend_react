import React, { useState, useEffect } from 'react';
import './StudentApplications.css';

const StudentApplications = () => {
  const [applications, setApplications] = useState([]);
  const [filteredApplications, setFilteredApplications] = useState([]);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    status: ''
  });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Sample initial data
  useEffect(() => {
    const sampleApplications = [
      {
        id: 1,
        rollNo: '2024-CS-001',
        fullName: 'Ali Ahmed',
        fatherName: 'M. Khan',
        guardian: 'Tariq Mehmood',
        mobile: '0300-1234567',
        academicYear: '2024-25',
        status: 'pending',
        roomType: 'Double Occupancy',
        hostelName: 'Block A (New Block)',
        remarks: 'I require hostel accommodation due to my permanent residence being far from the campus.',
        email: 'ali.ahmed@email.com',
        cnic: '12345-6789012-3',
        address: 'House #123, Street 45, Lahore',
        appliedDate: '2024-01-15'
      },
      {
        id: 2,
        rollNo: '2024-CE-005',
        fullName: 'Sara Bilal',
        fatherName: 'Bilal Zafar',
        guardian: 'Bilal Zafar',
        mobile: '0333-9876543',
        academicYear: '2024-25',
        status: 'approved',
        roomType: 'Single Occupancy',
        hostelName: 'Girls Hostel B',
        remarks: 'Need accommodation for better study environment.',
        email: 'sara.bilal@email.com',
        cnic: '23456-7890123-4',
        address: 'Flat #45, Model Town, Karachi',
        appliedDate: '2024-01-12'
      },
      {
        id: 3,
        rollNo: '2024-EE-012',
        fullName: 'Ahmed Raza',
        fatherName: 'Raza Muhammad',
        guardian: 'Raza Muhammad',
        mobile: '0321-4567890',
        academicYear: '2024-25',
        status: 'rejected',
        roomType: 'Double Occupancy',
        hostelName: 'Block C',
        remarks: 'Applying for hostel facility.',
        email: 'ahmed.raza@email.com',
        cnic: '34567-8901234-5',
        address: 'Street 78, Faisalabad',
        appliedDate: '2024-01-10'
      },
      {
        id: 4,
        rollNo: '2024-ME-008',
        fullName: 'Fatima Khan',
        fatherName: 'Kashif Khan',
        guardian: 'Kashif Khan',
        mobile: '0345-6789012',
        academicYear: '2024-25',
        status: 'pending',
        roomType: 'Single Occupancy',
        hostelName: 'Girls Hostel A',
        remarks: 'Required for academic sessions.',
        email: 'fatima.khan@email.com',
        cnic: '45678-9012345-6',
        address: 'House #67, Islamabad',
        appliedDate: '2024-01-08'
      },
      {
        id: 5,
        rollNo: '2024-CS-015',
        fullName: 'Usman Ali',
        fatherName: 'Ali Raza',
        guardian: 'Ali Raza',
        mobile: '0312-3456789',
        academicYear: '2024-25',
        status: 'pending',
        roomType: 'Triple Occupancy',
        hostelName: 'Block B',
        remarks: 'Need hostel for better focus on studies.',
        email: 'usman.ali@email.com',
        cnic: '56789-0123456-7',
        address: 'Sector G-10, Rawalpindi',
        appliedDate: '2024-01-05'
      }
    ];
    setApplications(sampleApplications);
    setFilteredApplications(sampleApplications);
  }, []);

  // Filter applications when filters change
  useEffect(() => {
    let filtered = applications;

    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(app => 
        app.rollNo.toLowerCase().includes(searchTerm) ||
        app.fullName.toLowerCase().includes(searchTerm) ||
        app.fatherName.toLowerCase().includes(searchTerm) ||
        app.mobile.includes(searchTerm)
      );
    }

    if (filters.status) {
      filtered = filtered.filter(app => app.status === filters.status);
    }

    setFilteredApplications(filtered);
    setCurrentPage(1);
  }, [filters, applications]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleViewDetails = (application) => {
    setSelectedApplication(application);
    setShowModal(true);
  };

  const handleApprove = (applicationId) => {
    if (window.confirm('Are you sure you want to approve this application?')) {
      const updatedApplications = applications.map(app =>
        app.id === applicationId ? { ...app, status: 'approved' } : app
      );
      setApplications(updatedApplications);
      setShowModal(false);
      alert('Application approved successfully!');
    }
  };

  const handleReject = (applicationId) => {
    if (window.confirm('Are you sure you want to reject this application?')) {
      const updatedApplications = applications.map(app =>
        app.id === applicationId ? { ...app, status: 'rejected' } : app
      );
      setApplications(updatedApplications);
      setShowModal(false);
      alert('Application rejected!');
    }
  };

  const exportToExcel = () => {
    // In a real app, implement Excel export using SheetJS
    alert('Excel export functionality would be implemented here');
    console.log('Exporting applications to Excel...');
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      status: ''
    });
  };

  // Pagination logic
  const totalPages = Math.ceil(filteredApplications.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentApplications = filteredApplications.slice(startIndex, startIndex + itemsPerPage);

  const goToPage = (page) => {
    setCurrentPage(page);
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { label: 'Pending', class: 'badge-pending' },
      approved: { label: 'Approved', class: 'badge-approved' },
      rejected: { label: 'Rejected', class: 'badge-rejected' }
    };

    const config = statusConfig[status] || { label: status, class: 'badge-default' };
    return <span className={`status-badge ${config.class}`}>{config.label}</span>;
  };

  const getStatusStats = () => {
    const stats = {
      total: applications.length,
      pending: applications.filter(app => app.status === 'pending').length,
      approved: applications.filter(app => app.status === 'approved').length,
      rejected: applications.filter(app => app.status === 'rejected').length
    };
    return stats;
  };

  const stats = getStatusStats();

  return (
    <div className="student-applications-page">
      <div className="page-header">
        <h2>
          <i className="fas fa-file-alt"></i>
          Student Applications
        </h2>
        <p>Manage and review student hostel applications</p>
      </div>

      {/* Statistics Cards */}
      <div className="stats-section">
        <div className="stats-grid">
          <div className="stat-card primary">
            <div className="stat-icon">
              <i className="fas fa-file-alt"></i>
            </div>
            <div className="stat-content">
              <h3>Total Applications</h3>
              <div className="stat-value">{stats.total}</div>
              <p className="stat-description">All applications</p>
            </div>
          </div>

          <div className="stat-card warning">
            <div className="stat-icon">
              <i className="fas fa-clock"></i>
            </div>
            <div className="stat-content">
              <h3>Pending Review</h3>
              <div className="stat-value">{stats.pending}</div>
              <p className="stat-description">Awaiting decision</p>
            </div>
          </div>

          <div className="stat-card success">
            <div className="stat-icon">
              <i className="fas fa-check-circle"></i>
            </div>
            <div className="stat-content">
              <h3>Approved</h3>
              <div className="stat-value">{stats.approved}</div>
              <p className="stat-description">Applications approved</p>
            </div>
          </div>

          <div className="stat-card danger">
            <div className="stat-icon">
              <i className="fas fa-times-circle"></i>
            </div>
            <div className="stat-content">
              <h3>Rejected</h3>
              <div className="stat-value">{stats.rejected}</div>
              <p className="stat-description">Applications rejected</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Actions */}
      <div className="filters-section">
        <div className="section-card">
          <div className="filters-header">
            <h4 className="section-title">
              <i className="fas fa-filter"></i>
              Filter Applications
            </h4>
            <div className="actions">
              <button className="btn btn-success" onClick={exportToExcel}>
                <i className="fas fa-file-excel"></i>
                Export to Excel
              </button>
            </div>
          </div>
          
          <div className="filters-row">
            <div className="filter-group">
              <label htmlFor="searchApplications" className="form-label">Search Applications</label>
              <input
                type="text"
                id="searchApplications"
                name="search"
                className="form-control"
                value={filters.search}
                onChange={handleFilterChange}
                placeholder="Search by roll no, name, or mobile..."
              />
            </div>

            <div className="filter-group">
              <label htmlFor="filterStatus" className="form-label">Status</label>
              <select
                id="filterStatus"
                name="status"
                className="form-control"
                value={filters.status}
                onChange={handleFilterChange}
              >
                <option value="">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            <div className="filter-group">
              <label className="form-label invisible">Actions</label>
              <button className="btn btn-outline-secondary w-100" onClick={clearFilters}>
                <i className="fas fa-times"></i>
                Clear Filters
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Applications Table */}
      <div className="applications-table-section">
        <div className="section-card">
          <div className="card-header-enhanced">
            <h3 className="card-title">
              <i className="fas fa-list"></i>
              Applications List
            </h3>
            <div className="applications-summary">
              Showing {filteredApplications.length} of {applications.length} applications
            </div>
          </div>

          <div className="table-container">
            <div className="table-responsive">
              <table className="applications-table">
                <thead>
                  <tr>
                    <th>Roll No</th>
                    <th>Full Name</th>
                    <th className="father-column">Father's Name</th>
                    <th className="guardian-column">Guardian</th>
                    <th className="mobile-column">Mobile</th>
                    <th className="year-column">Year</th>
                    <th className="status-column">Status</th>
                    <th className="actions-column">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentApplications.length > 0 ? (
                    currentApplications.map((application) => (
                      <tr key={application.id} className="application-row">
                        <td className="roll-no-cell">
                          <div className="roll-no">{application.rollNo}</div>
                        </td>
                        <td className="name-cell">
                          <div className="student-info">
                            <div className="full-name">{application.fullName}</div>
                            <div className="student-email">{application.email}</div>
                          </div>
                        </td>
                        <td className="father-cell">
                          {application.fatherName}
                        </td>
                        <td className="guardian-cell">
                          {application.guardian}
                        </td>
                        <td className="mobile-cell">
                          {application.mobile}
                        </td>
                        <td className="year-cell">
                          {application.academicYear}
                        </td>
                        <td className="status-cell">
                          {getStatusBadge(application.status)}
                        </td>
                        <td className="actions-cell">
                          <div className="action-buttons">
                            <button
                              className="btn btn-sm btn-view"
                              onClick={() => handleViewDetails(application)}
                              title="View Details"
                            >
                              <i className="fas fa-eye"></i>
                            </button>
                            {application.status === 'pending' && (
                              <>
                                <button
                                  className="btn btn-sm btn-approve"
                                  onClick={() => handleApprove(application.id)}
                                  title="Approve"
                                >
                                  <i className="fas fa-check"></i>
                                </button>
                                <button
                                  className="btn btn-sm btn-reject"
                                  onClick={() => handleReject(application.id)}
                                  title="Reject"
                                >
                                  <i className="fas fa-times"></i>
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="8" className="no-data">
                        <i className="fas fa-file-alt"></i>
                        No applications found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
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
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
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
                    disabled={currentPage === totalPages}
                  >
                    Next
                    <i className="fas fa-chevron-right"></i>
                  </button>
                </nav>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Application Details Modal */}
      {showModal && selectedApplication && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">
                <i className="fas fa-user-graduate"></i>
                Student Application Details
              </h3>
              <button 
                className="modal-close" 
                onClick={() => setShowModal(false)}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>

            <div className="modal-body">
              <div className="application-header">
                <div className="application-id">
                  <h4>Application ID: <span>{selectedApplication.rollNo}</span></h4>
                </div>
                <div className="application-status">
                  {getStatusBadge(selectedApplication.status)}
                </div>
              </div>

              <div className="details-grid">
                <div className="detail-section">
                  <h5 className="section-title">
                    <i className="fas fa-user"></i>
                    Personal Information
                  </h5>
                  <div className="detail-row">
                    <div className="detail-group">
                      <label>Full Name</label>
                      <p>{selectedApplication.fullName}</p>
                    </div>
                    <div className="detail-group">
                      <label>Father's Name</label>
                      <p>{selectedApplication.fatherName}</p>
                    </div>
                    <div className="detail-group">
                      <label>CNIC</label>
                      <p>{selectedApplication.cnic}</p>
                    </div>
                    <div className="detail-group">
                      <label>Email</label>
                      <p>{selectedApplication.email}</p>
                    </div>
                    <div className="detail-group">
                      <label>Mobile</label>
                      <p>{selectedApplication.mobile}</p>
                    </div>
                    <div className="detail-group full-width">
                      <label>Address</label>
                      <p>{selectedApplication.address}</p>
                    </div>
                  </div>
                </div>

                <div className="detail-section">
                  <h5 className="section-title">
                    <i className="fas fa-graduation-cap"></i>
                    Academic Information
                  </h5>
                  <div className="detail-row">
                    <div className="detail-group">
                      <label>Academic Year</label>
                      <p>{selectedApplication.academicYear}</p>
                    </div>
                    <div className="detail-group">
                      <label>Applied Date</label>
                      <p>{new Date(selectedApplication.appliedDate).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>

                <div className="detail-section">
                  <h5 className="section-title">
                    <i className="fas fa-home"></i>
                    Hostel Preferences
                  </h5>
                  <div className="detail-row">
                    <div className="detail-group">
                      <label>Preferred Room Type</label>
                      <p>{selectedApplication.roomType}</p>
                    </div>
                    <div className="detail-group">
                      <label>Hostel Block</label>
                      <p>{selectedApplication.hostelName}</p>
                    </div>
                    <div className="detail-group full-width">
                      <label>Guardian/Emergency Contact</label>
                      <p>{selectedApplication.guardian}</p>
                    </div>
                  </div>
                </div>

                <div className="detail-section">
                  <h5 className="section-title">
                    <i className="fas fa-comment"></i>
                    Student Remarks
                  </h5>
                  <div className="remarks">
                    {selectedApplication.remarks}
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button 
                className="btn btn-secondary" 
                onClick={() => setShowModal(false)}
              >
                Close
              </button>
              {selectedApplication.status === 'pending' && (
                <div className="action-buttons">
                  <button 
                    className="btn btn-success"
                    onClick={() => handleApprove(selectedApplication.id)}
                  >
                    <i className="fas fa-check"></i>
                    Approve
                  </button>
                  <button 
                    className="btn btn-danger"
                    onClick={() => handleReject(selectedApplication.id)}
                  >
                    <i className="fas fa-times"></i>
                    Reject
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentApplications;