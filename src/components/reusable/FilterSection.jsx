const FilterSection=({heading,children})=>{
    return       <div className="filters-section">
        <div className="section-card">
          <h4 className="section-title">
            <i className="fas fa-filter"></i>
            {heading}
          </h4>
          
          <div className="filters-row">
            {children}
          </div>
        </div>
      </div>
};
export default FilterSection;