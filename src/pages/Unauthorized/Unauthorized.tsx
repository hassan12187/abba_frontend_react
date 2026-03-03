import React from 'react';
import { useNavigate, useRouteError } from 'react-router-dom';
import './Unauthorized.css';

const Unauthorized = ({title,info}) => {
  const error = useRouteError();
  const navigate = useNavigate();
  
  return (
    <div className="unauthorized-page">
      <div className="unauthorized-container">
        <div className="unauthorized-content">
          <div className="error-icon">
            <i className="fas fa-ban"></i>
          </div>
          <h1>{title}</h1>
          <p>{info}</p>
          <div className="action-buttons">
            <button 
              className="btn btn-primary" 
              onClick={() => navigate('/')}
            >
              <i className="fas fa-home"></i>
              Go to Dashboard
            </button>
            <button 
              className="btn btn-secondary"
              onClick={() => navigate(-1)}
            >
              <i className="fas fa-arrow-left"></i>
              Go Back
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Unauthorized;