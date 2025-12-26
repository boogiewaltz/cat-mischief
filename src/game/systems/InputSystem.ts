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
  private keys: Set<string> = new Set();
  private previousKeys: Set<string> = new Set();
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
  }

  private onKeyDown(e: KeyboardEvent): void {
    this.keys.add(e.code);
  }

  private onKeyUp(e: KeyboardEvent): void {
    this.keys.delete(e.code);
  }

  public update(_deltaTime: number): void {
    // Movement
    this.state.forward = this.keys.has('KeyW');
    this.state.backward = this.keys.has('KeyS');
    this.state.left = this.keys.has('KeyA');
    this.state.right = this.keys.has('KeyD');
    this.state.jump = this.keys.has('Space');
    this.state.sprint = this.keys.has('ShiftLeft') || this.keys.has('ShiftRight');

    // Paw actions (detect pressed this frame)
    const leftPawNow = this.keys.has('KeyQ');
    const rightPawNow = this.keys.has('KeyE');

    this.state.leftPawPressed = leftPawNow && !this.previousKeys.has('KeyQ');
    this.state.rightPawPressed = rightPawNow && !this.previousKeys.has('KeyE');

    this.state.leftPaw = leftPawNow;
    this.state.rightPaw = rightPawNow;

    // Store previous state
    this.previousKeys = new Set(this.keys);
  }

  public isKeyPressed(code: string): boolean {
    return this.keys.has(code) && !this.previousKeys.has(code);
  }
}

