import React, { useEffect, useState, memo, type ReactNode, type ChangeEvent } from "react";
import InputField from "./InputField";
import SelectField from "./SelectField";

// Use the interfaces defined above
interface Field {
  name: string;
  type: string;
  id: string;
  label?: string;
  placeholder?: string;
  options?: ReactNode;
}

interface ModalProps {
  data?: any;
  removeMutate?: {
    mutate: (id: string) => void;
  };
  setShowModal: React.Dispatch<React.SetStateAction<any>>;
  mode: "view" | "edit"|"";
  fields: Field[];
  modalTitle: string;
  actionButtons?: ReactNode;
}

const Modal = memo(({ 
  data = {}, 
  removeMutate, 
  setShowModal, 
  mode, 
  fields = [], 
  modalTitle, 
  actionButtons 
}: ModalProps) => {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [occupantsVisible, setOccupantsVisible] = useState(true);

  // Added proper typing for the change handler
  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  useEffect(() => {
    if (data && fields.length > 0) {
      const initialData: Record<string, any> = {};
      fields.forEach((fie) => {
        initialData[fie.name] = data[fie.name] || "";
      });

      setFormData((prev) => {
        const isSame =
          Object.keys(initialData).length === Object.keys(prev).length &&
          Object.keys(initialData).every((key) => initialData[key] === prev[key]);
        return isSame ? prev : initialData;
      });
    }
  }, [data, fields]);

  const renderField = (field: Field) => {
    const name = field.name;
    const value = formData[name] || "";
    
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
            readOnly={mode === "view"}
            onChange={handleChange}
            label={field.label}
            placeholder={field.placeholder}
          />
        );
      case "select":
        return (
          <SelectField 
            key={name} 
            id={field.id} 
            name={name}
            onChange={handleChange} 
            label={field.label} 
            value={value}
          >
            {field.options}
          </SelectField>
        );
      case "textarea":
        return (
          <div className="filter-group" key={name}>
            <label htmlFor={field.id}>{field.label}</label>
            <textarea 
              name={name} 
              value={value} 
              id={field.id} 
              onChange={handleChange} 
              placeholder={field.placeholder} 
              className="form-control" 
            />
          </div>
        );
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
            onClick={() => setShowModal((prev: any) => ({ ...prev, show: false }))}
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

            {Array.isArray(data?.occupants) && (
              <div className="detail-section occupants-section">
                <div className="occupants-header" onClick={() => setOccupantsVisible((prev) => !prev)}>
                  <h5 className="section-title">
                    <i className="fas fa-users"></i> Occupants
                    <span className="occupant-count">
                      {data.occupants.length} {data.occupants.length === 1 ? "Person" : "People"}
                    </span>
                  </h5>
                  <i className={`fas fa-chevron-${occupantsVisible ? "up" : "down"} toggle-icon`}></i>
                </div>

                {occupantsVisible && (
                  <div className="occupants-content">
                    {data.occupants.length === 0 ? (
                      <div className="no-occupants">
                        <i className="fas fa-user-slash"></i>
                        <p>No occupants currently assigned.</p>
                      </div>
                    ) : (
                      <div className="occupants-grid">
                        {data.occupants.map((student: any, index: number) => (
                          <div className="occupant-card" key={index}>
                            <div className="occupant-avatar">
                              <i className="fas fa-user-circle"></i>
                            </div>
                            <div className="occupant-info">
                              <h4 className="occupant-name">{student.student_name || "Unnamed"}</h4>
                              <p className="occupant-meta">
                                <i className="fas fa-id-badge"></i> {student.student_roll_no || "N/A"}
                              </p>
                            </div>
                            <div className="occupant-actions">
                              <button 
                                className="btn-remove" 
                                title="Remove" 
                                onClick={() => removeMutate?.mutate(student._id)}
                              >
                                <i className="fas fa-user-minus"></i>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={() => setShowModal((prev: any) => ({ ...prev, show: false }))}>
            Close
          </button>
          {mode === "edit" && actionButtons && (
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