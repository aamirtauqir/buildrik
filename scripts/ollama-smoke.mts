// One-off: verify the real generateStyleCommands path against live Ollama.
// Run: OLLAMA_BASE_URL=http://localhost:11434 OLLAMA_MODEL=qwen3.6:latest npx tsx scripts/ollama-smoke.mts
import * as aiNs from "../server/services/ai.service";
const ai = ((aiNs as unknown as { default?: typeof aiNs }).default ??
  aiNs) as typeof aiNs;

const prompts = ["make this dark"];

for (const prompt of prompts) {
  const out = await ai.generateStyleCommands({
    prompt,
    elementId: "el-1",
    model: "ollama",
  });
  console.log(`\n[${prompt}] -> ${out.length} valid command(s)`);
  console.log(JSON.stringify(out));
}
