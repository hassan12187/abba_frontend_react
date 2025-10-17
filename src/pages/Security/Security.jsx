import { Eye, EyeOff, Lock } from "lucide-react";
import { memo } from "react";

const Security= memo(({currentPassword,showPassword,handleInputChange,setShowNewPassword,setShowPassword,showNewPassword,confirmPassword,twoFactorAuth,newPassword})=>{
    return  <div className="section">
              <div className="sectionHeader">
                <h3 className="sectionTitle">
                  <Lock size={24} />
                  Security Settings
                </h3>
              </div>
              
              <div className="formGrid">
                {/* <InputField type={showPassword ? 'text' : 'password'} label={"Current Password"} name={'currentPassword'} value={formData.currentPassword} onChange={handleInputChange}  /> */}
                <div className="formGroup" style={{ gridColumn: '1 / -1' }}>
                  <label className="label">Current Password</label>
                  <div className="passwordWrapper">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="currentPassword"
                      value={currentPassword}
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
                      value={newPassword}
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
                    value={confirmPassword}
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
                      checked={twoFactorAuth}
                      onChange={handleInputChange}
                    />
                    <span className="slider"></span>
                  </label>
                </div>
              </div>
            </div>
});
export default Security;