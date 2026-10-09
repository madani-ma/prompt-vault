import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { ThemeConfig } from '../theme';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems: number;
  itemsPerPage: number;
  theme: ThemeConfig;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  itemsPerPage,
  theme,
}) => {
  if (totalItems === 0) return null;

  const validTotalPages = Math.max(1, totalPages);
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  // Generate page numbers
  const pages: number[] = [];
  for (let i = 1; i <= validTotalPages; i++) {
    pages.push(i);
  }

  const handlePageSelect = (page: number) => {
    if (page < 1 || page > validTotalPages || page === currentPage) return;
    onPageChange(page);
    // Smooth scroll back to grid top
    const gridElem = document.getElementById('prompt-grid-anchor');
    if (gridElem) {
      gridElem.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="mt-12 flex flex-col sm:flex-row items-center justify-between gap-4 py-6 border-t border-slate-200/60">
      <div className={`text-xs font-bold uppercase tracking-wider ${theme.cardSecondaryText}`}>
        Showing <span className={`font-black ${theme.textPrimary}`}>{startItem}-{endItem}</span> of{' '}
        <span className={`font-black ${theme.textPrimary}`}>{totalItems}</span> prompts
      </div>

      <div className="flex items-center gap-1.5">
        {/* Previous Page */}
        <button
          onClick={() => handlePageSelect(currentPage - 1)}
          disabled={currentPage === 1}
          className={`flex items-center justify-center w-9 h-9 rounded-full border transition-all ${
            currentPage === 1
              ? 'border-slate-200 text-slate-300 cursor-not-allowed bg-slate-50'
              : 'border-slate-200 text-slate-700 bg-white hover:bg-slate-100 hover:border-slate-300 cursor-pointer shadow-xs'
          }`}
          aria-label="Previous page"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Page Numbers: Current active page highlighted with green circular highlight */}
        {pages.map((pageNum) => {
          const isActive = pageNum === currentPage;
          return (
            <button
              key={pageNum}
              onClick={() => handlePageSelect(pageNum)}
              className={`w-9 h-9 rounded-full text-xs font-black transition-all cursor-pointer flex items-center justify-center ${
                isActive
                  ? 'bg-[#84cc16] text-slate-950 shadow-md scale-105 ring-2 ring-lime-500/30'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
              aria-current={isActive ? 'page' : undefined}
            >
              {pageNum}
            </button>
          );
        })}

        {/* Next Page */}
        <button
          onClick={() => handlePageSelect(currentPage + 1)}
          disabled={currentPage === validTotalPages}
          className={`flex items-center justify-center w-9 h-9 rounded-full border transition-all ${
            currentPage === validTotalPages
              ? 'border-slate-200 text-slate-300 cursor-not-allowed bg-slate-50'
              : 'border-slate-200 text-slate-700 bg-white hover:bg-slate-100 hover:border-slate-300 cursor-pointer shadow-xs'
          }`}
          aria-label="Next page"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
