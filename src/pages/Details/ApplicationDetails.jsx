import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './ApplicationDetails.css';

const ApplicationDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [application, setApplication] = useState(null);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Sample application data - in real app, this would come from API
  const sampleApplications = {
    1: {
      id: 1,
      student_name: 'Ali Ahmed',
      student_email: 'ali.ahmed@email.com',
      student_cellphone: '0300-1234567',
      student_gender: 'Male',
      birthday_date: '2000-05-15',
      nationality: 'Pakistani',
      application_date: '2024-01-15',
      status: 'pending',
      reason: 'I require hostel accommodation due to my permanent residence being far from the campus. The distance makes it difficult to commute daily and affects my study schedule.',
      documents: {
        passport: '/documents/passport.pdf',
        transcripts: '/documents/transcripts.pdf',
        cnic: '/documents/cnic.pdf'
      },
      academic_info: {
        program: 'Computer Science',
        semester: '3rd',
        cgpa: '3.45',
        university: 'University of Lahore'
      },
      guardian_info: {
        name: 'M. Khan',
        relationship: 'Father',
        contact: '0300-7654321',
        address: 'House #123, Street 45, Lahore'
      }
    },
    2: {
      id: 2,
      student_name: 'Sara Bilal',
      student_email: 'sara.bilal@email.com',
      student_cellphone: '0333-9876543',
      student_gender: 'Female',
      birthday_date: '2001-08-22',
      nationality: 'Pakistani',
      application_date: '2024-01-12',
      status: 'approved',
      reason: 'Need accommodation for better study environment and to focus on my academic goals.',
      documents: {
        passport: '/documents/passport_sara.pdf',
        transcripts: '/documents/transcripts_sara.pdf',
        cnic: '/documents/cnic_sara.pdf'
      },
      academic_info: {
        program: 'Electrical Engineering',
        semester: '2nd',
        cgpa: '3.78',
        university: 'UET Lahore'
      },
      guardian_info: {
        name: 'Bilal Zafar',
        relationship: 'Father',
        contact: '0333-1234567',
        address: 'Flat #45, Model Town, Karachi'
      }
    }
  };

  useEffect(() => {
    // Simulate API call
    const fetchApplication = async () => {
      setIsLoading(true);
      try {
        await new Promise(resolve => setTimeout(resolve, 1000));
        const appData = sampleApplications[id] || sampleApplications[1];
        setApplication(appData);
      } catch (error) {
        console.error('Error fetching application:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchApplication();
  }, [id]);

  const handleApprove = () => {
    if (application) {
      const updatedApplication = { ...application, status: 'approved' };
      setApplication(updatedApplication);
      setShowApproveModal(false);
      alert('Application approved successfully!');
    }
  };

  const handleReject = () => {
    if (application) {
      const updatedApplication = { ...application, status: 'rejected' };
      setApplication(updatedApplication);
      setShowRejectModal(false);
      alert('Application has been rejected.');
    }
  };

  const handleBack = () => {
    navigate('/applications');
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { label: 'Pending Review', class: 'badge-pending' },
      approved: { label: 'Approved', class: 'badge-approved' },
      rejected: { label: 'Rejected', class: 'badge-rejected' }
    };

    const config = statusConfig[status] || { label: status, class: 'badge-default' };
    return <span className={`status-badge ${config.class}`}>{config.label}</span>;
  };

  const handleDocumentView = (documentType) => {
    // In real app, this would open the document
    alert(`Opening ${documentType} document...`);
  };

  if (isLoading) {
    return (
      <div className="application-details-page">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading application details...</p>
        </div>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="application-details-page">
        <div className="error-container">
          <i className="fas fa-exclamation-triangle"></i>
          <h3>Application Not Found</h3>
          <p>The requested application could not be found.</p>
          <button className="btn btn-primary" onClick={handleBack}>
            Back to Applications
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="application-details-page">
      <div className="container">
        {/* Header */}
        <div className="page-header">
          <button className="btn btn-back" onClick={handleBack}>
            <i className="fas fa-arrow-left"></i>
            Back to Applications
          </button>
          <h1>Application Details</h1>
          <p>Review and manage student hostel application</p>
        </div>

        {/* Main Card */}
        <div className="details-card">
          {/* Application Header */}
          <div className="card-header">
            <div className="application-title">
              <h2>
                <i className="fas fa-user-graduate"></i>
                {application.student_name}
              </h2>
              <div className="application-meta">
                <span className="application-id">Application #{application.id}</span>
                {getStatusBadge(application.status)}
              </div>
            </div>
          </div>

          <div className="card-body">
            {/* Student Information Section */}
            <div className="details-section">
              <h3 className="section-title">
                <i className="fas fa-user"></i>
                Student Information
              </h3>
              <div className="details-grid">
                <div className="detail-item">
                  <label>Full Name</label>
                  <p>{application.student_name}</p>
                </div>
                <div className="detail-item">
                  <label>Email Address</label>
                  <p>{application.student_email}</p>
                </div>
                <div className="detail-item">
                  <label>Phone Number</label>
                  <p>{application.student_cellphone}</p>
                </div>
                <div className="detail-item">
                  <label>Gender</label>
                  <p>{application.student_gender}</p>
                </div>
                <div className="detail-item">
                  <label>Date of Birth</label>
                  <p>{new Date(application.birthday_date).toLocaleDateString()}</p>
                </div>
                <div className="detail-item">
                  <label>Nationality</label>
                  <p>{application.nationality}</p>
                </div>
              </div>
            </div>

            {/* Academic Information */}
            <div className="details-section">
              <h3 className="section-title">
                <i className="fas fa-graduation-cap"></i>
                Academic Information
              </h3>
              <div className="details-grid">
                <div className="detail-item">
                  <label>Program</label>
                  <p>{application.academic_info.program}</p>
                </div>
                <div className="detail-item">
                  <label>Semester</label>
                  <p>{application.academic_info.semester}</p>
                </div>
                <div className="detail-item">
                  <label>CGPA</label>
                  <p>{application.academic_info.cgpa}</p>
                </div>
                <div className="detail-item">
                  <label>University</label>
                  <p>{application.academic_info.university}</p>
                </div>
              </div>
            </div>

            {/* Guardian Information */}
            <div className="details-section">
              <h3 className="section-title">
                <i className="fas fa-users"></i>
                Guardian Information
              </h3>
              <div className="details-grid">
                <div className="detail-item">
                  <label>Guardian Name</label>
                  <p>{application.guardian_info.name}</p>
                </div>
                <div className="detail-item">
                  <label>Relationship</label>
                  <p>{application.guardian_info.relationship}</p>
                </div>
                <div className="detail-item">
                  <label>Contact Number</label>
                  <p>{application.guardian_info.contact}</p>
                </div>
                <div className="detail-item full-width">
                  <label>Address</label>
                  <p>{application.guardian_info.address}</p>
                </div>
              </div>
            </div>

            {/* Application Information */}
            <div className="details-section">
              <h3 className="section-title">
                <i className="fas fa-file-alt"></i>
                Application Information
              </h3>
              <div className="details-grid">
                <div className="detail-item">
                  <label>Application Date</label>
                  <p>{new Date(application.application_date).toLocaleDateString()}</p>
                </div>
                <div className="detail-item">
                  <label>Application Status</label>
                  <div>{getStatusBadge(application.status)}</div>
                </div>
                <div className="detail-item full-width">
                  <label>Reason for Applying</label>
                  <div className="reason-text">
                    {application.reason}
                  </div>
                </div>
              </div>
            </div>

            {/* Documents Section */}
            <div className="details-section">
              <h3 className="section-title">
                <i className="fas fa-file-upload"></i>
                Documents Submitted
              </h3>
              <div className="documents-grid">
                <div className="document-item">
                  <div className="document-icon">
                    <i className="fas fa-passport"></i>
                  </div>
                  <div className="document-info">
                    <h4>Passport/CNIC</h4>
                    <p>Identity verification document</p>
                  </div>
                  <button 
                    className="btn btn-outline-primary"
                    onClick={() => handleDocumentView('Passport/CNIC')}
                  >
                    <i className="fas fa-eye"></i>
                    View
                  </button>
                </div>

                <div className="document-item">
                  <div className="document-icon">
                    <i className="fas fa-file-certificate"></i>
                  </div>
                  <div className="document-info">
                    <h4>Academic Transcripts</h4>
                    <p>Academic performance records</p>
                  </div>
                  <button 
                    className="btn btn-outline-primary"
                    onClick={() => handleDocumentView('Academic Transcripts')}
                  >
                    <i className="fas fa-eye"></i>
                    View
                  </button>
                </div>

                <div className="document-item">
                  <div className="document-icon">
                    <i className="fas fa-university"></i>
                  </div>
                  <div className="document-info">
                    <h4>Admission Letter</h4>
                    <p>University admission confirmation</p>
                  </div>
                  <button 
                    className="btn btn-outline-primary"
                    onClick={() => handleDocumentView('Admission Letter')}
                  >
                    <i className="fas fa-eye"></i>
                    View
                  </button>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            {application.status === 'pending' && (
              <div className="action-section">
                <h3 className="section-title">
                  <i className="fas fa-tasks"></i>
                  Application Actions
                </h3>
                <div className="action-buttons">
                  <button 
                    className="btn btn-approve"
                    onClick={() => setShowApproveModal(true)}
                  >
                    <i className="fas fa-check-circle"></i>
                    Approve Application
                  </button>
                  <button 
                    className="btn btn-reject"
                    onClick={() => setShowRejectModal(true)}
                  >
                    <i className="fas fa-times-circle"></i>
                    Reject Application
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Approve Modal */}
      {showApproveModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>
                <i className="fas fa-check-circle"></i>
                Confirm Approval
              </h3>
              <button 
                className="modal-close"
                onClick={() => setShowApproveModal(false)}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="modal-body">
              <div className="confirmation-message">
                <i className="fas fa-question-circle"></i>
                <p>Are you sure you want to approve this application?</p>
                <div className="application-preview">
                  <strong>{application.student_name}</strong> - {application.academic_info.program}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button 
                className="btn btn-secondary"
                onClick={() => setShowApproveModal(false)}
              >
                Cancel
              </button>
              <button 
                className="btn btn-success"
                onClick={handleApprove}
              >
                <i className="fas fa-check"></i>
                Yes, Approve
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>
                <i className="fas fa-times-circle"></i>
                Confirm Rejection
              </h3>
              <button 
                className="modal-close"
                onClick={() => setShowRejectModal(false)}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="modal-body">
              <div className="confirmation-message">
                <i className="fas fa-exclamation-triangle"></i>
                <p>Are you sure you want to reject this application?</p>
                <div className="application-preview">
                  <strong>{application.student_name}</strong> - {application.academic_info.program}
                </div>
                <small className="text-muted">
                  This action cannot be undone.
                </small>
              </div>
            </div>
            <div className="modal-footer">
              <button 
                className="btn btn-secondary"
                onClick={() => setShowRejectModal(false)}
              >
                Cancel
              </button>
              <button 
                className="btn btn-danger"
                onClick={handleReject}
              >
                <i className="fas fa-times"></i>
                Yes, Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApplicationDetails;