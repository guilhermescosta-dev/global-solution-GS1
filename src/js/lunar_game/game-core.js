class LunarGameUI {
  constructor() {
    this.state = loadState();
    this.root = document.querySelector(".quiz-section");
    this.quizCard = document.querySelector(".quiz-card");
    this.quizForm = document.querySelector(".quiz-form");
    this.formActions = document.querySelector(".quiz-form > .game-actions");
    this.questionEl = document.querySelector(".quiz-question");
    this.answerList = document.querySelector(".answer-list");
    this.rewardEl = document.querySelector(".answer-reward");
    this.progressWeek = document.querySelector("[data-progress-week]");
    this.progressQuestion = document.querySelector("[data-progress-question]");
    this.progressRow = document.querySelector(".quiz-progress-row");
    this.resourceCards = document.querySelectorAll("[data-resource-card]");
    this.resourcesSection = document.querySelector(".quiz-resources");
    this.pendingBuildKey = null;

    if (!this.root || !this.quizCard || !this.quizForm) {
      return;
    }

    // Three.js e intro.js serão inicializados apenas na fase de construção
    this.threeJSInitialized = false;
    this.render();
  }


  // ─── THREE.JS ────────────────────────────────────────────────────────────

  initThreeJS() {
    const container = document.getElementById('base-3d-container');
    if (!container || typeof THREE === 'undefined') return;

    // Garantir que o container tenha dimensoes validas
    if (container.clientWidth === 0 || container.clientHeight === 0) {
      console.warn('Container 3D tem dimensoes invalidas, adiando inicializacao...');
      setTimeout(() => this.initThreeJS(), 100);
      return;
    }

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(55, container.clientWidth / container.clientHeight, 0.1, 2000);
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.setClearColor(0x000005, 1);

    // Limpar qualquer canvas anterior para evitar multiplos renderers
    const existingCanvas = container.querySelector('canvas');
    if (existingCanvas) {
      existingCanvas.remove();
    }

    container.appendChild(this.renderer.domElement);

    // ── STARS ───────────────────────────────────────────────────────────────
    const starGeo = new THREE.BufferGeometry();
    const starPos = [];
    for (let i = 0; i < 2200; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 800 + Math.random() * 200;
      starPos.push(
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.sin(phi) * Math.sin(theta),
        r * Math.cos(phi)
      );
    }
    starGeo.setAttribute('position', new THREE.Float32BufferAttribute(starPos, 3));
    const starMat = new THREE.PointsMaterial({ color: 0xffffff, size: 1.4, sizeAttenuation: true });
    this.scene.add(new THREE.Points(starGeo, starMat));

    // ── EARTH IN SKY ────────────────────────────────────────────────────────
    const earthGeo = new THREE.SphereGeometry(28, 32, 32);
    const earthMat = new THREE.MeshPhongMaterial({
      color: 0x1a6ebc,
      emissive: 0x0a2a50,
      emissiveIntensity: 0.3,
      shininess: 80
    });
    const earth = new THREE.Mesh(earthGeo, earthMat);
    earth.position.set(-200, 120, -600);
    const cloudMat = new THREE.MeshPhongMaterial({
      color: 0xffffff, transparent: true, opacity: 0.22, side: THREE.FrontSide
    });
    earth.add(new THREE.Mesh(new THREE.SphereGeometry(29.5, 16, 16), cloudMat));
    this.scene.add(earth);

    // ── LIGHTING ────────────────────────────────────────────────────────────
    // Very dim ambient (deep space, no atmosphere)
    this.scene.add(new THREE.AmbientLight(0x0a0f1a, 1.2));

    // Harsh directional sunlight
    const sun = new THREE.DirectionalLight(0xfff8f0, 4.5);
    sun.position.set(12, 18, 8);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.near = 0.1;
    sun.shadow.camera.far = 200;
    sun.shadow.camera.left = -25;
    sun.shadow.camera.right = 25;
    sun.shadow.camera.top = 25;
    sun.shadow.camera.bottom = -25;
    sun.shadow.bias = -0.001;
    this.scene.add(sun);

    // Faint earthshine fill
    const earthshine = new THREE.DirectionalLight(0x1a3a6a, 0.3);
    earthshine.position.set(-8, 4, -10);
    this.scene.add(earthshine);

    // ── LUNAR TERRAIN ───────────────────────────────────────────────────────
    const terrainGeo = new THREE.PlaneGeometry(400, 400, 80, 80);
    const tPos = terrainGeo.attributes.position;
    for (let i = 0; i < tPos.count; i++) {
      const x = tPos.getX(i), z = tPos.getY(i);
      const d = Math.sqrt(x * x + z * z);
      if (d > 8) {
        tPos.setZ(i,
          (Math.random() - 0.5) * 0.6 +
          Math.sin(x * 0.4) * 0.3 +
          Math.cos(z * 0.3) * 0.2
        );
      }
    }
    terrainGeo.computeVertexNormals();
    const terrainMat = new THREE.MeshPhongMaterial({
      color: 0x8a8470, shininess: 2, specular: 0x111108
    });
    const terrain = new THREE.Mesh(terrainGeo, terrainMat);
    terrain.rotation.x = -Math.PI / 2;
    terrain.position.y = -0.5;
    terrain.receiveShadow = true;
    this.scene.add(terrain);

    // Craters
    const craterData = [
      { x: -14, z: 12, r: 3.5, },
      { x: 18, z: -8, r: 2.8, },
      { x: -22, z: -16, r: 4.5, },
      { x: 25, z: 20, r: 2.2, },
      { x: -8, z: 22, r: 1.8, },
    ];
    craterData.forEach(({ x, z, r }) => {
      const rimMat = new THREE.MeshPhongMaterial({ color: 0x7a7460, shininess: 1 });
      const rim = new THREE.Mesh(new THREE.TorusGeometry(r, r * 0.12, 6, 32), rimMat);
      rim.rotation.x = Math.PI / 2;
      rim.position.set(x, -0.45, z);
      rim.receiveShadow = true;
      this.scene.add(rim);

      const floorMat = new THREE.MeshPhongMaterial({ color: 0x5a5448, shininess: 1 });
      const floor = new THREE.Mesh(new THREE.CircleGeometry(r * 0.85, 24), floorMat);
      floor.rotation.x = -Math.PI / 2;
      floor.position.set(x, -0.48, z);
      this.scene.add(floor);
    });

    // ── BASE GROUP ──────────────────────────────────────────────────────────
    this.baseGroup = new THREE.Group();
    this.scene.add(this.baseGroup);

    this.camera.position.set(0, 7, 13);
    this.camera.lookAt(0, 0.5, 0);

    // Blinking antenna light reference (set in updateThreeJSBase)
    this._blinkMesh = null;
    this._animT = 0;

    const animate = () => {
      requestAnimationFrame(animate);
      this._animT += 0.016;

      // ─── ÓRBITA DA CÂMERA ───────────────────────────────────────────────────
      const radius = 13;  // A distância horizontal original da câmera (raio do círculo)
      const speed = 0.2;  // Velocidade do giro (valores menores = mais lento e suave)

      // Calcula a nova posição X e Z da câmera ao longo do tempo
      this.camera.position.x = Math.sin(this._animT * speed) * radius;
      this.camera.position.z = Math.cos(this._animT * speed) * radius;

      // Força a câmera a continuar apontada para o centro da base lunar
      this.camera.lookAt(0, 0.5, 0);
      // ────────────────────────────────────────────────────────────────────────

      // COMITADO/REMOVIDO: Desativamos o giro próprio da base para não conflitar
      // this.baseGroup.rotation.y += 0.003;

      if (this._blinkMesh) {
        this._blinkMesh.material.emissiveIntensity = Math.sin(this._animT * 2) > 0 ? 1.5 : 0.1;
      }
      this.renderer.render(this.scene, this.camera);
    };
    animate();

    window.addEventListener('resize', () => {
      this.camera.aspect = container.clientWidth / container.clientHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(container.clientWidth, container.clientHeight);
    });

    this.updateThreeJSBase();
  }

  updateThreeJSBase() {
    if (!this.baseGroup) return;

    while (this.baseGroup.children.length > 0) {
      this.baseGroup.remove(this.baseGroup.children[0]);
    }
    this._blinkMesh = null;

    // ── GROUND PAD ──────────────────────────────────────────────────────────
    const padMat = new THREE.MeshPhongMaterial({ color: 0x4a4840, shininess: 5 });
    const pad = new THREE.Mesh(new THREE.CylinderGeometry(6.2, 6.6, 0.22, 56), padMat);
    pad.position.y = -0.38;
    pad.receiveShadow = true;
    this.baseGroup.add(pad);

    // Pad surface markings
    [4.8, 3.8].forEach(r => {
      const rMat = new THREE.MeshPhongMaterial({ color: 0x6a6558, side: THREE.DoubleSide });
      const ring = new THREE.Mesh(new THREE.RingGeometry(r, r + 0.08, 48), rMat);
      ring.rotation.x = -Math.PI / 2;
      ring.position.y = -0.26;
      this.baseGroup.add(ring);
    });

    // ── CENTRAL HUB ─────────────────────────────────────────────────────────
    const hubGroup = new THREE.Group();

    // Main dome
    const domeMat = new THREE.MeshPhongMaterial({
      color: 0xd8e8f2, shininess: 220, specular: 0x99bbdd,
      transparent: true, opacity: 0.92
    });
    const dome = new THREE.Mesh(
      new THREE.SphereGeometry(1.7, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2),
      domeMat
    );
    dome.castShadow = true;
    hubGroup.add(dome);

    // Structural ribs
    for (let i = 0; i < 6; i++) {
      const ribMat = new THREE.MeshPhongMaterial({ color: 0x99aabb });
      const rib = new THREE.Mesh(new THREE.TorusGeometry(1.72, 0.022, 8, 24, Math.PI / 2), ribMat);
      rib.rotation.y = (i / 6) * Math.PI;
      rib.position.y = 0.01;
      hubGroup.add(rib);
    }

    // Equatorial collar
    const collarMat = new THREE.MeshPhongMaterial({ color: 0x6a7a8a, shininess: 80 });
    hubGroup.add(new THREE.Mesh(new THREE.CylinderGeometry(1.72, 1.72, 0.14, 48), collarMat));

    // Base cylinder
    const hubBaseMat = new THREE.MeshPhongMaterial({ color: 0x4a5a6a, shininess: 30 });
    const hubBase = new THREE.Mesh(new THREE.CylinderGeometry(1.68, 1.82, 0.48, 48), hubBaseMat);
    hubBase.position.y = 0.24;
    hubBase.castShadow = true;
    hubGroup.add(hubBase);

    // Airlock door
    const doorMat = new THREE.MeshPhongMaterial({ color: 0x8899aa, shininess: 60 });
    const door = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.55, 0.08), doorMat);
    door.position.set(1.76, 0.3, 0);
    hubGroup.add(door);

    // Door status light
    const lightMat = new THREE.MeshPhongMaterial({
      color: 0x44ff88, emissive: 0x22cc55, emissiveIntensity: 0.8
    });
    const light = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.38, 0.05), lightMat);
    light.position.set(1.81, 0.3, 0);
    hubGroup.add(light);

    // Antenna mast
    const mastMat = new THREE.MeshPhongMaterial({ color: 0xbbc8d4 });
    const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.045, 1.4, 8), mastMat);
    mast.position.y = 2.4;
    hubGroup.add(mast);

    // Antenna dish
    const dishMat = new THREE.MeshPhongMaterial({
      color: 0xe8eef4, shininess: 140, side: THREE.DoubleSide
    });
    const dish = new THREE.Mesh(
      new THREE.SphereGeometry(0.32, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2),
      dishMat
    );
    dish.rotation.set(Math.PI / 4, 0, 0);
    dish.position.y = 3.12;
    hubGroup.add(dish);

    // Blinking light
    const blinkMat = new THREE.MeshPhongMaterial({
      color: 0xff2200, emissive: 0xff1100, emissiveIntensity: 1.5
    });
    const blink = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 8), blinkMat);
    blink.position.y = 3.18;
    hubGroup.add(blink);
    this._blinkMesh = blink;

    this.baseGroup.add(hubGroup);

    // ── MODULES ─────────────────────────────────────────────────────────────
    const allModuleKeys = ['painel_solar', 'estufa', 'reciclador_agua', 'gerador_oxigenio'];
    const angleStep = (Math.PI * 2) / 4;

    allModuleKeys.forEach((key, index) => {
      const level = this.state.activeModules[key] || 0;
      const angle = index * angleStep + Math.PI / 4;
      const radius = 3.6;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;

      // Connecting tunnel
      const tunnelLen = radius - 1.82;
      const tunnelMat = new THREE.MeshPhongMaterial({ color: level > 0 ? 0x4a5a6a : 0x2a3038, shininess: 20 });
      const tunnelMesh = new THREE.Mesh(new THREE.BoxGeometry(tunnelLen, 0.38, 0.58), tunnelMat);
      tunnelMesh.castShadow = true;

      const tunnelGroup = new THREE.Group();
      tunnelGroup.position.set(
        Math.cos(angle) * (1.82 + tunnelLen / 2),
        0.19,
        Math.sin(angle) * (1.82 + tunnelLen / 2)
      );
      tunnelGroup.rotation.y = -angle;

      // Tunnel ridge detail
      const ridgeMat = new THREE.MeshPhongMaterial({ color: level > 0 ? 0x3a4a5a : 0x1e262c });
      const ridge = new THREE.Mesh(new THREE.BoxGeometry(tunnelLen, 0.06, 0.62), ridgeMat);
      ridge.position.y = 0.19;
      tunnelGroup.add(tunnelMesh, ridge);
      this.baseGroup.add(tunnelGroup);

      if (level === 0) return;

      const modGroup = new THREE.Group();
      modGroup.position.set(x, 0, z);

      this._buildModule(modGroup, key, level);
      this.baseGroup.add(modGroup);
    });
  }

  _buildModule(group, key, level) {
    // Foundation pad
    const fpMat = new THREE.MeshPhongMaterial({ color: 0x3c4a56, shininess: 8 });
    const fp = new THREE.Mesh(new THREE.CylinderGeometry(1.02, 1.12, 0.2, 28), fpMat);
    fp.position.y = 0.1;
    fp.castShadow = true;
    group.add(fp);

    if (key === 'painel_solar') {
      this._buildSolarPanel(group, level);
    } else if (key === 'estufa') {
      this._buildGreenhouse(group, level);
    } else if (key === 'reciclador_agua') {
      this._buildWaterRecycler(group, level);
    } else if (key === 'gerador_oxigenio') {
      this._buildOxygenGenerator(group, level);
    }
  }

  // ── PAINEL SOLAR ──────────────────────────────────────────────────────────
  // Nível 1: 2 painéis com grade de células
  // Nível 2: 4 painéis em cruz com suporte articulado
  // Nível 3: 6 painéis em dois andares
  _buildSolarPanel(group, level) {
    const mastH = [0, 1.1, 1.45, 1.9][level];
    const mastMat = new THREE.MeshPhongMaterial({ color: 0x8899aa });
    const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, mastH, 10), mastMat);
    mast.position.y = 0.2 + mastH / 2;
    mast.castShadow = true;
    group.add(mast);

    const cellMat = new THREE.MeshPhongMaterial({
      color: 0x0e2a88, shininess: 260, specular: 0x6699ff
    });
    const frameMat = new THREE.MeshPhongMaterial({ color: 0x778899, shininess: 40 });
    const backMat = new THREE.MeshPhongMaterial({ color: 0x2a3a4a });
    const gridMat = new THREE.MeshPhongMaterial({ color: 0x1a3aaa });

    // Fixed default inclination to -Math.PI / 5 (~36°)
    const addPanel = (w, h, px, py, pz, ry, rx = -Math.PI / 5) => {
      const grp = new THREE.Group();
      grp.position.set(px, py, pz);
      grp.rotation.y = ry;
      grp.rotation.x = rx;

      // Back plate
      grp.add(new THREE.Mesh(new THREE.BoxGeometry(w, 0.03, h), backMat));
      // Cell surface
      const cell = new THREE.Mesh(new THREE.BoxGeometry(w - 0.06, 0.045, h - 0.06), cellMat);
      cell.position.y = 0.01;
      grp.add(cell);

      // Vertical grid lines
      for (let i = 1; i < 3; i++) {
        const lm = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.05, h), gridMat);
        lm.position.set(-w / 2 + (w / 3) * i, 0.015, 0);
        grp.add(lm);
      }
      // Horizontal grid lines
      for (let i = 1; i < 4; i++) {
        const lm = new THREE.Mesh(new THREE.BoxGeometry(w, 0.05, 0.012), gridMat);
        lm.position.set(0, 0.015, -h / 2 + (h / 4) * i);
        grp.add(lm);
      }
      // Frame
      const frame = new THREE.Mesh(new THREE.BoxGeometry(w + 0.05, 0.055, h + 0.05), frameMat);
      frame.position.y = -0.005;
      grp.add(frame);

      group.add(grp);

      // Fix: Connect offset panels back to the center mast with structural arms
      if (px !== 0 || pz !== 0) {
        const dist = Math.sqrt(px * px + pz * pz);
        const armGeo = new THREE.BoxGeometry(dist, 0.04, 0.04);
        const arm = new THREE.Mesh(armGeo, mastMat);
        arm.position.set(px / 2, py, pz / 2);
        arm.rotation.y = Math.atan2(pz, px);
        group.add(arm);
      }
    };

    const topY = 0.2 + mastH;
    if (level === 1) {
      addPanel(0.95, 0.58, -0.56, topY, 0, 0);
      addPanel(0.95, 0.58, 0.56, topY, 0, 0);
    } else if (level === 2) {
      addPanel(1.05, 0.65, -0.64, topY, 0, 0);
      addPanel(1.05, 0.65, 0.64, topY, 0, 0);
      addPanel(1.05, 0.65, 0, topY, -0.64, Math.PI / 2);
      addPanel(1.05, 0.65, 0, topY, 0.64, Math.PI / 2);
    } else if (level === 3) {
      // Fix: Replaced multi-tier layout with a clean 6-panel radial array
      for (let i = 0; i < 6; i++) {
        const angle = i * (Math.PI * 2 / 6);
        const radius = 0.85;
        const px = Math.cos(angle) * radius;
        const pz = Math.sin(angle) * radius;
        addPanel(1.12, 0.66, px, topY, pz, -angle);
      }
    }
  }

  // ── ESTUFA ────────────────────────────────────────────────────────────────
  // Nível 1: dome segmentado pequeno com plantas
  // Nível 2: dome médio + airlock com luz indicadora
  // Nível 3: dome grande + anel de crescimento UV
  _buildGreenhouse(group, level) {
    const ds = [0, 0.84, 1.08, 1.38][level];
    const archMat = new THREE.MeshPhongMaterial({ color: 0x44bb66, shininess: 50 });

    // Structural arches
    for (let i = 0; i < 6; i++) {
      const arch = new THREE.Mesh(
        new THREE.TorusGeometry(ds, 0.03, 6, 20, Math.PI / 2),
        archMat
      );
      arch.rotation.y = (i / 6) * Math.PI;
      arch.rotation.x = Math.PI / 2;
      arch.position.y = 0.2;
      group.add(arch);
    }

    // Dome panels (alternating opacity for segmented look)
    for (let i = 0; i < 6; i++) {
      const panelMat = new THREE.MeshPhongMaterial({
        color: i % 2 === 0 ? 0x88ffcc : 0xaaffee,
        transparent: true, opacity: 0.35,
        shininess: 180, specular: 0xffffff,
        side: THREE.DoubleSide
      });
      const panel = new THREE.Mesh(
        new THREE.SphereGeometry(ds * 0.99, 4, 4, (i / 6) * Math.PI * 2, Math.PI / 3, 0, Math.PI / 2),
        panelMat
      );
      panel.position.y = 0.2;
      group.add(panel);
    }

    // Rim
    const rimMat = new THREE.MeshPhongMaterial({ color: 0x33aa55, shininess: 60 });
    const rim = new THREE.Mesh(new THREE.TorusGeometry(ds, 0.06, 10, 40), rimMat);
    rim.rotation.x = Math.PI / 2;
    rim.position.y = 0.2;
    group.add(rim);

    // Airlock (level 2+)
    if (level >= 2) {
      const lkMat = new THREE.MeshPhongMaterial({ color: 0x446655, shininess: 40 });

      // Fix: Lowered position to snap perfectly against the dome edge base rim
      const lk = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.6, 16), lkMat);
      lk.position.set(ds * 0.9, 0.2 + 0.3, 0);
      lk.castShadow = true;
      group.add(lk);

      // Fix: Added connection sleeve tunnel linking the dome to the airlock door
      const connGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.3, 12);
      const conn = new THREE.Mesh(connGeo, lkMat);
      conn.rotation.z = Math.PI / 2;
      conn.position.set(ds * 0.72, 0.2 + 0.3, 0);
      group.add(conn);

      // Fix: Moved status sphere to the front external wall of the airlock unit
      const alMat = new THREE.MeshPhongMaterial({
        color: 0xffcc00, emissive: 0xcc9900, emissiveIntensity: 0.6
      });
      const al = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 8), alMat);
      al.position.set(ds * 0.9 + 0.32, 0.2 + 0.3, 0);
      group.add(al);
    }

    // UV growth ring (level 3)
    if (level === 3) {
      const grMat = new THREE.MeshPhongMaterial({
        color: 0xff55bb, emissive: 0xcc1188, emissiveIntensity: 0.55
      });
      const gr = new THREE.Mesh(new THREE.TorusGeometry(ds * 0.62, 0.07, 8, 32), grMat);
      gr.rotation.x = Math.PI / 2;
      gr.position.y = 0.55;
      group.add(gr);
    }

    // Plants
    const plantCount = [0, 4, 7, 10][level];
    const plantColors = [0x22cc44, 0x44ee66, 0x66ff88];
    for (let i = 0; i < plantCount; i++) {
      const a = (i / plantCount) * Math.PI * 2;
      const r = ds * 0.42;
      const px = Math.cos(a) * r, pz = Math.sin(a) * r;
      const h = 0.18 + Math.random() * 0.28;

      const stemMat = new THREE.MeshPhongMaterial({ color: 0x226633 });
      const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.028, h, 6), stemMat);
      stem.position.set(px, 0.2 + h / 2, pz);
      group.add(stem);

      const leafMat = new THREE.MeshPhongMaterial({ color: plantColors[i % 3] });
      const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 6), leafMat);
      leaf.position.set(px, 0.2 + h + 0.06, pz);
      group.add(leaf);
    }
  }
  // ── RECICLADOR DE ÁGUA ────────────────────────────────────────────────────
  // Nível 1: tanque com anéis de compressão e tubulações
  // Nível 2: tanque maior + 6 aletas condensadoras
  // Nível 3: 2 tanques + coluna filtrante + indicador luminoso
  _buildWaterRecycler(group, level) {
    const tankMat = new THREE.MeshPhongMaterial({
      color: 0x1188cc, shininess: 180, specular: 0x55aaff
    });
    const metalMat = new THREE.MeshPhongMaterial({ color: 0x5577aa, shininess: 60 });
    const pipeMat = new THREE.MeshPhongMaterial({ color: 0x336688 });

    const tR = [0, 0.56, 0.7, 0.56][level];
    const tH = [0, 0.95, 1.15, 0.95][level];

    // Main tank
    const tank = new THREE.Mesh(new THREE.CylinderGeometry(tR, tR * 1.06, tH, 28), tankMat);
    tank.position.y = 0.2 + tH / 2;
    tank.castShadow = true;
    group.add(tank);

    // Top dome
    const cap = new THREE.Mesh(
      new THREE.SphereGeometry(tR, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2),
      tankMat
    );
    cap.position.y = 0.2 + tH;
    group.add(cap);

    // Compression band rings
    [0.35, 0.65].forEach(f => {
      const band = new THREE.Mesh(new THREE.TorusGeometry(tR + 0.02, 0.03, 6, 28), metalMat);
      band.rotation.x = Math.PI / 2;
      band.position.y = 0.2 + tH * f;
      group.add(band);
    });

    // Pipe stubs with elbows
    [-0.32, 0.32].forEach(ox => {
      const pm = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.065, 0.55, 8), pipeMat);
      pm.rotation.z = Math.PI / 2;
      pm.position.set(ox, 0.2 + 0.28, tR + 0.06);
      group.add(pm);

      // Fix: Recalculated elbow positions so they stay locked onto the actual pipeline tip
      const el = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 8), pipeMat);
      el.position.set(ox, 0.2 + 0.28, tR + 0.335);
      group.add(el);

      // Fix: Added descending pipes going down from the elbow connectors directly into the pad base
      const downGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.28, 8);
      const down = new THREE.Mesh(downGeo, pipeMat);
      down.position.set(ox, 0.2 + 0.14, tR + 0.335);
      group.add(down);
    });

    // Condenser fins (level 2+)
    if (level >= 2) {
      for (let i = 0; i < 6; i++) {
        const fa = (i / 6) * Math.PI * 2;
        const fin = new THREE.Mesh(new THREE.BoxGeometry(0.06, tH * 0.7, 0.46), metalMat);
        fin.position.set(
          Math.cos(fa) * (tR + 0.12),
          0.2 + tH * 0.48,
          Math.sin(fa) * (tR + 0.12)
        );
        group.add(fin);
      }

      // Fix: Added structural retaining ring to firmly bound the external cooling grid
      const beltGeo = new THREE.TorusGeometry(tR + 0.16, 0.025, 6, 28);
      const belt = new THREE.Mesh(beltGeo, metalMat);
      belt.rotation.x = Math.PI / 2;
      belt.position.y = 0.2 + tH * 0.48;
      group.add(belt);
    }

    // Second tank + filter column (level 3)
    if (level === 3) {
      const t2 = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.4, 0.78, 18), tankMat);
      t2.position.set(1.0, 0.2 + 0.39, 0);
      group.add(t2);

      const c2 = new THREE.Mesh(
        new THREE.SphereGeometry(0.38, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2),
        tankMat
      );
      c2.position.set(1.0, 0.2 + 0.78, 0);
      group.add(c2);

      const filtMat = new THREE.MeshPhongMaterial({ color: 0x88ddff, shininess: 200 });
      const filt = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.15, 1.1, 12), filtMat);
      filt.position.set(-0.88, 0.2 + 0.55, 0);
      group.add(filt);

      const glowMat = new THREE.MeshPhongMaterial({
        color: 0x00ddff, emissive: 0x0099cc, emissiveIntensity: 0.9
      });
      const glow = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 8), glowMat);
      glow.position.set(-0.88, 0.2 + 1.22, 0);
      group.add(glow);
    }
  }

  // ── GERADOR DE OXIGÊNIO ───────────────────────────────────────────────────
  // Nível 1: reator com painéis de instrumentação e anel emissor
  // Nível 2: reator maior + 2 tanques de armazenamento com manômetros
  // Nível 3: reator grande + 4 tanques + radiadores
  _buildOxygenGenerator(group, level) {
    const reactorMat = new THREE.MeshPhongMaterial({ color: 0xe8eef6, shininess: 120 });
    const accentMat = new THREE.MeshPhongMaterial({
      color: 0x44aaff, emissive: 0x1144bb, emissiveIntensity: 0.5
    });
    const storageMat = new THREE.MeshPhongMaterial({ color: 0xbbc8da, shininess: 70 });
    const panelMat = new THREE.MeshPhongMaterial({ color: 0x3a4a5a, shininess: 30 });

    const rH = [0, 0.92, 1.32, 1.55][level];
    const rR = [0, 0.46, 0.54, 0.60][level];

    // Reactor body
    const reactor = new THREE.Mesh(new THREE.CylinderGeometry(rR, rR * 1.08, rH, 24), reactorMat);
    reactor.position.y = 0.2 + rH / 2;
    reactor.castShadow = true;
    group.add(reactor);

    // Top dome
    const top = new THREE.Mesh(
      new THREE.SphereGeometry(rR, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2),
      reactorMat
    );
    top.position.y = 0.2 + rH;
    group.add(top);

    // Fix: Resolved z-fighting artifact with radial outward cushioning + correct tangential rotation
    for (let i = 0; i < 3; i++) {
      const angle = (i / 3) * Math.PI * 2;
      const pn = new THREE.Mesh(new THREE.BoxGeometry(rR * 0.55, rH * 0.22, 0.06), panelMat);
      pn.position.set(
        Math.cos(angle) * (rR + 0.04),
        0.2 + rH * 0.55,
        Math.sin(angle) * (rR + 0.04)
      );
      pn.rotation.y = -angle;
      group.add(pn);
    }

    // Glowing output ring
    const ring = new THREE.Mesh(new THREE.TorusGeometry(rR + 0.08, 0.07, 8, 32), accentMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.2 + rH * 0.62;
    group.add(ring);

    // Vent nozzles
    const ventCount = level === 1 ? 3 : level === 2 ? 4 : 6;
    for (let i = 0; i < ventCount; i++) {
      const va = (i / ventCount) * Math.PI * 2;
      const vMat = new THREE.MeshPhongMaterial({ color: 0x88aacc });
      const v = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.24, 6), vMat);
      v.position.set(
        Math.cos(va) * (rR + 0.06),
        0.2 + rH * 0.86,
        Math.sin(va) * (rR + 0.06)
      );
      v.rotation.x = Math.PI / 6;
      v.rotation.y = -va;
      group.add(v);
    }

    // Storage tanks with pressure gauges (level 2+)
    if (level >= 2) {
      [-0.85, 0.85].forEach(ox => {
        const st = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.78, 16), storageMat);
        st.position.set(ox, 0.2 + 0.39, 0);
        st.castShadow = true;
        group.add(st);

        const sc = new THREE.Mesh(
          new THREE.SphereGeometry(0.26, 12, 7, 0, Math.PI * 2, 0, Math.PI / 2),
          storageMat
        );
        sc.position.set(ox, 0.2 + 0.78, 0);
        group.add(sc);

        // Fix: Shifted manometers down onto midpoint height to rest flush on the tank
        const gaugeMat = new THREE.MeshPhongMaterial({
          color: 0xeeff44, emissive: 0xaacc00, emissiveIntensity: 0.4
        });
        const gauge = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.04, 10), gaugeMat);
        gauge.position.set(ox, 0.2 + 0.62, 0.28);
        group.add(gauge);

        // Fix: Added mechanical plumbing conduits feeding gas directly from the generator core to the tanks
        const connW = Math.abs(ox) - rR - 0.01;
        const connGeo = new THREE.BoxGeometry(connW, 0.04, 0.04);
        const conn = new THREE.Mesh(connGeo, new THREE.MeshPhongMaterial({ color: 0x667788 }));
        conn.position.set(ox / 2, 0.2 + rH * 0.4, 0);
        group.add(conn);
      });
    }

    // Extra tanks + radiator fins (level 3)
    if (level === 3) {
      [-0.85, 0.85].forEach(oz => {
        const st = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.78, 16), storageMat);
        st.position.set(0, 0.2 + 0.39, oz);
        group.add(st);

        const sc = new THREE.Mesh(
          new THREE.SphereGeometry(0.26, 12, 7, 0, Math.PI * 2, 0, Math.PI / 2),
          storageMat
        );
        sc.position.set(0, 0.2 + 0.78, oz);
        group.add(sc);
      });

      for (let i = 0; i < 4; i++) {
        const fa = (i / 4) * Math.PI * 2 + Math.PI / 4;
        const radMat = new THREE.MeshPhongMaterial({ color: 0xaabbcc });
        const rad = new THREE.Mesh(new THREE.BoxGeometry(0.05, rH * 0.65, 0.58), radMat);
        rad.position.set(
          Math.cos(fa) * (rR + 0.18),
          0.2 + rH * 0.5,
          Math.sin(fa) * (rR + 0.18)
        );
        rad.rotation.y = fa;
        group.add(rad);
      }
    }
  }

  // ─── INTRO.JS ────────────────────────────────────────────────────────────

  checkFirstVisit() {
    const visited = localStorage.getItem('lunar-tutorial-visited');

    // Vincular o clique do botao de tutorial (apenas uma vez)
    const btn = document.getElementById('btn-tutorial');
    if (btn && !btn.dataset.tutorialBound) {
      btn.dataset.tutorialBound = 'true';
      btn.addEventListener('click', () => {
        if (typeof introJs !== 'undefined') {
          this.startTutorial();
        }
      });
    }

    // Iniciar o tutorial automaticamente na primeira visita a construcao
    if (!visited && typeof introJs !== 'undefined') {
      setTimeout(() => {
        this.startTutorial();
        localStorage.setItem('lunar-tutorial-visited', 'true');
      }, 500);
    }
  }

  startTutorial() {
    introJs().setOptions({
      nextLabel: 'Próximo →',
      prevLabel: '← Voltar',
      doneLabel: '<i class="bi bi-rocket-takeoff-fill"></i> Começar missão',
      dontShowAgain: false,
      showProgress: true,
      showBullets: false,
      exitOnOverlayClick: false,
      scrollToElement: true,
      steps: [
        {
          intro: `
            <div class="selene-intro-step">
              <div class="selene-intro-icon"><i class="bi bi-moon-stars-fill"></i></div>
              <h3>Bem-vindo à Operação Selene</h3>
              <p>Você é o comandante de uma base lunar em construção. Sua missão: manter a tripulação viva e expandir a base respondendo corretamente às perguntas científicas.</p>
              <p class="selene-intro-tip">Este tutorial vai te mostrar como tudo funciona em menos de 1 minuto.</p>
            </div>
          `
        },
        {
          element: document.getElementById('base-3d-container'),
          intro: `
            <div class="selene-intro-step">
              <div class="selene-intro-icon"><i class="bi bi-building-fill-add"></i></div>
              <h3>Sua Base Lunar</h3>
              <p>Esta é a visualização 3D da sua base. Ela evolui conforme você constrói novos módulos.</p>
              <p>Ao construir e melhorar módulos, você verá a base crescer em tempo real aqui.</p>
            </div>
          `
        },
        {
          element: document.querySelector('.quiz-resources'),
          intro: `
            <div class="selene-intro-step">
              <div class="selene-intro-icon"><i class="bi bi-box-seam-fill"></i></div>
              <h3>Recursos Operacionais</h3>
              <p>Estes são seus recursos: <strong>Minerais, Componentes e Biomassa</strong>. Você os ganha respondendo perguntas corretamente.</p>
              <p>Recursos são usados para <strong>construir e melhorar módulos</strong> da base no final de cada semana.</p>
            </div>
          `
        },
        {
          element: document.querySelector('.quiz-card'), // Altere para a classe real que envolve os blocos de upgrade
          intro: `
          <div class="selene-intro-step">
            <div class="selene-intro-icon"><i class="bi bi-tools"></i></div>
            <h3>Construção e Upgrades</h3>
            <p>Utilize os recursos acumulados para construir ou melhorar os módulos vitais da sua base lunar.</p>
            <p>Gerencie com sabedoria a <strong>Energia, Água, Oxigênio e Alimentos</strong> para garantir a sobrevivência da colônia.</p>
            <p class="selene-intro-tip"><i class="bi bi-lightbulb-fill text-warning"></i> Clique em um módulo para prever o impacto que a melhoria causará nos seus recursos atuais!</p>
          </div>
  `
        }
      ]
    }).start();
  }


  // ─── STATE & RENDER ──────────────────────────────────────────────────────

  setState(nextState) {
    const previousState = this.state;
    this.state = nextState;
    saveState(this.state);
    this.render();
    this.scrollToGameTop(previousState, nextState);
  }

  scrollToGameTop(previousState, nextState) {
    const changedSection =
      previousState.phase !== nextState.phase ||
      previousState.questionIndex !== nextState.questionIndex;

    if (!changedSection) return;

    setTimeout(() => {
      this.root.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 60);
  }

  render() {
    this.updateResources();
    this.updateProgress();
    this.updateProgressVisibility();

    if (this.state.phase === "construction") {
      // Mostrar o container 3D ANTES de inicializar Three.js para evitar dimensoes 0x0
      const base3dContainer = document.getElementById('base-3d-container');
      if (base3dContainer) {
        base3dContainer.hidden = false;
      }

      // Mostrar o botão de tutorial
      const btnTutorial = document.getElementById('btn-tutorial');
      if (btnTutorial) {
        btnTutorial.hidden = false;
      }

      // Inicializar Three.js e intro.js apenas na fase de construção
      if (!this.threeJSInitialized) {
        this.initThreeJS();
        this.checkFirstVisit();
        this.threeJSInitialized = true;
      }
      this.updateThreeJSBase();
      this.renderConstruction();
      return;
    }

    // Ocultar o container 3D e o botão de tutorial em todas as outras fases
    const base3dContainer = document.getElementById('base-3d-container');
    if (base3dContainer) {
      base3dContainer.hidden = true;
    }
    const btnTutorial = document.getElementById('btn-tutorial');
    if (btnTutorial) {
      btnTutorial.hidden = true;
    }
    if (this.state.phase === "week-summary") {
      if (this.threeJSInitialized) {
        this.updateThreeJSBase();
      }
      this.renderWeekSummary();
      return;
    }
    if (this.state.phase === "game-over") {
      this.renderGameOver();
      return;
    }

    this.renderQuestion();
  }

  updateResources(targetResource = null) {
    const question = getCurrentQuestion(this.state);
    const activeResource = targetResource ?? question?.resource;

    if (this.resourcesSection) {
      // Mostrar recursos apenas na fase de construção, ocultar em todas as outras fases
      this.resourcesSection.hidden = this.state.phase !== "construction";
    }

    this.resourceCards.forEach((card) => {
      const resource = card.dataset.resourceCard;
      const value = card.querySelector("strong");
      card.classList.toggle("is-target", resource === activeResource && this.state.phase === "quiz");

      if (value) {
        value.textContent = this.state.operational[resource] ?? 0;
      }

      card.querySelector(".resource-gain")?.remove();

      const shouldShowGain =
        this.state.phase === "quiz" &&
        this.state.lastAnswer?.resource === resource &&
        this.state.lastAnswer?.rewardValue > 0;

      card.classList.toggle("is-gained", shouldShowGain);

      if (shouldShowGain) {
        const gain = document.createElement("em");
        gain.className = "resource-gain";
        gain.textContent = `+${this.state.lastAnswer.rewardValue}`;
        card.querySelector(".operational-card-info")?.appendChild(gain);
      }
    });
  }

  updateProgress() {
    this.updateProgressChip(this.progressWeek, {
      current: this.state.week,
      total: CONFIG.MAX_WEEKS,
      completedStatus: "is-correct",
    });

    this.updateProgressChip(this.progressQuestion, {
      current: Math.min(this.state.questionIndex + 1, CONFIG.QUESTIONS_PER_WEEK),
      total: CONFIG.QUESTIONS_PER_WEEK,
      questionResults: this.state.questionResults,
    });
  }

  updateProgressVisibility() {
    const hideQuestionProgress = ["week-summary", "game-over"].includes(this.state.phase);

    if (this.progressQuestion) {
      this.progressQuestion.hidden = hideQuestionProgress;
    }

    this.progressRow?.classList.toggle("is-week-only", hideQuestionProgress);
  }

  updateProgressChip(chip, config) {
    if (!chip) return;

    const number = chip.querySelector(".progress-chip-heading strong");
    const blocks = chip.querySelector(".progress-blocks");

    if (number) {
      number.textContent = `${config.current}/${config.total}`;
    }

    if (!blocks) return;

    blocks.innerHTML = "";

    for (let index = 0; index < config.total; index++) {
      const block = document.createElement("i");

      if (config.questionResults) {
        const result = config.questionResults[index];
        if (result === "correct") block.classList.add("is-correct");
        if (result === "wrong") block.classList.add("is-wrong");
        if (!result && index === this.state.questionIndex && this.state.phase === "quiz") {
          block.classList.add("is-active");
        }
      } else if (this.state.phase === "game-over") {
        const failedMission = this.isMissionFailure();
        const wasReached = index + 1 <= this.state.week;
        block.classList.add(failedMission && !wasReached ? "is-wrong" : config.completedStatus);
      } else if (index + 1 < this.state.week) {
        block.classList.add(config.completedStatus);
      } else if (index + 1 === this.state.week) {
        block.classList.add("is-active");
      }

      blocks.appendChild(block);
    }
  }

  isReviewingAnswer() {
    return Boolean(this.state.lastAnswer);
  }

  isMissionFailure() {
    const result = this.state.finalResult;
    return this.state.phase === "game-over" &&
      (result?.victory === false || result?.title === "Falha na Missão");

  }

  updateCardTitle(title) {
    const header = this.quizCard.querySelector(".quiz-card-header h2");
    if (header) {
      header.textContent = title;
    }
  }

  showFeedback(message, type) {
    this.clearFeedback();

    const feedback = document.createElement("p");
    feedback.className = `quiz-inline-feedback is-${type}`;
    feedback.setAttribute("role", "status");
    feedback.setAttribute("aria-live", "polite");
    feedback.textContent = message;
    this.quizForm.appendChild(feedback);
  }

  clearFeedback() {
    this.quizForm.querySelector(".quiz-inline-feedback")?.remove();
  }
}