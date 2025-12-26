import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { createToonMaterial } from './materials/ToonMaterial';
import { buildHouse, addInteractables } from './HouseBuilder';

export interface Entity {
  mesh: THREE.Object3D;
  position: THREE.Vector3;
  rotation: THREE.Euler;
  velocity?: THREE.Vector3;
  physicsBody?: any;
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
    // Ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);

    // Directional light (sun)
    const sunLight = new THREE.DirectionalLight(0xfff5e6, 0.8);
    sunLight.position.set(10, 15, 5);
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

    // Fill light
    const fillLight = new THREE.DirectionalLight(0xaaddff, 0.3);
    fillLight.position.set(-5, 5, -5);
    this.scene.add(fillLight);
  }

  public initialize(): void {
    // Build the house with all furniture and decor
    buildHouse(this);
    
    // Add interactable items
    addInteractables(this);
    
    // Create the player
    this.createPlayer();
    
    // Create NPCs
    this.createHumanoidNpc('npc_1', new THREE.Vector3(-3, 0, -2));
  }


  private createPlayer(): void {
    // Cat with visible limbs and paws
    const catGroup = new THREE.Group();

    const catMaterial = createToonMaterial(0xff9933);
    const pawMaterial = createToonMaterial(0xffffff);
    
    // Body
    const bodyGeometry = new THREE.CapsuleGeometry(0.2, 0.4, 8, 16);
    const body = new THREE.Mesh(bodyGeometry, catMaterial);
    body.rotation.z = Math.PI / 2;
    body.castShadow = true;
    body.name = 'body';
    catGroup.add(body);

    // Head
    const headGeometry = new THREE.SphereGeometry(0.25, 16, 16);
    const head = new THREE.Mesh(headGeometry, catMaterial);
    head.position.set(0.35, 0, 0);
    head.castShadow = true;
    head.name = 'head';
    catGroup.add(head);

    // Ears
    const earGeometry = new THREE.ConeGeometry(0.1, 0.15, 8);
    const leftEar = new THREE.Mesh(earGeometry, catMaterial);
    leftEar.position.set(0.35, 0.2, 0.12);
    leftEar.castShadow = true;
    catGroup.add(leftEar);

    const rightEar = new THREE.Mesh(earGeometry, catMaterial);
    rightEar.position.set(0.35, 0.2, -0.12);
    rightEar.castShadow = true;
    catGroup.add(rightEar);

    // Eyes
    const eyeMaterial = new THREE.MeshToonMaterial({ color: 0x000000 });
    const eyeGeometry = new THREE.SphereGeometry(0.04, 8, 8);
    
    const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    leftEye.position.set(0.55, 0.08, 0.09);
    leftEye.scale.set(1.2, 1, 1); // Slightly oval shape
    leftEye.castShadow = true;
    catGroup.add(leftEye);

    const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    rightEye.position.set(0.55, 0.08, -0.09);
    rightEye.scale.set(1.2, 1, 1); // Slightly oval shape
    rightEye.castShadow = true;
    catGroup.add(rightEye);

    // Eye highlights (white dots for cute effect)
    const highlightMaterial = new THREE.MeshToonMaterial({ color: 0xffffff });
    const highlightGeometry = new THREE.SphereGeometry(0.015, 8, 8);
    
    const leftHighlight = new THREE.Mesh(highlightGeometry, highlightMaterial);
    leftHighlight.position.set(0.57, 0.1, 0.085);
    catGroup.add(leftHighlight);

    const rightHighlight = new THREE.Mesh(highlightGeometry, highlightMaterial);
    rightHighlight.position.set(0.57, 0.1, -0.085);
    catGroup.add(rightHighlight);

    // Nose
    const noseMaterial = new THREE.MeshToonMaterial({ color: 0xffaacc });
    const noseGeometry = new THREE.SphereGeometry(0.025, 8, 8);
    const nose = new THREE.Mesh(noseGeometry, noseMaterial);
    nose.position.set(0.58, 0.0, 0);
    nose.scale.set(1, 0.8, 0.8);
    nose.castShadow = true;
    catGroup.add(nose);

    // Mouth - Create a large, visible smile using a curved torus
    const mouthMaterial = new THREE.MeshToonMaterial({ color: 0x000000 });
    
    // Create smile using a torus (donut shape) - bigger and thicker
    const smileGeometry = new THREE.TorusGeometry(0.13, 0.025, 8, 16, Math.PI);
    const smile = new THREE.Mesh(smileGeometry, mouthMaterial);
    smile.position.set(0.56, -0.07, 0);
    smile.rotation.x = Math.PI; // Flip it so the curve goes up (smile)
    smile.rotation.y = Math.PI / 2; // Orient it to face forward
    catGroup.add(smile);

    // Front Left Leg
    const legGeometry = new THREE.CylinderGeometry(0.04, 0.04, 0.3, 8);
    const frontLeftLeg = new THREE.Mesh(legGeometry, catMaterial);
    frontLeftLeg.position.set(0.15, -0.25, -0.15);
    frontLeftLeg.castShadow = true;
    frontLeftLeg.name = 'frontLeftLeg';
    catGroup.add(frontLeftLeg);

    // Front Right Leg
    const frontRightLeg = new THREE.Mesh(legGeometry, catMaterial);
    frontRightLeg.position.set(0.15, -0.25, 0.15);
    frontRightLeg.castShadow = true;
    frontRightLeg.name = 'frontRightLeg';
    catGroup.add(frontRightLeg);

    // Back Left Leg
    const backLeftLeg = new THREE.Mesh(legGeometry, catMaterial);
    backLeftLeg.position.set(-0.25, -0.25, -0.15);
    backLeftLeg.castShadow = true;
    catGroup.add(backLeftLeg);

    // Back Right Leg
    const backRightLeg = new THREE.Mesh(legGeometry, catMaterial);
    backRightLeg.position.set(-0.25, -0.25, 0.15);
    backRightLeg.castShadow = true;
    catGroup.add(backRightLeg);

    // Front Left Paw (with claws)
    const pawGroup = new THREE.Group();
    const pawGeometry = new THREE.SphereGeometry(0.06, 8, 8);
    const leftPaw = new THREE.Mesh(pawGeometry, pawMaterial);
    leftPaw.scale.set(1, 0.7, 1);
    leftPaw.castShadow = true;
    pawGroup.add(leftPaw);
    
    // Claws for left paw
    const clawGeometry = new THREE.ConeGeometry(0.015, 0.05, 6);
    for (let i = 0; i < 3; i++) {
      const claw = new THREE.Mesh(clawGeometry, new THREE.MeshToonMaterial({ color: 0x333333 }));
      claw.position.set(0.04, -0.02, -0.03 + i * 0.03);
      claw.rotation.z = Math.PI / 2;
      claw.castShadow = true;
      pawGroup.add(claw);
    }
    
    pawGroup.position.set(0.15, -0.42, -0.15);
    pawGroup.name = 'leftPaw';
    catGroup.add(pawGroup);

    // Front Right Paw (with claws)
    const rightPawGroup = new THREE.Group();
    const rightPaw = new THREE.Mesh(pawGeometry, pawMaterial);
    rightPaw.scale.set(1, 0.7, 1);
    rightPaw.castShadow = true;
    rightPawGroup.add(rightPaw);
    
    // Claws for right paw
    for (let i = 0; i < 3; i++) {
      const claw = new THREE.Mesh(clawGeometry, new THREE.MeshToonMaterial({ color: 0x333333 }));
      claw.position.set(0.04, -0.02, -0.03 + i * 0.03);
      claw.rotation.z = Math.PI / 2;
      claw.castShadow = true;
      rightPawGroup.add(claw);
    }
    
    rightPawGroup.position.set(0.15, -0.42, 0.15);
    rightPawGroup.name = 'rightPaw';
    catGroup.add(rightPawGroup);

    // Back paws (no claws, simpler)
    const backPawGeometry = new THREE.SphereGeometry(0.06, 8, 8);
    const backLeftPaw = new THREE.Mesh(backPawGeometry, pawMaterial);
    backLeftPaw.scale.set(1, 0.7, 1);
    backLeftPaw.position.set(-0.25, -0.42, -0.15);
    backLeftPaw.castShadow = true;
    catGroup.add(backLeftPaw);

    const backRightPaw = new THREE.Mesh(backPawGeometry, pawMaterial);
    backRightPaw.scale.set(1, 0.7, 1);
    backRightPaw.position.set(-0.25, -0.42, 0.15);
    backRightPaw.castShadow = true;
    catGroup.add(backRightPaw);

    // Tail
    const tailGeometry = new THREE.CylinderGeometry(0.05, 0.03, 0.6, 8);
    const tail = new THREE.Mesh(tailGeometry, catMaterial);
    tail.position.set(-0.4, 0.2, 0);
    tail.rotation.z = Math.PI / 4;
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
  }

  private createHumanoidNpc(id: string, position: THREE.Vector3): void {
    const npcGroup = new THREE.Group();
    
    // Materials
    const skinMaterial = createToonMaterial(0xffdbac);
    const shirtMaterial = createToonMaterial(0x4a90e2);
    const pantsMaterial = createToonMaterial(0x2c3e50);
    const hairMaterial = createToonMaterial(0x3d2817);
    const shoeMaterial = createToonMaterial(0x1a1a1a);
    
    // Torso (capsule)
    const torsoGeometry = new THREE.CapsuleGeometry(0.25, 0.6, 8, 16);
    const torso = new THREE.Mesh(torsoGeometry, shirtMaterial);
    torso.castShadow = true;
    torso.name = 'torso';
    npcGroup.add(torso);
    
    // Head
    const headGeometry = new THREE.SphereGeometry(0.18, 16, 16);
    const head = new THREE.Mesh(headGeometry, skinMaterial);
    head.position.set(0, 0.5, 0);
    head.castShadow = true;
    head.name = 'head';
    npcGroup.add(head);
    
    // Hair (simple top piece)
    const hairGeometry = new THREE.SphereGeometry(0.19, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2);
    const hair = new THREE.Mesh(hairGeometry, hairMaterial);
    hair.position.set(0, 0.5, 0);
    hair.castShadow = true;
    npcGroup.add(hair);
    
    // Eyes
    const eyeMaterial = new THREE.MeshToonMaterial({ color: 0x000000 });
    const eyeGeometry = new THREE.SphereGeometry(0.025, 8, 8);
    
    const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    leftEye.position.set(0.08, 0.55, 0.15);
    leftEye.castShadow = true;
    npcGroup.add(leftEye);
    
    const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    rightEye.position.set(0.08, 0.55, -0.15);
    rightEye.castShadow = true;
    npcGroup.add(rightEye);
    
    // Nose (small bump)
    const noseGeometry = new THREE.SphereGeometry(0.03, 8, 8);
    const nose = new THREE.Mesh(noseGeometry, skinMaterial);
    nose.position.set(0.16, 0.48, 0);
    nose.scale.set(0.8, 0.8, 1.2);
    nose.castShadow = true;
    npcGroup.add(nose);
    
    // Left Arm
    const armGeometry = new THREE.CylinderGeometry(0.06, 0.055, 0.5, 8);
    const leftArm = new THREE.Mesh(armGeometry, shirtMaterial);
    leftArm.position.set(0, 0.05, 0.32);
    leftArm.castShadow = true;
    leftArm.name = 'leftArm';
    npcGroup.add(leftArm);
    
    // Right Arm
    const rightArm = new THREE.Mesh(armGeometry, shirtMaterial);
    rightArm.position.set(0, 0.05, -0.32);
    rightArm.castShadow = true;
    rightArm.name = 'rightArm';
    npcGroup.add(rightArm);
    
    // Left Hand
    const handGeometry = new THREE.SphereGeometry(0.07, 8, 8);
    const leftHand = new THREE.Mesh(handGeometry, skinMaterial);
    leftHand.position.set(0, -0.22, 0.32);
    leftHand.scale.set(1, 1.2, 0.8);
    leftHand.castShadow = true;
    leftHand.name = 'leftHand';
    npcGroup.add(leftHand);
    
    // Right Hand
    const rightHand = new THREE.Mesh(handGeometry, skinMaterial);
    rightHand.position.set(0, -0.22, -0.32);
    rightHand.scale.set(1, 1.2, 0.8);
    rightHand.castShadow = true;
    rightHand.name = 'rightHand';
    npcGroup.add(rightHand);
    
    // Pelvis/Hip area
    const pelvisGeometry = new THREE.CylinderGeometry(0.22, 0.2, 0.2, 8);
    const pelvis = new THREE.Mesh(pelvisGeometry, pantsMaterial);
    pelvis.position.set(0, -0.4, 0);
    pelvis.castShadow = true;
    npcGroup.add(pelvis);
    
    // Left Leg (upper)
    const legGeometry = new THREE.CylinderGeometry(0.08, 0.07, 0.45, 8);
    const leftLegUpper = new THREE.Mesh(legGeometry, pantsMaterial);
    leftLegUpper.position.set(0, -0.725, 0.12);
    leftLegUpper.castShadow = true;
    leftLegUpper.name = 'leftLegUpper';
    npcGroup.add(leftLegUpper);
    
    // Right Leg (upper)
    const rightLegUpper = new THREE.Mesh(legGeometry, pantsMaterial);
    rightLegUpper.position.set(0, -0.725, -0.12);
    rightLegUpper.castShadow = true;
    rightLegUpper.name = 'rightLegUpper';
    npcGroup.add(rightLegUpper);
    
    // Left Leg (lower/shin)
    const shinGeometry = new THREE.CylinderGeometry(0.065, 0.06, 0.4, 8);
    const leftLegLower = new THREE.Mesh(shinGeometry, pantsMaterial);
    leftLegLower.position.set(0, -1.15, 0.12);
    leftLegLower.castShadow = true;
    leftLegLower.name = 'leftLegLower';
    npcGroup.add(leftLegLower);
    
    // Right Leg (lower/shin)
    const rightLegLower = new THREE.Mesh(shinGeometry, pantsMaterial);
    rightLegLower.position.set(0, -1.15, -0.12);
    rightLegLower.castShadow = true;
    rightLegLower.name = 'rightLegLower';
    npcGroup.add(rightLegLower);
    
    // Left Foot
    const footGeometry = new THREE.BoxGeometry(0.18, 0.08, 0.12);
    const leftFoot = new THREE.Mesh(footGeometry, shoeMaterial);
    leftFoot.position.set(0.04, -1.39, 0.12);
    leftFoot.castShadow = true;
    leftFoot.name = 'leftFoot';
    npcGroup.add(leftFoot);
    
    // Right Foot
    const rightFoot = new THREE.Mesh(footGeometry, shoeMaterial);
    rightFoot.position.set(0.04, -1.39, -0.12);
    rightFoot.castShadow = true;
    rightFoot.name = 'rightFoot';
    npcGroup.add(rightFoot);
    
    // Position the NPC group (standing height)
    npcGroup.position.copy(position);
    npcGroup.position.y = 1.45; // Standing on ground
    
    this.scene.add(npcGroup);
    
    // Create entity with rig references for animation
    const npcEntity: Entity = {
      mesh: npcGroup,
      position: npcGroup.position,
      rotation: npcGroup.rotation,
      velocity: new THREE.Vector3(),
      type: 'npc_humanoid',
      data: {
        rig: {
          torso,
          head,
          leftArm,
          rightArm,
          leftHand,
          rightHand,
          leftLegUpper,
          rightLegUpper,
          leftLegLower,
          rightLegLower,
          leftFoot,
          rightFoot
        },
        // AI state
        wanderTarget: null,
        wanderTimer: 0,
        gaitPhase: 0,
        moveSpeed: 0,
        reactionCooldown: 0
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

