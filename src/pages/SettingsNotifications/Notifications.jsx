import { Bell } from "lucide-react";

const Notifications=({applicationUpdates,emailNotifications,handleInputChange,smsNotifications,securityAlerts})=>{
    return   <div className="section">
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
                      checked={emailNotifications}
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
                      checked={smsNotifications}
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
                      checked={applicationUpdates}
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
                      checked={securityAlerts}
                      onChange={handleInputChange}
                    />
                    <span className="slider"></span>
                  </label>
                </div>
              </div>
            </div>
};
export default Notifications;