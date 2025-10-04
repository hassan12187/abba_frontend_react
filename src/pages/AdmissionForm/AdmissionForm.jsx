import React, { useState } from 'react';
import './AdmissionForm.css';

const AdmissionForm = () => {
  const [formData, setFormData] = useState({
    rollNo: '',
    academicYear: '',
    fullName: '',
    fatherName: '',
    cnic: '',
    dob: '',
    gender: '',
    student_email: '',
    mobileNo: '',
    active_whatsapp_no: '',
    guardianName: '',
    guardianNo: '',
    postalAddress: '',
    permanentAddress: '',
    city: '',
    province: '',
    reason_for_applying: '',
    studentPic: null,
    challanReceipt: null
  });

  const [errors, setErrors] = useState({});

  const handleInputChange = (e) => {
    const { id, value, files } = e.target;
    
    if (files) {
      setFormData(prev => ({
        ...prev,
        [id]: files[0]
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [id]: value
      }));
    }

    // Clear error when user starts typing
    if (errors[id]) {
      setErrors(prev => ({
        ...prev,
        [id]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Required field validation
    const requiredFields = [
      'rollNo', 'academicYear', 'fullName', 'fatherName', 'cnic', 'dob',
      'gender', 'student_email', 'mobileNo', 'active_whatsapp_no',
      'guardianName', 'guardianNo', 'postalAddress', 'permanentAddress',
      'city', 'province'
    ];

    requiredFields.forEach(field => {
      if (!formData[field]) {
        newErrors[field] = 'This field is required';
      }
    });

    // Email validation
    if (formData.student_email && !/\S+@\S+\.\S+/.test(formData.student_email)) {
      newErrors.student_email = 'Please enter a valid email address';
    }

    // CNIC validation (basic format check)
    if (formData.cnic && !/^\d{5}-\d{7}-\d{1}$/.test(formData.cnic)) {
      newErrors.cnic = 'CNIC format: xxxxx-xxxxxxx-x';
    }

    // Mobile number validation
    if (formData.mobileNo && !/^\d{11}$/.test(formData.mobileNo)) {
      newErrors.mobileNo = 'Please enter a valid 11-digit mobile number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      // Form submission logic here
      console.log('Form submitted:', formData);
      alert('Admission form submitted successfully!');
      
      // Reset form after submission
      setFormData({
        rollNo: '',
        academicYear: '',
        fullName: '',
        fatherName: '',
        cnic: '',
        dob: '',
        gender: '',
        student_email: '',
        mobileNo: '',
        active_whatsapp_no: '',
        guardianName: '',
        guardianNo: '',
        postalAddress: '',
        permanentAddress: '',
        city: '',
        province: '',
        reason_for_applying: '',
        studentPic: null,
        challanReceipt: null
      });
    }
  };

  return (
    <div className="admission-form-page">
      <div className="form-container">
        <div className="form-header">
          <h2>
            <i className="fas fa-user-graduate"></i>
            Hostel Admission Form
          </h2>
          <p>Complete the form below to apply for hostel accommodation</p>
        </div>

        <form onSubmit={handleSubmit} className="admission-form">
          <div className="form-section">
            <h4 className="section-title">
              <i className="fas fa-user"></i>
              Student Information
            </h4>
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="rollNo" className="form-label">
                  Student Roll No <span className="required">*</span>
                </label>
                <input
                  type="number"
                  id="rollNo"
                  className={`form-control ${errors.rollNo ? 'error' : ''}`}
                  value={formData.rollNo}
                  onChange={handleInputChange}
                  placeholder="Enter roll number"
                />
                {errors.rollNo && <span className="error-message">{errors.rollNo}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="academicYear" className="form-label">
                  Academic Year <span className="required">*</span>
                </label>
                <input
                  type="text"
                  id="academicYear"
                  className={`form-control ${errors.academicYear ? 'error' : ''}`}
                  value={formData.academicYear}
                  onChange={handleInputChange}
                  placeholder="2024-2025"
                />
                {errors.academicYear && <span className="error-message">{errors.academicYear}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="fullName" className="form-label">
                  Full Name <span className="required">*</span>
                </label>
                <input
                  type="text"
                  id="fullName"
                  className={`form-control ${errors.fullName ? 'error' : ''}`}
                  value={formData.fullName}
                  onChange={handleInputChange}
                  placeholder="Enter full name"
                />
                {errors.fullName && <span className="error-message">{errors.fullName}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="fatherName" className="form-label">
                  Father's Name <span className="required">*</span>
                </label>
                <input
                  type="text"
                  id="fatherName"
                  className={`form-control ${errors.fatherName ? 'error' : ''}`}
                  value={formData.fatherName}
                  onChange={handleInputChange}
                  placeholder="Enter father's name"
                />
                {errors.fatherName && <span className="error-message">{errors.fatherName}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="cnic" className="form-label">
                  CNIC <span className="required">*</span>
                </label>
                <input
                  type="text"
                  id="cnic"
                  className={`form-control ${errors.cnic ? 'error' : ''}`}
                  value={formData.cnic}
                  onChange={handleInputChange}
                  placeholder="xxxxx-xxxxxxx-x"
                />
                {errors.cnic && <span className="error-message">{errors.cnic}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="dob" className="form-label">
                  Date of Birth <span className="required">*</span>
                </label>
                <input
                  type="date"
                  id="dob"
                  className={`form-control ${errors.dob ? 'error' : ''}`}
                  value={formData.dob}
                  onChange={handleInputChange}
                />
                {errors.dob && <span className="error-message">{errors.dob}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="gender" className="form-label">
                  Gender <span className="required">*</span>
                </label>
                <select
                  id="gender"
                  className={`form-control ${errors.gender ? 'error' : ''}`}
                  value={formData.gender}
                  onChange={handleInputChange}
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
                {errors.gender && <span className="error-message">{errors.gender}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="student_email" className="form-label">
                  Email <span className="required">*</span>
                </label>
                <input
                  type="email"
                  id="student_email"
                  className={`form-control ${errors.student_email ? 'error' : ''}`}
                  value={formData.student_email}
                  onChange={handleInputChange}
                  placeholder="Enter email address"
                />
                {errors.student_email && <span className="error-message">{errors.student_email}</span>}
              </div>
            </div>
          </div>

          <div className="form-section">
            <h4 className="section-title">
              <i className="fas fa-phone"></i>
              Contact Information
            </h4>
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="mobileNo" className="form-label">
                  Mobile No <span className="required">*</span>
                </label>
                <input
                  type="text"
                  id="mobileNo"
                  className={`form-control ${errors.mobileNo ? 'error' : ''}`}
                  value={formData.mobileNo}
                  onChange={handleInputChange}
                  placeholder="03xx-xxxxxxx"
                />
                {errors.mobileNo && <span className="error-message">{errors.mobileNo}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="active_whatsapp_no" className="form-label">
                  Active WhatsApp No <span className="required">*</span>
                </label>
                <input
                  type="text"
                  id="active_whatsapp_no"
                  className={`form-control ${errors.active_whatsapp_no ? 'error' : ''}`}
                  value={formData.active_whatsapp_no}
                  onChange={handleInputChange}
                  placeholder="03xx-xxxxxxx"
                />
                {errors.active_whatsapp_no && <span className="error-message">{errors.active_whatsapp_no}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="guardianName" className="form-label">
                  Guardian Name <span className="required">*</span>
                </label>
                <input
                  type="text"
                  id="guardianName"
                  className={`form-control ${errors.guardianName ? 'error' : ''}`}
                  value={formData.guardianName}
                  onChange={handleInputChange}
                  placeholder="Enter guardian's name"
                />
                {errors.guardianName && <span className="error-message">{errors.guardianName}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="guardianNo" className="form-label">
                  Guardian Contact No <span className="required">*</span>
                </label>
                <input
                  type="text"
                  id="guardianNo"
                  className={`form-control ${errors.guardianNo ? 'error' : ''}`}
                  value={formData.guardianNo}
                  onChange={handleInputChange}
                  placeholder="03xx-xxxxxxx"
                />
                {errors.guardianNo && <span className="error-message">{errors.guardianNo}</span>}
              </div>
            </div>
          </div>

          <div className="form-section">
            <h4 className="section-title">
              <i className="fas fa-home"></i>
              Address Information
            </h4>
            <div className="form-grid">
              <div className="form-group full-width">
                <label htmlFor="postalAddress" className="form-label">
                  Postal Address <span className="required">*</span>
                </label>
                <textarea
                  id="postalAddress"
                  className={`form-control ${errors.postalAddress ? 'error' : ''}`}
                  value={formData.postalAddress}
                  onChange={handleInputChange}
                  rows="3"
                  placeholder="Enter postal address"
                />
                {errors.postalAddress && <span className="error-message">{errors.postalAddress}</span>}
              </div>

              <div className="form-group full-width">
                <label htmlFor="permanentAddress" className="form-label">
                  Permanent Address <span className="required">*</span>
                </label>
                <textarea
                  id="permanentAddress"
                  className={`form-control ${errors.permanentAddress ? 'error' : ''}`}
                  value={formData.permanentAddress}
                  onChange={handleInputChange}
                  rows="3"
                  placeholder="Enter permanent address"
                />
                {errors.permanentAddress && <span className="error-message">{errors.permanentAddress}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="city" className="form-label">
                  City <span className="required">*</span>
                </label>
                <input
                  type="text"
                  id="city"
                  className={`form-control ${errors.city ? 'error' : ''}`}
                  value={formData.city}
                  onChange={handleInputChange}
                  placeholder="Enter city"
                />
                {errors.city && <span className="error-message">{errors.city}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="province" className="form-label">
                  Province <span className="required">*</span>
                </label>
                <input
                  type="text"
                  id="province"
                  className={`form-control ${errors.province ? 'error' : ''}`}
                  value={formData.province}
                  onChange={handleInputChange}
                  placeholder="Enter province"
                />
                {errors.province && <span className="error-message">{errors.province}</span>}
              </div>
            </div>
          </div>

          <div className="form-section">
            <h4 className="section-title">
              <i className="fas fa-paperclip"></i>
              Documents & Additional Information
            </h4>
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="studentPic" className="form-label">
                  Upload Picture <span className="required">*</span>
                </label>
                <input
                  type="file"
                  id="studentPic"
                  className="form-control"
                  onChange={handleInputChange}
                  accept="image/*"
                />
                <small className="file-hint">Accepted formats: JPG, PNG, JPEG</small>
              </div>

              <div className="form-group">
                <label htmlFor="challanReceipt" className="form-label">
                  Upload CNIC <span className="required">*</span>
                </label>
                <input
                  type="file"
                  id="challanReceipt"
                  className="form-control"
                  onChange={handleInputChange}
                  accept="image/*,.pdf"
                />
                <small className="file-hint">Accepted formats: JPG, PNG, PDF</small>
              </div>

              <div className="form-group full-width">
                <label htmlFor="reason_for_applying" className="form-label">
                  Reason For Applying
                </label>
                <textarea
                  id="reason_for_applying"
                  className="form-control"
                  value={formData.reason_for_applying}
                  onChange={handleInputChange}
                  rows="4"
                  placeholder="Please explain why you need hostel accommodation..."
                />
              </div>
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" className="submit-btn">
              <i className="fas fa-paper-plane"></i>
              Submit Application
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdmissionForm;