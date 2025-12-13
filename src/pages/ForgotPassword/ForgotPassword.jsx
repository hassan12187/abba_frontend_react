import React, { useState } from 'react';
import { Mail, Lock, KeyRound, ArrowLeft, CheckCircle, AlertCircle, Eye, EyeOff } from 'lucide-react';
import Axios from '../../Services/Axios';

export default function ForgotPasswordPage() {
  const [token,setToken]=useState("");
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const sendEmailVerification=async()=>{
    try {
      const result =await Axios.post('/static/forgot-password',{email});
      console.log(result);
      return result.status;
    } catch (error) {
      console.log(error);
      return {status:error.status,message:error.response.data};
    }
  };

  const handleEmailSubmit = async(e) => {
    e.preventDefault();
    setError('');
    
    if (!email) {
      setError('Please enter your email address');
      return;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return;
    };
    setLoading(true);
    const {status,message}=await sendEmailVerification();
      setTimeout(() => {
        setLoading(false);
        if(status!==400)return setStep(2);
        setError(message);
      }, 1500);
    };

  const handleCodeChange = (index, value) => {
    if (value.length > 1) return;
    
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);
    
    if (value && index < 5) {
      const nextInput = document.getElementById(`code-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleCodeSubmit = async(e) => {
    e.preventDefault();
    setError('');
    
    const fullCode = code.join('');
    if (fullCode.length !== 6) {
      setError('Please enter the complete 6-digit code');
      return;
    }

    setLoading(true);
    // console.log(fullCode);
    let status;
    try {
      const result = await Axios.post('/static/verify-code',{email,code:fullCode});
      console.log(result);
      if(result.status==200){
        setToken(result.data.token);
      status=200;
      }
    } catch (error) {
      if(error.status==404){
     status=404;
      }
    }
     setTimeout(() => {
       setLoading(false);
        if(status==403){
          setError("Please Enter a Valid Code.");
          return};
          setStep(3);
        }, 1500);
  };

  const handlePasswordSubmit = async(e) => {
    e.preventDefault();
    setError('');
    
    if (!password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }
    
    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    let status;
    try {
      const result = await Axios.patch('/static/change-password',{token,password});
      console.log(result);
      status=result.status;
    } catch (error) {
      console.log(error);
      status=result.status;
    }
    setTimeout(() => {
      setLoading(false);
      if(status==401 || status==500)return;
      setStep(4);
    }, 1500);
  };

  const handleResendCode = () => {
    setError('');
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      alert('Verification code resent to your email!');
    }, 1000);
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          {step !== 4 && step > 1 && (
            <button style={styles.backButton} onClick={() => setStep(step - 1)}>
              <ArrowLeft size={20} />
              Back
            </button>
          )}
          
          <div style={styles.headerIcon}>
            {step === 1 && <Mail size={48} />}
            {step === 2 && <KeyRound size={48} />}
            {step === 3 && <Lock size={48} />}
            {step === 4 && <CheckCircle size={48} />}
          </div>
          
          <h2 style={styles.title}>
            {step === 1 && 'Forgot Password?'}
            {step === 2 && 'Verify Your Email'}
            {step === 3 && 'Reset Password'}
            {step === 4 && 'Password Reset Successful!'}
          </h2>
          
          <p style={styles.subtitle}>
            {step === 1 && "Enter your email address and we'll send you a verification code"}
            {step === 2 && `We've sent a 6-digit code to ${email}`}
            {step === 3 && 'Create a new strong password for your account'}
            {step === 4 && 'Your password has been successfully reset'}
          </p>
        </div>

        {error && (
          <div style={styles.errorMessage}>
            <AlertCircle size={20} />
            {error}
          </div>
        )}

        {step === 1 && (
          <div style={styles.formContent}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Email Address</label>
              <div style={styles.inputWrapper}>
                <Mail size={20} style={styles.inputIcon} />
                <input
                  type="email"
                  style={styles.input}
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  onKeyDown={(e) => e.key === 'Enter' && handleEmailSubmit(e)}
                />
              </div>
            </div>

            <button onClick={handleEmailSubmit} style={styles.submitButton} disabled={loading}>
              {loading && <span style={styles.spinner}></span>}
              {loading ? 'Sending Code...' : 'Send Verification Code'}
            </button>

            <div style={styles.footer}>
              <a href="/login" style={styles.link}>
                <ArrowLeft size={16} />
                Back to Login
              </a>
            </div>
          </div>
        )}

        {step === 2 && (
          <div style={styles.formContent}>
            <div style={styles.codeInputGroup}>
              {code.map((digit, index) => (
                <input
                  key={index}
                  id={`code-${index}`}
                  type="text"
                  maxLength={1}
                  style={styles.codeInput}
                  value={digit}
                  onChange={(e) => handleCodeChange(index, e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Backspace' && !digit && index > 0) {
                      const prevInput = document.getElementById(`code-${index - 1}`);
                      if (prevInput) prevInput.focus();
                    }
                    if (e.key === 'Enter') handleCodeSubmit(e);
                  }}
                  disabled={loading}
                />
              ))}
            </div>

            <button onClick={handleCodeSubmit} style={styles.submitButton} disabled={loading}>
              {loading && <span style={styles.spinner}></span>}
              {loading ? 'Verifying...' : 'Verify Code'}
            </button>

            <div style={styles.footer}>
              <p style={styles.footerText}>Didn't receive the code?</p>
              <button style={styles.linkButton} onClick={handleResendCode}>
                Resend Code
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div style={styles.formContent}>
            <div style={styles.formGroup}>
              <label style={styles.label}>New Password</label>
              <div style={styles.inputWrapper}>
                <Lock size={20} style={styles.inputIcon} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  style={Object.assign({}, styles.input, {paddingRight: '3rem'})}
                  placeholder="Enter new password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                />
                <button
                  style={styles.eyeButton}
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Confirm Password</label>
              <div style={styles.inputWrapper}>
                <Lock size={20} style={styles.inputIcon} />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  style={Object.assign({}, styles.input, {paddingRight: '3rem'})}
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={loading}
                  onKeyDown={(e) => e.key === 'Enter' && handlePasswordSubmit(e)}
                />
                <button
                  style={styles.eyeButton}
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <div style={styles.passwordRequirements}>
              <p style={styles.requirementsTitle}>Password must contain:</p>
              <ul style={styles.requirementsList}>
                <li style={password.length >= 8 ? styles.requirementValid : styles.requirement}>
                  At least 8 characters
                </li>
                <li style={/[A-Z]/.test(password) ? styles.requirementValid : styles.requirement}>
                  One uppercase letter
                </li>
                <li style={/[a-z]/.test(password) ? styles.requirementValid : styles.requirement}>
                  One lowercase letter
                </li>
                <li style={/[0-9]/.test(password) ? styles.requirementValid : styles.requirement}>
                  One number
                </li>
              </ul>
            </div>

            <button onClick={handlePasswordSubmit} style={styles.submitButton} disabled={loading}>
              {loading && <span style={styles.spinner}></span>}
              {loading ? 'Resetting Password...' : 'Reset Password'}
            </button>
          </div>
        )}

        {step === 4 && (
          <div style={Object.assign({}, styles.formContent, {textAlign: 'center', padding: '2rem 0'})}>
            <div style={styles.successIcon}>
              <CheckCircle size={80} />
            </div>
            <p style={styles.successMessage}>
              You can now login with your new password
            </p>
            <a href="/login" style={styles.submitButton}>
              Go to Login
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    padding: '2rem',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  card: {
    background: 'white',
    borderRadius: '16px',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
    maxWidth: '480px',
    width: '100%',
    padding: '3rem 2.5rem',
    position: 'relative',
  },
  header: {
    textAlign: 'center',
    marginBottom: '2rem',
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    left: 0,
    top: 0,
    background: 'none',
    border: 'none',
    color: '#6c757d',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.5rem',
    fontSize: '0.9rem',
    fontWeight: '500',
    transition: 'all 0.3s ease',
    borderRadius: '6px',
  },
  headerIcon: {
    width: '80px',
    height: '80px',
    margin: '0 auto 1.5rem',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    boxShadow: '0 10px 30px rgba(102, 126, 234, 0.3)',
  },
  title: {
    color: '#2c3e50',
    fontSize: '1.75rem',
    fontWeight: '700',
    margin: '0 0 0.75rem 0',
  },
  subtitle: {
    color: '#6c757d',
    fontSize: '0.95rem',
    lineHeight: '1.6',
    margin: 0,
  },
  errorMessage: {
    background: 'rgba(231, 76, 60, 0.1)',
    border: '1px solid rgba(231, 76, 60, 0.3)',
    color: '#e74c3c',
    padding: '0.875rem 1rem',
    borderRadius: '8px',
    marginBottom: '1.5rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    fontSize: '0.9rem',
  },
  formContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  label: {
    fontWeight: '600',
    color: '#495057',
    fontSize: '0.95rem',
  },
  inputWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  inputIcon: {
    position: 'absolute',
    left: '1rem',
    color: '#6c757d',
    pointerEvents: 'none',
  },
  input: {
    width: '100%',
    padding: '0.875rem 1rem 0.875rem 3rem',
    border: '2px solid #e9ecef',
    borderRadius: '8px',
    fontSize: '1rem',
    transition: 'all 0.3s ease',
    backgroundColor: '#fff',
    outline: 'none',
  },
  eyeButton: {
    position: 'absolute',
    right: '1rem',
    background: 'none',
    border: 'none',
    color: '#6c757d',
    cursor: 'pointer',
    padding: '0.5rem',
    display: 'flex',
    alignItems: 'center',
    transition: 'color 0.3s ease',
  },
  codeInputGroup: {
    display: 'flex',
    gap: '0.75rem',
    justifyContent: 'center',
    margin: '1rem 0',
  },
  codeInput: {
    width: '50px',
    height: '60px',
    textAlign: 'center',
    fontSize: '1.5rem',
    fontWeight: '600',
    border: '2px solid #e9ecef',
    borderRadius: '8px',
    transition: 'all 0.3s ease',
    outline: 'none',
    color: '#2c3e50',
  },
  passwordRequirements: {
    background: '#f8f9fa',
    border: '1px solid #e9ecef',
    borderRadius: '8px',
    padding: '1rem',
  },
  requirementsTitle: {
    margin: '0 0 0.75rem 0',
    fontWeight: '600',
    color: '#495057',
    fontSize: '0.9rem',
  },
  requirementsList: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  requirement: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    color: '#6c757d',
    fontSize: '0.875rem',
  },
  requirementValid: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    color: '#27ae60',
    fontSize: '0.875rem',
  },
  submitButton: {
    padding: '0.875rem 2rem',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontWeight: '600',
    fontSize: '1rem',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    transition: 'all 0.3s ease',
    textDecoration: 'none',
  },
  spinner: {
    width: '18px',
    height: '18px',
    border: '2px solid rgba(255, 255, 255, 0.3)',
    borderTopColor: 'white',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
    display: 'inline-block',
  },
  footer: {
    textAlign: 'center',
    marginTop: '1rem',
  },
  footerText: {
    margin: '0 0 0.5rem 0',
    color: '#6c757d',
    fontSize: '0.9rem',
  },
  link: {
    color: '#667eea',
    textDecoration: 'none',
    fontWeight: '500',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.5rem',
    transition: 'all 0.3s ease',
  },
  linkButton: {
    background: 'none',
    border: 'none',
    color: '#667eea',
    fontWeight: '600',
    cursor: 'pointer',
    padding: 0,
    fontSize: '0.95rem',
    transition: 'all 0.3s ease',
  },
  successIcon: {
    color: '#27ae60',
    marginBottom: '1.5rem',
  },
  successMessage: {
    color: '#6c757d',
    fontSize: '1rem',
    lineHeight: '1.6',
    margin: '0 0 2rem 0',
  },
};

const styleSheet = document.createElement("style");
styleSheet.textContent = `
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  
  input:focus {
    border-color: #667eea !important;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1) !important;
  }
  
  button:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 10px 25px rgba(102, 126, 234, 0.3);
  }
  
  button:active:not(:disabled) {
    transform: translateY(0);
  }
  
  @media (max-width: 576px) {
    .code-input {
      width: 45px !important;
      height: 55px !important;
      font-size: 1.25rem !important;
    }
  }
`;
document.head.appendChild(styleSheet);