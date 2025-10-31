import { useEffect, useState, memo } from "react";
import InputField from "./InputField";
import SelectField from "./SelectField";

const Modal = memo(({ data = {},removeMutate, setShowModal, mode, fields = [], modalTitle, actionButtons }) => {
  const [formData, setFormData] = useState({});
  const [occupantsVisible, setOccupantsVisible] = useState(true);

  const handleChange=()=>{};
  useEffect(() => {
    if (data && fields.length > 0) {
      const initialData = {};
      fields.forEach((fie) => {
        initialData[fie.name] = data[fie.name] || "";
      });

      // ✅ Only update state if data actually changed
      setFormData((prev) => {
        const isSame =
          Object.keys(initialData).length === Object.keys(prev).length &&
          Object.keys(initialData).every((key) => initialData[key] === prev[key]);
        return isSame ? prev : initialData;
      });
    }
  }, [data, fields]);

  const renderField = (field) => {
    const name = field?.name;
    const value = formData[name] || "";
    console.log(name , value);
    switch (field.type) {
      case "email":
      case "text":
      case "password":
      case "number":
      case "date":
        return (
          <InputField
            key={name}
            type={field.type}
            id={field.id}
            value={value}
            name={name}
            readOnly={mode == "view"?true:false}
            onChange={handleChange}
            label={field.label}
            placeholder={field.placeholder}
          />
        );
      case "select":
        return (
          <SelectField key={name} id={field.id} onChange={handleChange} label={field.label} value={value} name={name}>
            {field.options}
          </SelectField>
        );
      case "textarea":
        return <div className="filter-group">
          <label htmlFor={field.id}>{field.label}</label>
        <textarea name={name} value={value} id={field.id} onChange={handleChange} placeholder={field.placeholder} className="form-control" ></textarea>
        </div>
      default:
        return null;
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h3 className="modal-title">
            <i className="fas fa-user-graduate"></i> {modalTitle}
          </h3>
          <button
            className="modal-close"
            onClick={() => setShowModal((prev) => ({ ...prev, show: false }))}
          >
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className="modal-body">
          <div className="details-grid">
            <div className="detail-section">
              <h5 className="section-title">
                <i className="fas fa-user"></i> {modalTitle}
              </h5>
              <div className="detail-row">{fields?.map(renderField)}</div>
            </div>
         {/* ✅ Modern Occupants Section */}
{Array.isArray(data?.occupants) && (
  <div className="detail-section occupants-section">
    <div className="occupants-header" onClick={() => setOccupantsVisible((prev) => !prev)}>
      <h5 className="section-title">
        <i className="fas fa-users"></i> Occupants
        <span className="occupant-count">
          {data.occupants.length} {data.occupants.length === 1 ? "Person" : "People"}
        </span>
      </h5>
      <i
        className={`fas fa-chevron-${occupantsVisible ? "up" : "down"} toggle-icon`}
      ></i>
    </div>

    {occupantsVisible && (
      <>
        {data.occupants.length === 0 ? (
          <div className="no-occupants">
            <i className="fas fa-user-slash"></i>
            <p>No occupants currently assigned.</p>
          </div>
        ) : (
          <div className="occupants-grid">
            {data.occupants.map((student, index) => (
              <div className="occupant-card" key={index}>
                <div className="occupant-avatar">
                  <i className="fas fa-user-circle"></i>
                </div>
                <div className="occupant-info">
                  <h4 className="occupant-name">{student.student_name || "Unnamed"}</h4>
                  <p className="occupant-meta">
                    <i className="fas fa-id-badge"></i> {student.student_roll_no || "N/A"}
                  </p>
                  {student.department && (
                    <p className="occupant-meta">
                      <i className="fas fa-building"></i> {student.department}
                    </p>
                  )}
                </div>
                <div className="occupant-actions">
                  <button className="btn-view" title="View Student">
                    <i className="fas fa-eye"></i>
                  </button>
                  <button className="btn-remove" title="Remove from Room" onClick={()=>removeMutate.mutate(student._id)}>
                    <i className="fas fa-user-minus"></i>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </>
    )}
  </div>
)}

          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={() => setShowModal(false)}>
            Close
          </button>
          {mode === "edit" && (
            <div className="action-buttons" style={{ margin: "0 4px" }}>
              {actionButtons}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

export default Modal;
