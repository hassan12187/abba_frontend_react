import { useState } from "react";
import Pagination from "../../components/Layout/Pagination";
import useCustomQuery from "../../components/hooks/useCustomQuery";
import { useCustom } from "../../Store/Store";

const Complaints=()=>{
    const {token}=useCustom();
      const [currentPage, setCurrentPage] = useState(1);
      const {data}=useCustomQuery(`/api/admin/complaint`,token,'complaints');
      console.log(data);
    return <div className="expenses-page">
           <div className="page-header">
        <h2>
          <i className="fa-solid fa-exclamation-circle"></i>
          Complaints Management
        </h2>
        <p>Track and manage all hostel complaints</p>
      </div>
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
                    <th className="date-column">Assigned To</th>
                    <th className="actions-column">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.data?.length > 0 ? (
                    data?.data?.map((expense, index) => (
                      <tr key={index} className="expense-row">
                        <td>
                          {getExpenseTypeBadge(expense?.expense_type)}
                        </td>
                        <td className="description-cell">
                          {expense?.description}
                        </td>
                        <td className="amount-cell">
                          PKR {expense.amount.toLocaleString()}
                        </td>
                        <td className="date-cell">
                          {new Date(expense.date).toLocaleDateString()}
                        </td>
                        <td className="actions-cell">
                          <div className="action-buttons">
                            <button
                              className="btn btn-sm btn-edit"
                              onClick={() => handleEdit(expense._id)}
                              title="Edit"
                            >
                              <i className="fas fa-edit"></i>
                            </button>
                            <button
                              className="btn btn-sm btn-delete"
                              onClick={() => handleDelete(data?.findIndex(e => e.id === expense?._id))}
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