import { useEffect, useState } from "react";
import Pagination from "../../components/Layout/Pagination";
import useCustomQuery from "../../components/hooks/useCustomQuery";
import { useCustom } from "../../Store/Store";
import FilterSection from "../../components/reusable/FilterSection";
import InputField from "../../components/reusable/InputField";
import SelectField from "../../components/reusable/SelectField";
import { useDebounce } from "../../components/hooks/useDebounce";
import { useMemo } from "react";

const Complaints=()=>{
    const {token}=useCustom();
    const [instantVal,setInstantVal]=useState({
      room_no:"",
      category:"",
      status:""
    });
    const [filterVal,setFilterVal]=useState({ 
       room_no:"",
      category:"",
      status:""});
      const [currentPage, setCurrentPage] = useState(1);
      const {data}=useCustomQuery(`/api/admin/complaint?room_no=${filterVal.room_no}&category=${filterVal.category}&status=${filterVal.status}`,token,filterVal.room_no,filterVal.category,filterVal.status);
      const memoizedData=useMemo(()=>data?.data || [{}],[data]);
      const updateFilter=useDebounce((name,value)=>{
        setFilterVal((prev)=>{
          return {...prev,[name]:value};
        })
      },500);
      const handleFilterChange=(e)=>{
        const {name,value}=e.target;
        setInstantVal((prev)=>{
          return {...prev,[name]:value};
        });
        updateFilter(name,value);
      };
       const getStatusBadge = (status) => {
    const statusConfig = {
      Pending: { label: 'Pending', class: 'badge-pending' },
      Approved: { label: 'Approved', class: 'badge-approved' },
      Rejected: { label: 'Rejected', class: 'badge-rejected' }
    };

    const config = statusConfig[status] || { label: status, class: 'badge-default' };
    return <span className={`status-badge ${config.class}`}>{config.label}</span>;
  };
    return <div className="expenses-page">
           <div className="page-header">
        <h2>
          <i className="fa-solid fa-exclamation-circle"></i>
          Complaints Management
        </h2>
        <p>Track and manage all hostel complaints</p>
      </div>
      <FilterSection heading={"Filter Complaints"}>
        <InputField type={"text"} name={"room_no"} value={instantVal.room_no} onChange={handleFilterChange} id={"room_no"} label={"Room Number"} placeholder={"Enter Room Number"}  />
        <SelectField name={"category"} value={instantVal.category} onChange={handleFilterChange} id={"category"} label={"Complain Type"}>
          <option >Select Any Category</option>
          <option value={'Electrical'}>Electrical</option>
          <option value={'Plumbing'}>Plumbing</option>
          <option value={'Cleaning'}>Cleaning</option>
          <option value={'Furniture'}>Furniture</option>
          <option value={'Other'}>Other</option>
        </SelectField>
        <SelectField name={"status"} id={"status"} value={instantVal.status} onChange={handleFilterChange} label={"Complain Status"}>
          <option >Select Any Status</option>
          <option value={'Pending'}>Pending</option>
          <option value={'Resolved'}>Resolved</option>
          <option value={'In Progress'}>In Progress</option>
        </SelectField>
      </FilterSection>
            <div className="expenses-table-section">
        <div className="section-card">
          <div className="card-header-enhanced">
            <h3 className="card-title">
              {/* <i className="fa-solid fa-exclamation-circle"></i> */}
              Complaints List
            </h3>
            <div className="total-expenses">
              {/* Total Expenses: <span className="total-amount">PKR {totalExpenses.toLocaleString()}</span> */}
            </div>
          </div>

          <div className="table-container">
            <div className="table-responsive">
              <table className="expenses-table">
                <thead>
                  <tr>
                    <th>Room</th>
                    <th>title</th>
                    <th>category</th>
                    <th className="amount-column">status</th>
                    <th className="actions-column">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.data?.length > 0 ? (
                    data?.data?.map((complaint, index) => (
                      <tr key={index} className="expense-row">
                        <td className="description-cell">
                          {complaint?.room_id?.room_no}
                        </td>
                        <td className="description-cell">
                          {`${complaint?.title}`}
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
                              className="btn btn-sm btn-view"
                              title="View Details"
                              onClick={() => handleViewRoom(complaint._id)}
                            >
                              <i className="fas fa-eye"></i>
                            </button>
                            <button
                              className="btn btn-sm btn-edit"
                              onClick={() => handleEdit(complaint._id)}
                              title="Edit"
                            >
                              <i className="fas fa-edit"></i>
                            </button>
                            <button
                              className="btn btn-sm btn-delete"
                              onClick={() => handleDelete(data?.findIndex(e => e.id === complaint?._id))}
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
                      <td colSpan="5" className="no-data">
                        <i className="fas fa-inbox"></i>
                        No Complaints found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
                {/* Pagination */}
                <Pagination currentPage={currentPage} setCurrentPage={setCurrentPage} />
     
          </div>
        </div>
      </div>
    </div>
};
export default Complaints;