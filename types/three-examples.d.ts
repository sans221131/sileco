declare module 'three/examples/jsm/loaders/GLTFLoader' {
  import { Loader } from 'three';
  export class GLTFLoader extends Loader {
    load(url: string, onLoad?: (gltf: any) => void, onProgress?: (event: any) => void, onError?: (event: any) => void): void;
    parse: any;
    setDRACOLoader(dracoLoader: any): void;
  }
  export interface GLTF {
    scene: any;
    scenes?: any[];
    animations?: any[];
  }
}

declare module 'three/examples/jsm/loaders/DRACOLoader' {
  import { Loader } from 'three';
  export class DRACOLoader extends Loader {
    constructor();
    setDecoderPath(path: string): void;
    dispose(): void;
  }
}
