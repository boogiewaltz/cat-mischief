/**
 * Simple seeded pseudo-random number generator (Park-Miller LCG)
 * Used for deterministic scene generation in test/regression mode
 */
export class SeededRNG {
  private seed: number;
  
  constructor(seed: number = Date.now()) {
    this.seed = seed % 2147483647;
    if (this.seed <= 0) this.seed += 2147483646;
  }

  /**
   * Returns a pseudo-random number between 0 (inclusive) and 1 (exclusive)
   */
  public random(): number {
    this.seed = (this.seed * 16807) % 2147483647;
    return (this.seed - 1) / 2147483646;
  }

  /**
   * Returns a pseudo-random integer between min (inclusive) and max (inclusive)
   */
  public randomInt(min: number, max: number): number {
    return Math.floor(this.random() * (max - min + 1)) + min;
  }

  /**
   * Returns a pseudo-random number between min (inclusive) and max (exclusive)
   */
  public randomRange(min: number, max: number): number {
    return this.random() * (max - min) + min;
  }

  /**
   * Get current seed value
   */
  public getSeed(): number {
    return this.seed;
  }
}

// Global RNG instance - can be seeded via test mode
let globalRNG: SeededRNG | null = null;

/**
 * Initialize the global RNG with a specific seed (for test mode)
 */
export function initRNG(seed: number): void {
  globalRNG = new SeededRNG(seed);
}

/**
 * Get a random number - uses seeded RNG if in test mode, otherwise Math.random
 */
export function getRandom(): number {
  return globalRNG ? globalRNG.random() : Math.random();
}

/**
 * Check if we're in test mode (deterministic RNG enabled)
 */
export function isTestMode(): boolean {
  return globalRNG !== null;
}

