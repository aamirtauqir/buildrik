// One-off: verify the real generateEditCommands path against live Ollama.
// Run: OLLAMA_BASE_URL=http://localhost:11434 OLLAMA_MODEL=gemini-3-flash-preview:latest npx tsx scripts/ollama-smoke.mts
import * as aiNs from "../server/services/ai.service";
const ai = ((aiNs as unknown as { default?: typeof aiNs }).default ??
  aiNs) as typeof aiNs;

const prompts = [
  "make this dark",
  "change the text to Welcome to Buildrik",
  "make the heading say Pricing and color it blue",
];

for (const prompt of prompts) {
  const out = await ai.generateEditCommands({
    prompt,
    elementId: "el-1",
    model: "ollama",
  });
  console.log(`\n[${prompt}] -> ${out.length} valid command(s)`);
  console.log(JSON.stringify(out));
}
