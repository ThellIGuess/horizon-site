import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.185.1/build/three.module.min.js";

/* =========================================================
   HRZN PLANET — shader-built ringed gas giant
   - Procedural cloud bands (no random canvas texture)
   - One flat ring that casts / receives shadow
   - Fresnel atmosphere, star field, single moon
   - The planet only spins on its own axis; the pointer moves
     the camera a little instead of tilting the whole scene,
     so the ring never wobbles.
========================================================= */

const mount = document.getElementById("planetCanvas");
const stage = document.getElementById("planetStage");

if (mount && stage) {
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  let renderer = null;
  let frameId = 0;
  let running = true;
  let visible = true;
  const observers = [];

  const fail = (error) => {
    console.error("HRZN planet renderer failed:", error);
    running = false;
    cancelAnimationFrame(frameId);
    observers.forEach((o) => o.disconnect());
    renderer?.domElement?.remove();
    mount.classList.remove("ready");
    mount.classList.add("failed");
  };

  try {
    const R = 1.25;               // planet radius
    const RING_IN = R * 1.38;
    const RING_OUT = R * 2.2;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
    const CAM_BASE = new THREE.Vector3(0, 0.6, 10.4);
    camera.position.copy(CAM_BASE);
    camera.lookAt(0, 0.3, 0);

    renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "high-performance" });
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    mount.appendChild(renderer.domElement);

    /* Light comes from the upper left, slightly in front. */
    const LIGHT_DIR = new THREE.Vector3(-0.75, 0.45, 0.55).normalize();

    /* System tilt: planet axis and ring share it. */
    const system = new THREE.Group();
    system.rotation.z = THREE.MathUtils.degToRad(-16);
    system.rotation.x = THREE.MathUtils.degToRad(17);
    scene.add(system);

    /* Ring plane normal in world space (ring lies in the system's XZ plane). */
    system.updateMatrixWorld(true);
    const ringNormal = new THREE.Vector3(0, 1, 0).applyQuaternion(system.quaternion).normalize();

    /* ---------- shared GLSL noise ---------- */
    const NOISE = /* glsl */ `
      float hash(vec3 p) {
        p = fract(p * 0.3183099 + 0.1);
        p *= 17.0;
        return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
      }
      float noise(vec3 x) {
        vec3 i = floor(x);
        vec3 f = fract(x);
        f = f * f * (3.0 - 2.0 * f);
        return mix(mix(mix(hash(i + vec3(0,0,0)), hash(i + vec3(1,0,0)), f.x),
                       mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
                   mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x),
                       mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y), f.z);
      }
      float fbm(vec3 p) {
        float v = 0.0;
        float a = 0.5;
        for (int i = 0; i < 5; i++) {
          v += a * noise(p);
          p *= 2.03;
          a *= 0.5;
        }
        return v;
      }
    `;

    /* ---------- PLANET ---------- */
    const planetUniforms = {
      uTime: { value: 0 },
      uLight: { value: LIGHT_DIR },
      uRingNormal: { value: ringNormal },
      uRingIn: { value: RING_IN },
      uRingOut: { value: RING_OUT }
    };

    const planetMat = new THREE.ShaderMaterial({
      uniforms: planetUniforms,
      vertexShader: /* glsl */ `
        varying vec3 vObj;
        varying vec3 vWorld;
        varying vec3 vNormalW;
        void main() {
          vObj = position;
          vec4 w = modelMatrix * vec4(position, 1.0);
          vWorld = w.xyz;
          vNormalW = normalize(mat3(modelMatrix) * normal);
          gl_Position = projectionMatrix * viewMatrix * w;
        }
      `,
      fragmentShader: /* glsl */ `
        uniform float uTime;
        uniform vec3 uLight;
        uniform vec3 uRingNormal;
        uniform float uRingIn;
        uniform float uRingOut;
        varying vec3 vObj;
        varying vec3 vWorld;
        varying vec3 vNormalW;
        ${NOISE}

        void main() {
          vec3 n = normalize(vNormalW);
          vec3 p = normalize(vObj);

          /* Latitude bands, warped by slow-moving turbulence. */
          float warp = fbm(vec3(p.x * 2.2, p.y * 5.5, p.z * 2.2) + vec3(uTime * 0.015, 0.0, 0.0));
          float lat = p.y * 6.5 + warp * 1.7;
          float bands = 0.5 + 0.5 * sin(lat * 2.1);
          float fine = fbm(vec3(p.x * 8.0, p.y * 26.0, p.z * 8.0));

          vec3 deep   = vec3(0.13, 0.06, 0.26);
          vec3 violet = vec3(0.43, 0.25, 0.80);
          vec3 lilac  = vec3(0.80, 0.60, 1.00);
          vec3 ember  = vec3(1.00, 0.58, 0.35);

          vec3 col = mix(deep, violet, smoothstep(0.1, 0.9, bands));
          col = mix(col, lilac, smoothstep(0.62, 1.0, bands) * 0.55);
          col = mix(col, ember, smoothstep(0.55, 0.9, fine) * smoothstep(0.35, 0.0, abs(p.y - 0.18)) * 0.55);
          col *= 0.85 + fine * 0.3;

          /* Soft-terminator diffuse lighting. */
          float ndl = dot(n, uLight);
          float light = smoothstep(-0.25, 0.75, ndl);

          /* Ring shadow on the planet. */
          float denom = dot(uLight, uRingNormal);
          if (abs(denom) > 0.0001) {
            float t = -dot(vWorld, uRingNormal) / denom;
            if (t > 0.0) {
              float r = length(vWorld + uLight * t);
              float inRing = smoothstep(uRingIn, uRingIn + 0.06, r) * (1.0 - smoothstep(uRingOut - 0.12, uRingOut, r));
              light *= 1.0 - inRing * 0.55;
            }
          }

          vec3 viewDir = normalize(cameraPosition - vWorld);
          float rim = pow(1.0 - max(dot(n, viewDir), 0.0), 3.0);

          vec3 night = deep * 0.18;
          vec3 color = mix(night, col, light);
          color += vec3(0.62, 0.42, 1.0) * rim * (0.25 + light * 0.75) * 0.9;
          color += vec3(1.0, 0.62, 0.38) * pow(max(ndl, 0.0), 12.0) * 0.12;

          gl_FragColor = vec4(color, 1.0);
        }
      `
    });

    const planet = new THREE.Mesh(new THREE.SphereGeometry(R, 128, 96), planetMat);
    system.add(planet);

    /* ---------- ATMOSPHERE ---------- */
    const atmosphere = new THREE.Mesh(
      new THREE.SphereGeometry(R * 1.16, 96, 64),
      new THREE.ShaderMaterial({
        uniforms: { uLight: { value: LIGHT_DIR } },
        vertexShader: /* glsl */ `
          varying vec3 vN;
          varying vec3 vW;
          void main() {
            vN = normalize(mat3(modelMatrix) * normal);
            vec4 w = modelMatrix * vec4(position, 1.0);
            vW = w.xyz;
            gl_Position = projectionMatrix * viewMatrix * w;
          }
        `,
        fragmentShader: /* glsl */ `
          uniform vec3 uLight;
          varying vec3 vN;
          varying vec3 vW;
          void main() {
            vec3 v = normalize(cameraPosition - vW);
            /* back faces: strongest right at the planet limb, fading to 0 at the halo's edge */
            float facing = abs(dot(normalize(vN), v));
            float glow = pow(smoothstep(0.0, 0.5, facing), 2.2);
            float lit = smoothstep(-0.4, 0.8, dot(normalize(vN), uLight));
            vec3 c = mix(vec3(0.55, 0.32, 1.0), vec3(1.0, 0.6, 0.4), lit * 0.35);
            gl_FragColor = vec4(c, glow * (0.25 + lit * 0.75) * 0.85);
          }
        `,
        side: THREE.BackSide,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      })
    );
    system.add(atmosphere);

    /* ---------- RING ---------- */
    const ringGeo = new THREE.RingGeometry(RING_IN, RING_OUT, 256, 1);
    ringGeo.rotateX(-Math.PI / 2); // lie flat in the system XZ plane

    const ringMat = new THREE.ShaderMaterial({
      uniforms: {
        uLight: { value: LIGHT_DIR },
        uIn: { value: RING_IN },
        uOut: { value: RING_OUT },
        uR: { value: R }
      },
      vertexShader: /* glsl */ `
        varying vec3 vLocal;
        varying vec3 vWorld;
        void main() {
          vLocal = position;
          vec4 w = modelMatrix * vec4(position, 1.0);
          vWorld = w.xyz;
          gl_Position = projectionMatrix * viewMatrix * w;
        }
      `,
      fragmentShader: /* glsl */ `
        uniform vec3 uLight;
        uniform float uIn;
        uniform float uOut;
        uniform float uR;
        varying vec3 vLocal;
        varying vec3 vWorld;
        ${NOISE}

        void main() {
          float r = length(vLocal.xz);
          float t = clamp((r - uIn) / (uOut - uIn), 0.0, 1.0);

          /* Ringlets: layered radial noise plus one clear gap. */
          float ringlets = noise(vec3(t * 90.0, 0.0, 0.0)) * 0.55 + noise(vec3(t * 23.0, 4.0, 0.0)) * 0.45;
          float gap = smoothstep(0.585, 0.6, t) * (1.0 - smoothstep(0.64, 0.655, t));
          float edgeFade = smoothstep(0.0, 0.06, t) * (1.0 - smoothstep(0.9, 1.0, t));
          float density = (0.35 + ringlets * 0.75) * edgeFade * (1.0 - gap * 0.92);

          vec3 inner = vec3(1.0, 0.62, 0.38);
          vec3 outer = vec3(0.68, 0.48, 1.0);
          vec3 col = mix(inner, outer, smoothstep(0.15, 0.95, t));
          col *= 0.75 + ringlets * 0.45;

          /* Planet shadow on the ring. */
          float along = dot(-vWorld, uLight);
          float shadow = 1.0;
          if (along > 0.0) {
            float d = length(vWorld + uLight * along);
            shadow = mix(0.12, 1.0, smoothstep(uR * 0.96, uR * 1.04, d));
          }

          gl_FragColor = vec4(col * shadow, density * 0.85);
        }
      `,
      side: THREE.DoubleSide,
      transparent: true,
      depthWrite: false
    });

    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.renderOrder = 2;
    system.add(ring);

    /* ---------- MOON ---------- */
    const moon = new THREE.Mesh(
      new THREE.SphereGeometry(0.11, 32, 24),
      new THREE.MeshStandardMaterial({ color: 0xffd9c0, roughness: 0.9, metalness: 0 })
    );
    scene.add(moon);
    scene.add(new THREE.AmbientLight(0x6b4f9a, 0.35));
    const sun = new THREE.DirectionalLight(0xfff0e0, 2.4);
    sun.position.copy(LIGHT_DIR).multiplyScalar(10);
    scene.add(sun);

    /* ---------- STARS (deterministic, so every load looks the same) ---------- */
    let seed = 7;
    const rand = () => {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    };

    const STAR_COUNT = 260;
    const starPos = new Float32Array(STAR_COUNT * 3);
    const starSize = new Float32Array(STAR_COUNT);
    for (let i = 0; i < STAR_COUNT; i++) {
      starPos[i * 3] = (rand() - 0.5) * 22;
      starPos[i * 3 + 1] = (rand() - 0.5) * 16;
      starPos[i * 3 + 2] = -6 - rand() * 8;
      starSize[i] = 0.6 + rand() * 1.8;
    }
    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute("position", new THREE.BufferAttribute(starPos, 3));
    starGeo.setAttribute("aSize", new THREE.BufferAttribute(starSize, 1));

    const starMat = new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 }, uPx: { value: renderer.getPixelRatio() } },
      vertexShader: /* glsl */ `
        attribute float aSize;
        uniform float uTime;
        uniform float uPx;
        varying float vTw;
        void main() {
          vTw = 0.55 + 0.45 * sin(uTime * 1.3 + position.x * 3.1 + position.y * 1.7);
          gl_PointSize = aSize * uPx;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: /* glsl */ `
        varying float vTw;
        void main() {
          float d = length(gl_PointCoord - 0.5);
          float a = smoothstep(0.5, 0.0, d) * vTw;
          gl_FragColor = vec4(vec3(0.92, 0.86, 1.0), a * 0.8);
        }
      `,
      transparent: true,
      depthWrite: false
    });
    scene.add(new THREE.Points(starGeo, starMat));

    /* ---------- INTERACTION: gentle camera parallax ---------- */
    const target = { x: 0, y: 0 };
    const current = { x: 0, y: 0 };

    const onPointer = (event) => {
      const rect = stage.getBoundingClientRect();
      if (!rect.width) return;
      target.x = THREE.MathUtils.clamp(((event.clientX - rect.left) / rect.width) * 2 - 1, -1.2, 1.2);
      target.y = THREE.MathUtils.clamp(((event.clientY - rect.top) / rect.height) * 2 - 1, -1.2, 1.2);
    };
    window.addEventListener("pointermove", onPointer, { passive: true });
    stage.addEventListener("pointerleave", () => { target.x = 0; target.y = 0; });

    const resize = () => {
      const rect = mount.getBoundingClientRect();
      if (rect.width < 2 || rect.height < 2) return;
      renderer.setSize(rect.width, rect.height, false);
      camera.aspect = rect.width / rect.height;
      /* keep the whole ring in frame on narrow cards */
      CAM_BASE.z = 10.4 * Math.max(1, 1.25 / camera.aspect);
      camera.updateProjectionMatrix();
    };

    const ro = new ResizeObserver(resize);
    ro.observe(mount);
    observers.push(ro);
    resize();

    const io = new IntersectionObserver(([entry]) => { visible = Boolean(entry?.isIntersecting); }, { threshold: 0.01 });
    io.observe(stage);
    observers.push(io);

    let last = performance.now();
    let time = 0;
    const moonOrbit = new THREE.Vector3();
    let shown = false;

    if (reducedMotion) moon.position.set(-2.6, 1.1, 1.2);

    const animate = () => {
      if (!running) return;
      frameId = requestAnimationFrame(animate);

      const now = performance.now();
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;

      if (!visible || document.hidden) return;

      time += dt;

      if (!reducedMotion) {
        planet.rotation.y += dt * 0.09;
        planetUniforms.uTime.value = time;
        starMat.uniforms.uTime.value = time;

        const a = time * 0.32;
        moonOrbit.set(Math.cos(a) * 3.35, Math.sin(a * 0.5) * 0.25, Math.sin(a) * 3.35);
        moon.position.copy(moonOrbit.applyQuaternion(system.quaternion));
      }

      /* damped, small camera drift — the system itself never tilts */
      current.x += (target.x - current.x) * Math.min(1, dt * 3);
      current.y += (target.y - current.y) * Math.min(1, dt * 3);
      camera.position.set(
        CAM_BASE.x + current.x * 0.9,
        CAM_BASE.y - current.y * 0.6,
        CAM_BASE.z
      );
      camera.lookAt(0, 0.3, 0);

      renderer.render(scene, camera);

      if (!shown) {
        shown = true;
        mount.classList.add("ready");
      }
    };

    animate();

    window.addEventListener("pagehide", () => {
      running = false;
      cancelAnimationFrame(frameId);
      observers.forEach((o) => o.disconnect());
      renderer.dispose();
    }, { once: true });
  } catch (error) {
    fail(error);
  }
}
