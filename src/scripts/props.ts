// Small hand props drawn with plain three.js shapes (the app's own props come from a CC0 pack; these stand in on the web).
import * as THREE from "three/webgpu";

export type PropKind = "balloon" | "mug" | "book";

const mat = (color: number) => new THREE.MeshStandardMaterial({ color, roughness: 0.55 });

/** A prop placed at the right hand each frame (world space, upright; the model faces +z). */
export function makeProp(kind: PropKind): THREE.Object3D {
  const g = new THREE.Group();
  if (kind === "balloon") {
    const ball = new THREE.Mesh(new THREE.SphereGeometry(0.11, 32, 24), mat(0xff5c9d));
    ball.scale.set(1, 1.18, 1);
    ball.position.set(0, 0.42, 0);
    g.rotation.z = 0.08;
    const knot = new THREE.Mesh(new THREE.ConeGeometry(0.018, 0.03, 12), mat(0xff5c9d));
    knot.position.set(0, 0.29, 0);
    const string = new THREE.Mesh(new THREE.CylinderGeometry(0.0025, 0.0025, 0.28, 6), mat(0xffffff));
    string.position.set(0, 0.14, 0);
    g.add(ball, knot, string);
  } else if (kind === "mug") {
    const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.04, 0.1, 28), mat(0xffd9e8));
    const handle = new THREE.Mesh(new THREE.TorusGeometry(0.028, 0.008, 10, 20), mat(0xffd9e8));
    handle.position.set(0.05, 0, 0);
    const tea = new THREE.Mesh(new THREE.CircleGeometry(0.04, 24), mat(0xc77b4a));
    tea.rotation.x = -Math.PI / 2;
    tea.position.y = 0.045;
    cup.position.set(0, 0.03, 0.05);
    handle.position.set(0.05, 0.03, 0.05);
    tea.position.set(0, 0.075, 0.05);
    g.add(cup, handle, tea);
  } else {
    const cover = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.2, 0.03), mat(0x6a9be0));
    const pages = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.19, 0.026), mat(0xfffaf0));
    pages.position.x = 0.006;
    cover.position.set(0, 0.06, 0.06);
    pages.position.set(0.006, 0.06, 0.06);
    cover.rotation.x = pages.rotation.x = -0.4;
    g.add(cover, pages);
  }
  return g;
}
