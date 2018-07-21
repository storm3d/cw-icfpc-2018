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

  addVector(v: Coord) {
    this.x += v.x
    this.y += v.y
    this.z += v.z
  }

  getAdded(v: Coord) {
    return new Coord(this.x + v.x, this.y + v.y, this.z + v.z)
  }

  getDiff(v: Coord) {
    return new Coord(v.x - this.x, v.y - this.y, v.z - this.z)
  }

  getMlen() {
    return Math.abs(this.x) + Math.abs(this.y) + Math.abs(this.z)
  }

  getClen() {
    return Math.max(Math.abs(this.x), Math.abs(this.y), Math.abs(this.z))
  }

  isAdjacent(c: Coord) {
    let diff = this.getDiff(c)
    return diff.getMlen() === 1
  }

  isLinearDiff() {
    return this.getMlen() == this.getClen() && this.getMlen() > 0
  }

  isShortLinearDiff() {
    return this.isLinearDiff() && this.getMlen() <= 5
  }

  isLongLinearDiff() {
    return this.isLinearDiff() && this.getMlen() <= 15
  }

  isNearCoordDiff() {
    return this.getMlen() <= 2 && this.getClen() == 1
  }

  isEqual(c : Coord) {
    return this.x === c.x && this.y === c.y && this.z === c.z
  }

  getCopy() {
    return new Coord(this.x, this.y, this.z)
  }
}

class Region {
  constructor(c1: Coord, c2: Coord) {
    this.c1 = c1
    this.c2 = c2
  }

  getDim() {
  }
}

export const coord: Coord = (x: number, y: number, z: number) => (new Coord(x, y, z));

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

  isValidCoord(c : Coord) {
    return c.x >= 0 && c.y >= 0 && c.z >=0 && c.x < this.r && c.y < this.r && c.z < this.r
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
    this.bots = {1 : bot};
  }

  getBotsNum() {
    return Object.keys(this.bots).length
  }

  getBot(bid : number) {
    if(!this.bots[bid])
      throw "Bot not found"
    return this.bots[bid]
  }

  spendEnergy(energy) {
    this.energy+=energy
  }

  getEnergy() {
    return this.energy
  }
}

export { Coord, Region, Matrix, Bot, State };
