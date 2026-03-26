import { getSweph } from "./sweph-loader";

const SIGNS = [
  "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
  "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces",
];

const ASPECTS_DEF = [
  { name: "Conjunction", angle: 0, orb: 8 },
  { name: "Sextile", angle: 60, orb: 5 },
  { name: "Square", angle: 90, orb: 7 },
  { name: "Trine", angle: 120, orb: 7 },
  { name: "Opposition", angle: 180, orb: 8 },
  { name: "Quincunx", angle: 150, orb: 3 },
];

function degreeToSign(degree: number): string {
  return SIGNS[Math.floor(((degree % 360) + 360) % 360 / 30)];
}

function degreeInSign(degree: number): number {
  return ((degree % 360) + 360) % 360 % 30;
}

function degreeToHouse(degree: number, cusps: number[]): number {
  const norm = ((degree % 360) + 360) % 360;
  for (let i = 0; i < 12; i++) {
    const next = (i + 1) % 12;
    let start = cusps[i];
    let end = cusps[next];
    if (end < start) end += 360;
    let d = norm;
    if (d < start) d += 360;
    if (d >= start && d < end) return i + 1;
  }
  return 1;
}

interface PlanetPos {
  degree: number;
  sign: string;
  degreeInSign: number;
  house: number;
  retrograde: boolean;
  sabianDegree: number;
}

interface Aspect {
  planet1: string;
  planet2: string;
  type: string;
  angle: number;
  orb: number;
}

function calculateAspects(positions: Record<string, PlanetPos>): Aspect[] {
  const aspects: Aspect[] = [];
  const names = Object.keys(positions);
  for (let i = 0; i < names.length; i++) {
    for (let j = i + 1; j < names.length; j++) {
      let diff = Math.abs(positions[names[i]].degree - positions[names[j]].degree);
      if (diff > 180) diff = 360 - diff;
      for (const asp of ASPECTS_DEF) {
        const orb = Math.abs(diff - asp.angle);
        if (orb <= asp.orb) {
          aspects.push({ planet1: names[i], planet2: names[j], type: asp.name, angle: asp.angle, orb: Math.round(orb * 100) / 100 });
          break;
        }
      }
    }
  }
  return aspects;
}

export async function calculateBirthChart(birthDate: Date, lat: number, lng: number) {
  const sweph = getSweph();

  const julday = sweph.julday(
    birthDate.getUTCFullYear(), birthDate.getUTCMonth() + 1, birthDate.getUTCDate(),
    birthDate.getUTCHours() + birthDate.getUTCMinutes() / 60, sweph.SE_GREG_CAL
  );

  const housesResult = sweph.houses(julday, lat, lng, "O");
  const cusps: number[] = Array.from(housesResult.data.cusps).slice(1, 13) as number[];

  const PLANETS: Record<string, number> = {
    Sun: sweph.SE_SUN, Moon: sweph.SE_MOON, Mercury: sweph.SE_MERCURY,
    Venus: sweph.SE_VENUS, Mars: sweph.SE_MARS, Jupiter: sweph.SE_JUPITER,
    Saturn: sweph.SE_SATURN, Uranus: sweph.SE_URANUS, Neptune: sweph.SE_NEPTUNE,
    Pluto: sweph.SE_PLUTO, NorthNode: sweph.SE_TRUE_NODE, Chiron: sweph.SE_CHIRON,
    Lilith: sweph.SE_MEAN_APOG,
  };

  const positions: Record<string, PlanetPos> = {};
  for (const [name, id] of Object.entries(PLANETS)) {
    const pos = sweph.calc_ut(julday, id, sweph.SEFLG_SWIEPH);
    const deg = pos.data[0];
    positions[name] = {
      degree: deg,
      sign: degreeToSign(deg),
      degreeInSign: Math.round(degreeInSign(deg) * 100) / 100,
      house: degreeToHouse(deg, cusps),
      retrograde: pos.data[3] < 0,
      sabianDegree: Math.ceil(((deg % 360) + 360) % 360) || 360,
    };
  }

  const southNodeDeg = (positions.NorthNode.degree + 180) % 360;
  const evolutionarySoul = {
    pluto: { ...positions.Pluto, role: "Soul theme" },
    southNode: { degree: southNodeDeg, sign: degreeToSign(southNodeDeg), degreeInSign: Math.round(degreeInSign(southNodeDeg) * 100) / 100, role: "Past lives" },
    northNode: { ...positions.NorthNode, role: "Evolutionary direction" },
    moon: { ...positions.Moon, role: "Soul needs" },
  };

  return {
    positions, houses: cusps, aspects: calculateAspects(positions), evolutionarySoul,
    ascendant: { degree: cusps[0], sign: degreeToSign(cusps[0]) },
    midheaven: { degree: cusps[9], sign: degreeToSign(cusps[9]) },
  };
}

export async function calculateProgressions(birthDate: Date, age: number, lat: number, lng: number) {
  const progressedDate = new Date(birthDate);
  progressedDate.setDate(progressedDate.getDate() + age);
  return calculateBirthChart(progressedDate, lat, lng);
}

export async function calculateSolarReturn(birthDate: Date, lat: number, lng: number) {
  const sweph = getSweph();
  const natalJd = sweph.julday(birthDate.getUTCFullYear(), birthDate.getUTCMonth() + 1, birthDate.getUTCDate(),
    birthDate.getUTCHours() + birthDate.getUTCMinutes() / 60, sweph.SE_GREG_CAL);
  const natalSunDeg = sweph.calc_ut(natalJd, sweph.SE_SUN, sweph.SEFLG_SWIEPH).data[0];

  const currentYear = new Date().getFullYear();
  const approxDate = new Date(Date.UTC(currentYear, birthDate.getMonth(), birthDate.getDate()));
  let jd = sweph.julday(approxDate.getUTCFullYear(), approxDate.getUTCMonth() + 1, approxDate.getUTCDate(), 12, sweph.SE_GREG_CAL);

  for (let i = 0; i < 30; i++) {
    const sunPos = sweph.calc_ut(jd, sweph.SE_SUN, sweph.SEFLG_SWIEPH);
    let diff = sunPos.data[0] - natalSunDeg;
    if (diff > 180) diff -= 360;
    if (diff < -180) diff += 360;
    if (Math.abs(diff) < 0.0001) break;
    jd -= diff / 0.9856;
  }

  const result = sweph.revjul(jd, sweph.SE_GREG_CAL);
  const hours = Math.floor(result.hour);
  const minutes = Math.round((result.hour - hours) * 60);
  const srDate = new Date(Date.UTC(result.year, result.month - 1, result.day, hours, minutes));

  return calculateBirthChart(srDate, lat, lng);
}

export async function calculateTransits(birthDate: Date, lat: number, lng: number) {
  const natalChart = await calculateBirthChart(birthDate, lat, lng);
  const transitChart = await calculateBirthChart(new Date(), lat, lng);

  const transitAspects: Aspect[] = [];
  for (const tp of Object.keys(transitChart.positions)) {
    for (const np of Object.keys(natalChart.positions)) {
      let diff = Math.abs(transitChart.positions[tp].degree - natalChart.positions[np].degree);
      if (diff > 180) diff = 360 - diff;
      for (const asp of ASPECTS_DEF) {
        const orb = Math.abs(diff - asp.angle);
        if (orb <= asp.orb * 0.7) {
          transitAspects.push({ planet1: `Transit ${tp}`, planet2: `Natal ${np}`, type: asp.name, angle: asp.angle, orb: Math.round(orb * 100) / 100 });
          break;
        }
      }
    }
  }

  return { transitPositions: transitChart.positions, transitAspects };
}
