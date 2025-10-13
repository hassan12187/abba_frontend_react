import { useState } from 'react';
import { Settings, User, Lock, Bell, Moon, Database, Eye, EyeOff, Save, CheckCircle } from 'lucide-react';
import './SettingsPage.css'; // Import the CSS file
import { useGetUserInfo } from '../../components/hooks/useSpecificQuery';
import { useCustom } from '../../Store/Store';

export default function SettingsPage() {
  const {token}=useCustom();
  const [activeTab, setActiveTab] = useState('profile');
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [saved, setSaved] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [formData, setFormData] = useState({
    username: 'John Doe',
    email: 'john.doe@university.edu',
    phone: '+92 300 1234567',
    password: '',
    newPassword: '',
    confirmPassword: '',
    emailNotifications: true,
    smsNotifications: false,
    applicationUpdates: true,
    securityAlerts: true,
    autoBackup: true,
    twoFactorAuth: false
  });
  const {data:adminData}=useGetUserInfo('/api/admin/settings/profile-information',token);
  console.log(adminData);
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'security', label: 'Security', icon: Lock },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'preferences', label: 'Preferences', icon: Settings }
  ];

  return (
    <div className="settings-container">
      {/* Header */}
      <div className="header">
        <h2 className="headerTitle">
          <Settings size={32} />
          Settings
        </h2>
        <p className="headerSubtitle">Manage your account settings and preferences</p>
      </div>

      {/* Main Content */}
      <div className="mainContent">
        {/* Sidebar Navigation */}
        <div className="sidebar">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`tabButton ${activeTab === tab.id ? 'tabButtonActive' : ''}`}
              >
                <Icon size={20} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content Area */}
        <div className="contentArea">
          {/* Profile Settings */}
          {activeTab === 'profile' && (
            <div className="section">
              <div className="sectionHeader">
                <h3 className="sectionTitle">
                  <User size={24} />
                  Profile Information
                </h3>
              </div>
              
              <div className="formGrid">
                <div className="formGroup">
                  <label className="label">Full Name</label>
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    className="input"
                  />
                </div>

                <div className="formGroup">
                  <label className="label">Email Address</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="input"
                  />
                </div>

                <div className="formGroup">
                  <label className="label">Phone Number</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="input"
                  />
                </div>

                {/* <div className="formGroup">
                  <label className="label">Department</label>
                  <select className="input">
                    <option>Computer Science</option>
                    <option>Engineering</option>
                    <option>Business</option>
                    <option>Arts</option>
                  </select>
                </div> */}
              </div>
            </div>
          )}

          {/* Security Settings */}
          {activeTab === 'security' && (
            <div className="section">
              <div className="sectionHeader">
                <h3 className="sectionTitle">
                  <Lock size={24} />
                  Security Settings
                </h3>
              </div>
              
              <div className="formGrid">
                <div className="formGroup" style={{ gridColumn: '1 / -1' }}>
                  <label className="label">Current Password</label>
                  <div className="passwordWrapper">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="currentPassword"
                      value={formData.currentPassword}
                      onChange={handleInputChange}
                      className="passwordInput"
                      placeholder="Enter current password"
                    />
                    <button
                      onClick={() => setShowPassword(!showPassword)}
                      className="eyeButton"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                <div className="formGroup">
                  <label className="label">New Password</label>
                  <div className="passwordWrapper">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      name="newPassword"
                      value={formData.newPassword}
                      onChange={handleInputChange}
                      className="passwordInput"
                      placeholder="Enter new password"
                    />
                    <button
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="eyeButton"
                    >
                      {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                <div className="formGroup">
                  <label className="label">Confirm Password</label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className="input"
                    placeholder="Confirm new password"
                  />
                </div>
              </div>

              <div className="securityOptions">
                <div className="switchRow">
                  <div>
                    <div className="switchLabel">Two-Factor Authentication</div>
                    <div className="switchDescription">
                      Add an extra layer of security to your account
                    </div>
                  </div>
                  <label className="switch">
                    <input
                      type="checkbox"
                      name="twoFactorAuth"
                      checked={formData.twoFactorAuth}
                      onChange={handleInputChange}
                    />
                    <span className="slider"></span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Notifications Settings */}
          {activeTab === 'notifications' && (
            <div className="section">
              <div className="sectionHeader">
                <h3 className="sectionTitle">
                  <Bell size={24} />
                  Notification Preferences
                </h3>
              </div>
              
              <div className="notificationsList">
                <div className="switchRow">
                  <div>
                    <div className="switchLabel">Email Notifications</div>
                    <div className="switchDescription">
                      Receive notifications via email
                    </div>
                  </div>
                  <label className="switch">
                    <input
                      type="checkbox"
                      name="emailNotifications"
                      checked={formData.emailNotifications}
                      onChange={handleInputChange}
                    />
                    <span className="slider"></span>
                  </label>
                </div>

                <div className="switchRow">
                  <div>
                    <div className="switchLabel">SMS Notifications</div>
                    <div className="switchDescription">
                      Receive notifications via SMS
                    </div>
                  </div>
                  <label className="switch">
                    <input
                      type="checkbox"
                      name="smsNotifications"
                      checked={formData.smsNotifications}
                      onChange={handleInputChange}
                    />
                    <span className="slider"></span>
                  </label>
                </div>

                <div className="switchRow">
                  <div>
                    <div className="switchLabel">Application Updates</div>
                    <div className="switchDescription">
                      Get notified about new features and updates
                    </div>
                  </div>
                  <label className="switch">
                    <input
                      type="checkbox"
                      name="applicationUpdates"
                      checked={formData.applicationUpdates}
                      onChange={handleInputChange}
                    />
                    <span className="slider"></span>
                  </label>
                </div>

                <div className="switchRow">
                  <div>
                    <div className="switchLabel">Security Alerts</div>
                    <div className="switchDescription">
                      Get notified about security events
                    </div>
                  </div>
                  <label className="switch">
                    <input
                      type="checkbox"
                      name="securityAlerts"
                      checked={formData.securityAlerts}
                      onChange={handleInputChange}
                    />
                    <span className="slider"></span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Preferences Settings */}
          {activeTab === 'preferences' && (
            <div className="section">
              <div className="sectionHeader">
                <h3 className="sectionTitle">
                  <Settings size={24} />
                  Application Preferences
                </h3>
              </div>
              
              <div className="preferencesList">
                <div className="switchRow">
                  <div>
                    <div className="switchLabel">
                      <Moon size={18} style={{ marginRight: '8px' }} />
                      Dark Mode
                    </div>
                    <div className="switchDescription">
                      Use dark theme for better visibility at night
                    </div>
                  </div>
                  <label className="switch">
                    <input
                      type="checkbox"
                      checked={darkMode}
                      onChange={(e) => setDarkMode(e.target.checked)}
                    />
                    <span className="slider"></span>
                  </label>
                </div>

                <div className="switchRow">
                  <div>
                    <div className="switchLabel">
                      <Database size={18} style={{ marginRight: '8px' }} />
                      Auto Backup
                    </div>
                    <div className="switchDescription">
                      Automatically backup your data daily
                    </div>
                  </div>
                  <label className="switch">
                    <input
                      type="checkbox"
                      name="autoBackup"
                      checked={formData.autoBackup}
                      onChange={handleInputChange}
                    />
                    <span className="slider"></span>
                  </label>
                </div>

                <div className="formGroup">
                  <label className="label">Language</label>
                  <select className="input">
                    <option>English</option>
                    <option>Urdu</option>
                    <option>Arabic</option>
                  </select>
                </div>

                <div className="formGroup">
                  <label className="label">Time Zone</label>
                  <select className="input">
                    <option>PKT (UTC+5)</option>
                    <option>GMT (UTC+0)</option>
                    <option>EST (UTC-5)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Save Button */}
          <div className="footer">
            {saved && (
              <div className="successMessage">
                <CheckCircle size={20} />
                Settings saved successfully!
              </div>
            )}
            <button onClick={handleSave} className="saveButton">
              <Save size={20} />
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}