import { useState } from "react";

const Pagination=({currentPage,setCurrentPage,length})=>{
  console.log(length);
    const ITEMS_PER_PAGE=10;
      const [pages,setPages]=useState([1,2,3]);
       const goToPreviousPage = () => {
            setPages([pages[0]-1,pages[1]-1,pages[2]-1]);
            if (currentPage > 1) {
              setCurrentPage(currentPage - 1);
            }
          };
    const goToNextPage = () => {
            if(length >= 0 && length < 10)return;
            setPages(()=>{
              return [pages[0]+1,pages[1]+1,pages[2]+1];
            });
            setCurrentPage(currentPage+1);
            // if (currentPage < totalPages) {
            //   setCurrentPage(currentPage + 1);
            // }
          };
          
    return  <div className="pagination-container">
                <nav className="pagination-nav">
                  <button
                    className="pagination-btn"
                    onClick={goToPreviousPage}
                    disabled={currentPage === 1}
                  >
                    <i className="fas fa-chevron-left"></i>
                    Previous
                  </button>

                  <div className="page-numbers">
                    {
                    pages.map(page => (
                      <button
                        key={page}
                        className={`page-number ${currentPage === page ? 'active' : ''}`}
                        onClick={() => goToPage(page)}
                      >
                        {page}
                      </button>
                    ))}
                  </div>

                  <button
                    className="pagination-btn"
                    onClick={goToNextPage}
                    disabled={length < ITEMS_PER_PAGE ? true : false}
                  >
                    Next
                    <i className="fas fa-chevron-right"></i>
                  </button>
                </nav>
              </div>
};
export default Pagination;