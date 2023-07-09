import * as THREE from 'three';

export interface Indices {
  height: number;
  row: number;
  column: number;
}

export class RubiksCubeCalculation {
  private rubiksCube: THREE.Mesh[];
  private movements: { [key: string]: { cube: THREE.Mesh; axis: THREE.Vector3 } };

  constructor(rubiksCube: THREE.Mesh[]) {
    this.rubiksCube = rubiksCube;
    /**
     * F: green
     * B: blue
     * R: red
     * L: orange
     * U: white
     * D: yellow
     */
    this.movements = {
      F: { cube: this.rubiksCube[10], axis: new THREE.Vector3(0, 0, 1) },
      B: { cube: this.rubiksCube[16], axis: new THREE.Vector3(0, 0, 1) },
      R: { cube: this.rubiksCube[14], axis: new THREE.Vector3(1, 0, 0) },
      L: { cube: this.rubiksCube[12], axis: new THREE.Vector3(1, 0, 0) },
      U: { cube: this.rubiksCube[22], axis: new THREE.Vector3(0, -1, 0) },
      D: { cube: this.rubiksCube[4], axis: new THREE.Vector3(0, -1, 0) },
    };
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

  /**
   * x axis for vertical
   * y axis for horizontal
   */
  public rotateCubiesAlongAxis(selectedCubie: THREE.Mesh, axis: THREE.Vector3) {
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

    for (let j = 0; j < 3; j++) {
      for (let k = 0; k < 3; k++) {
        cubiesToRotate[j][k].rotateOnWorldAxis(axis, THREE.MathUtils.degToRad(degree));
        cubiesToRotate[j][k].position.copy(updatedPosition[j][k]);
      }
    }
  }

  public handleKeyDown(event: { key: any }) {
    const key = event.key.toUpperCase();
    if (this.movements[key]) {
      const { cube, axis } = this.movements[key];
      this.rotateCubiesAlongAxis(cube, axis);
    }
  }
}
