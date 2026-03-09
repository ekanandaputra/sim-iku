export interface StandardResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: Record<string, string>;
}

export function successResponse<T = unknown>(data: T, message?: string): StandardResponse<T> {
  const response: StandardResponse<T> = {
    success: true,
    data,
  };
  if (message) {
    response.message = message;
  }
  return response;
}

export function errorResponse(message: string, errors?: Record<string, string>): StandardResponse {
  const response: StandardResponse = {
    success: false,
    message,
  };
  if (errors && Object.keys(errors).length > 0) {
    response.errors = errors;
  }
  return response;
}
