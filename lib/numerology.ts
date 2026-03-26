function sumDigits(n: number): number {
  if (n <= 9 || n === 11 || n === 22 || n === 33) return n;
  return sumDigits(
    String(n)
      .split("")
      .reduce((a, d) => a + parseInt(d), 0)
  );
}

function letterValue(c: string): number {
  const map: Record<string, number> = {
    A: 1, B: 2, C: 3, D: 4, E: 5, F: 6, G: 7, H: 8, I: 9,
    J: 1, K: 2, L: 3, M: 4, N: 5, O: 6, P: 7, Q: 8, R: 9,
    S: 1, T: 2, U: 3, V: 4, W: 5, X: 6, Y: 7, Z: 8,
  };
  return map[c.toUpperCase()] || 0;
}

export function calculateNumerology(birthDate: Date, fullName: string) {
  const d = birthDate.getDate();
  const m = birthDate.getMonth() + 1;
  const y = birthDate.getFullYear();

  // Life Path: sum all digits of birth date
  const lifePathRaw = String(d) + String(m) + String(y);
  const lifePath = sumDigits(
    lifePathRaw.split("").reduce((a, c) => a + parseInt(c), 0)
  );

  // Expression Number (full name)
  const cleanName = fullName.replace(/[^a-zA-Z]/g, "");
  const expressionRaw = cleanName
    .split("")
    .reduce((a, c) => a + letterValue(c), 0);
  const expression = sumDigits(expressionRaw);

  // Soul Number (vowels only)
  const vowels = fullName
    .toUpperCase()
    .replace(/[^AEIOUY]/g, "");
  const soulRaw = vowels
    .split("")
    .reduce((a, c) => a + letterValue(c), 0);
  const soul = sumDigits(soulRaw);

  // Personality Number (consonants only)
  const consonants = fullName
    .toUpperCase()
    .replace(/[AEIOUY\s]/g, "");
  const personalityRaw = consonants
    .split("")
    .reduce((a, c) => a + letterValue(c), 0);
  const personality = sumDigits(personalityRaw);

  // Birthday Number
  const birthday = sumDigits(d);

  // Maturity Number
  const maturity = sumDigits(lifePath + expression);

  return {
    lifePath,
    expression,
    soul,
    personality,
    birthday,
    maturity,
  };
}
