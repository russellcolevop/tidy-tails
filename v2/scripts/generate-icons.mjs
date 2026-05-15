// Generates placeholder PWA icons for Tidy Tails v2.
//
// These are PLACEHOLDERS — a paw mark on the brand purple. Replace with a
// finished icon set before any production launch. Run: `npm run icons`.

import { mkdir } from "node:fs/promises";
import sharp from "sharp";

const PURPLE_TOP = "#8b5cf6";
const PURPLE_BOTTOM = "#5b21b6";

// Paw mark, kept within the central safe zone so the same art works masked.
const paw = `
  <g fill="#fdfcff" transform="translate(0 12)">
    <path d="M256 286c-46 0-76 27-76 57 0 27 25 39 76 39s76-12 76-39c0-30-30-57-76-57z"/>
    <ellipse cx="189" cy="246" rx="30" ry="37"/>
    <ellipse cx="323" cy="246" rx="30" ry="37"/>
    <ellipse cx="231" cy="200" rx="27" ry="34"/>
    <ellipse cx="281" cy="200" rx="27" ry="34"/>
  </g>`;

function svg(cornerRadius) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${PURPLE_TOP}"/>
      <stop offset="1" stop-color="${PURPLE_BOTTOM}"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="${cornerRadius}" fill="url(#g)"/>${paw}
</svg>`;
}

const rounded = Buffer.from(svg(116)); // standard "any" icon
const square = Buffer.from(svg(0)); // full-bleed for maskable / apple-touch

await mkdir("public/icons", { recursive: true });

await sharp(rounded).resize(192, 192).png().toFile("public/icons/icon-192.png");
await sharp(rounded).resize(512, 512).png().toFile("public/icons/icon-512.png");
await sharp(square).resize(512, 512).png().toFile("public/icons/icon-maskable.png");
await sharp(square).resize(180, 180).png().toFile("app/apple-icon.png");

console.log("Generated: icon-192, icon-512, icon-maskable, apple-icon (placeholders).");
