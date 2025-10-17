const InputField=({label,type,name,value,onChange,style})=>{
    return    <div className="formGroup" style={style}>
                  <label className="label">{label}</label>
                  <input
                    type={type}
                    name={name}
                    value={value}
                    onChange={onChange}
                    className='input'
                  />
                </div>
};
export default InputField;