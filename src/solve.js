// @flow

import { Bot, coord, Coord, Matrix, State } from "./model/model";
import * as command from "./model/command"
import * as model from "./model/model"
import FloatingVoxels from "./model/floating-voxels";

export default class Solver {

  trace: command.Trace;
  state: State;
  floatingVoxels : FloatingVoxels;

  constructor(targetMatrix: Matrix | void) {
    if (targetMatrix) {
      let matrix = new Matrix(targetMatrix.r)
      let bot = new Bot(1, new Coord(0, 0, 0), [...Array(39).keys()].map(x => x += 2))

      this.state = new model.State(matrix, bot);
      this.floatingVoxels = new FloatingVoxels(targetMatrix.r);
      this.trace = new command.Trace(this.state)
    }
  }

  getSlice(m: Matrix, y: number): Array<Coord> {

    let slice = []
    for (let z = 0; z < m.r; z++)
      for (let x = 0; x < m.r; x++)
        if (m.isFilled(x, y, z))
          slice.push(coord(x, y, z))

    return slice
  }

  getPath(c1: Coord, c2: Coord, bid: number, isBack: boolean = false) : void {
    let cc = c1.getCopy();

    if (!isBack) {
      while (cc.y !== c2.y) {
        let diff = Math.sign(c2.y - cc.y) * (Math.abs(c2.y - cc.y) > 15 ? 15 : Math.abs(c2.y - cc.y))
        this.trace.execCommand(new command.SMove(coord(0, diff, 0)), bid)
        cc.y += diff
      }
    }

    while (cc.x !== c2.x || cc.z !== c2.z) {
      const xlld = Math.sign(c2.x - cc.x) * (Math.abs(c2.x - cc.x) > 15 ? 15 : Math.abs(c2.x - cc.x))
      const zlld = Math.sign(c2.z - cc.z) * (Math.abs(c2.z - cc.z) > 15 ? 15 : Math.abs(c2.z - cc.z))

      const xsld = Math.abs(xlld) > 5 ? Math.sign(xlld) * 5 : xlld;
      const zsld = Math.abs(zlld) > 5 ? Math.sign(zlld) * 5 : zlld;

      const lmoveMlen = Math.abs(zsld) + Math.abs(xsld);

      if (lmoveMlen > Math.abs(xlld) && lmoveMlen > Math.abs(zlld)) {
        this.trace.execCommand(new command.LMove(coord(xsld, 0, 0), coord(0, 0, zsld)), bid)
        cc.x += xsld;
        cc.z += zsld;
      }
      else if (Math.abs(zlld) > Math.abs(xlld)) {
        this.trace.execCommand(new command.SMove(coord(0, 0, zlld)), bid)
        cc.z += zlld
      }
      else {
        this.trace.execCommand(new command.SMove(coord(xlld, 0, 0)), bid)
        cc.x += xlld
      }
    }

    if (isBack) {
      while (cc.y !== c2.y) {
        let diff = Math.sign(c2.y - cc.y) * (Math.abs(c2.y - cc.y) > 15 ? 15 : Math.abs(c2.y - cc.y))
        this.trace.execCommand(new command.SMove(coord(0, diff, 0)), bid)
        cc.y += diff
      }
    }
  }


  fillVoxel(c: Coord, bid: number) {

    const fillPos = this.state.getBot(1).pos.getAdded(c);
    this.floatingVoxels.fill(fillPos.x, fillPos.y, fillPos.z, this.state.matrix);

    if (!this.floatingVoxels.allGrounded() && this.state.harmonics === 0)
      this.trace.execCommand(new command.Flip(), bid);

    this.trace.execCommand(new command.Fill(c), bid);

    if (this.floatingVoxels.allGrounded() && this.state.harmonics !== 0)
      this.trace.execCommand(new command.Flip(), bid);

  }

  fillSlice(start: Coord, slice: Array<Coord>, matrix: Matrix) {
    let cc = start.getCopy();

    let isGrounded = false

    const bid = 1;

    while (1) {

      let bestI = undefined
      let minD = 1255
      for (let i = 0; i < slice.length; i++) {
        if (!slice[i])
          continue
        if (Math.abs(cc.x - slice[i].x) + Math.abs(cc.z - slice[i].z) < minD) {

          //console.log(matrix.isFilled(slice[i].x, slice[i].y - 1, slice[i].z))
          if (isGrounded) {
            bestI = i
            minD = Math.abs(cc.x - slice[i].x) + Math.abs(cc.z - slice[i].z)
          }
          else if (slice[i].y === 0 || matrix.isFilled(slice[i].x, slice[i].y - 1, slice[i].z)) {
            isGrounded = true
            bestI = i
            minD = Math.abs(cc.x - slice[i].x) + Math.abs(cc.z - slice[i].z)
          }
        }
      }

      //console.log(bestI)

      if (bestI === undefined)
        break

      let c = slice[bestI]

      let botC = c.getAdded(new Coord(0, 1, 0))
      //console.log(botC)

      this.getPath(cc, botC, bid)
      //console.log(path)
      cc = botC

      for (let i = 0; i < slice.length; i++) {
        if (!slice[i])
          continue
        if (Math.abs(slice[i].x - botC.x) + Math.abs(slice[i].z - botC.z) <= 1) {
          this.fillVoxel(new Coord(Math.sign(slice[i].x - botC.x), -1, Math.sign(slice[i].z - botC.z)), bid)
          delete slice[i];
        }
      }
    }

  };

  solve(targetMatrix: Matrix) {

    let matrix = new Matrix(targetMatrix.r)
    let bot = new Bot(1, new Coord(0, 0, 0), [...Array(39).keys()].map(x => x += 2))

    this.state = new model.State(matrix, bot);
    this.floatingVoxels = new FloatingVoxels(targetMatrix.r);
    this.trace = new command.Trace(this.state)

    // this.trace.execCommand(new command.Flip())

    for (let level = 0; level < matrix.r; level++) {
      let slice = this.getSlice(targetMatrix, level)
      //console.log(slice.length)
      if (slice === [])
        break

      //console.log(state.getBot(1).pos)
      this.fillSlice(this.state.getBot(1).pos, slice, targetMatrix)

    }

    let origin = new Coord(0, 0, 0)

    //console.log(this.state.getBot(1).pos)
    const bid = 1;
    this.getPath(this.state.getBot(1).pos, origin, bid, true)

    if (this.state.harmonics !== 0 )
      this.trace.execCommand(new command.Flip())
    this.trace.execCommand(new command.Halt())

    return this.trace
  }

}
