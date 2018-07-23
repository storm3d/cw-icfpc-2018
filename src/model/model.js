// @flow

export const clamp = (value: number, threshold: number) : number => (
    Math.abs(value) > threshold ? Math.sign(value) * threshold : value
);

class Coord {
  x: number;
  y: number;
  z: number;

  constructor(x: number = 0, y: number = 0, z: number = 0) {
    this.x = x;
    this.y = y;
    this.z = z;
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
    return (this.c1.x === this.c2.x ? 0 : 1) + (this.c1.y === this.c2.y ? 0 : 1) + (this.c1.z === this.c2.z ? 0 : 1)
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

  toString() {
    return `[${this.c1.toString()},${this.c2.toString()}]`;
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

export const parselayer = (layer: string, level: number) : Layer => {
  return new Layer(parsematrix(layer, level), level)
}

export const parsematrix = (layer: string, level: number) : Matrix => {

  const lines = layer.split("\n").filter((line) => (line))
  const r = lines.length
  const matrix = new Matrix(r)

  for (let z = 0; z < r; z++) {
    const cols = lines[z].replace(/^ */, "").split(" ")
    if (cols.length != r)
      throw `Invalid dimensions (${r} and ${cols.length}) of Layer template ${layer}`

    for (let x = 0; x < r; x++) {
      if (cols[x] !== "." && cols[x] !== "x")
        throw `Invalid character ${cols[x]} in layer template ${layer}`

      matrix.set(x, level, z, cols[x] === "." ? 0 : 1)
    }
  }

  return matrix;
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

  toString() {
    return `id:${this.bid}, pos:${this.pos.toString()}, seeds:[${this.seeds.toString()}]`
  }
}

export class VolatileError extends Error {
  constructor(...args: any) {
    super(...args)
    Error.captureStackTrace(this, VolatileError)
  }
}

class State {
  energy: number;
  harmonics: number;
  matrix: Matrix;
  bots: any;
  volatile: Array<Region>;
  isFinished: boolean
  step: number
  fusions: any
  groupFills: any
  groupVoids: any


  constructor(matrix: Matrix, bot: Bot) {
    this.energy = 0;
    this.step = 0;
    this.harmonics = 0;
    this.matrix = matrix;
    this.bots = {};
    this.bots[1] = bot;
    this.volatile = [];
    this.isFinished = false
    this.fusions = {}
    this.groupFills = []
    this.groupVoids = []
  }

  getBotsNum() {
    return Object.keys(this.bots).length
  }

  getBot(bid : number | string): Bot {
    if(!this.bots[bid])
      throw new Error(`Bot '${bid}' not found`)
    return this.bots[bid]
  }

  findBotByCoord(botCoord: Coord): Bot|void {
    return Object.keys(this.bots).map(i=>this.bots[i]).find( b => b.pos.isEqual(botCoord));
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
    this.step++;

    this.volatile = [];
    for(let bid in this.bots) {
        this.addVolatileRegion(new Region(this.bots[bid].pos, this.bots[bid].pos), true);
    }

    if (Object.keys(this.fusions).length > 0)
      throw `unmatched fusions: ${this.fusionsToString()}`

    if (this.groupFills.length > 0)
      throw `unmatched GFills: ${this.groupCommandsToString(this.groupFills)}`
    if (this.groupVoids.length > 0)
      throw `unmatched GVoids: ${this.groupCommandsToString(this.groupVoids)}`

  }

  isFreeRegion(r: Region): boolean {
    for (let i = this.volatile.length - 1; i >= 0; i--) {
      if (r.isIntersects(this.volatile[i])) {
        return false;
      }
    }
    return true;
  }

  addVolatileRegion(r: Region, noCheck: boolean = false) {
    if(!noCheck && !this.isFreeRegion(r))
      throw new VolatileError("Volatile intersection")
    this.volatile.push(r);
  }

  fusionsToString(): string {
    return '[' + Object.keys(this.fusions).map(i => `<${i},t:${this.fusions[i].t},n:${this.fusions[i].n}>`).join(',') + ']'
  }

  checkFusionP(bidP: number, bidS: number): boolean {
    if (this.fusions[bidP])
      throw `Fusion primary id already registerd: ${bidP} = ${this.fusions[bidP]}`
    this.fusions[bidP] = {t:'p', n: bidS}
    return bidS in this.fusions
  }

  checkFusionS(bidP: number, bidS: number): boolean {
    if (this.fusions[bidS])
      throw `Fusion secondary id already registerd: ${bidS} = ${this.fusions[bidS]}`
    this.fusions[bidS] = {t:'s', n: bidP}
    return bidP in this.fusions
  }

  doFusion(bidP: number, bidS: number) {
    if (this.fusions[bidP].t !== 'p' || this.fusions[bidP].n !== bidS)
      throw `Fusion primary bid is incorrect: ${bidP} = <t:${this.fusions[bidP].t},n:${this.fusions[bidP].n}>`
    if (this.fusions[bidS].t !== 's' || this.fusions[bidS].n !== bidP)
      throw `Fusion secondary bid is incorrect: ${bidS} = <t:${this.fusions[bidS].t},n:${this.fusions[bidS].n}>`


    // join two seed arrays and bidS, then sort it
    let seeds = [...new Set([...this.bots[bidP].seeds , bidS, ...this.bots[bidS].seeds])]
    seeds.sort(function(a, b){return a - b})
    this.bots[bidP].seeds = seeds

    // delete secodary bot and fusions
    delete this.bots[bidS]
    delete this.fusions[bidP]
    delete this.fusions[bidS]

  }

  doFission(bid: number, m: number, c: Coord) {
    if (!this.bots[bid])
      throw new Error(`Invalid fission for bot: ${bid}`)

    if (this.bots[bid].seeds.length === 0)
      throw new Error(`Invalid fission for bot with empty seeds, bot id: ${bid}`)

    let seeds1 = this.bots[bid].seeds
    let seeds2 = seeds1.splice(m + 1, seeds1.length)
    const bid2 = seeds1.shift()
    this.bots[bid].seeds = seeds2
    this.bots[bid2] = new Bot(bid2, c, seeds1)
  }

  groupCommandsToString(commands: any): string {
    return '[' + commands.map(i => `{r:${i.r.toString()},ids:[${i.ids}],coords:[${ i.coords.map(c=>c.toString()).join(',') }]`).join(',') + ']'
  }

  __checkGroupCommands(bid:number, c1: Coord, c2: Coord, commands: any, name: string): boolean {
    const r = new Region(c1, c2)
    let gcommand = commands.find(i => i.r.isEqual(r));
    if (!gcommand) {
      commands.push({r: r, ids:[bid], coords:[c1]})
      return false
    }

    if ((bid in gcommand.ids) || gcommand.coords.find(c => c.isEqual(c1)))
        throw `${name} failed for ${bid} and coord:{c1.toString()} in ${this.groupCommandsToString(commands)}`

    gcommand.ids.push(bid)
    gcommand.coords.push(c1.getCopy())

    return gcommand.ids.length === (1 << r.getDim())
  }

  checkGFill(bid:number, c1: Coord, c2: Coord): boolean {
      return this.__checkGroupCommands(bid, c1, c2, this.groupFills, "GFill")
  }

  checkGVoid(bid:number, c1: Coord, c2: Coord): boolean {
      return this.__checkGroupCommands(bid, c1, c2, this.groupVoids, "GVoid")
  }

  __doGroupCommand(r: Region, commands: any, name: string, fill: boolean): any {
    let gcommand = commands.find(i => i.r.isEqual(r));
    if (!gcommand)
        throw `${name} failed, region ${r.toString()} not found`

    if (gcommand.ids.length !== (1 << r.getDim()))
        throw `${name} failed, not enough bots for region ${r.toString()} : [${gcommand.ids}]`


    let filled = 0
    let empty = 0
    for(let x = r.c1.x; x <= r.c2.x; x++) {
      for(let y = r.c1.y; y <= r.c2.y; y++) {
        for(let z = r.c1.z; z <= r.c2.z; z++) {
            if (this.matrix.isFilled(x, y, z))
            {
              filled++;
              if (!fill) this.matrix.clear(x, y, z)
            } else {
              empty++;
              if (fill) this.matrix.fill(x, y, z)
            }
        }
      }
    }

    // remove group command from list and return stats
    commands.splice(commands.indexOf(gcommand), 1)
    return {empty: empty, filled: filled}
  }

  doGFill(r: Region): any {
    return this.__doGroupCommand(r, this.groupFills, "GFill", true)
  }

  doGVoid(r: Region): any {
    return this.__doGroupCommand(r, this.groupVoids, "GVoid", false)
  }

}

export { Coord, Region, Matrix, Bot, State };
