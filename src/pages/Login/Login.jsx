import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import './Login.css';
import Axios from '../../Services/Axios';
import { useCustom } from '../../Store/Store';

const Login = () => {
  const {setToken}=useCustom();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [id]: value
    }));

    // Clear error when user starts typing
    // if (errors[id]) {
    //   setErrors(prev => ({
    //     ...prev,
    //     [id]: ''
    //   }));
    // }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = 'Username is required';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
        const result = await Axios.post('/static/login',formData,{
          withCredentials:true
        });
        console.log(result);
        if(result.status==200){
          setToken(result?.data.token);
          return navigate("/");
        };
        if(result.status==401){
          window.alert(result.config);
        }
      // // Mock authentication - in real app, this would be an API call
      // if (formData.email === 'admin' && formData.password === 'password') {
      //   // Store authentication state (in real app, use context or redux)
      //   // Show success message
      //   alert('Login successful! Welcome to Hostel Management System.');
        
      //   // Redirect to dashboard
      //   navigate('/dashboard');
      // } else {
      //   throw new Error('Invalid credentials');
      // }
    } catch (error) {
      console.log(error);
      if(error.status==401){
        setErrors(error.response.data);
      }
      // setErrors({
      //   submit: error.message || 'Login failed. Please check your credentials.'
      // });
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleDemoLogin = (role) => {
    const demoCredentials = {
      admin: { email: 'admin', password: 'password' },
      manager: { email: 'manager', password: 'manager123' },
      staff: { email: 'staff', password: 'staff123' }
    };

    setFormData(demoCredentials[role]);
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-card">
          {/* Header Section */}
          <div className="login-header">
            <div className="logo">
              <i className="fas fa-hotel"></i>
              <span>HostelMS</span>
            </div>
            <h1>Welcome Back</h1>
            <p>Sign in to your Hostel Management System account</p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label htmlFor="email" className="form-label">
                <i className="fas fa-user"></i>
                Username
              </label>
              <input
                type="email"
                id="email"
                name='email'
                className={`form-control`}
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Enter your email"
                disabled={isLoading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="password" className="form-label">
                <i className="fas fa-lock"></i>
                Password
              </label>
              <div className="password-input-container">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name='password'
                  className={`form-control`}
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Enter your password"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={togglePasswordVisibility}
                  disabled={isLoading}
                >
                  <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                </button>
              </div>
              {errors && <span className="error-message">{errors}</span>}
            </div>
            {/* Remember Me & Forgot Password */}
            <div className="form-options">
              <label className="remember-me">
                <input type="checkbox" />
                <span>Remember me</span>
              </label>
              <NavLink to={'/forgot-password'} className="forgot-password">
                Forgot password?
              </NavLink>
            </div>

            {/* {errors.submit && (
              <div className="alert alert-error">
                <i className="fas fa-exclamation-circle"></i>
                {errors.submit}
              </div>
            )} */}

            <button 
              type="submit" 
              className="login-btn"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <div className="spinner"></div>
                  Signing In...
                </>
              ) : (
                <>
                  <i className="fas fa-sign-in-alt"></i>
                  Sign In
                </>
              )}
            </button>
          </form>


          {/* Demo Accounts Section */}
          {/* <div className="demo-section">
            <div className="demo-divider">
              <span>Quick Demo Access</span>
            </div>
            
            <div className="demo-buttons">
              <button
                type="button"
                className="demo-btn admin"
                onClick={() => handleDemoLogin('admin')}
                disabled={isLoading}
              >
                <i className="fas fa-user-shield"></i>
                Admin Demo
              </button>
              
              <button
                type="button"
                className="demo-btn manager"
                onClick={() => handleDemoLogin('manager')}
                disabled={isLoading}
              >
                <i className="fas fa-user-tie"></i>
                Manager Demo
              </button>
              
              <button
                type="button"
                className="demo-btn staff"
                onClick={() => handleDemoLogin('staff')}
                disabled={isLoading}
              >
                <i className="fas fa-user"></i>
                Staff Demo
              </button>
            </div>
          </div> */}

          {/* Footer */}
          {/* <div className="login-footer">
            <p className="copyright">
              &copy; 2024 Hostel Management System. All rights reserved.
            </p>
            <div className="security-info">
              <i className="fas fa-shield-alt"></i>
              <span>Secure Login</span>
            </div>
          </div>
        </div> */}

        {/* Background Decoration */}
        {/* <div className="login-background">
          <div className="floating-icon">
            <i className="fas fa-bed"></i>
          </div>
          <div className="floating-icon">
            <i className="fas fa-users"></i>
          </div>
          <div className="floating-icon">
            <i className="fas fa-chart-bar"></i>
          </div>
          <div className="floating-icon">
            <i className="fas fa-money-bill-wave"></i>
          </div>
        </div> */}

        </div>
      </div>
    </div>
  );
};

export default Login;