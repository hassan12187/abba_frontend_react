import React ,{ type ChangeEventHandler, type ReactElement,type ReactNode } from "react";

interface SelectField extends React.InputHTMLAttributes<HTMLInputElement>{
    label?:string|undefined,
    children:ReactNode|ReactNode[],
    onChange:ChangeEventHandler
};
const SelectField=({id,name,label,className='form-control',value,onChange,children}:SelectField)=>{
return <div className="filter-group">
<label htmlFor={id} className="form-label">{label}</label>
<select id={id} name={name} className={className} value={value} onChange={onChange}>
    {children}
</select>
</div>
};
export default SelectField;