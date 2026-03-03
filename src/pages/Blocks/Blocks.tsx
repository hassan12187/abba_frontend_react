import React, { useState, useMemo, type ChangeEvent, type FormEvent } from 'react';
import { useCustom } from '../../Store/Store';
import { PostService } from '../../Services/Services';
import Pagination from '../../components/Layout/Pagination';
import { useDebounce } from '../../components/hooks/useDebounce';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import usePagedBlockQuery from '../../components/hooks/usePagedBlockQuery';
import FilterSection from '../../components/reusable/FilterSection';
import InputField from '../../components/reusable/InputField';
import SelectField from '../../components/reusable/SelectField';
import Modal from '../../components/reusable/Modal';
import useSpecificQuery from '../../components/hooks/useSpecificQuery';

// --- Interfaces ---
interface Block {
  _id: string;
  block_no: string;
  total_rooms: number | string;
  description: string;
  status: 'ready' | 'under construction' | 'maintenance' | string;
}

interface ModalState {
  show: boolean;
  mode: 'view' | 'edit' | '';
}

interface FilterState {
  block_no: string;
  status: string;
}

interface FieldConfig {
  type: string;
  name: string;
  id: string;
  placeholder?: string;
  label: string;
  options?: React.ReactNode;
}

// --- Configuration ---
const blockFields: FieldConfig[] = [
  {
    type: "text",
    name: "block_no",
    id: "block_no",
    placeholder: "block number",
    label: "Block Number"
  },
  {
    type: "text",
    name: "total_rooms",
    id: "total_rooms",
    placeholder: "Total Rooms",
    label: "Total Rooms"
  },
  {
    type: "textarea",
    name: "description",
    id: "description",
    label: "Block Description",
  },
  {
    type: "select",
    name: "status",
    id: "status",
    label: "Select Any Status",
    options: (
      <>
        <option value="">Select Any Status</option>
        <option value={'under construction'}>Under Construction</option>
        <option value={'ready'}>Ready</option>
        <option value={'maintenance'}>Maintenance</option>
      </>
    )
  }
];

const Blocks: React.FC = () => {
  const queryClient = useQueryClient();
  const { token } = useCustom() as { token: string };

  const [showModal, setShowModal] = useState<ModalState>({ show: false, mode: "" });
  const [blockId, setBlockId] = useState<string>("");
  const [inputVal, setInputVal] = useState<FilterState>({
    block_no: "",
    status: ""
  });

  const [formData, setFormData] = useState<Partial<Block>>({
    block_no: '',
    total_rooms: '',
    description: '',
    status: ''
  });

  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [filters, setFilters] = useState<FilterState>({
    block_no: '',
    status: ''
  });
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Queries
  const { data } = usePagedBlockQuery(token, currentPage - 1, filters.block_no, filters.status);
  
  const { data: specificData } = useSpecificQuery(
    `/api/admin/block/${blockId}`,
    blockId,
    token,
    `block_id:${blockId}`
  );

  const memoizedBlock = useMemo(() => specificData?.data || {}, [specificData?.data]);

  // Mutation
  const mutate = useMutation({
    mutationFn: async ({ url, data }: { url: string, data: any }) => await PostService(url, data, token),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["block_page"]
      });
      // Optionally reset form here
    }
  });

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [id]: value
    }));
  };

  const updateFilters = useDebounce(
    (name: string, value: string) => {
      setFilters((prev) => ({ ...prev, [name]: value }));
    }, 500
  );

  const handleFilterChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setInputVal((prev) => ({ ...prev, [name]: value }));
    updateFilters(name, value);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    mutate.mutate({ url: "/api/admin/block", data: formData });
  };

  const handleDelete = (index: number) => {
    if (window.confirm("Are you sure you want to delete this block?")) {
        console.log("Delete index:", index);
        // Implement delete mutation here
    }
  };

  const getStatusBadge = (status: string) => {
    let lookupKey = status;
    if (status === "under construction") {
      lookupKey = "under_construction";
    }

    const statusConfig: Record<string, { label: string, class: string }> = {
      ready: { label: 'Ready', class: 'badge-available' },
      under_construction: { label: 'Under Construction', class: 'badge-occupied' },
      maintenance: { label: 'Maintenance', class: 'badge-maintenance' }
    };

    const config = statusConfig[lookupKey] || { label: status, class: 'badge-default' };
    return <span className={`status-badge ${config.class}`}>{config.label}</span>;
  };

  // Static placeholders for Stats
  const totalRooms = 0;
  const availableRooms = 0;
  const occupiedRooms = 0;
  const maintenanceRooms = 0;

  return (
    <div className="rooms-page">
      <div className="page-header">
        <h2>
          <i className="fas fa-bed"></i>
          Blocks Management
        </h2>
        <p>Manage hostel blocks, rooms</p>
      </div>

      <div className="stats-section">
        <div className="stats-grid">
          <div className="stat-card primary">
            <div className="stat-icon"><i className="fas fa-door-open"></i></div>
            <div className="stat-content">
              <h3>Total Rooms</h3>
              <div className="stat-value">{totalRooms}</div>
              <p className="stat-description">All rooms</p>
            </div>
          </div>
          <div className="stat-card success">
            <div className="stat-icon"><i className="fas fa-check-circle"></i></div>
            <div className="stat-content">
              <h3>Available Rooms</h3>
              <div className="stat-value">{availableRooms}</div>
              <p className="stat-description">Ready for occupancy</p>
            </div>
          </div>
          <div className="stat-card warning">
            <div className="stat-icon"><i className="fas fa-users"></i></div>
            <div className="stat-content">
              <h3>Occupied Rooms</h3>
              <div className="stat-value">{occupiedRooms}</div>
              <p className="stat-description">Currently occupied</p>
            </div>
          </div>
          <div className="stat-card danger">
            <div className="stat-icon"><i className="fas fa-tools"></i></div>
            <div className="stat-content">
              <h3>Under Maintenance</h3>
              <div className="stat-value">{maintenanceRooms}</div>
              <p className="stat-description">Being serviced</p>
            </div>
          </div>
        </div>
      </div>

      <div className="room-form-section">
        <div className="section-card">
          <h4 className="section-title">
            <i className="fas fa-plus-circle"></i>
            {editIndex !== null ? 'Edit Block' : 'Add New Block'}
          </h4>
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="block_no" className="form-label">Block Number <span className="required">*</span></label>
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
                <label htmlFor="total_rooms" className="form-label">Total Rooms <span className="required">*</span></label>
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
                <label htmlFor="description" className="form-label">Block Description <span className="required">*</span></label>
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
                <label htmlFor="status" className="form-label">Status <span className="required">*</span></label>
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
              <button type="submit" className="btn btn-primary" disabled={mutate.isPending}>
                <i className="fas fa-save"></i>
                {mutate.isPending ? ' Saving...' : ' Add Block'}
              </button>
            </div>
          </form>
        </div>
      </div>

      <FilterSection heading={'Filter Blocks'}>
        <InputField 
          type={'text'} 
          id={'block_no_filter'} 
          name={'block_no'} 
          value={inputVal.block_no} 
          onChange={handleFilterChange} 
          placeholder={'Search by Block Number'} 
        />
        <SelectField 
          id={'status_filter'} 
          name={'status'} 
          value={inputVal.status} 
          onChange={handleFilterChange}
        >
          <option value="">Select Any Status</option>
          <option value="under construction">Under Construction</option>
          <option value="ready">Ready</option>
          <option value="maintenance">Maintenance</option>
        </SelectField>
      </FilterSection>

      <div className="rooms-table-section">
        <div className="section-card">
          <div className="card-header-enhanced">
            <h3 className="card-title">
              <i className="fas fa-list"></i>
              Blocks List
            </h3>
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
                  {data?.data && data?.data?.length > 0 ? (
                    data.data.map((room: Block, index: number) => (
                      <tr key={room._id || index} className="room-row">
                        <td className="room-no-cell">
                          <div className="room-info">
                            <div className="room-number">{room?.block_no}</div>
                            <div className="room-floor">
                              Floor {room?.block_no?.charAt(0)}
                            </div>
                          </div>
                        </td>
                        <td className="beds-cell" style={{ fontWeight: "bold" }}>
                          {room.total_rooms}
                        </td>
                        <td className="status-cell">
                          {getStatusBadge(room.status)}
                        </td>
                        <td className="actions-cell">
                          <div className="action-buttons">
                            <button
                              className="action btn btn-sm btn-view"
                              title="View Details"
                              onClick={() => {
                                setBlockId(room._id);
                                setShowModal({ show: true, mode: "view" });
                              }}
                            >
                              <i className="fas fa-eye"></i>
                            </button>
                            <button
                              className="action btn btn-sm btn-edit"
                              onClick={() => {
                                setBlockId(room._id);
                                setShowModal({ show: true, mode: "edit" });
                              }}
                              title="Edit"
                            >
                              <i className="fas fa-edit"></i>
                            </button>
                            <button
                              className="action btn btn-sm btn-delete"
                              onClick={() => handleDelete(index)}
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
                      <td colSpan={4} className="no-data">
                        <i className="fas fa-bed"></i>
                        No blocks found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <Pagination 
              currentPage={currentPage} 
              setCurrentPage={setCurrentPage} 
              length={data?.data?.length || 0} 
            />
          </div>
        </div>
      </div>

      {showModal.show && (
        <Modal 
          data={memoizedBlock}
          modalTitle={"Block"}
          setShowModal={setShowModal}
          mode={showModal.mode}
          fields={blockFields}
          actionButtons={
            <>
              <button className="btn btn-success">
                <i className="fas fa-edit"></i> Edit
              </button>
            </>
          }
        />
      )}
    </div>
  );
};

export default Blocks;