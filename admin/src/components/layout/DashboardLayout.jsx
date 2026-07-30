import React from 'react'

export default function DashboardLayout({ children }) {
  return (
    <div className="eli-canvas">
      <div className="eli-content">{children}</div>
    </div>
  )
}
