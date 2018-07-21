// @flow

import UnionFind from "./union-find";
import { Matrix } from "./model";


export default class FloatingVoxels {

  r: number;
  r2: number;
  floating: Set<number>;
  sinkIndex: number;
  uf: UnionFind;

  constructor(r: number) {

    this.r = r;
    this.r2 = r * r;
    this.floating = new Set();

    const n = r * r * r;
    this.sinkIndex = n;

    // all voxels and sink
    this.uf = new UnionFind(n + 1);

    // connect all 1 layer voxels with fake sink
    for (let x = 0; x < r; x++)
      for (let z = 0; z < r; z++)
        this.uf.union(this.toUfIndex(x, 0, z), this.sinkIndex);
  }

  allGrounded() {
    return this.floating.size === 0;
  }

  toUfIndex(x: number, y: number, z: number) {
    return x + y * this.r + z * this.r2;
  }

  fill(x: number, y: number, z: number, matrix: Matrix) {
    const index: number = this.toUfIndex(x, y, z);

    if (x > 0 && matrix.isFilled(x - 1, y, z)) {
      this.uf.union(this.toUfIndex(x - 1, y, z), index)
    }
    if (x < this.r - 1 && matrix.isFilled(x + 1, y, z)) {
      this.uf.union(this.toUfIndex(x + 1, y, z), index)
    }
    if (y > 0 && matrix.isFilled(x, y - 1, z)) {
      this.uf.union(this.toUfIndex(x, y - 1, z), index)
    }
    if (y < this.r - 1 && matrix.isFilled(x, y + 1, z)) {
      this.uf.union(this.toUfIndex(x, y + 1, z), index)
    }
    if (z > 0 && matrix.isFilled(x, y, z - 1)) {
      this.uf.union(this.toUfIndex(x, y, z - 1), index)
    }
    if (z < this.r - 1 && matrix.isFilled(x, y, z + 1)) {
      this.uf.union(this.toUfIndex(x, y, z + 1), index)
    }

    if (this.uf.find(index) !== this.uf.find(this.sinkIndex)) // the newly filled voxel is not grounded
      this.floating.add(this.uf.find(index));

    this.floating.forEach((i) => {
      if (this.uf.find(i) === this.uf.find(this.sinkIndex))
        this.floating.delete(i);
    });

  }
}
