// Interactive multi-view demo: left, the scene's point cloud with every camera drawn as a frustum (click one to pick it);
// right, the photo from the picked camera. Data per scene in mv/<key>/: scene.json, pts.bin (int16 xyz), col.bin (uint8 rgb), NNN.jpg.
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { LineSegments2 } from "three/addons/lines/LineSegments2.js";
import { LineSegmentsGeometry } from "three/addons/lines/LineSegmentsGeometry.js";
import { LineMaterial } from "three/addons/lines/LineMaterial.js";

const root = document.getElementById("mvdemo");
const SCENES = JSON.parse(root.dataset.scenes);                 // [{key, label}]
const canvas = root.querySelector("canvas"), photo = root.querySelector(".mv-photo img"), cap = root.querySelector(".mv-cap"), bar = root.querySelector(".mv-load i");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true }); renderer.setPixelRatio(Math.min(2, devicePixelRatio));
const scene = new THREE.Scene(), cam3 = new THREE.PerspectiveCamera(45, 1, 0.01, 100), controls = new OrbitControls(cam3, canvas);
controls.enableDamping = true; controls.dampingFactor = 0.08; controls.rotateSpeed = 0.7;
const COL = { out: 0x9a8f83, inp: 0xe8820c, sel: 0x1f1b17, inpSel: 0xb4520a, hov: 0x2563c9 };
let group = null, cams = [], sel = -1, hov = -1, cur = null, loadId = 0;
const tip = root.querySelector(".mv-tip"), tipImg = tip.querySelector("img"), tipTxt = tip.querySelector("span");
// fetch with byte progress (the server sends Content-Length)
async function fetchBuf(url, onBytes) {
  const r = await fetch(url), rd = r.body.getReader(), parts = []; let n = 0;
  for (;;) { const { done, value } = await rd.read(); if (done) break; parts.push(value); n += value.length; onBytes(n, +r.headers.get("content-length") || 0); }
  const out = new Uint8Array(n); let o = 0; for (const p of parts) { out.set(p, o); o += p.length; } return out.buffer;
}
const pw = root.querySelector(".pw"), pbar = pw.querySelector(".mv-load i"), photoCache = new Map(); let photoId = 0;
async function showPhoto(src, alt) {                             // right-hand photo: thin bar while it downloads
  const id = ++photoId; photo.alt = alt;
  if (photoCache.has(src)) { photo.src = photoCache.get(src); return; }
  pw.classList.add("loading"); pbar.style.width = "0";
  const buf = await fetchBuf(src, (n, t) => { if (t) pbar.style.width = (n / t * 100) + "%"; });
  const url = URL.createObjectURL(new Blob([buf], { type: "image/jpeg" })); photoCache.set(src, url);
  if (id === photoId) { photo.src = url; pw.classList.remove("loading"); }
}
const texLoader = new THREE.TextureLoader(), wide = [];          // wide = materials of the frustum lines (need the canvas size)

function resize() { const r = canvas.getBoundingClientRect(); renderer.setSize(r.width, r.height, false); cam3.aspect = r.width / r.height; cam3.updateProjectionMatrix(); wide.forEach(m => m.resolution.set(r.width, r.height)); }
new ResizeObserver(resize).observe(canvas);

function frustum(c, fovy, d, color) {                          // OpenCV camera: x right, y down, z forward
  const h = d * Math.tan(fovy * Math.PI / 360), w = h * c.aspect, R = c.rot, p = c.pos;
  const W = (x, y, z) => new THREE.Vector3(R[0][0] * x + R[0][1] * y + R[0][2] * z + p[0], R[1][0] * x + R[1][1] * y + R[1][2] * z + p[1], R[2][0] * x + R[2][1] * y + R[2][2] * z + p[2]);
  const o = W(0, 0, 0), a = W(-w, -h, d), b = W(w, -h, d), cc = W(w, h, d), e = W(-w, h, d);
  const segs = [o, a, o, b, o, cc, o, e, a, b, b, cc, cc, e, e, a], mid = new THREE.Vector3().add(a).add(b).add(cc).add(e).multiplyScalar(0.25).add(o).multiplyScalar(0.5);
  // wide lines (plain WebGL lines are always 1 px): inputs bolder than generated views
  const r = canvas.getBoundingClientRect(), m = new LineMaterial({ color, linewidth: c.role === "input" ? 3.2 : 1.8 }); m.resolution.set(r.width, r.height); wide.push(m);
  const lines = new LineSegments2(new LineSegmentsGeometry().setPositions(segs.flatMap(p => [p.x, p.y, p.z])), m);
  return { lines, corners: [a, b, cc, e], o, mid };
}

async function load(key) {
  const id = ++loadId; root.classList.add("loading"); bar.style.width = "8%";
  const base = "mv/" + key + "/", S = await (await fetch(base + "scene.json")).json(); bar.style.width = "25%";
  const got = [0, 0], tot = [0, 0], prog = k => (n, t) => { got[k] = n; tot[k] = t; const T = tot[0] + tot[1]; if (T) bar.style.width = (25 + 75 * (got[0] + got[1]) / T) + "%"; };
  const [pb, cb] = await Promise.all([fetchBuf(base + "pts.bin", prog(0)), fetchBuf(base + "col.bin", prog(1))]);
  if (id !== loadId) return;                                    // a newer scene was asked for meanwhile
  bar.style.width = "100%";
  if (group) { scene.remove(group); group.traverse(o => { o.geometry && o.geometry.dispose(); o.material && o.material.dispose(); }); }
  group = new THREE.Group(); scene.add(group); cur = S; wide.length = 0; fly = null;
  const q = new Int16Array(pb), pos = new Float32Array(q.length); for (let i = 0; i < q.length; i++) pos[i] = q[i] / 32767 * S.lim;
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(pos, 3)); g.setAttribute("color", new THREE.BufferAttribute(new Uint8Array(cb), 3, true));
  group.add(new THREE.Points(g, new THREE.PointsMaterial({ size: 0.011, vertexColors: true, sizeAttenuation: true })));
  const d = 0.13; cams = S.cams.map(c => Object.assign(frustum(c, S.fovy, d, c.role === "input" ? COL.inp : COL.out), { c }));
  cams.forEach(f => group.add(f.lines)); hov = -1; sel = -1; hideTip();
  cam3.up.set(...S.up); controls.target.set(0, 0, 0);
  const first = S.cams.findIndex(c => c.role === "input"), c0 = S.cams[first >= 0 ? first : 0];           // start behind and above the first input camera
  const back = new THREE.Vector3(c0.pos[0], c0.pos[1], c0.pos[2]).multiplyScalar(1.9).add(new THREE.Vector3(...S.up).multiplyScalar(0.9));
  cam3.position.copy(back); controls.update();
  select(first >= 0 ? first : 0); root.classList.remove("loading");
}

let selPlane = null;
// fly the 3D view to just behind and above a camera, looking at the scene centre
let fly = null;
function flyTo(i) {
  const c = cams[i].c, R = c.rot, p = new THREE.Vector3(...c.pos), fwd = new THREE.Vector3(R[0][2], R[1][2], R[2][2]).normalize(), up = new THREE.Vector3(...cur.up);
  const to = p.clone().addScaledVector(fwd, -0.55).addScaledVector(up, 0.25);
  fly = { t0: performance.now(), from: cam3.position.clone(), to, tFrom: controls.target.clone(), tTo: new THREE.Vector3(0, 0, 0) };
}
function select(i, move) {
  if (!cur || i < 0 || i >= cams.length) return;
  if (move) flyTo(i);
  const prev = sel; sel = i; if (prev >= 0) paint(prev);
  const f = cams[i]; paint(i);
  if (selPlane) { group.remove(selPlane); selPlane.geometry.dispose(); selPlane.material.map && selPlane.material.map.dispose(); selPlane.material.dispose(); }
  const [a, b, c, e] = f.corners, g = new THREE.BufferGeometry();          // the photo shown inside the picked frustum
  g.setAttribute("position", new THREE.BufferAttribute(new Float32Array([a, b, c, a, c, e].flatMap(v => [v.x, v.y, v.z])), 3));
  g.setAttribute("uv", new THREE.BufferAttribute(new Float32Array([0, 1, 1, 1, 1, 0, 0, 1, 1, 0, 0, 0]), 2));
  const src = "mv/" + cur.key + "/" + f.c.file; selPlane = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ side: THREE.DoubleSide })); selPlane.visible = false;   // shown once its photo has loaded
  const plane = selPlane; plane.material.map = texLoader.load(src, () => { plane.material.needsUpdate = true; plane.visible = true; });
  group.add(selPlane);
  showPhoto(src, cur.name + ", " + (f.c.role === "input" ? "reference view" : "generated view"));
  const outs = cams.filter(x => x.c.role === "output"), k = outs.indexOf(f);
  cap.textContent = f.c.role === "input" ? "Reference view " + (cams.indexOf(f) + 1) : "Generated view " + (k + 1) + " of " + outs.length + " shown (" + cur.n_out + " generated)";
}

let down = null;
canvas.addEventListener("pointerdown", e => { down = [e.clientX, e.clientY]; fly = null; });   // grabbing the view stops a fly-in
const v3 = new THREE.Vector3();
function nearest(e) {                                            // nearest camera on screen (its centre or the middle of its frustum), within 28 px
  const r = canvas.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top; let best = -1, bd = 28;
  cams.forEach((f, i) => {
    for (const p of [f.o, f.mid]) {
      v3.copy(p).project(cam3); if (v3.z > 1) continue;
      const d = Math.hypot((v3.x + 1) / 2 * r.width - x, (1 - v3.y) / 2 * r.height - y); if (d < bd) { bd = d; best = i; }
    }
  });
  return best;
}
canvas.addEventListener("pointerup", e => {                     // a click, not a drag: pick the camera under the pointer
  if (!down || Math.hypot(e.clientX - down[0], e.clientY - down[1]) > 4) return;
  const i = nearest(e); if (i >= 0) { select(i, true); hideTip(); }
});
function base(i) { return cams[i].c.role === "input" ? COL.inp : COL.out; }
function paint(i) { if (i >= 0 && cams[i]) cams[i].lines.material.color.set(i === sel ? (cams[i].c.role === "input" ? COL.inpSel : COL.sel) : i === hov ? COL.hov : base(i)); }   // a picked input stays orange, just deeper
function label(f) { const outs = cams.filter(x => x.c.role === "output"); return f.c.role === "input" ? "Reference view" : "Generated view " + (outs.indexOf(f) + 1); }
function hideTip() { tip.hidden = true; }
// hover: tint the camera under the pointer and show a small preview; only a click switches the view
canvas.addEventListener("pointermove", e => {
  if (e.buttons) { hideTip(); return; }
  const i = nearest(e), prev = hov; hov = i; if (prev !== i) { paint(prev); paint(i); }
  canvas.style.cursor = i >= 0 ? "pointer" : "grab";
  if (i < 0 || i === sel) { hideTip(); return; }
  const r = canvas.getBoundingClientRect(), f = cams[i]; tip.hidden = false;
  tipImg.src = "mv/" + cur.key + "/" + f.c.file; tipTxt.textContent = label(f);
  tip.style.left = Math.min(e.clientX - r.left + 14, r.width - 132) + "px"; tip.style.top = Math.max(e.clientY - r.top - 96, 6) + "px";
});
canvas.addEventListener("pointerleave", () => { const prev = hov; hov = -1; paint(prev); hideTip(); });
root.addEventListener("keydown", e => { if (e.key === "ArrowRight") select((sel + 1) % cams.length, true); if (e.key === "ArrowLeft") select((sel - 1 + cams.length) % cams.length, true); });

const tabs = root.querySelectorAll(".mv-tabs button");          // the sliding pill is the page's shared .seg code
tabs.forEach(b => b.addEventListener("click", () => { tabs.forEach(x => x.setAttribute("aria-pressed", String(x === b))); load(b.dataset.key); }));
(function tick(now) {
  if (fly) {                                                     // 0.8 s ease-in-out
    const u = Math.min(1, ((now || performance.now()) - fly.t0) / 800), k = u < .5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2;
    cam3.position.lerpVectors(fly.from, fly.to, k); controls.target.lerpVectors(fly.tFrom, fly.tTo, k); if (u >= 1) fly = null;
  }
  controls.update(); renderer.render(scene, cam3); requestAnimationFrame(tick);
})();
resize(); load(SCENES[0].key);
