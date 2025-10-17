import { useEffect, useState } from 'react';
import { Settings, User, Lock, Bell, Moon, Database, Eye, EyeOff, Save, CheckCircle } from 'lucide-react';
import './SettingsPage.css'; // Import the CSS file
import { useGetUserInfo } from '../../components/hooks/useSpecificQuery';
import { useCustom } from '../../Store/Store';
import InputField from '../../components/reusable/InputField';
import Profile from '../Profile/Profile';
import Security from '../Security/Security';
import Preferences from '../preference/Preference';
import Notifications from '../SettingsNotifications/Notifications';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { PatchService } from '../../Services/Services';

export default function SettingsPage() {
  const queryClient=useQueryClient();
  const {token}=useCustom();
  const [activeTab, setActiveTab] = useState('profile');
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [saved, setSaved] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    phone: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    emailNotifications: true,
    smsNotifications: false,
    applicationUpdates: true,
    securityAlerts: true,
    autoBackup: true,
    twoFactorAuth: false
  });
  const {data:adminData,isLoading}=useGetUserInfo('/api/admin/settings/profile-information',token);
  // console.log(adminData);
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };
  useEffect(()=>{
    if(adminData){
      setFormData((prev)=>(
        {
          ...prev,
          username:adminData.username || "-",
          email:adminData.email || "-",
          phone:adminData.phone || "-"
        }
      ))
    }
  },[adminData]);
  const {mutate}=useMutation({
    mutationFn:async({url,data})=>PatchService(url,data,token),
    onSuccess:()=>{
      queryClient.invalidateQueries({queryKey:['user_info']});
    }
  })
  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
    console.log(formData);
    switch (activeTab) {
      case "profile":
        mutate({url:`/api/admin/settings/profile-information/${adminData.id}`,data:{username:formData.username,email:formData.email,phone:formData.phone}});
        break;
      case "security":
        if(formData.newPassword!=formData.confirmPassword)return;
        mutate({url:`/api/admin/settings/password/${adminData.id}`,data:{currentPassword:formData.currentPassword,confirmPassword:formData.confirmPassword,newPassword:formData.newPassword}});
      default:
        break;
    }
  };

  const tabContent={
    profile:<Profile username={formData.username} email={formData.email} phone={formData.phone} handleInputChange={handleInputChange} />,
    security:<Security currentPassword={formData.currentPassword} newPassword={formData.newPassword} showNewPassword={showNewPassword} setShowNewPassword={setShowNewPassword} confirmPassword={formData.confirmPassword} handleInputChange={handleInputChange} setShowPassword={setShowPassword} showPassword={showPassword} />,
    preferences:<Preferences autoBackup={formData.autoBackup} handleInputChange={handleInputChange} />,
    notifications:<Notifications applicationUpdates={formData.applicationUpdates} emailNotifications={formData.emailNotifications} handleInputChange={handleInputChange} smsNotifications={formData.smsNotifications} securityAlerts={formData.securityAlerts} />
  };
  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'security', label: 'Security', icon: Lock },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'preferences', label: 'Preferences', icon: Settings }
  ];
  if(isLoading)return <h1>Loading...</h1>;
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
            {tabContent[activeTab]}
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