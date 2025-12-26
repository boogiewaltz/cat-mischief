import * as THREE from 'three';
import { World } from '../World';
import { InputSystem } from './InputSystem';
import { PhysicsSystem } from './PhysicsSystem';

export class PlayerSystem {
  private world: World;
  private physics: PhysicsSystem;
  private moveSpeed: number = 7.0;
  private sprintMultiplier: number = 1.8;
  private jumpForce: number = 8.0;
  private gravity: number = 20.0;
  private isGrounded: boolean = true;
  private groundRayDistance: number = 0.7;
  private velocity: THREE.Vector3 = new THREE.Vector3();
  private coyoteTime: number = 0.15;
  private coyoteTimer: number = 0;
  private jumpBufferTime: number = 0.1;
  private jumpBufferTimer: number = 0;

  constructor(world: World, physics: PhysicsSystem) {
    this.world = world;
    this.physics = physics;
  }

  public update(deltaTime: number, input: InputSystem): void {
    const player = this.world.getPlayer();
    if (!player) return;

    const rigidBody = player.physicsBody;
    const hasRigidBodyApi =
      rigidBody &&
      typeof rigidBody.linvel === 'function' &&
      typeof rigidBody.setLinvel === 'function' &&
      typeof rigidBody.applyImpulse === 'function';

    // Check if grounded (Rapier if present; otherwise a cheap Y-based check in PhysicsSystem)
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
    
    // W = forward (positive Z - toward where camera looks)
    if (input.state.forward) moveDirection.z += 1;
    // S = backward (negative Z)
    if (input.state.backward) moveDirection.z -= 1;
    // A = left (negative X)
    if (input.state.left) moveDirection.x -= 1;
    // D = right (positive X)
    if (input.state.right) moveDirection.x += 1;

    if (hasRigidBodyApi) {
      // --- Rapier-style movement path (if a rigid body exists) ---
      const currentVel = rigidBody.linvel();

      if (moveDirection.length() > 0) {
        moveDirection.normalize();

        const speed = input.state.sprint ? this.moveSpeed * this.sprintMultiplier : this.moveSpeed;
        const targetVelX = moveDirection.x * speed;
        // Negate Z velocity so movement matches facing direction visually
        const targetVelZ = -moveDirection.z * speed;

        const newVelX = THREE.MathUtils.lerp(currentVel.x, targetVelX, 10 * deltaTime);
        const newVelZ = THREE.MathUtils.lerp(currentVel.z, targetVelZ, 10 * deltaTime);

        rigidBody.setLinvel({ x: newVelX, y: currentVel.y, z: newVelZ }, true);

        // Rotate to face movement direction
        // In Three.js: +X = right, -X = left, +Z = forward (towards camera), -Z = back (away from camera)
        // Cat default faces +X (right), so we calculate rotation from movement direction
        const targetAngle = Math.atan2(moveDirection.z, moveDirection.x);
        
        // Normalize current rotation to [-π, π] range before calculating difference
        let currentAngle = player.rotation.y;
        while (currentAngle > Math.PI) currentAngle -= Math.PI * 2;
        while (currentAngle < -Math.PI) currentAngle += Math.PI * 2;
        
        let angleDiff = targetAngle - currentAngle;
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

        const newAngle = currentAngle + angleDiff * Math.min(1, 20 * deltaTime);
        
        // Set rotation directly on player (not via rigidbody to avoid sync conflicts)
        player.rotation.y = newAngle;
        player.mesh.rotation.y = newAngle;
      } else {
        const newVelX = THREE.MathUtils.lerp(currentVel.x, 0, 8 * deltaTime);
        const newVelZ = THREE.MathUtils.lerp(currentVel.z, 0, 8 * deltaTime);
        rigidBody.setLinvel({ x: newVelX, y: currentVel.y, z: newVelZ }, true);
      }

      if (this.jumpBufferTimer > 0 && this.coyoteTimer > 0) {
        rigidBody.applyImpulse({ x: 0, y: this.jumpForce, z: 0 }, true);
        this.coyoteTimer = 0;
        this.jumpBufferTimer = 0;
        this.isGrounded = false;
      }

      // DO NOT call syncRigidBodyFromEntity for dynamic bodies
      // The physics system will sync the entity FROM the rigid body instead
      return;
    }

    // --- Fallback kinematic movement path (no rigid body) ---
    if (moveDirection.length() > 0) {
      moveDirection.normalize();

      const speed = input.state.sprint ? this.moveSpeed * this.sprintMultiplier : this.moveSpeed;

      this.velocity.x = THREE.MathUtils.lerp(this.velocity.x, moveDirection.x * speed, 10 * deltaTime);
      // Negate Z velocity so movement matches facing direction visually
      this.velocity.z = THREE.MathUtils.lerp(this.velocity.z, -moveDirection.z * speed, 10 * deltaTime);

      const targetAngle = Math.atan2(moveDirection.z, moveDirection.x);
      let angleDiff = targetAngle - player.rotation.y;
      while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
      while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

      player.rotation.y += angleDiff * Math.min(1, 20 * deltaTime);
    } else {
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

    // Gravity
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
    // Rapier raycast down from player position
    const position = player.position;
    const rayResult = this.physics.raycast(
      { x: position.x, y: position.y, z: position.z },
      { x: 0, y: -1, z: 0 },
      this.groundRayDistance
    );
    this.isGrounded = rayResult !== null;
  }

  public isPlayerGrounded(): boolean {
    return this.isGrounded;
  }
}
