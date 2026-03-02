const SelectField=({id={undefined},name={undefined},label={undefined},className='form-control',value,onChange={undefined},children})=>{
return <div className="filter-group">
<label htmlFor={id} className="form-label">{label}</label>
<select id={id} name={name} className={className} value={value} onChange={onChange}>
    {children}
</select>
</div>
};
export default SelectField;