import * as THREE from 'three';
// @ts-nocheck
// RAPIER import removed to avoid WASM issues in Vite without plugin

/**
 * Physics helper utilities for Rapier integration
 */

export interface PhysicsHandle {
  rigidBody: any;
  collider: any;
}

export enum CollisionGroup {
  None = 0,
  Player = 1 << 0,
  Static = 1 << 1,
  Dynamic = 1 << 2,
  Props = 1 << 3,
  Furniture = 1 << 4,
  All = 0xFFFF
}

/**
 * Create a box collider from a Three.js BoxGeometry
 */
export function createBoxCollider(
  _world: any,
  _geometry: THREE.BoxGeometry,
  _position: THREE.Vector3,
  _rotation: THREE.Euler,
  _isStatic: boolean,
  _collisionGroup: number = CollisionGroup.Static,
  _collisionMask: number = CollisionGroup.All
): PhysicsHandle {
  return { rigidBody: null, collider: null };
}

/**
 * Create a sphere collider from a Three.js SphereGeometry
 */
export function createSphereCollider(
  _world: any,
  _geometry: THREE.SphereGeometry,
  _position: THREE.Vector3,
  _rotation: THREE.Euler,
  _isStatic: boolean,
  _collisionGroup: number = CollisionGroup.Dynamic,
  _collisionMask: number = CollisionGroup.All
): PhysicsHandle {
  return { rigidBody: null, collider: null };
}

/**
 * Create a cylinder collider from a Three.js CylinderGeometry
 */
export function createCylinderCollider(
  _world: any,
  _geometry: THREE.CylinderGeometry,
  _position: THREE.Vector3,
  _rotation: THREE.Euler,
  _isStatic: boolean,
  _collisionGroup: number = CollisionGroup.Dynamic,
  _collisionMask: number = CollisionGroup.All
): PhysicsHandle {
  return { rigidBody: null, collider: null };
}

/**
 * Create a capsule collider for the player
 */
export function createCapsuleCollider(
  _world: any,
  _radius: number,
  _halfHeight: number,
  _position: THREE.Vector3,
  _rotation: THREE.Euler,
  _collisionGroup: number = CollisionGroup.Player,
  _collisionMask: number = CollisionGroup.All
): PhysicsHandle {
  return { rigidBody: null, collider: null };
}

/**
 * Sync Three.js mesh transform from Rapier rigid body
 */
export function syncMeshFromRigidBody(_mesh: THREE.Object3D, _rigidBody: any): void {
}

/**
 * Sync Rapier rigid body from Three.js mesh transform
 */
export function syncRigidBodyFromMesh(_rigidBody: any, _mesh: THREE.Object3D): void {
}

/**
 * Pack collision group and mask into a single u32
 */
export function packCollisionGroups(membershipGroup: number, filterMask: number): number {
  return (membershipGroup << 16) | filterMask;
}

/**
 * Set friction and restitution for a collider
 */
export function setColliderMaterial(
  _collider: any,
  _friction: number,
  _restitution: number
): void {
}

/**
 * Set mass properties for a rigid body
 */
export function setRigidBodyMass(
  _rigidBody: any,
  _mass: number,
  _centerOfMass?: THREE.Vector3
): void {
}

/**
 * Apply an impulse to a rigid body
 */
export function applyImpulse(
  _rigidBody: any,
  _impulse: THREE.Vector3,
  _point?: THREE.Vector3
): void {
}

/**
 * Raycast helper
 */
export function raycast(
  _world: any,
  _origin: THREE.Vector3,
  _direction: THREE.Vector3,
  _maxDistance: number,
  _filterGroups?: number
): any | null {
  return null;
}

