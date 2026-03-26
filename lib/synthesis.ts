import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

async function generate(prompt: string, maxTokens: number = 1000): Promise<string> {
  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: maxTokens,
    messages: [{ role: "user", content: prompt }],
  });
  const block = response.content[0];
  return block.type === "text" ? block.text : "";
}

export async function generateHDSynthesis(hdData: any, clientName: string): Promise<string> {
  return generate(
    `You are Joffrey Deleplanque, a Human Design practitioner with 30 years of experience.
Generate an HD synthesis for ${clientName} in 5 short sections.
HD Data: ${JSON.stringify(hdData)}
Sections: 1) Type & Strategy 2) Authority & Decision 3) How to communicate
4) Patterns & Issues 5) Therapeutic entry points
Style: direct, clinical, professional. No flattery. Never more than 3 lines per section.
Write in English.`,
    1000
  );
}

export async function generateAstroSynthesis(astroData: any, clientName: string): Promise<string> {
  return generate(
    `You use Kaypacha's system (Evolutionary Astrology).
Generate an astrological synthesis for ${clientName}.
Data: ${JSON.stringify(astroData)}
Sections: 1) Soul theme (Pluto) 2) Past life baggage (South Node + Moon)
3) Evolutionary direction (North Node) 4) Solar Return — year focus
5) Active major transits 6) Entry points for Joffrey's work
Style: deep, evolutionary, soul-purpose. 3-4 lines per section.
Write in English.`,
    1200
  );
}

export async function generateBaziSynthesis(baziData: any, clientName: string): Promise<string> {
  return generate(
    `BaZi (Four Pillars) synthesis for ${clientName}.
Data: ${JSON.stringify(baziData)}
Sections: 1) Dominant element 2) Imbalances 3) Favorable windows 2026
Style: concise, operational, 2-3 lines per section.
Write in English.`,
    800
  );
}
