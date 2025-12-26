import * as THREE from 'three';
import { World, Entity } from './World';
import { createToonMaterial } from './materials/ToonMaterial';

/**
 * Builds a complete, lived-in house with furniture, decor, and interactables
 */
export function buildHouse(world: World): void {
  // Create base structure
  createFloor(world);
  createWalls(world);
  createWindows(world);
  createCeiling(world);
  
  // Add furniture and decor clusters
  addLivingArea(world);
  addDiningArea(world);
  addKitchenArea(world);
  addDecorClusters(world);
  
  // Add interactables (will be handled separately after structure is built)
}

/**
 * Creates the floor with a nice wood texture
 */
function createFloor(world: World): void {
  const floorGeometry = new THREE.PlaneGeometry(30, 30);
  const floorMaterial = createToonMaterial(0xd4a574);
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
}

/**
 * Creates walls with baseboards
 */
function createWalls(world: World): void {
  const wallMaterial = createToonMaterial(0xffe6b3);
  const wallHeight = 5;
  
  // Back wall
  const backWall = new THREE.Mesh(
    new THREE.BoxGeometry(15, wallHeight, 0.3),
    wallMaterial
  );
  backWall.position.set(0, wallHeight / 2, -7.5);
  backWall.receiveShadow = true;
  world.scene.add(backWall);
  
  // Left wall
  const leftWall = new THREE.Mesh(
    new THREE.BoxGeometry(0.3, wallHeight, 15),
    wallMaterial
  );
  leftWall.position.set(-7.5, wallHeight / 2, 0);
  leftWall.receiveShadow = true;
  world.scene.add(leftWall);
  
  // Right wall
  const rightWall = new THREE.Mesh(
    new THREE.BoxGeometry(0.3, wallHeight, 15),
    wallMaterial
  );
  rightWall.position.set(7.5, wallHeight / 2, 0);
  rightWall.receiveShadow = true;
  world.scene.add(rightWall);
  
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
 * Creates windows with outdoor views
 */
function createWindows(world: World): void {
  const windowFrameMaterial = createToonMaterial(0xffffff);
  const glassMaterial = new THREE.MeshToonMaterial({
    color: 0x87ceeb,
    transparent: true,
    opacity: 0.3
  });
  
  // Create 3 windows on the back wall
  const windowPositions = [-4, 0, 4];
  
  windowPositions.forEach((x, index) => {
    const windowGroup = new THREE.Group();
    
    // Frame
    const frame = new THREE.Mesh(
      new THREE.BoxGeometry(1.8, 2.2, 0.15),
      windowFrameMaterial
    );
    windowGroup.add(frame);
    
    // Glass panes (4 panes per window)
    for (let row = 0; row < 2; row++) {
      for (let col = 0; col < 2; col++) {
        const pane = new THREE.Mesh(
          new THREE.PlaneGeometry(0.8, 1.0),
          glassMaterial
        );
        pane.position.set(-0.4 + col * 0.9, -0.5 + row * 1.1, 0.1);
        windowGroup.add(pane);
      }
    }
    
    // Window dividers
    const dividerMaterial = createToonMaterial(0xdddddd);
    const verticalDivider = new THREE.Mesh(
      new THREE.BoxGeometry(0.05, 2.0, 0.08),
      dividerMaterial
    );
    verticalDivider.position.z = 0.1;
    windowGroup.add(verticalDivider);
    
    const horizontalDivider = new THREE.Mesh(
      new THREE.BoxGeometry(1.7, 0.05, 0.08),
      dividerMaterial
    );
    horizontalDivider.position.z = 0.1;
    windowGroup.add(horizontalDivider);
    
    // Position window on wall
    windowGroup.position.set(x, 2.5, -7.35);
    world.scene.add(windowGroup);
    
    // Add outdoor view cards behind windows
    addOutdoorView(world, x, index);
  });
}

/**
 * Adds simple "outdoor view" cards behind windows
 */
function addOutdoorView(world: World, x: number, index: number): void {
  const viewGroup = new THREE.Group();
  
  // Sky backdrop
  const sky = new THREE.Mesh(
    new THREE.PlaneGeometry(3, 3),
    createToonMaterial(0x87ceeb)
  );
  sky.position.z = -8.5;
  viewGroup.add(sky);
  
  // Add some simple outdoor elements based on window
  if (index === 0) {
    // Tree
    const treeTrunk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.1, 0.12, 0.8),
      createToonMaterial(0x8b4513)
    );
    treeTrunk.position.set(x - 0.5, 2.0, -8.4);
    world.scene.add(treeTrunk);
    
    const treeLeaves = new THREE.Mesh(
      new THREE.SphereGeometry(0.4),
      createToonMaterial(0x228b22)
    );
    treeLeaves.position.set(x - 0.5, 2.6, -8.4);
    world.scene.add(treeLeaves);
  } else if (index === 1) {
    // House in distance
    const house = new THREE.Mesh(
      new THREE.BoxGeometry(0.6, 0.5, 0.4),
      createToonMaterial(0xffb3ba)
    );
    house.position.set(x, 2.0, -8.4);
    world.scene.add(house);
    
    const roof = new THREE.Mesh(
      new THREE.ConeGeometry(0.4, 0.3, 4),
      createToonMaterial(0x8b4513)
    );
    roof.rotation.y = Math.PI / 4;
    roof.position.set(x, 2.4, -8.4);
    world.scene.add(roof);
  } else {
    // Bushes
    const bush1 = new THREE.Mesh(
      new THREE.SphereGeometry(0.3),
      createToonMaterial(0x32cd32)
    );
    bush1.scale.set(1, 0.7, 1);
    bush1.position.set(x + 0.3, 1.8, -8.4);
    world.scene.add(bush1);
    
    const bush2 = new THREE.Mesh(
      new THREE.SphereGeometry(0.25),
      createToonMaterial(0x3cb371)
    );
    bush2.scale.set(1, 0.7, 1);
    bush2.position.set(x + 0.7, 1.7, -8.4);
    world.scene.add(bush2);
  }
  
  viewGroup.position.set(x, 2.5, 0);
  world.scene.add(viewGroup);
}

/**
 * Adds ceiling beams/trim
 */
function createCeiling(world: World): void {
  const ceilingHeight = 5;
  const beamMaterial = createToonMaterial(0xd2b48c);
  
  // Create a few ceiling beams for visual interest
  const beamPositions = [-4, 0, 4];
  beamPositions.forEach(z => {
    const beam = new THREE.Mesh(
      new THREE.BoxGeometry(15, 0.2, 0.3),
      beamMaterial
    );
    beam.position.set(0, ceilingHeight, z);
    beam.castShadow = true;
    world.scene.add(beam);
  });
}

/**
 * Living area with couch, coffee table, bookshelf, etc.
 */
function addLivingArea(world: World): void {
  const livingGroup = new THREE.Group();
  
  // Couch (scratchable - will be added as entity separately)
  const couchGroup = createCouch();
  couchGroup.position.set(-4, 0, 3);
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
  
  // Coffee table
  const coffeeTable = createCoffeeTable();
  coffeeTable.position.set(-4, 0, 1);
  world.scene.add(coffeeTable);
  
  // Rug under coffee table
  const rug = new THREE.Mesh(
    new THREE.PlaneGeometry(3, 2.5),
    createToonMaterial(0xb22222)
  );
  rug.rotation.x = -Math.PI / 2;
  rug.position.set(-4, 0.01, 1.5);
  world.scene.add(rug);
  
  // Side table with lamp
  const sideTable = createSideTable();
  sideTable.position.set(-6.5, 0, 3);
  world.scene.add(sideTable);
  
  // Lamp on side table
  const lamp = createLamp();
  lamp.position.set(-6.5, 0.7, 3);
  world.scene.add(lamp);
  
  // Bookshelf on left wall
  const bookshelf = createBookshelf();
  bookshelf.position.set(-7, 0, -3);
  world.scene.add(bookshelf);
  
  world.scene.add(livingGroup);
}

/**
 * Dining area with table, chairs, place settings
 */
function addDiningArea(world: World): void {
  // Dining table
  const diningTable = createDiningTable();
  diningTable.position.set(2, 0, -3);
  world.scene.add(diningTable);
  
  // Chairs around table
  const chairPositions = [
    { pos: new THREE.Vector3(0.5, 0, -3), rot: Math.PI / 2 },
    { pos: new THREE.Vector3(3.5, 0, -3), rot: -Math.PI / 2 },
    { pos: new THREE.Vector3(2, 0, -4.2), rot: 0 },
    { pos: new THREE.Vector3(2, 0, -1.8), rot: Math.PI }
  ];
  
  chairPositions.forEach(({ pos, rot }) => {
    const chair = createChair();
    chair.position.copy(pos);
    chair.rotation.y = rot;
    world.scene.add(chair);
  });
  
  // Table centerpiece (vase with flowers)
  const centerpiece = createCenterpiece();
  centerpiece.position.set(2, 1.1, -3);
  world.scene.add(centerpiece);
}

/**
 * Kitchen area with counters, cabinets, appliances
 */
function addKitchenArea(world: World): void {
  // Counter along right wall
  const counter = createCounter();
  counter.position.set(6, 0, 2);
  world.scene.add(counter);
  
  // Upper cabinets
  const upperCabinet = createUpperCabinet();
  upperCabinet.position.set(6, 2.5, 2);
  world.scene.add(upperCabinet);
  
  // Fridge
  const fridge = createFridge();
  fridge.position.set(7, 0, -2);
  world.scene.add(fridge);
  
  // Sink on counter
  const sink = createSink();
  sink.position.set(6.5, 0.95, 2);
  world.scene.add(sink);
  
  // Shelves with jars/items
  const shelf = createKitchenShelf();
  shelf.position.set(7, 1.5, 5);
  world.scene.add(shelf);
}

/**
 * Decorative clutter: boxes, picture frames, plants, toys
 */
function addDecorClusters(world: World): void {
  // Stacked boxes in corner
  const boxStack = createBoxStack();
  boxStack.position.set(6.5, 0, -6);
  world.scene.add(boxStack);
  
  // Picture frames on walls
  addPictureFrames(world);
  
  // Potted plants
  const plant1 = createPottedPlant();
  plant1.position.set(-6.5, 0, -6);
  world.scene.add(plant1);
  
  const plant2 = createPottedPlant();
  plant2.position.set(3, 0, 6);
  world.scene.add(plant2);
  
  // Toy pile
  const toyPile = createToyPile();
  toyPile.position.set(-2, 0, 5.5);
  world.scene.add(toyPile);
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
      book.rotation.y = (Math.random() - 0.5) * 0.2;
      shelfGroup.add(book);
    }
  }
  
  return shelfGroup;
}

function createBook(): THREE.Mesh {
  const colors = [0xff6b6b, 0x4ecdc4, 0x45b7d1, 0xf7dc6f, 0xbb8fce];
  const color = colors[Math.floor(Math.random() * colors.length)];
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
      (Math.random() - 0.5) * 0.1,
      0.15 + Math.random() * 0.1,
      (Math.random() - 0.5) * 0.1
    );
    group.add(flower);
  }
  
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
  const boxColors = [0xff6b6b, 0x4ecdc4, 0xf7dc6f, 0xbb8fce];
  
  for (let i = 0; i < 4; i++) {
    const box = new THREE.Mesh(
      new THREE.BoxGeometry(0.4, 0.4, 0.4),
      createToonMaterial(boxColors[i % boxColors.length])
    );
    box.position.set(
      (Math.random() - 0.5) * 0.1,
      0.2 + i * 0.4,
      (Math.random() - 0.5) * 0.1
    );
    box.rotation.y = (Math.random() - 0.5) * 0.3;
    box.castShadow = true;
    stackGroup.add(box);
  }
  
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
      0.3 + Math.random() * 0.2,
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
      (Math.random() - 0.5) * 0.6,
      0.08 + (i % 3) * 0.12,
      (Math.random() - 0.5) * 0.6
    );
    toy.rotation.set(
      Math.random() * Math.PI,
      Math.random() * Math.PI,
      Math.random() * Math.PI
    );
    toy.castShadow = true;
    toyGroup.add(toy);
  }
  
  return toyGroup;
}

/**
 * Adds interactable items (knockables and scratchables) to the world
 */
export function addInteractables(world: World): void {
  // Dining table items (knockable)
  addDiningTableItems(world);
  
  // Kitchen shelf items (knockable)
  addKitchenShelfItems(world);
  
  // Cat scratching post (scratchable)
  addScratchingPost(world);
  
  // Small plant pot (knockable)
  addKnockablePlant(world);
}

function addDiningTableItems(world: World): void {
  const tableY = 1.15;
  const tableZ = -3;
  
  // Plates
  const platePositions = [
    { x: 1, z: -3.4 },
    { x: 3, z: -3.4 },
    { x: 1, z: -2.6 },
    { x: 3, z: -2.6 }
  ];
  
  platePositions.forEach((pos, index) => {
    const plate = new THREE.Mesh(
      new THREE.CylinderGeometry(0.12, 0.12, 0.02),
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
    world.addEntity(`plate_${index}`, entity);
  });
  
  // Cups
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
    world.addEntity(`cup_${index}`, entity);
  });
  
  // Wine bottles on table
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
    world.addEntity(`bottle_${index}`, entity);
  });
}

function addKitchenShelfItems(world: World): void {
  // A couple small jars on the counter (knockable)
  const jarPositions = [
    { x: 5.5, y: 1.05, z: 1.5 },
    { x: 5.8, y: 1.05, z: 3 }
  ];
  
  jarPositions.forEach((pos, index) => {
    const jar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.08, 0.12),
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
    world.addEntity(`jar_${index}`, entity);
  });
}

function addScratchingPost(world: World): void {
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

function addKnockablePlant(world: World): void {
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
  world.addEntity('plant_pot', entity);
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

