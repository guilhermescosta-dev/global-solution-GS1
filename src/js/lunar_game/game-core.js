// Adaptador visual do layout novo. A regra do jogo foi reaproveitada,
// mas os IDs antigos foram trocados por seletores semanticos do quiz atual.
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

    this.initThreeJS();
    this.render();
    this.checkFirstVisit();
  }

  initThreeJS() {
    const container = document.getElementById('base-3d-container');
    if (!container || typeof THREE === 'undefined') return;

    // Scene setup
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(60, container.clientWidth / container.clientHeight, 0.1, 1000);
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(this.renderer.domElement);

    // Lighting — moonbase ambience
    const ambientLight = new THREE.AmbientLight(0x1a2a4a, 3);
    this.scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xfff5e0, 3.5);
    sunLight.position.set(8, 10, 6);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 1024;
    sunLight.shadow.mapSize.height = 1024;
    this.scene.add(sunLight);

    const rimLight = new THREE.DirectionalLight(0x4466aa, 1.2);
    rimLight.position.set(-6, 4, -8);
    this.scene.add(rimLight);

    // Base Group
    this.baseGroup = new THREE.Group();
    this.scene.add(this.baseGroup);

    this.camera.position.set(0, 5.5, 10);
    this.camera.lookAt(0, 0.5, 0);

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      this.baseGroup.rotation.y += 0.004;
      this.renderer.render(this.scene, this.camera);
    };
    animate();

    // Handle resize
    window.addEventListener('resize', () => {
      this.camera.aspect = container.clientWidth / container.clientHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(container.clientWidth, container.clientHeight);
    });

    this.updateThreeJSBase();
  }

  updateThreeJSBase() {
    if (!this.baseGroup) return;

    // Clear existing base
    while (this.baseGroup.children.length > 0) {
      this.baseGroup.remove(this.baseGroup.children[0]);
    }

    // ── GROUND PLATFORM ──────────────────────────────────────────────────────
    const groundGeo = new THREE.CylinderGeometry(5, 5.4, 0.25, 48);
    const groundMat = new THREE.MeshPhongMaterial({
      color: 0x2a2a35, shininess: 20
    });
    const groundMesh = new THREE.Mesh(groundGeo, groundMat);
    groundMesh.position.y = -0.12;
    groundMesh.receiveShadow = true;
    this.baseGroup.add(groundMesh);

    // Regolith texture ring
    const ringGeo = new THREE.RingGeometry(4.6, 5.05, 48);
    const ringMat = new THREE.MeshPhongMaterial({
      color: 0x3d3a42, side: THREE.DoubleSide
    });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.rotation.x = -Math.PI / 2;
    ringMesh.position.y = 0.01;
    this.baseGroup.add(ringMesh);

    // ── CENTRAL HUB ──────────────────────────────────────────────────────────
    const hubGroup = new THREE.Group();

    // Main dome
    const domeGeo = new THREE.SphereGeometry(1.6, 40, 20, 0, Math.PI * 2, 0, Math.PI / 2);
    const domeMat = new THREE.MeshPhongMaterial({
      color: 0xdde8f0, shininess: 180, specular: 0x88bbcc
    });
    const domeMesh = new THREE.Mesh(domeGeo, domeMat);
    domeMesh.castShadow = true;
    hubGroup.add(domeMesh);

    // Dome ring collar
    const collarGeo = new THREE.CylinderGeometry(1.65, 1.65, 0.18, 40);
    const collarMat = new THREE.MeshPhongMaterial({ color: 0x778899, shininess: 60 });
    const collarMesh = new THREE.Mesh(collarGeo, collarMat);
    collarMesh.position.y = 0.09;
    hubGroup.add(collarMesh);

    // Dome base cylinder
    const hubBaseGeo = new THREE.CylinderGeometry(1.62, 1.75, 0.5, 40);
    const hubBaseMat = new THREE.MeshPhongMaterial({ color: 0x556677, shininess: 40 });
    const hubBaseMesh = new THREE.Mesh(hubBaseGeo, hubBaseMat);
    hubBaseMesh.position.y = 0.25;
    hubBaseMesh.castShadow = true;
    hubGroup.add(hubBaseMesh);

    // Antenna mast
    const mastGeo = new THREE.CylinderGeometry(0.04, 0.04, 1.2, 8);
    const mastMat = new THREE.MeshPhongMaterial({ color: 0xcccccc });
    const mastMesh = new THREE.Mesh(mastGeo, mastMat);
    mastMesh.position.y = 2.2;
    hubGroup.add(mastMesh);

    // Antenna dish
    const dishGeo = new THREE.SphereGeometry(0.28, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2);
    const dishMat = new THREE.MeshPhongMaterial({ color: 0xdddddd, shininess: 120, side: THREE.DoubleSide });
    const dishMesh = new THREE.Mesh(dishGeo, dishMat);
    dishMesh.rotation.x = Math.PI / 4;
    dishMesh.position.y = 2.85;
    hubGroup.add(dishMesh);

    // Blinking light on tip
    const blinkGeo = new THREE.SphereGeometry(0.07, 8, 8);
    const blinkMat = new THREE.MeshPhongMaterial({
      color: 0xff3300, emissive: 0xff2200, emissiveIntensity: 1.2
    });
    const blinkMesh = new THREE.Mesh(blinkGeo, blinkMat);
    blinkMesh.position.y = 2.9;
    hubGroup.add(blinkMesh);

    this.baseGroup.add(hubGroup);

    // ── MODULES ──────────────────────────────────────────────────────────────
    const allModuleKeys = ['painel_solar', 'estufa', 'reciclador_agua', 'gerador_oxigenio'];
    const angleStep = (Math.PI * 2) / 4;

    allModuleKeys.forEach((key, index) => {
      const level = this.state.activeModules[key] || 0;
      const angle = index * angleStep + Math.PI / 4; // offset 45° para ficar diagonal
      const radius = 3.4;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;

      // Connecting tunnel (always present as a pad, even at level 0)
      const tunnelLen = radius - 1.75;
      const tunnelGeo = new THREE.BoxGeometry(tunnelLen, 0.35, 0.55);
      const tunnelMat = new THREE.MeshPhongMaterial({ color: level > 0 ? 0x556677 : 0x333340 });
      const tunnelMesh = new THREE.Mesh(tunnelGeo, tunnelMat);
      tunnelMesh.castShadow = true;

      const tunnelGroup = new THREE.Group();
      tunnelGroup.position.set(
        Math.cos(angle) * (1.75 + tunnelLen / 2),
        0.18,
        Math.sin(angle) * (1.75 + tunnelLen / 2)
      );
      tunnelGroup.rotation.y = -angle;
      tunnelGroup.add(tunnelMesh);
      this.baseGroup.add(tunnelGroup);

      if (level === 0) return; // Slot vazio — só mostra o túnel inativo

      const modGroup = new THREE.Group();
      modGroup.position.set(x, 0, z);

      this._buildModule(modGroup, key, level);
      this.baseGroup.add(modGroup);
    });
  }

  _buildModule(group, key, level) {
    // Shared foundation pad
    const padGeo = new THREE.CylinderGeometry(0.95, 1.05, 0.22, 24);
    const padMat = new THREE.MeshPhongMaterial({ color: 0x445566 });
    const padMesh = new THREE.Mesh(padGeo, padMat);
    padMesh.position.y = 0.11;
    padMesh.castShadow = true;
    group.add(padMesh);

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

  // ── PAINEL SOLAR ─────────────────────────────────────────────────────────
  // Nível 1: 2 painéis pequenos numa haste
  // Nível 2: 4 painéis maiores em cruz
  // Nível 3: 6 painéis grandes em dois andares girados
  _buildSolarPanel(group, level) {
    const mastH = [0, 1.1, 1.4, 1.8][level];
    const mastGeo = new THREE.CylinderGeometry(0.07, 0.09, mastH, 10);
    const mastMat = new THREE.MeshPhongMaterial({ color: 0x889aaa });
    const mastMesh = new THREE.Mesh(mastGeo, mastMat);
    mastMesh.position.y = 0.22 + mastH / 2;
    mastMesh.castShadow = true;
    group.add(mastMesh);

    const panelMat = new THREE.MeshPhongMaterial({
      color: 0x1133aa, shininess: 200, specular: 0x4466ee
    });
    const frameMat = new THREE.MeshPhongMaterial({ color: 0x778899 });

    const addPanel = (w, h, px, py, pz, ry, rx = -Math.PI / 6) => {
      const pg = new THREE.BoxGeometry(w, 0.05, h);
      const pm = new THREE.Mesh(pg, panelMat);
      pm.position.set(px, py, pz);
      pm.rotation.y = ry;
      pm.rotation.x = rx;
      pm.castShadow = true;
      group.add(pm);
      // thin frame
      const fg = new THREE.BoxGeometry(w + 0.06, 0.07, h + 0.06);
      const fm = new THREE.Mesh(fg, frameMat);
      fm.position.set(px, py - 0.01, pz);
      fm.rotation.y = ry;
      fm.rotation.x = rx;
      group.add(fm);
    };

    if (level === 1) {
      addPanel(0.9, 0.55, -0.55, 1.15, 0, 0);
      addPanel(0.9, 0.55, 0.55, 1.15, 0, 0);
    } else if (level === 2) {
      addPanel(1.0, 0.6, -0.62, 1.4, 0, 0);
      addPanel(1.0, 0.6, 0.62, 1.4, 0, 0);
      addPanel(1.0, 0.6, 0, 1.4, -0.62, Math.PI / 2);
      addPanel(1.0, 0.6, 0, 1.4, 0.62, Math.PI / 2);
    } else if (level === 3) {
      // Lower array
      [-1, 0, 1].forEach(i => {
        addPanel(1.1, 0.65, i * 0.78, 1.35, 0, 0);
      });
      // Upper array rotated
      [-1, 0, 1].forEach(i => {
        addPanel(1.1, 0.65, 0, 1.85, i * 0.78, Math.PI / 2);
      });
    }
  }

  // ── ESTUFA ───────────────────────────────────────────────────────────────
  // Nível 1: dome pequeno translúcido com 3 plantas simples
  // Nível 2: dome médio + câmara de entrada
  // Nível 3: dome grande + câmara + anel de luz de crescimento
  _buildGreenhouse(group, level) {
    const domeScale = [0, 0.82, 1.05, 1.35][level];
    const domeGeo = new THREE.SphereGeometry(domeScale, 28, 16, 0, Math.PI * 2, 0, Math.PI / 2);
    const domeMat = new THREE.MeshPhongMaterial({
      color: 0xaaffcc, transparent: true, opacity: 0.38,
      shininess: 160, specular: 0xffffff, side: THREE.DoubleSide
    });
    const domeMesh = new THREE.Mesh(domeGeo, domeMat);
    domeMesh.position.y = 0.22;
    group.add(domeMesh);

    // Dome rim
    const rimGeo = new THREE.TorusGeometry(domeScale, 0.065, 10, 36);
    const rimMat = new THREE.MeshPhongMaterial({ color: 0x44bb66, shininess: 80 });
    const rimMesh = new THREE.Mesh(rimGeo, rimMat);
    rimMesh.rotation.x = Math.PI / 2;
    rimMesh.position.y = 0.22;
    group.add(rimMesh);

    // Airlock entry (level 2+)
    if (level >= 2) {
      const lockGeo = new THREE.CylinderGeometry(0.28, 0.28, 0.55, 16);
      const lockMat = new THREE.MeshPhongMaterial({ color: 0x557766 });
      const lockMesh = new THREE.Mesh(lockGeo, lockMat);
      lockMesh.position.set(domeScale * 0.7, 0.22 + 0.28, 0);
      lockMesh.castShadow = true;
      group.add(lockMesh);
    }

    // Growth ring (level 3)
    if (level === 3) {
      const ringGeo = new THREE.TorusGeometry(domeScale * 0.65, 0.08, 8, 32);
      const ringMat = new THREE.MeshPhongMaterial({
        color: 0xff44aa, emissive: 0xcc0077, emissiveIntensity: 0.5
      });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringMesh.rotation.x = Math.PI / 2;
      ringMesh.position.y = 0.55;
      group.add(ringMesh);
    }

    // Plants inside
    const plantCount = [0, 3, 5, 8][level];
    const plantColors = [0x22bb44, 0x33dd55, 0x55ff77];
    for (let i = 0; i < plantCount; i++) {
      const a = (i / plantCount) * Math.PI * 2;
      const r = domeScale * 0.45;
      const px = Math.cos(a) * r;
      const pz = Math.sin(a) * r;
      const h = 0.2 + Math.random() * 0.25;
      const stemGeo = new THREE.CylinderGeometry(0.025, 0.03, h, 6);
      const stemMat = new THREE.MeshPhongMaterial({ color: 0x226633 });
      const stemMesh = new THREE.Mesh(stemGeo, stemMat);
      stemMesh.position.set(px, 0.22 + h / 2, pz);
      group.add(stemMesh);

      const leafGeo = new THREE.SphereGeometry(0.11, 8, 6);
      const leafMat = new THREE.MeshPhongMaterial({ color: plantColors[i % 3] });
      const leafMesh = new THREE.Mesh(leafGeo, leafMat);
      leafMesh.position.set(px, 0.22 + h + 0.06, pz);
      group.add(leafMesh);
    }
  }

  // ── RECICLADOR DE ÁGUA ───────────────────────────────────────────────────
  // Nível 1: tanque cilíndrico simples com pipe
  // Nível 2: tanque maior + condensador externo
  // Nível 3: dois tanques + array de filtros + vapor partículas
  _buildWaterRecycler(group, level) {
    const tankMat = new THREE.MeshPhongMaterial({ color: 0x2299cc, shininess: 140, specular: 0x66ccff });
    const metalMat = new THREE.MeshPhongMaterial({ color: 0x6688aa });

    const tankR = [0, 0.55, 0.68, 0.55][level];
    const tankH = [0, 0.9, 1.1, 0.9][level];

    // Primary tank
    const tankGeo = new THREE.CylinderGeometry(tankR, tankR * 1.05, tankH, 24);
    const tankMesh = new THREE.Mesh(tankGeo, tankMat);
    tankMesh.position.y = 0.22 + tankH / 2;
    tankMesh.castShadow = true;
    group.add(tankMesh);

    // Tank cap
    const capGeo = new THREE.SphereGeometry(tankR, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2);
    const capMesh = new THREE.Mesh(capGeo, tankMat);
    capMesh.position.y = 0.22 + tankH;
    group.add(capMesh);

    // Pipes at base
    const pipeGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.5, 8);
    const pipeMat = new THREE.MeshPhongMaterial({ color: 0x446688 });
    [-0.3, 0.3].forEach(ox => {
      const pm = new THREE.Mesh(pipeGeo, pipeMat);
      pm.position.set(ox, 0.22 + 0.25, tankR + 0.04);
      pm.rotation.z = Math.PI / 2;
      group.add(pm);
    });

    if (level >= 2) {
      // Condenser fins
      for (let i = 0; i < 4; i++) {
        const finGeo = new THREE.BoxGeometry(0.08, tankH * 0.75, 0.42);
        const finMesh = new THREE.Mesh(finGeo, metalMat);
        const fa = (i / 4) * Math.PI * 2;
        finMesh.position.set(Math.cos(fa) * (tankR + 0.12), 0.22 + tankH * 0.5, Math.sin(fa) * (tankR + 0.12));
        group.add(finMesh);
      }
    }

    if (level === 3) {
      // Second smaller tank
      const tank2Geo = new THREE.CylinderGeometry(0.38, 0.4, 0.75, 18);
      const tank2Mesh = new THREE.Mesh(tank2Geo, tankMat);
      tank2Mesh.position.set(0.95, 0.22 + 0.375, 0);
      tank2Mesh.castShadow = true;
      group.add(tank2Mesh);

      const cap2Geo = new THREE.SphereGeometry(0.38, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2);
      const cap2Mesh = new THREE.Mesh(cap2Geo, tankMat);
      cap2Mesh.position.set(0.95, 0.22 + 0.75, 0);
      group.add(cap2Mesh);

      // Filter column
      const filtGeo = new THREE.CylinderGeometry(0.12, 0.15, 1.1, 12);
      const filtMat = new THREE.MeshPhongMaterial({ color: 0x88ddff, shininess: 200 });
      const filtMesh = new THREE.Mesh(filtGeo, filtMat);
      filtMesh.position.set(-0.85, 0.22 + 0.55, 0);
      group.add(filtMesh);

      // Glowing indicator on filter
      const glowGeo = new THREE.SphereGeometry(0.1, 8, 8);
      const glowMat = new THREE.MeshPhongMaterial({
        color: 0x00ddff, emissive: 0x0099cc, emissiveIntensity: 0.8
      });
      const glowMesh = new THREE.Mesh(glowGeo, glowMat);
      glowMesh.position.set(-0.85, 0.22 + 1.2, 0);
      group.add(glowMesh);
    }
  }

  // ── GERADOR DE OXIGÊNIO ──────────────────────────────────────────────────
  // Nível 1: reactor vertical simples com anel de saída
  // Nível 2: reactor mais alto + 2 cilindros de armazenamento
  // Nível 3: reactor grande + 4 armazenamentos + radiadores
  _buildOxygenGenerator(group, level) {
    const reactorMat = new THREE.MeshPhongMaterial({ color: 0xeeeeff, shininess: 100 });
    const accentMat = new THREE.MeshPhongMaterial({
      color: 0x55aaff, emissive: 0x2255aa, emissiveIntensity: 0.4
    });
    const storageMat = new THREE.MeshPhongMaterial({ color: 0xbbccdd, shininess: 60 });

    const rH = [0, 0.9, 1.3, 1.5][level];
    const rR = [0, 0.45, 0.52, 0.58][level];

    // Reactor body
    const reactGeo = new THREE.CylinderGeometry(rR, rR * 1.08, rH, 20);
    const reactMesh = new THREE.Mesh(reactGeo, reactorMat);
    reactMesh.position.y = 0.22 + rH / 2;
    reactMesh.castShadow = true;
    group.add(reactMesh);

    // Top dome
    const topGeo = new THREE.SphereGeometry(rR, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2);
    const topMesh = new THREE.Mesh(topGeo, reactorMat);
    topMesh.position.y = 0.22 + rH;
    group.add(topMesh);

    // Glowing output ring
    const ringGeo = new THREE.TorusGeometry(rR + 0.08, 0.07, 8, 28);
    const ringMesh = new THREE.Mesh(ringGeo, accentMat);
    ringMesh.rotation.x = Math.PI / 2;
    ringMesh.position.y = 0.22 + rH * 0.6;
    group.add(ringMesh);

    // Emission vents (small cylinders around reactor)
    const ventCount = level === 1 ? 3 : level === 2 ? 4 : 6;
    for (let i = 0; i < ventCount; i++) {
      const va = (i / ventCount) * Math.PI * 2;
      const vGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.22, 6);
      const vMat = new THREE.MeshPhongMaterial({ color: 0x99aacc });
      const vMesh = new THREE.Mesh(vGeo, vMat);
      vMesh.position.set(
        Math.cos(va) * (rR + 0.06),
        0.22 + rH * 0.85,
        Math.sin(va) * (rR + 0.06)
      );
      vMesh.rotation.x = Math.PI / 6;
      vMesh.rotation.y = -va;
      group.add(vMesh);
    }

    if (level >= 2) {
      // Storage tanks flanking reactor
      const stH = 0.75;
      const stR = 0.25;
      [-0.82, 0.82].forEach(ox => {
        const stGeo = new THREE.CylinderGeometry(stR, stR, stH, 14);
        const stMesh = new THREE.Mesh(stGeo, storageMat);
        stMesh.position.set(ox, 0.22 + stH / 2, 0);
        stMesh.castShadow = true;
        group.add(stMesh);

        const stCapGeo = new THREE.SphereGeometry(stR, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2);
        const stCapMesh = new THREE.Mesh(stCapGeo, storageMat);
        stCapMesh.position.set(ox, 0.22 + stH, 0);
        group.add(stCapMesh);
      });
    }

    if (level === 3) {
      // Two more tanks on Z axis
      [-0.82, 0.82].forEach(oz => {
        const stH = 0.75;
        const stR = 0.25;
        const stGeo = new THREE.CylinderGeometry(stR, stR, stH, 14);
        const stMesh = new THREE.Mesh(stGeo, storageMat);
        stMesh.position.set(0, 0.22 + stH / 2, oz);
        group.add(stMesh);

        const stCapGeo = new THREE.SphereGeometry(stR, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2);
        const stCapMesh = new THREE.Mesh(stCapGeo, storageMat);
        stCapMesh.position.set(0, 0.22 + stH, oz);
        group.add(stCapMesh);
      });

      // Radiator fins
      for (let i = 0; i < 4; i++) {
        const fa = (i / 4) * Math.PI * 2 + Math.PI / 4;
        const radGeo = new THREE.BoxGeometry(0.06, rH * 0.7, 0.55);
        const radMat = new THREE.MeshPhongMaterial({ color: 0xaabbcc });
        const radMesh = new THREE.Mesh(radGeo, radMat);
        radMesh.position.set(
          Math.cos(fa) * (rR + 0.16),
          0.22 + rH * 0.5,
          Math.sin(fa) * (rR + 0.16)
        );
        radMesh.rotation.y = fa;
        group.add(radMesh);
      }
    }
  }

  checkFirstVisit() {
    const visited = localStorage.getItem('lunar-tutorial-visited');
    if (!visited && typeof introJs !== 'undefined') {
      setTimeout(() => {
        this.startTutorial();
        localStorage.setItem('lunar-tutorial-visited', 'true');
      }, 800);
    }

    // Wire the tutorial button (always, not just first visit)
    const btn = document.getElementById('btn-tutorial');
    if (btn) {
      btn.addEventListener('click', () => {
        if (typeof introJs !== 'undefined') {
          this.startTutorial();
        }
      });
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
              element: document.querySelector('.quiz-card'),
              intro: `
              <div class="selene-intro-step">
                <div class="selene-intro-icon"><i class="bi bi-question-circle-fill"></i></div>
                <h3>Perguntas Científicas</h3>
                <p>A cada semana você responde perguntas sobre ciência lunar e espacial. Acertos rendem recursos extras.</p>
                <p>No final de cada semana, você escolhe como <strong>investir os recursos</strong> para expandir a base.</p>
                <p class="selene-intro-tip"><i class="bi bi-lightbulb-fill text-warning"></i> Quanto mais você acertar, mais rápido sua base cresce!</p>
              </div>
            `
            }
          ]
        }).start();
  }

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

    if (!changedSection) {
      return;
    }

    setTimeout(() => {
      this.root.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 60);
  }

  render() {
    this.updateResources();
    this.updateProgress();
    this.updateProgressVisibility();
    this.updateThreeJSBase();

    if (this.state.phase === "construction") {
      this.renderConstruction();
      return;
    }

    if (this.state.phase === "week-summary") {
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
      this.resourcesSection.hidden = this.state.phase === "game-over";
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
    if (!chip) {
      return;
    }

    const number = chip.querySelector(".progress-chip-heading strong");
    const blocks = chip.querySelector(".progress-blocks");

    if (number) {
      number.textContent = `${config.current}/${config.total}`;
    }

    if (!blocks) {
      return;
    }

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
        block.classList.add(config.completedStatus);
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
