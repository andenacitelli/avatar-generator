import { it, describe } from "@jest/globals";

// I think Node.js comes with native fetch as of Nodejs 18,
// but I prefer axios's error handling methodology so I'm rolling with it
import {
  discretizePerlinNoise,
  generateImage,
  generateSeeds,
} from "../src/business/generateImage";

describe("Verify Discrete Perlin Noise", () => {
  it("v Above Breakpoint", () => {
    const response = discretizePerlinNoise(0.5);
    expect(response).toBe(1);
  });
  it("v Below Breakpoint", () => {
    const response = discretizePerlinNoise(-0.5);
    expect(response).toBe(0);
  });
});

describe("Verify Seed Generation", () => {
  it("Happy Path", () => {
    const response = generateSeeds();
    expect(response.length).toBe(4);
  });
});

describe("Verify Image Generation", () => {
  it("Happy Path, No Errors", () => {
    generateImage();
  });
});
