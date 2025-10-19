const Modal=({setShowModal,headings,modalTitle})=>{
        return <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">
                <i className="fas fa-user-graduate"></i>
                {modalTitle}
              </h3>
              <button 
                className="modal-close" 
                onClick={() => setShowModal(false)}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>

            <div className="modal-body">
              <div className="student-header">
                <div className="student-id">
                  <h4>Room Name: <span>{"-"}</span></h4>
                </div>
                <div className="student-status">
                  {/* {getStatusBadge(specificStudent?.status)} */}
                </div>
              </div>

              <div className="details-grid">
                <div className="detail-section">
                  <h5 className="section-title">
                    <i className="fas fa-user"></i>
                    Room Information
                  </h5>
                  <div className="detail-row">
                    {
                        headings.map(heading=>{
                            return heading;
                        })
                    }
                    {/* <div className="detail-group">
                      <label>Room Number</label>
                      <p></p>
                    </div>
                    <div className="detail-group">
                      <label>Total Beds</label>
                      <p></p>
                    </div>
                    <div className="detail-group">
                      <label>Available Beds</label>
                      <p></p>
                    </div>
                    <div className="detail-group">
                      <label>Block No.</label>
                      <p></p>
                    </div>
                    <div className="detail-group">
                      <label>Mobile</label>
                      <p></p>
                    </div> */}
                  </div>
                </div>
            
              </div>
            </div>

            {/* <div className="modal-footer">
              <button 
                className="btn btn-secondary" 
                onClick={() => setShowModal(false)}
              >
                Close
              </button>
              <div className="action-buttons">
                  <button 
                    className="btn btn-success"
                  >
                    <i className="fas fa-door-open"></i>
                    Assign Room & Approve
                  </button>
                  <button 
                    className="btn btn-danger"
                  >
                    <i className="fas fa-times"></i>
                    Reject
                  </button>
              </div>
            </div> */}
          </div>
        </div>
};
export default Modal;