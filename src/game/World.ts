import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { createToonMaterial } from './materials/ToonMaterial';
import { buildHouse, addInteractables } from './HouseBuilder';
import type { PhysicsSystem } from './systems/PhysicsSystem';

export interface Entity {
  mesh: THREE.Object3D;
  position: THREE.Vector3;
  rotation: THREE.Euler;
  velocity?: THREE.Vector3;
  physicsBody?: any;
  physicsHandle?: {
    bodyIndex: number;
    colliderIndex: number;
  };
  type: string;
  data?: any;
}

export class World {
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public gltfLoader: GLTFLoader;
  private entities: Map<string, Entity> = new Map();
  private player: Entity | null = null;

  constructor() {
    // Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x87ceeb);
    this.scene.fog = new THREE.Fog(0x87ceeb, 20, 80);

    // Camera
    this.camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.camera.position.set(0, 5, 10);

    // Loaders
    this.gltfLoader = new GLTFLoader();

    this.setupLighting();
  }

  private setupLighting(): void {
    // Warm ambient light for cozy interior feel
    const ambientLight = new THREE.AmbientLight(0xfff5e6, 0.7);
    this.scene.add(ambientLight);

    // Main sunlight - warmer color and angle for soft shadows
    const sunLight = new THREE.DirectionalLight(0xffebcd, 0.9);
    sunLight.position.set(8, 12, -3); // Angled to create nice shadows through windows
    sunLight.castShadow = true;
    sunLight.shadow.camera.left = -20;
    sunLight.shadow.camera.right = 20;
    sunLight.shadow.camera.top = 20;
    sunLight.shadow.camera.bottom = -20;
    sunLight.shadow.camera.near = 0.1;
    sunLight.shadow.camera.far = 50;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.bias = -0.0001;
    this.scene.add(sunLight);

    // Warm interior fill light
    const fillLight = new THREE.DirectionalLight(0xffd4a3, 0.4);
    fillLight.position.set(-5, 6, 8);
    this.scene.add(fillLight);
    
    // Cool sky fill for contrast
    const skyFill = new THREE.DirectionalLight(0xb0d4f1, 0.2);
    skyFill.position.set(3, 8, -10);
    this.scene.add(skyFill);
  }

  public initialize(physics: PhysicsSystem): void {
    // Build the house with all furniture and decor
    buildHouse(this, physics);
    
    // Add interactable items
    addInteractables(this, physics);
    
    // Create the player
    this.createPlayer(physics);
    
    // Create NPCs
    this.createHumanoidNpc('npc_1', new THREE.Vector3(-3, 0, -2));
  }


  private createPlayer(_physics: PhysicsSystem): void {
    // Cat with proper hierarchy and improved proportions
    const catGroup = new THREE.Group();
    catGroup.name = 'catRoot';

    const catMaterial = createToonMaterial(0xff9933);
    const pawMaterial = createToonMaterial(0xffffff);
    
    // Body - slightly shorter and rounder
    const bodyGeometry = new THREE.CapsuleGeometry(0.22, 0.35, 8, 16);
    const body = new THREE.Mesh(bodyGeometry, catMaterial);
    body.rotation.z = Math.PI / 2;
    body.castShadow = true;
    body.name = 'body';
    catGroup.add(body);

    // Head - larger and more prominent
    const headRadius = 0.28;
    const headGeometry = new THREE.SphereGeometry(headRadius, 16, 16);
    const head = new THREE.Mesh(headGeometry, catMaterial);
    head.position.set(0.4, 0, 0);
    head.castShadow = true;
    head.name = 'head';
    catGroup.add(head);

    // Face group - all facial features as children of head
    const faceGroup = new THREE.Group();
    faceGroup.name = 'faceGroup';
    head.add(faceGroup);

    // Ears - adjusted for larger head
    const earGeometry = new THREE.ConeGeometry(0.11, 0.18, 8);
    const leftEar = new THREE.Mesh(earGeometry, catMaterial);
    leftEar.position.set(-0.05, 0.22, 0.13);
    leftEar.castShadow = true;
    head.add(leftEar);

    const rightEar = new THREE.Mesh(earGeometry, catMaterial);
    rightEar.position.set(-0.05, 0.22, -0.13);
    rightEar.castShadow = true;
    head.add(rightEar);

    // Eyes - slightly inset into head, positioned in face-local coords
    const eyeMaterial = new THREE.MeshToonMaterial({ color: 0x000000 });
    const eyeGeometry = new THREE.SphereGeometry(0.045, 8, 8);
    
    const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    leftEye.position.set(0.22, 0.08, 0.10);
    leftEye.scale.set(1.2, 1, 0.8); // Slightly oval
    leftEye.castShadow = true;
    faceGroup.add(leftEye);

    const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    rightEye.position.set(0.22, 0.08, -0.10);
    rightEye.scale.set(1.2, 1, 0.8);
    rightEye.castShadow = true;
    faceGroup.add(rightEye);

    // Eye highlights
    const highlightMaterial = new THREE.MeshToonMaterial({ color: 0xffffff });
    const highlightGeometry = new THREE.SphereGeometry(0.018, 8, 8);
    
    const leftHighlight = new THREE.Mesh(highlightGeometry, highlightMaterial);
    leftHighlight.position.set(0.24, 0.10, 0.095);
    faceGroup.add(leftHighlight);

    const rightHighlight = new THREE.Mesh(highlightGeometry, highlightMaterial);
    rightHighlight.position.set(0.24, 0.10, -0.095);
    faceGroup.add(rightHighlight);

    // Nose
    const noseMaterial = new THREE.MeshToonMaterial({ color: 0xffaacc });
    const noseGeometry = new THREE.SphereGeometry(0.028, 8, 8);
    const nose = new THREE.Mesh(noseGeometry, noseMaterial);
    nose.position.set(0.26, 0.0, 0);
    nose.scale.set(1, 0.8, 0.8);
    nose.castShadow = true;
    faceGroup.add(nose);

    // Mouth - decal-based smile using canvas texture
    const mouthCanvas = document.createElement('canvas');
    mouthCanvas.width = 128;
    mouthCanvas.height = 128;
    const mouthCtx = mouthCanvas.getContext('2d')!;
    
    // Draw smile on transparent canvas
    mouthCtx.clearRect(0, 0, 128, 128);
    mouthCtx.strokeStyle = '#000000';
    mouthCtx.lineWidth = 6;
    mouthCtx.lineCap = 'round';
    mouthCtx.beginPath();
    // Draw a smile arc
    mouthCtx.arc(64, 45, 35, 0.3, Math.PI - 0.3);
    mouthCtx.stroke();
    
    const mouthTexture = new THREE.CanvasTexture(mouthCanvas);
    mouthTexture.needsUpdate = true;
    
    const mouthMaterial = new THREE.MeshBasicMaterial({
      map: mouthTexture,
      transparent: true,
      alphaTest: 0.1,
      depthWrite: false
    });
    
    const mouthGeometry = new THREE.PlaneGeometry(0.25, 0.25);
    const mouthDecal = new THREE.Mesh(mouthGeometry, mouthMaterial);
    // Position just in front of head surface with tiny epsilon offset
    mouthDecal.position.set(0.252, -0.06, 0);
    mouthDecal.rotation.y = 0; // Face forward
    faceGroup.add(mouthDecal);

    // Front Left Leg - thicker
    const legGeometry = new THREE.CylinderGeometry(0.055, 0.055, 0.32, 8);
    const frontLeftLeg = new THREE.Mesh(legGeometry, catMaterial);
    frontLeftLeg.position.set(0.15, -0.26, -0.16);
    frontLeftLeg.castShadow = true;
    frontLeftLeg.name = 'frontLeftLeg';
    catGroup.add(frontLeftLeg);

    // Front Right Leg
    const frontRightLeg = new THREE.Mesh(legGeometry, catMaterial);
    frontRightLeg.position.set(0.15, -0.26, 0.16);
    frontRightLeg.castShadow = true;
    frontRightLeg.name = 'frontRightLeg';
    catGroup.add(frontRightLeg);

    // Back Left Leg
    const backLeftLeg = new THREE.Mesh(legGeometry, catMaterial);
    backLeftLeg.position.set(-0.22, -0.26, -0.16);
    backLeftLeg.castShadow = true;
    catGroup.add(backLeftLeg);

    // Back Right Leg
    const backRightLeg = new THREE.Mesh(legGeometry, catMaterial);
    backRightLeg.position.set(-0.22, -0.26, 0.16);
    backRightLeg.castShadow = true;
    catGroup.add(backRightLeg);

    // Front Left Paw (with claws) - improved shape
    const pawGroup = new THREE.Group();
    const pawGeometry = new THREE.SphereGeometry(0.07, 8, 8);
    const leftPaw = new THREE.Mesh(pawGeometry, pawMaterial);
    leftPaw.scale.set(1, 0.65, 1.1);
    leftPaw.castShadow = true;
    pawGroup.add(leftPaw);
    
    // Claws for left paw
    const clawGeometry = new THREE.ConeGeometry(0.015, 0.05, 6);
    for (let i = 0; i < 3; i++) {
      const claw = new THREE.Mesh(clawGeometry, new THREE.MeshToonMaterial({ color: 0x333333 }));
      claw.position.set(0.05, -0.02, -0.03 + i * 0.03);
      claw.rotation.z = Math.PI / 2;
      claw.castShadow = true;
      pawGroup.add(claw);
    }
    
    pawGroup.position.set(0.15, -0.44, -0.16);
    pawGroup.name = 'leftPaw';
    catGroup.add(pawGroup);

    // Front Right Paw (with claws)
    const rightPawGroup = new THREE.Group();
    const rightPaw = new THREE.Mesh(pawGeometry, pawMaterial);
    rightPaw.scale.set(1, 0.65, 1.1);
    rightPaw.castShadow = true;
    rightPawGroup.add(rightPaw);
    
    // Claws for right paw
    for (let i = 0; i < 3; i++) {
      const claw = new THREE.Mesh(clawGeometry, new THREE.MeshToonMaterial({ color: 0x333333 }));
      claw.position.set(0.05, -0.02, -0.03 + i * 0.03);
      claw.rotation.z = Math.PI / 2;
      claw.castShadow = true;
      rightPawGroup.add(claw);
    }
    
    rightPawGroup.position.set(0.15, -0.44, 0.16);
    rightPawGroup.name = 'rightPaw';
    catGroup.add(rightPawGroup);

    // Back paws (no claws, simpler)
    const backPawGeometry = new THREE.SphereGeometry(0.07, 8, 8);
    const backLeftPaw = new THREE.Mesh(backPawGeometry, pawMaterial);
    backLeftPaw.scale.set(1, 0.65, 1.1);
    backLeftPaw.position.set(-0.22, -0.44, -0.16);
    backLeftPaw.castShadow = true;
    catGroup.add(backLeftPaw);

    const backRightPaw = new THREE.Mesh(backPawGeometry, pawMaterial);
    backRightPaw.scale.set(1, 0.65, 1.1);
    backRightPaw.position.set(-0.22, -0.44, 0.16);
    backRightPaw.castShadow = true;
    catGroup.add(backRightPaw);

    // Tail - longer and more dynamic
    const tailGeometry = new THREE.CylinderGeometry(0.055, 0.035, 0.7, 8);
    const tail = new THREE.Mesh(tailGeometry, catMaterial);
    tail.position.set(-0.42, 0.25, 0);
    tail.rotation.z = Math.PI / 3.5;
    tail.castShadow = true;
    catGroup.add(tail);

    catGroup.position.set(0, 0.5, 5);

    this.scene.add(catGroup);

    this.player = {
      mesh: catGroup,
      position: catGroup.position,
      rotation: catGroup.rotation,
      velocity: new THREE.Vector3(),
      type: 'player',
      data: {
        leftPaw: pawGroup,
        rightPaw: rightPawGroup,
        leftLeg: frontLeftLeg,
        rightLeg: frontRightLeg
      }
    };
    this.entities.set('player', this.player);
    
    // Player physics registration disabled to avoid WASM issues
  }

  private createHumanoidNpc(id: string, position: THREE.Vector3): void {
    // Materials
    const skinMaterial = createToonMaterial(0xffdbac);
    const shirtMaterial = createToonMaterial(0x4a90e2);
    const pantsMaterial = createToonMaterial(0x2c3e50);
    const hairMaterial = createToonMaterial(0x3d2817);
    const shoeMaterial = createToonMaterial(0x1a1a1a);
    const eyeMaterial = new THREE.MeshToonMaterial({ color: 0x000000 });
    
    // Root group
    const root = new THREE.Group();
    root.name = 'root';
    
    // Spine (torso pivot at center of mass)
    const spine = new THREE.Group();
    spine.position.set(0, 0, 0);
    spine.name = 'spine';
    root.add(spine);
    
    // Torso mesh
    const torsoGeometry = new THREE.CapsuleGeometry(0.25, 0.6, 8, 16);
    const torsoMesh = new THREE.Mesh(torsoGeometry, shirtMaterial);
    torsoMesh.castShadow = true;
    torsoMesh.name = 'torsoMesh';
    spine.add(torsoMesh);
    
    // Pelvis mesh (attached to spine)
    const pelvisGeometry = new THREE.CylinderGeometry(0.22, 0.2, 0.2, 8);
    const pelvisMesh = new THREE.Mesh(pelvisGeometry, pantsMaterial);
    pelvisMesh.position.set(0, -0.4, 0);
    pelvisMesh.castShadow = true;
    spine.add(pelvisMesh);
    
    // Head pivot at neck
    const headPivot = new THREE.Group();
    headPivot.position.set(0, 0.5, 0);
    headPivot.name = 'headPivot';
    spine.add(headPivot);
    
    // Head mesh (positioned above pivot/neck)
    const headGeometry = new THREE.SphereGeometry(0.18, 16, 16);
    const headMesh = new THREE.Mesh(headGeometry, skinMaterial);
    headMesh.position.set(0, 0.18, 0); // Move head up by its radius
    headMesh.castShadow = true;
    headMesh.name = 'headMesh';
    headPivot.add(headMesh);
    
    // Hair (child of head, positioned relative to head center)
    const hairGeometry = new THREE.SphereGeometry(0.19, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2);
    const hair = new THREE.Mesh(hairGeometry, hairMaterial);
    hair.position.set(0, 0.18, 0); // Same position as head
    hair.castShadow = true;
    headPivot.add(hair);
    
    // Eyes (children of head, adjusted for new head position)
    const eyeGeometry = new THREE.SphereGeometry(0.025, 8, 8);
    const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    leftEye.position.set(0.08, 0.23, 0.15); // 0.05 + 0.18 offset
    leftEye.castShadow = true;
    headPivot.add(leftEye);
    
    const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    rightEye.position.set(0.08, 0.23, -0.15); // 0.05 + 0.18 offset
    rightEye.castShadow = true;
    headPivot.add(rightEye);
    
    // Nose (child of head, adjusted for new head position)
    const noseGeometry = new THREE.SphereGeometry(0.03, 8, 8);
    const nose = new THREE.Mesh(noseGeometry, skinMaterial);
    nose.position.set(0.16, 0.16, 0); // -0.02 + 0.18 offset
    nose.scale.set(0.8, 0.8, 1.2);
    nose.castShadow = true;
    headPivot.add(nose);
    
    // LEFT ARM CHAIN
    // Left shoulder pivot
    const leftShoulder = new THREE.Group();
    leftShoulder.position.set(0, 0.25, 0.32);
    leftShoulder.name = 'leftShoulder';
    spine.add(leftShoulder);
    
    // Left upper arm mesh (extends down from shoulder)
    const upperArmGeometry = new THREE.CylinderGeometry(0.06, 0.055, 0.3, 8);
    const leftUpperArmMesh = new THREE.Mesh(upperArmGeometry, shirtMaterial);
    leftUpperArmMesh.position.set(0, -0.15, 0);
    leftUpperArmMesh.castShadow = true;
    leftShoulder.add(leftUpperArmMesh);
    
    // Left elbow pivot
    const leftElbow = new THREE.Group();
    leftElbow.position.set(0, -0.3, 0);
    leftElbow.name = 'leftElbow';
    leftShoulder.add(leftElbow);
    
    // Left forearm mesh
    const forearmGeometry = new THREE.CylinderGeometry(0.055, 0.05, 0.25, 8);
    const leftForearmMesh = new THREE.Mesh(forearmGeometry, shirtMaterial);
    leftForearmMesh.position.set(0, -0.125, 0);
    leftForearmMesh.castShadow = true;
    leftElbow.add(leftForearmMesh);
    
    // Left hand
    const handGeometry = new THREE.SphereGeometry(0.07, 8, 8);
    const leftHandMesh = new THREE.Mesh(handGeometry, skinMaterial);
    leftHandMesh.position.set(0, -0.25, 0);
    leftHandMesh.scale.set(1, 1.2, 0.8);
    leftHandMesh.castShadow = true;
    leftElbow.add(leftHandMesh);
    
    // RIGHT ARM CHAIN
    const rightShoulder = new THREE.Group();
    rightShoulder.position.set(0, 0.25, -0.32);
    rightShoulder.name = 'rightShoulder';
    spine.add(rightShoulder);
    
    const rightUpperArmMesh = new THREE.Mesh(upperArmGeometry, shirtMaterial);
    rightUpperArmMesh.position.set(0, -0.15, 0);
    rightUpperArmMesh.castShadow = true;
    rightShoulder.add(rightUpperArmMesh);
    
    const rightElbow = new THREE.Group();
    rightElbow.position.set(0, -0.3, 0);
    rightElbow.name = 'rightElbow';
    rightShoulder.add(rightElbow);
    
    const rightForearmMesh = new THREE.Mesh(forearmGeometry, shirtMaterial);
    rightForearmMesh.position.set(0, -0.125, 0);
    rightForearmMesh.castShadow = true;
    rightElbow.add(rightForearmMesh);
    
    const rightHandMesh = new THREE.Mesh(handGeometry, skinMaterial);
    rightHandMesh.position.set(0, -0.25, 0);
    rightHandMesh.scale.set(1, 1.2, 0.8);
    rightHandMesh.castShadow = true;
    rightElbow.add(rightHandMesh);
    
    // LEFT LEG CHAIN
    const leftHip = new THREE.Group();
    leftHip.position.set(0, -0.5, 0.12);
    leftHip.name = 'leftHip';
    spine.add(leftHip);
    
    // Left thigh mesh
    const thighGeometry = new THREE.CylinderGeometry(0.08, 0.07, 0.45, 8);
    const leftThighMesh = new THREE.Mesh(thighGeometry, pantsMaterial);
    leftThighMesh.position.set(0, -0.225, 0);
    leftThighMesh.castShadow = true;
    leftHip.add(leftThighMesh);
    
    // Left knee pivot
    const leftKnee = new THREE.Group();
    leftKnee.position.set(0, -0.45, 0);
    leftKnee.name = 'leftKnee';
    leftHip.add(leftKnee);
    
    // Left shin mesh
    const shinGeometry = new THREE.CylinderGeometry(0.065, 0.06, 0.4, 8);
    const leftShinMesh = new THREE.Mesh(shinGeometry, pantsMaterial);
    leftShinMesh.position.set(0, -0.2, 0);
    leftShinMesh.castShadow = true;
    leftKnee.add(leftShinMesh);
    
    // Left ankle pivot
    const leftAnkle = new THREE.Group();
    leftAnkle.position.set(0, -0.4, 0);
    leftAnkle.name = 'leftAnkle';
    leftKnee.add(leftAnkle);
    
    // Left foot mesh
    const footGeometry = new THREE.BoxGeometry(0.18, 0.08, 0.12);
    const leftFootMesh = new THREE.Mesh(footGeometry, shoeMaterial);
    leftFootMesh.position.set(0.04, -0.04, 0);
    leftFootMesh.castShadow = true;
    leftAnkle.add(leftFootMesh);
    
    // RIGHT LEG CHAIN
    const rightHip = new THREE.Group();
    rightHip.position.set(0, -0.5, -0.12);
    rightHip.name = 'rightHip';
    spine.add(rightHip);
    
    const rightThighMesh = new THREE.Mesh(thighGeometry, pantsMaterial);
    rightThighMesh.position.set(0, -0.225, 0);
    rightThighMesh.castShadow = true;
    rightHip.add(rightThighMesh);
    
    const rightKnee = new THREE.Group();
    rightKnee.position.set(0, -0.45, 0);
    rightKnee.name = 'rightKnee';
    rightHip.add(rightKnee);
    
    const rightShinMesh = new THREE.Mesh(shinGeometry, pantsMaterial);
    rightShinMesh.position.set(0, -0.2, 0);
    rightShinMesh.castShadow = true;
    rightKnee.add(rightShinMesh);
    
    const rightAnkle = new THREE.Group();
    rightAnkle.position.set(0, -0.4, 0);
    rightAnkle.name = 'rightAnkle';
    rightKnee.add(rightAnkle);
    
    const rightFootMesh = new THREE.Mesh(footGeometry, shoeMaterial);
    rightFootMesh.position.set(0.04, -0.04, 0);
    rightFootMesh.castShadow = true;
    rightAnkle.add(rightFootMesh);
    
    // Position the root (standing height)
    root.position.copy(position);
    root.position.y = 1.45;
    
    this.scene.add(root);
    
    // Create entity with pivot-based rig
    const npcEntity: Entity = {
      mesh: root,
      position: root.position,
      rotation: root.rotation,
      velocity: new THREE.Vector3(),
      type: 'npc_humanoid',
      data: {
        rig: {
          spine,
          headPivot,
          leftShoulder,
          rightShoulder,
          leftElbow,
          rightElbow,
          leftHip,
          rightHip,
          leftKnee,
          rightKnee,
          leftAnkle,
          rightAnkle
        },
        // AI state
        wanderTarget: null,
        wanderTimer: 0,
        gaitPhase: 0,
        moveSpeed: 0,
        reactionCooldown: 0,
        aiState: 'Wander',
        avoidTimer: 0
      }
    };
    
    this.addEntity(id, npcEntity);
  }

  public getPlayer(): Entity | null {
    return this.player;
  }

  public getEntity(id: string): Entity | undefined {
    return this.entities.get(id);
  }

  public getAllEntities(): Map<string, Entity> {
    return this.entities;
  }

  public addEntity(id: string, entity: Entity): void {
    this.entities.set(id, entity);
    if (!this.scene.children.includes(entity.mesh)) {
      this.scene.add(entity.mesh);
    }
  }

  public removeEntity(id: string): void {
    const entity = this.entities.get(id);
    if (entity) {
      this.scene.remove(entity.mesh);
      this.entities.delete(id);
    }
  }
}

