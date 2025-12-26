import React from 'react';

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  maxVisible?: number;
  disabled?: boolean;
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  maxVisible = 5,
  disabled = false,
}) => {
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const halfVisible = Math.floor(maxVisible / 2);

    let startPage = Math.max(1, currentPage - halfVisible);
    let endPage = Math.min(totalPages, currentPage + halfVisible);

    if (currentPage <= halfVisible) {
      endPage = Math.min(totalPages, maxVisible);
    } else if (currentPage > totalPages - halfVisible) {
      startPage = Math.max(1, totalPages - maxVisible + 1);
    }

    if (startPage > 1) {
      pages.push(1);
      if (startPage > 2) pages.push('...');
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) pages.push('...');
      pages.push(totalPages);
    }

    return pages;
  };

  const pages = getPageNumbers();

  return (
    <div className="flex items-center justify-center gap-2">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={disabled || currentPage === 1}
        className="px-3 py-2 rounded-md bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        Previous
      </button>

      {pages.map((page, idx) =>
        page === '...' ? (
          <span key={`ellipsis-${idx}`} className="px-2 py-2 text-gray-500">
            ...
          </span>
        ) : (
          <button
            key={page}
            onClick={() => onPageChange(page as number)}
            disabled={disabled}
            className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              currentPage === page
                ? 'bg-blue-600 text-white'
                : 'bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {page}
          </button>
        )
      )}

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={disabled || currentPage === totalPages}
        className="px-3 py-2 rounded-md bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        Next
      </button>
    </div>
  );
};

export default Pagination;
