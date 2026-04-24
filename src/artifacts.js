import fs from "fs";
import path from "path";

export async function writeArtifact(name, data) {
  const outDir = path.join(process.cwd(), "artifacts");
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);

  const filePath = path.join(outDir, `${name}.json`);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));

  return filePath;
}
