import React, { useEffect, useState,  } from 'react';
import { useDebounce } from '../../components/hooks/useDebounce';
import './Students.css';
import useStudentQuery from '../../components/hooks/useStudentQuery';
import { useCustom } from '../../Store/Store';
import Pagination from '../../components/Layout/Pagination';
import useBlockQuery from '../../components/hooks/useBlockQuery';
import { useBlockRoomsQuery } from '../../components/hooks/useRoomQuery';
import useSpecificQuery from '../../components/hooks/useSpecificQuery';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { PatchService } from '../../Services/Services';
import FilterSection from '../../components/reusable/FilterSection';
import InputField from '../../components/reusable/InputField';
import SelectField from '../../components/reusable/SelectField';

const Students = () => {
  const queryClient=useQueryClient();
  const {token}=useCustom();
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showBlocks,setShowBlocks]=useState(false);
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    room: ''
  });
  const [instantVal,setInstantVal]=useState({
    search:"",
    status:'',
    room:''
  });
  const [roomAssignment, setRoomAssignment] = useState({
    block_id: '',
    room_no: ''
  });
  const [currentPage, setCurrentPage] = useState(1);

  const {data,isLoading}=useStudentQuery(currentPage-1,filters.search,filters.status,filters.room,token);
  const {data:BlockData}=useBlockQuery(token,selectedStudent);
  const {data:roomData,isLoading:isLoadingRoomData}=useBlockRoomsQuery(roomAssignment.block_id,token);
  const {data:specificStudent,isLoading:isSpecificLoading}=useSpecificQuery(`/api/admin/student/${selectedStudent}`,selectedStudent,token);
  const mutate=useMutation({
    mutationFn:async({url,data})=>await PatchService(url,data,token),
    onSuccess:()=>{
      queryClient.invalidateQueries({queryKey:["student"]});
      setRoomAssignment({block_id:"",room_no:""});
    }
  })
  const updateFilters=useDebounce(
    (name,value)=>{
      setFilters((prev)=>{
        return {...prev,[name]:value};
      })
    },500
  );
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setInstantVal((prev)=>{
      return {...prev,[name]:value};
    })
    updateFilters(name,value);
  };

  const handleRoomAssignmentChange = (e) => {
    const { name, value } = e.target;
    if(!value)return;
    setRoomAssignment(prev => ({
      ...prev,
      [name]: value
    }));
  };
  const handleViewDetails = (student_id) => {
    setSelectedStudent(student_id);
    setShowModal(true);
  };
  const handleAssignRoom = () => {
    mutate.mutate({url:`/api/admin/student-room/${specificStudent?.data._id}`,data:{room_id:roomAssignment.room_no}});

      setShowModal(false);
  };
const removeRoom=(id)=>{
mutate.mutate({url:`/api/admin/student-room/${id}`,data:{}})
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

  const getStatusBadge = (status) => {
    const statusConfig = {
      accepted: { label: 'accepted', class: 'badge-active' },
      approved: { label: 'approved', class: 'badge-active' },
      pending: { label: 'pending', class: 'badge-pending' },
      rejected: { label: 'rejected', class: 'badge-rejected' },
      inactive: { label: 'inactive', class: 'badge-inactive' }
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
      <FilterSection heading={'Filter Students'}>
      <InputField type={'text'} label={'Search by reg no, name, or mobile...z'} id={'searchStudents'} name={'search'} className={'form-control'} value={instantVal.search} onChange={handleFilterChange} placeholder={'Search by reg no, name, or mobile...z'} />
      <SelectField label={'Status'} id={'filterStatus'} name={'status'} className={'form-control'} value={instantVal.status} onChange={handleFilterChange}>
           <option value="">All Status</option>
                <option value="approved">Approved</option>
                <option value="accepted">Accepted</option>
      </SelectField>
        <SelectField label={'Room Assignment'} id={'filterRoom'} name={'room'} className={'form-control'} value={filters.room} onChange={handleFilterChange}>
          <option value="">All Students</option>
                <option value="assigned">Room Assigned</option>
                <option value="not-assigned">No Room Assigned</option>
      </SelectField>
      </FilterSection>
      {/* <div className="filters-section">
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
                value={instantVal.search}
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
                value={instantVal.status}
                onChange={handleFilterChange}
              >
                <option value="">All Status</option>
                <option value="approved">Approved</option>
                <option value="accepted">Accepted</option>
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
      </div> */}

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
                  {data?.data?.length > 0 ? (
                    data?.data?.map((student) => (
                      <tr key={student._id} className="student-row">
                        <td className="reg-number-cell">
                          <div className="reg-number">{student.student_reg_no||"-"}</div>
                        </td>
                        <td className="name-cell">
                          <div className="student-info">
                            <div className="full-name">{student.student_name}</div>
                            <div className="student-email">{student.student_email}</div>
                          </div>
                        </td>
                        <td className="room-cell">
                          {getRoomBadge(student.room_id?.room_no, student.room_id?._id)}
                        </td>
                        <td className="mobile-cell">
                          {student.student_cellphone}
                        </td>
                        <td className="status-cell">
                          {getStatusBadge(student.status)}
                        </td>
                        <td className="date-cell">
                          {new Date(student.application_submit_date).toLocaleDateString()}
                        </td>
                        <td className="actions-cell">
                          <div className="action-buttons">
                            <button
                              className="btn btn-sm btn-view"
                              onClick={() => handleViewDetails(student._id)}
                              title="View Details"
                            >
                              <i className="fas fa-eye"></i>
                            </button>
                            {!student?.room_id && (
                              <button
                                className="btn btn-sm btn-assign"
                                onClick={() => handleViewDetails(student._id)}
                                title="Assign Room"
                              >
                                <i className="fas fa-door-open"></i>
                              </button>
                            )}
                            {
                              student?.room_id && (
                                <button className="btn btn-sm btn-reject"
                                title="Remove Room"
                                onClick={()=>removeRoom(student._id)}
                                >
                                  <i className="fa-solid fa-rotate-left"></i>
                                </button>
                              )
                            }
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
            <Pagination currentPage={currentPage} setCurrentPage={setCurrentPage} length={data?.length}  />
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
                  {getStatusBadge(specificStudent?.data?.status)}
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
                      <p>{specificStudent?.data?.student_name}</p>
                    </div>
                    <div className="detail-group">
                      <label>Father's Name</label>
                      <p>{specificStudent?.data?.father_name}</p>
                    </div>
                    <div className="detail-group">
                      <label>CNIC</label>
                      <p>{specificStudent?.data?.cnic_no}</p>
                    </div>
                    <div className="detail-group">
                      <label>Email</label>
                      <p>{specificStudent?.data?.student_email}</p>
                    </div>
                    <div className="detail-group">
                      <label>Mobile</label>
                      <p>{specificStudent?.data?.student_cellphone}</p>
                    </div>
                    <div className="detail-group full-width">
                      <label>Address</label>
                      <p>{specificStudent?.data?.postal_address}</p>
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
                      <p>{specificStudent?.data?.academic_year}</p>
                    </div>
                    <div className="detail-group">
                      <label>Registration Date</label>
                      <p>{new Date(specificStudent?.data?.application_submit_date).toLocaleDateString()}</p>
                    </div>
                    <div className="detail-group">
                      <label>Current Room</label>
                      <p className={specificStudent?.data?.room_id ? 'room-assigned' : 'room-not-assigned'}>
                        {specificStudent?.data?.room_id?.room_no||"-"}
                      </p>
                    </div>
                  </div>
                </div>
                {/* below condition we will check later */}
        {/* selectedStudent.status === 'pending' */}
                {specificStudent?.data?.room_id == null && (
                  <div className="detail-section">
                    <h5 className="section-title">
                      <i className="fas fa-door-open"></i>
                      Assign Room
                    </h5>
                    <div className="detail-row">
                      <div className="detail-group">
                        <label htmlFor="block_id">Select Hostel Block</label>
                        <select
                          id="block_id"
                          name="block_id"
                          className="form-control"
                          value={roomAssignment.block_id}
                          onChange={handleRoomAssignmentChange}
                        >
                          <option value="">Select Block</option>
                          {/* <option value={}></option> */}
                          {
                            BlockData?.data?.map(block=>(
                                 <option value={block._id} key={block._id}>Block {block.block_no}</option>
                            )
                              
                            )
                          }
                        </select>
                      </div>
                      <div className="detail-group">
                        <label htmlFor="room_no">Select Room Number</label>
                        <select
                          id="room_no"
                          name="room_no"
                          className="form-control"
                          value={roomAssignment.room_no}
                          onChange={handleRoomAssignmentChange}
                          disabled={!roomAssignment.block_id || isLoadingRoomData}
                        >
                          <option value="" defaultValue hidden>Select Room</option>
                          {roomAssignment.block_id && roomData?.length <=0 ? <option value="" aria-readonly>No Room Found</option>:null}
                          {roomAssignment.block_id && 
                            roomData?.data?.map(room => (
                              <option key={room._id} value={room._id}>{`${room.room_no} ${room.available_beds >= room.total_beds ? '(No Beds Available)' : ""}`}</option>
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
                {!specificStudent?.data?.room_id && (
                  <button 
                    className="btn btn-success"
                    onClick={handleAssignRoom}
                    disabled={!roomAssignment.block_id || !roomAssignment.room_no}
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