# Cat Mischief - Project Structure

```
iamcat/
├── README.md                      # Project overview and setup
├── IMPLEMENTATION_SUMMARY.md      # Complete feature list and status
├── VERIFICATION_REPORT.md         # Plan vs implementation comparison
├── package.json                   # Dependencies and scripts
├── package-lock.json             # Lock file
├── tsconfig.json                 # TypeScript configuration
├── vite.config.ts                # Vite build configuration
├── index.html                    # Main HTML with UI overlay
│
├── src/
│   ├── main.ts                   # Entry point
│   │
│   ├── game/
│   │   ├── Game.ts               # Main game loop and systems coordinator
│   │   ├── World.ts              # Scene management and entity registry
│   │   │
│   │   ├── materials/
│   │   │   └── ToonMaterial.ts   # Custom toon shader implementation
│   │   │
│   │   └── systems/
│   │       ├── InputSystem.ts           # Keyboard input handling
│   │       ├── PlayerSystem.ts          # Cat movement and physics
│   │       ├── CameraSystem.ts          # Third-person camera
│   │       ├── PawInteractionSystem.ts  # Q/E swipe interactions
│   │       ├── PhysicsSystem.ts         # Physics (placeholder)
│   │       ├── TaskSystem.ts            # Task tracking and scoring
│   │       └── AudioSystem.ts           # Audio (placeholder)
│
└── node_modules/                 # Dependencies (not in git)
```

## File Descriptions

### Root Files

- **README.md**: Quick start guide and feature overview
- **IMPLEMENTATION_SUMMARY.md**: Detailed feature list with status
- **VERIFICATION_REPORT.md**: Acceptance criteria verification
- **package.json**: npm dependencies (three.js, typescript, vite, rapier3d)
- **tsconfig.json**: Strict TypeScript configuration
- **vite.config.ts**: Dev server on port 3000
- **index.html**: Main page with UI overlay (score, tasks, prompts, controls)

### Source Files

#### Entry
- **src/main.ts**: Creates and starts the Game instance

#### Core Game
- **src/game/Game.ts**: 
  - Main game loop (requestAnimationFrame)
  - Coordinates all systems
  - Manages renderer and clock
  - Debug mode toggle (F3)

- **src/game/World.ts**:
  - Three.js scene management
  - Entity registry (player, vases, couch, etc.)
  - Scene setup (floor, walls, props)
  - Lighting configuration

#### Materials
- **src/game/materials/ToonMaterial.ts**:
  - Custom MeshToonMaterial wrapper
  - 3-step gradient for cel-shading effect
  - Used by all game objects

#### Systems

- **InputSystem.ts** (90 lines):
  - Keyboard event handling
  - State management for all keys
  - Pressed-this-frame detection for Q/E

- **PlayerSystem.ts** (150 lines):
  - WASD movement with acceleration
  - Jump with coyote time and buffering
  - Sprint (Shift) modifier
  - Gravity and ground detection
  - Boundary constraints

- **CameraSystem.ts** (60 lines):
  - Third-person follow camera
  - Smooth lerp following
  - Look-at target offset
  - Distance clamping

- **PawInteractionSystem.ts** (200 lines):
  - Q/E swipe detection
  - Sweep queries for nearby targets
  - Knockable object physics
  - Scratchable surface tracking
  - Visual feedback on interactions
  - Prompt display system

- **TaskSystem.ts** (130 lines):
  - Task definition and progress tracking
  - Event-based completion detection
  - Score calculation
  - UI updates for tasks and score

- **PhysicsSystem.ts** (15 lines):
  - Placeholder for future physics integration
  - Simple collision handling in other systems

- **AudioSystem.ts** (30 lines):
  - Three.js Audio integration
  - Sound loading and playback (placeholder)

## Architecture

### System Communication

```
Input System → Player System → World
               ↓
Input System → Paw Interaction → World
                                  ↓
                            Task System → UI
```

### Event System
- Custom events for task completion: `task-event`
- Custom events for scoring: `award-points`
- DOM event listeners for keyboard input

### Entity Structure
```typescript
interface Entity {
  mesh: THREE.Object3D;
  position: THREE.Vector3;
  rotation: THREE.Euler;
  velocity?: THREE.Vector3;
  physicsBody?: any;
  type: string;
  data?: any;
}
```

### Entity Types
- `player`: The cat
- `floor`: Ground plane
- `knockable`: Objects that can be knocked off (vases)
- `scratchable`: Objects that can be scratched (couch)
- `pickupable`: Items that can be picked up (future)

## Performance

- **Triangle Budget**: ~2,600 triangles
- **Draw Calls**: 22 per frame
- **Target FPS**: 60
- **Achieved FPS**: 119-120
- **Memory**: Minimal (< 100MB)

## Build Output

```bash
npm run build
# → dist/
#   ├── index.html
#   ├── assets/
#   │   ├── index-[hash].js
#   │   └── index-[hash].css
```

## Dependencies

### Runtime
- `three` ^0.160.0 - 3D rendering
- `@dimforge/rapier3d` ^0.11.2 - Physics (not yet integrated)

### Development
- `typescript` ^5.3.3
- `vite` ^5.0.11
- `@types/three` ^0.160.0

## Code Statistics

- **Total TypeScript files**: 11
- **Total lines of code**: ~1,200 (excluding node_modules)
- **Systems**: 7 modular systems
- **Zero TypeScript errors**: ✅
- **Zero runtime errors**: ✅

## Future Expansion Points

### Easy to Add
- More knockable props (just add to `createTestProps()`)
- More tasks (add to `initializeTasks()`)
- Sound effects (use existing AudioSystem)
- Different colored cats (modify `createPlayer()`)

### Medium Complexity
- More rooms (expand World initialization)
- NPC with patrol AI (new NpcSystem)
- Pickup/carry mechanic (extend PawInteractionSystem)
- Animation state machine (integrate glTF animations)

### Higher Complexity
- Rapier3D physics integration
- Procedural room generation
- Save/load system
- Mobile touch controls
- Multiplayer networking

