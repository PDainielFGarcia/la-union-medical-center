export class ApiError extends Error {
  constructor(message, status = 500, details = null) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.details = details
  }
}

export function getErrorMessage(error) {
  if (!error) return 'Something went wrong. Please try again.'
  if (error instanceof ApiError) return error.message
  if (error.response?.data?.message) return error.response.data.message
  if (error.message === 'Network Error') return 'Network error. Check your connection and try again.'
  if (error.message) return error.message
  return 'Something went wrong. Please try again.'
}
