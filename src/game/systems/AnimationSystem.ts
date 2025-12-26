import * as THREE from 'three';

export interface PawAnimation {
  paw: THREE.Group;
  startRotation: THREE.Euler;
  targetRotation: THREE.Euler;
  startPosition: THREE.Vector3;
  targetPosition: THREE.Vector3;
  progress: number;
  duration: number;
  isPlaying: boolean;
  onComplete?: () => void;
}

export class AnimationSystem {
  private animations: PawAnimation[] = [];

  public update(deltaTime: number): void {
    for (let i = this.animations.length - 1; i >= 0; i--) {
      const anim = this.animations[i];
      
      if (!anim.isPlaying) continue;

      anim.progress += deltaTime / anim.duration;

      if (anim.progress >= 1.0) {
        // Animation complete
        anim.progress = 1.0;
        anim.isPlaying = false;
        
        // Set final pose
        anim.paw.rotation.copy(anim.targetRotation);
        anim.paw.position.copy(anim.targetPosition);
        
        // Call completion callback
        if (anim.onComplete) {
          anim.onComplete();
        }
        
        // Remove completed animation
        this.animations.splice(i, 1);
      } else {
        // Interpolate with easing
        const t = this.easeOutCubic(anim.progress);
        
        // Interpolate rotation
        anim.paw.rotation.x = THREE.MathUtils.lerp(anim.startRotation.x, anim.targetRotation.x, t);
        anim.paw.rotation.y = THREE.MathUtils.lerp(anim.startRotation.y, anim.targetRotation.y, t);
        anim.paw.rotation.z = THREE.MathUtils.lerp(anim.startRotation.z, anim.targetRotation.z, t);
        
        // Interpolate position
        anim.paw.position.lerpVectors(anim.startPosition, anim.targetPosition, t);
      }
    }
  }

  public playLeftPawSwipe(paw: THREE.Group, onComplete?: () => void): void {
    // Cancel any existing animation on this paw
    this.cancelPawAnimation(paw);

    const startRotation = paw.rotation.clone();
    const startPosition = paw.position.clone();
    
    // Swipe animation: rotate and extend forward/left
    const targetRotation = new THREE.Euler(
      startRotation.x - Math.PI / 4,  // Swing down
      startRotation.y,
      startRotation.z + Math.PI / 6   // Swing left
    );
    
    const targetPosition = startPosition.clone();
    targetPosition.x += 0.3;  // Extend forward
    targetPosition.y -= 0.1;  // Down slightly
    targetPosition.z -= 0.2;  // Left

    // Forward animation (swipe)
    const swipeAnim: PawAnimation = {
      paw,
      startRotation,
      targetRotation,
      startPosition,
      targetPosition,
      progress: 0,
      duration: 0.15,  // 150ms
      isPlaying: true,
      onComplete: () => {
        // Return animation
        this.playPawReturn(paw, startRotation, startPosition, onComplete);
      }
    };

    this.animations.push(swipeAnim);
  }

  public playRightPawSwipe(paw: THREE.Group, onComplete?: () => void): void {
    // Cancel any existing animation on this paw
    this.cancelPawAnimation(paw);

    const startRotation = paw.rotation.clone();
    const startPosition = paw.position.clone();
    
    // Swipe animation: rotate and extend forward/right
    const targetRotation = new THREE.Euler(
      startRotation.x - Math.PI / 4,  // Swing down
      startRotation.y,
      startRotation.z - Math.PI / 6   // Swing right
    );
    
    const targetPosition = startPosition.clone();
    targetPosition.x += 0.3;  // Extend forward
    targetPosition.y -= 0.1;  // Down slightly
    targetPosition.z += 0.2;  // Right

    // Forward animation (swipe)
    const swipeAnim: PawAnimation = {
      paw,
      startRotation,
      targetRotation,
      startPosition,
      targetPosition,
      progress: 0,
      duration: 0.15,  // 150ms
      isPlaying: true,
      onComplete: () => {
        // Return animation
        this.playPawReturn(paw, startRotation, startPosition, onComplete);
      }
    };

    this.animations.push(swipeAnim);
  }

  private playPawReturn(paw: THREE.Group, originalRotation: THREE.Euler, originalPosition: THREE.Vector3, finalCallback?: () => void): void {
    const startRotation = paw.rotation.clone();
    const startPosition = paw.position.clone();

    const returnAnim: PawAnimation = {
      paw,
      startRotation,
      targetRotation: originalRotation,
      startPosition,
      targetPosition: originalPosition,
      progress: 0,
      duration: 0.1,  // 100ms return
      isPlaying: true,
      onComplete: finalCallback
    };

    this.animations.push(returnAnim);
  }

  private cancelPawAnimation(paw: THREE.Group): void {
    for (let i = this.animations.length - 1; i >= 0; i--) {
      if (this.animations[i].paw === paw) {
        this.animations.splice(i, 1);
      }
    }
  }

  private easeOutCubic(t: number): number {
    return 1 - Math.pow(1 - t, 3);
  }

  public isAnimating(paw: THREE.Group): boolean {
    return this.animations.some(anim => anim.paw === paw && anim.isPlaying);
  }
}

