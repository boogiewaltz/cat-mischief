// @ts-nocheck - Rapier types are complex, using any for simplicity
import { World, Entity } from '../World';
import { initRapier } from '../physics/RapierHelpers';

export class PhysicsSystem {
  private world: World;
  private rapierWorld: any | null = null;
  private initialized: boolean = false;
  private entityBodyMap: Map<string, any> = new Map();
  private entityColliderMap: Map<string, any> = new Map();
  
  constructor(world: World) {
    this.world = world;
    this.initializeAsync();
  }

  private async initializeAsync(): Promise<void> {
    try {
      this.rapierWorld = await initRapier();
      this.initialized = true;
      console.log('[PhysicsSystem] Rapier physics ready');
    } catch (error) {
      console.error('[PhysicsSystem] Failed to initialize Rapier:', error);
    }
  }

  public isReady(): boolean {
    return this.initialized && this.rapierWorld !== null;
  }

  public getWorld(): any | null {
    return this.rapierWorld;
  }

  public registerRigidBody(entityId: string, rigidBody: any, collider: any): void {
    this.entityBodyMap.set(entityId, rigidBody);
    this.entityColliderMap.set(entityId, collider);
  }

  public getRigidBody(entityId: string): any | undefined {
    return this.entityBodyMap.get(entityId);
  }

  public getCollider(entityId: string): any | undefined {
    return this.entityColliderMap.get(entityId);
  }

  public removeRigidBody(entityId: string): void {
    const body = this.entityBodyMap.get(entityId);
    
    if (this.rapierWorld && body) {
      this.rapierWorld.removeRigidBody(body);
    }
    
    this.entityBodyMap.delete(entityId);
    this.entityColliderMap.delete(entityId);
  }

  public update(deltaTime: number): void {
    if (!this.rapierWorld || !this.initialized) return;

    // Clamp deltaTime to prevent physics explosions
    const clampedDelta = Math.min(deltaTime, 0.1);
    this.rapierWorld.timestep = clampedDelta;
    this.rapierWorld.step();

    // Sync all dynamic entities (including player) from their rigid bodies
    for (const [entityId, rigidBody] of this.entityBodyMap) {
      const entity = this.world.getEntity(entityId);
      if (entity && rigidBody.isDynamic && rigidBody.isDynamic()) {
        this.syncEntityFromRigidBody(entity, rigidBody);
      }
    }
  }

  public syncEntityFromRigidBody(entity: Entity, rigidBody: any): void {
    // Sync entity position from rigid body
    const translation = rigidBody.translation();
    entity.position.set(translation.x, translation.y, translation.z);
    entity.mesh.position.copy(entity.position);

    // Only sync rotation for non-player entities (player controls its own rotation)
    if (entity.type !== 'player') {
      const rotation = rigidBody.rotation();
      entity.mesh.quaternion.set(rotation.x, rotation.y, rotation.z, rotation.w);
      entity.rotation.setFromQuaternion(entity.mesh.quaternion);
    }
  }

  public syncRigidBodyFromEntity(rigidBody: any, entity: Entity): void {
    // Sync rigid body from entity position/rotation (for kinematic bodies like player)
    rigidBody.setTranslation(
      { x: entity.position.x, y: entity.position.y, z: entity.position.z },
      true
    );
    
    const quat = entity.mesh.quaternion;
    rigidBody.setRotation(
      { w: quat.w, x: quat.x, y: quat.y, z: quat.z },
      true
    );
  }

  /**
   * Apply an impulse to a rigid body
   */
  public applyImpulse(entityId: string, impulse: { x: number; y: number; z: number }): void {
    const rigidBody = this.entityBodyMap.get(entityId);
    if (rigidBody && rigidBody.isDynamic && rigidBody.isDynamic()) {
      rigidBody.applyImpulse(impulse, true);
    }
  }

  /**
   * Raycast to check for ground
   */
  public raycast(
    origin: { x: number; y: number; z: number },
    direction: { x: number; y: number; z: number },
    maxDistance: number
  ): any | null {
    if (!this.rapierWorld) return null;

    try {
      const RAPIER = this.rapierWorld.constructor;
      const ray = new RAPIER.Ray(origin, direction);
      return this.rapierWorld.castRay(ray, maxDistance, true);
    } catch (error) {
      // Fallback to simple ground check
      return origin.y <= 0.55 ? {} : null;
    }
  }

  /**
   * Shape cast for overlap queries (e.g., paw swipes)
   */
  public overlapSphere(
    center: { x: number; y: number; z: number },
    radius: number
  ): any[] {
    if (!this.rapierWorld) return [];

    try {
      const RAPIER = this.rapierWorld.constructor;
      const colliders: any[] = [];
      
      this.rapierWorld.intersectionsWithShape(
        center,
        { w: 1, x: 0, y: 0, z: 0 },
        new RAPIER.Ball(radius),
        (collider: any) => {
          colliders.push(collider);
          return true; // Continue searching
        }
      );

      return colliders;
    } catch (error) {
      return [];
    }
  }

  /**
   * Get entity ID from collider (reverse lookup)
   */
  public getEntityIdFromCollider(collider: any): string | null {
    if (!collider || !collider.handle) return null;
    
    for (const [entityId, entityCollider] of this.entityColliderMap) {
      if (entityCollider.handle === collider.handle) {
        return entityId;
      }
    }
    return null;
  }
}
