import * as THREE from 'three';
import { World, Entity } from '../World';
import { InputSystem } from './InputSystem';
import { AnimationSystem } from './AnimationSystem';

export interface PawSwipeEvent {
  side: 'left' | 'right';
  target: Entity | null;
  position: THREE.Vector3;
  direction: THREE.Vector3;
}

export class PawInteractionSystem {
  private world: World;
  private swipeRange: number = 1.5;
  private swipeActiveTime: number = 0.25;
  private leftSwipeTimer: number = 0;
  private rightSwipeTimer: number = 0;
  private leftPawCollider: THREE.Sphere | null = null;
  private rightPawCollider: THREE.Sphere | null = null;

  constructor(world: World) {
    this.world = world;
  }

  public update(deltaTime: number, input: InputSystem, animation: AnimationSystem): void {
    const player = this.world.getPlayer();
    if (!player || !player.data) return;

    const leftPaw = player.data.leftPaw;
    const rightPaw = player.data.rightPaw;

    if (!leftPaw || !rightPaw) return;

    // Update swipe timers
    if (this.leftSwipeTimer > 0) {
      this.leftSwipeTimer -= deltaTime;
    }
    if (this.rightSwipeTimer > 0) {
      this.rightSwipeTimer -= deltaTime;
    }

    // Handle left paw swipe
    if (input.state.leftPawPressed && !animation.isAnimating(leftPaw)) {
      this.leftSwipeTimer = this.swipeActiveTime;
      
      // Play animation
      animation.playLeftPawSwipe(leftPaw, () => {
        // Animation complete
      });
      
      // Check for hits during swipe
      setTimeout(() => {
        const event = this.performSwipe(player, 'left', leftPaw);
        if (event.target) {
          this.handleSwipeInteraction(event);
        }
      }, 75); // Hit detection at peak of swipe
    }

    // Handle right paw swipe
    if (input.state.rightPawPressed && !animation.isAnimating(rightPaw)) {
      this.rightSwipeTimer = this.swipeActiveTime;
      
      // Play animation
      animation.playRightPawSwipe(rightPaw, () => {
        // Animation complete
      });
      
      // Check for hits during swipe
      setTimeout(() => {
        const event = this.performSwipe(player, 'right', rightPaw);
        if (event.target) {
          this.handleSwipeInteraction(event);
        }
      }, 75); // Hit detection at peak of swipe
    }

    // Update paw colliders for continuous physics
    this.updatePawColliders(player, leftPaw, rightPaw);
    
    // Check for paw collisions with objects
    if (this.leftSwipeTimer > 0) {
      this.checkPawCollisions(player, leftPaw, 'left');
    }
    if (this.rightSwipeTimer > 0) {
      this.checkPawCollisions(player, rightPaw, 'right');
    }

    // Update prompt display
    this.updatePromptDisplay(player);
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
      
      // Simple sphere-to-object collision
      const distance = collider.center.distanceTo(entity.position);
      
      if (distance < collider.radius + 0.3) {
        // Hit! Apply physics impulse
        if (entity.type === 'knockable' && !entity.data?.hitThisSwipe) {
          // Get direction from paw to object
          const direction = new THREE.Vector3().subVectors(entity.position, collider.center).normalize();
          
          // Apply stronger impulse
          if (!entity.velocity) entity.velocity = new THREE.Vector3();
          
          const impulse = direction.multiplyScalar(8);
          impulse.y = 3; // Add upward component
          entity.velocity.add(impulse);
          
          // Mark as hit this swipe
          if (!entity.data) entity.data = {};
          entity.data.hitThisSwipe = true;
          
          // Clear the flag after a short time
          setTimeout(() => {
            if (entity.data) {
              entity.data.hitThisSwipe = false;
            }
          }, 300);
          
          // Mark as knocked for scoring
          if (!entity.data.knocked) {
            entity.data.knocked = true;
            this.dispatchTaskEvent('knock', entity);
            this.awardPoints(10);
          }
        }
      }
    }
  }

  private performSwipe(player: Entity, side: 'left' | 'right', paw: THREE.Group): PawSwipeEvent {
    // Calculate swipe position and direction
    // Model forward is +X axis
    const forward = new THREE.Vector3(1, 0, 0);
    forward.applyEuler(player.rotation);

    // Get world position of the paw
    const pawWorldPos = new THREE.Vector3();
    paw.getWorldPosition(pawWorldPos);

    // Find targets in range
    const target = this.findSwipeTarget(pawWorldPos, player);

    return {
      side,
      target,
      position: pawWorldPos,
      direction: forward
    };
  }

  private findSwipeTarget(origin: THREE.Vector3, player: Entity): Entity | null {
    let closestTarget: Entity | null = null;
    let closestDistance = this.swipeRange;

    for (const [, entity] of this.world.getAllEntities()) {
      if (entity === player) continue;
      if (entity.type === 'floor') continue;

      const distance = origin.distanceTo(entity.position);
      
      if (distance < closestDistance && this.isInteractable(entity)) {
        closestTarget = entity;
        closestDistance = distance;
      }
    }

    return closestTarget;
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
    if (!target.velocity) target.velocity = new THREE.Vector3();
    if (!target.data) target.data = {};

    // Apply impulse
    const impulse = event.direction.clone().multiplyScalar(5);
    impulse.y = 2;
    target.velocity.add(impulse);

    // Mark as knocked
    if (!target.data.knocked) {
      target.data.knocked = true;
      
      // Dispatch event to task system
      this.dispatchTaskEvent('knock', target);
      
      // Award points
      this.awardPoints(10);
    }

    // Apply physics-like movement
    this.applyVelocityToEntity(target);
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

  private applyVelocityToEntity(entity: Entity): void {
    if (!entity.velocity) return;

    // Simple physics
    entity.position.add(entity.velocity.clone().multiplyScalar(0.016));
    entity.velocity.y -= 9.8 * 0.016;
    entity.velocity.multiplyScalar(0.95); // Damping

    // Floor collision
    if (entity.position.y < 0.15) {
      entity.position.y = 0.15;
      entity.velocity.y *= -0.3; // Bounce
      entity.velocity.x *= 0.8;
      entity.velocity.z *= 0.8;
    }
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
    let nearestDist = 2.0;

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

