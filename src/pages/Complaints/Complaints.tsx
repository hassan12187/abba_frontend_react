import React, { useEffect, useState, useMemo,type ChangeEvent } from "react";
import Pagination from "../../components/Layout/Pagination.js";
import useCustomQuery from "../../components/hooks/useCustomQuery.js";
import { useCustom } from "../../Store/Store";
import FilterSection from "../../components/reusable/FilterSection.js";
import InputField from "../../components/reusable/InputField";
import SelectField from "../../components/reusable/SelectField";
import { useDebounce } from "../../components/hooks/useDebounce";

// --- Interfaces ---
interface RoomInfo {
  _id: string;
  room_no: string;
}

interface Complaint {
  _id: string;
  room_id: RoomInfo;
  title: string;
  category: 'Electrical' | 'Plumbing' | 'Cleaning' | 'Furniture' | 'Other';
  status: 'Pending' | 'Resolved' | 'In Progress' | 'Approved' | 'Rejected';
}

interface FilterState {
  room_no: string;
  category: string;
  status: string;
}

interface ApiResponse {
  data: Complaint[];
  total?: number;
}

const Complaints: React.FC = () => {
  const { token } = useCustom();

  // --- State ---
  const [instantVal, setInstantVal] = useState<FilterState>({
    room_no: "",
    category: "",
    status: ""
  });

  const [filterVal, setFilterVal] = useState<FilterState>({
    room_no: "",
    category: "",
    status: ""
  });

  const [currentPage, setCurrentPage] = useState<number>(1);

  // --- Data Fetching ---
  const { data } = useCustomQuery(
    `/api/admin/complaint?room_no=${filterVal.room_no}&category=${filterVal.category}&status=${filterVal.status}`,
    token,
    filterVal.room_no,
    filterVal.category,
    filterVal.status
  );

  const memoizedData = useMemo(() => data?.data || [], [data]);

  // --- Handlers & Debounce ---
  const updateFilter = useDebounce((name: string, value: string) => {
    setFilterVal((prev) => ({
      ...prev,
      [name]: value
    }));
  }, 500);

  const handleFilterChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setInstantVal((prev) => ({
      ...prev,
      [name]: value
    }));
    updateFilter(name, value);
  };

  // Action Placeholders (Required for JSX to compile)
  const handleViewRoom = (id: string) => console.log("View", id);
  const handleEdit = (id: string) => console.log("Edit", id);
  const handleDelete = (index: number) => console.log("Delete index", index);

  // --- Helper Functions ---
  const getStatusBadge = (status: Complaint['status']): JSX.Element => {
    const statusConfig: Record<string, { label: string; class: string }> = {
      Pending: { label: 'Pending', class: 'badge-pending' },
      Approved: { label: 'Approved', class: 'badge-approved' },
      Rejected: { label: 'Rejected', class: 'badge-rejected' },
      Resolved: { label: 'Resolved', class: 'badge-approved' }, // Added based on SelectField options
      'In Progress': { label: 'In Progress', class: 'badge-pending' }
    };

    const config = statusConfig[status] || { label: status, class: 'badge-default' };
    return <span className={`status-badge ${config.class}`}>{config.label}</span>;
  };

  return (
    <div className="expenses-page">
      <div className="page-header">
        <h2>
          <i className="fa-solid fa-exclamation-circle me-2"></i>
          Complaints Management
        </h2>
        <p>Track and manage all hostel complaints</p>
      </div>

      <FilterSection heading={"Filter Complaints"}>
        <InputField
          type={"text"}
          name={"room_no"}
          value={instantVal.room_no}
          onChange={handleFilterChange}
          id={"room_no"}
          label={"Room Number"}
          placeholder={"Enter Room Number"}
        />
        <SelectField
          name={"category"}
          value={instantVal.category}
          onChange={handleFilterChange}
          id={"category"}
          label={"Complain Type"}
        >
          <option value="">Select Any Category</option>
          <option value={'Electrical'}>Electrical</option>
          <option value={'Plumbing'}>Plumbing</option>
          <option value={'Cleaning'}>Cleaning</option>
          <option value={'Furniture'}>Furniture</option>
          <option value={'Other'}>Other</option>
        </SelectField>
        <SelectField
          name={"status"}
          id={"status"}
          value={instantVal.status}
          onChange={handleFilterChange}
          label={"Complain Status"}
        >
          <option value="">Select Any Status</option>
          <option value={'Pending'}>Pending</option>
          <option value={'Resolved'}>Resolved</option>
          <option value={'In Progress'}>In Progress</option>
        </SelectField>
      </FilterSection>

      <div className="expenses-table-section">
        <div className="section-card">
          <div className="card-header-enhanced">
            <h3 className="card-title">Complaints List</h3>
          </div>

          <div className="table-container">
            <div className="table-responsive">
              <table className="expenses-table">
                <thead>
                  <tr>
                    <th>Room</th>
                    <th>Title</th>
                    <th>Category</th>
                    <th className="amount-column">Status</th>
                    <th className="actions-column">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {memoizedData.length > 0 ? (
                    memoizedData.map((complaint:Complaint, index:number) => (
                      <tr key={complaint._id || index} className="expense-row">
                        <td className="description-cell">
                          {complaint?.room_id?.room_no}
                        </td>
                        <td className="description-cell">
                          {complaint?.title}
                        </td>
                        <td className="description-cell">
                          {complaint?.category}
                        </td>
                        <td className="description-cell">
                          {getStatusBadge(complaint?.status)}
                        </td>
                        <td className="actions-cell">
                          <div className="action-buttons">
                            <button
                              className="action btn btn-sm btn-view"
                              title="View Details"
                              onClick={() => handleViewRoom(complaint._id)}
                            >
                              <i className="fas fa-eye"></i>
                            </button>
                            <button
                              className="action btn btn-sm btn-edit"
                              onClick={() => handleEdit(complaint._id)}
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
                      <td colSpan={5} className="no-data">
                        <i className="fas fa-inbox me-2"></i>
                        No Complaints found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {/* Pagination */}
            <Pagination 
              currentPage={currentPage} 
              setCurrentPage={setCurrentPage} 
              length={memoizedData.length} 
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Complaints;