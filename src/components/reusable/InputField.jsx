const InputField=({label,type,name,value,onChange,id,placeholder,className='form-control',style,min,max,readonly=false})=>{
    return    <div className="filter-group" style={style}>
                  <label className="label">{label}</label>
                  <input
                    type={type}
                    name={name}
                    id={id}
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder}
                    className={className}
                    min={min}
                    max={max}
                    readOnly={readonly}
                  />
                </div>
};
export default InputField;