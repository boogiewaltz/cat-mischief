import * as THREE from 'three';
import { World } from './World';
import { InputSystem } from './systems/InputSystem';
import { PlayerSystem } from './systems/PlayerSystem';
import { CameraSystem } from './systems/CameraSystem';
import { PhysicsSystem } from './systems/PhysicsSystem';
import { PawInteractionSystem } from './systems/PawInteractionSystem';
import { TaskSystem } from './systems/TaskSystem';
import { AudioSystem } from './systems/AudioSystem';
import { AnimationSystem } from './systems/AnimationSystem';
import { NpcSystem } from './systems/NpcSystem';

export class Game {
  private renderer: THREE.WebGLRenderer;
  private world: World;
  private systems: {
    input: InputSystem;
    player: PlayerSystem;
    npc: NpcSystem;
    camera: CameraSystem;
    physics: PhysicsSystem;
    pawInteraction: PawInteractionSystem;
    task: TaskSystem;
    audio: AudioSystem;
    animation: AnimationSystem;
  };
  private clock: THREE.Clock;
  private isRunning: boolean = false;
  private debugMode: boolean = false;

  constructor() {
    // Initialize renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;
    
    const container = document.getElementById('app');
    if (container) {
      container.appendChild(this.renderer.domElement);
    }

    // Initialize world
    this.world = new World();

    // Initialize systems
    this.systems = {
      input: new InputSystem(),
      physics: new PhysicsSystem(),
      player: new PlayerSystem(this.world, new PhysicsSystem()), // Temporary placeholder
      npc: new NpcSystem(this.world),
      camera: new CameraSystem(this.world),
      animation: new AnimationSystem(),
      pawInteraction: new PawInteractionSystem(this.world),
      task: new TaskSystem(this.world),
      audio: new AudioSystem()
    };
    
    // Replace player system with correct physics instance after initialization
    this.systems.player = new PlayerSystem(this.world, this.systems.physics);
    this.systems.pawInteraction.setPhysics(this.systems.physics);

    this.clock = new THREE.Clock();

    // Setup event listeners
    this.setupEventListeners();
    
    // Setup debug toggle
    this.setupDebugToggle();
  }

  private setupEventListeners(): void {
    window.addEventListener('resize', () => this.onWindowResize());
  }

  private setupDebugToggle(): void {
    window.addEventListener('keydown', (e) => {
      if (e.key === 'F3') {
        e.preventDefault();
        this.debugMode = !this.debugMode;
        const debugPanel = document.getElementById('debug-panel');
        if (debugPanel) {
          debugPanel.classList.toggle('visible', this.debugMode);
        }
      }
    });
  }

  private onWindowResize(): void {
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    this.renderer.setSize(width, height);
    this.world.camera.aspect = width / height;
    this.world.camera.updateProjectionMatrix();
  }

  public start(): void {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.world.initialize(this.systems.physics);
    this.animate();
  }

  private animate = (): void => {
    if (!this.isRunning) return;

    requestAnimationFrame(this.animate);

    const deltaTime = Math.min(this.clock.getDelta(), 0.1); // Cap at 100ms

    // Update systems in order
    this.systems.input.update(deltaTime);
    this.systems.player.update(deltaTime, this.systems.input);
    this.systems.npc.update(deltaTime);
    this.systems.physics.update(deltaTime);
    
    // Sync dynamic entities from physics
    this.syncDynamicEntities();
    
    this.systems.animation.update(deltaTime);
    this.systems.pawInteraction.update(deltaTime, this.systems.input, this.systems.animation);
    this.systems.task.update(deltaTime);
    this.systems.camera.update(deltaTime);
    this.systems.audio.update(deltaTime);

    // Update debug info
    if (this.debugMode) {
      this.updateDebugInfo(deltaTime);
    }

    // Render
    this.renderer.render(this.world.scene, this.world.camera);
  };

  private updateDebugInfo(deltaTime: number): void {
    const debugInfo = document.getElementById('debug-info');
    if (!debugInfo) return;

    const fps = Math.round(1 / deltaTime);
    const player = this.world.getPlayer();
    
    let info = `FPS: ${fps}\n`;
    info += `Renderer: ${this.renderer.info.render.triangles} tris, ${this.renderer.info.render.calls} calls\n`;
    
    if (player) {
      const pos = player.position;
      info += `Player: (${pos.x.toFixed(2)}, ${pos.y.toFixed(2)}, ${pos.z.toFixed(2)})\n`;
    }
    
    debugInfo.textContent = info;
  }

  private syncDynamicEntities(): void {
    // Sync all dynamic entities from their rigidbodies
    for (const [, entity] of this.world.getAllEntities()) {
      if (entity.type === 'knockable' && entity.physicsBody) {
        this.systems.physics.syncEntityToRigidBody(entity, entity.physicsBody);
      }
    }
  }

  public stop(): void {
    this.isRunning = false;
  }
}

