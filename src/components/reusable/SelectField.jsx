const SelectField=({id,name,label,className='form-control',value,onChange,children})=>{
return <div className="filter-group">
<label htmlFor={id} className="form-label">{label}</label>
<select id={id} name={name} className={className} value={value} onChange={onChange}>
    {children}
</select>
</div>
};
export default SelectField;