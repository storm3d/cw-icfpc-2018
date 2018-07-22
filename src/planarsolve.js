// @flow

import { Bot, coord, Coord, Matrix, State } from "./model/model";
import * as command from "./model/command"
import * as model from "./model/model"
import FloatingVoxels from "./model/floating-voxels";
import { FissionTask, MoveTask, Task } from "./tasks/task";

export default class PlanarSolver {

  trace: command.Trace;
  state: State;
  floatingVoxels : FloatingVoxels;
  botTasks: any;

  constructor(targetMatrix: Matrix | void) {
    if (targetMatrix) {
      this.init(targetMatrix)
    }
  }

  init(targetMatrix: Matrix) {
    {
      let matrix = new Matrix(targetMatrix.r)
      let bot = new Bot(1, new Coord(0, 0, 0), [...Array(39).keys()].map(x => x += 2))

      this.state = new model.State(matrix, bot);
      this.floatingVoxels = new FloatingVoxels(targetMatrix.r);
      this.trace = new command.Trace(this.state);
      this.botTasks = {};
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

  getPath(c1: Coord, c2: Coord, bid: number, verticalLast: boolean = false) : void {
    let cc = c1.getCopy();

    if (!verticalLast) {
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

    if (verticalLast) {
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

    this.init(targetMatrix)

    /*

    for every layer
       get region to fill (what if too small?)
       assign bots to corners
       send bots to corners
       fill region


       getting region to fill
         try to find region starting from the first point
         if the resulting region is too small (single line or 2 by 2(3) find one more region up to 4)

         if no big region found then assign small reqions to separate bots

       for single bot area:
         find an area to process
         send bot
         refine

     */

    let i = 0;
    this.submitTask(new FissionTask());
    this.executeStep()

    this.submitTask(new FissionTask());
    this.submitTask(new FissionTask());
    this.executeStep()

    this.submitTask(new FissionTask());
    this.submitTask(new FissionTask());
    this.submitTask(new FissionTask());
    this.submitTask(new FissionTask());
    this.executeStep()

    i = 0;
    while(i++ < 200) {

      // if (this.state.getBotsNum() < 10 && this.getFreeBot())
      //   this.submitTask(fission)

      // while (this.getFreeBot())
      //   this.submitTask(move to corner)

      this.executeStep()

    }

    this.trace.execCommand(new command.Halt())

    return this.trace
  }

  executeStep() {

    for (let bid in this.state.bots) {
      let bot = this.state.getBot(bid);
      if (!this.botTasks[bid] || this.botTasks[bid].isFinished()) {
        const r = this.state.matrix.r - 1;
        new MoveTask(coord(r, r, r), this.state.matrix).execute(this.trace, bot);
      }
      else {
        this.botTasks[bid].execute(this.trace, bot);
      }

    }

    this.state.doEnergyTick()
  }

  getFreeBot() : Bot | void {
    for (let bid in this.state.bots) {
      if (!this.botTasks[bid] || this.botTasks[bid].isFinished())
        return this.state.getBot(bid);
    }
  }

  submitTask(task: any) {
    const bot = this.getFreeBot();

    if (bot)
      this.botTasks[bot.bid] = task;
  }

}
