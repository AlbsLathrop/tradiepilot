export function sanitizeString(input: unknown, maxLength = 500): string {
  if (typeof input !== 'string') return '';
  return input
    .replace(/<[^>]*>/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .trim()
    .slice(0, maxLength);
}

export function validateRequired(body: any, fields: string[]): string | null {
  for (const field of fields) {
    if (
      !body[field] ||
      (typeof body[field] === 'string' && !body[field].trim())
    ) {
      return `Missing required field: ${field}`;
    }
  }
  return null;
}

export function validateEmail(email: unknown): boolean {
  if (typeof email !== 'string') return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validatePhoneNumber(phone: unknown): boolean {
  if (typeof phone !== 'string') return false;
  const phoneRegex = /^[\d\s\-\+\(\)]{7,}$/;
  return phoneRegex.test(phone);
}

export function validateNumber(value: unknown, min = 0, max = 1000000): boolean {
  if (typeof value !== 'number') return false;
  return value >= min && value <= max;
}
