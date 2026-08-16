export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
}

export function isValidPhone(phone: string): boolean {
  const cleaned = phone.replace(/[\s.-]/g, '');
  return /^(\+84|0)[0-9]{8,10}$/.test(cleaned);
}

export function isRequired(value: string | undefined | null): boolean {
  return value != null && value.trim().length > 0;
}
