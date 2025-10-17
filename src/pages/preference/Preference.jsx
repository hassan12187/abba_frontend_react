import { Database, Moon, Settings } from "lucide-react";
import { useCustom } from "../../Store/Store";
import { memo } from "react";

const Preferences=memo(({autoBackup,setDarkMode,handleInputChange})=>{
  const {toggleDarkMode,setToggleDarkMode}=useCustom();
  const handleToggle=(e)=>{
    setToggleDarkMode(!toggleDarkMode);
  }
    return      <div className="section">
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
                      checked={toggleDarkMode}
                      onChange={handleToggle}
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
                      checked={autoBackup}
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
});
export default Preferences;