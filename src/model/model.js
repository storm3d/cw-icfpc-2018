// matrix
// state (energy, harmonics, matrix, bots, trace)
// bot (bid, pos, seeds)

// coord

class Coord {
  constructor(x: number = 0, y: number = 0, z: number = 0) {
    this.x = x;
    this.y = y;
    this.z = z;
  }
}

class Matrix {
  constructor(r: number) {
    this.r = r;
    this.voxels = new Uint8Array(r * r * r);
  }

  set(x, y, z, v) {
    this.voxels[this.coord2index(x, y, z)] = v;
  }

  fill(x, y, z) {
    this.voxels[this.coord2index(x, y, z)] = 1;
  }

  clear(x, y, z) {
    this.voxels[this.coord2index(x, y, z)] = 0;
  }

  isFilled(x, y, z) {
    return this.voxels[this.coord2index(x, y, z)] > 0;
  }

  coord2index(x, y, z) {
    return x + this.r * y + this.r * this.r * z;
  }
}

class Bot {
  constructor(bid: number, pos: Coord, seeds: Array) {
    this.bid = bid;
    this.pos = pos;
    this.seeds = seeds;
  }
}

class State {
  constructor(matrix, bot) {
    this.energy = 0;
    this.harmonics = 0;
    this.matrix = matrix;
    this.bots = [bot];
  }
}

export { Coord, Matrix, Bot, State };
