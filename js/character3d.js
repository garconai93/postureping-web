// Realistic 3D character with proper proportions, soft materials, eased animations
(function () {
  if (typeof THREE === 'undefined') return;

  // ---- PALETTE ----
  const SKIN = 0xf0c8a8;
  const SKIN_SHADOW = 0xc99878;
  const HAIR = 0x2a1810;
  const SHIRT = 0x3ddc97;
  const SHIRT_DARK = 0x1a8a5e;
  const PANTS = 0x1f2940;
  const PANTS_DARK = 0x0f1424;
  const EYE_WHITE = 0xfafafa;
  const IRIS = 0x4a6a5a;
  const PUPIL = 0x0a0a0a;
  const LIP = 0xc0685a;
  const EYEBROW = 0x2a1810;

  // ---- HELPERS ----

  // Easing function: smooth in-out
  function ease(t) {
    return t * t * (3 - 2 * t); // smoothstep
  }
  function easeInOut(t) {
    return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  }

  // Procedural noise texture (canvas)
  function makeNoiseTexture(baseR, baseG, baseB, variance = 20, size = 128) {
    const canvas = document.createElement('canvas');
    canvas.width = size; canvas.height = size;
    const ctx = canvas.getContext('2d');
    const img = ctx.createImageData(size, size);
    for (let i = 0; i < size * size; i++) {
      const v = (Math.random() - 0.5) * variance;
      img.data[i * 4] = Math.max(0, Math.min(255, baseR + v));
      img.data[i * 4 + 1] = Math.max(0, Math.min(255, baseG + v));
      img.data[i * 4 + 2] = Math.max(0, Math.min(255, baseB + v));
      img.data[i * 4 + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    return tex;
  }

  function makeSoftMaterial(color, opts = {}) {
    const c = new THREE.Color(color);
    return new THREE.MeshStandardMaterial({
      color,
      roughness: opts.roughness ?? 0.85,
      metalness: opts.metalness ?? 0.0,
      flatShading: false,
      ...opts
    });
  }

  function makeMesh(geom, color, opts = {}) {
    const m = new THREE.Mesh(geom, makeSoftMaterial(color, opts));
    m.castShadow = opts.shadow !== false;
    m.receiveShadow = opts.shadow !== false;
    return m;
  }

  // Build head with realistic proportions (1/8 of total height for head)
  function buildHead() {
    const headGroup = new THREE.Group();

    // Skull - slightly elongated sphere
    const skullGeom = new THREE.SphereGeometry(0.22, 28, 22);
    skullGeom.scale(1, 1.15, 1.05); // slightly taller and deeper
    const skull = makeMesh(skullGeom, SKIN, { roughness: 0.7 });
    headGroup.add(skull);

    // Jaw (smaller, lower)
    const jawGeom = new THREE.SphereGeometry(0.16, 24, 18, 0, Math.PI * 2, 0, Math.PI / 2);
    const jaw = makeMesh(jawGeom, SKIN_SHADOW, { roughness: 0.8 });
    jaw.position.set(0, -0.12, 0.04);
    jaw.rotation.x = Math.PI;
    headGroup.add(jaw);

    // Chin
    const chinGeom = new THREE.SphereGeometry(0.07, 16, 12);
    const chin = makeMesh(chinGeom, SKIN_SHADOW);
    chin.position.set(0, -0.16, 0.13);
    headGroup.add(chin);

    // Nose
    const noseGroup = new THREE.Group();
    const noseGeom = new THREE.ConeGeometry(0.04, 0.08, 12);
    const nose = makeMesh(noseGeom, SKIN_SHADOW);
    nose.rotation.x = Math.PI / 2;
    nose.position.z = 0.04;
    noseGroup.add(nose);
    // Nose bridge
    const bridgeGeom = new THREE.BoxGeometry(0.04, 0.08, 0.05);
    const bridge = makeMesh(bridgeGeom, SKIN);
    bridge.position.set(0, 0.02, 0.16);
    noseGroup.add(bridge);
    // Nostrils (small dots)
    for (let s of [-1, 1]) {
      const nostrilGeom = new THREE.SphereGeometry(0.012, 8, 6);
      const nostril = makeMesh(nostrilGeom, SKIN_SHADOW);
      nostril.position.set(s * 0.02, -0.04, 0.18);
      noseGroup.add(nostril);
    }
    noseGroup.position.set(0, -0.06, 0);
    headGroup.add(noseGroup);

    // Hair (top of head, shaped)
    const hairGroup = new THREE.Group();
    const hairTopGeom = new THREE.SphereGeometry(0.225, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.55);
    const hairTop = makeMesh(hairTopGeom, HAIR, { roughness: 0.95 });
    hairTop.position.y = 0.02;
    hairGroup.add(hairTop);

    // Sideburns / hair sides
    for (let s of [-1, 1]) {
      const sideGeom = new THREE.SphereGeometry(0.07, 12, 10);
      const side = makeMesh(sideGeom, HAIR);
      side.position.set(s * 0.18, -0.05, -0.02);
      hairGroup.add(side);
    }
    // Back hair
    const backGeom = new THREE.SphereGeometry(0.18, 16, 12);
    const back = makeMesh(backGeom, HAIR);
    back.position.set(0, 0.05, -0.12);
    back.scale.set(1.2, 1, 0.6);
    hairGroup.add(back);
    headGroup.add(hairGroup);

    // Eyebrows (curved cylinders)
    for (let s of [-1, 1]) {
      const browGroup = new THREE.Group();
      const browGeom = new THREE.CylinderGeometry(0.008, 0.008, 0.08, 8);
      const brow = makeMesh(browGeom, EYEBROW);
      brow.rotation.z = Math.PI / 2;
      brow.rotation.y = s * 0.15;
      browGroup.add(brow);
      browGroup.position.set(s * 0.075, 0.06, 0.19);
      headGroup.add(browGroup);
    }

    // Eyes (deep set, with eyelids)
    const eyeData = [];
    for (let s of [-1, 1]) {
      const eyeGroup = new THREE.Group();
      // Eye socket (slight recess)
      const socketGeom = new THREE.SphereGeometry(0.045, 16, 12);
      const socket = makeMesh(socketGeom, SKIN_SHADOW);
      socket.position.set(0, 0, -0.005);
      eyeGroup.add(socket);
      // Eye white
      const whiteGeom = new THREE.SphereGeometry(0.038, 16, 12);
      const white = makeMesh(whiteGeom, EYE_WHITE, { roughness: 0.2 });
      white.position.set(0, 0, 0.02);
      eyeGroup.add(white);
      // Iris
      const irisGeom = new THREE.SphereGeometry(0.022, 14, 10);
      const iris = makeMesh(irisGeom, IRIS, { roughness: 0.3 });
      iris.position.set(0, 0, 0.04);
      eyeGroup.add(iris);
      // Pupil
      const pupilGeom = new THREE.SphereGeometry(0.011, 10, 8);
      const pupil = makeMesh(pupilGeom, PUPIL, { roughness: 0.1 });
      pupil.position.set(0, 0, 0.052);
      eyeGroup.add(pupil);
      // Eye highlight (specular)
      const highlightGeom = new THREE.SphereGeometry(0.006, 8, 6);
      const highlight = new THREE.Mesh(highlightGeom, new THREE.MeshBasicMaterial({ color: 0xffffff }));
      highlight.position.set(0.008, 0.01, 0.058);
      eyeGroup.add(highlight);
      // Upper eyelid
      const lidGeom = new THREE.SphereGeometry(0.04, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2);
      const lid = makeMesh(lidGeom, SKIN);
      lid.position.set(0, 0, 0.005);
      lid.scale.y = 1;
      eyeGroup.add(lid);

      eyeGroup.position.set(s * 0.075, 0.02, 0.16);
      headGroup.add(eyeGroup);
      eyeData.push({ group: eyeGroup, lid });
    }

    // Mouth
    const mouthGroup = new THREE.Group();
    // Upper lip
    const upperLipGeom = new THREE.TorusGeometry(0.035, 0.008, 8, 12, Math.PI);
    const upperLip = makeMesh(upperLipGeom, LIP);
    upperLip.position.set(0, 0, 0.02);
    upperLip.rotation.x = Math.PI;
    mouthGroup.add(upperLip);
    // Lower lip
    const lowerLipGeom = new THREE.TorusGeometry(0.03, 0.01, 8, 12, Math.PI);
    const lowerLip = makeMesh(lowerLipGeom, LIP);
    lowerLip.position.set(0, -0.015, 0.02);
    lowerLip.rotation.x = 0;
    mouthGroup.add(lowerLip);
    mouthGroup.position.set(0, -0.10, 0.17);
    headGroup.add(mouthGroup);

    // Ears
    for (let s of [-1, 1]) {
      const earGeom = new THREE.SphereGeometry(0.04, 12, 8);
      const ear = makeMesh(earGeom, SKIN_SHADOW);
      ear.position.set(s * 0.21, -0.02, 0);
      ear.scale.set(0.6, 1, 0.7);
      headGroup.add(ear);
    }

    return { group: headGroup, eyes: eyeData, jaw, mouth: mouthGroup };
  }

  // Build body with realistic proportions (head = 1/7.5 of total)
  function buildBody() {
    const root = new THREE.Group();

    // HIPS - smaller, more anatomical
    const hipsGroup = new THREE.Group();
    const hipsGeom = new THREE.CylinderGeometry(0.22, 0.25, 0.35, 16);
    const hips = makeMesh(hipsGeom, PANTS_DARK);
    hips.position.y = 0;
    hipsGroup.add(hips);
    root.add(hipsGroup);

    // TORSO pivot (for twists)
    const torsoGroup = new THREE.Group();
    torsoGroup.position.y = 0.2;
    hipsGroup.add(torsoGroup);

    // Chest - tapered cylinder
    const chestGeom = new THREE.CylinderGeometry(0.28, 0.32, 0.5, 18);
    const chest = makeMesh(chestGeom, SHIRT, { roughness: 0.75 });
    chest.position.y = 0.4;
    chest.scale.set(1.05, 1, 0.85); // wider, flatter front-back
    torsoGroup.add(chest);

    // Belly (slight curve)
    const bellyGeom = new THREE.SphereGeometry(0.26, 16, 12);
    const belly = makeMesh(bellyGeom, SHIRT_DARK, { roughness: 0.8 });
    belly.position.set(0, 0.3, 0.12);
    belly.scale.set(0.95, 1.1, 0.5);
    belly.rotation.x = Math.PI / 2;
    torsoGroup.add(belly);

    // Collar (small detail at neck base)
    const collarGeom = new THREE.TorusGeometry(0.14, 0.025, 8, 16);
    const collar = makeMesh(collarGeom, SHIRT_DARK);
    collar.position.y = 0.65;
    collar.rotation.x = Math.PI / 2;
    torsoGroup.add(collar);

    // SHOULDERS - anatomical (clavicle area)
    const shoulderData = {};
    for (let side of ['left', 'right']) {
      const s = side === 'left' ? -1 : 1;
      const shoulderGroup = new THREE.Group();

      // Shoulder cap (sphere flattened)
      const capGeom = new THREE.SphereGeometry(0.13, 16, 12);
      const cap = makeMesh(capGeom, SHIRT);
      cap.scale.set(1, 0.9, 0.85);
      shoulderGroup.add(cap);

      // Clavicle hint
      const clavGeom = new THREE.BoxGeometry(0.18, 0.04, 0.06);
      const clav = makeMesh(clavGeom, SHIRT_DARK);
      clav.position.set(s * 0.08, 0.06, 0.05);
      shoulderGroup.add(clav);

      shoulderGroup.position.set(s * 0.32, 0.7, 0);
      torsoGroup.add(shoulderGroup);
      shoulderData[side] = shoulderGroup;
    }

    // ARMS
    const armData = {};
    for (let side of ['left', 'right']) {
      const s = side === 'left' ? -1 : 1;
      const armGroup = new THREE.Group();

      // Upper arm (slightly conical, taper)
      const upperGeom = new THREE.CylinderGeometry(0.08, 0.10, 0.4, 14);
      const upper = makeMesh(upperGeom, SHIRT);
      upper.position.y = -0.2;
      armGroup.add(upper);

      // Elbow (sphere)
      const elbowGeom = new THREE.SphereGeometry(0.085, 14, 10);
      const elbow = makeMesh(elbowGeom, SKIN, { roughness: 0.7 });
      elbow.position.y = -0.4;
      armGroup.add(elbow);

      // Forearm (taper to wrist)
      const foreGeom = new THREE.CylinderGeometry(0.07, 0.085, 0.35, 14);
      const fore = makeMesh(foreGeom, SKIN, { roughness: 0.7 });
      fore.position.y = -0.58;
      armGroup.add(fore);

      // Wrist
      const wristGeom = new THREE.CylinderGeometry(0.06, 0.07, 0.06, 12);
      const wrist = makeMesh(wristGeom, SKIN, { roughness: 0.7 });
      wrist.position.y = -0.78;
      armGroup.add(wrist);

      // Hand (palm)
      const palmGeom = new THREE.BoxGeometry(0.10, 0.13, 0.04);
      const palm = makeMesh(palmGeom, SKIN, { roughness: 0.8 });
      palm.position.y = -0.85;
      armGroup.add(palm);

      // Fingers (4 per hand)
      for (let f = 0; f < 4; f++) {
        const fingerGeom = new THREE.CylinderGeometry(0.012, 0.014, 0.07, 6);
        const finger = makeMesh(fingerGeom, SKIN, { roughness: 0.8 });
        finger.position.set((f - 1.5) * 0.025, -0.95, 0);
        armGroup.add(finger);
      }
      // Thumb
      const thumbGeom = new THREE.CylinderGeometry(0.015, 0.018, 0.06, 6);
      const thumb = makeMesh(thumbGeom, SKIN, { roughness: 0.8 });
      thumb.position.set(s * 0.06, -0.86, 0.02);
      thumb.rotation.z = s * 0.5;
      armGroup.add(thumb);

      armGroup.position.set(s * 0.32, 0.7, 0);
      armGroup.rotation.z = s * 0.15; // natural slight outward angle
      torsoGroup.add(armGroup);
      armData[side] = { group: armGroup, elbow, fore, hand: palm };
    }

    // NECK (slim)
    const neckGroup = new THREE.Group();
    neckGroup.position.y = 0.66;
    torsoGroup.add(neckGroup);
    const neckGeom = new THREE.CylinderGeometry(0.08, 0.10, 0.14, 14);
    const neck = makeMesh(neckGeom, SKIN, { roughness: 0.7 });
    neck.position.y = 0.07;
    neckGroup.add(neck);

    // Neck shading cylinder
    const neckShadowGeom = new THREE.CylinderGeometry(0.085, 0.10, 0.14, 14, 1, true);
    const neckShadow = makeMesh(neckShadowGeom, SKIN_SHADOW, { roughness: 0.9, side: THREE.BackSide });
    neckShadow.position.y = 0.07;
    neckGroup.add(neckShadow);

    // HEAD
    const head = buildHead();
    head.group.position.y = 0.20;
    neckGroup.add(head.group);

    // LEGS (sitting position - bent forward)
    for (let side of ['left', 'right']) {
      const s = side === 'left' ? -1 : 1;
      const legGroup = new THREE.Group();

      // Thigh (forward bent, like sitting)
      const thighGeom = new THREE.CylinderGeometry(0.14, 0.12, 0.5, 14);
      const thigh = makeMesh(thighGeom, PANTS);
      thigh.position.set(0, -0.25, 0.25);
      thigh.rotation.x = -Math.PI / 2.5;
      legGroup.add(thigh);

      // Knee
      const kneeGeom = new THREE.SphereGeometry(0.12, 14, 10);
      const knee = makeMesh(kneeGeom, PANTS_DARK);
      knee.position.set(0, -0.5, 0.5);
      legGroup.add(knee);

      // Shin
      const shinGeom = new THREE.CylinderGeometry(0.10, 0.08, 0.55, 14);
      const shin = makeMesh(shinGeom, PANTS);
      shin.position.set(0, -0.75, 0.35);
      shin.rotation.x = Math.PI / 9;
      legGroup.add(shin);

      // Ankle
      const ankleGeom = new THREE.SphereGeometry(0.08, 12, 8);
      const ankle = makeMesh(ankleGeom, PANTS_DARK);
      ankle.position.set(0, -1.0, 0.25);
      legGroup.add(ankle);

      legGroup.position.set(s * 0.16, 0, 0);
      hipsGroup.add(legGroup);
    }

    // CHAIR (hint - simple seat back)
    const chairBackGeom = new THREE.BoxGeometry(0.7, 0.7, 0.08);
    const chairBack = makeMesh(chairBackGeom, PANTS_DARK, { roughness: 0.95 });
    chairBack.position.set(0, 0.4, -0.35);
    chairBack.receiveShadow = true;
    hipsGroup.add(chairBack);

    return {
      root, hips: hipsGroup, torso: torsoGroup, chest, belly, neckGroup, head,
      shoulders: shoulderData, arms: armData
    };
  }

  // ---- SCENE SETUP ----
  function createScene(canvas) {
    const w = canvas.clientWidth || 400;
    const h = canvas.clientHeight || 320;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x141a2e);
    scene.fog = new THREE.Fog(0x141a2e, 5, 15);

    const camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 100);
    camera.position.set(0, 0.4, 3.0);
    camera.lookAt(0, 0.4, 0);

    const renderer = new THREE.WebGLRenderer({
      canvas, alpha: true, antialias: true
    });
    renderer.setSize(w, h, false);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;

    // LIGHTS - 3-point + rim
    const ambient = new THREE.AmbientLight(0xfff5e8, 0.45);
    scene.add(ambient);

    // Key (warm, top-right)
    const key = new THREE.DirectionalLight(0xfff0d8, 1.3);
    key.position.set(2.5, 3.5, 2.5);
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    key.shadow.camera.near = 0.5;
    key.shadow.camera.far = 12;
    key.shadow.camera.left = -2.5;
    key.shadow.camera.right = 2.5;
    key.shadow.camera.top = 3;
    key.shadow.camera.bottom = -1;
    key.shadow.bias = -0.0005;
    key.shadow.radius = 4;
    scene.add(key);

    // Fill (cool, left)
    const fill = new THREE.DirectionalLight(0xa8d8ff, 0.35);
    fill.position.set(-2, 1, 1);
    scene.add(fill);

    // Rim (back, accent color)
    const rim = new THREE.DirectionalLight(0x3ddc97, 0.6);
    rim.position.set(0, 1.5, -3);
    scene.add(rim);

    // Bottom bounce (subtle)
    const bounce = new THREE.HemisphereLight(0xfff5e8, 0x141a2e, 0.2);
    scene.add(bounce);

    // Floor with gradient (subtle reflection)
    const floorGeom = new THREE.CircleGeometry(2.5, 32);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x141a2e, roughness: 0.7, metalness: 0.1
    });
    const floor = new THREE.Mesh(floorGeom, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.6;
    floor.receiveShadow = true;
    scene.add(floor);

    const body = buildBody();
    scene.add(body.root);
    console.log('[Character3D] body built, scene children:', scene.children.length, 'body root children:', body.root.children.length);

    // Scale down slightly to fit frame nicely
    body.root.scale.set(1.15, 1.15, 1.15);
    body.root.position.y = -0.1;

    function resize() {
      const w2 = canvas.clientWidth || 400;
      const h2 = canvas.clientHeight || 320;
      camera.aspect = w2 / h2;
      camera.updateProjectionMatrix();
      renderer.setSize(w2, h2, false);
    }

    return { scene, camera, renderer, body, resize };
  }

  // ---- ANIMATIONS ----
  const ANIMATIONS = {
    neck: function (t, b, phaseOut) {
      // Smooth left-right with eased pause at extremes
      const cycle = 4; // seconds
      const phase = (t % cycle) / cycle; // 0..1
      // Half cycle ease in-out, hold at extremes
      let angle = 0;
      if (phase < 0.4) {
        angle = easeInOut(phase / 0.4) * 0.4 - 0.4; // -0.4 to 0
      } else if (phase < 0.6) {
        angle = 0; // hold at center? actually let me redo
      }
      // Simpler: oscillation with eased transitions
      const wave = Math.sin(t * (Math.PI * 2 / 4));
      angle = wave * 0.35;
      b.head.group.rotation.y = angle;
      b.head.group.rotation.z = Math.sin(t * 0.6) * 0.04;
      b.head.group.rotation.x = Math.sin(t * 0.4) * 0.02;
      // Slight neck lean
      b.neckGroup.rotation.y = angle * 0.3;
    },

    shoulders: function (t, b) {
      // Roll backwards, smooth
      const cycle = 5;
      const wave = Math.sin(t * (Math.PI * 2 / cycle));
      // Easing - slower at top, faster at bottom
      const eased = Math.sign(wave) * Math.pow(Math.abs(wave), 0.7);
      // Shoulders move up-down in circle
      b.shoulders.left.group.position.y = 0.7 + Math.sin(t * (Math.PI * 2 / cycle)) * 0.06;
      b.shoulders.right.group.position.y = 0.7 - Math.sin(t * (Math.PI * 2 / cycle)) * 0.06;
      // Arms swing forward-back slightly
      b.arms.left.group.rotation.x = eased * 0.25;
      b.arms.right.group.rotation.x = eased * 0.25;
      // Arms slight outward
      b.arms.left.group.rotation.z = -0.15 + eased * 0.1;
      b.arms.right.group.rotation.z = 0.15 - eased * 0.1;
    },

    back: function (t, b) {
      // Twist with eased motion
      const cycle = 5;
      const wave = Math.sin(t * (Math.PI * 2 / cycle));
      const angle = wave * 0.4;
      b.torso.rotation.y = angle;
      b.head.group.rotation.y = angle * 0.4;
      b.arms.left.group.rotation.z = -0.15 + angle * 0.3;
      b.arms.right.group.rotation.z = 0.15 + angle * 0.3;
    },

    eyes: function (t, b) {
      // Look up slightly + periodic blinking
      b.head.group.rotation.x = -0.12 + Math.sin(t * 0.3) * 0.03;

      // Blink every 3-5 seconds
      const blinkPhase = t % 4;
      let lidScale = 1;
      if (blinkPhase > 3.5 && blinkPhase < 3.6) lidScale = 0.1;
      else if (blinkPhase > 3.6 && blinkPhase < 3.75) lidScale = 0.05;
      else if (blinkPhase > 3.75 && blinkPhase < 3.85) lidScale = 0.4;
      b.head.eyes.forEach(e => e.lid.scale.y = lidScale);
    },

    wrist: function (t, b) {
      // Hands rotate around wrist axis
      const cycle = 3;
      const wave = Math.sin(t * (Math.PI * 2 / cycle));
      b.arms.left.hand.rotation.z = wave * 0.9;
      b.arms.right.hand.rotation.z = -wave * 0.9;
      b.arms.left.fore.rotation.z = wave * 0.15;
      b.arms.right.fore.rotation.z = -wave * 0.15;
    },

    breath: function (t, b) {
      // 4-7-8 breathing cycle (19s)
      const cycle = t % 19;
      let scale = 1;
      let phase = 'Inspiră';
      let color = 0x3ddc97;
      if (cycle < 4) {
        const p = cycle / 4;
        scale = 1 + easeInOut(p) * 0.18;
        phase = 'Inspiră';
        color = 0x3ddc97;
      } else if (cycle < 11) {
        scale = 1.18;
        phase = 'Ține';
        color = 0xffd166;
      } else {
        const p = (cycle - 11) / 8;
        scale = 1.18 - easeInOut(p) * 0.18;
        phase = 'Expiră';
        color = 0x22c1c3;
      }
      b.chest.scale.set(scale, scale * 1.02, scale);
      b.belly.scale.set(1, scale * 1.05, 1);
      // Head moves slightly with breath
      b.head.group.position.y = 0.20 + (scale - 1) * 0.04;
      return { phase, color };
    }
  };

  // Idle animation (always on, subtle)
  function applyIdle(t, b) {
    // Gentle breathing always
    const breathWave = Math.sin(t * 0.8);
    if (!ANIMATIONS[window.__currentEx]) { // skip if specific anim handles it
      b.chest.scale.set(1 + breathWave * 0.02, 1 + breathWave * 0.02, 1 + breathWave * 0.02);
    }
    // Subtle body sway
    b.root.rotation.z = Math.sin(t * 0.3) * 0.01;
    // Micro head movement
    b.head.group.rotation.x += Math.sin(t * 0.5) * 0.01;
    b.head.group.rotation.y += Math.sin(t * 0.7) * 0.005;
  }

  let active = null;

  function init(canvas) {
    if (active) return active;
    let ctx;
    try {
      ctx = createScene(canvas);
    } catch (e) {
      console.error('[Character3D] createScene failed:', e);
      throw e;
    }
    let currentExercise = 'neck';
    let phaseData = { phase: '', color: 0x3ddc97 };
    let rafId = null;
    const startTime = performance.now();

    // Camera orbit state
    let cameraAngle = 0;

    function loop(now) {
      const t = (now - startTime) / 1000;

      // Camera subtle orbit
      cameraAngle += 0.0003;
      ctx.camera.position.x = Math.sin(cameraAngle) * 0.3;
      ctx.camera.position.z = 3.0 + Math.cos(cameraAngle) * 0.1;
      ctx.camera.lookAt(0, 0.4, 0);

      window.__currentEx = currentExercise;
      const anim = ANIMATIONS[currentExercise];
      if (anim) {
        const result = anim(t, ctx.body);
        if (result) phaseData = result;
      }
      applyIdle(t, ctx.body);

      ctx.renderer.render(ctx.scene, ctx.camera);
      rafId = requestAnimationFrame(loop);
    }

    rafId = requestAnimationFrame(loop);

    const ro = new ResizeObserver(() => ctx.resize());
    ro.observe(canvas);

    active = {
      setExercise: (id) => { currentExercise = id; },
      getPhase: () => phaseData,
      destroy: () => {
        cancelAnimationFrame(rafId);
        ro.disconnect();
        ctx.renderer.dispose();
      }
    };
    return active;
  }

  window.Character3D = { init };
})();
