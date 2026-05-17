export const luhnCheckDigit = (id12: string): number => {
  let total = 0;
  for (let i = 1; i <= 12; i++) {
    let d = parseInt(id12[12 - i], 10);
    if (i % 2 === 0) {
      d *= 2;
      if (d > 9) d = Math.floor(d / 10) + (d % 10);
    }
    total += d;
  }
  return (10 - (total % 10)) % 10;
};

export const validateSAID = (id: string): { valid: boolean; error?: string } => {
  if (!/^\d{13}$/.test(id)) return { valid: false, error: 'ID must be exactly 13 digits.' };
  const mm = parseInt(id.substring(2, 4), 10);
  const dd = parseInt(id.substring(4, 6), 10);
  if (mm < 1 || mm > 12 || dd < 1 || dd > 31) return { valid: false, error: 'ID contains an invalid date.' };
  const yy = parseInt(id.substring(0, 2), 10);
  const currentYear = new Date().getFullYear();
  const birthYear = yy + (yy + 2000 <= currentYear ? 2000 : 1900);
  const birthDate = new Date(birthYear, mm - 1, dd);
  const age = Math.floor((Date.now() - birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
  if (age < 18) return { valid: false, error: 'Voter must be at least 18 years old.' };
  const check = luhnCheckDigit(id.substring(0, 12));
  if (check !== parseInt(id[12], 10)) {
    return { valid: false, error: `Invalid ID check digit (expected ${check}).` };
  }
  return { valid: true };
};
