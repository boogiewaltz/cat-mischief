// @ts-nocheck - Rapier types are complex, using any for simplicity
import * as THREE from 'three';

let RAPIER: any = null;
let rapierWorld: any | null = null;

/**
 * Initialize Rapier physics engine (call once at startup)
 */
export async function initRapier(): Promise<any> {
  if (RAPIER && rapierWorld) {
    return rapierWorld;
  }

  try {
    // Dynamic import of Rapier
    RAPIER = await import('@dimforge/rapier3d');
    
    const gravity = { x: 0.0, y: -9.81, z: 0.0 };
    rapierWorld = new RAPIER.World(gravity);
    
    console.log('[Physics] Rapier initialized successfully');
    return rapierWorld;
  } catch (error) {
    console.error('[Physics] Failed to initialize Rapier:', error);
    throw error;
  }
}

/**
 * Check if Rapier is ready
 */
export function isRapierReady(): boolean {
  return RAPIER !== null && rapierWorld !== null;
}

/**
 * Get the Rapier world instance
 */
export function getRapierWorld(): any | null {
  return rapierWorld;
}

export interface RigidBodyHandle {
  rigidBody: any;
  collider: any;
}

/**
 * Create a static floor collider
 */
export function createFloorCollider(
  world: any,
  size: { width: number; depth: number },
  position: THREE.Vector3
): RigidBodyHandle {
  const rigidBodyDesc = RAPIER.RigidBodyDesc.fixed()
    .setTranslation(position.x, position.y, position.z);
  
  const rigidBody = world.createRigidBody(rigidBodyDesc);
  
  const colliderDesc = RAPIER.ColliderDesc.cuboid(size.width / 2, 0.1, size.depth / 2);
  const collider = world.createCollider(colliderDesc, rigidBody);
  
  return { rigidBody, collider };
}

/**
 * Create a dynamic capsule collider for the player (cat)
 * This creates a proper dynamic body that can push objects and be blocked by walls
 */
export function createCapsuleCollider(
  world: any,
  radius: number,
  halfHeight: number,
  position: THREE.Vector3,
  rotation: THREE.Euler
): RigidBodyHandle {
  // Create DYNAMIC rigid body (not kinematic) so it can interact properly
  const rigidBodyDesc = RAPIER.RigidBodyDesc.dynamic()
    .setTranslation(position.x, position.y, position.z)
    // Lock rotations on X and Z axes to prevent tipping over
    .lockRotations(true, false, true)
    // Enable CCD to prevent tunneling at high speeds
    .setCcdEnabled(true)
    // Add damping for stability
    .setLinearDamping(0.5)
    .setAngularDamping(1.0);
  
  const rigidBody = world.createRigidBody(rigidBodyDesc);
  
  // Set rotation
  const quat = new THREE.Quaternion().setFromEuler(rotation);
  rigidBody.setRotation({ w: quat.w, x: quat.x, y: quat.y, z: quat.z }, true);
  
  // Create capsule collider with appropriate physics properties
  const colliderDesc = RAPIER.ColliderDesc.capsule(halfHeight, radius)
    .setDensity(5.0) // Higher density so cat can push lighter objects
    .setFriction(0.8) // High friction to prevent sliding
    .setRestitution(0.0); // No bounce
  
  const collider = world.createCollider(colliderDesc, rigidBody);
  
  return { rigidBody, collider };
}

/**
 * Create a dynamic rigid body for knockable objects
 */
export function createDynamicBoxCollider(
  world: any,
  size: THREE.Vector3,
  position: THREE.Vector3,
  rotation: THREE.Euler
): RigidBodyHandle {
  const rigidBodyDesc = RAPIER.RigidBodyDesc.dynamic()
    .setTranslation(position.x, position.y, position.z)
    .setLinearDamping(0.5)
    .setAngularDamping(0.5);
  
  const rigidBody = world.createRigidBody(rigidBodyDesc);
  
  // Set rotation
  const quat = new THREE.Quaternion().setFromEuler(rotation);
  rigidBody.setRotation({ w: quat.w, x: quat.x, y: quat.y, z: quat.z }, true);
  
  const colliderDesc = RAPIER.ColliderDesc.cuboid(size.x / 2, size.y / 2, size.z / 2)
    .setDensity(1.0)
    .setFriction(0.5)
    .setRestitution(0.3);
  
  const collider = world.createCollider(colliderDesc, rigidBody);
  
  return { rigidBody, collider };
}

/**
 * Create a dynamic sphere collider for round objects
 */
export function createDynamicSphereCollider(
  world: any,
  radius: number,
  position: THREE.Vector3
): RigidBodyHandle {
  const rigidBodyDesc = RAPIER.RigidBodyDesc.dynamic()
    .setTranslation(position.x, position.y, position.z)
    .setLinearDamping(0.5)
    .setAngularDamping(0.5);
  
  const rigidBody = world.createRigidBody(rigidBodyDesc);
  
  const colliderDesc = RAPIER.ColliderDesc.ball(radius)
    .setDensity(1.0)
    .setFriction(0.5)
    .setRestitution(0.3);
  
  const collider = world.createCollider(colliderDesc, rigidBody);
  
  return { rigidBody, collider };
}

/**
 * Create a dynamic cylinder collider with configurable density
 */
export function createDynamicCylinderCollider(
  world: any,
  radius: number,
  height: number,
  position: THREE.Vector3,
  rotation: THREE.Euler,
  density: number = 1.0
): RigidBodyHandle {
  const rigidBodyDesc = RAPIER.RigidBodyDesc.dynamic()
    .setTranslation(position.x, position.y, position.z)
    .setLinearDamping(0.8) // Higher damping so objects settle faster
    .setAngularDamping(0.8);
  
  const rigidBody = world.createRigidBody(rigidBodyDesc);
  
  // Set rotation
  const quat = new THREE.Quaternion().setFromEuler(rotation);
  rigidBody.setRotation({ w: quat.w, x: quat.x, y: quat.y, z: quat.z }, true);
  
  const colliderDesc = RAPIER.ColliderDesc.cylinder(height / 2, radius)
    .setDensity(density)
    .setFriction(0.5)
    .setRestitution(0.1); // Lower restitution for less bouncing
  
  const collider = world.createCollider(colliderDesc, rigidBody);
  
  return { rigidBody, collider };
}

/**
 * Create a fixed box collider for static environment objects
 */
export function createFixedBoxCollider(
  world: any,
  width: number,
  height: number,
  depth: number,
  position: THREE.Vector3,
  rotation: THREE.Euler = new THREE.Euler()
): RigidBodyHandle {
  const rigidBodyDesc = RAPIER.RigidBodyDesc.fixed()
    .setTranslation(position.x, position.y, position.z);
  
  const rigidBody = world.createRigidBody(rigidBodyDesc);
  
  // Set rotation if provided
  const quat = new THREE.Quaternion().setFromEuler(rotation);
  rigidBody.setRotation({ w: quat.w, x: quat.x, y: quat.y, z: quat.z }, true);
  
  const colliderDesc = RAPIER.ColliderDesc.cuboid(width / 2, height / 2, depth / 2);
  const collider = world.createCollider(colliderDesc, rigidBody);
  
  return { rigidBody, collider };
}

/**
 * Create a fixed collider from a THREE.Object3D's bounding box
 */
export function createFixedColliderFromObjectAabb(
  world: any,
  object3d: THREE.Object3D,
  padding: number = 0
): RigidBodyHandle {
  // Calculate bounding box
  const box = new THREE.Box3().setFromObject(object3d);
  const size = new THREE.Vector3();
  box.getSize(size);
  const center = new THREE.Vector3();
  box.getCenter(center);
  
  // Apply padding
  size.x += padding * 2;
  size.y += padding * 2;
  size.z += padding * 2;
  
  return createFixedBoxCollider(world, size.x, size.y, size.z, center);
}
