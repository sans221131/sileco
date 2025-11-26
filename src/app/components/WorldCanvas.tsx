"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader";
import gsap from "gsap";

export type Stage = "landing" | "main";

export type WorldCanvasProps = {
  stage: Stage;
};

type ModelConfig = {
  url: string;
  position: [number, number, number];
  scale: number;
};

const MODEL_CONFIGS: ModelConfig[] = [
  {
    url: "/models/can.glb",
    position: [-1.5, 0, -0.3],
    scale: 0.007,
  },
  {
    url: "/models/zom.glb",
    position: [0, 0, 1],
    scale: 0.007,
  },
  {
    url: "/models/bolsa.glb",
    position: [1.5, 0, -0.3],
    scale: 0.007,
  },
];

export default function WorldCanvas({ stage }: WorldCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const modelsRef = useRef<THREE.Group[]>([]);
  const frameIdRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = null;

    const camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.1,
      100
    );
    // Top-down view looking down at models
    camera.position.set(2, 5, .9);
    camera.lookAt(0, 0, 0.2);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: false,
    });
    // Use an off-white background for the canvas so models are easily visible
    renderer.setClearColor(0xf6f6f2, 1);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setSize(window.innerWidth, window.innerHeight);
    rendererRef.current = renderer;

    // Lights
    const ambient = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambient);

    const dir1 = new THREE.DirectionalLight(0xffffff, 1.1);
    dir1.position.set(5, 8, 5);
    scene.add(dir1);

    const dir2 = new THREE.DirectionalLight(0xffffff, 0.6);
    dir2.position.set(-4, -6, -3);
    scene.add(dir2);

    // Subtle light fog to blend models with off-white background
    scene.fog = new THREE.FogExp2(0xf6f6f2, 0.02);

    // Load models
    const loader = new GLTFLoader();

    // Setup DRACO loader for compressed models (required if GLBs use Draco)
    let dracoLoader: DRACOLoader | null = null;
    try {
      dracoLoader = new DRACOLoader();
      // Use Google's public Draco decoder CDN (works in browser builds)
      dracoLoader.setDecoderPath("https://www.gstatic.com/draco/v1/decoders/");
      loader.setDRACOLoader(dracoLoader);
    } catch (e) {
      // If DRACOLoader isn't available or fails, continue without it and let loader errors surface
      console.warn("DRACOLoader not available or failed to initialize:", e);
      dracoLoader = null;
    }
    const loadedGroups: THREE.Group[] = [];

    MODEL_CONFIGS.forEach((config, index) => {
      loader.load(
        config.url,
        (gltf: any) => {
          const model = gltf.scene;
          model.position.set(...config.position);
          // Smaller scale so all four models fit in center view
          model.scale.setScalar(config.scale);
          model.rotation.y = Math.random() * Math.PI * 2;

          // Override all materials to white with dark details
          model.traverse((child: THREE.Object3D) => {
            const mesh = child as THREE.Mesh;
            if (mesh.isMesh && mesh.material) {
              const oldMat = mesh.material as THREE.Material;
              // Check if material name suggests it's text/details (common GLB naming)
              const isDetail = oldMat.name && (
                oldMat.name.toLowerCase().includes('text') ||
                oldMat.name.toLowerCase().includes('label') ||
                oldMat.name.toLowerCase().includes('detail') ||
                oldMat.name.toLowerCase().includes('line')
              );
              
              mesh.material = new THREE.MeshStandardMaterial({
                color: isDetail ? 0x000000 : 0xffffff,
                roughness: 0.7,
                metalness: 0.1,
              });
            }
          });

          // Orient the model so its top (+Y) faces the camera on load
          if (cameraRef.current) {
            const dirToCamera = cameraRef.current.position.clone().sub(model.position).normalize();
            // rotate model so its local +Y (top) points toward the camera
            const up = new THREE.Vector3(0, 1, 0);
            const quat = new THREE.Quaternion().setFromUnitVectors(up, dirToCamera);
            model.quaternion.copy(quat);

            // Per-model small corrective yaw so top-details (like the can's tab) face the camera
            if (config.url && config.url.toLowerCase().includes("can")) {
              // tweak this angle if necessary (positive/negative 90deg)
              model.rotateY(-Math.PI / 2);
            }
          } else {
            // fallback: keep upright with no yaw
            model.rotation.set(0, 0, 0);
            if (config.url && config.url.toLowerCase().includes("can")) {
              model.rotation.y = -Math.PI / 2;
            }
          }

          scene.add(model);
          loadedGroups.push(model);
          modelsRef.current = loadedGroups;

          const baseY = config.position[1];
          const floatOffset = 0.15 + Math.random() * 0.1;

          // Float
          gsap.to(model.position, {
            y: baseY + floatOffset,
            duration: 2.2 + Math.random(),
            yoyo: true,
            repeat: -1,
            ease: "sine.inOut",
            delay: index * 0.25,
          });

          // (rotation animation removed — models stay oriented toward camera)
        },
        undefined,
        (error: any) => {
          console.error("Error loading GLB:", config.url, error);
        }
      );
    });

    const handleResize = () => {
      if (!cameraRef.current || !rendererRef.current) return;
      const w = window.innerWidth;
      const h = window.innerHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };

    window.addEventListener("resize", handleResize);

    const renderLoop = () => {
      if (!rendererRef.current || !sceneRef.current || !cameraRef.current) return;
      frameIdRef.current = requestAnimationFrame(renderLoop);
      rendererRef.current.render(sceneRef.current, cameraRef.current);
    };

    renderLoop();

    return () => {
      window.removeEventListener("resize", handleResize);
      if (frameIdRef.current !== null) cancelAnimationFrame(frameIdRef.current);

      if (renderer) {
        renderer.dispose();
      }

      scene.traverse((obj: THREE.Object3D) => {
        const mesh = obj as THREE.Mesh;
        if (mesh.geometry) {
          mesh.geometry.dispose();
        }
        const mat = mesh.material as THREE.Material | THREE.Material[] | undefined;
        if (Array.isArray(mat)) {
          mat.forEach((m) => m.dispose && m.dispose());
        } else if (mat && mat.dispose) {
          mat.dispose();
        }
      });

      // Dispose DRACO loader if created
      if (dracoLoader) {
        try {
          dracoLoader.dispose();
        } catch (e) {
          // ignore disposal errors
        }
      }
    };
  }, []);

  // React to stage change
  useEffect(() => {
    const camera = cameraRef.current;
    const models = modelsRef.current;
    if (!camera) return;

    if (stage === "landing") {
      // Back to angled perspective view
      gsap.to(camera.position, {
        x: 0,
        y: 2.8,
        z: 2.2,
        duration: 1.2,
        ease: "power3.inOut",
        onUpdate: () => {
          camera.lookAt(0, 0.2, 0);
        },
      });
    } else if (stage === "main") {
      // Front view - closer to see the smaller models
      const targetPos = { x: 0, y: 1.2, z: 3.5 };

      gsap.to(camera.position, {
        ...targetPos,
        duration: 1.4,
        ease: "power3.inOut",
        onUpdate: () => {
          camera.lookAt(0, 0.3, 0);
        },
      });

      // Make models more front-facing
      models.forEach((model, idx) => {
        gsap.to(model.rotation, {
          x: 0,
          z: 0,
          duration: 1.2,
          ease: "power3.out",
          delay: 0.1 * idx,
        });
      });
    }
  }, [stage]);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-0"
    />
  );
}
