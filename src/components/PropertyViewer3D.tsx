import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import {
  Sun,
  Sunset,
  Moon,
  Layers,
  Box,
  Eye,
  Maximize2,
  ChevronDown,
  ChevronUp,
  RotateCcw,
} from "lucide-react";

// Pre-allocated reusable vectors for zero-GC render loop
const _vec3 = new THREE.Vector3();

export type LightingMode = "day" | "sunset" | "night";
export type ViewAngle = "front" | "iso" | "aerial" | "garden";

export function PropertyViewer3D({
  propertyTitle = "فيلا أندلسية وقطعة أرض نموذجية",
  wilaya = "الجزائر العاصمة",
  area = 360,
}: {
  propertyTitle?: string;
  wilaya?: string;
  area?: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [controlsCollapsed, setControlsCollapsed] = useState(false);
  const [lightingMode, setLightingMode] = useState<LightingMode>("day");
  const [exploded, setExploded] = useState(false);
  const [wireframe, setWireframe] = useState(false);
  const [activeView, setActiveView] = useState<ViewAngle>("iso");

  // Mutable refs to pass into the Three.js loop without re-triggering scene setup
  const sceneParamsRef = useRef({
    lightingMode: "day" as LightingMode,
    exploded: false,
    explodedProgress: 0,
    wireframe: false,
  });

  useEffect(() => {
    sceneParamsRef.current.lightingMode = lightingMode;
  }, [lightingMode]);

  useEffect(() => {
    sceneParamsRef.current.exploded = exploded;
  }, [exploded]);

  useEffect(() => {
    sceneParamsRef.current.wireframe = wireframe;
  }, [wireframe]);

  // View transition target
  const targetCamRef = useRef<{ pos: THREE.Vector3; target: THREE.Vector3 } | null>(null);

  const setCameraView = (view: ViewAngle) => {
    setActiveView(view);
    if (view === "iso") {
      targetCamRef.current = {
        pos: new THREE.Vector3(18, 14, 22),
        target: new THREE.Vector3(0, 3, 0),
      };
    } else if (view === "front") {
      targetCamRef.current = {
        pos: new THREE.Vector3(0, 5, 24),
        target: new THREE.Vector3(0, 3.5, 0),
      };
    } else if (view === "aerial") {
      targetCamRef.current = {
        pos: new THREE.Vector3(0.5, 32, 4),
        target: new THREE.Vector3(0, 0, 0),
      };
    } else if (view === "garden") {
      targetCamRef.current = {
        pos: new THREE.Vector3(-14, 4, 12),
        target: new THREE.Vector3(-2, 2.5, 0),
      };
    }
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Detect software WebGL as mandated by the Three.js skill
    const isSoftwareGl = (() => {
      const gl = document.createElement("canvas").getContext("webgl2");
      if (!gl) return true;
      const ext = gl.getExtension("WEBGL_debug_renderer_info");
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension("WEBGL_lose_context")?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 520;

    // 1. Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf2f5f9);
    scene.fog = new THREE.Fog(0xf2f5f9, 35, 75);

    // 2. Camera setup
    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 150);
    camera.position.set(18, 14, 22);

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: "high-performance",
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    // 4. Studio Environment Reflection (RoomEnvironment)
    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();

    // 5. OrbitControls with silky damping
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2 - 0.02; // Prevent seeing underneath ground
    controls.minDistance = 6;
    controls.maxDistance = 50;
    controls.target.set(0, 3, 0);

    // Cancel camera scripted transition if user drags
    controls.addEventListener("start", () => {
      targetCamRef.current = null;
    });

    // 6. Balanced 3-Point Studio Lighting Rig
    const hemiLight = new THREE.HemisphereLight(0xfff7e6, 0x445566, 0.85);
    scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xfff5e0, 2.2);
    dirLight.position.set(16, 24, 14);
    dirLight.castShadow = !isSoftwareGl;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.bias = -0.0004;
    dirLight.shadow.normalBias = 0.02;
    dirLight.shadow.camera.left = -22;
    dirLight.shadow.camera.right = 22;
    dirLight.shadow.camera.top = 22;
    dirLight.shadow.camera.bottom = -22;
    dirLight.shadow.camera.near = 1;
    dirLight.shadow.camera.far = 60;
    scene.add(dirLight);

    const fillLight = new THREE.DirectionalLight(0x88bbff, 0.6);
    fillLight.position.set(-14, 12, -12);
    scene.add(fillLight);

    // Materials dictionary
    const materials: Record<string, THREE.Material> = {
      ground: new THREE.MeshStandardMaterial({
        color: 0x82a868, // Mediterranean lawn
        roughness: 0.88,
        metalness: 0.05,
      }),
      soilPlot: new THREE.MeshStandardMaterial({
        color: 0xc8b69b, // Sandy warm plot boundary
        roughness: 0.95,
        metalness: 0.02,
      }),
      stonePaving: new THREE.MeshStandardMaterial({
        color: 0xd9d3c7, // Algerian limestone paving
        roughness: 0.75,
        metalness: 0.05,
      }),
      wallStucco: new THREE.MeshStandardMaterial({
        color: 0xfdfaf5, // Clean white-cream stucco
        roughness: 0.65,
        metalness: 0.02,
      }),
      wallTrim: new THREE.MeshStandardMaterial({
        color: 0xb5935a, // Warm Algerian gold/ochre trim
        roughness: 0.45,
        metalness: 0.2,
      }),
      terracottaRoof: new THREE.MeshStandardMaterial({
        color: 0xc45c36, // Clay barrel roof tiles
        roughness: 0.7,
        metalness: 0.08,
      }),
      woodDoor: new THREE.MeshStandardMaterial({
        color: 0x4a2e18, // Rich walnut door
        roughness: 0.55,
        metalness: 0.1,
      }),
      glass: new THREE.MeshPhysicalMaterial({
        color: 0xaee2ff,
        transparent: true,
        opacity: 0.6,
        roughness: 0.1,
        metalness: 0.1,
        transmission: isSoftwareGl ? 0 : 0.85,
        ior: 1.5,
      }),
      metalAccents: new THREE.MeshStandardMaterial({
        color: 0x222222,
        roughness: 0.25,
        metalness: 0.85,
      }),
      foliage: new THREE.MeshStandardMaterial({
        color: 0x3d743a,
        roughness: 0.8,
        metalness: 0.05,
      }),
      woodTrunk: new THREE.MeshStandardMaterial({
        color: 0x5a422d,
        roughness: 0.9,
        metalness: 0.05,
      }),
    };

    // 7. Assemble Composite 3D Architectural Subject (Group)
    const architecturalModel = new THREE.Group();
    scene.add(architecturalModel);

    // A. Base Ground and Terrain
    const groundGeo = new THREE.CylinderGeometry(28, 28, 0.4, 48);
    const groundMesh = new THREE.Mesh(groundGeo, materials.ground);
    groundMesh.position.y = -0.2;
    groundMesh.receiveShadow = !isSoftwareGl;
    architecturalModel.add(groundMesh);

    // B. Paved Property Boundary / Land Plot
    const plotGeo = new THREE.BoxGeometry(19, 0.12, 19);
    const plotMesh = new THREE.Mesh(plotGeo, materials.soilPlot);
    plotMesh.position.set(0, 0.06, 0);
    plotMesh.receiveShadow = !isSoftwareGl;
    architecturalModel.add(plotMesh);

    // C. Paved Pathway & Driveway
    const pathGeo = new THREE.BoxGeometry(4, 0.14, 10);
    const pathMesh = new THREE.Mesh(pathGeo, materials.stonePaving);
    pathMesh.position.set(0, 0.07, 4.5);
    pathMesh.receiveShadow = !isSoftwareGl;
    architecturalModel.add(pathMesh);

    // D. Soft radial contact shadow plane
    const shadowGeo = new THREE.PlaneGeometry(16, 16);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x0a101d,
      transparent: true,
      opacity: 0.35,
      depthWrite: false,
    });
    const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    shadowMesh.rotation.x = -Math.PI / 2;
    shadowMesh.position.y = 0.08;
    architecturalModel.add(shadowMesh);

    // E. Villa Group (Split for Exploded View capability)
    const villaGroup = new THREE.Group();
    villaGroup.position.set(0, 0, -1);
    architecturalModel.add(villaGroup);

    // E.1 Ground Floor Group
    const groundFloorGroup = new THREE.Group();
    villaGroup.add(groundFloorGroup);

    // Base podium / foundation
    const foundationGeo = new THREE.BoxGeometry(10.5, 0.6, 9.5);
    const foundationMesh = new THREE.Mesh(foundationGeo, materials.stonePaving);
    foundationMesh.position.y = 0.3;
    foundationMesh.castShadow = !isSoftwareGl;
    foundationMesh.receiveShadow = !isSoftwareGl;
    groundFloorGroup.add(foundationMesh);

    // Ground floor main body
    const gfWallsGeo = new THREE.BoxGeometry(10, 3.2, 9);
    const gfWallsMesh = new THREE.Mesh(gfWallsGeo, materials.wallStucco);
    gfWallsMesh.position.y = 2.2;
    gfWallsMesh.castShadow = !isSoftwareGl;
    gfWallsMesh.receiveShadow = !isSoftwareGl;
    groundFloorGroup.add(gfWallsMesh);

    // Decorative molding trim band
    const trimGeo = new THREE.BoxGeometry(10.2, 0.2, 9.2);
    const trimMesh = new THREE.Mesh(trimGeo, materials.wallTrim);
    trimMesh.position.y = 3.8;
    groundFloorGroup.add(trimMesh);

    // Front arched porch & entrance door
    const doorGeo = new THREE.BoxGeometry(1.6, 2.4, 0.2);
    const doorMesh = new THREE.Mesh(doorGeo, materials.woodDoor);
    doorMesh.position.set(0, 1.8, 4.52);
    groundFloorGroup.add(doorMesh);

    // Entrance handle
    const handleGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.3, 8);
    const handleMesh = new THREE.Mesh(handleGeo, materials.wallTrim);
    handleMesh.rotation.z = Math.PI / 2;
    handleMesh.position.set(0.4, 1.8, 4.65);
    groundFloorGroup.add(handleMesh);

    // Windows (Ground floor front)
    [-2.8, 2.8].forEach((xPos) => {
      const winFrame = new THREE.BoxGeometry(1.4, 1.6, 0.15);
      const winMesh = new THREE.Mesh(winFrame, materials.metalAccents);
      winMesh.position.set(xPos, 2.2, 4.52);
      groundFloorGroup.add(winMesh);

      const winGlass = new THREE.BoxGeometry(1.2, 1.4, 0.05);
      const glassMesh = new THREE.Mesh(winGlass, materials.glass);
      glassMesh.position.set(xPos, 2.2, 4.56);
      groundFloorGroup.add(glassMesh);
    });

    // E.2 First Floor (Floats during Exploded View)
    const upperFloorGroup = new THREE.Group();
    upperFloorGroup.position.set(0, 3.9, 0);
    villaGroup.add(upperFloorGroup);

    // Upper floor structure
    const ufWallsGeo = new THREE.BoxGeometry(9.4, 3, 8.4);
    const ufWallsMesh = new THREE.Mesh(ufWallsGeo, materials.wallStucco);
    ufWallsMesh.position.y = 1.5;
    ufWallsMesh.castShadow = !isSoftwareGl;
    ufWallsMesh.receiveShadow = !isSoftwareGl;
    upperFloorGroup.add(ufWallsMesh);

    // Balcony / Terrace
    const balconyGeo = new THREE.BoxGeometry(4.2, 0.2, 2.2);
    const balconyMesh = new THREE.Mesh(balconyGeo, materials.stonePaving);
    balconyMesh.position.set(0, 0.1, 4.6);
    balconyMesh.castShadow = !isSoftwareGl;
    upperFloorGroup.add(balconyMesh);

    // Balcony glass railing
    const railGeo = new THREE.BoxGeometry(4.2, 0.85, 0.06);
    const railMesh = new THREE.Mesh(railGeo, materials.glass);
    railMesh.position.set(0, 0.55, 5.65);
    upperFloorGroup.add(railMesh);

    // Upper floor windows & sliding door
    const balconyDoorGeo = new THREE.BoxGeometry(2.4, 2.2, 0.1);
    const balconyDoorMesh = new THREE.Mesh(balconyDoorGeo, materials.glass);
    balconyDoorMesh.position.set(0, 1.4, 4.22);
    upperFloorGroup.add(balconyDoorMesh);

    // E.3 Terracotta Tiled Roof (Rises higher in Exploded View)
    const roofGroup = new THREE.Group();
    roofGroup.position.set(0, 3.0, 0);
    upperFloorGroup.add(roofGroup);

    // Roof pyramid / hipped shape
    const roofGeo = new THREE.ConeGeometry(7.2, 2.6, 4);
    roofGeo.rotateY(Math.PI / 4); // Align hip to rectangular house
    const roofMesh = new THREE.Mesh(roofGeo, materials.terracottaRoof);
    roofMesh.position.y = 1.3;
    roofMesh.scale.set(1.45, 1, 1.25);
    roofMesh.castShadow = !isSoftwareGl;
    roofGroup.add(roofMesh);

    // Roof overhang cornice
    const corniceGeo = new THREE.BoxGeometry(9.8, 0.2, 8.8);
    const corniceMesh = new THREE.Mesh(corniceGeo, materials.wallTrim);
    corniceMesh.position.y = 0.1;
    roofGroup.add(corniceMesh);

    // F. Garden Landscape: Procedural Algerian Date Palms & Olive Trees
    const gardenTreesGroup = new THREE.Group();
    architecturalModel.add(gardenTreesGroup);

    const createPalmTree = (x: number, z: number, scale = 1) => {
      const palm = new THREE.Group();
      palm.position.set(x, 0, z);
      palm.scale.set(scale, scale, scale);

      // Curved trunk
      const trunkGeo = new THREE.CylinderGeometry(0.2, 0.35, 4.2, 7);
      const trunkMesh = new THREE.Mesh(trunkGeo, materials.woodTrunk);
      trunkMesh.position.y = 2.1;
      trunkMesh.rotation.z = 0.06;
      trunkMesh.castShadow = !isSoftwareGl;
      palm.add(trunkMesh);

      // Crown of fronds
      for (let i = 0; i < 7; i++) {
        const frondGeo = new THREE.ConeGeometry(0.7, 3, 5);
        frondGeo.rotateX(Math.PI / 2.3);
        const frond = new THREE.Mesh(frondGeo, materials.foliage);
        frond.position.set(0, 4.1, 0);
        frond.rotation.y = (i * Math.PI * 2) / 7;
        frond.castShadow = !isSoftwareGl;
        palm.add(frond);
      }
      return palm;
    };

    gardenTreesGroup.add(createPalmTree(-6.5, 3.5, 1.1));
    gardenTreesGroup.add(createPalmTree(-6.8, -3.5, 0.95));
    gardenTreesGroup.add(createPalmTree(6.6, 4, 1.05));

    // Low Mediterranean stone boundary wall
    const wall1 = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.8, 18), materials.stonePaving);
    wall1.position.set(-9.4, 0.4, 0);
    wall1.castShadow = !isSoftwareGl;
    architecturalModel.add(wall1);

    const wall2 = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.8, 18), materials.stonePaving);
    wall2.position.set(9.4, 0.4, 0);
    wall2.castShadow = !isSoftwareGl;
    architecturalModel.add(wall2);

    // Pre-warm shaders
    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    // 8. Animation & Render Loop
    let reqId = 0;
    const clock = new THREE.Clock();

    const animate = () => {
      reqId = requestAnimationFrame(animate);
      const delta = clock.getDelta();

      // Exponential damping on camera target transitions
      if (targetCamRef.current) {
        camera.position.damp(targetCamRef.current.pos, 4, delta);
        controls.target.damp(targetCamRef.current.target, 4, delta);
        if (
          camera.position.distanceTo(targetCamRef.current.pos) < 0.1 &&
          controls.target.distanceTo(targetCamRef.current.target) < 0.1
        ) {
          targetCamRef.current = null;
        }
      }

      // Handle Exploded View transition smoothly with damping
      const isExp = sceneParamsRef.current.exploded;
      const targetExplode = isExp ? 1 : 0;
      sceneParamsRef.current.explodedProgress = THREE.MathUtils.damp(
        sceneParamsRef.current.explodedProgress,
        targetExplode,
        4.5,
        delta,
      );

      const p = sceneParamsRef.current.explodedProgress;
      upperFloorGroup.position.y = 3.9 + p * 3.2;
      roofGroup.position.y = 3.0 + p * 3.5;

      // Subtle slow turntable rotation when not dragging
      if (!controls.state) {
        architecturalModel.rotation.y += delta * 0.04;
      }

      // Update Lighting smoothly
      const currentMode = sceneParamsRef.current.lightingMode;
      if (currentMode === "day") {
        dirLight.color.setHex(0xfff7e8);
        dirLight.intensity = 2.4;
        hemiLight.color.setHex(0xfff7e6);
        hemiLight.intensity = 0.85;
        scene.background = new THREE.Color(0xf2f5f9);
        scene.fog?.color.setHex(0xf2f5f9);
      } else if (currentMode === "sunset") {
        dirLight.color.setHex(0xff9a55);
        dirLight.intensity = 2.8;
        hemiLight.color.setHex(0xff8866);
        hemiLight.intensity = 0.65;
        scene.background = new THREE.Color(0x3d273a);
        scene.fog?.color.setHex(0x3d273a);
      } else if (currentMode === "night") {
        dirLight.color.setHex(0x5577aa);
        dirLight.intensity = 0.8;
        hemiLight.color.setHex(0x223344);
        hemiLight.intensity = 0.4;
        scene.background = new THREE.Color(0x0e131d);
        scene.fog?.color.setHex(0x0e131d);
      }

      // Update Wireframe state
      const isWire = sceneParamsRef.current.wireframe;
      Object.values(materials).forEach((m) => {
        (m as THREE.MeshStandardMaterial).wireframe = isWire;
      });

      controls.update();
      renderer.render(scene, camera);
    };

    animate();

    // Resize handler
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener("resize", handleResize);

    // Cleanup on unmount
    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(reqId);
      controls.dispose();
      renderer.dispose();
      Object.values(materials).forEach((m) => m.dispose());
      scene.clear();
      if (renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div className="relative h-[480px] w-full overflow-hidden rounded-2xl border border-border/80 bg-slate-950/5 shadow-2xl md:h-[560px]">
      {/* 3D Canvas Mounting Container */}
      <div
        ref={containerRef}
        className="absolute inset-0 h-full w-full cursor-grab active:cursor-grabbing"
      />

      {/* Top Spec and Title Badge (Minimal, unobtrusive) */}
      <div className="pointer-events-none absolute left-4 top-4 z-10 flex flex-wrap items-center gap-2">
        <div className="pointer-events-auto flex items-center gap-2 rounded-xl bg-slate-900/85 px-3 py-1.5 text-xs font-bold text-white shadow-md">
          <Box size={14} className="text-gold" />
          <span>معاينة ثلاثية الأبعاد 3D تفاعلية</span>
        </div>
        <div className="hidden rounded-xl bg-slate-900/75 px-3 py-1.5 text-xs text-slate-200 md:block">
          {propertyTitle} • ولاية {wilaya} ({area} م²)
        </div>
      </div>

      {/* Floating Collapsible Control Dock (Bottom Center, <= 15% viewport height) */}
      <div
        className={`absolute bottom-4 left-1/2 z-20 w-[94%] max-w-[840px] -translate-x-1/2 transition-transform duration-300 ${
          controlsCollapsed ? "translate-y-[calc(100%-32px)]" : "translate-y-0"
        }`}
      >
        {/* Toggle Collapse Pill */}
        <div className="flex justify-center pb-1">
          <button
            type="button"
            onClick={() => setControlsCollapsed(!controlsCollapsed)}
            className="flex items-center gap-1 rounded-t-lg bg-slate-900/90 px-3 py-1 text-[11px] font-bold text-slate-300 transition hover:bg-slate-900 hover:text-white"
          >
            {controlsCollapsed ? (
              <>
                <ChevronUp size={13} /> إظهار لوحة التحكم 3D
              </>
            ) : (
              <>
                <ChevronDown size={13} /> إخفاء لوحة التحكم (عرض كامل)
              </>
            )}
          </button>
        </div>

        {/* Dock Controls Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-slate-900/90 p-3 text-white shadow-2xl border border-white/10">
          {/* Angles & Camera presets */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-bold text-slate-400 pl-1">الزاوية:</span>
            <button
              type="button"
              onClick={() => setCameraView("iso")}
              className={`rounded-lg px-2.5 py-1 text-xs font-medium transition ${
                activeView === "iso"
                  ? "bg-primary text-white"
                  : "bg-white/10 hover:bg-white/20 text-slate-200"
              }`}
            >
              منظور كامل
            </button>
            <button
              type="button"
              onClick={() => setCameraView("front")}
              className={`rounded-lg px-2.5 py-1 text-xs font-medium transition ${
                activeView === "front"
                  ? "bg-primary text-white"
                  : "bg-white/10 hover:bg-white/20 text-slate-200"
              }`}
            >
              الواجهة الأمامية
            </button>
            <button
              type="button"
              onClick={() => setCameraView("aerial")}
              className={`rounded-lg px-2.5 py-1 text-xs font-medium transition ${
                activeView === "aerial"
                  ? "bg-primary text-white"
                  : "bg-white/10 hover:bg-white/20 text-slate-200"
              }`}
            >
              مخطط الأرض (علوية)
            </button>
            <button
              type="button"
              onClick={() => setCameraView("garden")}
              className={`rounded-lg px-2.5 py-1 text-xs font-medium transition ${
                activeView === "garden"
                  ? "bg-primary text-white"
                  : "bg-white/10 hover:bg-white/20 text-slate-200"
              }`}
            >
              الحديقة والمدخل
            </button>
          </div>

          {/* Inspection and Lighting Toggles */}
          <div className="flex items-center gap-2">
            {/* Exploded Floor mode */}
            <button
              type="button"
              onClick={() => setExploded(!exploded)}
              className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                exploded
                  ? "bg-gold text-deep font-bold"
                  : "bg-white/10 hover:bg-white/20 text-slate-200"
              }`}
              title="فصل الطوابق وتفكيك الهيكل للمعاينة المعمارية"
            >
              <Layers size={13} />
              <span>{exploded ? "دمج الطوابق" : "فصل الطوابق"}</span>
            </button>

            {/* Wireframe toggle */}
            <button
              type="button"
              onClick={() => setWireframe(!wireframe)}
              className={`flex items-center gap-1 rounded-lg px-2 py-1 text-xs transition ${
                wireframe
                  ? "bg-white text-slate-900 font-bold"
                  : "bg-white/10 hover:bg-white/20 text-slate-200"
              }`}
              title="عرض الهيكل السلكي الهندسي"
            >
              <Eye size={13} />
            </button>

            {/* Lighting Modes */}
            <div className="flex items-center rounded-lg bg-white/10 p-0.5">
              <button
                type="button"
                onClick={() => setLightingMode("day")}
                className={`rounded-md p-1.5 transition ${
                  lightingMode === "day"
                    ? "bg-amber-500 text-slate-950 font-bold"
                    : "text-slate-300 hover:text-white"
                }`}
                title="إضاءة نهارية مشمسة"
              >
                <Sun size={13} />
              </button>
              <button
                type="button"
                onClick={() => setLightingMode("sunset")}
                className={`rounded-md p-1.5 transition ${
                  lightingMode === "sunset"
                    ? "bg-orange-500 text-white font-bold"
                    : "text-slate-300 hover:text-white"
                }`}
                title="غروب ذهبي"
              >
                <Sunset size={13} />
              </button>
              <button
                type="button"
                onClick={() => setLightingMode("night")}
                className={`rounded-md p-1.5 transition ${
                  lightingMode === "night"
                    ? "bg-indigo-600 text-white font-bold"
                    : "text-slate-300 hover:text-white"
                }`}
                title="إضاءة ليلية"
              >
                <Moon size={13} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
