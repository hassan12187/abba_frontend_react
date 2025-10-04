import React, { useState, useEffect } from 'react';
import './Room.css';

const Rooms = () => {
  const [rooms, setRooms] = useState([]);
  const [filteredRooms, setFilteredRooms] = useState([]);
  const [formData, setFormData] = useState({
    roomNo: '',
    totalBeds: '',
    availableBeds: '',
    roomStatus: 'available'
  });
  const [editIndex, setEditIndex] = useState(null);
  const [filters, setFilters] = useState({
    status: '',
    search: ''
  });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Sample initial data
  useEffect(() => {
    const sampleRooms = [
      {
        id: 1,
        roomNo: '101',
        totalBeds: 4,
        availableBeds: 2,
        roomStatus: 'available',
        occupancy: '50%'
      },
      {
        id: 2,
        roomNo: '102',
        totalBeds: 3,
        availableBeds: 0,
        roomStatus: 'occupied',
        occupancy: '100%'
      },
      {
        id: 3,
        roomNo: '103',
        totalBeds: 2,
        availableBeds: 2,
        roomStatus: 'available',
        occupancy: '0%'
      },
      {
        id: 4,
        roomNo: '201',
        totalBeds: 4,
        availableBeds: 1,
        roomStatus: 'available',
        occupancy: '75%'
      },
      {
        id: 5,
        roomNo: '202',
        totalBeds: 3,
        availableBeds: 0,
        roomStatus: 'maintenance',
        occupancy: '100%'
      }
    ];
    setRooms(sampleRooms);
    setFilteredRooms(sampleRooms);
  }, []);

  // Filter rooms when filters change
  useEffect(() => {
    let filtered = rooms;

    if (filters.status) {
      filtered = filtered.filter(room => room.roomStatus === filters.status);
    }

    if (filters.search) {
      filtered = filtered.filter(room => 
        room.roomNo.toLowerCase().includes(filters.search.toLowerCase())
      );
    }

    setFilteredRooms(filtered);
    setCurrentPage(1);
  }, [filters, rooms]);

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

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validate available beds don't exceed total beds
    if (parseInt(formData.availableBeds) > parseInt(formData.totalBeds)) {
      alert('Available beds cannot exceed total beds');
      return;
    }

    const occupancy = calculateOccupancy(
      parseInt(formData.totalBeds),
      parseInt(formData.availableBeds)
    );

    if (editIndex !== null) {
      // Update existing room
      const updatedRooms = rooms.map((room, index) =>
        index === editIndex 
          ? { 
              ...room, 
              ...formData, 
              totalBeds: parseInt(formData.totalBeds),
              availableBeds: parseInt(formData.availableBeds),
              occupancy 
            }
          : room
      );
      setRooms(updatedRooms);
      setEditIndex(null);
    } else {
      // Add new room
      const newRoom = {
        id: rooms.length + 1,
        ...formData,
        totalBeds: parseInt(formData.totalBeds),
        availableBeds: parseInt(formData.availableBeds),
        occupancy,
        createdAt: new Date().toISOString()
      };
      setRooms(prev => [...prev, newRoom]);
    }

    // Reset form
    setFormData({
      roomNo: '',
      totalBeds: '',
      availableBeds: '',
      roomStatus: 'available'
    });
  };

  const handleEdit = (index) => {
    const roomToEdit = rooms[index];
    setFormData({
      roomNo: roomToEdit.roomNo,
      totalBeds: roomToEdit.totalBeds.toString(),
      availableBeds: roomToEdit.availableBeds.toString(),
      roomStatus: roomToEdit.roomStatus
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
      roomNo: '',
      totalBeds: '',
      availableBeds: '',
      roomStatus: 'available'
    });
  };

  const clearFilters = () => {
    setFilters({
      status: '',
      search: ''
    });
  };

  // Pagination logic
  const totalPages = Math.ceil(filteredRooms.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentRooms = filteredRooms.slice(startIndex, startIndex + itemsPerPage);

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

  const getOccupancyLevel = (occupancy) => {
    const percentage = parseInt(occupancy);
    if (percentage === 0) return 'empty';
    if (percentage < 50) return 'low';
    if (percentage < 80) return 'medium';
    return 'high';
  };

  // Statistics
  const totalRooms = rooms.length;
  const availableRooms = rooms.filter(room => room.roomStatus === 'available').length;
  const occupiedRooms = rooms.filter(room => room.roomStatus === 'occupied').length;
  const maintenanceRooms = rooms.filter(room => room.roomStatus === 'maintenance').length;
  const totalBeds = rooms.reduce((sum, room) => sum + room.totalBeds, 0);
  const availableBeds = rooms.reduce((sum, room) => sum + room.availableBeds, 0);

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
                <label htmlFor="roomNo" className="form-label">
                  Room Number <span className="required">*</span>
                </label>
                <input
                  type="text"
                  id="roomNo"
                  className="form-control"
                  value={formData.roomNo}
                  onChange={handleInputChange}
                  placeholder="Enter room number"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="totalBeds" className="form-label">
                  Total Beds <span className="required">*</span>
                </label>
                <input
                  type="number"
                  id="totalBeds"
                  className="form-control"
                  value={formData.totalBeds}
                  onChange={handleInputChange}
                  placeholder="Enter total beds"
                  min="1"
                  max="10"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="availableBeds" className="form-label">
                  Available Beds <span className="required">*</span>
                </label>
                <input
                  type="number"
                  id="availableBeds"
                  className="form-control"
                  value={formData.availableBeds}
                  onChange={handleInputChange}
                  placeholder="Enter available beds"
                  min="0"
                  max={formData.totalBeds || 10}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="roomStatus" className="form-label">
                  Status <span className="required">*</span>
                </label>
                <select
                  id="roomStatus"
                  className="form-control"
                  value={formData.roomStatus}
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
              Showing {filteredRooms.length} of {rooms.length} rooms
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
                  {currentRooms.length > 0 ? (
                    currentRooms.map((room, index) => (
                      <tr key={room.id} className="room-row">
                        <td className="room-no-cell">
                          <div className="room-info">
                            <div className="room-number">{room.roomNo}</div>
                            <div className="room-floor">
                              Floor {room.roomNo.charAt(0)}
                            </div>
                          </div>
                        </td>
                        <td className="beds-cell">
                          <div className="beds-display">
                            <i className="fas fa-bed"></i>
                            {room.totalBeds} beds
                          </div>
                        </td>
                        <td className="available-beds-cell">
                          <div className={`available-beds ${room.availableBeds === 0 ? 'full' : 'available'}`}>
                            {room.availableBeds} available
                          </div>
                        </td>
                        <td className="occupancy-cell">
                          <div className="occupancy-display">
                            <div className="occupancy-bar">
                              <div 
                                className={`occupancy-fill ${getOccupancyLevel(room.occupancy)}`}
                                style={{ width: room.occupancy }}
                              ></div>
                            </div>
                            <span className="occupancy-text">{room.occupancy}</span>
                          </div>
                        </td>
                        <td className="status-cell">
                          {getStatusBadge(room.roomStatus)}
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
                              onClick={() => handleEdit(rooms.findIndex(r => r.id === room.id))}
                              title="Edit"
                            >
                              <i className="fas fa-edit"></i>
                            </button>
                            <button
                              className="btn btn-sm btn-delete"
                              onClick={() => handleDelete(rooms.findIndex(r => r.id === room.id))}
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
    </div>
  );
};

export default Rooms;