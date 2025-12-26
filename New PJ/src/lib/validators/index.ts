export function isValidHandle(handle: string): boolean {
  return /^[a-zA-Z0-9_-]{3,20}$/.test(handle);
}

export function isValidIPFSHash(hash: string): boolean {
  return /^Qm[1-9A-HJ-NP-Za-km-z]{44}$/.test(hash) || /^bafy[a-zA-Z0-9]{50,}$/.test(hash);
}

export function isValidURL(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function validateSkills(skills: string[]): boolean {
  return skills.length > 0 && skills.length <= 50 && skills.every(s => s.length <= 50);
}
