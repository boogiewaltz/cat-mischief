import * as THREE from 'three';
import { World, Entity } from '../World';
import { getRandom } from '../utils/rng';

interface NpcRig {
  spine: THREE.Group;
  headPivot: THREE.Group;
  leftShoulder: THREE.Group;
  rightShoulder: THREE.Group;
  leftElbow: THREE.Group;
  rightElbow: THREE.Group;
  leftHip: THREE.Group;
  rightHip: THREE.Group;
  leftKnee: THREE.Group;
  rightKnee: THREE.Group;
  leftAnkle: THREE.Group;
  rightAnkle: THREE.Group;
}

export class NpcSystem {
  private world: World;
  private walkSpeed: number = 1.2;
  private turnSpeed: number = 3.0;
  private wanderRadius: number = 5.0;
  private wanderInterval: number = 3.0;
  private personalSpaceRadius: number = 1.8;
  private avoidSpeed: number = 1.5;
  private recoverDelay: number = 2.0;
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

    npc.data.reactionCooldown = 1.5;
    npc.data.aiState = 'Poked';

    // Stagger backwards
    const backward = new THREE.Vector3(0, 0, 1);
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

    // Hand raise animation (brief gesture)
    if (npc.data.rig) {
      const rig: NpcRig = npc.data.rig;
      rig.leftShoulder.rotation.x = -Math.PI / 3;
      
      setTimeout(() => {
        if (npc.data && npc.data.rig) {
          const r: NpcRig = npc.data.rig;
          r.leftShoulder.rotation.x = 0;
        }
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
    if (!npc.data || !npc.data.rig) return;

    const player = this.world.getPlayer();
    if (!player) return;

    // Cat-NPC separation
    this.applyCatNpcSeparation(npc, player);

    // Update reaction cooldown
    if (npc.data.reactionCooldown > 0) {
      npc.data.reactionCooldown -= deltaTime;
      npc.data.moveSpeed = 0;
      this.animateIdle(npc, deltaTime);
      if (npc.data.reactionCooldown <= 0) {
        npc.data.aiState = 'Wander';
      }
      return;
    }

    // Distance to player
    const distToPlayer = new THREE.Vector2(
      player.position.x - npc.position.x,
      player.position.z - npc.position.z
    ).length();

    // FSM state transitions
    if (npc.data.aiState === 'Wander') {
      if (distToPlayer < this.personalSpaceRadius) {
        npc.data.aiState = 'AvoidCat';
        npc.data.avoidTimer = 0;
      }
    } else if (npc.data.aiState === 'AvoidCat') {
      if (distToPlayer >= this.personalSpaceRadius + 0.5) {
        npc.data.aiState = 'Recover';
        npc.data.avoidTimer = 0;
      }
    } else if (npc.data.aiState === 'Recover') {
      npc.data.avoidTimer += deltaTime;
      if (npc.data.avoidTimer >= this.recoverDelay) {
        npc.data.aiState = 'Wander';
      }
    }

    // Execute state behavior
    if (npc.data.aiState === 'Wander') {
      this.updateWander(npc, deltaTime);
    } else if (npc.data.aiState === 'AvoidCat') {
      this.updateAvoid(npc, player, deltaTime);
    } else if (npc.data.aiState === 'Recover') {
      npc.data.moveSpeed = THREE.MathUtils.lerp(npc.data.moveSpeed, 0, 5 * deltaTime);
      this.animateIdle(npc, deltaTime);
    }

    // Look at cat when close
    if (distToPlayer < this.personalSpaceRadius * 1.5) {
      this.lookAtCat(npc, player, deltaTime);
    }
  }

  private applyCatNpcSeparation(npc: Entity, player: Entity): void {
    const direction = new THREE.Vector3().subVectors(npc.position, player.position);
    direction.y = 0;
    const dist = direction.length();

    const minSeparation = 0.6;
    if (dist < minSeparation && dist > 0.001) {
      direction.normalize();
      const pushAmount = (minSeparation - dist) * 0.5;
      npc.position.add(direction.clone().multiplyScalar(pushAmount));

      // Clamp to bounds
      npc.position.x = THREE.MathUtils.clamp(npc.position.x, this.bounds.minX, this.bounds.maxX);
      npc.position.z = THREE.MathUtils.clamp(npc.position.z, this.bounds.minZ, this.bounds.maxZ);
    }
  }

  private updateWander(npc: Entity, deltaTime: number): void {
    if (!npc.data) return;

    npc.data.wanderTimer -= deltaTime;
    
    if (npc.data.wanderTimer <= 0 || !npc.data.wanderTarget) {
      this.pickNewWanderTarget(npc);
      npc.data.wanderTimer = this.wanderInterval + getRandom() * 2.0;
    }

    if (npc.data.wanderTarget) {
      this.moveTowardsTarget(npc, npc.data.wanderTarget, deltaTime, this.walkSpeed);
    }

    if (npc.data.moveSpeed > 0.1) {
      this.animateWalk(npc, deltaTime);
    } else {
      this.animateIdle(npc, deltaTime);
    }
  }

  private updateAvoid(npc: Entity, player: Entity, deltaTime: number): void {
    if (!npc.data) return;

    const avoidDirection = new THREE.Vector3().subVectors(npc.position, player.position);
    avoidDirection.y = 0;
    avoidDirection.normalize();

    const avoidTarget = npc.position.clone().add(avoidDirection.multiplyScalar(2.0));
    this.moveTowardsTarget(npc, avoidTarget, deltaTime, this.avoidSpeed);

    // Turn to keep cat in view
    const directionToCat = new THREE.Vector3().subVectors(player.position, npc.position);
    directionToCat.y = 0;
    directionToCat.normalize();
    const targetAngle = Math.atan2(directionToCat.x, directionToCat.z);
    
    const currentAngle = npc.rotation.y;
    let angleDiff = targetAngle - currentAngle;
    angleDiff = ((angleDiff + Math.PI) % (Math.PI * 2)) - Math.PI;
    
    npc.rotation.y += angleDiff * this.turnSpeed * deltaTime;

    this.animateWalk(npc, deltaTime);
  }

  private lookAtCat(npc: Entity, player: Entity, deltaTime: number): void {
    if (!npc.data || !npc.data.rig) return;

    const rig: NpcRig = npc.data.rig;
    const directionToCat = new THREE.Vector3().subVectors(player.position, npc.position);
    
    // Local space direction
    const localDir = directionToCat.clone();
    localDir.applyEuler(new THREE.Euler(0, -npc.rotation.y, 0));
    
    const targetYaw = Math.atan2(localDir.x, localDir.z);
    const targetPitch = Math.atan2(localDir.y, Math.sqrt(localDir.x * localDir.x + localDir.z * localDir.z));
    
    // Clamp and smooth head rotation
    const clampedYaw = THREE.MathUtils.clamp(targetYaw, -Math.PI / 4, Math.PI / 4);
    const clampedPitch = THREE.MathUtils.clamp(targetPitch, -Math.PI / 8, Math.PI / 8);
    
    rig.headPivot.rotation.y = THREE.MathUtils.lerp(rig.headPivot.rotation.y, clampedYaw, 3 * deltaTime);
    rig.headPivot.rotation.x = THREE.MathUtils.lerp(rig.headPivot.rotation.x, clampedPitch, 3 * deltaTime);
  }

  private pickNewWanderTarget(npc: Entity): void {
    if (!npc.data) return;

    // Wander locally around current position (feels more believable than fully random tele-walks)
    const angle = getRandom() * Math.PI * 2;
    const radius = getRandom() * this.wanderRadius;

    const targetX = npc.position.x + Math.cos(angle) * radius;
    const targetZ = npc.position.z + Math.sin(angle) * radius;

    npc.data.wanderTarget = new THREE.Vector3(
      THREE.MathUtils.clamp(targetX, this.bounds.minX, this.bounds.maxX),
      npc.position.y,
      THREE.MathUtils.clamp(targetZ, this.bounds.minZ, this.bounds.maxZ)
    );
  }

  private moveTowardsTarget(npc: Entity, target: THREE.Vector3, deltaTime: number, speed: number): void {
    if (!npc.data) return;

    const direction = new THREE.Vector3().subVectors(target, npc.position);
    const distance = direction.length();
    
    if (distance < 0.5) {
      npc.data.moveSpeed = THREE.MathUtils.lerp(npc.data.moveSpeed, 0, 5 * deltaTime);
      return;
    }

    direction.y = 0;
    direction.normalize();

    npc.data.moveSpeed = THREE.MathUtils.lerp(npc.data.moveSpeed, speed, 3 * deltaTime);

    const movement = direction.clone().multiplyScalar(npc.data.moveSpeed * deltaTime);
    npc.position.add(movement);

    npc.position.x = THREE.MathUtils.clamp(npc.position.x, this.bounds.minX, this.bounds.maxX);
    npc.position.z = THREE.MathUtils.clamp(npc.position.z, this.bounds.minZ, this.bounds.maxZ);

    // Smooth rotation
    const targetAngle = Math.atan2(direction.x, direction.z);
    const currentAngle = npc.rotation.y;
    let angleDiff = targetAngle - currentAngle;
    angleDiff = ((angleDiff + Math.PI) % (Math.PI * 2)) - Math.PI;
    
    npc.rotation.y += angleDiff * this.turnSpeed * deltaTime;
  }

  private animateWalk(npc: Entity, deltaTime: number): void {
    if (!npc.data || !npc.data.rig) return;

    const rig: NpcRig = npc.data.rig;
    
    npc.data.gaitPhase += deltaTime * 6.0;
    const phase = npc.data.gaitPhase;

    // Spine bob
    const bobAmount = 0.02;
    rig.spine.position.y = Math.abs(Math.sin(phase * 2)) * bobAmount;
    rig.spine.rotation.z = Math.sin(phase) * 0.03;

    // LEFT LEG
    const leftLegPhase = phase;
    const leftHipSwing = Math.sin(leftLegPhase) * 0.5;
    rig.leftHip.rotation.x = leftHipSwing;
    
    const leftKneeBend = Math.max(0, Math.sin(leftLegPhase) * 0.6);
    rig.leftKnee.rotation.x = leftKneeBend;
    
    const leftAnkleComp = Math.sin(leftLegPhase) * 0.15;
    rig.leftAnkle.rotation.x = leftAnkleComp;

    // RIGHT LEG (opposite phase)
    const rightLegPhase = phase + Math.PI;
    const rightHipSwing = Math.sin(rightLegPhase) * 0.5;
    rig.rightHip.rotation.x = rightHipSwing;
    
    const rightKneeBend = Math.max(0, Math.sin(rightLegPhase) * 0.6);
    rig.rightKnee.rotation.x = rightKneeBend;
    
    const rightAnkleComp = Math.sin(rightLegPhase) * 0.15;
    rig.rightAnkle.rotation.x = rightAnkleComp;

    // ARMS (opposite to legs, damped)
    const armSwingAmount = 0.3;
    const targetLeftArmX = Math.sin(rightLegPhase) * armSwingAmount;
    const targetRightArmX = Math.sin(leftLegPhase) * armSwingAmount;
    
    rig.leftShoulder.rotation.x = THREE.MathUtils.lerp(rig.leftShoulder.rotation.x, targetLeftArmX, 8 * deltaTime);
    rig.rightShoulder.rotation.x = THREE.MathUtils.lerp(rig.rightShoulder.rotation.x, targetRightArmX, 8 * deltaTime);
    
    // Slight elbow bend during swing
    rig.leftElbow.rotation.x = Math.max(0, -rig.leftShoulder.rotation.x * 0.3);
    rig.rightElbow.rotation.x = Math.max(0, -rig.rightShoulder.rotation.x * 0.3);

    // Head stabilization (reduce bob)
    if (Math.abs(rig.headPivot.rotation.y) < 0.1) {
      rig.headPivot.rotation.x = THREE.MathUtils.lerp(rig.headPivot.rotation.x, 0, 5 * deltaTime);
      rig.headPivot.rotation.y = THREE.MathUtils.lerp(rig.headPivot.rotation.y, 0, 5 * deltaTime);
    }
  }

  private animateIdle(npc: Entity, deltaTime: number): void {
    if (!npc.data || !npc.data.rig) return;

    const rig: NpcRig = npc.data.rig;
    
    npc.data.gaitPhase += deltaTime * 2.0;
    const phase = npc.data.gaitPhase;

    // Breathing
    rig.spine.position.y = Math.sin(phase) * 0.008;
    rig.spine.rotation.z = THREE.MathUtils.lerp(rig.spine.rotation.z, 0, 8 * deltaTime);

    // Reset limbs to neutral
    rig.leftHip.rotation.x = THREE.MathUtils.lerp(rig.leftHip.rotation.x, 0, 5 * deltaTime);
    rig.rightHip.rotation.x = THREE.MathUtils.lerp(rig.rightHip.rotation.x, 0, 5 * deltaTime);
    rig.leftKnee.rotation.x = THREE.MathUtils.lerp(rig.leftKnee.rotation.x, 0, 5 * deltaTime);
    rig.rightKnee.rotation.x = THREE.MathUtils.lerp(rig.rightKnee.rotation.x, 0, 5 * deltaTime);
    rig.leftAnkle.rotation.x = THREE.MathUtils.lerp(rig.leftAnkle.rotation.x, 0, 5 * deltaTime);
    rig.rightAnkle.rotation.x = THREE.MathUtils.lerp(rig.rightAnkle.rotation.x, 0, 5 * deltaTime);

    rig.leftShoulder.rotation.x = THREE.MathUtils.lerp(rig.leftShoulder.rotation.x, 0, 5 * deltaTime);
    rig.rightShoulder.rotation.x = THREE.MathUtils.lerp(rig.rightShoulder.rotation.x, 0, 5 * deltaTime);
    rig.leftElbow.rotation.x = THREE.MathUtils.lerp(rig.leftElbow.rotation.x, 0, 5 * deltaTime);
    rig.rightElbow.rotation.x = THREE.MathUtils.lerp(rig.rightElbow.rotation.x, 0, 5 * deltaTime);

    // Subtle head motion
    if (Math.abs(rig.headPivot.rotation.y) < 0.1) {
      const targetHeadY = Math.sin(phase * 0.3) * 0.08;
      rig.headPivot.rotation.y = THREE.MathUtils.lerp(rig.headPivot.rotation.y, targetHeadY, 2 * deltaTime);
      rig.headPivot.rotation.x = THREE.MathUtils.lerp(rig.headPivot.rotation.x, Math.sin(phase) * 0.02, 2 * deltaTime);
    }
  }
}
