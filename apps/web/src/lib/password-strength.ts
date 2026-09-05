export type PasswordStrengthRating = "Weak" | "Fair" | "Good" | "Strong";

export type PasswordStrengthInput = {
  email?: string;
  name?: string;
  password: string;
};

export type PasswordStrengthResult = {
  rating: PasswordStrengthRating;
  score: number;
};

function normalize(value: string | undefined) {
  return value?.trim().toLowerCase() ?? "";
}

function containsSequentialPattern(password: string) {
  const normalized = password.toLowerCase();
  const sequences = ["abcdefghijklmnopqrstuvwxyz", "0123456789", "qwertyuiop"];

  return sequences.some((sequence) => {
    for (let index = 0; index <= sequence.length - 4; index += 1) {
      const fragment = sequence.slice(index, index + 4);
      const reversed = fragment.split("").reverse().join("");
      if (normalized.includes(fragment) || normalized.includes(reversed)) {
        return true;
      }
    }

    return false;
  });
}

function containsRepeatedPattern(password: string) {
  const normalized = password.toLowerCase();
  return /(.)\1{2,}/.test(normalized) || /(.{2,4})\1{1,}/.test(normalized);
}

export function getPasswordStrength({
  email,
  name,
  password,
}: PasswordStrengthInput): PasswordStrengthResult {
  if (!password) return { rating: "Weak", score: 0 };

  let score = 0;

  if (password.length >= 8) score += 15;
  if (password.length >= 12) score += 25;
  if (password.length >= 16) score += 20;
  if (password.length >= 20) score += 15;

  const varietyChecks = [
    /[a-z]/.test(password),
    /[A-Z]/.test(password),
    /\d/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ];
  score += varietyChecks.filter(Boolean).length * 7;

  const normalizedPassword = password.toLowerCase();
  const weakTerms = ["password", "letmein", "welcome", "admin", "qwerty"];
  if (weakTerms.some((term) => normalizedPassword.includes(term))) score -= 30;
  if (containsRepeatedPattern(password)) score -= 25;
  if (containsSequentialPattern(password)) score -= 20;

  const normalizedName = normalize(name);
  if (normalizedName) {
    const nameParts = normalizedName.split(/\s+/).filter((part) => part.length >= 3);
    if (nameParts.some((part) => normalizedPassword.includes(part))) score -= 25;
  }

  const emailLocalPart = normalize(email).split("@")[0];
  if (emailLocalPart && emailLocalPart.length >= 3) {
    if (normalizedPassword.includes(emailLocalPart)) score -= 25;
  }

  const boundedScore = Math.max(0, Math.min(100, score));

  if (boundedScore >= 85 && password.length >= 16) {
    return { rating: "Strong", score: boundedScore };
  }

  if (boundedScore >= 60) return { rating: "Good", score: boundedScore };
  if (boundedScore >= 35) return { rating: "Fair", score: boundedScore };
  return { rating: "Weak", score: boundedScore };
}
