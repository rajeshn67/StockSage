// Utility functions for the application

// Debounce function for search
export const debounce = (func, wait) => {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

// Format date for display
export const formatDate = (date) => {
  return new Date(date).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

// Validate email
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Validate phone number (Indian format)
export const isValidPhone = (phone) => {
  const phoneRegex = /^[6-9]\d{9}$/
  return phoneRegex.test(phone)
}

// Generate random ID
export const generateId = () => {
  return Math.random().toString(36).substr(2, 9)
}

// Calculate percentage
export const calculatePercentage = (value, total) => {
  if (total === 0) return 0
  return ((value / total) * 100).toFixed(2)
}

// Truncate text
export const truncateText = (text, maxLength) => {
  if (text.length <= maxLength) return text
  return text.substr(0, maxLength) + "..."
}

// Get stock status color
export const getStockStatusColor = (quantity, minStock) => {
  if (quantity === 0) return "text-red-600 bg-red-100"
  if (quantity <= minStock) return "text-yellow-600 bg-yellow-100"
  return "text-green-600 bg-green-100"
}

// Get bill status color
export const getBillStatusColor = (status) => {
  switch (status) {
    case "paid":
      return "text-green-600 bg-green-100"
    case "pending":
      return "text-yellow-600 bg-yellow-100"
    case "cancelled":
      return "text-red-600 bg-red-100"
    default:
      return "text-gray-600 bg-gray-100"
  }
}
