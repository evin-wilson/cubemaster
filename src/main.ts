import * as THREE from 'three';
import { GLTF, GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RubiksCubeCalculation } from './calculation';

let rubixCube: THREE.Mesh[][][] = [];
let rubiksCubeCalculation: RubiksCubeCalculation;
let altkeyPressed = false;

const rows = 3;
const columns = 3;
const layers = 3;

for (let i = 0; i < rows; i++) {
  rubixCube[i] = [];
  for (let j = 0; j < columns; j++) {
    rubixCube[i][j] = [];
    for (let k = 0; k < layers; k++) {
      rubixCube[i][j][k] = new THREE.Mesh();
    }
  }
}

let mouse = new THREE.Vector2();
let raycaster = new THREE.Raycaster();

// Create a scene
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xffffff);

// Create a camera
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(8, 8, 8);

// Create a renderer
const canvas = document.querySelector('#playground') as HTMLCanvasElement;
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.setPixelRatio(window.devicePixelRatio);
document.body.appendChild(renderer.domElement);

//lights to see the models
let light1 = new THREE.DirectionalLight(0xffffff, 1);
light1.position.set(5, 5, 5);
let light2 = new THREE.DirectionalLight(0xffffff, 1);
light2.position.set(-5, -5, -5);
scene.add(light1, light2);

// orbit controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enablePan = false;
controls.enableZoom = false;

let hGp = new THREE.Group();
hGp.name = 'Horizonatl-Group';
let vGp = new THREE.Group();
vGp.name = 'Vertical-Group';
scene.add(hGp, vGp);

// Create a loader for GLB files
const loader = new GLTFLoader();

loader.load(
  '/assets/rubix-cube.glb',
  (gltf: GLTF) => {
    const model = gltf.scene;
    scene.add(model);
    console.log(model);

    let flatRubixCube: THREE.Mesh[] = [];

    model.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        flatRubixCube.push(child);
        applywireframe(false);
      }
    });

    let index = 0;
    for (let row = 0; row < rows; row++) {
      for (let column = 0; column < columns; column++) {
        for (let layer = 0; layer < layers; layer++) {
          rubixCube[row][column][layer] = flatRubixCube[index++];
        }
      }
    }

    rubiksCubeCalculation = new RubiksCubeCalculation(rubixCube);
  },
  (xhr: ProgressEvent<EventTarget>) => {
    console.log((xhr.loaded / xhr.total) * 100 + '% loaded');
  },
  (error: ErrorEvent) => {
    console.error('Error loading GLB file:', error);
  }
);

function applywireframe(apply: Boolean) {
  if (apply) {
    const wireframeMaterial = new THREE.MeshBasicMaterial({ color: 0x000000, wireframe: true });
    rubixCube.forEach((cube) => {
      if (cube instanceof THREE.Mesh) {
        cube.material = wireframeMaterial;
      }
    });
  }
}

//helpers
let boxhelper: THREE.BoxHelper | null = null;

const axisHelper = new THREE.AxesHelper(10);
scene.add(axisHelper);

const planeSize = 1.8;
const planeGeometry = new THREE.PlaneGeometry(planeSize, planeSize);
const planeMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00, side: THREE.DoubleSide });
const plane = new THREE.Mesh(planeGeometry, planeMaterial);

// Create the sphere geometry
let sphereGeometry = new THREE.SphereGeometry(0.3, 32, 32);
let sphereMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
let sphereMesh = new THREE.Mesh(sphereGeometry, sphereMaterial);

function checkIntersection(event: PointerEvent) {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(rubixCube.flat(3), false);

  if (intersects.length > 0) {
    const intersect = intersects[0];
    if (intersect.object instanceof THREE.Mesh && intersect.face != null) {
      const intersectObject = intersect.object;
      const intersectFace = intersect.face;
      addSelectionPlane(intersectObject, intersectFace);

      let index = rubiksCubeCalculation.findIndex(intersectObject);

      // Add key event listener inside the intersection block
      window.addEventListener('keydown', onKeyDown);
      // Key event listener function
      function onKeyDown(event: { key: any }) {
        console.log('Key pressed:', event.key);
        switch (event.key) {
          case 'ArrowUp':
            rubiksCubeCalculation.rotate(intersectObject, 'y', true);
            break;
          case 'ArrowDown':
            rubiksCubeCalculation.rotate(intersectObject, 'y', false);
            break;
          case 'ArrowLeft':
            rubiksCubeCalculation.rotate(intersectObject, 'x', true);
            break;
          case 'ArrowRight':
            rubiksCubeCalculation.rotate(intersectObject, 'x', false);
            break;
        }
        window.removeEventListener('keydown', onKeyDown);
      }
    }
  } else {
    if (boxhelper) scene.remove(boxhelper);
    scene.remove(plane);
    moveChildrenToScene(hGp);
    moveChildrenToScene(vGp);
  }
}

function addSelectionPlane(intersectObject: THREE.Object3D, intersectFace: THREE.Face) {
  const boundingBox = new THREE.Box3();
  boundingBox.setFromObject(intersectObject);
  const center = boundingBox.getCenter(new THREE.Vector3());

  // adding this due to some issue in model
  // center.x -= 1;
  // center.y -= 1;
  sphereMesh.position.copy(center); // enable wireframe model to see the sphere at centre if it is inside
  // scene.add(sphereMesh);

  let maxValue = Math.max(intersectFace.normal.x, intersectFace.normal.y, intersectFace.normal.z);
  const offset = maxValue === 1 ? 0.001 : -0.001;

  let faceCenter = new THREE.Vector3().addVectors(
    center.ceil().addScalar(offset),
    intersectFace.normal.ceil()
  );

  const removeEdge = intersectFace.normal.toArray().filter((value) => value === 1).length >= 2;
  if (!removeEdge) {
    plane.position.copy(faceCenter);
    plane.lookAt(plane.position.clone().add(intersectFace.normal));
    scene.add(plane);
  }
}

function moveChildrenToScene(group: THREE.Group) {
  while (group.children.length > 0) {
    const child = group.children[0];
    const { position, rotation, scale } = group;
    group.remove(child);
    scene.add(child);

    child.position.copy(position);
    child.rotation.copy(rotation);
    child.scale.copy(scale);
    // group.dispose();
  }
}

function onResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function handleKeyDown(event: { key: any }) {
  const rotationAmount = Math.PI / 2; // 90 degrees in radians

  switch (event.key) {
    case 'ArrowUp':
      vGp.rotation.x = rotationAmount; // Rotate around x-axis in positive direction
      break;
    case 'ArrowDown':
      vGp.rotation.x = -rotationAmount; // Rotate around x-axis in negative direction
      break;
    case 'ArrowLeft':
      hGp.rotation.y += rotationAmount; // Rotate around y-axis in positive direction
      break;
    case 'ArrowRight':
      hGp.rotation.y -= rotationAmount; // Rotate around y-axis in negative direction
      break;
    // case 'Alt':
    //   altkeyPressed = true;
  }
}

// Animation loop
function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
  controls.update();
}

// Start the animation loop
animate();

// window.addEventListener('keydown', handleKeyDown);
// window.addEventListener('keyup', (e) => (e.key === 'Alt' ? (altkeyPressed = false) : null));
window.addEventListener('resize', onResize);
window.addEventListener('pointermove', (e) => {
  if (!altkeyPressed) {
    checkIntersection(e);
  }
});
