export function logSecurityEvent(
  event: string,
  route: string,
  method: string,
  ip: string,
  status: number,
  details?: any
) {
  const timestamp = new Date().toISOString();
  const log = {
    timestamp,
    event,
    route,
    method,
    ip,
    status,
    ...(details && { details }),
  };
  console.log(JSON.stringify(log));
}

export function logAuthFailure(route: string, ip: string, reason: string) {
  logSecurityEvent('AUTH_FAILURE', route, 'POST', ip, 401, { reason });
}

export function logRateLimitExceeded(route: string, ip: string) {
  logSecurityEvent('RATE_LIMIT_EXCEEDED', route, 'POST', ip, 429);
}

export function logValidationError(
  route: string,
  ip: string,
  field: string,
  reason: string
) {
  logSecurityEvent('VALIDATION_ERROR', route, 'POST', ip, 400, {
    field,
    reason,
  });
}
