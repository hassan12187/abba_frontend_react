import React, { useState, useEffect } from 'react';
import './Students.css';

const Students = () => {
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    room: ''
  });
  const [roomAssignment, setRoomAssignment] = useState({
    hostelBlock: '',
    roomNumber: ''
  });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Sample initial data
  useEffect(() => {
    const sampleStudents = [
      {
        id: 1,
        regNumber: '2024-CS-001',
        fullName: 'Ali Ahmed',
        room: '101-A',
        cellphone: '0300-1234567',
        status: 'active',
        registrationDate: '2024-01-15',
        email: 'ali.ahmed@email.com',
        fatherName: 'M. Khan',
        guardian: 'Tariq Mehmood',
        academicYear: '2024-25',
        remarks: 'I require hostel accommodation due to my permanent residence being far from the campus.',
        cnic: '12345-6789012-3',
        address: 'House #123, Street 45, Lahore',
        roomAllocated: true
      },
      {
        id: 2,
        regNumber: '2024-CE-005',
        fullName: 'Sara Bilal',
        room: '201-B',
        cellphone: '0333-9876543',
        status: 'active',
        registrationDate: '2024-01-12',
        email: 'sara.bilal@email.com',
        fatherName: 'Bilal Zafar',
        guardian: 'Bilal Zafar',
        academicYear: '2024-25',
        remarks: 'Need accommodation for better study environment.',
        cnic: '23456-7890123-4',
        address: 'Flat #45, Model Town, Karachi',
        roomAllocated: true
      },
      {
        id: 3,
        regNumber: '2024-EE-012',
        fullName: 'Ahmed Raza',
        room: 'Not Assigned',
        cellphone: '0321-4567890',
        status: 'pending',
        registrationDate: '2024-01-10',
        email: 'ahmed.raza@email.com',
        fatherName: 'Raza Muhammad',
        guardian: 'Raza Muhammad',
        academicYear: '2024-25',
        remarks: 'Applying for hostel facility.',
        cnic: '34567-8901234-5',
        address: 'Street 78, Faisalabad',
        roomAllocated: false
      },
      {
        id: 4,
        regNumber: '2024-ME-008',
        fullName: 'Fatima Khan',
        room: '102-A',
        cellphone: '0345-6789012',
        status: 'active',
        registrationDate: '2024-01-08',
        email: 'fatima.khan@email.com',
        fatherName: 'Kashif Khan',
        guardian: 'Kashif Khan',
        academicYear: '2024-25',
        remarks: 'Required for academic sessions.',
        cnic: '45678-9012345-6',
        address: 'House #67, Islamabad',
        roomAllocated: true
      },
      {
        id: 5,
        regNumber: '2024-CS-015',
        fullName: 'Usman Ali',
        room: 'Not Assigned',
        cellphone: '0312-3456789',
        status: 'pending',
        registrationDate: '2024-01-05',
        email: 'usman.ali@email.com',
        fatherName: 'Ali Raza',
        guardian: 'Ali Raza',
        academicYear: '2024-25',
        remarks: 'Need hostel for better focus on studies.',
        cnic: '56789-0123456-7',
        address: 'Sector G-10, Rawalpindi',
        roomAllocated: false
      }
    ];
    setStudents(sampleStudents);
    setFilteredStudents(sampleStudents);
  }, []);

  // Available rooms data
  const availableRooms = {
    'A': ['101-A', '102-A', '103-A', '104-A', '105-A'],
    'B': ['201-B', '202-B', '203-B', '204-B', '205-B'],
    'C': ['301-C', '302-C', '303-C', '304-C', '305-C']
  };

  // Filter students when filters change
  useEffect(() => {
    let filtered = students;

    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(student => 
        student.regNumber.toLowerCase().includes(searchTerm) ||
        student.fullName.toLowerCase().includes(searchTerm) ||
        student.cellphone.includes(searchTerm)
      );
    }

    if (filters.status) {
      filtered = filtered.filter(student => student.status === filters.status);
    }

    if (filters.room) {
      if (filters.room === 'assigned') {
        filtered = filtered.filter(student => student.roomAllocated);
      } else if (filters.room === 'not-assigned') {
        filtered = filtered.filter(student => !student.roomAllocated);
      }
    }

    setFilteredStudents(filtered);
    setCurrentPage(1);
  }, [filters, students]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleRoomAssignmentChange = (e) => {
    const { name, value } = e.target;
    setRoomAssignment(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleViewDetails = (student) => {
    setSelectedStudent(student);
    setRoomAssignment({
      hostelBlock: student.roomAllocated ? student.room.split('-')[1] : '',
      roomNumber: student.roomAllocated ? student.room : ''
    });
    setShowModal(true);
  };

  const handleAssignRoom = () => {
    if (!roomAssignment.hostelBlock || !roomAssignment.roomNumber) {
      alert('Please select both hostel block and room number');
      return;
    }

    if (window.confirm(`Assign room ${roomAssignment.roomNumber} to ${selectedStudent.fullName}?`)) {
      const updatedStudents = students.map(student =>
        student.id === selectedStudent.id 
          ? { 
              ...student, 
              room: roomAssignment.roomNumber,
              roomAllocated: true,
              status: 'active'
            }
          : student
      );
      setStudents(updatedStudents);
      setShowModal(false);
      alert(`Room ${roomAssignment.roomNumber} assigned successfully to ${selectedStudent.fullName}!`);
    }
  };

  const handleReject = (studentId) => {
    if (window.confirm('Are you sure you want to reject this student?')) {
      const updatedStudents = students.map(student =>
        student.id === studentId ? { ...student, status: 'rejected' } : student
      );
      setStudents(updatedStudents);
      setShowModal(false);
      alert('Student application rejected!');
    }
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      status: '',
      room: ''
    });
  };

  // Pagination logic
  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentStudents = filteredStudents.slice(startIndex, startIndex + itemsPerPage);

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
      active: { label: 'Active', class: 'badge-active' },
      pending: { label: 'Pending', class: 'badge-pending' },
      rejected: { label: 'Rejected', class: 'badge-rejected' },
      inactive: { label: 'Inactive', class: 'badge-inactive' }
    };

    const config = statusConfig[status] || { label: status, class: 'badge-default' };
    return <span className={`status-badge ${config.class}`}>{config.label}</span>;
  };

  const getRoomBadge = (room, allocated) => {
    if (!allocated) {
      return <span className="room-badge not-assigned">Not Assigned</span>;
    }
    return <span className="room-badge assigned">{room}</span>;
  };

  const getStatusStats = () => {
    const stats = {
      total: students.length,
      active: students.filter(student => student.status === 'active').length,
      pending: students.filter(student => student.status === 'pending').length,
      assigned: students.filter(student => student.roomAllocated).length,
      notAssigned: students.filter(student => !student.roomAllocated).length
    };
    return stats;
  };

  const stats = getStatusStats();

  return (
    <div className="students-page">
      <div className="page-header">
        <h2>
          <i className="fas fa-users"></i>
          Students Management
        </h2>
        <p>Manage student records and room assignments</p>
      </div>

      {/* Statistics Cards */}
      <div className="stats-section">
        <div className="stats-grid">
          <div className="stat-card primary">
            <div className="stat-icon">
              <i className="fas fa-users"></i>
            </div>
            <div className="stat-content">
              <h3>Total Students</h3>
              <div className="stat-value">{stats.total}</div>
              <p className="stat-description">All registered students</p>
            </div>
          </div>

          <div className="stat-card success">
            <div className="stat-icon">
              <i className="fas fa-check-circle"></i>
            </div>
            <div className="stat-content">
              <h3>Active Students</h3>
              <div className="stat-value">{stats.active}</div>
              <p className="stat-description">Currently active</p>
            </div>
          </div>

          <div className="stat-card warning">
            <div className="stat-icon">
              <i className="fas fa-clock"></i>
            </div>
            <div className="stat-content">
              <h3>Pending Approval</h3>
              <div className="stat-value">{stats.pending}</div>
              <p className="stat-description">Awaiting review</p>
            </div>
          </div>

          <div className="stat-card info">
            <div className="stat-icon">
              <i className="fas fa-bed"></i>
            </div>
            <div className="stat-content">
              <h3>Rooms Assigned</h3>
              <div className="stat-value">{stats.assigned}</div>
              <p className="stat-description">{stats.notAssigned} pending</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters Section */}
      <div className="filters-section">
        <div className="section-card">
          <h4 className="section-title">
            <i className="fas fa-filter"></i>
            Filter Students
          </h4>
          
          <div className="filters-row">
            <div className="filter-group">
              <label htmlFor="searchStudents" className="form-label">Search Students</label>
              <input
                type="text"
                id="searchStudents"
                name="search"
                className="form-control"
                value={filters.search}
                onChange={handleFilterChange}
                placeholder="Search by reg no, name, or mobile..."
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
                <option value="active">Active</option>
                <option value="pending">Pending</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            <div className="filter-group">
              <label htmlFor="filterRoom" className="form-label">Room Assignment</label>
              <select
                id="filterRoom"
                name="room"
                className="form-control"
                value={filters.room}
                onChange={handleFilterChange}
              >
                <option value="">All Students</option>
                <option value="assigned">Room Assigned</option>
                <option value="not-assigned">No Room Assigned</option>
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

      {/* Students Table */}
      <div className="students-table-section">
        <div className="section-card">
          <div className="card-header-enhanced">
            <h3 className="card-title">
              <i className="fas fa-list"></i>
              Students List
            </h3>
            <div className="students-summary">
              Showing {filteredStudents.length} of {students.length} students
            </div>
          </div>

          <div className="table-container">
            <div className="table-responsive">
              <table className="students-table">
                <thead>
                  <tr>
                    <th>Reg Number</th>
                    <th>Full Name</th>
                    <th className="room-column">Room</th>
                    <th className="mobile-column">Cellphone</th>
                    <th className="status-column">Status</th>
                    <th className="date-column">Registration Date</th>
                    <th className="actions-column">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentStudents.length > 0 ? (
                    currentStudents.map((student) => (
                      <tr key={student.id} className="student-row">
                        <td className="reg-number-cell">
                          <div className="reg-number">{student.regNumber}</div>
                        </td>
                        <td className="name-cell">
                          <div className="student-info">
                            <div className="full-name">{student.fullName}</div>
                            <div className="student-email">{student.email}</div>
                          </div>
                        </td>
                        <td className="room-cell">
                          {getRoomBadge(student.room, student.roomAllocated)}
                        </td>
                        <td className="mobile-cell">
                          {student.cellphone}
                        </td>
                        <td className="status-cell">
                          {getStatusBadge(student.status)}
                        </td>
                        <td className="date-cell">
                          {new Date(student.registrationDate).toLocaleDateString()}
                        </td>
                        <td className="actions-cell">
                          <div className="action-buttons">
                            <button
                              className="btn btn-sm btn-view"
                              onClick={() => handleViewDetails(student)}
                              title="View Details"
                            >
                              <i className="fas fa-eye"></i>
                            </button>
                            {student.status === 'pending' && (
                              <button
                                className="btn btn-sm btn-assign"
                                onClick={() => handleViewDetails(student)}
                                title="Assign Room"
                              >
                                <i className="fas fa-door-open"></i>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" className="no-data">
                        <i className="fas fa-users"></i>
                        No students found
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

      {/* Student Details Modal */}
      {showModal && selectedStudent && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">
                <i className="fas fa-user-graduate"></i>
                Student Details
              </h3>
              <button 
                className="modal-close" 
                onClick={() => setShowModal(false)}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>

            <div className="modal-body">
              <div className="student-header">
                <div className="student-id">
                  <h4>Registration No: <span>{selectedStudent.regNumber}</span></h4>
                </div>
                <div className="student-status">
                  {getStatusBadge(selectedStudent.status)}
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
                      <p>{selectedStudent.fullName}</p>
                    </div>
                    <div className="detail-group">
                      <label>Father's Name</label>
                      <p>{selectedStudent.fatherName}</p>
                    </div>
                    <div className="detail-group">
                      <label>CNIC</label>
                      <p>{selectedStudent.cnic}</p>
                    </div>
                    <div className="detail-group">
                      <label>Email</label>
                      <p>{selectedStudent.email}</p>
                    </div>
                    <div className="detail-group">
                      <label>Mobile</label>
                      <p>{selectedStudent.cellphone}</p>
                    </div>
                    <div className="detail-group full-width">
                      <label>Address</label>
                      <p>{selectedStudent.address}</p>
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
                      <p>{selectedStudent.academicYear}</p>
                    </div>
                    <div className="detail-group">
                      <label>Registration Date</label>
                      <p>{new Date(selectedStudent.registrationDate).toLocaleDateString()}</p>
                    </div>
                    <div className="detail-group">
                      <label>Current Room</label>
                      <p className={selectedStudent.roomAllocated ? 'room-assigned' : 'room-not-assigned'}>
                        {selectedStudent.room}
                      </p>
                    </div>
                  </div>
                </div>

                {selectedStudent.status === 'pending' && (
                  <div className="detail-section">
                    <h5 className="section-title">
                      <i className="fas fa-door-open"></i>
                      Assign Room
                    </h5>
                    <div className="detail-row">
                      <div className="detail-group">
                        <label htmlFor="hostelBlockSelect">Select Hostel Block</label>
                        <select
                          id="hostelBlockSelect"
                          name="hostelBlock"
                          className="form-control"
                          value={roomAssignment.hostelBlock}
                          onChange={handleRoomAssignmentChange}
                        >
                          <option value="">Select Block</option>
                          <option value="A">Block A</option>
                          <option value="B">Block B</option>
                          <option value="C">Block C</option>
                        </select>
                      </div>
                      <div className="detail-group">
                        <label htmlFor="roomNumberSelect">Select Room Number</label>
                        <select
                          id="roomNumberSelect"
                          name="roomNumber"
                          className="form-control"
                          value={roomAssignment.roomNumber}
                          onChange={handleRoomAssignmentChange}
                          disabled={!roomAssignment.hostelBlock}
                        >
                          <option value="">Select Room</option>
                          {roomAssignment.hostelBlock && 
                            availableRooms[roomAssignment.hostelBlock].map(room => (
                              <option key={room} value={room}>{room}</option>
                            ))
                          }
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                <div className="detail-section">
                  <h5 className="section-title">
                    <i className="fas fa-comment"></i>
                    Student Remarks
                  </h5>
                  <div className="remarks">
                    {selectedStudent.remarks}
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
              <div className="action-buttons">
                {selectedStudent.status === 'pending' && (
                  <button 
                    className="btn btn-success"
                    onClick={handleAssignRoom}
                    disabled={!roomAssignment.hostelBlock || !roomAssignment.roomNumber}
                  >
                    <i className="fas fa-door-open"></i>
                    Assign Room & Approve
                  </button>
                )}
                {selectedStudent.status === 'pending' && (
                  <button 
                    className="btn btn-danger"
                    onClick={() => handleReject(selectedStudent.id)}
                  >
                    <i className="fas fa-times"></i>
                    Reject
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Students;