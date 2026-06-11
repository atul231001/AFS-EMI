import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const Pagination = ({ 
  currentPage, 
  setCurrentPage, 
  totalItems, 
  itemsPerPage, 
  setItemsPerPage, 
  itemName = 'Items',
  className = "bg-bg-card border border-border-main p-4 flex flex-col sm:flex-row items-center justify-between flex-shrink-0 mt-4 rounded-xl shadow-lg gap-4 sm:gap-0",
  itemsPerPageOptions = [8, 16, 24, 25, 48, 50]
}) => {
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;

  const renderPageNumbers = () => {
    if (totalPages <= 3) {
      return (
        <div className="flex items-center gap-1">
          {[...Array(totalPages)].map((_, i) => {
            const p = i + 1;
            return (
              <button
                key={p}
                onClick={() => setCurrentPage(p)}
                className={`w-8 h-8 rounded-lg text-[10px] font-black transition-all ${currentPage === p ? 'bg-[#f0883e] text-black shadow-lg shadow-orange-500/20' : 'bg-bg-deep border border-border-main text-text-dim hover:text-text-main'}`}
              >
                {p}
              </button>
            );
          })}
        </div>
      );
    }

    return (
      <div className="flex items-center gap-1">
        {[1, 2].filter(p => p <= totalPages).map(p => (
          <button
            key={p}
            onClick={() => setCurrentPage(p)}
            className={`w-8 h-8 rounded-lg text-[10px] font-black transition-all ${currentPage === p ? 'bg-[#f0883e] text-black shadow-lg shadow-orange-500/20' : 'bg-bg-deep border border-border-main text-text-dim hover:text-text-main'}`}
          >
            {p}
          </button>
        ))}
        {totalPages > 3 && (
          <div className="flex items-center px-1">
            <span className="text-text-dim text-[10px] font-black mr-2">...</span>
            <input
              type="number"
              min="1" max={totalPages}
              className="w-10 h-8 bg-bg-deep border border-border-main rounded text-center text-[10px] font-black text-text-main focus:border-[#f0883e] outline-none hide-spinners"
              placeholder={currentPage > 2 && currentPage < totalPages - 1 ? currentPage : '-'}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const val = parseInt(e.target.value);
                  if (val >= 1 && val <= totalPages) setCurrentPage(val);
                  e.target.value = '';
                }
              }}
            />
            <span className="text-text-dim text-[10px] font-black ml-2">...</span>
          </div>
        )}
        {[totalPages - 1, totalPages].filter(p => p > 2 && p <= totalPages).map(p => (
          <button
            key={p}
            onClick={() => setCurrentPage(p)}
            className={`w-8 h-8 rounded-lg text-[10px] font-black transition-all ${currentPage === p ? 'bg-[#f0883e] text-black shadow-lg shadow-orange-500/20' : 'bg-bg-deep border border-border-main text-text-dim hover:text-text-main'}`}
          >
            {p}
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className={className}>
      <div className="flex items-center gap-4">
        <p className="text-[10px] font-bold text-text-dim uppercase tracking-widest">
          Showing <span className="text-text-main">{totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, totalItems)}</span> of <span className="text-[#f0883e]">{totalItems}</span> {itemName}
        </p>
        <div className="flex items-center gap-2 border-l border-border-main pl-4">
          <select
            value={itemsPerPage}
            onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
            className="bg-bg-deep border border-border-main rounded-lg text-[9px] font-black text-text-main px-2 py-1 outline-none focus:border-[#f0883e]"
          >
            {itemsPerPageOptions.map(v => <option key={v} value={v}>{v} / Page</option>)}
          </select>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          disabled={currentPage <= 1}
          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
          className="p-2 bg-bg-deep border border-border-main rounded-lg text-text-dim hover:text-text-main disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          <ChevronLeft size={16} />
        </button>
        {renderPageNumbers()}
        <button
          disabled={currentPage >= totalPages}
          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
          className="p-2 bg-bg-deep border border-border-main rounded-lg text-text-dim hover:text-text-main disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
};

export default Pagination;
