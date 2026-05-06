// ============================================================
//  YUKI-CHAN — hologram.js
//  3D hologram viewer (VRM/GLB) with canvas fallback
// ============================================================

let holoRenderer = null, holoScene = null, holoCamera = null;
let holoModel = null, holoClock = null, holoAnim = null;

// ── Open ───────────────────────────────────────────────────
function openHologram() {
  const modal = document.getElementById('holoModal');
  if (modal) modal.classList.add('open');
  setTimeout(() => {
    const canvas = document.getElementById('holoCanvas');
    if (!canvas) return;
    canvas.width  = canvas.offsetWidth  || 300;
    canvas.height = canvas.offsetHeight || 300;
    initHolo(canvas);
  }, 180);
}

// ── Close ──────────────────────────────────────────────────
function closeHologram() {
  const modal = document.getElementById('holoModal');
  if (modal) modal.classList.remove('open');
  destroyHolo();
}

// ── Init (try 3D, fallback to 2D) ─────────────────────────
async function initHolo(canvas) {
  try {
    await loadThree();
    await initThreeHolo(canvas);
  } catch (e) {
    console.warn('[Hologram] 3D failed, using 2D fallback:', e.message);
    draw2DHolo(canvas);
  }
}

// ── Three.js hologram ──────────────────────────────────────
async function initThreeHolo(canvas) {
  const T = window.THREE;
  const w = canvas.width, h = canvas.height;

  holoRenderer = new T.WebGLRenderer({ canvas, alpha: true, antialias: true });
  holoRenderer.setSize(w, h);
  holoRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  holoScene  = new T.Scene();
  holoCamera = new T.PerspectiveCamera(30, w / h, 0.1, 20);
  holoCamera.position.set(0, 1.3, 2.8);

  // Lights
  holoScene.add(new T.AmbientLight(0x00f5ff, .7));
  const d = new T.DirectionalLight(0xffffff, .9);
  d.position.set(1, 2, 2);
  holoScene.add(d);
  const r = new T.DirectionalLight(0xff00ff, .4);
  r.position.set(-2, 0, -1);
  holoScene.add(r);

  holoClock = new T.Clock();

  // Load GLB/VRM
  if (!T.GLTFLoader) await loadScript('https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/GLTFLoader.js');
  const loader = new T.GLTFLoader();

  await new Promise((res, rej) => {
    loader.load('model.glb', gltf => {
      holoModel = gltf.scene;
      // Center
      const box = new T.Box3().setFromObject(holoModel);
      const c   = box.getCenter(new T.Vector3());
      holoModel.position.sub(c);
      const sz  = box.getSize(new T.Vector3());
      holoModel.position.y += sz.y * .5 - .4;
      // Hologram material
      holoModel.traverse(o => {
        if (o.isMesh) {
          const mats = Array.isArray(o.material) ? o.material : [o.material];
          mats.forEach(m => {
            m.transparent = true;
            m.opacity = .85;
            if (m.color) m.color.setHex(0x88eeff);
            if (m.emissive) m.emissive.setHex(0x003344);
          });
        }
      });
      holoScene.add(holoModel);
      res();
    }, undefined, rej);
  });

  animHolo();
}

function animHolo() {
  if (!holoRenderer) return;
  if (holoModel) {
    const t = Date.now();
    holoModel.rotation.y = Math.sin(t * .0005) * .2;
    holoModel.position.y += Math.sin(t * .001) * .0005;
  }
  // Flicker
  if (holoRenderer.domElement)
    holoRenderer.domElement.style.opacity = (.78 + .22 * Math.sin(Date.now() * .003));
  holoRenderer.render(holoScene, holoCamera);
  holoAnim = requestAnimationFrame(animHolo);
}

function destroyHolo() {
  if (holoAnim)     cancelAnimationFrame(holoAnim);
  if (holoRenderer) { holoRenderer.dispose(); holoRenderer = null; }
  holoScene = holoCamera = holoModel = null;
}

// ── 2D canvas hologram fallback ────────────────────────────
function draw2DHolo(canvas) {
  const ctx = canvas.getContext('2d');
  const img = new Image();
  img.src = 'avatar.jpg';
  img.onload = () => {
    let f = 0, id = null;
    const loop = () => {
      const w = canvas.width, h = canvas.height;
      ctx.clearRect(0, 0, w, h);
      ctx.save();
      // Base image
      ctx.globalAlpha = .83;
      ctx.drawImage(img, 0, 0, w, h);
      // Cyan screen blend
      ctx.globalCompositeOperation = 'screen';
      ctx.globalAlpha = .28 + .08 * Math.sin(f * .04);
      const g = ctx.createRadialGradient(w/2, h/2, 0, w/2, h/2, w/2);
      g.addColorStop(0, '#00f5ff'); g.addColorStop(1, 'transparent');
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
      // Scan lines
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = .07; ctx.fillStyle = '#000';
      for (let y = 0; y < h; y += 3) ctx.fillRect(0, y, w, 1.5);
      // Edge glow
      ctx.globalAlpha = .18 + .05 * Math.sin(f * .025);
      const eg = ctx.createRadialGradient(w/2,h/2,w*.28,w/2,h/2,w/2);
      eg.addColorStop(0,'transparent'); eg.addColorStop(1,'#00f5ff');
      ctx.fillStyle = eg; ctx.fillRect(0, 0, w, h);
      // Glitch
      if (f % 90 < 3) {
        ctx.globalAlpha = .13; ctx.fillStyle = '#ff00ff';
        ctx.fillRect(0, Math.random()*h, w, 3+Math.random()*7);
      }
      ctx.restore();
      f++;
      id = requestAnimationFrame(loop);
    };
    loop();
    // Store cancel id on canvas
    canvas._holoId = id;
    const obs = new MutationObserver(() => {
      if (!document.contains(canvas)) { cancelAnimationFrame(canvas._holoId); obs.disconnect(); }
    });
    obs.observe(document.body, { childList: true, subtree: true });
  };
  img.onerror = () => {
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#00f5ff22';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#00f5ff';
    ctx.font = '14px Nunito'; ctx.textAlign = 'center';
    ctx.fillText('◈ HOLOGRAM ◈', canvas.width/2, canvas.height/2);
  };
}

// ── Helpers ────────────────────────────────────────────────
function loadThree() {
  if (window.THREE) return Promise.resolve();
  return loadScript('https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js');
}
function loadScript(src) {
  return new Promise((res, rej) => {
    const s = document.createElement('script');
    s.src = src; s.onload = res; s.onerror = () => rej(new Error('Script load failed: ' + src));
    document.head.appendChild(s);
  });
}

window.openHologram  = openHologram;
window.closeHologram = closeHologram;
