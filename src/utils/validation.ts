export function isValidEmail(text: string): boolean {
  const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
  return emailRegex.test(text.trim());
}

export function isValidPhone(text: string): boolean {
  const digits = text.replace(/[^\d+]/g, '');
  // Accept E.164-like or 10+ digit local numbers
  if (digits.startsWith('+')) {
    const rest = digits.slice(1);
    return /^\d{7,15}$/.test(rest);
  }
  return /^\d{10,15}$/.test(digits);
}

export function normalizeIdentifier(input: string): string {
  const v = input.trim();
  if (isValidEmail(v)) return v.toLowerCase();
  // keep + for E.164, else digits
  const cleaned = v.replace(/[^\d+]/g, '');
  return cleaned;
}

export function maskIdentifier(identifier: string): string {
  if (isValidEmail(identifier)) {
    const [name, domain] = identifier.split('@');
    const maskedName =
      name.length <= 2
        ? `${name[0] ?? ''}*`
        : `${name[0]}${'*'.repeat(Math.max(1, name.length - 2))}${
            name[name.length - 1]
          }`;
    return `${maskedName}@${domain}`;
  }
  // phone
  const digits = identifier.replace(/[^\d]/g, '');
  if (digits.length <= 4) return `****${digits}`;
  return `${'*'.repeat(Math.max(0, digits.length - 4))}${digits.slice(-4)}`;
}
