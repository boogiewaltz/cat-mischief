import * as THREE from 'three';
import { World } from '../World';
import { InputSystem } from './InputSystem';

export class PlayerSystem {
  private world: World;
  private moveSpeed: number = 5.0;
  private sprintMultiplier: number = 1.8;
  private jumpForce: number = 8.0;
  private gravity: number = 20.0;
  private isGrounded: boolean = true;
  private groundRayDistance: number = 0.6;
  private velocity: THREE.Vector3 = new THREE.Vector3();
  private coyoteTime: number = 0.15;
  private coyoteTimer: number = 0;
  private jumpBufferTime: number = 0.1;
  private jumpBufferTimer: number = 0;

  constructor(world: World) {
    this.world = world;
  }

  public update(deltaTime: number, input: InputSystem): void {
    const player = this.world.getPlayer();
    if (!player) return;

    // Check if grounded
    this.checkGrounded(player);

    // Handle coyote time
    if (this.isGrounded) {
      this.coyoteTimer = this.coyoteTime;
    } else {
      this.coyoteTimer -= deltaTime;
    }

    // Handle jump buffering
    if (input.state.jump) {
      this.jumpBufferTimer = this.jumpBufferTime;
    } else {
      this.jumpBufferTimer -= deltaTime;
    }

    // Movement (fixed directions)
    const moveDirection = new THREE.Vector3();
    
    // W = forward (negative Z in Three.js)
    if (input.state.forward) moveDirection.z -= 1;
    // S = backward (positive Z)
    if (input.state.backward) moveDirection.z += 1;
    // A = left (negative X)
    if (input.state.left) moveDirection.x -= 1;
    // D = right (positive X)
    if (input.state.right) moveDirection.x += 1;

    if (moveDirection.length() > 0) {
      moveDirection.normalize();
      
      // Apply sprint
      const speed = input.state.sprint ? this.moveSpeed * this.sprintMultiplier : this.moveSpeed;
      
      // Smooth acceleration
      this.velocity.x = THREE.MathUtils.lerp(this.velocity.x, moveDirection.x * speed, 10 * deltaTime);
      this.velocity.z = THREE.MathUtils.lerp(this.velocity.z, moveDirection.z * speed, 10 * deltaTime);

      // Rotate player to face movement direction
      // The cat model is built facing the +X axis (head is at x=0.35)
      // W = -Z, S = +Z, A = -X, D = +X. atan2(-z, x) maps these to the correct rotation
      const targetAngle = Math.atan2(-moveDirection.z, moveDirection.x);
      const currentAngle = player.rotation.y;
      player.rotation.y = THREE.MathUtils.lerp(currentAngle, targetAngle, 15 * deltaTime);
    } else {
      // Deceleration
      this.velocity.x = THREE.MathUtils.lerp(this.velocity.x, 0, 8 * deltaTime);
      this.velocity.z = THREE.MathUtils.lerp(this.velocity.z, 0, 8 * deltaTime);
    }

    // Jump with coyote time and buffering
    if (this.jumpBufferTimer > 0 && this.coyoteTimer > 0) {
      this.velocity.y = this.jumpForce;
      this.coyoteTimer = 0;
      this.jumpBufferTimer = 0;
      this.isGrounded = false;
    }

    // Apply gravity
    if (!this.isGrounded) {
      this.velocity.y -= this.gravity * deltaTime;
    } else if (this.velocity.y < 0) {
      this.velocity.y = 0;
    }

    // Apply velocity
    player.position.x += this.velocity.x * deltaTime;
    player.position.y += this.velocity.y * deltaTime;
    player.position.z += this.velocity.z * deltaTime;

    // Ground collision
    if (player.position.y < 0.5) {
      player.position.y = 0.5;
      this.velocity.y = 0;
      this.isGrounded = true;
    }

    // Basic boundary constraints
    player.position.x = THREE.MathUtils.clamp(player.position.x, -7, 7);
    player.position.z = THREE.MathUtils.clamp(player.position.z, -7, 7);
  }

  private checkGrounded(player: any): void {
    // Simple ground check - raycast down
    const raycaster = new THREE.Raycaster(
      player.position,
      new THREE.Vector3(0, -1, 0),
      0,
      this.groundRayDistance
    );

    const scene = this.world.scene;
    const intersects = raycaster.intersectObjects(scene.children, true);

    // Filter out player itself
    const validIntersects = intersects.filter(intersect => {
      let obj: THREE.Object3D | null = intersect.object;
      while (obj) {
        if (obj === player.mesh) return false;
        obj = obj.parent;
      }
      return true;
    });

    this.isGrounded = validIntersects.length > 0 && this.velocity.y <= 0;
  }

  public getVelocity(): THREE.Vector3 {
    return this.velocity.clone();
  }

  public isPlayerGrounded(): boolean {
    return this.isGrounded;
  }
}

