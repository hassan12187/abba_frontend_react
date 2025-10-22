import React, { useState, useEffect, useMemo } from 'react';
import './Room.css';
import { useRoomsQuery } from '../../components/hooks/useRoomQuery';
import { useCustom } from '../../Store/Store';
import { PostService } from '../../Services/Services';
import Pagination from '../../components/Layout/Pagination';
import { useDebounce } from '../../components/hooks/useDebounce';
import { QueryClient, useMutation, useQueryClient } from '@tanstack/react-query';
import useBlockQuery from '../../components/hooks/useBlockQuery';
import FilterSection from '../../components/reusable/FilterSection';
import InputField from '../../components/reusable/InputField';
import SelectField from '../../components/reusable/SelectField';
import Modal from '../../components/reusable/Modal';
import DetailedInfo from '../../components/reusable/DetailedInfo';
import useSpecificQuery from '../../components/hooks/useSpecificQuery';

const roomData=[
  {
    type:"text",
    id:"room_no",
    name:"room_no",
    placeholder:"Room Number",
    label:"Room Number"
  },
  {
    type:"number",
    id:"total_beds",
    name:"total_beds",
    label:"Total Beds",
    placeholder:"Total Beds"
  },
  {
    type:"number",
    id:"available_beds",
    name:"available_beds",
    label:"Available Beds",
    placeholder:"Available Beds"
  },
  {
    type:"text",
    id:"block_no",
    name:"block_no",
    label:"Block Number",
    placeholder:"Block Number"
  },
  {
    type:"select",
    id:"status",
    name:"status",
    label:"Room Status",
    options:<>
      <option>Select Any Status</option>
      <option value={'available'}>Available</option>
      <option value={'occupied'}>Occupied</option>
      <option value={'maintenance'}>Maintenance</option>
    </>
  }
]

const Rooms = () => {
  const {token}=useCustom();
  const queryClient=useQueryClient();
  const [rooms, setRooms] = useState([]);
  const [InputVal,setInputVal]=useState({
    room_no:"",
    status:""
  });
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [showModal, setShowModal] = useState({show:false,mode:"view"});
  
  const [formData, setFormData] = useState({
    room_no: '',
    total_beds: '',
    available_beds: '',
    block_id:'',
    status: 'available'
  });
  const [filters, setFilters] = useState({
    room_no: '',
    status: ''
  });
  const [currentPage, setCurrentPage] = useState(1);
  const {data,isLoading}=useRoomsQuery(token,currentPage-1,filters.room_no,filters.status);
  const {data:specificData}=useSpecificQuery(`/api/admin/room/${selectedRoom}`,selectedRoom,token,'room_id');
  // const {data:blockData,isLoading:blockLoading}=useBlockQuery(token);
  const memoizedSpecificData=useMemo(()=>specificData?.data || {},[specificData?.data]);
  const mutate=useMutation({
    mutationFn:async(data)=>await PostService('/api/admin/room',data,token),
    onSuccess:()=>{
      queryClient.invalidateQueries({
        queryKey:['rooms'],
      })
      setFormData({
      room_no: '',
      total_beds: '',
      available_beds: '',
      block_id:'',
      status: 'available'
    });
    },
    onError:(err)=>{console.log(err);}
  });

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

  const calculateOccupancy = (totalBeds, availableBeds) => {
    const occupied = totalBeds - availableBeds;
    return ((occupied / totalBeds) * 100).toFixed(0) + '%';
  };

  const handleSubmit = async(e) => {
    e.preventDefault();
    console.log(formData);
    mutate.mutate(formData);
  };

  const handleEdit = (rid)=> {
    setSelectedRoom(rid);
    setShowModal({show:true,mode:"edit"});
  } ;
  const handleViewRoom = (rid) => {
    setSelectedRoom(rid);
    setShowModal({show:true,mode:"view"});
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
              <div className="stat-value">{data?.stats?.totalRooms}</div>
              <p className="stat-description">All rooms</p>
            </div>
          </div>

          <div className="stat-card success">
            <div className="stat-icon">
              <i className="fas fa-check-circle"></i>
            </div>
            <div className="stat-content">
              <h3>Available Rooms</h3>
              <div className="stat-value">{data?.stats?.availableRooms}</div>
              <p className="stat-description">Ready for occupancy</p>
            </div>
          </div>

          <div className="stat-card warning">
            <div className="stat-icon">
              <i className="fas fa-users"></i>
            </div>
            <div className="stat-content">
              <h3>Occupied Rooms</h3>
              <div className="stat-value">{data?.stats?.occupiedRooms}</div>
              <p className="stat-description">Currently occupied</p>
            </div>
          </div>

          <div className="stat-card danger">
            <div className="stat-icon">
              <i className="fas fa-tools"></i>
            </div>
            <div className="stat-content">
              <h3>Under Maintenance</h3>
              <div className="stat-value">{data?.stats?.maintenanceRooms}</div>
              <p className="stat-description">Being serviced</p>
            </div>
          </div>
          <div className="beds-stats ">
          <div className="stat-card info">
            <div className="stat-icon">
              <i className="fas fa-bed"></i>
            </div>
            {/* <div className="stat-content">
              <h3>Total Beds</h3>
              <div className="stat-value">{totalBeds}</div>
              <p className="stat-description">{availableBeds} beds available</p>
            </div> */}
          </div>
        </div>
        </div>
      </div>

      {/* Room Form */}
      <div className="room-form-section">
        <div className="section-card">
          <h4 className="section-title">
            <i className="fas fa-plus-circle"></i>
            Add New Room
          </h4>
          <form onSubmit={handleSubmit} className="room-form">
            <div className="form-row">
              <InputField id={'room_no'} name={'room_no'} value={formData.room_no} onChange={handleInputChange} placeholder={'Enter Room Number'} label={'Room Number'} />
              <InputField id={'total_beds'} name={'total_beds'} value={formData.total_beds} onChange={handleInputChange} placeholder={'Enter Total Beds'} label={'Total Beds'} />
              <InputField id={'available_beds'} name={'available_beds'} value={formData.available_beds} onChange={handleInputChange} placeholder={'Enter Available Beds'} label={'Available Beds'} min={0} max={formData.total_beds||10} />
              <SelectField id={'block_id'} name={'block_id'} value={formData.block_id} onChange={handleInputChange} label={'Block Number'}>
                {/* <option value="" defaultValue hidden>Select Any Block</option>
                   {
                      blockData?.map(block=>(
                        <option value={block?._id} key={block?._id}>{`Block ${block?.block_no}`}</option>
                      ))
                    } */}
              </SelectField>
           <SelectField id={'status'} name={'status'} value={formData.status} onChange={handleInputChange} label={'Status'}>
                <option value="" defaultValue hidden>Select Any Status</option>
                 <option value="available">Available</option>
                  <option value="occupied">Occupied</option>
                  <option value="maintenance">Maintenance</option>
              </SelectField>
         
            </div>
          </form>
        </div>
      </div>

      {/* Filters Section */}
      <FilterSection heading={'Filter Rooms'}>
              <InputField type={'text'} id={'room_no'} name={'room_no'} className={'form-control'} value={InputVal.room_no} onChange={handleFilterChange} placeholder={'Search by room number'} />
              <SelectField id={'status'} name={'status'} className={'form-control'} value={InputVal.status} onChange={handleFilterChange} >
                   <option value="">All Status</option>
                <option value="available">Available</option>
                <option value="occupied">Occupied</option>
                <option value="maintenance">Maintenance</option>
              </SelectField>
      </FilterSection>

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
                  {data?.data?.length > 0 ? (
                    data?.data?.map((room, index) => (
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
                              onClick={() => handleViewRoom(room._id)}
                            >
                              <i className="fas fa-eye"></i>
                            </button>
                            <button
                              className="btn btn-sm btn-edit"
                              onClick={() => handleEdit(room._id)}
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

      {/* Modal for Room Details */}
      {showModal.show  && (
        <Modal setShowModal={setShowModal} modalTitle={"Room"} data={{...memoizedSpecificData,block_no:memoizedSpecificData?.block_id?.block_no}} fields={roomData} mode={showModal.mode} actionButtons={<>
          <button 
                    className="btn btn-success"
                  >
                    <i className="fas fa-edit"></i>
                    Edit
                  </button>
        </>} />
      )}
    </div>
  );
};

export default Rooms;