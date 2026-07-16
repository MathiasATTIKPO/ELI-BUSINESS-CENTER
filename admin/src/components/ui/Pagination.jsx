import React from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export default function Pagination({ currentPage, totalPages, onPageChange, totalItems, itemsPerPage }) {
  if (totalPages <= 1) return null

  return (
    <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50/50">
      <div className="text-sm text-gray-600">
        <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span>
        {' - '}
        <span className="font-medium">{Math.min(currentPage * itemsPerPage, totalItems)}</span>
        {' sur '}
        <span className="font-medium">{totalItems}</span>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={`p-2 rounded-lg transition-all ${currentPage === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:bg-white hover:shadow-sm border border-transparent hover:border-gray-200'}`}
        >
          <ChevronLeft size={18} />
        </button>
        {Array.from({ length: totalPages }, (_, i) => i + 1)
          .filter((page) => page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1)
          .map((page, index, array) => (
            <React.Fragment key={page}>
              {index > 0 && array[index - 1] !== page - 1 && <span className="text-gray-400">...</span>}
              <button
                onClick={() => onPageChange(page)}
                className={`w-10 h-10 rounded-lg text-sm font-medium transition-all ${
                  currentPage === page ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-600 hover:bg-white hover:shadow-sm border border-transparent hover:border-gray-200'
                }`}
              >
                {page}
              </button>
            </React.Fragment>
          ))}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={`p-2 rounded-lg transition-all ${currentPage === totalPages ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:bg-white hover:shadow-sm border border-transparent hover:border-gray-200'}`}
        >
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  )
}
