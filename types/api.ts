export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
    fields?: Record<string, string>
  }
  meta?: {
    total: number
    page: number
    limit: number
  }
}

export function successResponse<T>(data: T, meta?: ApiResponse["meta"]): ApiResponse<T> {
  return { success: true, data, ...(meta && { meta }) }
}

export function errorResponse(
  code: string,
  message: string,
  fields?: Record<string, string>
): ApiResponse<never> {
  return { success: false, error: { code, message, ...(fields && { fields }) } }
}

// Common error codes
export const ErrorCodes = {
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  NOT_FOUND: "NOT_FOUND",
  VALIDATION_ERROR: "VALIDATION_ERROR",
  SERVER_ERROR: "SERVER_ERROR",
  CONFLICT: "CONFLICT",
  INSUFFICIENT_BALANCE: "INSUFFICIENT_BALANCE",
  INVALID_STATUS: "INVALID_STATUS",
  EXPIRED_TOKEN: "EXPIRED_TOKEN",
  INVALID_TOKEN: "INVALID_TOKEN",
} as const
