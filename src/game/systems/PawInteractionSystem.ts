import * as THREE from 'three';
import { World, Entity } from '../World';
import { InputSystem } from './InputSystem';
import { AnimationSystem } from './AnimationSystem';
import { PhysicsSystem } from './PhysicsSystem';

export interface PawSwipeEvent {
  side: 'left' | 'right';
  target: Entity | null;
  position: THREE.Vector3;
  direction: THREE.Vector3;
}

enum SwipeState {
  Idle,
  Startup,   // 0ms - 75ms: startup before hit window
  Active,    // 75ms - 250ms: active hit detection window
  Recovery   // After 250ms: cooldown
}

interface SwipeTracker {
  state: SwipeState;
  timer: number;
  hitDetected: boolean;
}

export class PawInteractionSystem {
  private world: World;
  private physics: PhysicsSystem | null = null;
  private swipeRange: number = 1.5;
  
  // State machine timing (all in seconds)
  private swipeStartupTime: number = 0.075;  // 75ms startup
  private swipeActiveTime: number = 0.175;   // 175ms active window (75-250ms)
  private swipeRecoveryTime: number = 0.1;   // 100ms recovery
  
  private leftSwipe: SwipeTracker = { state: SwipeState.Idle, timer: 0, hitDetected: false };
  private rightSwipe: SwipeTracker = { state: SwipeState.Idle, timer: 0, hitDetected: false };
  
  private leftPawCollider: THREE.Sphere | null = null;
  private rightPawCollider: THREE.Sphere | null = null;
  
  // Track entities hit during current swipe to prevent double-hits
  private entitiesHitThisSwipe: Set<Entity> = new Set();

  constructor(world: World) {
    this.world = world;
  }
  
  public setPhysics(physics: PhysicsSystem): void {
    this.physics = physics;
  }

  public update(deltaTime: number, input: InputSystem, animation: AnimationSystem): void {
    const player = this.world.getPlayer();
    if (!player || !player.data) return;

    const leftPaw = player.data.leftPaw;
    const rightPaw = player.data.rightPaw;

    if (!leftPaw || !rightPaw) return;

    // Update paw colliders every frame
    this.updatePawColliders(player, leftPaw, rightPaw);

    // Handle left paw swipe state machine
    this.updateSwipeStateMachine(
      this.leftSwipe,
      input.state.leftPawPressed,
      animation.isAnimating(leftPaw),
      deltaTime,
      player,
      leftPaw,
      'left',
      animation
    );

    // Handle right paw swipe state machine
    this.updateSwipeStateMachine(
      this.rightSwipe,
      input.state.rightPawPressed,
      animation.isAnimating(rightPaw),
      deltaTime,
      player,
      rightPaw,
      'right',
      animation
    );

    // Update prompt display
    this.updatePromptDisplay(player);
  }

  private updateSwipeStateMachine(
    swipe: SwipeTracker,
    inputPressed: boolean,
    isAnimating: boolean,
    deltaTime: number,
    player: Entity,
    paw: THREE.Group,
    side: 'left' | 'right',
    animation: AnimationSystem
  ): void {
    switch (swipe.state) {
      case SwipeState.Idle:
        if (inputPressed && !isAnimating) {
          // Start swipe
          swipe.state = SwipeState.Startup;
          swipe.timer = 0;
          swipe.hitDetected = false;
          this.entitiesHitThisSwipe.clear();
          
          // Play animation
          if (side === 'left') {
            animation.playLeftPawSwipe(paw, () => {});
          } else {
            animation.playRightPawSwipe(paw, () => {});
          }
        }
        break;

      case SwipeState.Startup:
        swipe.timer += deltaTime;
        if (swipe.timer >= this.swipeStartupTime) {
          swipe.state = SwipeState.Active;
        }
        break;

      case SwipeState.Active:
        swipe.timer += deltaTime;
        
        // Perform collision detection during active window
        if (!swipe.hitDetected) {
          this.checkPawCollisions(player, paw, side);
        }
        
        if (swipe.timer >= this.swipeStartupTime + this.swipeActiveTime) {
          swipe.state = SwipeState.Recovery;
        }
        break;

      case SwipeState.Recovery:
        swipe.timer += deltaTime;
        if (swipe.timer >= this.swipeStartupTime + this.swipeActiveTime + this.swipeRecoveryTime) {
          swipe.state = SwipeState.Idle;
          swipe.timer = 0;
        }
        break;
    }
  }

  private updatePawColliders(_player: Entity, leftPaw: THREE.Group, rightPaw: THREE.Group): void {
    // Get world positions of paws
    const leftPawWorldPos = new THREE.Vector3();
    leftPaw.getWorldPosition(leftPawWorldPos);
    
    const rightPawWorldPos = new THREE.Vector3();
    rightPaw.getWorldPosition(rightPawWorldPos);
    
    // Create collision spheres
    this.leftPawCollider = new THREE.Sphere(leftPawWorldPos, 0.12);
    this.rightPawCollider = new THREE.Sphere(rightPawWorldPos, 0.12);
  }

  private checkPawCollisions(player: Entity, _paw: THREE.Group, side: 'left' | 'right'): void {
    const collider = side === 'left' ? this.leftPawCollider : this.rightPawCollider;
    if (!collider) return;

    // Check all entities for collision
    for (const [, entity] of this.world.getAllEntities()) {
      if (entity === player || !this.isInteractable(entity)) continue;
      
      // Skip if already hit this swipe
      if (this.entitiesHitThisSwipe.has(entity)) continue;
      
      // Simple sphere-to-object collision
      const distance = collider.center.distanceTo(entity.position);
      
      if (distance < collider.radius + 0.3) {
        // Hit detected!
        this.entitiesHitThisSwipe.add(entity);
        
        // Get direction from paw to object
        const direction = new THREE.Vector3().subVectors(entity.position, collider.center).normalize();
        
        // Handle interaction based on entity type
        const event: PawSwipeEvent = {
          side,
          target: entity,
          position: collider.center.clone(),
          direction
        };
        
        this.handleSwipeInteraction(event);
      }
    }
  }

  private isInteractable(entity: Entity): boolean {
    return entity.type === 'knockable' || 
           entity.type === 'scratchable' || 
           entity.type === 'pickupable' ||
           entity.type === 'npc_humanoid';
  }

  private handleSwipeInteraction(event: PawSwipeEvent): void {
    if (!event.target) return;

    const target = event.target;

    switch (target.type) {
      case 'knockable':
        this.handleKnock(target, event);
        break;
      case 'scratchable':
        this.handleScratch(target, event);
        break;
      case 'pickupable':
        this.handlePickup(target, event);
        break;
      case 'npc_humanoid':
        this.handleNpcPoke(target, event);
        break;
    }
  }

  private handleKnock(target: Entity, event: PawSwipeEvent): void {
    if (!target.data) target.data = {};

    // Get entity ID for this target
    const entityId = this.getEntityId(target);
    
    // Apply impulse via Rapier physics
    if (entityId && this.physics && this.physics.isReady()) {
      const impulseStrength = 5.0;
      const impulse = event.direction.clone().multiplyScalar(impulseStrength);
      impulse.y += 2.5; // Add upward component
      
      this.physics.applyImpulse(entityId, {
        x: impulse.x,
        y: impulse.y,
        z: impulse.z
      });
    } else {
      // Fallback for entities without physics bodies (shouldn't happen with Rapier)
      console.warn('[PawInteraction] No physics body found for entity:', entityId);
      if (!target.velocity) target.velocity = new THREE.Vector3();
      const impulse = event.direction.clone().multiplyScalar(8);
      impulse.y = 3;
      target.velocity.add(impulse);
    }

    // Mark as knocked for scoring (only once)
    if (!target.data.knocked) {
      target.data.knocked = true;
      this.dispatchTaskEvent('knock', target);
      this.awardPoints(10);
    }
  }

  private handleScratch(target: Entity, _event: PawSwipeEvent): void {
    if (!target.data) target.data = { scratchProgress: 0 };

    target.data.scratchProgress += 5;
    
    if (target.data.scratchProgress >= 100) {
      target.data.scratchProgress = 100;
      
      if (!target.data.scratchComplete) {
        target.data.scratchComplete = true;
        this.dispatchTaskEvent('scratch_complete', target);
        this.awardPoints(50);
      }
    } else {
      this.awardPoints(1);
    }

    // Visual feedback - change color slightly
    target.mesh.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material) {
        const material = child.material as THREE.MeshToonMaterial;
        if (!material.userData.originalColor) {
          material.userData.originalColor = material.color.clone();
        }
        const scratchAmount = target.data.scratchProgress / 100;
        material.color.lerpColors(
          material.userData.originalColor,
          new THREE.Color(0x888888),
          scratchAmount * 0.4
        );
      }
    });
  }

  private handlePickup(_target: Entity, _event: PawSwipeEvent): void {
    // Pickup implementation (optional for MVP)
  }

  private handleNpcPoke(target: Entity, _event: PawSwipeEvent): void {
    // Dispatch event to NpcSystem to handle the reaction
    const npcId = this.getNpcId(target);
    if (npcId) {
      window.dispatchEvent(new CustomEvent('npc-event', {
        detail: { type: 'poked', id: npcId }
      }));
    }
  }

  private getNpcId(entity: Entity): string | null {
    // Find the entity ID from the world
    for (const [id, ent] of this.world.getAllEntities()) {
      if (ent === entity) return id;
    }
    return null;
  }
  
  private getEntityId(entity: Entity): string | null {
    // Find the entity ID from the world
    for (const [id, ent] of this.world.getAllEntities()) {
      if (ent === entity) return id;
    }
    return null;
  }

  private updatePromptDisplay(player: Entity): void {
    const promptElement = document.getElementById('prompt-display');
    if (!promptElement) return;

    const nearbyInteractable = this.findNearestInteractable(player);

    if (nearbyInteractable) {
      let promptText = '';
      
      switch (nearbyInteractable.type) {
        case 'knockable':
          promptText = '<kbd>Q</kbd> / <kbd>E</kbd> Swipe to knock';
          break;
        case 'scratchable':
          const progress = nearbyInteractable.data?.scratchProgress || 0;
          promptText = `<kbd>Q</kbd> / <kbd>E</kbd> Scratch (${progress}%)`;
          break;
        case 'pickupable':
          promptText = '<kbd>Q</kbd> / <kbd>E</kbd> Pick up';
          break;
        case 'npc_humanoid':
          promptText = '<kbd>Q</kbd> / <kbd>E</kbd> Poke';
          break;
      }

      promptElement.innerHTML = promptText;
      promptElement.style.display = 'block';
    } else {
      promptElement.style.display = 'none';
    }
  }

  private findNearestInteractable(player: Entity): Entity | null {
    let nearest: Entity | null = null;
    // Slightly more generous than strict swipe range so prompts appear before you're perfectly in range
    let nearestDist = this.swipeRange + 0.5;

    for (const [_id, entity] of this.world.getAllEntities()) {
      if (entity === player || !this.isInteractable(entity)) continue;

      const dist = player.position.distanceTo(entity.position);
      if (dist < nearestDist) {
        nearest = entity;
        nearestDist = dist;
      }
    }

    return nearest;
  }

  private dispatchTaskEvent(eventType: string, target: Entity): void {
    window.dispatchEvent(new CustomEvent('task-event', {
      detail: { type: eventType, target }
    }));
  }

  private awardPoints(points: number): void {
    window.dispatchEvent(new CustomEvent('award-points', {
      detail: { points }
    }));
  }
}
