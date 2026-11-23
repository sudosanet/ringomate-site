// WebGPU with an automatic WebGL2 fallback. three-vrm 3.5.5's MToonNodeMaterial is patched for three r187
// (patches/: pixiv/three-vrm#1890 and #1909); drop the patch once a release includes them.
import * as THREE from "three/webgpu";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { MToonMaterialLoaderPlugin, VRMLoaderPlugin, VRMUtils, type VRM, type VRMHumanBoneName } from "@pixiv/three-vrm";
import { MToonNodeMaterial } from "@pixiv/three-vrm/nodes";
import { BPM, JUMP_HEIGHT, JUMP_SECONDS, POSES, jump, type Act, type Rot } from "./poses";
import { makeProp, type PropKind } from "./props";

const MODEL = "/models/tsukuyomi.vrm";
const FACES = ["happy", "relaxed", "Surprised", "lookup", "blink_r"];

export type Mascot = {
  act(a: Act): void;
  say(text: string, ms?: number): void;
  hold(p: PropKind | null): void;
  hop(): void;
  /** The click reaction: crouch, leap with both arms up, land with a squash. */
  jump(): void;
  debug?: { vrm: VRM; override: Partial<Record<VRMHumanBoneName, Rot>> };
};

/** Starts the live mascot on `canvas`; `bubble` is an element kept above her head. Throws if nothing can be drawn. */
export async function start(canvas: HTMLCanvasElement, bubble: HTMLElement): Promise<Mascot> {
  const forceWebGL = new URLSearchParams(location.search).has("webgl");
  const renderer = new THREE.WebGPURenderer({ canvas, alpha: true, antialias: true, forceWebGL, powerPreference: "low-power" });
  await renderer.init();
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  scene.add(new THREE.HemisphereLight(0xffffff, 0xe6deff, 2.2));
  const sun = new THREE.DirectionalLight(0xffffff, 1.6);
  sun.position.set(0.6, 1.4, 2);
  scene.add(sun);

  const loader = new GLTFLoader();
  loader.register((parser) => new VRMLoaderPlugin(parser, { mtoonMaterialPlugin: new MToonMaterialLoaderPlugin(parser, { materialType: MToonNodeMaterial }) }));
  const gltf = await loader.loadAsync(MODEL);
  const vrm: VRM = gltf.userData.vrm;
  VRMUtils.removeUnnecessaryVertices(gltf.scene);
  VRMUtils.combineSkeletons(gltf.scene);
  VRMUtils.rotateVRM0(vrm);
  vrm.scene.traverse((o) => (o.frustumCulled = false));
  // Keep the skirt calm (the model's own skirt springs are very loose): it must never fly up when she jumps or spins.
  for (const j of vrm.springBoneManager?.joints ?? []) {
    if (!/skirt/i.test(j.bone.name)) continue;
    j.settings.dragForce = Math.max(j.settings.dragForce, 0.7);
    j.settings.stiffness = Math.max(j.settings.stiffness, 1.6);
    j.settings.gravityPower = Math.max(j.settings.gravityPower, 0.8);
  }
  scene.add(vrm.scene);

  // Framed from the head bone (the bounding box includes long hair): head to toe, from a little above.
  vrm.scene.updateMatrixWorld(true);
  const height = vrm.humanoid.getRawBoneNode("head")!.getWorldPosition(new THREE.Vector3()).y + 0.12;
  const camera = new THREE.PerspectiveCamera(24, 1, 0.1, 20);
  const frame = () => {
    const r = canvas.getBoundingClientRect();
    if (!r.width || !r.height) return;
    renderer.setSize(r.width, r.height, false);
    camera.aspect = r.width / r.height;
    // Fit the whole body (with room for a hop and raised hands) in whichever side is tighter.
    const tan = Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2);
    const dist = Math.max((height * 1.3) / (2 * tan), (height * 0.75) / (2 * tan * camera.aspect));
    // Aim at the middle of the body (feet to raised hands), from a little above, so she sits centred in the frame.
    camera.position.set(0, height * 0.62, dist);
    camera.lookAt(0, height * 0.55, 0);
    camera.updateProjectionMatrix();
  };
  new ResizeObserver(frame).observe(canvas);
  frame();

  const target = new THREE.Object3D();
  scene.add(target);
  if (vrm.lookAt) vrm.lookAt.target = target;
  const pointer = new THREE.Vector2(0, 0.3);
  addEventListener("pointermove", (ev) => {
    const r = canvas.getBoundingClientRect();
    pointer.set(THREE.MathUtils.clamp(((ev.clientX - r.left) / r.width) * 2 - 1, -3, 3), THREE.MathUtils.clamp(-(((ev.clientY - r.top) / r.height) * 2 - 1), -2, 2));
  }, { passive: true });

  const bone = (n: VRMHumanBoneName) => vrm.humanoid.getNormalizedBoneNode(n);
  const hips = bone("hips")!;
  const hipsY = hips.position.y;
  const BONES: VRMHumanBoneName[] = ["hips", "spine", "chest", "neck", "head", "leftUpperArm", "leftLowerArm", "leftHand", "rightUpperArm", "rightLowerArm",
    "rightHand", "leftUpperLeg", "leftLowerLeg", "leftFoot", "rightUpperLeg", "rightLowerLeg", "rightFoot"];
  const hipsX = hips.position.x;
  // Scrolling tilts her like inertia: she leans against the scroll and springs back.
  let lastY = scrollY, lean = 0, leanV = 0;
  addEventListener("scroll", () => { leanV += THREE.MathUtils.clamp((scrollY - lastY) * 0.0012, -0.08, 0.08); lastY = scrollY; }, { passive: true });
  const em = vrm.expressionManager;
  const faces = FACES.filter((f) => em?.getExpression(f));

  let act: Act = "hello", actAt = 0, hopAt = -9, jumpAt = -9, sayUntil = 0, nextBlink = 1.5;
  let prop: THREE.Object3D | null = null;
  const override: Partial<Record<VRMHumanBoneName, Rot>> = {};
  const clock = new THREE.Timer();
  const q = new THREE.Quaternion(), eu = new THREE.Euler(), head = new THREE.Vector3(), hand = new THREE.Vector3(), ground = new THREE.Vector3();

  const tick = () => {
    clock.update();
    const dt = Math.min(clock.getDelta(), 1 / 20), t = clock.getElapsed();
    const pose = POSES[act](t - actAt, ((t * BPM) / 60) % 1);
    const k = 1 - Math.exp(-dt * 10);
    leanV += (-lean * 60 - leanV * 9) * dt; // damped spring
    lean = THREE.MathUtils.clamp(lean + leanV * dt * 10, -0.35, 0.35);
    const ju = (t - jumpAt) / JUMP_SECONDS, J = ju >= 0 && ju < 1 ? jump(ju) : null;
    const kj = J ? 1 - Math.exp(-dt * 30) : k; // the jump is fast: follow it closely
    for (const n of BONES) {
      const r = override[n] ?? J?.bones[n] ?? pose.bones[n] ?? [0, 0, 0];
      const extra = n === "spine" ? lean : n === "head" ? -lean * 0.6 : 0;
      bone(n)?.quaternion.slerp(q.setFromEuler(eu.set(r[0] + extra, r[1], r[2])), kj);
    }
    const hop = Math.max(0, Math.sin(Math.min(1, (t - hopAt) / 0.45) * Math.PI));
    const crouch = J ? -0.1 * Math.max(0, -(J.bones.leftLowerLeg?.[0] ?? 0)) / 1.4 : 0;
    const lift = (J?.lift ?? 0) * JUMP_HEIGHT;
    hips.position.y = J ? hipsY + lift + crouch : THREE.MathUtils.lerp(hips.position.y, hipsY + (pose.hipsY ?? 0) + hop * 0.07, Math.max(k, hop > 0 ? 0.5 : 0));
    hips.position.x = THREE.MathUtils.lerp(hips.position.x, hipsX + (pose.hipsX ?? 0), k);

    if (em) {
      for (const f of faces) em.setValue(f, THREE.MathUtils.lerp(em.getValue(f) ?? 0, (J || hop > 0) && f === "happy" ? 1 : pose.face?.[f] ?? 0, k));
      if (t > nextBlink) nextBlink = t + 2 + Math.random() * 3;
      const b = nextBlink - t < 0.15 ? Math.sin(((nextBlink - t) / 0.15) * Math.PI) : 0;
      em.setValue("blink", Math.max(b, pose.face?.blink ?? 0));
      const talking = t < sayUntil; // lip flap while a line is shown
      em.setValue("aa", talking ? Math.max(0, Math.sin(t * 17)) * 0.6 : 0);
      em.setValue("oh", talking ? Math.max(0, Math.sin(t * 11 + 1)) * 0.35 : 0);
    }
    target.position.set(pointer.x * 1.5, height * 0.9 + pointer.y * 1.2, 2);

    vrm.update(dt);
    // Props stay upright and follow the right hand.
    if (prop) prop.position.lerp(vrm.humanoid.getRawBoneNode("rightHand")!.getWorldPosition(hand), prop.position.lengthSq() ? 0.5 : 1);
    renderer.render(scene, camera);

    bone("head")!.getWorldPosition(head).project(camera);
    const r = canvas.getBoundingClientRect();
    // Where the floor under her feet lands on the canvas (for the glow and the hint).
    ground.set(0, 0, 0).project(camera);
    canvas.parentElement!.style.setProperty("--floor", `${((1 - ground.y) / 2) * r.height}px`);
    canvas.parentElement!.style.setProperty("--lift", String(lift / JUMP_HEIGHT));
    bubble.style.setProperty("--x", `${r.left + ((head.x + 1) / 2) * r.width}px`);
    bubble.style.setProperty("--y", `${r.top + ((1 - head.y) / 2) * r.height - 40}px`);
  };

  const run = () => renderer.setAnimationLoop(document.hidden ? null : tick);
  document.addEventListener("visibilitychange", () => { clock.update(); run(); });
  run();

  const mascot: Mascot = {
    act(a) { if (a !== act) { act = a; actAt = clock.getElapsed(); hopAt = actAt; } },
    say(text, ms = 4200) {
      bubble.textContent = text;
      bubble.classList.remove("show");
      void bubble.offsetWidth;
      bubble.classList.add("show");
      sayUntil = clock.getElapsed() + Math.min(ms, 300 + text.length * 90) / 1000;
      clearTimeout(Number(bubble.dataset.timer));
      bubble.dataset.timer = String(setTimeout(() => bubble.classList.remove("show"), ms));
    },
    hold(p) {
      prop?.removeFromParent();
      prop = p ? makeProp(p) : null;
      if (prop) scene.add(prop);
    },
    hop() { hopAt = clock.getElapsed(); },
    jump() {
      const t = clock.getElapsed();
      if (t - jumpAt < JUMP_SECONDS * 0.8) return;
      jumpAt = t;
    },
  };
  if (new URLSearchParams(location.search).has("debug")) mascot.debug = { vrm, override };
  return mascot;
}
