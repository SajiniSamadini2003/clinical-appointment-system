import React from 'react'

/**
 * Simple loading spinner using Tailwind CSS utilities.
 * Can be used for any async loading state.
 */
const LoadingSpinner = ({ size = '6', color = 'primary' }) => {
  const sizeClass = size === '8' ? 'h-8 w-8' : size === '10' ? 'h-10 w-10' : 'h-6 w-6'
  const borderClass = `border-4 border-${color} border-t-transparent rounded-full animate-spin`
  return <div className={`${sizeClass} ${borderClass}`} aria-label="Loading" />
}

export default LoadingSpinner
