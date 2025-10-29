import React, { useState } from 'react';
import './AdmissionForm.css';
import { PostService } from '../../Services/Services';
import Axios from '../../Services/Axios';
import { useSnackbar } from 'notistack';

const AdmissionForm = () => {
  const [formData, setFormData] = useState({
    student_roll_no: '',
    academic_year: '',
    student_name: '',
    father_name: '',
    cnic_no: '',
    date_of_birth: '',
    gender: '',
    student_email: '',
    student_cellphone: '',
    active_whatsapp_no: '',
    guardian_name: '',
    guardian_cellphone: '',
    postal_address: '',
    permanent_address: '',
    city: '',
    province: '',
    reason_for_applying: '',
    studentPic: null,
    challanReceipt: null  
  });
  const {enqueueSnackbar,closeSnackbar}=useSnackbar();
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
      'student_roll_no', 'academic_year', 'student_name', 'father_name', 'cnic_no', 'date_of_birth',
      'gender', 'student_email', 'student_cellphone', 'active_whatsapp_no',
      'guardian_name', 'guardian_cellphone', 'postal_address', 'permanent_address',
      'city', 'province'
    ];

    requiredFields.forEach(field => {
      console.log(formData);
      if (!formData[field]) {
        newErrors[field] = 'This field is required';
      }
    }); 

    // Email validation
    if (formData.student_email && !/\S+@\S+\.\S+/.test(formData.student_email)) {
      newErrors.student_email = 'Please enter a valid email address';
    }

    // CNIC validation (basic format check)
    if (formData.cnic_no && !/^\d{5}-\d{7}-\d{1}$/.test(formData.cnic_no)) {
      newErrors.cnic_no = 'CNIC format: xxxxx-xxxxxxx-x';
    }

    // Mobile number validation
    if (formData.student_cellphone && !/^\d{11}$/.test(formData.student_cellphone)) {
      newErrors.student_cellphone = 'Please enter a valid 11-digit mobile number';
    }
    
    setErrors(newErrors);
    console.log(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async(e) => {
    e.preventDefault();
    enqueueSnackbar("I Love snackbar",{
      autoHideDuration:3000,
      variant:"success",
      anchorOrigin:{
        horizontal:"right",
        vertical:"top"
      }
    })
       console.log(validateForm());
    
      console.log("im herebroo");
      // Form submission logic here
     try {
        const result = await Axios.post('/static/admission-form',formData,{
        });
        console.log(result);
        if(result.status==200){
          toast.success(result.data.data);
        }
      } catch (error) {
        console.log(error);
      }  
//       // Reset form after submission
// setFormData({
//   student_roll_no: '',
//   academic_year: '',
//   student_name: '',
//   father_name: '',
//   cnic_no: '',
//   date_of_birth: '',
//   gender: '',
//   student_email: '',
//   student_cellphone: '',
//   active_whatsapp_no: '',
//   guardian_name: '',
//   guardian_cellphone: '',
//   postal_address: '',
//   permanent_address: '',
//   city: '',
//   province: '',
//   reason_for_applying: '',
//   studentPic: null,
//   challanReceipt: null
// });

//     }
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
        <label htmlFor="student_roll_no" className="form-label">
          Student Roll No <span className="required">*</span>
        </label>
        <input
          type="number"
          id="student_roll_no"
          name="student_roll_no"
          className={`form-control ${errors.student_roll_no ? "error" : ""}`}
          value={formData.student_roll_no}
          onChange={handleInputChange}
          placeholder="Enter roll number"
        />
        {errors.student_roll_no && <span className="error-message">{errors.student_roll_no}</span>}
      </div>

      <div className="form-group">
        <label htmlFor="academic_year" className="form-label">
          Academic Year <span className="required">*</span>
        </label>
        <input
          type="text"
          id="academic_year"
          name="academic_year"
          className={`form-control ${errors.academic_year ? "error" : ""}`}
          value={formData.academic_year}
          onChange={handleInputChange}
          placeholder="2024-2025"
        />
        {errors.academic_year && <span className="error-message">{errors.academic_year}</span>}
      </div>

      <div className="form-group">
        <label htmlFor="student_name" className="form-label">
          Full Name <span className="required">*</span>
        </label>
        <input
          type="text"
          id="student_name"
          name="student_name"
          className={`form-control ${errors.student_name ? "error" : ""}`}
          value={formData.student_name}
          onChange={handleInputChange}
          placeholder="Enter full name"
        />
        {errors.student_name && <span className="error-message">{errors.student_name}</span>}
      </div>

      <div className="form-group">
        <label htmlFor="father_name" className="form-label">
          Father's Name <span className="required">*</span>
        </label>
        <input
          type="text"
          id="father_name"
          name='father_name'
          className={`form-control ${errors.father_name ? "error" : ""}`}
          value={formData.father_name}
          onChange={handleInputChange}
          placeholder="Enter father's name"
        />
        {errors.father_name && <span className="error-message">{errors.father_name}</span>}
      </div>

      <div className="form-group">
        <label htmlFor="cnic_no" className="form-label">
          CNIC <span className="required">*</span>
        </label>
        <input
          type="text"
          id="cnic_no"
          name='cnic_no'
          className={`form-control ${errors.cnic_no ? "error" : ""}`}
          value={formData.cnic_no}
          onChange={handleInputChange}
          placeholder="xxxxx-xxxxxxx-x"
        />
        {errors.cnic_no && <span className="error-message">{errors.cnic_no}</span>}
      </div>

      <div className="form-group">
        <label htmlFor="date_of_birth" className="form-label">
          Date of Birth <span className="required">*</span>
        </label>
        <input
          type="date"
          id="date_of_birth"
          name="date_of_birth"
          className={`form-control ${errors.date_of_birth ? "error" : ""}`}
          value={formData.date_of_birth}
          onChange={handleInputChange}
        />
        {errors.date_of_birth && <span className="error-message">{errors.date_of_birth}</span>}
      </div>

      <div className="form-group">
        <label htmlFor="gender" className="form-label">
          Gender <span className="required">*</span>
        </label>
        <select
          id="gender"
          name="gender"
          className={`form-control ${errors.gender ? "error" : ""}`}
          value={formData.gender}
          onChange={handleInputChange}
        >
          <option value="">Select Gender</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
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
          name="student_email"
          className={`form-control ${errors.student_email ? "error" : ""}`}
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
        <label htmlFor="student_cellphone" className="form-label">
          Mobile No <span className="required">*</span>
        </label>
        <input
          type="text"
          id="student_cellphone"
          name="student_cellphone"
          className={`form-control ${errors.student_cellphone ? "error" : ""}`}
          value={formData.student_cellphone}
          onChange={handleInputChange}
          placeholder="03xx-xxxxxxx"
        />
        {errors.student_cellphone && <span className="error-message">{errors.student_cellphone}</span>}
      </div>

      <div className="form-group">
        <label htmlFor="active_whatsapp_no" className="form-label">
          Active WhatsApp No <span className="required">*</span>
        </label>
        <input
          type="text"
          id="active_whatsapp_no"
          name="active_whatsapp_no"
          className={`form-control ${errors.active_whatsapp_no ? "error" : ""}`}
          value={formData.active_whatsapp_no}
          onChange={handleInputChange}
          placeholder="03xx-xxxxxxx"
        />
        {errors.active_whatsapp_no && <span className="error-message">{errors.active_whatsapp_no}</span>}
      </div>

      <div className="form-group">
        <label htmlFor="guardian_name" className="form-label">
          Guardian Name <span className="required">*</span>
        </label>
        <input
          type="text"
          id="guardian_name"
          name="guardian_name"
          className={`form-control ${errors.guardian_name ? "error" : ""}`}
          value={formData.guardian_name}
          onChange={handleInputChange}
          placeholder="Enter guardian's name"
        />
        {errors.guardian_name && <span className="error-message">{errors.guardian_name}</span>}
      </div>

      <div className="form-group">
        <label htmlFor="guardian_cellphone" className="form-label">
          Guardian Contact No <span className="required">*</span>
        </label>
        <input
          type="text"
          id="guardian_cellphone"
          name="guardian_cellphone"
          className={`form-control ${errors.guardian_cellphone ? "error" : ""}`}
          value={formData.guardian_cellphone}
          onChange={handleInputChange}
          placeholder="03xx-xxxxxxx"
        />
        {errors.guardian_cellphone && <span className="error-message">{errors.guardian_cellphone}</span>}
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
        <label htmlFor="postal_address" className="form-label">
          Postal Address <span className="required">*</span>
        </label>
        <textarea
          id="postal_address"
          name="postal_address"
          className={`form-control ${errors.postal_address ? "error" : ""}`}
          value={formData.postal_address}
          onChange={handleInputChange}
          rows="3"
          placeholder="Enter postal address"
        />
        {errors.postal_address && <span className="error-message">{errors.postal_address}</span>}
      </div>

      <div className="form-group full-width">
        <label htmlFor="permanent_address" className="form-label">
          Permanent Address <span className="required">*</span>
        </label>
        <textarea
          id="permanent_address"
          name="permanent_address"
          className={`form-control ${errors.permanent_address ? "error" : ""}`}
          value={formData.permanent_address}
          onChange={handleInputChange}
          rows="3"
          placeholder="Enter permanent address"
        />
        {errors.permanent_address && <span className="error-message">{errors.permanent_address}</span>}
      </div>

      <div className="form-group">
        <label htmlFor="city" className="form-label">
          City <span className="required">*</span>
        </label>
        <input
          type="text"
          id="city"
          name="city"
          className={`form-control ${errors.city ? "error" : ""}`}
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
          name="province"
          className={`form-control ${errors.province ? "error" : ""}`}
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
        <label htmlFor="student_image" className="form-label">
          Upload Picture <span className="required">*</span>
        </label>
        <input
          type="file"
          id="student_image"
          name="student_image"
          className="form-control"
          onChange={handleInputChange}
          accept="image/*"
        />
      </div>

      <div className="form-group">
        <label htmlFor="cnic_image" className="form-label">
          Upload CNIC <span className="required">*</span>
        </label>
        <input
          type="file"
          id="cnic_image"
          name="cnic_image"
          className="form-control"
          onChange={handleInputChange}
          accept="image/*,.pdf"
        />
      </div>

      <div className="form-group full-width">
        <label htmlFor="reason_for_applying" className="form-label">
          Reason For Applying
        </label>
        <textarea
          id="reason_for_applying"
          name="reason_for_applying"
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