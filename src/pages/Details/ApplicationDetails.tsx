import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './ApplicationDetails.css';

// --- Types & Interfaces ---
interface AcademicInfo {
  program: string;
  semester: string;
  cgpa: string;
  university: string;
}

interface GuardianInfo {
  name: string;
  relationship: string;
  contact: string;
  address: string;
}

interface ApplicationData {
  id: number;
  student_name: string;
  student_email: string;
  student_cellphone: string;
  student_gender: string;
  birthday_date: string;
  nationality: string;
  application_date: string;
  status: 'pending' | 'approved' | 'rejected';
  reason: string;
  documents: {
    passport: string;
    transcripts: string;
    cnic: string;
  };
  academic_info: AcademicInfo;
  guardian_info: GuardianInfo;
}

// Map for sample data lookup
const sampleApplications: Record<number, ApplicationData> = {
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
    reason: 'I require hostel accommodation due to my permanent residence being far from the campus.',
    documents: { passport: '/docs/p.pdf', transcripts: '/docs/t.pdf', cnic: '/docs/c.pdf' },
    academic_info: { program: 'Computer Science', semester: '3rd', cgpa: '3.45', university: 'University of Lahore' },
    guardian_info: { name: 'M. Khan', relationship: 'Father', contact: '0300-7654321', address: 'House #123, Lahore' }
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
    reason: 'Need accommodation for better study environment.',
    documents: { passport: '/docs/ps.pdf', transcripts: '/docs/ts.pdf', cnic: '/docs/cs.pdf' },
    academic_info: { program: 'Electrical Engineering', semester: '2nd', cgpa: '3.78', university: 'UET Lahore' },
    guardian_info: { name: 'Bilal Zafar', relationship: 'Father', contact: '0333-1234567', address: 'Flat #45, Karachi' }
  }
};

const ApplicationDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [application, setApplication] = useState<ApplicationData | null>(null);
  const [showApproveModal, setShowApproveModal] = useState<boolean>(false);
  const [showRejectModal, setShowRejectModal] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchApplication = async () => {
      setIsLoading(true);
      try {
        await new Promise(resolve => setTimeout(resolve, 800));
        // Bug fix: Convert string ID from params to number for lookup
        const numericId = Number(id);
        const appData = sampleApplications[numericId] || null;
        setApplication(appData);
      } catch (error) {
        console.error('Error fetching application:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchApplication();
  }, [id]);

  const updateStatus = (newStatus: 'approved' | 'rejected') => {
    if (application) {
      setApplication({ ...application, status: newStatus });
      newStatus === 'approved' ? setShowApproveModal(false) : setShowRejectModal(false);
      alert(`Application ${newStatus} successfully!`);
    }
  };

  const getStatusBadge = (status: ApplicationData['status']) => {
    const statusConfig = {
      pending: { label: 'Pending Review', class: 'badge-pending' },
      approved: { label: 'Approved', class: 'badge-approved' },
      rejected: { label: 'Rejected', class: 'badge-rejected' }
    };
    const config = statusConfig[status];
    return <span className={`status-badge ${config.class}`}>{config.label}</span>;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? 'N/A' : date.toLocaleDateString();
  };

  if (isLoading) return <div className="loading-container"><div className="spinner"></div><p>Loading...</p></div>;
  if (!application) return <div className="error-container"><h3>Not Found</h3><button onClick={() => navigate('/applications')}>Back</button></div>;

  return (
    <div className="application-details-page">
      <div className="container">
        <div className="page-header">
          <button className="btn btn-back" onClick={() => navigate('/applications')}>
            <i className="fas fa-arrow-left"></i> Back
          </button>
          <h1>Application Details</h1>
        </div>

        <div className="details-card">
          <div className="card-header">
            <div className="application-title">
              <h2><i className="fas fa-user-graduate"></i> {application.student_name}</h2>
              <div className="application-meta">
                <span>Application #{application.id}</span>
                {getStatusBadge(application.status)}
              </div>
            </div>
          </div>

          <div className="card-body">
            {/* Student Info */}
            <section className="details-section">
              <h3 className="section-title"><i className="fas fa-user"></i> Student Info</h3>
              <div className="details-grid">
                <div className="detail-item"><label>Email</label><p>{application.student_email}</p></div>
                <div className="detail-item"><label>DOB</label><p>{formatDate(application.birthday_date)}</p></div>
                <div className="detail-item"><label>Gender</label><p>{application.student_gender}</p></div>
              </div>
            </section>

            {/* Academic Info */}
            <section className="details-section">
              <h3 className="section-title"><i className="fas fa-graduation-cap"></i> Academic Info</h3>
              <div className="details-grid">
                <div className="detail-item"><label>Program</label><p>{application.academic_info.program}</p></div>
                <div className="detail-item"><label>CGPA</label><p>{application.academic_info.cgpa}</p></div>
              </div>
            </section>

            {/* Actions */}
            {application.status === 'pending' && (
              <div className="action-buttons">
                <button className="btn btn-approve" onClick={() => setShowApproveModal(true)}>Approve</button>
                <button className="btn btn-reject" onClick={() => setShowRejectModal(true)}>Reject</button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Approve Modal Overlay */}
      {showApproveModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Confirm Approval</h3>
            <p>Approve application for {application.student_name}?</p>
            <div className="modal-footer">
              <button onClick={() => setShowApproveModal(false)}>Cancel</button>
              <button className="btn-success" onClick={() => updateStatus('approved')}>Confirm</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApplicationDetails;