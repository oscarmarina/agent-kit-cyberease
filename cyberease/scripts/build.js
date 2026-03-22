import { cp, mkdir, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..");
const dist = path.join(root, "dist");

await rm(dist, { force: true, recursive: true });
await mkdir(dist, { recursive: true });

await Promise.all([
  cp(path.join(root, "index.html"), path.join(dist, "index.html")),
  cp(path.join(root, "styles.css"), path.join(dist, "styles.css")),
  cp(path.join(root, "src"), path.join(dist, "src"), { recursive: true }),
]);

console.log(`Built static app to ${dist}`);