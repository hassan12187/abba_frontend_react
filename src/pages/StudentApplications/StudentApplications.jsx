import { useState } from 'react';
import './StudentApplications.css';
import useApplicationQuery from '../../components/hooks/useApplicationQuery';
import { useCustom } from '../../Store/Store';
import Pagination from '../../components/Layout/Pagination';
import { useDebounce } from '../../components/hooks/useDebounce';

const StudentApplications = () => {
  const {token}=useCustom();
  const [applications, setApplications] = useState([]);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [inputVal,setInputVal]=useState({
    search:"",
    status:""
  });
  const [filters, setFilters] = useState({
    search: '',
    status: ''
  });
  const [currentPage, setCurrentPage] = useState(1);
  const updateFilters=useDebounce((name,value)=>{
    setFilters((prev)=>{
      return {...prev,[name]:value};
    })
  },500);
  const handleFilterChange = (e) => { 
    const { name, value } = e.target;
    setInputVal((prev)=>{
      return {...prev,[name]:value};
    });
    updateFilters(name,value);
  };
  const {data,isLoading}=useApplicationQuery(currentPage-1,filters.search,token,filters.status);
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
      total: data?.length,
      pending: data?.filter(app => app.status === 'pending').length,
      approved: data?.filter(app => app.status === 'approved').length,
      rejected: data?.filter(app => app.status === 'rejected').length
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
                value={inputVal.search}
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
                value={inputVal.status}
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
              Showing {data?.length} of {applications.length} applications
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
                  {data?.length > 0 ? (
                    data?.map((application,index) => (
                      <tr key={index} className="application-row">
                        <td className="roll-no-cell">
                          <div className="roll-no">{application.student_roll_no}</div>
                        </td>
                        <td className="name-cell">
                          <div className="student-info">
                            <div className="full-name">{application.student_name}</div>
                            <div className="student-email">{application.student_email}</div>
                          </div>
                        </td>
                        <td className="father-cell">
                          {application.father_name}
                        </td>
                        <td className="guardian-cell">
                          {application.guardian_name}
                        </td>
                        <td className="mobile-cell">
                          {application.student_cellphone}
                        </td>
                        <td className="year-cell">
                          {application.academic_year}
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
                                  onClick={() => handleApprove(application._id)}
                                  title="Approve"
                                >
                                  <i className="fas fa-check"></i>
                                </button>
                                <button
                                  className="btn btn-sm btn-reject"
                                  onClick={() => handleReject(application._id)}
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
           <Pagination currentPage={currentPage} setCurrentPage={setCurrentPage} length={data?.length} />
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
                  <h4>Application ID: <span>{selectedApplication.student_roll_no}</span></h4>
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
                      <p>{selectedApplication.student_name}</p>
                    </div>
                    <div className="detail-group">
                      <label>Father's Name</label>
                      <p>{selectedApplication.father_name}</p>
                    </div>
                    <div className="detail-group">
                      <label>CNIC</label>
                      <p>{selectedApplication.cnic_no }</p>
                    </div>
                    <div className="detail-group">
                      <label>Email</label>
                      <p>{selectedApplication.student_email}</p>
                    </div>
                    <div className="detail-group">
                      <label>Mobile</label>
                      <p>{selectedApplication.student_cellphone}</p>
                    </div>
                    <div className="detail-group full-width">
                      <label>Address</label>
                      <p>{selectedApplication.permanent_address}</p>
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
                      <p>{selectedApplication.academic_year}</p>
                    </div>
                    <div className="detail-group">
                      <label>Applied Date</label>
                      <p>{new Date(selectedApplication.application_submit_date).toLocaleDateString()}</p>
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
                      <p>{selectedApplication.room_id?.room_no || "-"}</p>
                    </div>
                    <div className="detail-group">
                      <label>Hostel Block</label>
                      <p>{selectedApplication.hostelName || "Mehran Hostel"}</p>
                    </div>
                    <div className="detail-group full-width">
                      <label>Guardian/Emergency Contact</label>
                      <p>{selectedApplication.guardian_name}</p>
                    </div>
                  </div>
                </div>

                <div className="detail-section">
                  <h5 className="section-title">
                    <i className="fas fa-comment"></i>
                    Student Remarks
                  </h5>
                  <div className="remarks">
                    {selectedApplication.remarks || "-"}
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
                    onClick={() => handleApprove(selectedApplication._id)}
                  >
                    <i className="fas fa-check"></i>
                    Approve
                  </button>
                  <button 
                    className="btn btn-danger"
                    onClick={() => handleReject(selectedApplication._id)}
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