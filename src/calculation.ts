import * as THREE from 'three';

export interface Indices {
  height: number;
  row: number;
  column: number;
}

export class RubiksCubeCalculation {
  private rubiksCube: THREE.Mesh[][][];
  private list: THREE.Mesh[];

  constructor(rubiksCube: THREE.Mesh[][][], list: THREE.Mesh[]) {
    this.rubiksCube = rubiksCube;
    this.list = list;
  }

  public findIndex(cubie: THREE.Mesh): Indices {
    let intersectedIndices: Indices | null = null;
    for (let height = 0; height < this.rubiksCube.length; height++) {
      for (let row = 0; row < this.rubiksCube[height].length; row++) {
        for (let column = 0; column < this.rubiksCube[height][row].length; column++) {
          const object = this.rubiksCube[height][row][column];
          if (object === cubie) {
            intersectedIndices = { height, row, column };
            break;
          }
        }
        if (intersectedIndices) {
          break;
        }
      }
      if (intersectedIndices) {
        break;
      }
    }
    if (intersectedIndices) return intersectedIndices;
    else return { height: -1, row: -1, column: -1 };
  }

  public findSelection(cubie: THREE.Mesh) {
    let intersectedIndices = this.findIndex(cubie);
    let horizontalSelection = this.rubiksCube[intersectedIndices.height];

    let i: number = 0;
    let verticalSelection: THREE.Mesh[][] = [];
    this.rubiksCube.forEach((row) => {
      verticalSelection[i] = [];
      row.forEach((column) => {
        verticalSelection[i].push(column[intersectedIndices.column]);
      });
      i++;
    });

    return { horizontalSelection, verticalSelection };
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

  /**
   * x axis for vertical
   * y axis for horizontal
   */
  public roList(cubie: THREE.Mesh, axis: string, clockwise: boolean) {
    const rotationAmount = Math.PI / 2;
    let a: THREE.Mesh[] = [];

    this.list.forEach((child) => {
      if (axis === 'x' && child.position.x === cubie.position.x) {
        if (clockwise) child.rotation.x += rotationAmount;
        else child.rotation.x -= rotationAmount;
        a.push(child);
      } else if (axis === 'y' && child.position.y === cubie.position.y) {
        if (clockwise) child.rotation.y -= rotationAmount;
        else child.rotation.y += rotationAmount;
        a.push(child);
      }
    });
    const comparePositions = (a: THREE.Mesh, b: THREE.Mesh) => {
      // Assuming the position property of the mesh contains the desired position data
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
    };
    a.sort(comparePositions).reverse();
    let rubixCube: THREE.Mesh[][] = [];
    let index = 0;
    for (let j = 0; j < 3; j++) {
      rubixCube[j] = [];
      for (let k = 0; k < 3; k++) {
        rubixCube[j][k] = a[index++];
      }
    }

    console.log(rubixCube);
    let newPos = this.translatePosition(rubixCube, clockwise);

    for (let j = 0; j < 3; j++) {
      for (let k = 0; k < 3; k++) {
        rubixCube[j][k].position.copy(newPos[j][k]);
      }
    }
  }
}
