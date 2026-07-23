import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { useSimsStore } from '../../store/useSimsStore';
import type { FloorTextureId } from '../../types/sims';

const FLOOR_COLORS_3D: Record<FloorTextureId, number> = {
  wood: 0x78350f,
  marble: 0xf1f5f9,
  tile: 0x475569,
  slate: 0x0f172a,
  grass: 0x047857,
  dirt: 0x451a03,
  custom: 0x0ea5e9,
};

export function Viewport3D() {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const textureCacheRef = useRef<Map<string, THREE.Texture>>(new Map());

  const { terrain, walls, floors, doorsWindows, items, wallViewMode } = useSimsStore();

  const getThreeTexture = (url?: string): THREE.Texture | null => {
    if (!url) return null;
    let tex = textureCacheRef.current.get(url);
    if (!tex) {
      const loader = new THREE.TextureLoader();
      tex = loader.load(url);
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(2, 2);
      textureCacheRef.current.set(url, tex);
    }
    return tex;
  };

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0f172a);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    const terrainWidth = terrain.width;
    const terrainLength = terrain.length;
    camera.position.set(terrainWidth * 0.8, Math.max(terrainWidth, terrainLength) * 0.9, terrainLength * 1.2);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(terrainWidth / 2, 0, terrainLength / 2);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2 - 0.02;

    // ILUMINAÇÃO
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight.position.set(terrainWidth * 1.2, 40, terrainLength * 1.2);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 150;
    dirLight.shadow.camera.left = -terrainWidth * 1.5;
    dirLight.shadow.camera.right = terrainWidth * 1.5;
    dirLight.shadow.camera.top = terrainLength * 1.5;
    dirLight.shadow.camera.bottom = -terrainLength * 1.5;
    scene.add(dirLight);

    // TERRENO BASE 3D
    const terrainGeo = new THREE.PlaneGeometry(terrainWidth, terrainLength);
    let terrainMat: THREE.Material;

    const terrainTex = getThreeTexture(terrain.customTextureUrl);
    if (terrainTex) {
      terrainMat = new THREE.MeshStandardMaterial({ map: terrainTex, color: 0xffffff, roughness: 0.8 });
    } else if (terrain.customColor) {
      terrainMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(terrain.customColor), roughness: 0.8 });
    } else {
      const themeColors: Record<string, number> = {
        grass: 0x15803d,
        blueprint: 0x0d3663,
        dark: 0x0f172a,
        concrete: 0xe2e8f0,
      };
      terrainMat = new THREE.MeshStandardMaterial({
        color: themeColors[terrain.theme] || 0x15803d,
        roughness: 0.8,
      });
    }

    const terrainMesh = new THREE.Mesh(terrainGeo, terrainMat);
    terrainMesh.rotation.x = -Math.PI / 2;
    terrainMesh.position.set(terrainWidth / 2, 0, terrainLength / 2);
    terrainMesh.receiveShadow = true;
    scene.add(terrainMesh);

    // PISOS PINTADOS 3D
    const floorTileGeo = new THREE.PlaneGeometry(1, 1);
    Object.values(floors).forEach((floor) => {
      let floorMat: THREE.Material;
      const floorTex = getThreeTexture(floor.customTextureUrl);
      if (floorTex) {
        floorMat = new THREE.MeshStandardMaterial({ map: floorTex, color: 0xffffff, roughness: 0.5 });
      } else if (floor.color) {
        floorMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(floor.color), roughness: 0.5 });
      } else {
        const colorHex = FLOOR_COLORS_3D[floor.textureId] || FLOOR_COLORS_3D.wood;
        floorMat = new THREE.MeshStandardMaterial({ color: colorHex, roughness: 0.5 });
      }

      const tileMesh = new THREE.Mesh(floorTileGeo, floorMat);
      tileMesh.rotation.x = -Math.PI / 2;
      tileMesh.position.set(floor.x + 0.5, 0.01, floor.y + 0.5);
      tileMesh.receiveShadow = true;
      scene.add(tileMesh);
    });

    // PAREDES 3D DUAL-FACE COM ALTURA DINÂMICA E ESQUADRIAS
    const wallHeight = wallViewMode === 'full' ? 2.8 : wallViewMode === 'half' ? 1.4 : 0.2;
    const isTransparent = wallViewMode === 'half';

    walls.forEach((wall) => {
      const dx = wall.x2 - wall.x1;
      const dy = wall.y2 - wall.y1;
      const len = Math.hypot(dx, dy);
      if (len === 0) return;

      const angle = Math.atan2(dy, dx);
      const midX = (wall.x1 + wall.x2) / 2;
      const midY = (wall.y1 + wall.y2) / 2;
      const thickness = wall.thickness || 0.2;

      // Materiais das 6 faces da parede
      const sideATex = getThreeTexture(wall.textureUrlSideA || wall.textureUrl);
      const sideBTex = getThreeTexture(wall.textureUrlSideB || wall.textureUrl);

      const matA = sideATex
        ? new THREE.MeshStandardMaterial({ map: sideATex, color: 0xffffff, transparent: isTransparent, opacity: isTransparent ? 0.75 : 1 })
        : new THREE.MeshStandardMaterial({ color: new THREE.Color(wall.colorSideA || wall.color || '#E2E8F0'), transparent: isTransparent, opacity: isTransparent ? 0.75 : 1 });

      const matB = sideBTex
        ? new THREE.MeshStandardMaterial({ map: sideBTex, color: 0xffffff, transparent: isTransparent, opacity: isTransparent ? 0.75 : 1 })
        : new THREE.MeshStandardMaterial({ color: new THREE.Color(wall.colorSideB || wall.color || '#CBD5E1'), transparent: isTransparent, opacity: isTransparent ? 0.75 : 1 });

      const capMat = new THREE.MeshStandardMaterial({ color: 0x475569, transparent: isTransparent, opacity: isTransparent ? 0.75 : 1 });

      const materials = [capMat, capMat, capMat, capMat, matA, matB];

      const wallGeo = new THREE.BoxGeometry(thickness, wallHeight, len);
      const wallMesh = new THREE.Mesh(wallGeo, materials);
      wallMesh.position.set(midX, wallHeight / 2, midY);
      wallMesh.rotation.y = -angle + Math.PI / 2;
      wallMesh.castShadow = true;
      wallMesh.receiveShadow = true;
      scene.add(wallMesh);
    });

    // ESQUADRIAS 3D (PORTAS E JANELAS)
    doorsWindows.forEach((dw) => {
      const wall = walls.find((w) => w.id === dw.wallId);
      if (!wall) return;

      const angle = Math.atan2(wall.y2 - wall.y1, wall.x2 - wall.x1);
      const dwX = wall.x1 + (wall.x2 - wall.x1) * dw.offsetRatio;
      const dwY = wall.y1 + (wall.y2 - wall.y1) * dw.offsetRatio;
      const dwWidth = dw.width;
      const dwHeight = dw.height || (dw.type === 'door' ? 2.1 : 1.2);
      const frameColor = dw.frameColor || (dw.type === 'door' ? '#F59E0B' : '#38BDF8');

      const dwGroup = new THREE.Group();
      dwGroup.position.set(dwX, dw.type === 'door' ? dwHeight / 2 : 1.2, dwY);
      dwGroup.rotation.y = -angle;

      const frameMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(frameColor), roughness: 0.4 });
      const frameGeo = new THREE.BoxGeometry(dwWidth, dwHeight, 0.22);
      const frameMesh = new THREE.Mesh(frameGeo, frameMat);
      frameMesh.castShadow = true;
      dwGroup.add(frameMesh);

      if (dw.type === 'window') {
        const glassMat = new THREE.MeshPhysicalMaterial({
          color: 0x38bdf8,
          transmission: 0.85,
          opacity: 1,
          transparent: true,
          roughness: 0.1,
          ior: 1.5,
        });
        const glassGeo = new THREE.BoxGeometry(dwWidth * 0.85, dwHeight * 0.75, 0.05);
        const glassMesh = new THREE.Mesh(glassGeo, glassMat);
        dwGroup.add(glassMesh);
      }

      scene.add(dwGroup);
    });

    // FASE 3: MÓVEIS COLOCADOS EM 3D (`items`)
    items.forEach((item) => {
      const furnGroup = new THREE.Group();
      furnGroup.position.set(item.x, item.height / 2, item.y);
      furnGroup.rotation.y = (-item.rotation * Math.PI) / 180;

      let furnMat: THREE.Material;
      const furnTex = getThreeTexture(item.textureUrl);
      if (furnTex) {
        furnMat = new THREE.MeshStandardMaterial({ map: furnTex, color: 0xffffff, roughness: 0.4 });
      } else {
        furnMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(item.color), roughness: 0.4 });
      }

      if (item.primitiveShape === 'cylinder') {
        const cylinderGeo = new THREE.CylinderGeometry(item.width / 2, item.width / 2, item.height, 24);
        const cylinderMesh = new THREE.Mesh(cylinderGeo, furnMat);
        cylinderMesh.castShadow = true;
        cylinderMesh.receiveShadow = true;
        furnGroup.add(cylinderMesh);

        // Detalhe 3D extra se for árvore/planta
        if (item.category === 'outdoor' || item.catalogId.includes('plant')) {
          const canopyMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.6 });
          const canopyGeo = new THREE.SphereGeometry(item.width * 0.6, 16, 16);
          const canopyMesh = new THREE.Mesh(canopyGeo, canopyMat);
          canopyMesh.position.set(0, item.height * 0.5, 0);
          canopyMesh.castShadow = true;
          furnGroup.add(canopyMesh);
        }
      } else {
        const boxGeo = new THREE.BoxGeometry(item.width, item.height, item.depth);
        const boxMesh = new THREE.Mesh(boxGeo, furnMat);
        boxMesh.castShadow = true;
        boxMesh.receiveShadow = true;
        furnGroup.add(boxMesh);

        // Detalhes 3D extras para móveis específicos
        if (item.category === 'bedroom' || item.catalogId.includes('bed')) {
          // Travesseiros 3D
          const pillowMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 });
          const pillowGeo = new THREE.BoxGeometry(item.width * 0.38, 0.12, item.depth * 0.22);

          const pillow1 = new THREE.Mesh(pillowGeo, pillowMat);
          pillow1.position.set(-item.width * 0.22, item.height / 2 + 0.06, -item.depth * 0.32);
          pillow1.castShadow = true;
          furnGroup.add(pillow1);

          const pillow2 = new THREE.Mesh(pillowGeo, pillowMat);
          pillow2.position.set(item.width * 0.22, item.height / 2 + 0.06, -item.depth * 0.32);
          pillow2.castShadow = true;
          furnGroup.add(pillow2);
        } else if (item.catalogId.includes('tv_unit')) {
          // Tela de TV 3D
          const tvMat = new THREE.MeshStandardMaterial({ color: 0x050505, roughness: 0.1, metalness: 0.8 });
          const tvGeo = new THREE.BoxGeometry(item.width * 0.8, 0.7, 0.06);
          const tvMesh = new THREE.Mesh(tvGeo, tvMat);
          tvMesh.position.set(0, item.height / 2 + 0.4, 0);
          tvMesh.castShadow = true;
          furnGroup.add(tvMesh);
        }
      }

      scene.add(furnGroup);
    });

    // LOOP DE ANIMAÇÃO
    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      controls.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [terrain, walls, floors, doorsWindows, items, wallViewMode]);

  return <div ref={mountRef} className="w-full h-full block bg-slate-950" />;
}
