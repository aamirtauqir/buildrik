import { generateToken } from "@/server/services/token.service";
async function main() {
  const raw = await generateToken("magic_link", process.argv[2], 30);
  console.log(raw);
}
main();
