// Procedural 3D character built from primitives
// Uses Three.js for rendering, lighting, and animation
// Exposes: window.Character3D = { create(canvas), animate(id), getCurrent() }

(function () {
  // Check Three is loaded
  if (typeof THREE === 'undefined') {
    console.error('[Character3D] THREE not loaded');
    return;
  }

  // Colors / skin shader
  const SKIN_COLOR = 0xe8c39e;
  const HAIR_COLOR = 0x3a2820;
  const SHIRT_COLOR = 0x3ddc97;
  const SHIRT_DARK = 0x22c1c3;
  const TILT_DARK = 0x141a2e;

  // Helpers
  function makeMesh(geom, color, opts = {}) {
    const mat = new THREE.MeshStandardMaterial({
      color,
      roughness: opts.roughness ?? 0.7,
      metalness: opts.metalness ?? 0.05,
      flatShading: opts.flat ?? false
    });
    const m = new THREE.Mesh(geom, mat);
    m.castShadow = opts.shadow !== false;
    m.receiveShadow = opts.shadow !== false;
    return m;
  }

  function buildSkeleton() {
    const root = new THREE.Group();

    // HIPS (pelvis)
    const hips = new THREE.Group();
    hips.position.y = 0;
    root.add(hips);

    // Lower torso (pelvis) - slightly darker
    const pelvisGeom = new THREE.BoxGeometry(0.9, 0.4, 0.5);
    const pelvis = makeMesh(pelvisGeom, TILT_DARK, { roughness: 0.9 });
    pelvis.position.y = 0.2;
    hips.add(pelvis);

    // UPPER TORSO (chest) - pivot for twist
    const torso = new THREE.Group();
    torso.position.y = 0.4;
    hips.add(torso);

    const chestGeom = new THREE.BoxGeometry(1.0, 0.8, 0.55);
    const chest = makeMesh(chestGeom, SHIRT_COLOR, { roughness: 0.6 });
    chest.position.y = 0.4;
    torso.add(chest);

    // Belly highlight (front of shirt)
    const bellyGeom = new THREE.SphereGeometry(0.4, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2);
    const belly = makeMesh(bellyGeom, SHIRT_DARK, { roughness: 0.5 });
    belly.position.set(0, 0.3, 0.18);
    belly.rotation.x = Math.PI / 2;
    torso.add(belly);

    // SHOULDERS (spheres for joints)
    const shoulderGeom = new THREE.SphereGeometry(0.18, 16, 12);
    const leftShoulder = makeMesh(shoulderGeom, SHIRT_COLOR);
    leftShoulder.position.set(-0.55, 0.75, 0);
    torso.add(leftShoulder);

    const rightShoulder = makeMesh(shoulderGeom, SHIRT_COLOR);
    rightShoulder.position.set(0.55, 0.75, 0);
    torso.add(rightShoulder);

    // ARMS
    function makeArm(side) {
      const armGroup = new THREE.Group();
      const xSign = side === 'left' ? -1 : 1;

      // Upper arm (cylinder)
      const upperGeom = new THREE.CylinderGeometry(0.12, 0.13, 0.55, 12);
      const upper = makeMesh(upperGeom, SHIRT_COLOR);
      upper.position.y = -0.275;
      armGroup.add(upper);

      // Elbow joint
      const elbowGeom = new THREE.SphereGeometry(0.13, 12, 10);
      const elbow = makeMesh(elbowGeom, SKIN_COLOR);
      elbow.position.y = -0.55;
      armGroup.add(elbow);

      // Forearm
      const foreGeom = new THREE.CylinderGeometry(0.1, 0.11, 0.5, 12);
      const fore = makeMesh(foreGeom, SKIN_COLOR);
      fore.position.y = -0.8;
      armGroup.add(fore);

      // Hand
      const handGeom = new THREE.SphereGeometry(0.1, 10, 8);
      const hand = makeMesh(handGeom, SKIN_COLOR);
      hand.position.y = -1.05;
      hand.scale.set(1, 0.7, 0.6);
      armGroup.add(hand);

      armGroup.position.set(xSign * 0.55, 0.75, 0);
      return { group: armGroup, elbow, fore, hand };
    }

    const leftArm = makeArm('left');
    const rightArm = makeArm('right');
    torso.add(leftArm.group);
    torso.add(rightArm.group);

    // NECK (pivot for head rotation)
    const neckGroup = new THREE.Group();
    neckGroup.position.y = 0.85;
    torso.add(neckGroup);

    const neckGeom = new THREE.CylinderGeometry(0.13, 0.16, 0.18, 12);
    const neck = makeMesh(neckGeom, SKIN_COLOR);
    neck.position.y = 0.09;
    neckGroup.add(neck);

    // HEAD (pivot for rotation around neck base)
    const headGroup = new THREE.Group();
    headGroup.position.y = 0.18;
    neckGroup.add(headGroup);

    const headGeom = new THREE.SphereGeometry(0.32, 24, 18);
    const head = makeMesh(headGeom, SKIN_COLOR);
    headGroup.add(head);

    // Hair (top cap)
    const hairGeom = new THREE.SphereGeometry(0.33, 20, 14, 0, Math.PI * 2, 0, Math.PI / 2.2);
    const hair = makeMesh(hairGeom, HAIR_COLOR, { roughness: 0.9 });
    hair.position.y = 0.04;
    headGroup.add(hair);

    // Eyes
    function makeEye(x) {
      const eyeGroup = new THREE.Group();
      const eyeWhiteGeom = new THREE.SphereGeometry(0.06, 12, 8);
      const eyeWhite = makeMesh(eyeWhiteGeom, 0xffffff, { roughness: 0.3 });
      eyeGroup.add(eyeWhite);
      const irisGeom = new THREE.SphereGeometry(0.035, 10, 8);
      const iris = makeMesh(irisGeom, 0x2a4a3a);
      iris.position.z = 0.04;
      eyeGroup.add(iris);
      const pupilGeom = new THREE.SphereGeometry(0.018, 8, 6);
      const pupil = makeMesh(pupilGeom, 0x000000);
      pupil.position.z = 0.06;
      eyeGroup.add(pupil);
      eyeGroup.position.set(x, 0.05, 0.27);
      return eyeGroup;
    }
    const leftEye = makeEye(-0.1);
    const rightEye = makeEye(0.1);
    headGroup.add(leftEye);
    headGroup.add(rightEye);

    // Eyelids (for blink) - flat planes
    const lidGeom = new THREE.SphereGeometry(0.065, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2);
    const leftLid = makeMesh(lidGeom, SKIN_COLOR);
    leftLid.rotation.x = Math.PI / 2;
    leftLid.position.set(-0.1, 0.05, 0.27);
    leftLid.scale.y = 0.001; // closed
    headGroup.add(leftLid);
    const rightLid = makeMesh(lidGeom, SKIN_COLOR);
    rightLid.rotation.x = Math.PI / 2;
    rightLid.position.set(0.1, 0.05, 0.27);
    rightLid.scale.y = 0.001;
    headGroup.add(rightLid);

    // Mouth
    const mouthGeom = new THREE.BoxGeometry(0.08, 0.015, 0.02);
    const mouth = makeMesh(mouthGeom, 0x8a4a3a);
    mouth.position.set(0, -0.08, 0.3);
    headGroup.add(mouth);

    // LEGS (sitting position - bent forward)
    function makeLeg(side) {
      const legGroup = new THREE.Group();
      const xSign = side === 'left' ? -1 : 1;

      // Thigh (forward bent)
      const thighGeom = new THREE.CylinderGeometry(0.18, 0.16, 0.5, 12);
      const thigh = makeMesh(thighGeom, TILT_DARK);
      thigh.position.set(0, -0.25, 0.3);
      thigh.rotation.x = -Math.PI / 3;
      legGroup.add(thigh);

      // Knee
      const kneeGeom = new THREE.SphereGeometry(0.16, 12, 10);
      const knee = makeMesh(kneeGeom, TILT_DARK);
      knee.position.set(0, -0.5, 0.55);
      legGroup.add(knee);

      // Shin (going down)
      const shinGeom = new THREE.CylinderGeometry(0.14, 0.13, 0.5, 12);
      const shin = makeMesh(shinGeom, TILT_DARK);
      shin.position.set(0, -0.75, 0.45);
      shin.rotation.x = Math.PI / 8;
      legGroup.add(shin);

      legGroup.position.set(xSign * 0.22, 0, 0);
      return legGroup;
    }

    const leftLeg = makeLeg('left');
    const rightLeg = makeLeg('right');
    hips.add(leftLeg);
    hips.add(rightLeg);

    return {
      root, hips, torso, chest, belly, neckGroup, headGroup, head,
      leftShoulder, rightShoulder, leftArm, rightArm,
      leftEye, rightEye, leftLid, rightLid
    };
  }

  function createScene(canvas) {
    const w = canvas.clientWidth || 400;
    const h = canvas.clientHeight || 400;

    const scene = new THREE.Scene();
    scene.background = null; // transparent canvas

    const camera = new THREE.PerspectiveCamera(35, w / h, 0.1, 100);
    camera.position.set(0, 1.0, 4.5);
    camera.lookAt(0, 0.7, 0);

    const renderer = new THREE.WebGLRenderer({
      canvas, alpha: true, antialias: true
    });
    renderer.setSize(w, h, false);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    // Lighting
    const ambient = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambient);

    const key = new THREE.DirectionalLight(0xffffff, 1.2);
    key.position.set(2, 3, 2);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    key.shadow.camera.near = 0.5;
    key.shadow.camera.far = 10;
    key.shadow.camera.left = -2;
    key.shadow.camera.right = 2;
    key.shadow.camera.top = 2;
    key.shadow.camera.bottom = -1;
    key.shadow.bias = -0.001;
    scene.add(key);

    const fill = new THREE.DirectionalLight(0x3ddc97, 0.4);
    fill.position.set(-2, 1, -1);
    scene.add(fill);

    const rim = new THREE.DirectionalLight(0xffffff, 0.6);
    rim.position.set(0, 2, -3);
    scene.add(rim);

    // Floor (subtle)
    const floorGeom = new THREE.CircleGeometry(2, 32);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x141a2e, roughness: 0.9, metalness: 0
    });
    const floor = new THREE.Mesh(floorGeom, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.6;
    floor.receiveShadow = true;
    scene.add(floor);

    const skel = buildSkeleton();
    scene.add(skel.root);

    // Resize handler
    function resize() {
      const w2 = canvas.clientWidth || 400;
      const h2 = canvas.clientHeight || 400;
      camera.aspect = w2 / h2;
      camera.updateProjectionMatrix();
      renderer.setSize(w2, h2, false);
    }

    return { scene, camera, renderer, skel, resize };
  }

  // Animations per exercise
  const ANIMATIONS = {
    neck: function (t, s) {
      // Head rotates left-right
      const angle = Math.sin(t * 0.8) * 0.35;
      s.headGroup.rotation.y = angle;
      s.headGroup.rotation.z = Math.sin(t * 0.8) * 0.05;
      s.neckGroup.rotation.y = angle * 0.3;
    },
    shoulders: function (t, s) {
      // Shoulders roll backwards
      const angle = Math.sin(t * 1.2) * 0.4;
      s.leftShoulder.position.y = 0.75 + Math.sin(t * 1.2) * 0.04;
      s.rightShoulder.position.y = 0.75 + Math.sin(t * 1.2 + Math.PI) * 0.04;
      s.leftArm.group.rotation.z = angle * 0.5;
      s.rightArm.group.rotation.z = -angle * 0.5;
      s.leftArm.group.rotation.x = angle * 0.3;
      s.rightArm.group.rotation.x = angle * 0.3;
    },
    back: function (t, s) {
      // Torso twist
      const angle = Math.sin(t * 0.7) * 0.4;
      s.torso.rotation.y = angle;
      s.headGroup.rotation.y = angle * 0.5;
      s.leftArm.group.rotation.z = angle * 0.3;
      s.rightArm.group.rotation.z = angle * 0.3;
    },
    eyes: function (t, s) {
      // Head looks up slightly, eyes blink
      s.headGroup.rotation.x = -0.15 + Math.sin(t * 0.5) * 0.05;
      const blinkCycle = t % 4;
      let lidScale = 1;
      if (blinkCycle > 3.7 && blinkCycle < 3.85) lidScale = 0.05;
      else if (blinkCycle > 3.85 && blinkCycle < 3.95) lidScale = 0.05;
      else if (blinkCycle > 3.95 && blinkCycle < 4.0) lidScale = 0.5;
      s.leftLid.scale.y = lidScale;
      s.rightLid.scale.y = lidScale;
    },
    wrist: function (t, s) {
      // Hands rotate
      const angle = t * 1.5;
      s.leftArm.hand.rotation.z = Math.sin(angle) * 0.8;
      s.rightArm.hand.rotation.z = Math.sin(angle + Math.PI) * 0.8;
      s.leftArm.fore.rotation.z = Math.sin(angle) * 0.2;
      s.rightArm.fore.rotation.z = Math.sin(angle + Math.PI) * 0.2;
    },
    breath: function (t, s) {
      // 4-7-8 breathing cycle (19s total)
      const cycle = t % 19;
      let scale = 1;
      let phase = 'Inhale';
      if (cycle < 4) {
        // Inhale 4s
        scale = 1 + (cycle / 4) * 0.15;
        phase = 'Inspiră';
      } else if (cycle < 11) {
        // Hold 7s
        scale = 1.15;
        phase = 'Ține';
      } else {
        // Exhale 8s
        scale = 1.15 - ((cycle - 11) / 8) * 0.15;
        phase = 'Expiră';
      }
      s.chest.scale.set(scale, scale, scale);
      s.belly.scale.set(1, scale * 0.95, 1);
      return phase;
    }
  };

  let active = null;

  function init(canvas) {
    if (active) return active;
    const ctx = createScene(canvas);
    let currentExercise = 'neck';
    let phaseText = '';
    let rafId = null;
    const startTime = performance.now();

    function loop(now) {
      const t = (now - startTime) / 1000;
      const anim = ANIMATIONS[currentExercise];
      if (anim) {
        const result = anim(t, ctx.skel);
        if (result) phaseText = result;
      }
      ctx.renderer.render(ctx.scene, ctx.camera);
      rafId = requestAnimationFrame(loop);
    }

    rafId = requestAnimationFrame(loop);

    // Resize observer
    const ro = new ResizeObserver(() => ctx.resize());
    ro.observe(canvas);

    active = {
      setExercise: (id) => { currentExercise = id; },
      getPhase: () => phaseText,
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
