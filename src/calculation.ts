import * as THREE from 'three';

export interface Indices {
  height: number;
  row: number;
  column: number;
}

export class RubiksCubeCalculation {
  private rubiksCube: THREE.Object3D[][][];

  constructor(rubiksCube: THREE.Object3D[][][]) {
    this.rubiksCube = rubiksCube;
  }

  public findIndex(cube: THREE.Mesh): Indices {
    let intersectedIndices: Indices | null = null;
    for (let height = 0; height < this.rubiksCube.length; height++) {
      for (let row = 0; row < this.rubiksCube[height].length; row++) {
        for (let column = 0; column < this.rubiksCube[height][row].length; column++) {
          const object = this.rubiksCube[height][row][column];
          if (object === cube) {
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

  public findParent(cube: THREE.Mesh) {
    let intersectedIndices = this.findIndex(cube);
    let horizontalCubes = this.rubiksCube[intersectedIndices.height].flat(3);
    let verticalCubes: THREE.Object3D[] = [];
    this.rubiksCube.forEach((row) =>
      row.forEach((column) => verticalCubes.push(column[intersectedIndices.column]))
    );

    let horizontalGroup = new THREE.Group();
    let verticalGroup = new THREE.Group();
    horizontalGroup.name = 'horizontalGroup';
    verticalGroup.name = 'verticalGroup';
    horizontalCubes.forEach((child) => horizontalGroup.add(child));
    verticalCubes.forEach((child) => verticalGroup.add(child));

    return { horizontalGroup, verticalGroup };
  }
}
