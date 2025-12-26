import { Entity } from '../World';

export class PhysicsSystem {
  private initialized: boolean = false;

  constructor() {
    this.initializeFakePhysics();
  }

  private async initializeFakePhysics(): Promise<void> {
    console.log('Fake physics system initialized (WASM disabled)');
    this.initialized = true;
  }

  public isReady(): boolean {
    return this.initialized;
  }

  public getWorld(): any {
    return null;
  }

  public registerRigidBody(_entityId: string, _rigidBody: any, _collider: any): void {
  }

  public getRigidBody(_entityId: string): any | undefined {
    return undefined;
  }

  public getCollider(_entityId: string): any | undefined {
    return undefined;
  }

  public removeRigidBody(_entityId: string): void {
  }

  public update(_deltaTime: number): void {
  }

  public syncEntityToRigidBody(_entity: Entity, _rigidBody: any): void {
  }

  public syncRigidBodyToEntity(_rigidBody: any, _entity: Entity): void {
  }

  /**
   * Raycast down from a position to check for ground
   */
  public checkGrounded(
    position: { x: number; y: number; z: number },
    _distance: number
  ): boolean {
    // Simple ground check based on Y coordinate since Rapier is disabled
    return position.y <= 0.55; 
  }

  /**
   * Shape cast for paw collision detection
   */
  public shapeCastSphere(
    _origin: { x: number; y: number; z: number },
    _radius: number,
    _direction: { x: number; y: number; z: number },
    _maxDistance: number
  ): any | null {
    return null;
  }

  /**
   * Get all colliders within a sphere
   */
  public queryOverlapSphere(
    _center: { x: number; y: number; z: number },
    _radius: number
  ): any[] {
    return [];
  }
}
