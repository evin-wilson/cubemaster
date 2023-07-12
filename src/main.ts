import * as THREE from 'three';
import { GLTF, GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RubiksCubeCalculation } from './calculation';

let rubixCube: THREE.Mesh[] = [];
let rubiksCubeCalculation: RubiksCubeCalculation;
let altkeyPressed = false;
let tooltip: HTMLDivElement | null = null;

let mouse = new THREE.Vector2();
let raycaster = new THREE.Raycaster();

let intersectedCubie: THREE.Mesh;
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

// Create a loader for GLB files
const loader = new GLTFLoader();

loader.load(
  '/assets/rubix-cube.glb',
  (gltf: GLTF) => {
    const model = gltf.scene;
    scene.add(model);
    console.log(model);

    model.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.position.round();
        rubixCube.push(child);
        applywireframe(false);
      }
    });

    // if intialized outside rubixCube array will be empty. to avoid it want to have a promise
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
  const intersects = raycaster.intersectObjects(rubixCube, false);

  if (intersects.length > 0) {
    const intersect = intersects[0];
    if (intersect.object instanceof THREE.Mesh && intersect.face != null) {
      intersectedCubie = intersect.object;
      const intersectFace = intersect.face;
      addSelectionPlane(intersectedCubie, intersectFace);
      showCubeName(intersectedCubie.name, intersectedCubie.position);
    }
  } else {
    if (boxhelper) scene.remove(boxhelper);
    scene.remove(plane);
    if (tooltip) {
      document.querySelector('.tooltip')?.remove();
      tooltip = null;
    }
  }
}

function showCubeName(name: string, position: THREE.Vector3) {
  if (tooltip) {
    tooltip.innerHTML = `${name}<br>x: ${position.x}\n | y: ${position.y}\n | z: ${position.z}`;
  } else {
    tooltip = document.createElement('div');
    tooltip.textContent = name;
    tooltip.classList.add('tooltip');
    tooltip.style.top = '30px';
    tooltip.style.position = 'absolute';
    document.body.appendChild(tooltip);
  }
}

function addSelectionPlane(intersectObject: THREE.Object3D, intersectFace: THREE.Face) {
  const boundingBox = new THREE.Box3();
  boundingBox.setFromObject(intersectObject);
  const center = boundingBox.getCenter(new THREE.Vector3());

  sphereMesh.position.copy(center); // enable wireframe model to see the sphere at centre if it is inside
  scene.add(sphereMesh);

  let maxValue = Math.max(intersectFace.normal.x, intersectFace.normal.y, intersectFace.normal.z);
  const offset = maxValue === 1 ? 0.001 : -0.001;

  let faceCenter = new THREE.Vector3().addVectors(center.addScalar(offset), intersectFace.normal);

  const removeEdge = intersectFace.normal.toArray().filter((value) => value % 1 !== 0).length >= 2;
  if (!removeEdge) {
    plane.position.copy(faceCenter);
    plane.lookAt(plane.position.clone().add(intersectFace.normal));
    scene.add(plane);
  }
}

function onResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

// Animation loop
function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
  controls.update();
}

let shuffle_btn = document.createElement('button');
shuffle_btn.textContent = 'shuffle';
shuffle_btn.classList.add('shuffle_btn');
shuffle_btn.style.top = '10px';
shuffle_btn.style.position = 'absolute';
shuffle_btn.addEventListener('click', () => {
  rubiksCubeCalculation.scramble();
});
document.body.appendChild(shuffle_btn);

// Start the animation loop
animate();

window.addEventListener('keydown', (e) => {
  if (e.repeat) return;
  rubiksCubeCalculation.handleKeyDown(e);
});
window.addEventListener('keyup', (e) => (e.key === 'Alt' ? (altkeyPressed = false) : null));
window.addEventListener('resize', onResize);
window.addEventListener('pointermove', (e) => {
  if (!altkeyPressed) {
    checkIntersection(e);
  }
});
