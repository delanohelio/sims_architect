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
  const keysPressedRef = useRef<Record<string, boolean>>({});

  const { terrain, walls, floors, doorsWindows, items, wallViewMode } = useSimsStore();

  const failedTexturesRef = useRef<Set<string>>(new Set());

  const getThreeTexture = (url?: string, repeatX = 1, repeatY = 1): THREE.Texture | null => {
    if (!url || failedTexturesRef.current.has(url)) return null;
    const cacheKey = `${url}__${repeatX}x${repeatY}`;
    let tex = textureCacheRef.current.get(cacheKey);
    if (!tex) {
      const loader = new THREE.TextureLoader();
      tex = loader.load(
        url,
        undefined,
        undefined,
        () => {
          failedTexturesRef.current.add(url);
          textureCacheRef.current.delete(cacheKey);
        }
      );
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(repeatX, repeatY);
      tex.colorSpace = THREE.SRGBColorSpace;
      textureCacheRef.current.set(cacheKey, tex);
    }
    return tex;
  };

  // Keyboard listeners for 3D navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) return;
      keysPressedRef.current[e.code] = true;
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      delete keysPressedRef.current[e.code];
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    const scene = new THREE.Scene();

    // Gradient sky background
    scene.background = new THREE.Color(0x1a1a2e);
    scene.fog = new THREE.FogExp2(0x1a1a2e, 0.012);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    const terrainWidth = terrain.width;
    const terrainLength = terrain.length;
    camera.position.set(terrainWidth * 0.8, Math.max(terrainWidth, terrainLength) * 0.9, terrainLength * 1.2);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;

    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(terrainWidth / 2, 0, terrainLength / 2);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2 - 0.02;

    // ILUMINAÇÃO APRIMORADA
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    // Hemisfério para iluminação natural céu/chão
    const hemiLight = new THREE.HemisphereLight(0x87ceeb, 0x362a1e, 0.4);
    scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xfff5e1, 1.4);
    dirLight.position.set(terrainWidth * 1.5, 50, terrainLength * 0.8);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 200;
    dirLight.shadow.camera.left = -terrainWidth * 2;
    dirLight.shadow.camera.right = terrainWidth * 2;
    dirLight.shadow.camera.top = terrainLength * 2;
    dirLight.shadow.camera.bottom = -terrainLength * 2;
    dirLight.shadow.bias = -0.001;
    scene.add(dirLight);

    // Fill light suave do outro lado
    const fillLight = new THREE.DirectionalLight(0xb4d0ff, 0.3);
    fillLight.position.set(-terrainWidth, 20, -terrainLength);
    scene.add(fillLight);

    // TERRENO BASE 3D
    const terrainGeo = new THREE.PlaneGeometry(terrainWidth, terrainLength);
    let terrainMat: THREE.Material;

    const terrainTex = getThreeTexture(terrain.customTextureUrl, 4, 4);
    if (terrainTex) {
      terrainMat = new THREE.MeshStandardMaterial({ map: terrainTex, color: 0xffffff, roughness: 0.85 });
    } else {
      const primaryColor = terrain.customColor || (
        terrain.theme === 'grass' ? '#15803D' :
        terrain.theme === 'blueprint' ? '#0D3663' :
        terrain.theme === 'dark' ? '#0F172A' : '#E2E8F0'
      );
      const secondaryColor = terrain.customSecondaryColor || (
        (!terrain.customColor && terrain.theme === 'grass') ? '#166534' : undefined
      );

      if (secondaryColor) {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d')!;
        ctx.fillStyle = primaryColor;
        ctx.fillRect(0, 0, 64, 64);
        ctx.fillStyle = secondaryColor;
        ctx.fillRect(0, 0, 32, 32);
        ctx.fillRect(32, 32, 32, 32);

        const checkerTex = new THREE.CanvasTexture(canvas);
        checkerTex.magFilter = THREE.NearestFilter;
        checkerTex.minFilter = THREE.NearestFilter;
        checkerTex.wrapS = THREE.RepeatWrapping;
        checkerTex.wrapT = THREE.RepeatWrapping;
        checkerTex.repeat.set(terrainWidth, terrainLength);

        terrainMat = new THREE.MeshStandardMaterial({ map: checkerTex, roughness: 0.85 });
      } else {
        terrainMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(primaryColor), roughness: 0.85 });
      }
    }

    const terrainMesh = new THREE.Mesh(terrainGeo, terrainMat);
    terrainMesh.rotation.x = -Math.PI / 2;
    terrainMesh.position.set(terrainWidth / 2, 0, terrainLength / 2);
    terrainMesh.receiveShadow = true;
    scene.add(terrainMesh);

    // Plano de chão infinito (para sombras se estenderem)
    const groundGeo = new THREE.PlaneGeometry(200, 200);
    const groundMat = new THREE.ShadowMaterial({ opacity: 0.15 });
    const groundMesh = new THREE.Mesh(groundGeo, groundMat);
    groundMesh.rotation.x = -Math.PI / 2;
    groundMesh.position.set(terrainWidth / 2, -0.01, terrainLength / 2);
    groundMesh.receiveShadow = true;
    scene.add(groundMesh);

    // PISOS PINTADOS 3D
    const floorTileGeo = new THREE.PlaneGeometry(1, 1);
    Object.values(floors).forEach((floor) => {
      let floorMat: THREE.Material;
      const floorTex = getThreeTexture(floor.customTextureUrl);
      if (floorTex) {
        floorMat = new THREE.MeshStandardMaterial({ map: floorTex, color: 0xffffff, roughness: 0.4, metalness: 0.05 });
      } else if (floor.color) {
        floorMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(floor.color), roughness: 0.4, metalness: 0.05 });
      } else {
        const colorHex = FLOOR_COLORS_3D[floor.textureId] || FLOOR_COLORS_3D.wood;
        floorMat = new THREE.MeshStandardMaterial({ color: colorHex, roughness: 0.4, metalness: 0.05 });
      }

      const tileMesh = new THREE.Mesh(floorTileGeo, floorMat);
      tileMesh.rotation.x = -Math.PI / 2;
      tileMesh.position.set(floor.x + 0.5, 0.01, floor.y + 0.5);
      tileMesh.receiveShadow = true;
      scene.add(tileMesh);
    });

    // PAREDES 3D DUAL-FACE COM ALTURA DINÂMICA
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

      const sideATex = getThreeTexture(wall.textureUrlSideA || wall.textureUrl);
      const sideBTex = getThreeTexture(wall.textureUrlSideB || wall.textureUrl);

      const matA = sideATex
        ? new THREE.MeshStandardMaterial({ map: sideATex, color: 0xffffff, transparent: isTransparent, opacity: isTransparent ? 0.75 : 1, roughness: 0.6 })
        : new THREE.MeshStandardMaterial({ color: new THREE.Color(wall.colorSideA || wall.color || '#E2E8F0'), transparent: isTransparent, opacity: isTransparent ? 0.75 : 1, roughness: 0.6 });

      const matB = sideBTex
        ? new THREE.MeshStandardMaterial({ map: sideBTex, color: 0xffffff, transparent: isTransparent, opacity: isTransparent ? 0.75 : 1, roughness: 0.6 })
        : new THREE.MeshStandardMaterial({ color: new THREE.Color(wall.colorSideB || wall.color || '#CBD5E1'), transparent: isTransparent, opacity: isTransparent ? 0.75 : 1, roughness: 0.6 });

      const capMat = new THREE.MeshStandardMaterial({ color: 0x475569, transparent: isTransparent, opacity: isTransparent ? 0.75 : 1, roughness: 0.5 });

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

      const frameMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(frameColor), roughness: 0.3, metalness: 0.2 });
      const frameGeo = new THREE.BoxGeometry(dwWidth, dwHeight, 0.22);
      const frameMesh = new THREE.Mesh(frameGeo, frameMat);
      frameMesh.castShadow = true;
      dwGroup.add(frameMesh);

      if (dw.isSliding || dw.catalogId === 'door_sliding') {
        const glassMat = new THREE.MeshPhysicalMaterial({
          color: 0x87ceeb,
          transmission: 0.85,
          opacity: 0.9,
          transparent: true,
          roughness: 0.1,
          ior: 1.5,
          thickness: 0.02,
        });
        const panelGeo = new THREE.BoxGeometry(dwWidth * 0.48, dwHeight * 0.88, 0.04);

        const panel1 = new THREE.Mesh(panelGeo, glassMat);
        panel1.position.set(-dwWidth * 0.22, 0, -0.04);
        dwGroup.add(panel1);

        const panel2 = new THREE.Mesh(panelGeo, glassMat);
        panel2.position.set(dwWidth * 0.22, 0, 0.04);
        dwGroup.add(panel2);
      } else if (dw.type === 'window') {
        const glassMat = new THREE.MeshPhysicalMaterial({
          color: 0x87ceeb,
          transmission: 0.9,
          opacity: 1,
          transparent: true,
          roughness: 0.05,
          ior: 1.5,
          thickness: 0.02,
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

      // Textura com repeat ajustado ao tamanho do móvel
      const furnTex = getThreeTexture(item.textureUrl, 1, 1);

      let furnMat: THREE.MeshStandardMaterial;
      if (furnTex) {
        furnMat = new THREE.MeshStandardMaterial({
          map: furnTex,
          color: 0xffffff,
          roughness: 0.5,
          metalness: 0.05,
        });
      } else {
        furnMat = new THREE.MeshStandardMaterial({
          color: new THREE.Color(item.color),
          roughness: 0.5,
          metalness: 0.05,
        });
      }

      if (item.primitiveShape === 'cylinder') {
        const cylinderGeo = new THREE.CylinderGeometry(item.width / 2, item.width / 2, item.height, 32);
        const cylinderMesh = new THREE.Mesh(cylinderGeo, furnMat);
        cylinderMesh.castShadow = true;
        cylinderMesh.receiveShadow = true;
        furnGroup.add(cylinderMesh);

        // Detalhe 3D extra se for árvore/planta
        if (item.category === 'outdoor' || item.catalogId.includes('plant')) {
          const canopyMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.7 });
          const canopyGeo = new THREE.SphereGeometry(item.width * 0.7, 16, 16);
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
        if (item.catalogId.includes('bed')) {
          // Travesseiros 3D
          const pillowMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.3 });
          const pillowGeo = new THREE.BoxGeometry(item.width * 0.38, 0.12, item.depth * 0.22);

          const pillow1 = new THREE.Mesh(pillowGeo, pillowMat);
          pillow1.position.set(-item.width * 0.22, item.height / 2 + 0.06, -item.depth * 0.32);
          pillow1.castShadow = true;
          furnGroup.add(pillow1);

          const pillow2 = new THREE.Mesh(pillowGeo, pillowMat);
          pillow2.position.set(item.width * 0.22, item.height / 2 + 0.06, -item.depth * 0.32);
          pillow2.castShadow = true;
          furnGroup.add(pillow2);

          // Lençol/Cobertor
          const blanketMat = new THREE.MeshStandardMaterial({ color: 0xdbeafe, roughness: 0.6 });
          const blanketGeo = new THREE.BoxGeometry(item.width * 0.95, 0.05, item.depth * 0.6);
          const blanketMesh = new THREE.Mesh(blanketGeo, blanketMat);
          blanketMesh.position.set(0, item.height / 2 + 0.03, item.depth * 0.1);
          furnGroup.add(blanketMesh);
        } else if (item.catalogId.includes('sofa') || item.catalogId.includes('armchair')) {
          // Almofadas do sofá
          const cushionMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.4 });
          const cushionGeo = new THREE.BoxGeometry(item.width * 0.25, 0.15, item.depth * 0.3);
          const c1 = new THREE.Mesh(cushionGeo, cushionMat);
          c1.position.set(-item.width * 0.3, item.height / 2 + 0.08, -item.depth * 0.2);
          c1.castShadow = true;
          furnGroup.add(c1);
          const c2 = new THREE.Mesh(cushionGeo, cushionMat);
          c2.position.set(item.width * 0.3, item.height / 2 + 0.08, -item.depth * 0.2);
          c2.castShadow = true;
          furnGroup.add(c2);
        } else if (item.catalogId.includes('tv_unit')) {
          // Tela de TV 3D
          const tvMat = new THREE.MeshStandardMaterial({ color: 0x050505, roughness: 0.05, metalness: 0.9 });
          const tvGeo = new THREE.BoxGeometry(item.width * 0.8, 0.7, 0.06);
          const tvMesh = new THREE.Mesh(tvGeo, tvMat);
          tvMesh.position.set(0, item.height / 2 + 0.4, 0);
          tvMesh.castShadow = true;
          furnGroup.add(tvMesh);

          // Borda da TV
          const bezelMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.3, metalness: 0.5 });
          const bezelGeo = new THREE.BoxGeometry(item.width * 0.84, 0.74, 0.04);
          const bezelMesh = new THREE.Mesh(bezelGeo, bezelMat);
          bezelMesh.position.set(0, item.height / 2 + 0.4, -0.02);
          furnGroup.add(bezelMesh);
        } else if (item.catalogId.includes('fridge')) {
          // Puxadores da geladeira
          const handleMat = new THREE.MeshStandardMaterial({ color: 0xc0c0c0, roughness: 0.2, metalness: 0.8 });
          const handleGeo = new THREE.CylinderGeometry(0.02, 0.02, item.height * 0.3, 8);
          const h1 = new THREE.Mesh(handleGeo, handleMat);
          h1.position.set(item.width * 0.35, item.height * 0.15, item.depth / 2 + 0.03);
          h1.rotation.x = Math.PI / 2;
          furnGroup.add(h1);
          const h2 = new THREE.Mesh(handleGeo, handleMat);
          h2.position.set(item.width * 0.35, -item.height * 0.15, item.depth / 2 + 0.03);
          h2.rotation.x = Math.PI / 2;
          furnGroup.add(h2);
        } else if (item.catalogId.includes('dining_table') || item.catalogId.includes('coffee_table')) {
          // Pernas da mesa
          const legMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.5, metalness: 0.1 });
          const legGeo = new THREE.CylinderGeometry(0.04, 0.04, item.height * 0.85, 8);
          const positions = [
            [-item.width * 0.42, -item.height * 0.08, -item.depth * 0.38],
            [item.width * 0.42, -item.height * 0.08, -item.depth * 0.38],
            [-item.width * 0.42, -item.height * 0.08, item.depth * 0.38],
            [item.width * 0.42, -item.height * 0.08, item.depth * 0.38],
          ];
          positions.forEach(([lx, ly, lz]) => {
            const leg = new THREE.Mesh(legGeo, legMat);
            leg.position.set(lx, ly, lz);
            leg.castShadow = true;
            furnGroup.add(leg);
          });
        }
      }

      scene.add(furnGroup);
    });

    // LOOP DE ANIMAÇÃO COM SUPORTE COMPLETO A TECLADO 3D (WASD/Setas, Q/E, Z/C, X)
    let animationFrameId: number;
    const panSpeed3D = 0.35;
    const rotSpeed3D = 0.035; // radianos por frame para Q/E
    const zoomSpeed3D = 0.5; // unidades por frame para Z/C

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const keys = keysPressedRef.current;

      // Vetores de direção horizontal
      const forward = new THREE.Vector3();
      camera.getWorldDirection(forward);
      const forwardHorizontal = forward.clone();
      forwardHorizontal.y = 0;
      forwardHorizontal.normalize();

      const right = new THREE.Vector3();
      right.crossVectors(forwardHorizontal, camera.up).normalize();

      let moved = false;

      // WASD / Setas: Movimentação (Strafe/Pan)
      if (keys['KeyW'] || keys['ArrowUp']) {
        camera.position.addScaledVector(forwardHorizontal, panSpeed3D);
        controls.target.addScaledVector(forwardHorizontal, panSpeed3D);
        moved = true;
      }
      if (keys['KeyS'] || keys['ArrowDown']) {
        camera.position.addScaledVector(forwardHorizontal, -panSpeed3D);
        controls.target.addScaledVector(forwardHorizontal, -panSpeed3D);
        moved = true;
      }
      if (keys['KeyA'] || keys['ArrowLeft']) {
        camera.position.addScaledVector(right, -panSpeed3D);
        controls.target.addScaledVector(right, -panSpeed3D);
        moved = true;
      }
      if (keys['KeyD'] || keys['ArrowRight']) {
        camera.position.addScaledVector(right, panSpeed3D);
        controls.target.addScaledVector(right, panSpeed3D);
        moved = true;
      }

      // Q / E: Rotação Orbital Horizontal da Câmera em volta do Alvo
      if (keys['KeyQ']) {
        const offset = new THREE.Vector3().subVectors(camera.position, controls.target);
        offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), rotSpeed3D);
        camera.position.addVectors(controls.target, offset);
        moved = true;
      }
      if (keys['KeyE']) {
        const offset = new THREE.Vector3().subVectors(camera.position, controls.target);
        offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), -rotSpeed3D);
        camera.position.addVectors(controls.target, offset);
        moved = true;
      }

      // F / V: Rotação Orbital Vertical da Câmera (F = Inclinar para Cima / V = Inclinar para Baixo)
      if (keys['KeyF']) {
        const offset = new THREE.Vector3().subVectors(camera.position, controls.target);
        const pitchAxis = new THREE.Vector3().crossVectors(offset, camera.up).normalize();
        offset.applyAxisAngle(pitchAxis, -rotSpeed3D);
        // Garantir que a câmera não atravesse o chão
        if (controls.target.y + offset.y > 0.5) {
          camera.position.addVectors(controls.target, offset);
          moved = true;
        }
      }
      if (keys['KeyV']) {
        const offset = new THREE.Vector3().subVectors(camera.position, controls.target);
        const pitchAxis = new THREE.Vector3().crossVectors(offset, camera.up).normalize();
        offset.applyAxisAngle(pitchAxis, rotSpeed3D);
        // Evitar ângulo menor que o limite superior
        const dist = offset.length();
        if (offset.y / dist < 0.98) {
          camera.position.addVectors(controls.target, offset);
          moved = true;
        }
      }

      // Z / C: Zoom In / Zoom Out (Dolly em direção ou afastando do Alvo)
      if (keys['KeyZ']) {
        const toTarget = new THREE.Vector3().subVectors(controls.target, camera.position);
        const distance = toTarget.length();
        if (distance > 2.5) {
          toTarget.normalize();
          camera.position.addScaledVector(toTarget, Math.min(zoomSpeed3D, distance - 2.0));
          moved = true;
        }
      }
      if (keys['KeyC']) {
        const fromTarget = new THREE.Vector3().subVectors(camera.position, controls.target);
        const distance = fromTarget.length();
        if (distance < 120) {
          fromTarget.normalize();
          camera.position.addScaledVector(fromTarget, zoomSpeed3D);
          moved = true;
        }
      }

      // X: Resetar Câmera 3D
      if (keys['KeyX']) {
        controls.target.set(terrainWidth / 2, 0, terrainLength / 2);
        camera.position.set(terrainWidth * 0.8, Math.max(terrainWidth, terrainLength) * 0.9, terrainLength * 1.2);
        moved = true;
      }

      if (moved) {
        controls.update();
      }

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
