import * as THREE from 'three';

export interface Indices {
  height: number;
  row: number;
  column: number;
}

export class RubiksCubeCalculation {
  private rubiksCube: THREE.Mesh[][][];

  constructor(rubiksCube: THREE.Mesh[][][]) {
    this.rubiksCube = rubiksCube;
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

  public rotate(cubie: THREE.Mesh, axis: string, clockwise: boolean) {
    let toBeRotated: THREE.Mesh[][];
    let { horizontalSelection, verticalSelection } = this.findSelection(cubie);

    if (axis === 'x') {
      toBeRotated = horizontalSelection;
    } else toBeRotated = verticalSelection;

    let rotated = this.rotateCube(toBeRotated, clockwise);
    console.log(rotated);
  }

  public rotateCube(cubies: THREE.Mesh[][], clockwise: boolean): THREE.Mesh[][] {
    const dim = cubies.length;

    const rotatedMatrix: THREE.Mesh[][] = Array.from({ length: dim }, () => new Array(dim));

    for (let row = 0; row < dim; row++) {
      for (let col = 0; col < dim; col++) {
        if (clockwise) {
          rotatedMatrix[col][dim - 1 - row] = cubies[row][col];
        } else {
          rotatedMatrix[dim - 1 - col][row] = cubies[row][col];
        }
      }
    }

    return rotatedMatrix;
  }
}
