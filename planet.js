import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.185.1/build/three.module.min.js";

const mount = document.getElementById("planetCanvas");
const stage = document.getElementById("planetStage");
const fallback = stage?.querySelector(".planet-fallback");

if (mount && stage) {
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  let renderer = null;
  let frameId = null;
  let resizeObserver = null;
  let visibilityObserver = null;
  let running = true;
  let isVisible = true;

  const failGracefully = (error) => {
    console.error("HRZN planet renderer failed:", error);
    running = false;

    if (frameId) cancelAnimationFrame(frameId);
    resizeObserver?.disconnect();
    visibilityObserver?.disconnect();

    if (renderer?.domElement?.parentNode) {
      renderer.domElement.parentNode.removeChild(renderer.domElement);
    }

    mount.classList.remove("ready");
    mount.classList.add("failed");

    if (fallback) {
      fallback.style.opacity = "1";
      fallback.style.visibility = "visible";
    }
  };

  try {
    if (!window.WebGLRenderingContext && !window.WebGL2RenderingContext) {
      throw new Error("WebGL is not available in this browser.");
    }

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 100);
    camera.position.set(0, 0.05, 6.3);

    renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: "high-performance"
    });

    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.6));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    mount.appendChild(renderer.domElement);

    const world = new THREE.Group();
    world.rotation.z = -0.04;
    scene.add(world);

    /* ---------------------------
       PROCEDURAL PLANET TEXTURE
    ---------------------------- */

    function createPlanetTexture() {
      const textureCanvas = document.createElement("canvas");
      textureCanvas.width = 1024;
      textureCanvas.height = 512;

      const ctx = textureCanvas.getContext("2d");
      if (!ctx) return null;

      const base = ctx.createLinearGradient(0, 0, textureCanvas.width, textureCanvas.height);
      base.addColorStop(0, "#d6a8ff");
      base.addColorStop(0.22, "#a875f1");
      base.addColorStop(0.5, "#7146c4");
      base.addColorStop(0.77, "#412475");
      base.addColorStop(1, "#1b102d");
      ctx.fillStyle = base;
      ctx.fillRect(0, 0, textureCanvas.width, textureCanvas.height);

      /* Jupiter-like horizontal cloud bands. */
      for (let i = 0; i < 34; i++) {
        const y = (i / 34) * textureCanvas.height;
        const height = 4 + Math.random() * 15;
        const hue = i % 3 === 0 ? "255,155,100" : i % 3 === 1 ? "221,180,255" : "113,69,190";

        ctx.fillStyle = `rgba(${hue},${0.035 + Math.random() * 0.065})`;
        ctx.fillRect(0, y + Math.sin(i * 1.4) * 8, textureCanvas.width, height);
      }

      /* Soft storm shapes. */
      for (let i = 0; i < 85; i++) {
        const x = Math.random() * textureCanvas.width;
        const y = Math.random() * textureCanvas.height;
        const rx = 15 + Math.random() * 80;
        const ry = 3 + Math.random() * 18;

        ctx.beginPath();
        ctx.ellipse(x, y, rx, ry, Math.random() * 0.18, 0, Math.PI * 2);
        ctx.fillStyle = Math.random() > 0.5
          ? `rgba(255,177,118,${0.018 + Math.random() * 0.045})`
          : `rgba(55,25,100,${0.035 + Math.random() * 0.07})`;
        ctx.fill();
      }

      const texture = new THREE.CanvasTexture(textureCanvas);
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.wrapS = THREE.RepeatWrapping;
      texture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
      return texture;
    }

    const planetTexture = createPlanetTexture();

    const planet = new THREE.Mesh(
      new THREE.SphereGeometry(1.52, 80, 56),
      new THREE.MeshStandardMaterial({
        map: planetTexture || null,
        color: planetTexture ? 0xffffff : 0x8350d0,
        roughness: 0.66,
        metalness: 0.02
      })
    );
    planet.rotation.z = -0.11;
    world.add(planet);

    /* Atmosphere: intentionally simple and reliable. */
    const atmosphere = new THREE.Mesh(
      new THREE.SphereGeometry(1.61, 64, 40),
      new THREE.MeshBasicMaterial({
        color: 0xb477ff,
        transparent: true,
        opacity: 0.095,
        side: THREE.BackSide,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      })
    );
    world.add(atmosphere);

    /* Tiny bright highlight for a premium 3D read. */
    const highlight = new THREE.Mesh(
      new THREE.SphereGeometry(0.11, 22, 16),
      new THREE.MeshBasicMaterial({
        color: 0xfff3df,
        transparent: true,
        opacity: 0.72,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      })
    );
    highlight.position.set(-0.67, 0.74, 1.2);
    world.add(highlight);

    function createOrbit(color, radius, tube, tiltX, tiltY, opacity) {
      const orbit = new THREE.Mesh(
        new THREE.TorusGeometry(radius, tube, 12, 180),
        new THREE.MeshBasicMaterial({
          color,
          transparent: true,
          opacity,
          blending: THREE.AdditiveBlending,
          depthWrite: false
        })
      );

      orbit.rotation.x = tiltX;
      orbit.rotation.y = tiltY;
      return orbit;
    }

    const orbitWarm = createOrbit(0xff9c58, 2.1, 0.012, 1.2, 0.2, 0.82);
    const orbitPurple = createOrbit(0xb879ff, 1.91, 0.01, 1.77, -0.42, 0.72);
    world.add(orbitWarm, orbitPurple);

    /* Small orbiting moons / satellites. */
    const moonMaterial = new THREE.MeshBasicMaterial({ color: 0xffd4b0 });
    const moonA = new THREE.Mesh(new THREE.SphereGeometry(0.035, 12, 8), moonMaterial);
    const moonB = new THREE.Mesh(
      new THREE.SphereGeometry(0.025, 12, 8),
      new THREE.MeshBasicMaterial({ color: 0xd4b1ff })
    );
    world.add(moonA, moonB);

    /* Ambient dust around the planet. */
    const particleCount = 140;
    const particlePositions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      const radius = 2.2 + Math.random() * 1.25;
      const theta = Math.random() * Math.PI * 2;
      const y = (Math.random() - 0.5) * 2.5;

      particlePositions[i * 3] = Math.cos(theta) * radius;
      particlePositions[i * 3 + 1] = y;
      particlePositions[i * 3 + 2] = Math.sin(theta) * radius;
    }

    const particleGeometry = new THREE.BufferGeometry();
    particleGeometry.setAttribute(
      "position",
      new THREE.BufferAttribute(particlePositions, 3)
    );

    const particles = new THREE.Points(
      particleGeometry,
      new THREE.PointsMaterial({
        color: 0xe1c2ff,
        size: 0.022,
        transparent: true,
        opacity: 0.46,
        depthWrite: false
      })
    );
    world.add(particles);

    /* Lighting */
    scene.add(new THREE.AmbientLight(0x6a467e, 1.25));

    const key = new THREE.DirectionalLight(0xffddc3, 3.1);
    key.position.set(-3.2, 3.3, 4.5);
    scene.add(key);

    const purple = new THREE.PointLight(0x9255ff, 3.6, 14);
    purple.position.set(3.2, 0.9, 3.5);
    scene.add(purple);

    const warm = new THREE.PointLight(0xff7d43, 2.0, 12);
    warm.position.set(-3.4, -2.1, 2.7);
    scene.add(warm);

    /* ---------------------------
       INTERACTION
    ---------------------------- */

    let targetRotationX = 0;
    let targetRotationY = 0;
    let currentRotationX = 0;
    let currentRotationY = 0;

    const updatePointer = (event) => {
      const rect = stage.getBoundingClientRect();
      if (!rect.width || !rect.height) return;

      const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      const y = ((event.clientY - rect.top) / rect.height) * 2 - 1;

      targetRotationY = x * 0.33;
      targetRotationX = y * 0.18;
    };

    stage.addEventListener("pointermove", updatePointer, { passive: true });
    stage.addEventListener("pointerleave", () => {
      targetRotationX = 0;
      targetRotationY = 0;
    });

    function resize() {
      const rect = mount.getBoundingClientRect();
      if (rect.width < 2 || rect.height < 2) return;

      renderer.setSize(rect.width, rect.height, false);
      camera.aspect = rect.width / rect.height;
      camera.updateProjectionMatrix();
    }

    resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(mount);
    resize();

    visibilityObserver = new IntersectionObserver(
      ([entry]) => {
        isVisible = Boolean(entry?.isIntersecting);
      },
      { threshold: 0.01 }
    );
    visibilityObserver.observe(stage);

    const clock = new THREE.Clock();
    let firstFrameRendered = false;

    function animate() {
      if (!running) return;
      frameId = requestAnimationFrame(animate);

      if (!isVisible || document.hidden) {
        clock.getDelta();
        return;
      }

      const dt = Math.min(clock.getDelta(), 0.035);
      const elapsed = clock.elapsedTime;

      if (!reducedMotion) {
        planet.rotation.y += dt * 0.13;
        atmosphere.rotation.y -= dt * 0.025;
        orbitWarm.rotation.z += dt * 0.1;
        orbitPurple.rotation.z -= dt * 0.075;
        particles.rotation.y += dt * 0.018;

        moonA.position.set(
          Math.cos(elapsed * 0.74) * 2.05,
          Math.sin(elapsed * 0.49) * 0.65,
          Math.sin(elapsed * 0.74) * 2.05
        );

        moonB.position.set(
          Math.cos(-elapsed * 0.54 + 1.4) * 1.9,
          Math.sin(elapsed * 0.37 + 0.8) * 0.9,
          Math.sin(-elapsed * 0.54 + 1.4) * 1.9
        );
      }

      currentRotationX += (targetRotationX - currentRotationX) * 0.055;
      currentRotationY += (targetRotationY - currentRotationY) * 0.055;

      world.rotation.x = currentRotationX;
      world.rotation.y = currentRotationY;

      renderer.render(scene, camera);

      /* Hide fallback only after WebGL actually renders a frame. */
      if (!firstFrameRendered) {
        firstFrameRendered = true;
        mount.classList.add("ready");
      }
    }

    animate();

    window.addEventListener("pagehide", () => {
      running = false;
      if (frameId) cancelAnimationFrame(frameId);
      resizeObserver?.disconnect();
      visibilityObserver?.disconnect();
      renderer.dispose();
    }, { once: true });
  } catch (error) {
    failGracefully(error);
  }
}
