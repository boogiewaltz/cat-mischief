import * as THREE from 'three';

export class ToonMaterial extends THREE.MeshToonMaterial {
  constructor(color: number | string, options: Partial<THREE.MeshToonMaterialParameters> = {}) {
    // Create a simple 2-step toon gradient
    const gradientMap = ToonMaterial.createGradientTexture(3);
    
    super({
      color,
      gradientMap,
      ...options
    });
  }

  private static createGradientTexture(steps: number): THREE.DataTexture {
    const colors = new Uint8Array(steps);
    
    for (let i = 0; i < steps; i++) {
      colors[i] = Math.floor((i / (steps - 1)) * 255);
    }
    
    const gradientMap = new THREE.DataTexture(colors, steps, 1, THREE.RedFormat);
    gradientMap.needsUpdate = true;
    gradientMap.minFilter = THREE.NearestFilter;
    gradientMap.magFilter = THREE.NearestFilter;
    
    return gradientMap;
  }
}

export function createToonMaterial(color: number | string, options: Partial<THREE.MeshToonMaterialParameters> = {}): THREE.MeshToonMaterial {
  return new ToonMaterial(color, options);
}

