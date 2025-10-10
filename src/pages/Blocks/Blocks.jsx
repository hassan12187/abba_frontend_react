import { useState } from 'react';
import '../Rooms/Room.css';
import { useCustom } from '../../Store/Store';
import { PostService } from '../../Services/Services';
import Pagination from '../../components/Layout/Pagination';
import { useDebounce } from '../../components/hooks/useDebounce';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import usePagedBlockQuery from '../../components/hooks/usePagedBlockQuery';

const Blocks = () => {
    const queryClient=useQueryClient();
  const {token}=useCustom();
  const [rooms, setBlocks] = useState([]);
  const [InputVal,setInputVal]=useState({
    block_no:"",
    status:""
  });
  const [formData, setFormData] = useState({
    block_no: '',
    total_rooms: '',
    description: '',
    status: ''
  });
  const [editIndex, setEditIndex] = useState(null);
  const [filters, setFilters] = useState({
    block_no: '',
    status: ''
  });
  const [currentPage, setCurrentPage] = useState(1);
  const {data} = usePagedBlockQuery(token,currentPage-1,filters.block_no,filters.status);
  console.log(data);
  const mutate=useMutation({
    mutationFn:async({url,data})=>await PostService(url,data,token),
    onSuccess:()=>{
        console.log("yes it is successfull");
        queryClient.invalidateQueries({
            queryKey:["block_page"]
        });
    }
  })
  // const [filteredRooms, setFilteredRooms] = useState([]);
  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [id]: value
    }));
  };
  const updateFilters=useDebounce(
    (name,value)=>{
      setFilters((prev)=>{
        return {...prev,[name]:value};
      })
    },500
  );
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setInputVal((prev)=>{
      return {...prev,[name]:value};
    });
    updateFilters(name,value);
  };
//   const calculateOccupancy = (totalBeds, ) => {
//     const occupied = totalBeds - ;
//     return ((occupied / totalBeds) * 100).toFixed(0) + '%';
//   };

  const handleSubmit = async(e) => {
    e.preventDefault();
    console.log(formData);
    mutate.mutate({url:"/api/block",data:formData});
  };

  const handleEdit = (index) => {
    const roomToEdit = data?.[index];
    setFormData({
      block_no: roomToEdit.block_no,
      total_beds: roomToEdit.total_beds.toString(),
      available_beds: roomToEdit.available_beds.toString(),
      status: roomToEdit.status
    });
    setEditIndex(index);
  };
  const cancelEdit = () => {
    setEditIndex(null);
    setFormData({
        block_no: '',
    total_rooms: '',
    description: '',
    status: ''
    });
  };

  const clearFilters = () => {
    setFilters({
      status: '',
      search: ''
    });
  };

  const getStatusBadge = (status) => {
    if(status=="under construction"){
        let splt = status.split(" ");
        status=`${splt[0]}_${splt[1]}`;
    };
    const statusConfig = {
      ready: { label: 'Ready', class: 'badge-available' },
      under_construction: { label: 'Under Construction', class: 'badge-occupied' },
      maintenance: { label: 'Maintenance', class: 'badge-maintenance' }
    };

    const config = statusConfig[status] || { label: status, class: 'badge-default' };
    return <span className={`status-badge ${config.class}`}>{config.label}</span>;
  };

//   const getOccupancyLevel = (totalBeds) => {
//     const occupancy=calculateOccupancy(totalBeds,);
//     const percentage = parseInt(occupancy);
//     if (percentage === 0) return 'empty';
//     if (percentage < 50) return 'low';
//     if (percentage < 80) return 'medium';
//     return 'high';
//   };

  // Statistics
  const totalRooms = data?.length;
  const availableRooms = data?.filter(room => room.status === 'available').length;
  const occupiedRooms = data?.filter(room => room.status === 'occupied').length;
  const maintenanceRooms = data?.filter(room => room.status === 'maintenance').length;
  return (
    <div className="rooms-page">
      <div className="page-header">
        <h2>
          <i className="fas fa-bed"></i>
          Blocks Management
        </h2>
        <p>Manage hostel blocks, rooms</p>
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
          {/* <div className="beds-stats ">
          <div className="stat-card info">
            <div className="stat-icon">
              <i className="fas fa-bed"></i>
            </div>
            <div className="stat-content">
              <h3>Total Beds</h3>
              <div className="stat-value">{totalBeds}</div>
              <p className="stat-description">{} beds available</p>
            </div>
          </div>
        </div> */}
        </div>

     
      </div>

      {/* Block  Form */}
      <div className="room-form-section">
        <div className="section-card">
          <h4 className="section-title">
            <i className="fas fa-plus-circle"></i>
            {editIndex !== null ? 'Edit Block' : 'Add New Block'}
          </h4>
          <form onSubmit={handleSubmit} method='POST'>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="block_no" className="form-label">
                  Block Number <span className="required">*</span>
                </label>
                <input
                  type="text"
                  id="block_no"
                  name='block_no'
                  className="form-control"
                  value={formData.block_no}
                  onChange={handleInputChange}
                  placeholder="Enter block number"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="total_rooms" className="form-label">
                  Total Rooms <span className="required">*</span>
                </label>
                <input
                  type="number"
                  id="total_rooms"
                  name="total_rooms"
                  className="form-control"
                  value={formData.total_rooms}
                  onChange={handleInputChange}
                  placeholder="Enter total rooms"
                  min="1"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="description" className="form-label">
                  Block Description <span className="required">*</span>
                </label>
                <input
                  type="text"
                  id="description"
                  name='description'
                  className="form-control"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Description..."
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
                  <option value="">Select Any Option</option>
                  <option value="under construction">Under Construction</option>
                  <option value="ready">Ready</option>
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
            Filter Blocks
          </h4>
          <div className="filters-row">
            <div className="filter-group">
              <label htmlFor="block_no" className="form-label">Search Block</label>
              <input
                type="text"
                id="block_no"
                name="block_no"
                className="form-control"
                value={InputVal.block_no}
                onChange={handleFilterChange}
                placeholder="Search by room number"
              />
            </div>

            <div className="filter-group">
              <label htmlFor="status" className="form-label">Status</label>
              <select
                id="status"
                name="status"
                className="form-control"
                value={InputVal.status}
                onChange={handleFilterChange}
              >
                <option value="">Select Any Option</option>
                <option value="under construction">Under Construction</option>
                <option value="ready">Ready</option>
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
              <table className="rooms-table text-center">
                    <thead>
                  <tr>
                    <th style={{ textAlign: 'center' }}>Block No</th>
                    <th style={{ textAlign: 'center' }}>Total Rooms</th>
                    <th className="status-column" style={{ textAlign: 'center' }}>Status</th>
                    <th className="actions-column" style={{ textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data && data.length>0? (
                    data?.map((room, index) => (
                      <tr key={index} className="room-row">
                        <td className="room-no-cell">
                          <div className="room-info">
                            <div className="room-number">{room?.block_no}</div>
                            <div className="room-floor">
                              Floor {room?.block_no.charAt(0)}
                            </div>
                          </div>
                        </td>
                        <td className="beds-cell" style={{fontWeight:"bold"}}>
                            {room.total_rooms}
                        </td>
                        <td className="status-cell" >
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
                              onClick={() => handleEdit(data?.findIndex(r => r._id === room._id))}
                              title="Edit"
                            >
                              <i className="fas fa-edit"></i>
                            </button>
                            <button
                              className="btn btn-sm btn-delete"
                              onClick={() => handleDelete(data?.findIndex(r => r._id === room._id))}
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
              <Pagination currentPage={currentPage} setCurrentPage={setCurrentPage} length={data?.length} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Blocks;