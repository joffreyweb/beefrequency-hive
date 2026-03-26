const HEAVENLY_STEMS = [
  "Jia", "Yi", "Bing", "Ding", "Wu", "Ji", "Geng", "Xin", "Ren", "Gui",
] as const;

const EARTHLY_BRANCHES = [
  "Zi", "Chou", "Yin", "Mao", "Chen", "Si",
  "Wu", "Wei", "Shen", "You", "Xu", "Hai",
] as const;

const STEM_ELEMENTS: Record<string, string> = {
  Jia: "Yang Wood", Yi: "Yin Wood",
  Bing: "Yang Fire", Ding: "Yin Fire",
  Wu: "Yang Earth", Ji: "Yin Earth",
  Geng: "Yang Metal", Xin: "Yin Metal",
  Ren: "Yang Water", Gui: "Yin Water",
};

const BRANCH_ANIMALS: Record<string, string> = {
  Zi: "Rat", Chou: "Ox", Yin: "Tiger", Mao: "Rabbit",
  Chen: "Dragon", Si: "Snake", Wu: "Horse", Wei: "Goat",
  Shen: "Monkey", You: "Rooster", Xu: "Dog", Hai: "Pig",
};

const BRANCH_ELEMENTS: Record<string, string> = {
  Zi: "Water", Chou: "Earth", Yin: "Wood", Mao: "Wood",
  Chen: "Earth", Si: "Fire", Wu: "Fire", Wei: "Earth",
  Shen: "Metal", You: "Metal", Xu: "Earth", Hai: "Water",
};

function mod(n: number, m: number): number {
  return ((n % m) + m) % m;
}

export function calculateBaZi(birthDate: Date) {
  const year = birthDate.getFullYear();
  const month = birthDate.getMonth() + 1;
  const day = birthDate.getDate();
  const hour = birthDate.getHours();

  // Year pillar
  const yearStemIdx = mod(year - 4, 10);
  const yearBranchIdx = mod(year - 4, 12);

  // Month pillar (based on solar terms, simplified here)
  const monthBranchIdx = mod(month + 1, 12);
  // Month stem derived from year stem
  const yearStemGroup = mod(yearStemIdx, 5);
  const monthStemIdx = mod(yearStemGroup * 2 + month, 10);

  // Day pillar (using the standard day count formula)
  // Reference: Jan 1, 1900 was Jia-Zi (stem=0, branch=0)
  const ref = new Date(1900, 0, 1);
  const daysDiff = Math.floor((birthDate.getTime() - ref.getTime()) / 86400000);
  const dayStemIdx = mod(daysDiff, 10);
  const dayBranchIdx = mod(daysDiff, 12);

  // Hour pillar
  const hourBranchIdx = Math.floor(mod(hour + 1, 24) / 2);
  const dayGroup = mod(dayStemIdx, 5);
  const hourStemIdx = mod(dayGroup * 2 + hourBranchIdx, 10);

  function pillar(stemIdx: number, branchIdx: number) {
    const stem = HEAVENLY_STEMS[stemIdx];
    const branch = EARTHLY_BRANCHES[branchIdx];
    return {
      stem,
      branch,
      element: STEM_ELEMENTS[stem],
      animal: BRANCH_ANIMALS[branch],
      branchElement: BRANCH_ELEMENTS[branch],
    };
  }

  const pillars = {
    year: pillar(yearStemIdx, yearBranchIdx),
    month: pillar(monthStemIdx, monthBranchIdx),
    day: pillar(dayStemIdx, dayBranchIdx),
    hour: pillar(hourStemIdx, hourBranchIdx),
  };

  // Day Master (element of the Day Stem)
  const dayMaster = STEM_ELEMENTS[HEAVENLY_STEMS[dayStemIdx]];

  // Element count
  const elements: Record<string, number> = {
    Wood: 0, Fire: 0, Earth: 0, Metal: 0, Water: 0,
  };
  for (const p of Object.values(pillars)) {
    const stemEl = p.element.replace("Yang ", "").replace("Yin ", "");
    elements[stemEl]++;
    elements[p.branchElement]++;
  }

  const dominant = Object.entries(elements).sort((a, b) => b[1] - a[1])[0][0];
  const weakest = Object.entries(elements).sort((a, b) => a[1] - b[1])[0][0];

  return {
    pillars,
    dayMaster,
    elementBalance: elements,
    dominantElement: dominant,
    weakestElement: weakest,
  };
}
