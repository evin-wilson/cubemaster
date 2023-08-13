import * as THREE from 'three';
import * as TWEEN from '@tweenjs/tween.js';

export interface Indices {
  height: number;
  row: number;
  column: number;
}

export class RubiksCubeCalculation {
  private rubiksCube: THREE.Mesh[];
  private movements: { [key: string]: { cube: THREE.Mesh; axis: THREE.Vector3 } } = {};
  private shuffleCode = '';
  private isanimating = false;
  private scene: THREE.Scene;
  private cubeGroup = new THREE.Group();

  constructor(rubiksCube: THREE.Mesh[], scene: THREE.Scene) {
    this.rubiksCube = rubiksCube;
    this.scene = scene;
    this.init();
  }

  private init() {
    /**
     * F: green
     * B: blue
     * R: red
     * L: orange
     * U: white
     * D: yellow
     */
    this.movements = {
      F: { cube: this.rubiksCube[10], axis: new THREE.Vector3(0, 0, -1) },
      f: { cube: this.rubiksCube[10], axis: new THREE.Vector3(0, 0, 1) },
      B: { cube: this.rubiksCube[16], axis: new THREE.Vector3(0, 0, 1) },
      b: { cube: this.rubiksCube[16], axis: new THREE.Vector3(0, 0, -1) },
      R: { cube: this.rubiksCube[14], axis: new THREE.Vector3(1, 0, 0) },
      r: { cube: this.rubiksCube[14], axis: new THREE.Vector3(-1, 0, 0) },
      L: { cube: this.rubiksCube[12], axis: new THREE.Vector3(-1, 0, 0) },
      l: { cube: this.rubiksCube[12], axis: new THREE.Vector3(1, 0, 0) },
      U: { cube: this.rubiksCube[22], axis: new THREE.Vector3(0, 1, 0) },
      u: { cube: this.rubiksCube[22], axis: new THREE.Vector3(0, -1, 0) },
      D: { cube: this.rubiksCube[4], axis: new THREE.Vector3(0, -1, 0) },
      d: { cube: this.rubiksCube[4], axis: new THREE.Vector3(0, 1, 0) },
    };

    this.cubeGroup.name = 'cubeGroup';
    this.scene.add(this.cubeGroup);
  }

  public translatePosition(cubies: THREE.Mesh[][], clockwise: boolean): THREE.Vector3[][] {
    const dim = cubies.length;

    const rotatedMatrix: THREE.Vector3[][] = Array.from({ length: dim }, () => new Array(dim));

    for (let row = 0; row < dim; row++) {
      for (let col = 0; col < dim; col++) {
        if (clockwise) {
          rotatedMatrix[col][dim - 1 - row] = cubies[row][col].position.clone();
        } else {
          rotatedMatrix[dim - 1 - col][row] = cubies[row][col].position.clone();
        }
      }
    }
    return rotatedMatrix;
  }

  private comparePositions(a: THREE.Mesh, b: THREE.Mesh) {
    const positionA = a.position;
    const positionB = b.position;

    // Compare positions in X, Y, and Z axes
    if (positionA.x !== positionB.x) {
      return positionA.x - positionB.x;
    }
    if (positionA.y !== positionB.y) {
      return positionA.y - positionB.y;
    }
    if (positionA.z !== positionB.z) {
      return positionA.z - positionB.z;
    }

    return 0; // Positions are equal
  }

  public rotateCubiesAlongAxis(selectedCubie: THREE.Mesh, axis: THREE.Vector3, resolve?) {
    this.isanimating = true;
    let targetCubies: THREE.Mesh[] = [];
    let cubiesToRotate: THREE.Mesh[][] = [];
    let clockwise: boolean = true;
    let degree = 90;

    this.rubiksCube.forEach((cubie) => {
      if (axis.x !== 0 && cubie.position.x === selectedCubie.position.x) {
        targetCubies.push(cubie);
        clockwise = axis.x > 0;
      } else if (axis.y !== 0 && cubie.position.y === selectedCubie.position.y) {
        targetCubies.push(cubie);
        clockwise = axis.y < 0;
      } else if (axis.z !== 0 && cubie.position.z === selectedCubie.position.z) {
        targetCubies.push(cubie);
        clockwise = axis.z < 0;
        degree = -90;
      }
    });

    targetCubies.sort(this.comparePositions).reverse();

    let index = 0;
    for (let j = 0; j < 3; j++) {
      cubiesToRotate[j] = [];
      for (let k = 0; k < 3; k++) {
        cubiesToRotate[j][k] = targetCubies[index++];
      }
    }

    let updatedPosition = this.translatePosition(cubiesToRotate, clockwise);

    targetCubies.forEach((cubie) => {
      this.cubeGroup.add(cubie);
    });

    let prevAngle = 0;
    new TWEEN.Tween({ angle: 0 })
      .to({ angle: degree }, 1000)
      .easing(TWEEN.Easing.Quartic.InOut)
      .onUpdate(({ angle }) => {
        this.cubeGroup.rotateOnWorldAxis(axis, THREE.MathUtils.degToRad(angle - prevAngle));
        prevAngle = angle;
      })
      .onComplete(() => {
        let cubies: THREE.Object3D[] = [];
        this.cubeGroup.traverse((child) => {
          cubies.push(child);
        });
        // mesh can be only present in one group. so need to additionaly remove from the cubeGroup
        targetCubies.forEach((cubie) => {
          this.scene.add(cubie);
        });
        // this can be removed... need to work on it
        for (let j = 0; j < 3; j++) {
          for (let k = 0; k < 3; k++) {
            cubiesToRotate[j][k].rotateOnWorldAxis(axis, THREE.MathUtils.degToRad(degree));
            cubiesToRotate[j][k].position.copy(updatedPosition[j][k]);
          }
        }
        this.cubeGroup.rotation.set(0, 0, 0);
        this.cubeGroup.quaternion.set(0, 0, 0, 1);
        this.isanimating = false;
        if (typeof resolve === 'function') {
          resolve();
        }
      })
      .start();
  }

  public handleKeyDown(event: { key: any }) {
    if (this.isanimating) {
      return;
    }
    const key = event.key;
    if (this.movements[key]) {
      const { cube, axis } = this.movements[key];
      this.rotateCubiesAlongAxis(cube, axis);
    }
  }

  public scramble() {
    const characters = Object.keys(this.movements);
    let moves = '';

    for (let i = 0; i < 10; i++) {
      const randomIndex = Math.floor(Math.random() * characters.length);
      moves += characters[randomIndex];
    }
    this.shuffleCode += moves;
    this.move(moves);
  }

  // if more than one shuffle btn is clicked this will fail
  public solve() {
    if (this.shuffleCode.length === 0) {
      console.log('already solved cube');
    } else {
      const reversedShuffleCode = this.shuffleCode
        .replace(/./g, (match) => {
          return /[A-Z]/.test(match) ? match.toLowerCase() : match.toUpperCase();
        })
        .split('')
        .reverse()
        .join('');
      this.move(reversedShuffleCode);
      this.shuffleCode = '';
    }
  }

  public async move(moves: string) {
    let currentIndex = 0;

    const performNextMove = async () => {
      if (currentIndex < moves.length) {
        const move = moves[currentIndex];
        if (this.movements[move]) {
          const { cube, axis } = this.movements[move];
          await new Promise((resolve) => this.rotateCubiesAlongAxis(cube, axis, resolve));
        }
        currentIndex++;
        await performNextMove();
      }
    };

    await performNextMove();
  }
}
