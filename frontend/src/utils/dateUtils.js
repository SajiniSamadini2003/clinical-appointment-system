// Date helper utilities without external libraries or UTC shifting

// Get today's local date formatted as YYYY-MM-DD
export const getTodayDateString = () => {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// Format YYYY-MM-DD into a friendly local date string (e.g. "Thu, Oct 22, 2026")
export const formatDisplayDate = (dateStr) => {
  if (!dateStr) return ''
  const parts = dateStr.split('-')
  if (parts.length !== 3) return dateStr
  const year = parseInt(parts[0], 10)
  const month = parseInt(parts[1], 10) - 1
  const day = parseInt(parts[2], 10)
  const dateObj = new Date(year, month, day)
  if (isNaN(dateObj.getTime())) return dateStr
  return dateObj.toLocaleDateString(undefined, {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

// Format HH:MM 24-hour time to friendly 12-hour AM/PM string (e.g. "09:00 AM")
export const formatDisplayTime = (timeStr) => {
  if (!timeStr) return ''
  const parts = timeStr.split(':')
  if (parts.length !== 2) return timeStr
  let hours = parseInt(parts[0], 10)
  const minutes = parts[1]
  if (isNaN(hours)) return timeStr
  const ampm = hours >= 12 ? 'PM' : 'AM'
  hours = hours % 12
  hours = hours ? hours : 12
  return `${hours}:${minutes} ${ampm}`
}
