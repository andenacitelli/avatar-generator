import { createNoise2D } from "simplex-noise";
import { createHash } from "crypto";
import alea from "alea";
const { createCanvas } = require("canvas");
const fs = require("fs");
import { v4 as uuidv4 } from "uuid";

// REPLACE THIS WITH A STRING of your choice
const SEED: string | undefined = undefined;

/**
 * Generate deterministic random seeds.
 */
export const generateSeeds = () => {
  let current = SEED ?? uuidv4();
  const seeds: string[] = [];
  for (let i = 0; i < 4; i++) {
    const hash = createHash("sha256").update(current).digest("hex");
    current = hash;
    seeds.push(hash);
  }
  return seeds;
};

/**
 * Generates an avatar image and saves it to the filesystem at /icon.jpg.
 * NOTE: This function is only called from the backend, so it has filesystem privileges.
 * NOTE: I don't usually comment every line (I usually just comment anything that requires a "why" to explain, and try to write self-documenting code otherwise), but this is basically an orchestration function, so it's more to self-organize
 */
export const generateImage = () => {
  //* Generate four random Perlin seeds, each corresponding to a color
  //* We do this deterministically by hashing our input value four times sequentially
  const seedStrings: string[] = generateSeeds();

  //* For each seed, generate a Perlin map noise instance
  const rngFunctions = seedStrings.map((seed) => alea(seed));
  const noises = rngFunctions.map((fn) => createNoise2D(fn));

  //* Generate a Perlin noise map for each color; this is a 2D array of numbers between 0 and 1
  const SCALE_FACTOR = 128; // How "zoomed in" to the Perlin noise we are; higher = more zoomed in and more gradual change to color. I've manually tweaked this through trial and error to a good value.
  const SIZE = 256;
  const perlinMapsForColors = noises.map((noise) => {
    let perlinMap: number[][] = Array.from({ length: SIZE }, () => []);
    for (let y = 0; y < SIZE; y++) {
      for (let x = 0; x < SIZE; x++) {
        const value = noise(x / SCALE_FACTOR, y / SCALE_FACTOR);
        perlinMap[x][y] = discretizePerlinNoise(value);
      }
    }
    return perlinMap;
  });

  //* Write each map/color sequentially; start out with all white
  let colors: { [s: string]: { r: number; g: number; b: number } } = {};
  for (let x = 0; x < SIZE; x++) {
    for (let y = 0; y < SIZE; y++) {
      colors[`${x},${y}`] = { r: 225, g: 225, b: 225 }; // Straight white is jarring
    }
  }

  const prng = alea(SEED ?? uuidv4());
  for (const map of perlinMapsForColors) {
    // Each map has one color and goes on top of the previous one
    const color = Array.from({ length: 3 }, () =>
      // Darker colors tend to look better on white, so we cap at 180 per
      Math.floor(prng.next() * 180)
    );
    for (let y = 0; y < SIZE; y++) {
      for (let x = 0; x < SIZE; x++) {
        const transformedX = x > SIZE / 2 ? SIZE - x : x;
        const key = `${transformedX},${y}`;
        if (map[transformedX][y] === 1) {
          colors[key] = { r: color[0], g: color[1], b: color[2] };
        }
      }
    }
  }

  const canvas = createCanvas(SIZE, SIZE);
  const ctx = canvas.getContext("2d");
  for (let x = 0; x < SIZE; x++) {
    for (let y = 0; y < SIZE; y++) {
      const transformedX = x > SIZE / 2 ? SIZE - x : x;
      const key = `${transformedX},${y}`;
      const color = colors[key];
      ctx.fillStyle = `rgb(${color.r}, ${color.g}, ${color.b})`;
      ctx.fillRect(x, y, 1, 1);
    }
  }

  //* Write to file
  const buffer = canvas.toBuffer("image/png");
  fs.writeFileSync("public/image.png", buffer);
};

/**
 * [.75, 1] => 1, [0, .75] => 0. We want to be conservative so no color drowns the other out,
 * but still feels continuous and natural.
 * @param v Value to discretize.
 */
export const discretizePerlinNoise = (v: number) => (v >= 0.25 ? 1 : 0);
