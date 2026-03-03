import React, { useState, useMemo,type ChangeEvent,type FormEvent } from 'react';
// import './room';
import { useRoomsQuery } from '../../components/hooks/useRoomQuery';
import { useCustom } from '../../Store/Store';
import { PatchService, PostService } from '../../Services/Services';
import Pagination from '../../components/Layout/Pagination';
import { useDebounce } from '../../components/hooks/useDebounce';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import FilterSection from '../../components/reusable/FilterSection';
import InputField from '../../components/reusable/InputField';
import SelectField from '../../components/reusable/SelectField';
import Modal from '../../components/reusable/Modal';
import useSpecificQuery from '../../components/hooks/useSpecificQuery';
interface Room {
  _id: string;
  room_no: string;
  total_beds: number;
  available_beds: number;
  status: 'available' | 'occupied' | 'maintenance';
  block_id?: {
    _id: string;
    block_no: string;
  };
  occupants?: any[];
}

interface RoomStats {
  totalRooms: number;
  availableRooms: number;
  occupiedRooms: number;
  maintenanceRooms: number;
}

interface RoomsResponse {
  data: Room[];
  stats: RoomStats;
  length: number;
}
// Define the field structure for the Modal
const roomFields = [
  { type: "text", id: "room_no", name: "room_no", placeholder: "Room Number", label: "Room Number" },
  { type: "number", id: "total_beds", name: "total_beds", label: "Total Beds", placeholder: "Total Beds" },
  { type: "number", id: "available_beds", name: "available_beds", label: "Available Beds", placeholder: "Available Beds" },
  { type: "text", id: "block_no", name: "block_no", label: "Block Number", placeholder: "Block Number" },
  {
    type: "select",
    id: "status",
    name: "status",
    label: "Room Status",
    options: (
      <>
        <option value="">Select Any Status</option>
        <option value="available">Available</option>
        <option value="occupied">Occupied</option>
        <option value="maintenance">Maintenance</option>
      </>
    )
  }
];

const Rooms = () => {
  const { token } = useCustom() as { token: string };
  const queryClient = useQueryClient();

  const [inputVal, setInputVal] = useState({ room_no: "", status: "" });
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [showModal, setShowModal] = useState<{ show: boolean; mode: "view" | "edit" }>({ show: false, mode: "view" });

  const [formData, setFormData] = useState({
    room_no: '',
    total_beds: '',
    available_beds: '',
    block_id: '',
    status: 'available'
  });

  const [filters, setFilters] = useState({ room_no: '', status: '' });
  const [currentPage, setCurrentPage] = useState(1);

  // Queries
  const { data, isLoading } = useRoomsQuery(token, currentPage - 1, filters.room_no, filters.status);
  
  // Use a specific type for the detailed room data
  const { data: specificData } = useSpecificQuery(
    selectedRoom ?? `/api/admin/room/${selectedRoom}` ,
    selectedRoom,
    token,
    'room_id'
  );

  const memoizedSpecificData = useMemo(() => specificData?.data || {}, [specificData?.data]);

  // Mutations
  const mutate = useMutation({
    mutationFn: async (newRoom: typeof formData) => await PostService('/api/admin/room', newRoom, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      setFormData({ room_no: '', total_beds: '', available_beds: '', block_id: '', status: 'available' });
    }
  });

  const removeMutate = useMutation({
    mutationFn: async (id: string) => PatchService(`/api/admin/student-room/${id}`, {}, token),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['room_id', selectedRoom] })
  });

  // Event Handlers
  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target; // Using 'name' instead of 'id' for consistency with formData keys
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const updateFilters = useDebounce((name: string, value: string) => {
    setFilters(prev => ({ ...prev, [name]: value }));
  }, 500);

  const handleFilterChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setInputVal(prev => ({ ...prev, [name]: value }));
    updateFilters(name, value);
  };

  const calculateOccupancy = (totalBeds: number, availableBeds: number): string => {
    if (!totalBeds || totalBeds === 0) return '0%';
    const occupied = totalBeds - availableBeds;
    return ((occupied / totalBeds) * 100).toFixed(0) + '%';
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    mutate.mutate(formData);
  };

  const handleEdit = (rid: string) => {
    setSelectedRoom(rid);
    setShowModal({ show: true, mode: "edit" });
  };

  const handleViewRoom = (rid: string) => {
    setSelectedRoom(rid);
    setShowModal({ show: true, mode: "view" });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; class: string }> = {
      available: { label: 'Available', class: 'badge-available' },
      occupied: { label: 'Occupied', class: 'badge-occupied' },
      maintenance: { label: 'Maintenance', class: 'badge-maintenance' }
    };
    const config = statusConfig[status] || { label: status, class: 'badge-default' };
    return <span className={`status-badge ${config.class}`}>{config.label}</span>;
  };

  const getOccupancyLevel = (availableBeds: number, totalBeds: number) => {
    const percentage = parseInt(calculateOccupancy(totalBeds, availableBeds));
    if (percentage === 0) return 'empty';
    if (percentage < 50) return 'low';
    if (percentage < 80) return 'medium';
    return 'high';
  };

  return (
    <div className="rooms-page">
      <div className="page-header">
        <h2><i className="fas fa-bed"></i> Rooms Management</h2>
      </div>

      {/* Stats Section */}
      <div className="stats-section">
        <div className="stats-grid">
          <div className="stat-card primary">
            <div className="stat-content">
              <h3>Total Rooms</h3>
              <div className="stat-value">{data?.stats?.totalRooms || 0}</div>
            </div>
          </div>
          <div className="stat-card success">
            <div className="stat-content">
              <h3>Available</h3>
              <div className="stat-value">{data?.stats?.availableRooms || 0}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Form Section */}
      <div className="room-form-section">
        <div className="section-card">
          <form onSubmit={handleSubmit} className="room-form">
            <div className="form-row">
              <InputField name='room_no' value={formData.room_no} onChange={handleInputChange} label='Room No' />
              <InputField name='total_beds' type='number' value={formData.total_beds} onChange={handleInputChange} label='Total Beds' />
              <InputField name='available_beds' type='number' value={formData.available_beds} onChange={handleInputChange} label='Available' />
              <button type="submit" className="btn btn-primary">Add Room</button>
            </div>
          </form>
        </div>
      </div>

      <FilterSection heading={'Filter Rooms'}>
        <InputField name='room_no' value={inputVal.room_no} onChange={handleFilterChange} placeholder='Search Room...' />
        <SelectField name='status' value={inputVal.status} onChange={handleFilterChange}>
          <option value="">All Status</option>
          <option value="available">Available</option>
          <option value="occupied">Occupied</option>
        </SelectField>
      </FilterSection>

      <div className="rooms-table-section">
        <div className="table-container">
          <table className="rooms-table">
            <thead>
              <tr>
                <th>Room No</th>
                <th>Beds</th>
                <th>Occupancy</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {data?.data?.map((room: Room) => (
                <tr key={room._id}>
                  <td>{room.room_no}</td>
                  <td>{room.available_beds} / {room.total_beds}</td>
                  <td>
                    <div className="occupancy-bar">
                      <div 
                        className={`occupancy-fill ${getOccupancyLevel(room.available_beds, room.total_beds)}`}
                        style={{ width: calculateOccupancy(room.total_beds, room.available_beds) }}
                      />
                    </div>
                  </td>
                  <td>{getStatusBadge(room.status)}</td>
                  <td>
                    <button onClick={() => handleViewRoom(room._id)}><i className="fas fa-eye" /></button>
                    <button onClick={() => handleEdit(room._id)}><i className="fas fa-edit" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pagination currentPage={currentPage} setCurrentPage={setCurrentPage} length={data?.length || 0} />
        </div>
      </div>

      {showModal.show && (
        <Modal 
          removeMutate={removeMutate} 
          setShowModal={setShowModal} 
          modalTitle="Room Details" 
          data={{
            ...memoizedSpecificData, 
            block_no: memoizedSpecificData?.block_id?.block_no
          }} 
          fields={roomFields} 
          mode={showModal.mode} 
          actionButtons={
            <button className="btn btn-success">
              <i className="fas fa-edit"></i> Edit
            </button>
          } 
        />
      )}
    </div>
  );
};

export default Rooms;