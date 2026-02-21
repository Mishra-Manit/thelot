export function apiSuccess<T>(data: T, status = 200): Response {
  return Response.json({ success: true, data }, { status })
}

export function apiError(message: string, status: number): Response {
  return Response.json({ success: false, error: message }, { status })
}
