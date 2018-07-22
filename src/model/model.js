// @flow

class Coord {
  x: number;
  y: number;
  z: number;

  constructor(x: number = 0, y: number = 0, z: number = 0) {
    this.x = x;
    this.y = y;
    this.z = z;
  }

  /*
  addVector(v: Coord) {
    this.x += v.x
    this.y += v.y
    this.z += v.z
  }
  */

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
    return this.getMlen() <= 2 && this.getClen() === 1
  }

  isFarCoordDiff() {
    return this.getClen() > 0 && this.getClen() <= 30
  }

  isEqual(c : Coord) {
    return this.x === c.x && this.y === c.y && this.z === c.z
  }

  getCopy() {
    return new Coord(this.x, this.y, this.z)
  }

  toString() {
    return `<${this.x},${this.y},${this.z}>`;
  }
}

class Region {
  c1: Coord;
  c2: Coord;

  constructor(c1: Coord, c2: Coord) {
    this.c1 = coord(Math.min(c1.x, c2.x), Math.min(c1.y, c2.y), Math.min(c1.z, c2.z))
    this.c2 = coord(Math.max(c1.x, c2.x), Math.max(c1.y, c2.y), Math.max(c1.z, c2.z))
  }

  isEqual(r: Region) {
    return this.c1.isEqual(r.c1) && this.c2.isEqual(r.c2)
  }

  getDim() {
    return this.c1.x === this.c2.x ? 0 : 1 + this.c1.y === this.c2.y ? 0 : 1 + this.c1.z === this.c2.z ? 0 : 1
  }

  isIntersects(r: Region) {
    if(this.c1.x > r.c1.x && this.c2.x > r.c1.x && this.c1.x > r.c2.x && this.c2.x > r.c2.x) return false;
    if(this.c1.x < r.c1.x && this.c2.x < r.c1.x && this.c1.x < r.c2.x && this.c2.x < r.c2.x) return false;
    if(this.c1.y > r.c1.y && this.c2.y > r.c1.y && this.c1.y > r.c2.y && this.c2.y > r.c2.y) return false;
    if(this.c1.y < r.c1.y && this.c2.y < r.c1.y && this.c1.y < r.c2.y && this.c2.y < r.c2.y) return false;
    if(this.c1.z > r.c1.z && this.c2.z > r.c1.z && this.c1.z > r.c2.z && this.c2.z > r.c2.z) return false;
    if(this.c1.z < r.c1.z && this.c2.z < r.c1.z && this.c1.z < r.c2.z && this.c2.z < r.c2.z) return false;
    return true;
  }
}

export const coord = (x: number, y: number, z: number) : Coord => (new Coord(x, y, z));

export class Layer {
  matrix: Matrix
  level: number

  constructor(matrix: Matrix, level: number) {
    this.matrix = matrix;
    this.level = level;
  }

  isFilled(x: number, z: number) {
    return this.matrix.isFilled(x, this.level, z);
  }

  isXLineFilled(x1: number, x2: number, z: number) : boolean {
    const m = Math.min(x1, x2);
    const n = Math.max(x1, x2);

    for (let i = m; i < n; i++)
      if (!this.matrix.isFilled(i, this.level, z))
        return false;

    return true;
  }

  getDimension() {
    return this.matrix.r;
  }

  getFilledVoxels(): Array<Coord> {
    let voxels = []
    for (let z = 0; z < this.matrix.r; z++)
      for (let x = 0; x < this.matrix.r; x++)
        if (this.matrix.isFilled(x, this.level, z))
          voxels.push(coord(x, this.level, z))

    return voxels
  }
}

export const parselayer = (s: string, level: number) : Layer => {

  const lines = s.split("\n").filter((line) => (line))
  const r = lines.length
  const matrix = new Matrix(r)

  for (let z = 0; z < r; z++) {
    const cols = lines[z].replace(/^ */, "").split(" ")
    if (cols.length != r)
      throw `Invalid dimensions (${r} and ${cols.length}) of Layer template ${s}`

    for (let x = 0; x < r; x++) {
      if (cols[x] !== "." && cols[x] !== "x")
        throw `Invalid character ${cols[x]} in layer template ${s}`

      matrix.set(x, level, z, cols[x] === "." ? 0 : 1)
    }
  }

  return new Layer(matrix, level)
}


class Matrix {
  r: number;
  voxels: Uint8Array;

  constructor(r: number) {
    this.r = r;
    this.voxels = new Uint8Array(r * r * r);
  }

  set(x: number, y: number, z: number, v: number) {
    this.voxels[this.coord2index(x, y, z)] = v;
  }

  fill(x: number, y: number, z: number) {
    this.voxels[this.coord2index(x, y, z)] = 1;
  }

  clear(x: number, y: number, z: number) {
    this.voxels[this.coord2index(x, y, z)] = 0;
  }

  isFilled(x: number, y: number, z: number) {
    return this.voxels[this.coord2index(x, y, z)] > 0;
  }

  coord2index(x: number, y: number, z: number) {
    return x + this.r * y + this.r * this.r * z;
  }

  isValidCoord(c: Coord) {
    return c.x >= 0 && c.y >= 0 && c.z >=0 && c.x < this.r && c.y < this.r && c.z < this.r
  }

  // TODO test fringe cases
  getFreeWalkableNeighboursNum(x: number, y: number, z: number) {
    let fn = this.isFilled(x, y - 1, z) ? 0 : 1
    fn += this.isFilled(x, y + 1, z) ? 0 : 1
    fn += this.isFilled(x - 1, y, z) ? 0 : 1
    fn+= this.isFilled(x + 1, y, z) ? 0 : 1
    fn += this.isFilled(x, y, z - 1) ? 0 : 1
    fn += this.isFilled(x, y, z + 1) ? 0 : 1
    return fn
  }
}

class Bot {
  bid: number;
  pos: Coord;
  seeds: Array<number>;

  constructor(bid: number, pos: Coord, seeds: Array<number>) {
    this.bid = bid;
    this.pos = pos.getCopy();
    this.seeds = seeds;
  }
}

class State {
  energy: number;
  harmonics: number;
  matrix: Matrix;
  bots: any;
  volatile: Array<Region>;
  isFinished: boolean
  fusions: any


  constructor(matrix: Matrix, bot: Bot) {
    this.energy = 0;
    this.harmonics = 0;
    this.matrix = matrix;
    this.bots = {};
    this.bots[1] = bot;
    this.volatile = [];
    this.isFinished = false
    this.fusions = {}
  }

  getBotsNum() {
    return Object.keys(this.bots).length
  }

  getBot(bid : number): Bot {
    if(!this.bots[bid])
      throw "Bot not found"
    return this.bots[bid]
  }

  findBotByCoord(botCoord: Coord): Bot {
    return Object.values(this.bots).find( b => b.pos.isEqual(botCoord));
  }

  spendEnergy(energy: number) {
    this.energy+=energy
  }

  getEnergy() {
    return this.energy
  }

  doEnergyTick() {

    let r = this.matrix.r;
    if(this.harmonics)
      this.spendEnergy(30*r*r*r);
    else
      this.spendEnergy(3*r*r*r);

    this.spendEnergy(20*this.getBotsNum());

    this.volatile = [];
    if (Object.keys(this.fusions).length > 0)
       throw `unmatched fusions: ${this.fusionsToString()}`
  }

  isFreeRegion(r: Region) {
    for (let i = this.volatile.length - 1; i >= 0; i--) {
      if (r.isIntersects(this.volatile[i])) {
        return false;
      }
    }
    return true;
  }

  addVolatileRegion(r: Region, noCheck = false) {
    if(!noCheck && !this.isFreeRegion(r))
      throw "Volatile intersection"
    this.volatile.push(r);
  }

  fusionsToString(){
    return '[' + Object.keys(this.fusions).map(i => `<${i},{this.fusions[i]}>`).join(',') + ']'
  }

  doFusionP(bidP: number, bidS: number) {
    if (this.fusions[bidP])
      throw `Fusion primary id already registerd: ${bidP} = ${this.fusions[bidP]}`
    this.fusions[bidP] = 'p'
    if (this.fusions[bidS] && this.fusions[bidS] === 's')
        this.__doFusion(bidP, bidS)
  }

  doFusionS(bidP: number, bidS: number) {
    if (this.fusions[bidS])
      throw `Fusion secondary id already registerd: ${bidS} = ${this.fusions[bidS]}`
    this.fusions[bidS] = 's'
    if (this.fusions[bidP] && this.fusions[bidP] === 'p')
        this.__doFusion(bidP, bidS)
  }

  __doFusion(bidP: number, bidS: number) {

    // join two seed arrays and bidS, then sort it
    let seeds = [...new Set([...this.bots[bidP].seeds , bidS, ...this.bots[bidS].seeds])]
    seeds.sort(function(a, b){return a - b})
    this.bots[bidP].seeds = seeds

    // delete secodary bot and fusions
    delete this.bots[bidS]
    delete this.fusions[bidP]
    delete this.fusions[bidS]

    this.spendEnergy(24)
  }

  doFission(bid: number, m: number, c: Coord) {
    if (!this.bots[bid])
      throw `Invalid fission id: ${bid}`

    let seeds1 = this.bots[bid].seeds
    let seeds2 = seeds1.splice(m + 1, seeds1.length)
    const bid2 = seeds1.shift()
    this.bots[bid].seeds = seeds2
    this.bots[bid2] = new Bot(bid2, c, seeds1)

    this.spendEnergy(24)
  }
}

export { Coord, Region, Matrix, Bot, State };
