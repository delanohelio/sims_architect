import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useSimsStore } from '../../store/useSimsStore';

export function Viewport3D() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const { terrain, walls, floors, doorsWindows, wallViewMode } = useSimsStore();
  const keysPressedRef = useRef<Record<string, boolean>>({});

  const textureCacheRef = useRef<Map<string, THREE.Texture>>(new Map());

  // Carrega e armazena em cache texturas Three.js
  const getThreeTexture = (url?: string) => {
    if (!url) return null;
    let tex = textureCacheRef.current.get(url);
    if (!tex) {
      tex = new THREE.TextureLoader().load(url);
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(2, 2);
      textureCacheRef.current.set(url, tex);
    }
    return tex;
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // 1. Configura Cena, Câmera e Renderer WebGL
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0f172a);

    const width = container.clientWidth;
    const height = container.clientHeight;
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;

    container.appendChild(renderer.domElement);

    const terrainCenterX = terrain.width / 2;
    const terrainCenterZ = terrain.length / 2;

    const targetLookAt = new THREE.Vector3(terrainCenterX, 0, terrainCenterZ);
    camera.position.set(terrainCenterX, 20, terrainCenterZ + 25);
    camera.lookAt(targetLookAt);

    // 2. ILUMINAÇÃO (Sol Direcional + Luz Ambiente)
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xfff7ed, 1.25);
    sunLight.position.set(terrainCenterX + 20, 35, terrainCenterZ + 15);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 150;
    sunLight.shadow.camera.left = -40;
    sunLight.shadow.camera.right = 40;
    sunLight.shadow.camera.top = 40;
    sunLight.shadow.camera.bottom = -40;
    scene.add(sunLight);

    // 3. TERRENO 3D
    const terrainGeo = new THREE.PlaneGeometry(terrain.width, terrain.length);
    const terrain3DTexture = getThreeTexture(terrain.customTextureUrl);

    const terrainMatParams: THREE.MeshStandardMaterialParameters = {
      color: terrain3DTexture ? 0xffffff : (terrain.customColor || (terrain.theme === 'grass' ? 0x15803d : 0x0f172a)),
      roughness: 0.8,
    };
    if (terrain3DTexture) terrainMatParams.map = terrain3DTexture;

    const terrainMat = new THREE.MeshStandardMaterial(terrainMatParams);
    const terrainMesh = new THREE.Mesh(terrainGeo, terrainMat);
    terrainMesh.rotation.x = -Math.PI / 2;
    terrainMesh.position.set(terrainCenterX, 0, terrainCenterZ);
    terrainMesh.receiveShadow = true;
    scene.add(terrainMesh);

    // Grid Helper 3D
    const gridHelper = new THREE.GridHelper(
      Math.max(terrain.width, terrain.length),
      Math.max(terrain.width, terrain.length),
      0x4ade80,
      0x334155
    );
    gridHelper.position.set(terrainCenterX, 0.01, terrainCenterZ);
    scene.add(gridHelper);

    // 4. PISOS 3D
    Object.values(floors).forEach((floor) => {
      const tileGeo = new THREE.PlaneGeometry(1, 1);
      let tileColor = 0x78350f;

      if (floor.textureId === 'marble') tileColor = 0xf1f5f9;
      else if (floor.textureId === 'tile') tileColor = 0x475569;
      else if (floor.textureId === 'slate') tileColor = 0x0f172a;
      else if (floor.textureId === 'grass') tileColor = 0x047857;
      else if (floor.textureId === 'dirt') tileColor = 0x451a03;

      if (floor.color) {
        tileColor = parseInt(floor.color.replace('#', ''), 16);
      }

      const floor3DTexture = getThreeTexture(floor.customTextureUrl);

      const tileMatParams: THREE.MeshStandardMaterialParameters = {
        color: floor3DTexture ? 0xffffff : tileColor,
        roughness: 0.4,
      };
      if (floor3DTexture) tileMatParams.map = floor3DTexture;

      const tileMat = new THREE.MeshStandardMaterial(tileMatParams);
      const tileMesh = new THREE.Mesh(tileGeo, tileMat);
      tileMesh.rotation.x = -Math.PI / 2;
      tileMesh.position.set(floor.x + 0.5, 0.02, floor.y + 0.5);
      tileMesh.receiveShadow = true;
      scene.add(tileMesh);
    });

    // 5. PAREDES 3D COM MATERIAIS INDEPENDENTES DUAL-FACE (LADO A & LADO B)
    let wallHeight = 2.8;
    if (wallViewMode === 'half') wallHeight = 1.4;
    else if (wallViewMode === 'low') wallHeight = 0.2;

    walls.forEach((wall) => {
      const dx = wall.x2 - wall.x1;
      const dz = wall.y2 - wall.y1;
      const wallLen = Math.hypot(dx, dz);
      if (wallLen < 0.1) return;

      const angle = Math.atan2(dz, dx);
      const midX = (wall.x1 + wall.x2) / 2;
      const midZ = (wall.y1 + wall.y2) / 2;

      const wallThickness = wall.thickness || 0.2;
      const wallGeo = new THREE.BoxGeometry(wallLen, wallHeight, wallThickness);

      // MATERIAL LADO A (Frente / Interno)
      const colorNumA = wall.colorSideA ? parseInt(wall.colorSideA.replace('#', ''), 16) : 0xf1f5f9;
      const texA = getThreeTexture(wall.textureUrlSideA || wall.textureUrl);

      const matParamsA: THREE.MeshStandardMaterialParameters = {
        color: texA ? 0xffffff : colorNumA,
        roughness: 0.6,
        transparent: wallViewMode === 'half',
        opacity: wallViewMode === 'half' ? 0.75 : 1.0,
      };
      if (texA) matParamsA.map = texA;
      const matA = new THREE.MeshStandardMaterial(matParamsA);

      // MATERIAL LADO B (Verso / Externo)
      const colorNumB = wall.colorSideB ? parseInt(wall.colorSideB.replace('#', ''), 16) : 0xcbd5e1;
      const texB = getThreeTexture(wall.textureUrlSideB || wall.textureUrl);

      const matParamsB: THREE.MeshStandardMaterialParameters = {
        color: texB ? 0xffffff : colorNumB,
        roughness: 0.6,
        transparent: wallViewMode === 'half',
        opacity: wallViewMode === 'half' ? 0.75 : 1.0,
      };
      if (texB) matParamsB.map = texB;
      const matB = new THREE.MeshStandardMaterial(matParamsB);

      // Material das extremidades (neutro)
      const capMat = new THREE.MeshStandardMaterial({
        color: 0x94a3b8,
        roughness: 0.7,
        transparent: wallViewMode === 'half',
        opacity: wallViewMode === 'half' ? 0.75 : 1.0,
      });

      // Array de 6 materiais Three.js para as faces da caixa
      // [right, left, top, bottom, front (Side A), back (Side B)]
      const materialsArray = [capMat, capMat, capMat, capMat, matA, matB];

      const wallMesh = new THREE.Mesh(wallGeo, materialsArray);
      wallMesh.position.set(midX, wallHeight / 2, midZ);
      wallMesh.rotation.y = -angle;
      wallMesh.castShadow = true;
      wallMesh.receiveShadow = true;
      scene.add(wallMesh);

      // MOLDURAS, MAÇANETAS E VIDROS EM 3D
      const wallDoorsWindows = doorsWindows.filter((dw) => dw.wallId === wall.id);
      wallDoorsWindows.forEach((dw) => {
        const dwPxWidth = dw.width;
        const dwHeight = dw.height || (dw.type === 'door' ? 2.1 : 1.2);
        const dwYOffset = dw.type === 'door' ? dwHeight / 2 : 1.4;

        if (dwYOffset > wallHeight) return;

        const posAlong = (dw.offsetRatio - 0.5) * wallLen;
        const posX = midX + Math.cos(angle) * posAlong;
        const posZ = midZ + Math.sin(angle) * posAlong;

        let frameColorNum = dw.type === 'door' ? 0x78350f : 0x1e293b;
        if (dw.frameColor) {
          frameColorNum = parseInt(dw.frameColor.replace('#', ''), 16);
        }

        if (dw.type === 'door') {
          const frameGeo = new THREE.BoxGeometry(dwPxWidth, dwHeight, wallThickness + 0.04);
          const frameMat = new THREE.MeshStandardMaterial({ color: frameColorNum, roughness: 0.5 });
          const frameMesh = new THREE.Mesh(frameGeo, frameMat);
          frameMesh.position.set(posX, dwHeight / 2, posZ);
          frameMesh.rotation.y = -angle;
          scene.add(frameMesh);

          const handleGeo = new THREE.SphereGeometry(0.06, 12, 12);
          const handleMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.9, roughness: 0.1 });
          const handleMesh = new THREE.Mesh(handleGeo, handleMat);

          const handleOffset = (dwPxWidth / 2) - 0.12;
          const handleX = posX + Math.cos(angle) * handleOffset;
          const handleZ = posZ + Math.sin(angle) * handleOffset;

          handleMesh.position.set(handleX, 1.0, handleZ);
          scene.add(handleMesh);
        } else {
          const frameGeo = new THREE.BoxGeometry(dwPxWidth, dwHeight, wallThickness + 0.04);
          const frameMat = new THREE.MeshStandardMaterial({ color: frameColorNum, roughness: 0.3 });
          const frameMesh = new THREE.Mesh(frameGeo, frameMat);
          frameMesh.position.set(posX, 1.4, posZ);
          frameMesh.rotation.y = -angle;
          scene.add(frameMesh);

          const glassGeo = new THREE.PlaneGeometry(dwPxWidth - 0.1, dwHeight - 0.1);
          const glassMat = new THREE.MeshPhysicalMaterial({
            color: 0x38bdf8,
            transparent: true,
            opacity: 0.45,
            roughness: 0.1,
            metalness: 0.1,
            clearcoat: 1.0,
            clearcoatRoughness: 0.1,
          });
          const glassMesh = new THREE.Mesh(glassGeo, glassMat);
          glassMesh.position.set(posX, 1.4, posZ);
          glassMesh.rotation.y = -angle;
          scene.add(glassMesh);
        }
      });
    });

    // 6. NAVEGAÇÃO 3D (MOUSE ORBIT, WASD, Q/E ROTATE & ZCX ZOOM)
    let isMouseDown = false;
    let previousMousePosition = { x: 0, y: 0 };

    const onMouseDown = (e: MouseEvent) => {
      if (e.button === 0 || e.button === 2) {
        isMouseDown = true;
        previousMousePosition = { x: e.clientX, y: e.clientY };
      }
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isMouseDown) return;

      const deltaX = e.clientX - previousMousePosition.x;
      const deltaY = e.clientY - previousMousePosition.y;

      const radius = camera.position.distanceTo(targetLookAt);
      let theta = Math.atan2(camera.position.x - targetLookAt.x, camera.position.z - targetLookAt.z);
      let phi = Math.acos((camera.position.y - targetLookAt.y) / radius);

      theta -= deltaX * 0.008;
      phi = Math.max(0.1, Math.min(Math.PI / 2 - 0.05, phi - deltaY * 0.008));

      camera.position.x = targetLookAt.x + radius * Math.sin(phi) * Math.sin(theta);
      camera.position.y = targetLookAt.y + radius * Math.cos(phi);
      camera.position.z = targetLookAt.z + radius * Math.sin(phi) * Math.cos(theta);

      camera.lookAt(targetLookAt);
      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const onMouseUp = () => {
      isMouseDown = false;
    };

    const onWheel = (e: WheelEvent) => {
      const zoomFactor = e.deltaY > 0 ? 1.08 : 0.92;
      camera.position.x = targetLookAt.x + (camera.position.x - targetLookAt.x) * zoomFactor;
      camera.position.y = Math.max(3, camera.position.y * zoomFactor);
      camera.position.z = targetLookAt.z + (camera.position.z - targetLookAt.z) * zoomFactor;
      camera.lookAt(targetLookAt);
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) return;
      keysPressedRef.current[e.code] = true;

      if (e.code === 'KeyZ') {
        camera.position.x = targetLookAt.x + (camera.position.x - targetLookAt.x) * 0.85;
        camera.position.y = Math.max(3, camera.position.y * 0.85);
        camera.position.z = targetLookAt.z + (camera.position.z - targetLookAt.z) * 0.85;
      } else if (e.code === 'KeyC') {
        camera.position.x = targetLookAt.x + (camera.position.x - targetLookAt.x) * 1.15;
        camera.position.y = camera.position.y * 1.15;
        camera.position.z = targetLookAt.z + (camera.position.z - targetLookAt.z) * 1.15;
      } else if (e.code === 'KeyX') {
        camera.position.set(terrainCenterX, 20, terrainCenterZ + 25);
        targetLookAt.set(terrainCenterX, 0, terrainCenterZ);
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      delete keysPressedRef.current[e.code];
    };

    const domEl = renderer.domElement;
    domEl.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    domEl.addEventListener('wheel', onWheel);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // Loop de Renderização & Navegação WASD / QE 3D
    let reqId: number;
    const speed = 0.35;
    const rotateSpeed = 0.025;

    const animate = () => {
      reqId = requestAnimationFrame(animate);

      const keys = keysPressedRef.current;

      if (keys['KeyQ'] || keys['KeyE']) {
        const radius = camera.position.distanceTo(targetLookAt);
        let theta = Math.atan2(camera.position.x - targetLookAt.x, camera.position.z - targetLookAt.z);
        const phi = Math.acos((camera.position.y - targetLookAt.y) / radius);

        if (keys['KeyQ']) theta += rotateSpeed;
        if (keys['KeyE']) theta -= rotateSpeed;

        camera.position.x = targetLookAt.x + radius * Math.sin(phi) * Math.sin(theta);
        camera.position.z = targetLookAt.z + radius * Math.sin(phi) * Math.cos(theta);
      }

      const forward = new THREE.Vector3();
      camera.getWorldDirection(forward);
      forward.y = 0;
      forward.normalize();

      const side = new THREE.Vector3().crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();

      if (keys['KeyW'] || keys['ArrowUp']) {
        camera.position.addScaledVector(forward, speed);
        targetLookAt.addScaledVector(forward, speed);
      }
      if (keys['KeyS'] || keys['ArrowDown']) {
        camera.position.addScaledVector(forward, -speed);
        targetLookAt.addScaledVector(forward, -speed);
      }
      if (keys['KeyA'] || keys['ArrowLeft']) {
        camera.position.addScaledVector(side, -speed);
        targetLookAt.addScaledVector(side, -speed);
      }
      if (keys['KeyD'] || keys['ArrowRight']) {
        camera.position.addScaledVector(side, speed);
        targetLookAt.addScaledVector(side, speed);
      }

      camera.lookAt(targetLookAt);
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(reqId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      domEl.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      domEl.removeEventListener('wheel', onWheel);
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [terrain, walls, floors, doorsWindows, wallViewMode]);

  return (
    <div className="relative w-full h-full overflow-hidden bg-slate-950 select-none">
      <div ref={containerRef} className="w-full h-full block cursor-grab active:cursor-grabbing" />

      <div className="absolute top-4 left-6 z-20 px-3.5 py-1.5 rounded-2xl bg-slate-900/85 backdrop-blur-md border border-slate-800/90 text-xs text-slate-300 shadow-xl flex items-center gap-2 pointer-events-none">
        <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
        <span>Modo 3D • <strong>WASD</strong> Mover • <strong>Q/E</strong> Girar • <strong>Z/C/X</strong> Zoom • Arraste para Orbitar</span>
      </div>
    </div>
  );
}
