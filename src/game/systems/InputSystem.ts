export interface InputState {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
  jump: boolean;
  sprint: boolean;
  leftPaw: boolean;
  rightPaw: boolean;
  leftPawPressed: boolean;
  rightPawPressed: boolean;
}

export class InputSystem {
  // Track both:
  // - `keys`: letter meaning ("w", "q", etc.) so controls work across keyboard layouts
  // - `codes`: physical keys ("Space", "ShiftLeft") for non-letter reliability
  private keys: Set<string> = new Set();
  private previousKeys: Set<string> = new Set();
  private codes: Set<string> = new Set();
  private previousCodes: Set<string> = new Set();

  // Some environments/tools generate very fast tap events (keydown+keyup between frames),
  // which can be missed by polling-based input. This adds a short "tap hold" buffer so
  // single taps are still observed in `update()`.
  private tapHoldSeconds: number = 0.12;
  private tapTimers: Map<string, number> = new Map();
  public state: InputState = {
    forward: false,
    backward: false,
    left: false,
    right: false,
    jump: false,
    sprint: false,
    leftPaw: false,
    rightPaw: false,
    leftPawPressed: false,
    rightPawPressed: false
  };

  constructor() {
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    window.addEventListener('keydown', (e) => this.onKeyDown(e));
    window.addEventListener('keyup', (e) => this.onKeyUp(e));
    
    // Clear input state on blur/visibility change to prevent stuck keys
    window.addEventListener('blur', () => this.clearAllKeys());
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.clearAllKeys();
      }
    });
  }

  private clearAllKeys(): void {
    this.keys.clear();
    this.previousKeys.clear();
    this.codes.clear();
    this.previousCodes.clear();
    this.tapTimers.clear();
    
    // Reset all input state
    this.state.forward = false;
    this.state.backward = false;
    this.state.left = false;
    this.state.right = false;
    this.state.jump = false;
    this.state.sprint = false;
    this.state.leftPaw = false;
    this.state.rightPaw = false;
    this.state.leftPawPressed = false;
    this.state.rightPawPressed = false;
  }

  private onKeyDown(e: KeyboardEvent): void {
    this.codes.add(e.code);
    if (e.key) {
      const k = e.key.toLowerCase();
      this.keys.add(k);

      // Buffer common gameplay keys so quick taps aren't lost
      if (
        k === 'w' || k === 'a' || k === 's' || k === 'd' ||
        k === 'arrowup' || k === 'arrowleft' || k === 'arrowdown' || k === 'arrowright' ||
        k === 'q' || k === 'e'
      ) {
        this.tapTimers.set(k, this.tapHoldSeconds);
      }
    }
  }

  private onKeyUp(e: KeyboardEvent): void {
    this.codes.delete(e.code);
    if (e.key) this.keys.delete(e.key.toLowerCase());
  }

  public update(_deltaTime: number): void {
    // Decay tap buffers
    for (const [k, t] of this.tapTimers) {
      const next = t - _deltaTime;
      if (next <= 0) this.tapTimers.delete(k);
      else this.tapTimers.set(k, next);
    }

    // Movement
    // Letter-based movement (layout-safe) + arrow key fallback
    this.state.forward = this.keys.has('w') || this.keys.has('arrowup') || (this.tapTimers.get('w') ?? 0) > 0 || (this.tapTimers.get('arrowup') ?? 0) > 0;
    this.state.backward = this.keys.has('s') || this.keys.has('arrowdown') || (this.tapTimers.get('s') ?? 0) > 0 || (this.tapTimers.get('arrowdown') ?? 0) > 0;
    this.state.left = this.keys.has('a') || this.keys.has('arrowleft') || (this.tapTimers.get('a') ?? 0) > 0 || (this.tapTimers.get('arrowleft') ?? 0) > 0;
    this.state.right = this.keys.has('d') || this.keys.has('arrowright') || (this.tapTimers.get('d') ?? 0) > 0 || (this.tapTimers.get('arrowright') ?? 0) > 0;

    // Jump / sprint (non-letter keys, use physical codes)
    this.state.jump = this.codes.has('Space');
    this.state.sprint = this.codes.has('ShiftLeft') || this.codes.has('ShiftRight') || this.keys.has('shift');

    // Paw actions (detect pressed this frame)
    const leftPawNow = this.keys.has('q') || (this.tapTimers.get('q') ?? 0) > 0;
    const rightPawNow = this.keys.has('e') || (this.tapTimers.get('e') ?? 0) > 0;

    this.state.leftPawPressed = leftPawNow && !this.previousKeys.has('q');
    this.state.rightPawPressed = rightPawNow && !this.previousKeys.has('e');

    this.state.leftPaw = leftPawNow;
    this.state.rightPaw = rightPawNow;

    // Store previous state
    this.previousKeys = new Set(this.keys);
    this.previousCodes = new Set(this.codes);
  }

  public isKeyPressed(code: string): boolean {
    // Back-compat: `code` is a physical code (e.g. "KeyQ", "Space").
    // Prefer `codes` for correctness.
    return this.codes.has(code) && !this.previousCodes.has(code);
  }
}

