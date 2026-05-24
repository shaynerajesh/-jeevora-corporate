/**
 * Trace icon region of logo-mark-source.png → public/logo-mark.svg
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PNG } from "pngjs";
import ImageTracer from "imagetracerjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const src = path.join(root, "public", "logo-mark-source.png");
const out = path.join(root, "public", "logo-mark.svg");

/** Icon band height (excludes wordmark + tagline in source art). */
const CROP_H = 385;

const source = PNG.sync.read(fs.readFileSync(src));
const w = source.width;
const h = Math.min(CROP_H, source.height);

const cropped = new PNG({ width: w, height: h });
for (let y = 0; y < h; y++) {
  source.data.copy(cropped.data, y * w * 4, y * w * 4, (y + 1) * w * 4);
}

const imageData = {
  width: w,
  height: h,
  data: cropped.data,
};

const options = {
  ltres: 1,
  qtres: 1,
  pathomit: 6,
  colorsampling: 1,
  numberofcolors: 20,
  mincolorratio: 0.015,
  colorquantcycles: 4,
  scale: 1,
  linefilter: true,
  viewbox: true,
  desc: false,
  // Transparent canvas — no white plate behind the mark
  bkcolor: { r: 255, g: 255, b: 255, a: 0 },
};

const svg = ImageTracer.imagedataToSVG(imageData, options);
let branded = svg.replace(
  /<svg[^>]*>/,
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' +
    w +
    " " +
    h +
    '" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Jeevora">'
);

// Drop traced near-white artifacts (background plate + noise)
branded = branded.replace(
  /<path fill="rgb\(25[0-5],\s*25[0-5],\s*25[0-5]\)"[^>]*\/>/g,
  ""
);

fs.writeFileSync(out, branded, "utf8");
console.log("Wrote", out, `(${branded.length} bytes, ${w}×${h})`);
