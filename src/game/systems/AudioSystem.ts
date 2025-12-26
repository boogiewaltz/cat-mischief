import * as THREE from 'three';

export class AudioSystem {
  private listener: THREE.AudioListener;
  private audioLoader: THREE.AudioLoader;
  private sounds: Map<string, THREE.Audio> = new Map();

  constructor() {
    this.listener = new THREE.AudioListener();
    this.audioLoader = new THREE.AudioLoader();
  }

  public update(_deltaTime: number): void {
    // Audio system updates
  }

  public playSound(soundId: string): void {
    const sound = this.sounds.get(soundId);
    if (sound && !sound.isPlaying) {
      sound.play();
    }
  }

  public loadSound(soundId: string, url: string): void {
    const sound = new THREE.Audio(this.listener);
    this.audioLoader.load(url, (buffer) => {
      sound.setBuffer(buffer);
      sound.setVolume(0.5);
    });
    this.sounds.set(soundId, sound);
  }
}

