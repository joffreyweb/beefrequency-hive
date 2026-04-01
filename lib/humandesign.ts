import { getSweph } from "./sweph-loader";

// Complete 64 Gates mapping in mandala order
const GATE_ORDER: number[] = [
  41, 19, 13, 49, 30, 55, 37, 63, 22, 36, 25, 17, 21, 51, 42, 3,
  27, 24, 2, 23, 8, 20, 16, 35, 45, 12, 15, 52, 39, 53, 62, 56,
  31, 33, 7, 4, 29, 59, 40, 64, 47, 6, 46, 18, 48, 57, 32, 50,
  28, 44, 1, 43, 14, 34, 9, 5, 26, 11, 10, 58, 38, 54, 61, 60,
];

const CENTERS: Record<string, number[]> = {
  HEAD: [64, 61, 63],
  AJNA: [47, 24, 4, 17, 43, 11],
  THROAT: [62, 23, 56, 35, 12, 45, 33, 8, 31, 20, 16],
  G: [1, 13, 25, 46, 2, 15, 10, 7],
  HEART: [21, 51, 26, 40],
  SACRAL: [5, 14, 29, 59, 9, 3, 42, 27, 34],
  SPLEEN: [48, 57, 44, 50, 32, 28, 18],
  SOLAR_PLEXUS: [6, 37, 22, 36, 30, 55, 49],
  ROOT: [53, 60, 52, 19, 39, 41, 58, 38, 54],
};

const CHANNELS: [number, number][] = [
  [64, 47], [61, 24], [63, 4],
  [17, 62], [43, 23], [11, 56],
  [20, 34], [20, 10], [20, 57],
  [8, 1], [31, 7], [33, 13], [16, 48], [12, 22], [45, 21], [35, 36],
  [25, 51], [46, 29], [2, 14], [15, 5],
  [26, 44], [40, 37],
  [59, 6], [27, 50], [34, 57], [9, 52], [3, 60], [42, 53],
  [28, 38], [32, 54], [18, 58],
  [39, 55], [41, 30], [19, 49],
];

const PLANET_NAMES = [
  "Sun", "Moon", "Mercury", "Venus", "Mars", "Jupiter",
  "Saturn", "Uranus", "Neptune", "Pluto", "North Node", "Chiron",
];

export function degreeToGate(degree: number): { gate: number; line: number } {
  const norm = ((degree % 360) + 360) % 360;
  const index = Math.floor(norm / 5.625);
  const gate = GATE_ORDER[index % 64];
  const withinGate = norm - index * 5.625;
  const line = Math.min(Math.floor(withinGate / 0.9375) + 1, 6);
  return { gate, line };
}

function getDefinedCenters(allGates: Set<number>): string[] {
  const defined: string[] = [];
  for (const [center] of Object.entries(CENTERS)) {
    for (const [g1, g2] of CHANNELS) {
      if (allGates.has(g1) && allGates.has(g2)) {
        const c1 = Object.entries(CENTERS).find(([, gs]) => gs.includes(g1))?.[0];
        const c2 = Object.entries(CENTERS).find(([, gs]) => gs.includes(g2))?.[0];
        if ((c1 === center || c2 === center) && !defined.includes(center)) {
          defined.push(center);
        }
      }
    }
  }
  return defined;
}

function getDefinedChannels(allGates: Set<number>): string[] {
  return CHANNELS
    .filter(([g1, g2]) => allGates.has(g1) && allGates.has(g2))
    .map(([g1, g2]) => `${g1}-${g2}`);
}

function determineType(definedCenters: string[]): string {
  const hasSacral = definedCenters.includes("SACRAL");
  const hasMotorToThroat = definedCenters.includes("THROAT") && (
    definedCenters.includes("HEART") ||
    definedCenters.includes("SOLAR_PLEXUS") ||
    definedCenters.includes("ROOT")
  );
  if (hasSacral && hasMotorToThroat) return "Manifesting Generator";
  if (hasSacral) return "Generator";
  if (hasMotorToThroat) return "Manifestor";
  if (definedCenters.length === 0) return "Reflector";
  return "Projector";
}

function determineAuthority(definedCenters: string[]): string {
  if (definedCenters.includes("SOLAR_PLEXUS")) return "Emotional";
  if (definedCenters.includes("SACRAL")) return "Sacral";
  if (definedCenters.includes("SPLEEN")) return "Splenic";
  if (definedCenters.includes("HEART")) return "Ego";
  if (definedCenters.includes("G")) return "Self-Projected";
  if (definedCenters.includes("AJNA")) return "Mental";
  return "Lunar (No Inner Authority)";
}

export async function calculateHumanDesign(birthDate: Date, lat: number, lng: number) {
  const sweph = getSweph();

  const julday = sweph.julday(
    birthDate.getUTCFullYear(), birthDate.getUTCMonth() + 1, birthDate.getUTCDate(),
    birthDate.getUTCHours() + birthDate.getUTCMinutes() / 60, 1 /* SE_GREG_CAL */
  );

  // Literal constants (sweph.SE_* may be undefined in some builds)
  const SE_SUN = 0;
  const SEFLG_SWIEPH = 2;

  // Design date: 88 solar degrees before birth
  const birthSun = sweph.calc_ut(julday, SE_SUN, SEFLG_SWIEPH);
  const targetDeg = ((birthSun.data[0] - 88) + 360) % 360;
  let designJd = julday - 88;
  for (let i = 0; i < 20; i++) {
    const sunPos = sweph.calc_ut(designJd, SE_SUN, SEFLG_SWIEPH);
    let diff = sunPos.data[0] - targetDeg;
    if (diff > 180) diff -= 360;
    if (diff < -180) diff += 360;
    if (Math.abs(diff) < 0.0001) break;
    designJd -= diff / 0.9856;
  }

  // Planet IDs: Sun=0 Moon=1 Mercury=2 Venus=3 Mars=4 Jupiter=5
  // Saturn=6 Uranus=7 Neptune=8 Pluto=9 TrueNode=11 Chiron=15
  const PLANET_IDS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 15];

  const personalityGates = PLANET_IDS.map((p: number, i: number) => {
    const pos = sweph.calc_ut(julday, p, SEFLG_SWIEPH);
    return { planet: PLANET_NAMES[i], ...degreeToGate(pos.data[0]), degree: pos.data[0] };
  });

  const designGates = PLANET_IDS.map((p: number, i: number) => {
    const pos = sweph.calc_ut(designJd, p, SEFLG_SWIEPH);
    return { planet: PLANET_NAMES[i], ...degreeToGate(pos.data[0]), degree: pos.data[0] };
  });

  const allGates = new Set([
    ...personalityGates.map((g) => g.gate),
    ...designGates.map((g) => g.gate),
  ]);

  const definedCenters = getDefinedCenters(allGates);
  const definedChannels = getDefinedChannels(allGates);
  const type = determineType(definedCenters);
  const authority = determineAuthority(definedCenters);
  const profile = `${personalityGates[0].line}/${designGates[0].line}`;

  const earthP = degreeToGate((personalityGates[0].degree + 180) % 360);
  const earthD = degreeToGate((designGates[0].degree + 180) % 360);
  const cross = `${personalityGates[0].gate}/${earthP.gate} | ${designGates[0].gate}/${earthD.gate}`;

  return {
    type, authority, profile, cross,
    definedCenters, definedChannels,
    definedGates: Array.from(allGates),
    personalityGates, designGates,
  };
}
