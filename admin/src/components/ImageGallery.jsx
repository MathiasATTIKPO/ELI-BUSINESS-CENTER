import React, { useState } from 'react'
import { API_BASE_URL } from '../services/api'

export default function ImageGallery({ images = [], title = 'Galerie photos' }) {
  const [selectedIdx, setSelectedIdx] = useState(0)

  if (!images || images.length === 0) {
    return <p className="text-gray-500">Aucune photo disponible</p>
  }

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-gray-800">{title}</h3>
      
      <div className="space-y-4">
        {/* Main image */}
        <div className="bg-gray-100 rounded-lg overflow-hidden w-full h-64 flex items-center justify-center">
          <img
            src={images[selectedIdx].startsWith('/uploads') ? `${API_BASE_URL}${images[selectedIdx]}` : images[selectedIdx]}
            alt={`Photo ${selectedIdx + 1}`}
            className="w-full h-full object-contain"
          />
        </div>

        {/* Thumbnails */}
        <div className="flex gap-2 overflow-x-auto">
          {images.map((img, idx) => (
            <button
              key={idx}
              onClick={() => setSelectedIdx(idx)}
              className={`w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 border-2 transition ${
                selectedIdx === idx ? 'border-accent' : 'border-gray-300'
              }`}
            >
              <img src={img.startsWith('/uploads') ? `${API_BASE_URL}${img}` : img} alt={`Thumb ${idx}`} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>

        <p className="text-sm text-gray-500">
          Photo {selectedIdx + 1} / {images.length}
        </p>
      </div>
    </div>
  )
}
