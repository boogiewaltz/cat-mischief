# Cat Mischief - Three.js Prototype

A playful 3D cat sandbox game where you cause mischief around a house using paw swipes.

## Controls

- **WASD**: Move
- **Space**: Jump
- **Shift**: Sprint
- **Q**: Left paw swipe
- **E**: Right paw swipe
- **F3**: Toggle debug info

## Setup

```bash
npm install
npm run dev
```

Open http://localhost:3000

## Build

```bash
npm run build
npm run preview
```

## Testing

### Quality Assurance Workflow

Run all quality gates locally before committing:
```bash
npm run qa
```

This command runs:
1. **Typecheck**: `tsc --noEmit` - Catch TypeScript errors
2. **Build**: `vite build` - Verify production build works
3. **E2E Tests**: Playwright smoke tests with screenshots

### Automated E2E Tests
```bash
npm run test:e2e        # Run tests headless
npm run test:e2e:ui     # Run tests with UI
npm run test:e2e:debug  # Debug tests
```

### Test Mode (Deterministic)

For reproducible testing and bug reports, use test mode with a specific seed:

- `http://localhost:3000/?test=1` - Uses default seed (12345)
- `http://localhost:3000/?seed=99999` - Uses custom seed

**Why use test mode?**
- Deterministic scene generation (same decor placement every time)
- Deterministic NPC behavior (same random patterns)
- Reproducible screenshots for regression testing
- Makes bugs easier to reproduce and fix

**How to reproduce a bug deterministically:**
1. Load game in test mode: `?test=1&seed=12345`
2. Perform the steps that trigger the bug
3. Press F3 to see exact player position
4. Take screenshot (or note console errors)
5. Report bug with seed and steps in [BUG_REPORT.md](./BUG_REPORT.md)

## Features (MVP)

- Third-person cat movement with physics
- Left/right paw swipe interactions
- **13 knockable objects** (plates, cups, bottles, jars, plant pot)
- **2 scratchable surfaces** (couch, scratching post)
- Task system with progress tracking (4 tasks)
- Mischief scoring
- 1 wandering NPC (humanoid)

## Manual Smoke Test Checklist

Before each release, manually verify:

### Core Functionality
- [ ] Game loads without console errors
- [ ] Canvas renders the 3D scene
- [ ] Cat model is visible and positioned correctly
- [ ] Camera follows the player smoothly

### Movement Controls
- [ ] **W** moves cat forward (Z decreases)
- [ ] **S** moves cat backward (Z increases)
- [ ] **A** moves cat left (X decreases)
- [ ] **D** moves cat right (X increases)
- [ ] **Space** makes cat jump
- [ ] **Shift** makes cat sprint (faster movement)
- [ ] Cat rotates to face movement direction

### Input Edge Cases
- [ ] Switch browser tab away and back - cat stops moving (no stuck keys)
- [ ] Click outside window and back - no stuck keys
- [ ] Hold key and switch tabs - key releases properly

### Paw Interaction
- [ ] **Q** triggers left paw swipe animation
- [ ] **E** triggers right paw swipe animation
- [ ] Swipes knock nearby objects when in range
- [ ] Swipes on couch/post increment scratch progress
- [ ] Interaction prompts appear near objects
- [ ] Can't spam swipes (cooldown works)

### Tasks & Scoring
- [ ] **4 tasks displayed** in task list (top right)
  - "Knock 5 items off the dining table (0/5)"
  - "Knock 10 items total (0/10)"
  - "Scratch the couch to 100% (0/1)"
  - "Scratch the scratching post to 100% (0/1)"
- [ ] Score starts at 0
- [ ] Knocking an item awards +10 points
- [ ] Scratching awards +1 point per swipe
- [ ] Completing scratch zone awards +50 bonus
- [ ] Completing task awards +100 bonus
- [ ] Task progress updates in real-time
- [ ] Completed tasks show as completed

### Scene & Objects
- [ ] **Dining table** has 4 plates, 4 cups, 2 bottles (10 knockables)
- [ ] **Kitchen** has 2 jars on counter (2 knockables)
- [ ] **Coffee table** has 1 plant pot (1 knockable)
- [ ] **Total: 13 knockable objects** can be found
- [ ] **Couch** is scratchable (changes color when scratched)
- [ ] **Scratching post** is scratchable
- [ ] **1 NPC** wanders around the room
- [ ] Poking NPC causes reaction (stumbles back, hand up)

### Debug Mode (F3)
- [ ] F3 toggles debug panel visibility
- [ ] Debug shows FPS counter
- [ ] Debug shows triangle count (~2,500-3,000)
- [ ] Debug shows draw calls (~20-25)
- [ ] Debug shows player position (X, Y, Z)

### Performance
- [ ] Game runs at stable 60+ FPS on desktop Chrome
- [ ] No frame drops during movement
- [ ] No frame drops during paw swipes
- [ ] Physics simulation is smooth

### Visual Quality
- [ ] Toon shading is visible on all objects
- [ ] Shadows are cast by cat, objects, furniture
- [ ] Lighting is warm and consistent
- [ ] No z-fighting or flickering
- [ ] No clipping issues with cat model

## Tech Stack

- Three.js (3D rendering)
- Rapier3D (physics simulation)
- TypeScript
- Vite (build tool)
- Playwright (E2E testing)

## Known Limitations

- No audio yet (AudioSystem exists but no sound files)
- Basic procedural cat model (no external 3D model)
- Single room only


