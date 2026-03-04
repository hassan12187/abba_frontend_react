import React, { useState, type ChangeEvent } from 'react';
import { useDebounce } from '../../components/hooks/useDebounce';
import './Students.css';
import useStudentQuery from '../../components/hooks/useStudentQuery';
import { useCustom } from '../../Store/Store';
import Pagination from '../../components/Layout/Pagination';
import useCustomQuery from '../../components/hooks/useCustomQuery';
import { useBlockRoomsQuery } from '../../components/hooks/useRoomQuery';
import useSpecificQuery from '../../components/hooks/useSpecificQuery';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { PatchService } from '../../Services/Services';
import FilterSection from '../../components/reusable/FilterSection';
import InputField from '../../components/reusable/InputField';
import SelectField from '../../components/reusable/SelectField';
interface Room {
  _id: string;
  room_no: string;
  total_beds: number;
  available_beds: number;
}

interface Block {
  _id: string;
  block_no: string;
}

interface Student {
  _id: string;
  student_reg_no?: string;
  student_name: string;
  student_email: string;
  student_cellphone: string;
  father_name: string;
  cnic_no: string;
  postal_address: string;
  academic_year: string;
  application_submit_date: string;
  status: 'accepted' | 'approved' | 'pending' | 'rejected' | 'inactive';
  room_id?: Room;
  remarks?: string;
}

interface StudentStats {
  total: number;
  active: number;
  pending: number;
  assigned: number;
  notAssigned: number;
}
const Students: React.FC = () => {
  const queryClient = useQueryClient();
  const { token } = useCustom() as { token: string };

  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const [showModal, setShowModal] = useState<boolean>(false);
  
  const [filters, setFilters] = useState({ search: '', status: '', room: '' });
  const [instantVal, setInstantVal] = useState({ search: "", status: '', room: '' });
  const [roomAssignment, setRoomAssignment] = useState({ block_id: '', room_no: '' });
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Queries
  const { data, isLoading } = useStudentQuery(currentPage - 1, filters.search, filters.status, filters.room, token);
  const { data: blockData } = useCustomQuery('/api/admin/block',token, selectedStudent,"blocks");
  const { data: roomData, isLoading: isLoadingRoomData } = useBlockRoomsQuery(roomAssignment.block_id, token);
  
  const { data: specificStudent } = useCustomQuery(
    selectedStudent ? `/api/admin/student/${selectedStudent}`:"",
    token,
    "student_id",
    selectedStudent
  );

  // Mutation
  const mutate = useMutation({
    mutationFn: async ({ url, data }: { url: string; data: any }) => await PatchService(url, data, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["student"] });
      setRoomAssignment({ block_id: "", room_no: "" });
    }
  });

  const updateFilters = useDebounce((name: string, value: string) => {
    setFilters((prev) => ({ ...prev, [name]: value }));
  }, 500);

  const handleFilterChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setInstantVal((prev) => ({ ...prev, [name]: value }));
    updateFilters(name, value);
  };

  const handleRoomAssignmentChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setRoomAssignment(prev => ({ ...prev, [name]: value }));
  };

  const handleViewDetails = (student_id: string) => {
    setSelectedStudent(student_id);
    setShowModal(true);
  };

  const handleAssignRoom = () => {
    if (specificStudent?.data?._id) {
      mutate.mutate({
        url: `/api/admin/student-room/${specificStudent.data._id}`,
        data: { room_id: roomAssignment.room_no }
      });
      setShowModal(false);
    }
  };

  const removeRoom = (id: string) => {
    mutate.mutate({ url: `/api/admin/student-room/${id}`, data: {} });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string, class: string }> = {
      accepted: { label: 'accepted', class: 'badge-active' },
      approved: { label: 'approved', class: 'badge-active' },
      pending: { label: 'pending', class: 'badge-pending' },
      rejected: { label: 'rejected', class: 'badge-rejected' },
      inactive: { label: 'inactive', class: 'badge-inactive' }
    };
    const config = statusConfig[status] || { label: status, class: 'badge-default' };
    return <span className={`status-badge ${config.class}`}>{config.label}</span>;
  };

  // Helper for UI badges
  const getRoomBadge = (roomNo?: string, roomId?: string) => {
    if (!roomId) return <span className="room-badge not-assigned">Not Assigned</span>;
    return <span className="room-badge assigned">{roomNo}</span>;
  };

  return (
    <div className="students-page">
      <div className="page-header">
        <h2><i className="fas fa-users"></i> Students Management</h2>
      </div>

      <FilterSection heading={'Filter Students'}>
        <InputField name='search' value={instantVal.search} onChange={handleFilterChange} placeholder='Search...' />
        <SelectField name='status' value={instantVal.status} onChange={handleFilterChange}>
          <option value="">All Status</option>
          <option value="approved">Approved</option>
          <option value="accepted">Accepted</option>
        </SelectField>
      </FilterSection>

      <div className="students-table-section">
        <div className="table-container">
          <table className="students-table">
            <thead>
              <tr>
                <th>Reg Number</th>
                <th>Full Name</th>
                <th>Room</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {data?.data?.map((student: Student) => (
                <tr key={student._id}>
                  <td>{student.student_reg_no || "-"}</td>
                  <td>{student.student_name}</td>
                  <td>{getRoomBadge(student.room_id?.room_no, student.room_id?._id)}</td>
                  <td>{getStatusBadge(student.status)}</td>
                  <td className="actions-cell" style={{display:"flex"}}>
                     <button className="action btn btn-sm btn-view" onClick={() => handleViewDetails(student._id)}>
                        <i className="fas fa-eye"></i>
                     </button>
                     {student.room_id && (
                        <button className="action btn btn-sm btn-delete" onClick={() => removeRoom(student._id)}>
                           <i className="fa-solid fa-rotate-left"></i>
                        </button>
                     )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pagination currentPage={currentPage} setCurrentPage={setCurrentPage} length={data?.length || 0} />
        </div>
      </div>

      {showModal && specificStudent?.data && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Student Details</h3>
              <button onClick={() => setShowModal(false)}><i className="fas fa-times"></i></button>
            </div>
            <div className="modal-body">
              <div className="details-grid">
                 <p><strong>Name:</strong> {specificStudent.data.student_name}</p>
                 <p><strong>CNIC:</strong> {specificStudent.data.cnic_no}</p>
                 
                 {/* Room Assignment Logic */}
                 {!specificStudent.data.room_id && (
                   <div className="assign-section">
                      <select name="block_id" onChange={handleRoomAssignmentChange} value={roomAssignment.block_id}>
                        <option value="">Select Block</option>
                        {blockData?.data?.map((b: Block) => (
                          <option key={b._id} value={b._id}>Block {b.block_no}</option>
                        ))}
                      </select>
                      <select name="room_no" onChange={handleRoomAssignmentChange} value={roomAssignment.room_no} disabled={!roomAssignment.block_id}>
                        <option value="">Select Room</option>
                        {roomData?.data?.map((r: Room) => (
                          <option key={r._id} value={r._id}>{r.room_no}</option>
                        ))}
                      </select>
                      <button className="btn btn-success" onClick={handleAssignRoom}>Assign</button>
                   </div>
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