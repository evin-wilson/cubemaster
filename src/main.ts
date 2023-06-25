import * as THREE from 'three';
import { GLTF, GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

let rubixCube: THREE.Object3D[] = [];

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

// Create a loader for GLB files
const loader = new GLTFLoader();

loader.load(
  '/assets/rubix-cube-2k.glb',
  (gltf: GLTF) => {
    const model = gltf.scene;
    scene.add(model);
    console.log(model);

    model.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        // child.material = wireframeMaterial;
        rubixCube.push(child);
      }
    });
    console.log(rubixCube);
  },
  (xhr: ProgressEvent<EventTarget>) => {
    console.log((xhr.loaded / xhr.total) * 100 + '% loaded');
  },
  (error: ErrorEvent) => {
    console.error('Error loading GLB file:', error);
  }
);

const wireframeEnabled = true;
if (wireframeEnabled) {
  console.log(rubixCube.length);
  const wireframeMaterial = new THREE.MeshBasicMaterial({ color: 0x000000, wireframe: true });
  rubixCube.forEach((cube) => {
    console.log(cube);
    if (cube instanceof THREE.Mesh) {
      cube.material = wireframeMaterial;
    }
  });
}
//helpers
let boxhelper: THREE.BoxHelper | null = null;

const axisHelper = new THREE.AxesHelper(10);
scene.add(axisHelper);

const planeSize = 1.8;
const planeGeometry = new THREE.PlaneGeometry(planeSize, planeSize);
const planeMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00, side: THREE.DoubleSide });
const plane = new THREE.Mesh(planeGeometry, planeMaterial);
scene.add(plane);

// Create the sphere geometry
var sphereGeometry = new THREE.SphereGeometry(0.3, 32, 32);
var sphereMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
var sphereMesh = new THREE.Mesh(sphereGeometry, sphereMaterial);

function checkIntersection(event: PointerEvent) {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(rubixCube, false);

  if (intersects.length > 0) {
    const intersect = intersects[0];
    if (intersect.object instanceof THREE.Mesh && intersect.face != null) {
      const intersectObject = intersect.object;
      const intersectFace = intersect.face;

      if (boxhelper) scene.remove(boxhelper); // Remove previous boxhelper, if any

      boxhelper = new THREE.BoxHelper(intersectObject, 0xffff00);
      boxhelper.update();
      // scene.add(boxhelper);

      const boundingBox = new THREE.Box3();
      boundingBox.setFromObject(intersectObject);
      const center = boundingBox.getCenter(new THREE.Vector3());

      // adding this due to some issue in model
      center.x -= 1;
      center.y -= 1;
      sphereMesh.position.copy(center); // enable wireframe model to see the sphere at centre if it is inside
      // scene.add(sphereMesh);

      var maxValue = Math.max(
        intersectFace.normal.x,
        intersectFace.normal.y,
        intersectFace.normal.z
      );

      let offset = 0.001;
      maxValue === 1 ? (offset = 0.001) : (offset = -0.001);

      let faceCenter = new THREE.Vector3().addVectors(
        center.ceil().addScalar(offset),
        intersectFace.normal.ceil()
      );

      plane.position.copy(faceCenter);
      plane.lookAt(plane.position.clone().add(intersectFace.normal));
    }
  } else {
    if (boxhelper) scene.remove(boxhelper);
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

// Start the animation loop
animate();

window.addEventListener('resize', onResize);
window.addEventListener('pointermove', checkIntersection);
