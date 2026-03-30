import { getCoordinates } from "./geocoding";
import { calculateHumanDesign } from "./humandesign";
import {
  calculateBirthChart,
  calculateProgressions,
  calculateSolarReturn,
  calculateTransits,
} from "./astrology";
import { calculateBaZi } from "./bazi";
import { calculateNumerology } from "./numerology";
import {
  generateHDSynthesis,
  generateAstroSynthesis,
  generateBaziSynthesis,
} from "./synthesis";
import { prisma } from "./prisma";

export async function generateAllCartes(clientId: string) {
  const client = await prisma.client.findUnique({
    where: { id: clientId },
    include: { user: true, intake: true },
  });

  if (!client) {
    console.error("Client not found:", clientId);
    return;
  }

  // Get birth data from intake or client fields
  const birthDateRaw = client.intake?.birthDate;
  const birthCity = client.birthCity || client.intake?.birthPlace;
  const birthCountry = client.birthCountry || client.intake?.birthCountry;
  const birthTimeStr = client.birthTime || client.intake?.birthTime;

  if (!birthDateRaw || !birthCity) {
    console.log("Incomplete birth data for", client.user.name, "— skipping generation");
    return;
  }

  try {
    // 1. Geocoding
    const { lat, lng } = await getCoordinates(birthCity, birthCountry || "");
    console.log(`Geocoded ${birthCity}: ${lat}, ${lng}`);

    // 2. Build birth date with time
    const birthDate = new Date(birthDateRaw);
    if (birthTimeStr) {
      const [h, m] = birthTimeStr.split(":").map(Number);
      birthDate.setUTCHours(h, m, 0, 0);
    }

    // 3. Swiss Ephemeris calculations
    const hdRaw = await calculateHumanDesign(birthDate, lat, lng);
    const natalChart = await calculateBirthChart(birthDate, lat, lng);
    const age = new Date().getFullYear() - birthDate.getFullYear();
    const progressions = await calculateProgressions(birthDate, age, lat, lng);
    const solarReturn = await calculateSolarReturn(birthDate, lat, lng);
    const transits = await calculateTransits(birthDate, lat, lng);
    const baziRaw = calculateBaZi(birthDate);
    const numerologyRaw = calculateNumerology(birthDate, client.user.name || "");

    console.log(`Calculations done for ${client.user.name}: HD type=${hdRaw.type}`);

    // 4. Claude API syntheses
    let hdSynthesis = "";
    let astroSynthesis = "";
    let baziSynthesis = "";

    if (process.env.ANTHROPIC_API_KEY) {
      hdSynthesis = await generateHDSynthesis(hdRaw, client.user.name || "");
      astroSynthesis = await generateAstroSynthesis(
        { natalChart, progressions, solarReturn, transits },
        client.user.name || ""
      );
      baziSynthesis = await generateBaziSynthesis(baziRaw, client.user.name || "");
      console.log("Syntheses generated via Claude API");
    } else {
      console.log("ANTHROPIC_API_KEY not set — skipping syntheses");
    }

    // 5. Save to DB
    await prisma.client.update({
      where: { id: clientId },
      data: {
        birthLat: lat,
        birthLng: lng,
        birthCity,
        birthCountry: birthCountry || undefined,
        birthTime: birthTimeStr || undefined,
        hdType: hdRaw.type.toUpperCase().replace(/ /g, "_"),
        hdFullData: { ...hdRaw, synthesis: hdSynthesis } as any,
        astroData: {
          natalChart,
          progressions,
          solarReturn,
          transits,
          synthesis: astroSynthesis,
        } as any,
        baziData: { ...baziRaw, synthesis: baziSynthesis } as any,
        numerologyData: numerologyRaw as any,
        cartesGeneratedAt: new Date(),
      },
    });

    // 6. Create Open WebUI queue entry
    const fullContent = JSON.stringify({
      hd: { ...hdRaw, synthesis: hdSynthesis },
      astro: { synthesis: astroSynthesis },
      bazi: { ...baziRaw, synthesis: baziSynthesis },
      numerology: numerologyRaw,
    });

    await prisma.openWebuiQueue.create({
      data: {
        clientId,
        clientName: client.user.name || "Client",
        content: fullContent,
      },
    });

    console.log(`All cards generated for ${client.user.name}`);
  } catch (error) {
    console.error("Error generating cards for client", clientId, ":", error);
    // Sauvegarder l'erreur pour feedback admin
    try {
      await prisma.client.update({
        where: { id: clientId },
        data: {
          hdFullData: { error: String(error) } as any,
          cartesGeneratedAt: null,
        },
      });
    } catch {
      // Ignore DB error during error handling
    }
    throw error; // Re-throw pour que le .catch() dans la route logge aussi
  }
}
