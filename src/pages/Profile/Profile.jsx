import { User } from "lucide-react";
import InputField from "../../components/reusable/InputField";
import { memo } from "react";

const Profile= memo(({username,email,phone,handleInputChange})=>{
    return     <div className="section">
              <div className="sectionHeader">
                <h3 className="sectionTitle">
                  <User size={24} />
                  Profile Information
                </h3>
              </div>
              
              <div className="formGrid">
                <InputField label={"Full Name"} type={'text'} name={'username'} value={username} onChange={handleInputChange} />
                <InputField label={"Email Address"} type={'email'} name={'email'} value={email} onChange={handleInputChange} />
                <InputField label={"Phone Number"} type={'text'} name={'phone'} value={phone} onChange={handleInputChange} />

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
});
export default Profile;