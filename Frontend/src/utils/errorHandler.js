/**
 * Utility function to extract error messages from various error response formats
 * @param {*} error - The error object from API response
 * @param {string} defaultMessage - Default message if no specific error found
 * @returns {string} - A string error message safe for display
 */
export const getErrorMessage = (error, defaultMessage = 'An error occurred') => {
  // If it's already a string, return it
  if (typeof error === 'string') {
    return error
  }

  // If it's an axios error with response data
  if (error?.response?.data) {
    const data = error.response.data
    
    // If response data is a string (like "Username is already taken!")
    if (typeof data === 'string') {
      return data
    }
    
    // If response data is an object with common error fields
    if (typeof data === 'object') {
      return data.message || data.error || data.detail || defaultMessage
    }
  }

  // If it's a regular error with message
  if (error?.message) {
    return error.message
  }

  // Fallback to default message
  return defaultMessage
}

/**
 * Utility function to safely display toast error messages
 * @param {*} error - The error object
 * @param {string} defaultMessage - Default message if no specific error found
 */
export const showErrorToast = (error, defaultMessage = 'An error occurred') => {
  const message = getErrorMessage(error, defaultMessage)
  // Import toast dynamically to avoid circular dependencies
  import('react-hot-toast').then(({ default: toast }) => {
    toast.error(message)
  })
}
