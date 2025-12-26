import * as THREE from 'three';
import { World, Entity } from './World';
import { createToonMaterial } from './materials/ToonMaterial';
import type { PhysicsSystem } from './systems/PhysicsSystem';
import {
  createDynamicCylinderCollider,
  createDynamicBoxCollider,
  createDynamicSphereCollider,
  createFixedBoxCollider
} from './physics/RapierHelpers';

import { getRandom } from './utils/rng';

/**
 * Builds a complete, lived-in house with furniture, decor, and interactables
 */
export function buildHouse(world: World, physics: PhysicsSystem): void {
  // Create base structure
  createFloor(world, physics);
  createWalls(world, physics);
  createDoorway(world);
  createWindows(world);
  createCeiling(world);
  
  // Add furniture and decor clusters
  addLivingArea(world, physics);
  addDiningArea(world, physics);
  addKitchenArea(world, physics);
  addDecorClusters(world, physics);
  
  // Add interactables (will be handled separately after structure is built)
}

/**
 * Creates the floor with wood and tiled zones
 */
function createFloor(world: World, physics: PhysicsSystem): void {
  // Main wood floor - warmer tone
  const floorGeometry = new THREE.PlaneGeometry(30, 30);
  const floorMaterial = createToonMaterial(0xdaa76e); // Warmer wood
  const floor = new THREE.Mesh(floorGeometry, floorMaterial);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  world.scene.add(floor);

  const entity: Entity = {
    mesh: floor,
    position: floor.position,
    rotation: floor.rotation,
    type: 'floor'
  };
  world.addEntity('floor', entity);
  
  // Add physics collider for floor
  if (physics.isReady()) {
    const rapierWorld = physics.getWorld();
    if (rapierWorld) {
      const handle = createFixedBoxCollider(
        rapierWorld,
        30, // width
        0.2, // height (thin floor)
        30, // depth
        new THREE.Vector3(0, -0.1, 0) // slightly below visual floor
      );
      physics.registerRigidBody('floor_collider', handle.rigidBody, handle.collider);
    }
  }
  
  // Kitchen tile zone (checker pattern)
  const tileSize = 0.5;
  const tilesX = 8;
  const tilesZ = 10;
  const kitchenStartX = 4;
  const kitchenStartZ = -4;
  
  for (let x = 0; x < tilesX; x++) {
    for (let z = 0; z < tilesZ; z++) {
      // Alternating checker pattern
      const isLight = (x + z) % 2 === 0;
      const tileColor = isLight ? 0xe8e8e8 : 0xd0d0d0;
      
      const tile = new THREE.Mesh(
        new THREE.PlaneGeometry(tileSize, tileSize),
        createToonMaterial(tileColor)
      );
      tile.rotation.x = -Math.PI / 2;
      tile.position.set(
        kitchenStartX + x * tileSize,
        0.01, // Slightly above main floor
        kitchenStartZ + z * tileSize
      );
      tile.receiveShadow = true;
      world.scene.add(tile);
    }
  }
}

/**
 * Creates walls with baseboards and accent colors
 */
function createWalls(world: World, physics: PhysicsSystem): void {
  const wallMaterial = createToonMaterial(0xffe6b3); // Warm cream
  const accentWallMaterial = createToonMaterial(0x9acd32); // Green accent like reference
  const wallHeight = 5;
  
  // Back wall
  const backWallGeometry = new THREE.BoxGeometry(15, wallHeight, 0.3);
  const backWall = new THREE.Mesh(backWallGeometry, wallMaterial);
  backWall.position.set(0, wallHeight / 2, -7.5);
  backWall.receiveShadow = true;
  world.scene.add(backWall);
  
  const backWallEntity: Entity = {
    mesh: backWall,
    position: backWall.position,
    rotation: backWall.rotation,
    type: 'wall'
  };
  world.addEntity('back_wall', backWallEntity);
  
  // Add physics collider for back wall
  if (physics.isReady()) {
    const rapierWorld = physics.getWorld();
    if (rapierWorld) {
      const handle = createFixedBoxCollider(
        rapierWorld,
        15,
        wallHeight,
        0.3,
        backWall.position
      );
      physics.registerRigidBody('back_wall_collider', handle.rigidBody, handle.collider);
    }
  }
  
  // Left wall - GREEN ACCENT WALL
  const leftWallGeometry = new THREE.BoxGeometry(0.3, wallHeight, 15);
  const leftWall = new THREE.Mesh(leftWallGeometry, accentWallMaterial);
  leftWall.position.set(-7.5, wallHeight / 2, 0);
  leftWall.receiveShadow = true;
  world.scene.add(leftWall);
  
  const leftWallEntity: Entity = {
    mesh: leftWall,
    position: leftWall.position,
    rotation: leftWall.rotation,
    type: 'wall'
  };
  world.addEntity('left_wall', leftWallEntity);
  
  // Add physics collider for left wall
  if (physics.isReady()) {
    const rapierWorld = physics.getWorld();
    if (rapierWorld) {
      const handle = createFixedBoxCollider(
        rapierWorld,
        0.3,
        wallHeight,
        15,
        leftWall.position
      );
      physics.registerRigidBody('left_wall_collider', handle.rigidBody, handle.collider);
    }
  }
  
  // Right wall
  const rightWallGeometry = new THREE.BoxGeometry(0.3, wallHeight, 15);
  const rightWall = new THREE.Mesh(rightWallGeometry, wallMaterial);
  rightWall.position.set(7.5, wallHeight / 2, 0);
  rightWall.receiveShadow = true;
  world.scene.add(rightWall);
  
  const rightWallEntity: Entity = {
    mesh: rightWall,
    position: rightWall.position,
    rotation: rightWall.rotation,
    type: 'wall'
  };
  world.addEntity('right_wall', rightWallEntity);
  
  // Add physics collider for right wall
  if (physics.isReady()) {
    const rapierWorld = physics.getWorld();
    if (rapierWorld) {
      const handle = createFixedBoxCollider(
        rapierWorld,
        0.3,
        wallHeight,
        15,
        rightWall.position
      );
      physics.registerRigidBody('right_wall_collider', handle.rigidBody, handle.collider);
    }
  }
  
  // Add baseboards
  addBaseboards(world);
}

/**
 * Adds baseboards along walls
 */
function addBaseboards(world: World): void {
  const baseboardMaterial = createToonMaterial(0xffffff);
  const baseboardHeight = 0.15;
  const baseboardDepth = 0.1;
  
  // Back wall baseboard
  const backBaseboard = new THREE.Mesh(
    new THREE.BoxGeometry(15, baseboardHeight, baseboardDepth),
    baseboardMaterial
  );
  backBaseboard.position.set(0, baseboardHeight / 2, -7.4);
  world.scene.add(backBaseboard);
  
  // Left wall baseboard
  const leftBaseboard = new THREE.Mesh(
    new THREE.BoxGeometry(baseboardDepth, baseboardHeight, 15),
    baseboardMaterial
  );
  leftBaseboard.position.set(-7.4, baseboardHeight / 2, 0);
  world.scene.add(leftBaseboard);
  
  // Right wall baseboard
  const rightBaseboard = new THREE.Mesh(
    new THREE.BoxGeometry(baseboardDepth, baseboardHeight, 15),
    baseboardMaterial
  );
  rightBaseboard.position.set(7.4, baseboardHeight / 2, 0);
  world.scene.add(rightBaseboard);
}

/**
 * Creates a framed doorway/entry with glass door
 */
function createDoorway(world: World): void {
  // Door frame (thick trim around opening)
  const frameMaterial = createToonMaterial(0xffffff);
  const frameThickness = 0.15;
  const doorWidth = 2.2;
  const doorHeight = 4.2;
  
  // Top frame piece
  const topFrame = new THREE.Mesh(
    new THREE.BoxGeometry(doorWidth + frameThickness * 2, frameThickness, frameThickness),
    frameMaterial
  );
  topFrame.position.set(0, doorHeight, 7.4);
  world.scene.add(topFrame);
  
  // Left frame piece
  const leftFrame = new THREE.Mesh(
    new THREE.BoxGeometry(frameThickness, doorHeight, frameThickness),
    frameMaterial
  );
  leftFrame.position.set(-doorWidth / 2 - frameThickness / 2, doorHeight / 2, 7.4);
  world.scene.add(leftFrame);
  
  // Right frame piece
  const rightFrame = new THREE.Mesh(
    new THREE.BoxGeometry(frameThickness, doorHeight, frameThickness),
    frameMaterial
  );
  rightFrame.position.set(doorWidth / 2 + frameThickness / 2, doorHeight / 2, 7.4);
  world.scene.add(rightFrame);
  
  // Glass door panels with frame grid
  const doorPanelMaterial = new THREE.MeshToonMaterial({
    color: 0xaaddff,
    transparent: true,
    opacity: 0.4
  });
  
  // Create 6 glass panels (2 columns x 3 rows) like reference
  const panelWidth = (doorWidth - 0.3) / 2;
  const panelHeight = (doorHeight - 0.4) / 3;
  
  for (let col = 0; col < 2; col++) {
    for (let row = 0; row < 3; row++) {
      const panel = new THREE.Mesh(
        new THREE.PlaneGeometry(panelWidth - 0.05, panelHeight - 0.05),
        doorPanelMaterial
      );
      const xOffset = -doorWidth / 4 + col * (doorWidth / 2);
      const yOffset = panelHeight / 2 + 0.2 + row * panelHeight;
      panel.position.set(xOffset, yOffset, 7.45);
      world.scene.add(panel);
    }
  }
  
  // Door frame grid (thin dividers)
  const dividerMaterial = createToonMaterial(0xe0e0e0);
  
  // Vertical center divider
  const verticalDivider = new THREE.Mesh(
    new THREE.BoxGeometry(0.06, doorHeight - 0.2, 0.08),
    dividerMaterial
  );
  verticalDivider.position.set(0, doorHeight / 2, 7.45);
  world.scene.add(verticalDivider);
  
  // Horizontal dividers
  for (let i = 1; i < 3; i++) {
    const horizontalDivider = new THREE.Mesh(
      new THREE.BoxGeometry(doorWidth - 0.2, 0.06, 0.08),
      dividerMaterial
    );
    horizontalDivider.position.set(0, i * (doorHeight / 3), 7.45);
    world.scene.add(horizontalDivider);
  }
  
  // Door handle
  const handleMaterial = createToonMaterial(0xb8860b);
  const handle = new THREE.Mesh(
    new THREE.CylinderGeometry(0.04, 0.04, 0.3),
    handleMaterial
  );
  handle.rotation.z = Math.PI / 2;
  handle.position.set(0.8, 2.0, 7.5);
  world.scene.add(handle);
}

/**
 * Creates windows with outdoor views - UPGRADED with thicker frames and sills
 */
function createWindows(world: World): void {
  const windowFrameMaterial = createToonMaterial(0xf5f5f5);
  const glassMaterial = new THREE.MeshToonMaterial({
    color: 0x87ceeb,
    transparent: true,
    opacity: 0.25
  });
  
  // Create 3 windows on the back wall
  const windowPositions = [-4, 0, 4];
  const windowWidth = 2.0;
  const windowHeight = 2.4;
  
  windowPositions.forEach((x, index) => {
    const windowGroup = new THREE.Group();
    
    // Outer frame (thick) 
    const outerFrame = new THREE.Mesh(
      new THREE.BoxGeometry(windowWidth + 0.3, windowHeight + 0.3, 0.2),
      windowFrameMaterial
    );
    windowGroup.add(outerFrame);
    
    // Window sill (bottom ledge)
    const sill = new THREE.Mesh(
      new THREE.BoxGeometry(windowWidth + 0.4, 0.15, 0.25),
      windowFrameMaterial
    );
    sill.position.set(0, -(windowHeight + 0.3) / 2 - 0.075, 0.025);
    windowGroup.add(sill);
    
    // Glass panes (4 panes per window)
    const paneWidth = (windowWidth - 0.15) / 2;
    const paneHeight = (windowHeight - 0.15) / 2;
    
    for (let row = 0; row < 2; row++) {
      for (let col = 0; col < 2; col++) {
        const pane = new THREE.Mesh(
          new THREE.PlaneGeometry(paneWidth - 0.05, paneHeight - 0.05),
          glassMaterial
        );
        const xOff = -paneWidth / 2 + col * (paneWidth + 0.05);
        const yOff = -paneHeight / 2 + row * (paneHeight + 0.05);
        pane.position.set(xOff, yOff, 0.12);
        windowGroup.add(pane);
      }
    }
    
    // Window dividers/mullions (thicker)
    const dividerMaterial = createToonMaterial(0xdddddd);
    
    // Vertical center mullion
    const verticalMullion = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, windowHeight - 0.2, 0.1),
      dividerMaterial
    );
    verticalMullion.position.z = 0.12;
    windowGroup.add(verticalMullion);
    
    // Horizontal center mullion
    const horizontalMullion = new THREE.Mesh(
      new THREE.BoxGeometry(windowWidth - 0.2, 0.08, 0.1),
      dividerMaterial
    );
    horizontalMullion.position.z = 0.12;
    windowGroup.add(horizontalMullion);
    
    // Position window on wall
    windowGroup.position.set(x, 2.7, -7.35);
    world.scene.add(windowGroup);
    
    // Add layered outdoor view behind window
    addLayeredOutdoorView(world, x, index);
  });
}

/**
 * Adds layered "outdoor view" with depth (sky + far + mid + near layers)
 */
function addLayeredOutdoorView(world: World, x: number, index: number): void {
  // Sky backdrop (furthest layer)
  const sky = new THREE.Mesh(
    new THREE.PlaneGeometry(4, 4),
    createToonMaterial(0x87ceeb)
  );
  sky.position.set(x, 2.7, -9.0);
  world.scene.add(sky);
  
  // Far layer - distant elements
  if (index === 0) {
    // Distant hills/trees
    const hill = new THREE.Mesh(
      new THREE.SphereGeometry(1.2),
      createToonMaterial(0x6b8e23)
    );
    hill.scale.set(1, 0.4, 1);
    hill.position.set(x - 0.8, 1.5, -8.7);
    world.scene.add(hill);
    
    const distantTree = new THREE.Mesh(
      new THREE.SphereGeometry(0.6),
      createToonMaterial(0x228b22)
    );
    distantTree.position.set(x + 0.9, 2.2, -8.6);
    world.scene.add(distantTree);
  } else if (index === 1) {
    // Distant house
    const house = new THREE.Mesh(
      new THREE.BoxGeometry(0.8, 0.7, 0.6),
      createToonMaterial(0xffb3ba)
    );
    house.position.set(x - 0.3, 2.2, -8.5);
    world.scene.add(house);
    
    const roof = new THREE.Mesh(
      new THREE.ConeGeometry(0.5, 0.4, 4),
      createToonMaterial(0x8b4513)
    );
    roof.rotation.y = Math.PI / 4;
    roof.position.set(x - 0.3, 2.7, -8.5);
    world.scene.add(roof);
    
    // Chimney
    const chimney = new THREE.Mesh(
      new THREE.BoxGeometry(0.15, 0.3, 0.15),
      createToonMaterial(0xa0522d)
    );
    chimney.position.set(x, 2.95, -8.5);
    world.scene.add(chimney);
  } else {
    // Cloud
    const cloud1 = new THREE.Mesh(
      new THREE.SphereGeometry(0.3),
      createToonMaterial(0xffffff)
    );
    cloud1.scale.set(1.5, 0.8, 1);
    cloud1.position.set(x + 0.5, 3.5, -8.7);
    world.scene.add(cloud1);
    
    const cloud2 = new THREE.Mesh(
      new THREE.SphereGeometry(0.25),
      createToonMaterial(0xffffff)
    );
    cloud2.scale.set(1.3, 0.7, 1);
    cloud2.position.set(x - 0.3, 3.4, -8.6);
    world.scene.add(cloud2);
  }
  
  // Mid layer - garden/yard elements
  if (index !== 1) {
    // Tree trunk
    const treeTrunk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.12, 0.15, 1.0),
      createToonMaterial(0x8b4513)
    );
    const treeX = index === 0 ? x - 0.6 : x + 0.7;
    treeTrunk.position.set(treeX, 2.0, -8.3);
    world.scene.add(treeTrunk);
    
    // Tree leaves (multiple spheres for volume)
    const leafColors = [0x228b22, 0x32cd32, 0x2e8b57];
    for (let i = 0; i < 3; i++) {
      const leaves = new THREE.Mesh(
        new THREE.SphereGeometry(0.4 + i * 0.1),
        createToonMaterial(leafColors[i % leafColors.length])
      );
      leaves.position.set(
        treeX + (getRandom() - 0.5) * 0.3,
        2.6 + i * 0.15,
        -8.3 + (getRandom() - 0.5) * 0.2
      );
      world.scene.add(leaves);
    }
  }
  
  // Near layer - bushes/flowers
  const bushCount = index === 1 ? 2 : 3;
  for (let i = 0; i < bushCount; i++) {
    const bush = new THREE.Mesh(
      new THREE.SphereGeometry(0.25),
      createToonMaterial(0x3cb371)
    );
    bush.scale.set(1, 0.6, 1);
    const bushX = x - 0.8 + i * 0.8;
    bush.position.set(bushX, 1.6, -8.1);
    world.scene.add(bush);
    
    // Add small flowers on some bushes
    if (i % 2 === 0) {
      const flower = new THREE.Mesh(
        new THREE.SphereGeometry(0.06),
        createToonMaterial(0xff69b4)
      );
      flower.position.set(bushX + 0.1, 1.75, -8.0);
      world.scene.add(flower);
    }
  }
}

/**
 * Adds ceiling beams/trim - REFINED with fewer, chunkier beams and perimeter trim
 */
function createCeiling(world: World): void {
  const ceilingHeight = 5;
  const beamMaterial = createToonMaterial(0xd2b48c); // Warm wood tone
  
  // Create fewer but chunkier ceiling beams
  const beamPositions = [-2.5, 2.5];
  beamPositions.forEach(z => {
    const beam = new THREE.Mesh(
      new THREE.BoxGeometry(15, 0.35, 0.4),
      beamMaterial
    );
    beam.position.set(0, ceilingHeight - 0.175, z);
    beam.castShadow = true;
    world.scene.add(beam);
  });
  
  // Add perimeter crown molding/trim
  const trimMaterial = createToonMaterial(0xf5f5f5);
  const trimHeight = 0.25;
  const trimDepth = 0.2;
  
  // Back wall trim
  const backTrim = new THREE.Mesh(
    new THREE.BoxGeometry(15, trimHeight, trimDepth),
    trimMaterial
  );
  backTrim.position.set(0, ceilingHeight - trimHeight / 2, -7.4);
  world.scene.add(backTrim);
  
  // Front wall trim (around door)
  const frontTrimLeft = new THREE.Mesh(
    new THREE.BoxGeometry(5.4, trimHeight, trimDepth),
    trimMaterial
  );
  frontTrimLeft.position.set(-4.8, ceilingHeight - trimHeight / 2, 7.4);
  world.scene.add(frontTrimLeft);
  
  const frontTrimRight = new THREE.Mesh(
    new THREE.BoxGeometry(5.4, trimHeight, trimDepth),
    trimMaterial
  );
  frontTrimRight.position.set(4.8, ceilingHeight - trimHeight / 2, 7.4);
  world.scene.add(frontTrimRight);
  
  // Left wall trim
  const leftTrim = new THREE.Mesh(
    new THREE.BoxGeometry(trimDepth, trimHeight, 15),
    trimMaterial
  );
  leftTrim.position.set(-7.4, ceilingHeight - trimHeight / 2, 0);
  world.scene.add(leftTrim);
  
  // Right wall trim
  const rightTrim = new THREE.Mesh(
    new THREE.BoxGeometry(trimDepth, trimHeight, 15),
    trimMaterial
  );
  rightTrim.position.set(7.4, ceilingHeight - trimHeight / 2, 0);
  world.scene.add(rightTrim);
}

/**
 * Living area with couch, coffee table, bookshelf, etc.
 */
function addLivingArea(world: World, physics: PhysicsSystem): void {
  const livingGroup = new THREE.Group();
  
  // Couch (scratchable - will be added as entity separately) - positioned for foreground depth
  const couchGroup = createCouch();
  couchGroup.position.set(-5, 0, 4);
  world.scene.add(couchGroup);
  
  // Register couch as scratchable entity
  const couchEntity: Entity = {
    mesh: couchGroup,
    position: couchGroup.position,
    rotation: couchGroup.rotation,
    type: 'scratchable',
    data: { scratchProgress: 0 }
  };
  world.addEntity('couch', couchEntity);
  
  // Add physics collider for couch
  if (physics.isReady()) {
    const rapierWorld = physics.getWorld();
    if (rapierWorld) {
      const handle = createFixedBoxCollider(
        rapierWorld,
        3, // width
        0.8, // height
        1.2, // depth
        new THREE.Vector3(-5, 0.4, 4)
      );
      physics.registerRigidBody('couch_collider', handle.rigidBody, handle.collider);
    }
  }
  
  // Coffee table - closer to viewer
  const coffeeTable = createCoffeeTable();
  coffeeTable.position.set(-5, 0, 2);
  world.scene.add(coffeeTable);
  
  // Add physics collider for coffee table
  if (physics.isReady()) {
    const rapierWorld = physics.getWorld();
    if (rapierWorld) {
      const handle = createFixedBoxCollider(
        rapierWorld,
        1.5,
        0.4,
        1,
        new THREE.Vector3(-5, 0.2, 2)
      );
      physics.registerRigidBody('coffee_table_collider', handle.rigidBody, handle.collider);
    }
  }
  
  // Rug under coffee table - larger for depth
  const rug = new THREE.Mesh(
    new THREE.PlaneGeometry(3.5, 3),
    createToonMaterial(0xb22222)
  );
  rug.rotation.x = -Math.PI / 2;
  rug.position.set(-5, 0.01, 2.5);
  world.scene.add(rug);
  
  // Side table with lamp - near couch
  const sideTable = createSideTable();
  sideTable.position.set(-6.8, 0, 4);
  world.scene.add(sideTable);
  
  // Lamp on side table - make it knockable!
  const lamp = createLamp();
  lamp.position.set(-6.8, 0.7, 4);
  world.scene.add(lamp);
  
  const lampEntity: Entity = {
    mesh: lamp,
    position: lamp.position,
    rotation: lamp.rotation,
    velocity: new THREE.Vector3(),
    type: 'knockable',
    data: { knocked: false }
  };
  world.addEntity('side_table_lamp', lampEntity);
  
  // Add physics body for lamp (medium weight - lamp with base)
  if (physics.isReady()) {
    const rapierWorld = physics.getWorld();
    if (rapierWorld) {
      const handle = createDynamicCylinderCollider(
        rapierWorld,
        0.1, // radius
        0.35, // half height
        lamp.position,
        lamp.rotation,
        1.5 // Medium density
      );
      lampEntity.physicsBody = handle.rigidBody;
      physics.registerRigidBody('side_table_lamp', handle.rigidBody, handle.collider);
    }
  }
  
  // Bookshelf on left wall (green accent wall)
  const bookshelf = createBookshelf();
  bookshelf.position.set(-7, 0, -1);
  world.scene.add(bookshelf);
  
  // Add physics collider for bookshelf frame (fixed)
  if (physics.isReady()) {
    const rapierWorld = physics.getWorld();
    if (rapierWorld) {
      const handle = createFixedBoxCollider(
        rapierWorld,
        1.5,
        2,
        0.3,
        new THREE.Vector3(-7, 1, -1)
      );
      physics.registerRigidBody('bookshelf_collider', handle.rigidBody, handle.collider);
      
      // Make individual books knockable!
      let bookIndex = 0;
      bookshelf.children.forEach((child) => {
        // Books are identified by their BoxGeometry with specific dimensions
        if (child instanceof THREE.Mesh && 
            child.geometry.type === 'BoxGeometry' &&
            (child.geometry as THREE.BoxGeometry).parameters?.width === 0.15) {
          
          const worldPos = new THREE.Vector3();
          child.getWorldPosition(worldPos);
          
          const bookEntity: Entity = {
            mesh: child,
            position: worldPos,
            rotation: child.rotation,
            velocity: new THREE.Vector3(),
            type: 'knockable',
            data: { knocked: false }
          };
          const bookId = `book_${bookIndex}`;
          world.addEntity(bookId, bookEntity);
          
          // Add physics body for book (light - paper and cardboard)
          const bookHandle = createDynamicBoxCollider(
            rapierWorld,
            new THREE.Vector3(0.075, 0.1, 0.025), // half extents
            worldPos,
            child.rotation
          );
          // Set lighter mass for books
          if (bookHandle.rigidBody && bookHandle.rigidBody.setAdditionalMass) {
            bookHandle.rigidBody.setAdditionalMass(0.3, true);
          }
          bookEntity.physicsBody = bookHandle.rigidBody;
          physics.registerRigidBody(bookId, bookHandle.rigidBody, bookHandle.collider);
          
          bookIndex++;
        }
      });
    }
  }
  
  world.scene.add(livingGroup);
}

/**
 * Dining area with table, chairs, place settings
 */
function addDiningArea(world: World, physics: PhysicsSystem): void {
  // Dining table - moved more centered and closer to back windows
  const diningTable = createDiningTable();
  diningTable.position.set(0, 0, -3.5);
  world.scene.add(diningTable);
  
  // Add physics collider for dining table
  if (physics.isReady()) {
    const rapierWorld = physics.getWorld();
    if (rapierWorld) {
      const handle = createFixedBoxCollider(
        rapierWorld,
        3,
        1,
        1.5,
        new THREE.Vector3(0, 0.5, -3.5)
      );
      physics.registerRigidBody('dining_table_collider', handle.rigidBody, handle.collider);
    }
  }
  
  // Chairs around table
  const chairPositions = [
    { pos: new THREE.Vector3(-1.5, 0, -3.5), rot: Math.PI / 2 },
    { pos: new THREE.Vector3(1.5, 0, -3.5), rot: -Math.PI / 2 },
    { pos: new THREE.Vector3(0, 0, -4.7), rot: 0 },
    { pos: new THREE.Vector3(0, 0, -2.3), rot: Math.PI }
  ];
  
  chairPositions.forEach(({ pos, rot }, index) => {
    const chair = createChair();
    chair.position.copy(pos);
    chair.rotation.y = rot;
    world.scene.add(chair);
    
    // Add physics collider for chair
    if (physics.isReady()) {
      const rapierWorld = physics.getWorld();
      if (rapierWorld) {
        const handle = createFixedBoxCollider(
          rapierWorld,
          0.5,
          0.8,
          0.5,
          new THREE.Vector3(pos.x, 0.4, pos.z)
        );
        physics.registerRigidBody(`chair_${index}_collider`, handle.rigidBody, handle.collider);
      }
    }
  });
  
  // Table centerpiece (vase with flowers) - make it knockable!
  const centerpiece = createCenterpiece();
  centerpiece.position.set(0, 1.1, -3.5);
  world.scene.add(centerpiece);
  
  const centerpieceEntity: Entity = {
    mesh: centerpiece,
    position: centerpiece.position,
    rotation: centerpiece.rotation,
    velocity: new THREE.Vector3(),
    type: 'knockable',
    data: { knocked: false }
  };
  world.addEntity('table_centerpiece', centerpieceEntity);
  
  // Add physics body for centerpiece (vase with flowers - medium-heavy)
  if (physics.isReady()) {
    const rapierWorld = physics.getWorld();
    if (rapierWorld) {
      const handle = createDynamicCylinderCollider(
        rapierWorld,
        0.1, // radius
        0.15, // half height
        centerpiece.position,
        centerpiece.rotation,
        2.0 // Medium-heavy density for vase
      );
      centerpieceEntity.physicsBody = handle.rigidBody;
      physics.registerRigidBody('table_centerpiece', handle.rigidBody, handle.collider);
    }
  }
  
  // Add place settings at each seat
  const placeSettingPositions = [
    { x: -0.8, z: -3.5 },  // Left
    { x: 0.8, z: -3.5 },   // Right
    { x: 0, z: -4.2 },     // Back
    { x: 0, z: -2.8 }      // Front
  ];
  
  placeSettingPositions.forEach((pos, index) => {
    // Placemat
    const placemat = createPlacemat();
    placemat.position.set(pos.x, 1.06, pos.z);
    world.scene.add(placemat);
    
    // Wine glass - make it knockable!
    const glass = createWineGlass();
    glass.position.set(pos.x + 0.12, 1.07, pos.z + 0.08);
    world.scene.add(glass);
    
    const glassEntity: Entity = {
      mesh: glass,
      position: glass.position,
      rotation: glass.rotation,
      velocity: new THREE.Vector3(),
      type: 'knockable',
      data: { knocked: false }
    };
    const glassId = `wine_glass_${index}`;
    world.addEntity(glassId, glassEntity);
    
    // Add physics body for wine glass (very light - fragile)
    if (physics.isReady()) {
      const rapierWorld = physics.getWorld();
      if (rapierWorld) {
        const handle = createDynamicCylinderCollider(
          rapierWorld,
          0.04, // small radius
          0.08, // half height
          glass.position,
          glass.rotation,
          0.3 // Very light density for glass
        );
        glassEntity.physicsBody = handle.rigidBody;
        physics.registerRigidBody(glassId, handle.rigidBody, handle.collider);
      }
    }
    
    // Cutlery - make it knockable!
    const cutlery = createCutlerySet();
    cutlery.position.set(pos.x, 1.07, pos.z);
    world.scene.add(cutlery);
    
    const cutleryEntity: Entity = {
      mesh: cutlery,
      position: cutlery.position,
      rotation: cutlery.rotation,
      velocity: new THREE.Vector3(),
      type: 'knockable',
      data: { knocked: false }
    };
    const cutleryId = `cutlery_${index}`;
    world.addEntity(cutleryId, cutleryEntity);
    
    // Add physics body for cutlery (light weight - thin metal)
    if (physics.isReady()) {
      const rapierWorld = physics.getWorld();
      if (rapierWorld) {
        const handle = createDynamicBoxCollider(
          rapierWorld,
          new THREE.Vector3(0.15, 0.02, 0.08), // small flat box
          cutlery.position,
          cutlery.rotation
        );
        // Set lighter density for cutlery
        if (handle.rigidBody && handle.rigidBody.setAdditionalMass) {
          handle.rigidBody.setAdditionalMass(0.05, true);
        }
        cutleryEntity.physicsBody = handle.rigidBody;
        physics.registerRigidBody(cutleryId, handle.rigidBody, handle.collider);
      }
    }
  });
}

/**
 * Kitchen area with counters, cabinets, appliances
 */
function addKitchenArea(world: World, physics: PhysicsSystem): void {
  // Counter along right wall - positioned in kitchen tile zone
  const counter = createCounter();
  counter.position.set(6.5, 0, 0);
  world.scene.add(counter);
  
  // Add physics collider for counter
  if (physics.isReady()) {
    const rapierWorld = physics.getWorld();
    if (rapierWorld) {
      const handle = createFixedBoxCollider(
        rapierWorld,
        1,
        0.95,
        4,
        new THREE.Vector3(6.5, 0.475, 0)
      );
      physics.registerRigidBody('counter_collider', handle.rigidBody, handle.collider);
    }
  }
  
  // Upper cabinets
  const upperCabinet = createUpperCabinet();
  upperCabinet.position.set(6.5, 2.5, 0);
  world.scene.add(upperCabinet);
  
  // Fridge - back corner of kitchen
  const fridge = createFridge();
  fridge.position.set(7, 0, -3.5);
  world.scene.add(fridge);
  
  // Add physics collider for fridge
  if (physics.isReady()) {
    const rapierWorld = physics.getWorld();
    if (rapierWorld) {
      const handle = createFixedBoxCollider(
        rapierWorld,
        0.8,
        2,
        0.8,
        new THREE.Vector3(7, 1, -3.5)
      );
      physics.registerRigidBody('fridge_collider', handle.rigidBody, handle.collider);
    }
  }
  
  // Sink on counter
  const sink = createSink();
  sink.position.set(6.8, 0.95, 0);
  world.scene.add(sink);
  
  // Shelves with jars/items - on kitchen wall
  const shelf = createKitchenShelf();
  shelf.position.set(7, 1.5, 2);
  world.scene.add(shelf);
  
  // Water cooler near kitchen
  const waterCooler = createWaterCooler();
  waterCooler.position.set(5.5, 0, 5);
  world.scene.add(waterCooler);
  
  // Add physics collider for water cooler
  if (physics.isReady()) {
    const rapierWorld = physics.getWorld();
    if (rapierWorld) {
      const handle = createFixedBoxCollider(
        rapierWorld,
        0.5,
        1.2,
        0.5,
        new THREE.Vector3(5.5, 0.6, 5)
      );
      physics.registerRigidBody('water_cooler_collider', handle.rigidBody, handle.collider);
    }
  }
  
  // Microwave on counter
  const microwave = createMicrowave();
  microwave.position.set(6.5, 1.15, -1);
  world.scene.add(microwave);
  
  // Toaster on counter
  const toaster = createToaster();
  toaster.position.set(6.5, 1.05, 1.5);
  world.scene.add(toaster);
}

/**
 * Decorative clutter: boxes, picture frames, plants, toys
 */
function addDecorClusters(world: World, physics: PhysicsSystem): void {
  // Stacked boxes in corner - make them knockable!
  const boxStack = createBoxStack();
  boxStack.position.set(6.5, 0, -6);
  world.scene.add(boxStack);
  
  // Each box in the stack should be knockable (they're grouped, but we can treat the whole stack as one)
  const boxEntity: Entity = {
    mesh: boxStack,
    position: boxStack.position,
    rotation: boxStack.rotation,
    velocity: new THREE.Vector3(),
    type: 'knockable',
    data: { knocked: false }
  };
  world.addEntity('box_stack', boxEntity);
  
  // Add physics body for box stack (medium weight - cardboard boxes)
  if (physics.isReady()) {
    const rapierWorld = physics.getWorld();
    if (rapierWorld) {
      const handle = createDynamicBoxCollider(
        rapierWorld,
        new THREE.Vector3(0.4, 0.6, 0.4), // approximate size of stacked boxes
        boxStack.position,
        boxStack.rotation
      );
      // Set density for cardboard boxes
      if (handle.rigidBody && handle.rigidBody.setAdditionalMass) {
        handle.rigidBody.setAdditionalMass(1.5, true);
      }
      boxEntity.physicsBody = handle.rigidBody;
      physics.registerRigidBody('box_stack', handle.rigidBody, handle.collider);
    }
  }
  
  // Picture frames on walls
  addPictureFrames(world);
  
  // Potted plants - make them knockable!
  const plant1 = createPottedPlant();
  plant1.position.set(-6.5, 0, -6);
  world.scene.add(plant1);
  
  const plant1Entity: Entity = {
    mesh: plant1,
    position: plant1.position,
    rotation: plant1.rotation,
    velocity: new THREE.Vector3(),
    type: 'knockable',
    data: { knocked: false }
  };
  world.addEntity('potted_plant_1', plant1Entity);
  
  // Add physics body for plant 1 (heavy - pot with soil)
  if (physics.isReady()) {
    const rapierWorld = physics.getWorld();
    if (rapierWorld) {
      const handle = createDynamicCylinderCollider(
        rapierWorld,
        0.2, // radius
        0.25, // half height
        plant1.position,
        plant1.rotation,
        3.0 // Heavy density for plant pot
      );
      plant1Entity.physicsBody = handle.rigidBody;
      physics.registerRigidBody('potted_plant_1', handle.rigidBody, handle.collider);
    }
  }
  
  const plant2 = createPottedPlant();
  plant2.position.set(3, 0, 6);
  world.scene.add(plant2);
  
  const plant2Entity: Entity = {
    mesh: plant2,
    position: plant2.position,
    rotation: plant2.rotation,
    velocity: new THREE.Vector3(),
    type: 'knockable',
    data: { knocked: false }
  };
  world.addEntity('potted_plant_2', plant2Entity);
  
  // Add physics body for plant 2
  if (physics.isReady()) {
    const rapierWorld = physics.getWorld();
    if (rapierWorld) {
      const handle = createDynamicCylinderCollider(
        rapierWorld,
        0.2,
        0.25,
        plant2.position,
        plant2.rotation,
        3.0
      );
      plant2Entity.physicsBody = handle.rigidBody;
      physics.registerRigidBody('potted_plant_2', handle.rigidBody, handle.collider);
    }
  }
  
  // Toy pile - make individual toys knockable!
  const toyPile = createToyPile();
  toyPile.position.set(-2, 0, 5.5);
  world.scene.add(toyPile);
  
  // Add physics to each toy in the pile
  toyPile.children.forEach((toy, index) => {
    const worldPos = new THREE.Vector3();
    toy.getWorldPosition(worldPos);
    
    const toyEntity: Entity = {
      mesh: toy as THREE.Mesh,
      position: worldPos,
      rotation: toy.rotation,
      velocity: new THREE.Vector3(),
      type: 'knockable',
      data: { knocked: false }
    };
    const toyId = `toy_${index}`;
    world.addEntity(toyId, toyEntity);
    
    // Add physics body for each toy (very light - plastic toys)
    if (physics.isReady()) {
      const rapierWorld = physics.getWorld();
      if (rapierWorld) {
        let handle;
        // Determine shape based on toy geometry
        const geometry = (toy as THREE.Mesh).geometry;
        if (geometry.type === 'SphereGeometry') {
          handle = createDynamicSphereCollider(
            rapierWorld,
            0.1,
            worldPos
          );
          // Set density manually
          if (handle.rigidBody && handle.rigidBody.setAdditionalMass) {
            handle.rigidBody.setAdditionalMass(0.2, true);
          }
        } else if (geometry.type === 'BoxGeometry') {
          handle = createDynamicBoxCollider(
            rapierWorld,
            new THREE.Vector3(0.075, 0.075, 0.075),
            worldPos,
            toy.rotation
          );
          if (handle.rigidBody && handle.rigidBody.setAdditionalMass) {
            handle.rigidBody.setAdditionalMass(0.2, true);
          }
        } else {
          // Cylinder or other shape
          handle = createDynamicCylinderCollider(
            rapierWorld,
            0.08,
            0.075,
            worldPos,
            toy.rotation,
            0.2
          );
        }
        toyEntity.physicsBody = handle.rigidBody;
        physics.registerRigidBody(toyId, handle.rigidBody, handle.collider);
      }
    }
  });
}

// ============================================================================
// PROP CREATION FUNCTIONS
// ============================================================================

function createCouch(): THREE.Group {
  const couchGroup = new THREE.Group();
  const couchMaterial = createToonMaterial(0x4a5568);
  
  // Base
  const couchBase = new THREE.Mesh(
    new THREE.BoxGeometry(3, 0.6, 1.2),
    couchMaterial
  );
  couchBase.position.y = 0.3;
  couchBase.castShadow = true;
  couchGroup.add(couchBase);
  
  // Back
  const couchBack = new THREE.Mesh(
    new THREE.BoxGeometry(3, 0.8, 0.2),
    couchMaterial
  );
  couchBack.position.set(0, 0.7, -0.5);
  couchBack.castShadow = true;
  couchGroup.add(couchBack);
  
  // Arms
  const armGeometry = new THREE.BoxGeometry(0.3, 0.5, 1.2);
  const leftArm = new THREE.Mesh(armGeometry, couchMaterial);
  leftArm.position.set(-1.65, 0.55, 0);
  leftArm.castShadow = true;
  couchGroup.add(leftArm);
  
  const rightArm = new THREE.Mesh(armGeometry, couchMaterial);
  rightArm.position.set(1.65, 0.55, 0);
  rightArm.castShadow = true;
  couchGroup.add(rightArm);
  
  return couchGroup;
}

function createCoffeeTable(): THREE.Group {
  const tableGroup = new THREE.Group();
  const tableMaterial = createToonMaterial(0x8b4513);
  
  // Top
  const top = new THREE.Mesh(
    new THREE.BoxGeometry(1.5, 0.1, 1),
    tableMaterial
  );
  top.position.y = 0.4;
  top.castShadow = true;
  tableGroup.add(top);
  
  // Legs
  const legGeometry = new THREE.CylinderGeometry(0.04, 0.04, 0.4);
  const legPositions = [
    [-0.65, 0.2, -0.4],
    [0.65, 0.2, -0.4],
    [-0.65, 0.2, 0.4],
    [0.65, 0.2, 0.4]
  ];
  
  legPositions.forEach(pos => {
    const leg = new THREE.Mesh(legGeometry, tableMaterial);
    leg.position.set(pos[0], pos[1], pos[2]);
    leg.castShadow = true;
    tableGroup.add(leg);
  });
  
  return tableGroup;
}

function createSideTable(): THREE.Group {
  const tableGroup = new THREE.Group();
  const tableMaterial = createToonMaterial(0xd2691e);
  
  // Top
  const top = new THREE.Mesh(
    new THREE.CylinderGeometry(0.3, 0.3, 0.05),
    tableMaterial
  );
  top.position.y = 0.6;
  top.castShadow = true;
  tableGroup.add(top);
  
  // Leg
  const leg = new THREE.Mesh(
    new THREE.CylinderGeometry(0.05, 0.08, 0.6),
    tableMaterial
  );
  leg.position.y = 0.3;
  leg.castShadow = true;
  tableGroup.add(leg);
  
  return tableGroup;
}

function createLamp(): THREE.Group {
  const lampGroup = new THREE.Group();
  
  // Base
  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(0.08, 0.1, 0.05),
    createToonMaterial(0xffd700)
  );
  lampGroup.add(base);
  
  // Stem
  const stem = new THREE.Mesh(
    new THREE.CylinderGeometry(0.02, 0.02, 0.3),
    createToonMaterial(0xffd700)
  );
  stem.position.y = 0.15;
  lampGroup.add(stem);
  
  // Shade
  const shade = new THREE.Mesh(
    new THREE.ConeGeometry(0.15, 0.2, 8),
    createToonMaterial(0xfffacd)
  );
  shade.position.y = 0.35;
  lampGroup.add(shade);
  
  return lampGroup;
}

function createBookshelf(): THREE.Group {
  const shelfGroup = new THREE.Group();
  const shelfMaterial = createToonMaterial(0x8b4513);
  
  // Frame
  const frame = new THREE.Mesh(
    new THREE.BoxGeometry(1.5, 2, 0.3),
    shelfMaterial
  );
  frame.position.y = 1;
  frame.castShadow = true;
  shelfGroup.add(frame);
  
  // Shelves
  for (let i = 0; i < 4; i++) {
    const shelf = new THREE.Mesh(
      new THREE.BoxGeometry(1.4, 0.05, 0.28),
      shelfMaterial
    );
    shelf.position.set(0, 0.2 + i * 0.5, 0);
    shelfGroup.add(shelf);
    
    // Add books on each shelf
    for (let j = 0; j < 5; j++) {
      const book = createBook();
      book.position.set(-0.6 + j * 0.25, 0.25 + i * 0.5, 0);
      book.rotation.y = (getRandom() - 0.5) * 0.2;
      shelfGroup.add(book);
    }
  }
  
  return shelfGroup;
}

function createBook(): THREE.Mesh {
  const colors = [0xff6b6b, 0x4ecdc4, 0x45b7d1, 0xf7dc6f, 0xbb8fce];
  const color = colors[Math.floor(getRandom() * colors.length)];
  const book = new THREE.Mesh(
    new THREE.BoxGeometry(0.15, 0.2, 0.05),
    createToonMaterial(color)
  );
  book.castShadow = true;
  return book;
}

function createDiningTable(): THREE.Group {
  const tableGroup = new THREE.Group();
  const tableMaterial = createToonMaterial(0x8b4513);
  
  // Top
  const top = new THREE.Mesh(
    new THREE.BoxGeometry(3, 0.1, 1.5),
    tableMaterial
  );
  top.position.y = 1;
  top.castShadow = true;
  top.receiveShadow = true;
  tableGroup.add(top);
  
  // Legs
  const legGeometry = new THREE.CylinderGeometry(0.06, 0.06, 1);
  const legPositions = [
    [-1.3, 0.5, -0.6],
    [1.3, 0.5, -0.6],
    [-1.3, 0.5, 0.6],
    [1.3, 0.5, 0.6]
  ];
  
  legPositions.forEach(pos => {
    const leg = new THREE.Mesh(legGeometry, tableMaterial);
    leg.position.set(pos[0], pos[1], pos[2]);
    leg.castShadow = true;
    tableGroup.add(leg);
  });
  
  return tableGroup;
}

function createChair(): THREE.Group {
  const chairGroup = new THREE.Group();
  const chairMaterial = createToonMaterial(0xdc143c);
  
  // Seat
  const seat = new THREE.Mesh(
    new THREE.BoxGeometry(0.5, 0.1, 0.5),
    chairMaterial
  );
  seat.position.y = 0.5;
  seat.castShadow = true;
  chairGroup.add(seat);
  
  // Back
  const back = new THREE.Mesh(
    new THREE.BoxGeometry(0.5, 0.6, 0.1),
    chairMaterial
  );
  back.position.set(0, 0.8, -0.2);
  back.castShadow = true;
  chairGroup.add(back);
  
  // Legs
  const legGeometry = new THREE.CylinderGeometry(0.03, 0.03, 0.5);
  const legPositions = [
    [-0.2, 0.25, -0.2],
    [0.2, 0.25, -0.2],
    [-0.2, 0.25, 0.2],
    [0.2, 0.25, 0.2]
  ];
  
  legPositions.forEach(pos => {
    const leg = new THREE.Mesh(legGeometry, chairMaterial);
    leg.position.set(pos[0], pos[1], pos[2]);
    leg.castShadow = true;
    chairGroup.add(leg);
  });
  
  return chairGroup;
}

function createCenterpiece(): THREE.Group {
  const group = new THREE.Group();
  
  // Vase
  const vase = new THREE.Mesh(
    new THREE.CylinderGeometry(0.1, 0.08, 0.2),
    createToonMaterial(0x87ceeb)
  );
  vase.castShadow = true;
  group.add(vase);
  
  // Flowers
  const flowerColors = [0xff69b4, 0xffd700, 0xff6347];
  for (let i = 0; i < 3; i++) {
    const flower = new THREE.Mesh(
      new THREE.SphereGeometry(0.05),
      createToonMaterial(flowerColors[i])
    );
    flower.position.set(
      (getRandom() - 0.5) * 0.1,
      0.15 + getRandom() * 0.1,
      (getRandom() - 0.5) * 0.1
    );
    group.add(flower);
  }
  
  return group;
}

// NEW DETAILED PROPS

function createPlacemat(): THREE.Mesh {
  const placemat = new THREE.Mesh(
    new THREE.BoxGeometry(0.4, 0.01, 0.3),
    createToonMaterial(0xd2b48c)
  );
  placemat.castShadow = true;
  return placemat;
}

function createWineGlass(): THREE.Group {
  const group = new THREE.Group();
  
  // Stem
  const stem = new THREE.Mesh(
    new THREE.CylinderGeometry(0.015, 0.02, 0.12),
    createToonMaterial(0xe0e0e0)
  );
  stem.position.y = 0.06;
  group.add(stem);
  
  // Bowl
  const bowl = new THREE.Mesh(
    new THREE.SphereGeometry(0.05),
    new THREE.MeshToonMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.3
    })
  );
  bowl.scale.set(1, 1.2, 1);
  bowl.position.y = 0.13;
  bowl.castShadow = true;
  group.add(bowl);
  
  // Base
  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(0.03, 0.03, 0.01),
    createToonMaterial(0xe0e0e0)
  );
  base.castShadow = true;
  group.add(base);
  
  return group;
}

function createCutlerySet(): THREE.Group {
  const group = new THREE.Group();
  const silverMaterial = createToonMaterial(0xc0c0c0);
  
  // Fork
  const fork = new THREE.Mesh(
    new THREE.BoxGeometry(0.02, 0.01, 0.15),
    silverMaterial
  );
  fork.position.set(-0.05, 0.005, 0);
  group.add(fork);
  
  // Knife
  const knife = new THREE.Mesh(
    new THREE.BoxGeometry(0.015, 0.01, 0.15),
    silverMaterial
  );
  knife.position.set(0.05, 0.005, 0);
  group.add(knife);
  
  return group;
}

function createWaterCooler(): THREE.Group {
  const group = new THREE.Group();
  
  // Base cabinet
  const base = new THREE.Mesh(
    new THREE.BoxGeometry(0.5, 0.6, 0.5),
    createToonMaterial(0x708090)
  );
  base.position.y = 0.3;
  base.castShadow = true;
  group.add(base);
  
  // Water bottle (large jug)
  const bottle = new THREE.Mesh(
    new THREE.CylinderGeometry(0.2, 0.22, 0.5),
    new THREE.MeshToonMaterial({
      color: 0x87ceeb,
      transparent: true,
      opacity: 0.4
    })
  );
  bottle.position.y = 0.85;
  bottle.castShadow = true;
  group.add(bottle);
  
  // Bottle neck
  const neck = new THREE.Mesh(
    new THREE.CylinderGeometry(0.08, 0.2, 0.15),
    new THREE.MeshToonMaterial({
      color: 0x4682b4,
      transparent: true,
      opacity: 0.5
    })
  );
  neck.position.y = 1.15;
  group.add(neck);
  
  // Dispenser tap
  const tap = new THREE.Mesh(
    new THREE.BoxGeometry(0.15, 0.05, 0.08),
    createToonMaterial(0x4169e1)
  );
  tap.position.set(0.2, 0.8, 0);
  group.add(tap);
  
  return group;
}

function createMicrowave(): THREE.Group {
  const group = new THREE.Group();
  
  // Body
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(0.5, 0.35, 0.4),
    createToonMaterial(0x2f4f4f)
  );
  body.castShadow = true;
  group.add(body);
  
  // Door (glass front)
  const door = new THREE.Mesh(
    new THREE.PlaneGeometry(0.35, 0.25),
    new THREE.MeshToonMaterial({
      color: 0x333333,
      transparent: true,
      opacity: 0.6
    })
  );
  door.position.set(0, 0, 0.21);
  group.add(door);
  
  // Control panel
  const panel = new THREE.Mesh(
    new THREE.BoxGeometry(0.12, 0.25, 0.02),
    createToonMaterial(0x1a1a1a)
  );
  panel.position.set(0.19, 0, 0.21);
  group.add(panel);
  
  // Buttons (small colored squares)
  const buttonColors = [0xff0000, 0x00ff00, 0xffff00];
  for (let i = 0; i < 3; i++) {
    const button = new THREE.Mesh(
      new THREE.BoxGeometry(0.03, 0.03, 0.01),
      createToonMaterial(buttonColors[i])
    );
    button.position.set(0.19, -0.05 + i * 0.05, 0.22);
    group.add(button);
  }
  
  return group;
}

function createToaster(): THREE.Group {
  const group = new THREE.Group();
  
  // Body
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(0.25, 0.2, 0.15),
    createToonMaterial(0xdc143c)
  );
  body.position.y = 0.1;
  body.castShadow = true;
  group.add(body);
  
  // Slots
  for (let i = 0; i < 2; i++) {
    const slot = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, 0.15, 0.02),
      createToonMaterial(0x1a1a1a)
    );
    slot.position.set(-0.06 + i * 0.12, 0.125, 0);
    group.add(slot);
  }
  
  // Lever
  const lever = new THREE.Mesh(
    new THREE.BoxGeometry(0.03, 0.08, 0.02),
    createToonMaterial(0x696969)
  );
  lever.position.set(0.1, 0.04, 0);
  group.add(lever);
  
  return group;
}

function createCounter(): THREE.Group {
  const counterGroup = new THREE.Group();
  const counterMaterial = createToonMaterial(0x708090);
  
  // Counter top
  const top = new THREE.Mesh(
    new THREE.BoxGeometry(1, 0.1, 4),
    counterMaterial
  );
  top.position.y = 0.95;
  top.castShadow = true;
  top.receiveShadow = true;
  counterGroup.add(top);
  
  // Cabinet base
  const cabinet = new THREE.Mesh(
    new THREE.BoxGeometry(0.9, 0.85, 3.8),
    createToonMaterial(0x8b7355)
  );
  cabinet.position.y = 0.425;
  cabinet.castShadow = true;
  counterGroup.add(cabinet);
  
  // Cabinet doors
  const doorMaterial = createToonMaterial(0xa0826d);
  for (let i = 0; i < 4; i++) {
    const door = new THREE.Mesh(
      new THREE.BoxGeometry(0.92, 0.4, 0.05),
      doorMaterial
    );
    door.position.set(0.46, 0.45, -1.4 + i * 0.95);
    counterGroup.add(door);
  }
  
  return counterGroup;
}

function createUpperCabinet(): THREE.Group {
  const cabinetGroup = new THREE.Group();
  const cabinetMaterial = createToonMaterial(0x8b7355);
  
  const cabinet = new THREE.Mesh(
    new THREE.BoxGeometry(0.4, 0.8, 3.8),
    cabinetMaterial
  );
  cabinet.castShadow = true;
  cabinetGroup.add(cabinet);
  
  return cabinetGroup;
}

function createFridge(): THREE.Group {
  const fridgeGroup = new THREE.Group();
  const fridgeMaterial = createToonMaterial(0xe8f4f8);
  
  // Main body
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(0.8, 2, 0.8),
    fridgeMaterial
  );
  body.position.y = 1;
  body.castShadow = true;
  fridgeGroup.add(body);
  
  // Doors
  const doorMaterial = createToonMaterial(0xffffff);
  const topDoor = new THREE.Mesh(
    new THREE.BoxGeometry(0.82, 0.8, 0.05),
    doorMaterial
  );
  topDoor.position.set(0.42, 1.5, 0);
  fridgeGroup.add(topDoor);
  
  const bottomDoor = new THREE.Mesh(
    new THREE.BoxGeometry(0.82, 1.1, 0.05),
    doorMaterial
  );
  bottomDoor.position.set(0.42, 0.55, 0);
  fridgeGroup.add(bottomDoor);
  
  // Handle
  const handle = new THREE.Mesh(
    new THREE.CylinderGeometry(0.02, 0.02, 0.3),
    createToonMaterial(0x333333)
  );
  handle.rotation.z = Math.PI / 2;
  handle.position.set(0.45, 1.5, 0.2);
  fridgeGroup.add(handle);
  
  return fridgeGroup;
}

function createSink(): THREE.Group {
  const sinkGroup = new THREE.Group();
  
  // Basin
  const basin = new THREE.Mesh(
    new THREE.CylinderGeometry(0.25, 0.2, 0.15),
    createToonMaterial(0xc0c0c0)
  );
  basin.castShadow = true;
  sinkGroup.add(basin);
  
  // Faucet
  const faucetBase = new THREE.Mesh(
    new THREE.CylinderGeometry(0.02, 0.03, 0.15),
    createToonMaterial(0xc0c0c0)
  );
  faucetBase.position.set(0, 0.075, -0.2);
  sinkGroup.add(faucetBase);
  
  const faucetArm = new THREE.Mesh(
    new THREE.TorusGeometry(0.08, 0.02, 8, 8, Math.PI),
    createToonMaterial(0xc0c0c0)
  );
  faucetArm.rotation.x = Math.PI / 2;
  faucetArm.position.set(0, 0.15, -0.12);
  sinkGroup.add(faucetArm);
  
  return sinkGroup;
}

function createKitchenShelf(): THREE.Group {
  const shelfGroup = new THREE.Group();
  const shelfMaterial = createToonMaterial(0x8b4513);
  
  // Shelf board
  const shelf = new THREE.Mesh(
    new THREE.BoxGeometry(0.8, 0.05, 0.25),
    shelfMaterial
  );
  shelfGroup.add(shelf);
  
  // Jars on shelf
  const jarColors = [0xff6b6b, 0xffd93d, 0x6bcf7f];
  for (let i = 0; i < 3; i++) {
    const jar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.08, 0.15),
      createToonMaterial(jarColors[i])
    );
    jar.position.set(-0.25 + i * 0.25, 0.1, 0);
    jar.castShadow = true;
    shelfGroup.add(jar);
  }
  
  return shelfGroup;
}

function createBoxStack(): THREE.Group {
  const stackGroup = new THREE.Group();
  
  // Create a more intentional cubby/shelf tower like the reference
  // Base colors matching reference
  const cubeColors = [0xff6b6b, 0x4ecdc4, 0xffd93d, 0xbb8fce, 0x95e1d3, 0xffa07a];
  
  // Large base cube
  const baseSize = 0.6;
  const baseCube = new THREE.Mesh(
    new THREE.BoxGeometry(baseSize, baseSize, baseSize),
    createToonMaterial(cubeColors[0])
  );
  baseCube.position.set(0, baseSize / 2, 0);
  baseCube.castShadow = true;
  stackGroup.add(baseCube);
  
  // Medium cube on top, slightly offset
  const midSize = 0.5;
  const midCube = new THREE.Mesh(
    new THREE.BoxGeometry(midSize, midSize, midSize),
    createToonMaterial(cubeColors[1])
  );
  midCube.position.set(-0.1, baseSize + midSize / 2, 0.05);
  midCube.rotation.y = 0.2;
  midCube.castShadow = true;
  stackGroup.add(midCube);
  
  // Small cube on top
  const smallSize = 0.4;
  const smallCube = new THREE.Mesh(
    new THREE.BoxGeometry(smallSize, smallSize, smallSize),
    createToonMaterial(cubeColors[2])
  );
  smallCube.position.set(0.08, baseSize + midSize + smallSize / 2, -0.08);
  smallCube.rotation.y = -0.3;
  smallCube.castShadow = true;
  stackGroup.add(smallCube);
  
  // Add a "cubby" - open compartment on side
  const cubbyFrame = new THREE.Group();
  
  // Cubby walls (3 sides + top/bottom)
  const cubbyMaterial = createToonMaterial(cubeColors[3]);
  const cubbySize = 0.45;
  const thickness = 0.05;
  
  // Bottom
  const cubbyBottom = new THREE.Mesh(
    new THREE.BoxGeometry(cubbySize, thickness, cubbySize),
    cubbyMaterial
  );
  cubbyBottom.castShadow = true;
  cubbyFrame.add(cubbyBottom);
  
  // Top
  const cubbyTop = new THREE.Mesh(
    new THREE.BoxGeometry(cubbySize, thickness, cubbySize),
    cubbyMaterial
  );
  cubbyTop.position.y = cubbySize;
  cubbyTop.castShadow = true;
  cubbyFrame.add(cubbyTop);
  
  // Back
  const cubbyBack = new THREE.Mesh(
    new THREE.BoxGeometry(cubbySize, cubbySize, thickness),
    cubbyMaterial
  );
  cubbyBack.position.set(0, cubbySize / 2, -cubbySize / 2 + thickness / 2);
  cubbyBack.castShadow = true;
  cubbyFrame.add(cubbyBack);
  
  // Left side
  const cubbyLeft = new THREE.Mesh(
    new THREE.BoxGeometry(thickness, cubbySize, cubbySize),
    cubbyMaterial
  );
  cubbyLeft.position.set(-cubbySize / 2 + thickness / 2, cubbySize / 2, 0);
  cubbyLeft.castShadow = true;
  cubbyFrame.add(cubbyLeft);
  
  // Right side
  const cubbyRight = new THREE.Mesh(
    new THREE.BoxGeometry(thickness, cubbySize, cubbySize),
    cubbyMaterial
  );
  cubbyRight.position.set(cubbySize / 2 - thickness / 2, cubbySize / 2, 0);
  cubbyRight.castShadow = true;
  cubbyFrame.add(cubbyRight);
  
  // Position cubby to the side
  cubbyFrame.position.set(0.6, 0, 0);
  stackGroup.add(cubbyFrame);
  
  // Add small decorative items in/around the cubby
  const smallBall = new THREE.Mesh(
    new THREE.SphereGeometry(0.08),
    createToonMaterial(cubeColors[4])
  );
  smallBall.position.set(0.6, 0.15, 0);
  smallBall.castShadow = true;
  stackGroup.add(smallBall);
  
  // Tiny cube accent
  const tinyCube = new THREE.Mesh(
    new THREE.BoxGeometry(0.12, 0.12, 0.12),
    createToonMaterial(cubeColors[5])
  );
  tinyCube.position.set(0.5, 0.52, 0.1);
  tinyCube.rotation.set(0.3, 0.4, 0.2);
  tinyCube.castShadow = true;
  stackGroup.add(tinyCube);
  
  return stackGroup;
}

function addPictureFrames(world: World): void {
  const frameMaterial = createToonMaterial(0xffd700);
  const pictureColors = [0xff6b6b, 0x4ecdc4, 0xffd93d, 0xbb8fce];
  
  // Back wall pictures
  for (let i = 0; i < 2; i++) {
    const frame = new THREE.Mesh(
      new THREE.BoxGeometry(0.5, 0.6, 0.05),
      frameMaterial
    );
    frame.position.set(-3 + i * 3, 2.5, -7.2);
    world.scene.add(frame);
    
    const picture = new THREE.Mesh(
      new THREE.PlaneGeometry(0.4, 0.5),
      createToonMaterial(pictureColors[i])
    );
    picture.position.set(-3 + i * 3, 2.5, -7.15);
    world.scene.add(picture);
  }
  
  // Left wall picture
  const frameLeft = new THREE.Mesh(
    new THREE.BoxGeometry(0.05, 0.6, 0.5),
    frameMaterial
  );
  frameLeft.position.set(-7.2, 2.5, 5);
  world.scene.add(frameLeft);
  
  const pictureLeft = new THREE.Mesh(
    new THREE.PlaneGeometry(0.5, 0.4),
    createToonMaterial(pictureColors[2])
  );
  pictureLeft.rotation.y = Math.PI / 2;
  pictureLeft.position.set(-7.15, 2.5, 5);
  world.scene.add(pictureLeft);
}

function createPottedPlant(): THREE.Group {
  const plantGroup = new THREE.Group();
  
  // Pot
  const pot = new THREE.Mesh(
    new THREE.CylinderGeometry(0.2, 0.15, 0.25),
    createToonMaterial(0xd2691e)
  );
  pot.position.y = 0.125;
  pot.castShadow = true;
  plantGroup.add(pot);
  
  // Plant leaves
  for (let i = 0; i < 5; i++) {
    const leaf = new THREE.Mesh(
      new THREE.SphereGeometry(0.1),
      createToonMaterial(0x228b22)
    );
    leaf.scale.set(1, 1.5, 0.5);
    const angle = (i / 5) * Math.PI * 2;
    leaf.position.set(
      Math.cos(angle) * 0.15,
      0.3 + getRandom() * 0.2,
      Math.sin(angle) * 0.15
    );
    plantGroup.add(leaf);
  }
  
  return plantGroup;
}

function createToyPile(): THREE.Group {
  const toyGroup = new THREE.Group();
  const toyColors = [0xff6b6b, 0x4ecdc4, 0xffd93d, 0xff69b4, 0x95e1d3];
  
  // Various toy shapes
  for (let i = 0; i < 6; i++) {
    let toy;
    const toyType = i % 3;
    
    if (toyType === 0) {
      // Cube
      toy = new THREE.Mesh(
        new THREE.BoxGeometry(0.15, 0.15, 0.15),
        createToonMaterial(toyColors[i % toyColors.length])
      );
    } else if (toyType === 1) {
      // Ball
      toy = new THREE.Mesh(
        new THREE.SphereGeometry(0.1),
        createToonMaterial(toyColors[i % toyColors.length])
      );
    } else {
      // Cylinder
      toy = new THREE.Mesh(
        new THREE.CylinderGeometry(0.08, 0.08, 0.15),
        createToonMaterial(toyColors[i % toyColors.length])
      );
    }
    
    toy.position.set(
      (getRandom() - 0.5) * 0.6,
      0.08 + (i % 3) * 0.12,
      (getRandom() - 0.5) * 0.6
    );
    toy.rotation.set(
      getRandom() * Math.PI,
      getRandom() * Math.PI,
      getRandom() * Math.PI
    );
    toy.castShadow = true;
    toyGroup.add(toy);
  }
  
  return toyGroup;
}

/**
 * Adds interactable items (knockables and scratchables) to the world
 */
export function addInteractables(world: World, physics: PhysicsSystem): void {
  // Dining table items (knockable)
  addDiningTableItems(world, physics);
  
  // Kitchen shelf items (knockable)
  addKitchenShelfItems(world, physics);
  
  // Cat scratching post (scratchable)
  addScratchingPost(world, physics);
  
  // Small plant pot (knockable)
  addKnockablePlant(world, physics);
}

function addDiningTableItems(world: World, physics: PhysicsSystem): void {
  const tableY = 1.15;
  
  // Plates (light - should move easily)
  const platePositions = [
    { x: 1, z: -3.4 },
    { x: 3, z: -3.4 },
    { x: 1, z: -2.6 },
    { x: 3, z: -2.6 }
  ];
  
  platePositions.forEach((pos, index) => {
    const plateGeometry = new THREE.CylinderGeometry(0.12, 0.12, 0.02);
    const plate = new THREE.Mesh(
      plateGeometry,
      createToonMaterial(0xffffff)
    );
    plate.position.set(pos.x, tableY, pos.z);
    plate.castShadow = true;
    world.scene.add(plate);
    
    const entity: Entity = {
      mesh: plate,
      position: plate.position,
      rotation: plate.rotation,
      velocity: new THREE.Vector3(),
      type: 'knockable',
      data: { knocked: false }
    };
    const entityId = `plate_${index}`;
    world.addEntity(entityId, entity);
    
    // Register physics body if physics is ready
    if (physics.isReady()) {
      const rapierWorld = physics.getWorld();
      if (rapierWorld) {
        const handle = createDynamicCylinderCollider(
          rapierWorld,
          0.12,
          0.02,
          plate.position,
          plate.rotation,
          0.5 // Light density for plates
        );
        entity.physicsBody = handle.rigidBody; // Store on entity
        physics.registerRigidBody(entityId, handle.rigidBody, handle.collider);
      }
    }
  });
  
  // Cups (medium weight)
  const cupPositions = [
    { x: 1.3, z: -3.3 },
    { x: 3.3, z: -3.3 },
    { x: 1.3, z: -2.7 },
    { x: 3.3, z: -2.7 }
  ];
  
  cupPositions.forEach((pos, index) => {
    const cup = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.05, 0.12),
      createToonMaterial(0x87ceeb)
    );
    cup.position.set(pos.x, tableY + 0.06, pos.z);
    cup.castShadow = true;
    world.scene.add(cup);
    
    const entity: Entity = {
      mesh: cup,
      position: cup.position,
      rotation: cup.rotation,
      velocity: new THREE.Vector3(),
      type: 'knockable',
      data: { knocked: false }
    };
    const entityId = `cup_${index}`;
    world.addEntity(entityId, entity);
    
    // Register physics body if physics is ready
    if (physics.isReady()) {
      const rapierWorld = physics.getWorld();
      if (rapierWorld) {
        const handle = createDynamicCylinderCollider(
          rapierWorld,
          0.055,
          0.12,
          cup.position,
          cup.rotation,
          1.0 // Medium density for cups
        );
        entity.physicsBody = handle.rigidBody; // Store on entity
        physics.registerRigidBody(entityId, handle.rigidBody, handle.collider);
      }
    }
  });
  
  // Wine bottles on table (heavier - should resist more)
  const bottlePositions = [
    { x: 0.7, z: -3 },
    { x: 2.3, z: -3 }
  ];
  
  bottlePositions.forEach((pos, index) => {
    const bottle = createBottle();
    bottle.position.set(pos.x, tableY, pos.z);
    world.scene.add(bottle);
    
    const entity: Entity = {
      mesh: bottle,
      position: bottle.position,
      rotation: bottle.rotation,
      velocity: new THREE.Vector3(),
      type: 'knockable',
      data: { knocked: false }
    };
    const entityId = `bottle_${index}`;
    world.addEntity(entityId, entity);
    
    // Register physics body if physics is ready
    if (physics.isReady()) {
      const rapierWorld = physics.getWorld();
      if (rapierWorld) {
        const handle = createDynamicCylinderCollider(
          rapierWorld,
          0.04,
          0.2,
          bottle.position,
          bottle.rotation,
          2.5 // Higher density for bottles - harder to push
        );
        entity.physicsBody = handle.rigidBody; // Store on entity
        physics.registerRigidBody(entityId, handle.rigidBody, handle.collider);
      }
    }
  });
}

function addKitchenShelfItems(world: World, physics: PhysicsSystem): void {
  // A couple small jars on the counter (medium weight - knockable)
  const jarPositions = [
    { x: 5.5, y: 1.05, z: 1.5 },
    { x: 5.8, y: 1.05, z: 3 }
  ];
  
  jarPositions.forEach((pos, index) => {
    const jarGeometry = new THREE.CylinderGeometry(0.08, 0.08, 0.12);
    const jar = new THREE.Mesh(
      jarGeometry,
      createToonMaterial(0xffa500)
    );
    jar.position.set(pos.x, pos.y, pos.z);
    jar.castShadow = true;
    world.scene.add(jar);
    
    const entity: Entity = {
      mesh: jar,
      position: jar.position,
      rotation: jar.rotation,
      velocity: new THREE.Vector3(),
      type: 'knockable',
      data: { knocked: false }
    };
    const entityId = `jar_${index}`;
    world.addEntity(entityId, entity);
    
    // Register physics body if physics is ready
    if (physics.isReady()) {
      const rapierWorld = physics.getWorld();
      if (rapierWorld) {
        const handle = createDynamicCylinderCollider(
          rapierWorld,
          0.08,
          0.12,
          jar.position,
          jar.rotation,
          1.5 // Medium density for jars
        );
        entity.physicsBody = handle.rigidBody; // Store on entity
        physics.registerRigidBody(entityId, handle.rigidBody, handle.collider);
      }
    }
  });
}

function addScratchingPost(world: World, _physics: PhysicsSystem): void {
  const postGroup = new THREE.Group();
  
  // Base
  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(0.35, 0.35, 0.1),
    createToonMaterial(0x8b7355)
  );
  base.position.y = 0.05;
  base.castShadow = true;
  postGroup.add(base);
  
  // Post
  const post = new THREE.Mesh(
    new THREE.CylinderGeometry(0.12, 0.12, 1),
    createToonMaterial(0xd2b48c)
  );
  post.position.y = 0.5;
  post.castShadow = true;
  postGroup.add(post);
  
  // Top platform
  const platform = new THREE.Mesh(
    new THREE.CylinderGeometry(0.25, 0.25, 0.08),
    createToonMaterial(0x8b7355)
  );
  platform.position.y = 1.04;
  platform.castShadow = true;
  postGroup.add(platform);
  
  // Small ball toy on top
  const ball = new THREE.Mesh(
    new THREE.SphereGeometry(0.08),
    createToonMaterial(0xff69b4)
  );
  ball.position.set(0.1, 1.16, 0);
  ball.castShadow = true;
  postGroup.add(ball);
  
  postGroup.position.set(-1.5, 0, 4);
  world.scene.add(postGroup);
  
  const entity: Entity = {
    mesh: postGroup,
    position: postGroup.position,
    rotation: postGroup.rotation,
    type: 'scratchable',
    data: { scratchProgress: 0 }
  };
  world.addEntity('scratching_post', entity);
}

function addKnockablePlant(world: World, physics: PhysicsSystem): void {
  const plantGroup = new THREE.Group();
  
  // Small pot
  const pot = new THREE.Mesh(
    new THREE.CylinderGeometry(0.12, 0.1, 0.15),
    createToonMaterial(0xd2691e)
  );
  pot.castShadow = true;
  plantGroup.add(pot);
  
  // Plant
  const plant = new THREE.Mesh(
    new THREE.SphereGeometry(0.12),
    createToonMaterial(0x228b22)
  );
  plant.position.y = 0.15;
  plant.castShadow = true;
  plantGroup.add(plant);
  
  plantGroup.position.set(-4, 0.52, 1);
  world.scene.add(plantGroup);
  
  const entity: Entity = {
    mesh: plantGroup,
    position: plantGroup.position,
    rotation: plantGroup.rotation,
    velocity: new THREE.Vector3(),
    type: 'knockable',
    data: { knocked: false }
  };
  const entityId = 'plant_pot';
  world.addEntity(entityId, entity);
  
  // Register physics body if physics is ready (heavier - pot with soil)
  if (physics.isReady()) {
    const rapierWorld = physics.getWorld();
    if (rapierWorld) {
      const handle = createDynamicCylinderCollider(
        rapierWorld,
        0.11,
        0.3,
        plantGroup.position,
        plantGroup.rotation,
        3.0 // Higher density for plant pot - harder to push
      );
      entity.physicsBody = handle.rigidBody; // Store on entity
      physics.registerRigidBody(entityId, handle.rigidBody, handle.collider);
    }
  }
}

function createBottle(): THREE.Group {
  const bottleGroup = new THREE.Group();
  
  // Body
  const body = new THREE.Mesh(
    new THREE.CylinderGeometry(0.04, 0.05, 0.2),
    createToonMaterial(0x2d5016)
  );
  body.position.y = 0.1;
  body.castShadow = true;
  bottleGroup.add(body);
  
  // Neck
  const neck = new THREE.Mesh(
    new THREE.CylinderGeometry(0.02, 0.04, 0.08),
    createToonMaterial(0x2d5016)
  );
  neck.position.y = 0.24;
  neck.castShadow = true;
  bottleGroup.add(neck);
  
  return bottleGroup;
}

