import { Game } from './game/Game';
import { initRNG } from './game/utils/rng';

// Check for test mode / seed in URL params
const urlParams = new URLSearchParams(window.location.search);
const testMode = urlParams.has('test');
const seedParam = urlParams.get('seed');

if (testMode || seedParam) {
  const seed = seedParam ? parseInt(seedParam, 10) : 12345;
  console.log(`[Test Mode] Initializing with seed: ${seed}`);
  initRNG(seed);
}

const game = new Game();
game.start();

