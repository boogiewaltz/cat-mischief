import * as THREE from 'three';
import { World } from '../World';

export class CameraSystem {
  private world: World;
  private offset: THREE.Vector3 = new THREE.Vector3(0, 3, 6);
  private lookAtOffset: THREE.Vector3 = new THREE.Vector3(0, 0.5, 0);
  private currentPosition: THREE.Vector3 = new THREE.Vector3();
  private currentLookAt: THREE.Vector3 = new THREE.Vector3();
  private smoothness: number = 8;
  private minDistance: number = 3;
  private maxDistance: number = 10;

  constructor(world: World) {
    this.world = world;
  }

  public update(deltaTime: number): void {
    const player = this.world.getPlayer();
    if (!player) return;

    const camera = this.world.camera;

    // Calculate target position behind and above player
    const targetPosition = new THREE.Vector3()
      .copy(player.position)
      .add(this.offset);

    // Calculate look-at target (slightly above player)
    const targetLookAt = new THREE.Vector3()
      .copy(player.position)
      .add(this.lookAtOffset);

    // Smooth camera movement
    this.currentPosition.lerp(targetPosition, this.smoothness * deltaTime);
    this.currentLookAt.lerp(targetLookAt, this.smoothness * deltaTime);

    // Check for collision between camera and player
    const directionToCamera = new THREE.Vector3()
      .subVectors(this.currentPosition, player.position);
    
    const distance = directionToCamera.length();
    const clampedDistance = THREE.MathUtils.clamp(distance, this.minDistance, this.maxDistance);
    
    if (clampedDistance !== distance) {
      directionToCamera.normalize().multiplyScalar(clampedDistance);
      this.currentPosition.copy(player.position).add(directionToCamera);
    }

    camera.position.copy(this.currentPosition);
    camera.lookAt(this.currentLookAt);
  }

  public setOffset(offset: THREE.Vector3): void {
    this.offset.copy(offset);
  }
}

