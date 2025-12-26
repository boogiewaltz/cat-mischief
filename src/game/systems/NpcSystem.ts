import * as THREE from 'three';
import { World, Entity } from '../World';

interface NpcRig {
  torso: THREE.Mesh;
  head: THREE.Mesh;
  leftArm: THREE.Mesh;
  rightArm: THREE.Mesh;
  leftHand: THREE.Mesh;
  rightHand: THREE.Mesh;
  leftLegUpper: THREE.Mesh;
  rightLegUpper: THREE.Mesh;
  leftLegLower: THREE.Mesh;
  rightLegLower: THREE.Mesh;
  leftFoot: THREE.Mesh;
  rightFoot: THREE.Mesh;
}

export class NpcSystem {
  private world: World;
  private walkSpeed: number = 1.2;
  private turnSpeed: number = 3.0;
  private wanderRadius: number = 5.0;
  private wanderInterval: number = 3.0; // seconds between new wander targets
  private bounds = {
    minX: -6.5,
    maxX: 6.5,
    minZ: -6.5,
    maxZ: 6.5
  };

  constructor(world: World) {
    this.world = world;
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    // Listen for poke events
    window.addEventListener('npc-event', ((e: CustomEvent) => {
      this.handleNpcEvent(e.detail.type, e.detail.id);
    }) as EventListener);
  }

  private handleNpcEvent(eventType: string, npcId: string): void {
    const npc = this.world.getEntity(npcId);
    if (!npc || npc.type !== 'npc_humanoid') return;

    if (eventType === 'poked') {
      this.handlePoked(npc);
    }
  }

  private handlePoked(npc: Entity): void {
    if (!npc.data) return;

    // Set reaction cooldown
    npc.data.reactionCooldown = 1.5;

    // Stagger backwards
    const backward = new THREE.Vector3(0, 0, 1); // Local backward
    backward.applyEuler(npc.rotation);
    backward.multiplyScalar(0.8);
    
    npc.position.add(backward);

    // Clamp to bounds
    npc.position.x = THREE.MathUtils.clamp(npc.position.x, this.bounds.minX, this.bounds.maxX);
    npc.position.z = THREE.MathUtils.clamp(npc.position.z, this.bounds.minZ, this.bounds.maxZ);

    // Turn to face player
    const player = this.world.getPlayer();
    if (player) {
      const direction = new THREE.Vector3()
        .subVectors(player.position, npc.position);
      direction.y = 0;
      direction.normalize();
      
      const targetAngle = Math.atan2(direction.x, direction.z);
      npc.rotation.y = targetAngle;
    }

    // Play reaction animation (hand up gesture)
    if (npc.data.rig) {
      const rig: NpcRig = npc.data.rig;
      // Brief hand-up animation
      const originalLeftArmRotation = rig.leftArm.rotation.clone();
      rig.leftArm.rotation.z = Math.PI / 3;
      rig.leftHand.position.y = 0.0;
      
      setTimeout(() => {
        rig.leftArm.rotation.copy(originalLeftArmRotation);
        rig.leftHand.position.y = -0.22;
      }, 500);
    }
  }

  public update(deltaTime: number): void {
    const entities = this.world.getAllEntities();
    
    for (const [_id, entity] of entities) {
      if (entity.type !== 'npc_humanoid') continue;
      
      this.updateNpc(entity, deltaTime);
    }
  }

  private updateNpc(npc: Entity, deltaTime: number): void {
    if (!npc.data) return;

    // Update reaction cooldown
    if (npc.data.reactionCooldown > 0) {
      npc.data.reactionCooldown -= deltaTime;
      // During cooldown, stand still
      npc.data.moveSpeed = 0;
      this.animateIdle(npc, deltaTime);
      return;
    }

    // Update wander timer
    npc.data.wanderTimer -= deltaTime;
    
    // Pick new wander target when timer expires or no target
    if (npc.data.wanderTimer <= 0 || !npc.data.wanderTarget) {
      this.pickNewWanderTarget(npc);
      npc.data.wanderTimer = this.wanderInterval + Math.random() * 2.0;
    }

    // Move toward wander target
    if (npc.data.wanderTarget) {
      this.moveTowardsTarget(npc, npc.data.wanderTarget, deltaTime);
    }

    // Animate based on movement
    if (npc.data.moveSpeed > 0.1) {
      this.animateWalk(npc, deltaTime);
    } else {
      this.animateIdle(npc, deltaTime);
    }
  }

  private pickNewWanderTarget(npc: Entity): void {
    if (!npc.data) return;

    // Pick random point within bounds
    const targetX = THREE.MathUtils.lerp(this.bounds.minX, this.bounds.maxX, Math.random());
    const targetZ = THREE.MathUtils.lerp(this.bounds.minZ, this.bounds.maxZ, Math.random());
    
    npc.data.wanderTarget = new THREE.Vector3(targetX, npc.position.y, targetZ);
  }

  private moveTowardsTarget(npc: Entity, target: THREE.Vector3, deltaTime: number): void {
    if (!npc.data) return;

    const direction = new THREE.Vector3().subVectors(target, npc.position);
    const distance = direction.length();
    
    // If close enough, stop
    if (distance < 0.5) {
      npc.data.moveSpeed = THREE.MathUtils.lerp(npc.data.moveSpeed, 0, 5 * deltaTime);
      return;
    }

    direction.y = 0;
    direction.normalize();

    // Smoothly accelerate
    npc.data.moveSpeed = THREE.MathUtils.lerp(npc.data.moveSpeed, this.walkSpeed, 3 * deltaTime);

    // Move
    const movement = direction.clone().multiplyScalar(npc.data.moveSpeed * deltaTime);
    npc.position.add(movement);

    // Clamp to bounds with margin
    npc.position.x = THREE.MathUtils.clamp(npc.position.x, this.bounds.minX, this.bounds.maxX);
    npc.position.z = THREE.MathUtils.clamp(npc.position.z, this.bounds.minZ, this.bounds.maxZ);

    // Rotate to face movement direction
    const targetAngle = Math.atan2(direction.x, direction.z);
    const currentAngle = npc.rotation.y;
    const angleDiff = targetAngle - currentAngle;
    
    // Normalize angle difference to [-PI, PI]
    let normalizedDiff = ((angleDiff + Math.PI) % (Math.PI * 2)) - Math.PI;
    if (normalizedDiff < -Math.PI) normalizedDiff += Math.PI * 2;
    
    npc.rotation.y += normalizedDiff * this.turnSpeed * deltaTime;
  }

  private animateWalk(npc: Entity, deltaTime: number): void {
    if (!npc.data || !npc.data.rig) return;

    const rig: NpcRig = npc.data.rig;
    
    // Update gait phase
    npc.data.gaitPhase += deltaTime * 6.0; // Walk cycle frequency
    const phase = npc.data.gaitPhase;

    // Leg swing (alternating)
    const legSwingAmount = 0.3;
    rig.leftLegUpper.rotation.x = Math.sin(phase) * legSwingAmount;
    rig.rightLegUpper.rotation.x = Math.sin(phase + Math.PI) * legSwingAmount;
    
    rig.leftLegLower.rotation.x = Math.max(0, Math.sin(phase) * 0.4);
    rig.rightLegLower.rotation.x = Math.max(0, Math.sin(phase + Math.PI) * 0.4);
    
    // Foot rotation
    rig.leftFoot.rotation.x = Math.sin(phase) * 0.2;
    rig.rightFoot.rotation.x = Math.sin(phase + Math.PI) * 0.2;

    // Arm swing (opposite to legs)
    const armSwingAmount = 0.25;
    rig.leftArm.rotation.x = Math.sin(phase + Math.PI) * armSwingAmount;
    rig.rightArm.rotation.x = Math.sin(phase) * armSwingAmount;

    // Torso bob (subtle up/down + slight side tilt)
    rig.torso.position.y = Math.abs(Math.sin(phase * 2)) * 0.02;
    rig.torso.rotation.z = Math.sin(phase) * 0.05;

    // Head bob (subtle, counter to torso)
    rig.head.position.y = 0.5 + Math.abs(Math.sin(phase * 2)) * 0.015;
    rig.head.rotation.z = -Math.sin(phase) * 0.03;
  }

  private animateIdle(npc: Entity, deltaTime: number): void {
    if (!npc.data || !npc.data.rig) return;

    const rig: NpcRig = npc.data.rig;
    
    // Subtle breathing
    npc.data.gaitPhase += deltaTime * 2.0; // Slower than walk
    const phase = npc.data.gaitPhase;

    // Reset legs to neutral with slight lerp
    rig.leftLegUpper.rotation.x = THREE.MathUtils.lerp(rig.leftLegUpper.rotation.x, 0, 5 * deltaTime);
    rig.rightLegUpper.rotation.x = THREE.MathUtils.lerp(rig.rightLegUpper.rotation.x, 0, 5 * deltaTime);
    rig.leftLegLower.rotation.x = THREE.MathUtils.lerp(rig.leftLegLower.rotation.x, 0, 5 * deltaTime);
    rig.rightLegLower.rotation.x = THREE.MathUtils.lerp(rig.rightLegLower.rotation.x, 0, 5 * deltaTime);
    rig.leftFoot.rotation.x = THREE.MathUtils.lerp(rig.leftFoot.rotation.x, 0, 5 * deltaTime);
    rig.rightFoot.rotation.x = THREE.MathUtils.lerp(rig.rightFoot.rotation.x, 0, 5 * deltaTime);

    // Reset arms
    rig.leftArm.rotation.x = THREE.MathUtils.lerp(rig.leftArm.rotation.x, 0, 5 * deltaTime);
    rig.rightArm.rotation.x = THREE.MathUtils.lerp(rig.rightArm.rotation.x, 0, 5 * deltaTime);

    // Breathing motion
    rig.torso.position.y = Math.sin(phase) * 0.008;
    rig.torso.rotation.z = THREE.MathUtils.lerp(rig.torso.rotation.z, 0, 8 * deltaTime);

    // Head micro-motions
    rig.head.position.y = 0.5 + Math.sin(phase) * 0.005;
    rig.head.rotation.z = THREE.MathUtils.lerp(rig.head.rotation.z, Math.sin(phase * 0.5) * 0.02, 3 * deltaTime);
    
    // Occasional weight shift
    rig.head.rotation.y = Math.sin(phase * 0.3) * 0.08;
  }
}

