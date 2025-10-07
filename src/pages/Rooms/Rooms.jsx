import React, { useState, useEffect } from 'react';
import './Room.css';
import { useRoomsQuery } from '../../components/hooks/useRoomQuery';
import { useCustom } from '../../Store/Store';
import { PostService } from '../../Services/Services';
import socket from '../../Services/Socket';
import Pagination from '../../components/Layout/Pagination';

const Rooms = () => {
  const {token}=useCustom();
  const [rooms, setRooms] = useState([]);
  // const [filteredRooms, setFilteredRooms] = useState([]);
  const [formData, setFormData] = useState({
    room_no: '',
    total_beds: '',
    available_beds: '',
    status: 'available'
  });
  const [editIndex, setEditIndex] = useState(null);
  const [filters, setFilters] = useState({
    status: '',
    search: ''
  });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const {data,isLoading}=useRoomsQuery(`/api/room?page=${currentPage-1}&limit=${itemsPerPage}`,token,currentPage);
  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [id]: value
    }));
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const calculateOccupancy = (totalBeds, availableBeds) => {
    const occupied = totalBeds - availableBeds;
    return ((occupied / totalBeds) * 100).toFixed(0) + '%';
  };

  const handleSubmit = async(e) => {
    e.preventDefault();

    // Validate available beds don't exceed total beds
    if (parseInt(formData.availableBeds) > parseInt(formData.totalBeds)) {
      alert('Available beds cannot exceed total beds');
      return;
    }
    console.log(formData);
    PostService("/api/room",formData,token);
    // const occupancy = calculateOccupancy(
    //   parseInt(formData.totalBeds),
    //   parseInt(formData.availableBeds)
    // );

    // if (editIndex !== null) {
    //   // Update existing room
    //   const updatedRooms = rooms.map((room, index) =>
    //     index === editIndex 
    //       ? { 
    //           ...room, 
    //           ...formData, 
    //           totalBeds: parseInt(formData.totalBeds),
    //           availableBeds: parseInt(formData.availableBeds),
    //           occupancy 
    //         }
    //       : room
    //   );
    //   setRooms(updatedRooms);
    //   setEditIndex(null);
    // } else {
    //   // Add new room
    //   const newRoom = {
    //     id: rooms.length + 1,
    //     ...formData,
    //     totalBeds: parseInt(formData.totalBeds),
    //     availableBeds: parseInt(formData.availableBeds),
    //     occupancy,
    //     createdAt: new Date().toISOString()
    //   };
    //   setRooms(prev => [...prev, newRoom]);
    // }

    // Reset form
    setFormData({
      room_no: '',
      total_beds: '',
      available_beds: '',
      status: 'available'
    });
  };

  const handleEdit = (index) => {
    const roomToEdit = data?.data?.[index];
    setFormData({
      room_no: roomToEdit.room_no,
      total_beds: roomToEdit.total_beds.toString(),
      available_beds: roomToEdit.available_beds.toString(),
      status: roomToEdit.status
    });
    setEditIndex(index);
  };

  const handleDelete = (index) => {
    if (window.confirm('Are you sure you want to delete this room?')) {
      const updatedRooms = rooms.filter((_, i) => i !== index);
      setRooms(updatedRooms);
    }
  };

  const cancelEdit = () => {
    setEditIndex(null);
    setFormData({
      room_no: '',
      total_beds: '',
      available_beds: '',
      status: 'available'
    });
  };

  const clearFilters = () => {
    setFilters({
      status: '',
      search: ''
    });
  };

  // Pagination logic
  // const totalPages = Math.ceil(filteredRooms.length / itemsPerPage);
  // const startIndex = (currentPage - 1) * itemsPerPage;
  // const currentRooms = filteredRooms.slice(startIndex, startIndex + itemsPerPage);

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
      available: { label: 'Available', class: 'badge-available' },
      occupied: { label: 'Occupied', class: 'badge-occupied' },
      maintenance: { label: 'Maintenance', class: 'badge-maintenance' }
    };

    const config = statusConfig[status] || { label: status, class: 'badge-default' };
    return <span className={`status-badge ${config.class}`}>{config.label}</span>;
  };

  const getOccupancyLevel = (availableBeds,totalBeds) => {
    const occupancy=calculateOccupancy(totalBeds,availableBeds);
    const percentage = parseInt(occupancy);
    if (percentage === 0) return 'empty';
    if (percentage < 50) return 'low';
    if (percentage < 80) return 'medium';
    return 'high';
  };

  // Statistics
  const totalRooms = data?.data.length;
  const availableRooms = data?.data.filter(room => room.status === 'available').length;
  const occupiedRooms = data?.data.filter(room => room.status === 'occupied').length;
  const maintenanceRooms = data?.data.filter(room => room.status === 'maintenance').length;
  const totalBeds = data?.data.reduce((sum, room) => sum + room.total_beds, 0);
  const availableBeds = data?.data.reduce((sum, room) => sum + room.available_beds, 0);
  if(isLoading)return <h1>loading...</h1>;
  return (
    <div className="rooms-page">
      <div className="page-header">
        <h2>
          <i className="fas fa-bed"></i>
          Rooms Management
        </h2>
        <p>Manage hostel rooms, beds, and occupancy</p>
      </div>

      {/* Room Statistics */}
      <div className="stats-section">
        <div className="stats-grid">
          <div className="stat-card primary">
            <div className="stat-icon">
              <i className="fas fa-door-open"></i>
            </div>
            <div className="stat-content">
              <h3>Total Rooms</h3>
              <div className="stat-value">{totalRooms}</div>
              <p className="stat-description">All rooms</p>
            </div>
          </div>

          <div className="stat-card success">
            <div className="stat-icon">
              <i className="fas fa-check-circle"></i>
            </div>
            <div className="stat-content">
              <h3>Available Rooms</h3>
              <div className="stat-value">{availableRooms}</div>
              <p className="stat-description">Ready for occupancy</p>
            </div>
          </div>

          <div className="stat-card warning">
            <div className="stat-icon">
              <i className="fas fa-users"></i>
            </div>
            <div className="stat-content">
              <h3>Occupied Rooms</h3>
              <div className="stat-value">{occupiedRooms}</div>
              <p className="stat-description">Currently occupied</p>
            </div>
          </div>

          <div className="stat-card danger">
            <div className="stat-icon">
              <i className="fas fa-tools"></i>
            </div>
            <div className="stat-content">
              <h3>Under Maintenance</h3>
              <div className="stat-value">{maintenanceRooms}</div>
              <p className="stat-description">Being serviced</p>
            </div>
          </div>
          <div className="beds-stats ">
          <div className="stat-card info">
            <div className="stat-icon">
              <i className="fas fa-bed"></i>
            </div>
            <div className="stat-content">
              <h3>Total Beds</h3>
              <div className="stat-value">{totalBeds}</div>
              <p className="stat-description">{availableBeds} beds available</p>
            </div>
          </div>
        </div>
        </div>

     
      </div>

      {/* Room Form */}
      <div className="room-form-section">
        <div className="section-card">
          <h4 className="section-title">
            <i className="fas fa-plus-circle"></i>
            {editIndex !== null ? 'Edit Room' : 'Add New Room'}
          </h4>
          <form onSubmit={handleSubmit} className="room-form">
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="room_no" className="form-label">
                  Room Number <span className="required">*</span>
                </label>
                <input
                  type="text"
                  id="room_no"
                  name='room_no'
                  className="form-control"
                  value={formData.room_no}
                  onChange={handleInputChange}
                  placeholder="Enter room number"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="total_beds" className="form-label">
                  Total Beds <span className="required">*</span>
                </label>
                <input
                  type="number"
                  id="total_beds"
                  name="total_beds"
                  className="form-control"
                  value={formData.total_beds}
                  onChange={handleInputChange}
                  placeholder="Enter total beds"
                  min="1"
                  max="10"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="available_beds" className="form-label">
                  Available Beds <span className="required">*</span>
                </label>
                <input
                  type="number"
                  id="available_beds"
                  name='available_beds'
                  className="form-control"
                  value={formData.available_beds}
                  onChange={handleInputChange}
                  placeholder="Enter available beds"
                  min="0"
                  max={formData.totalBeds || 10}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="status" className="form-label">
                  Status <span className="required">*</span>
                </label>
                <select
                  id="status"
                  className="form-control"
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  required
                >
                  <option value="available">Available</option>
                  <option value="occupied">Occupied</option>
                  <option value="maintenance">Maintenance</option>
                </select>
              </div>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn btn-primary">
                <i className="fas fa-save"></i>
                {editIndex !== null ? 'Update Room' : 'Add Room'}
              </button>
              {editIndex !== null && (
                <button type="button" className="btn btn-secondary" onClick={cancelEdit}>
                  <i className="fas fa-times"></i>
                  Cancel Edit
                </button>
              )}
            </div>
          </form>
        </div>
      </div>

      {/* Filters Section */}
      <div className="filters-section">
        <div className="section-card">
          <h4 className="section-title">
            <i className="fas fa-filter"></i>
            Filter Rooms
          </h4>
          <div className="filters-row">
            <div className="filter-group">
              <label htmlFor="searchRoom" className="form-label">Search Room</label>
              <input
                type="text"
                id="searchRoom"
                name="search"
                className="form-control"
                value={filters.search}
                onChange={handleFilterChange}
                placeholder="Search by room number"
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
                <option value="available">Available</option>
                <option value="occupied">Occupied</option>
                <option value="maintenance">Maintenance</option>
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

      {/* Rooms Table */}
      <div className="rooms-table-section">
        <div className="section-card">
          <div className="card-header-enhanced">
            <h3 className="card-title">
              <i className="fas fa-list"></i>
              Rooms List
            </h3>
            <div className="rooms-summary">
              {/* Showing {filteredRooms.length} of {rooms.length} rooms */}
            </div>
          </div>

          <div className="table-container">
            <div className="table-responsive">
              <table className="rooms-table">
                <thead>
                  <tr>
                    <th>Room No</th>
                    <th>Total Beds</th>
                    <th className="beds-column">Available Beds</th>
                    <th className="occupancy-column">Occupancy</th>
                    <th className="status-column">Status</th>
                    <th className="actions-column">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data.data?.length > 0 ? (
                    data.data?.map((room, index) => (
                      <tr key={index} className="room-row">
                        <td className="room-no-cell">
                          <div className="room-info">
                            <div className="room-number">{room.room_no}</div>
                            <div className="room-floor">
                              Floor {room.room_no.charAt(0)}
                            </div>
                          </div>
                        </td>
                        <td className="beds-cell">
                          <div className="beds-display">
                            <i className="fas fa-bed"></i>
                            {room.total_beds} beds
                          </div>
                        </td>
                        <td className="available-beds-cell">
                          <div className={`available-beds ${room.available_beds === 0 ? 'full' : 'available'}`}>
                            {room.available_beds} available
                          </div>
                        </td>
                        <td className="occupancy-cell">
                          <div className="occupancy-display">
                            <div className="occupancy-bar">
                              <div 
                                className={`occupancy-fill ${getOccupancyLevel(room.available_beds,room.total_beds)}`}
                                style={{ width: calculateOccupancy(room.total_beds,room.available_beds) }}
                              ></div>
                            </div>
                            <span className="occupancy-text">{calculateOccupancy(room.total_beds,room.available_beds)}</span>
                          </div>
                        </td>
                        <td className="status-cell">
                          {getStatusBadge(room.status)}
                        </td>
                        <td className="actions-cell">
                          <div className="action-buttons">
                            <button
                              className="btn btn-sm btn-view"
                              title="View Details"
                            >
                              <i className="fas fa-eye"></i>
                            </button>
                            <button
                              className="btn btn-sm btn-edit"
                              onClick={() => handleEdit(data?.data?.findIndex(r => r._id === room._id))}
                              title="Edit"
                            >
                              <i className="fas fa-edit"></i>
                            </button>
                            <button
                              className="btn btn-sm btn-delete"
                              onClick={() => handleDelete(data?.data?.findIndex(r => r._id === room._id))}
                              title="Delete"
                            >
                              <i className="fas fa-trash"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="no-data">
                        <i className="fas fa-bed"></i>
                        No rooms found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
              <Pagination currentPage={currentPage} setCurrentPage={setCurrentPage} length={data?.data?.length} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Rooms;