// @flow

import { Bot, coord, Coord, Matrix, State } from "./model/model";
import * as command from "./model/command"
import * as model from "./model/model"
import FloatingVoxels from "./model/floating-voxels";
import { FissionTask, MoveTask, Task } from "./tasks/task";

export default class PlanarSolver {

  trace: command.Trace;
  state: State;
  floatingVoxels: FloatingVoxels;
  botTasks: any;
  taskQueue: Array<{task: any, botPredicate?: (bot: Bot) => boolean}>

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
      this.taskQueue = [];
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

  getPath(c1: Coord, c2: Coord, bid: number, verticalLast: boolean = false): void {
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

  findNextToFill(start: Coord, slice: Array<Coord>, matrix: Matrix) {
    let cc = start.getCopy();
    let isGrounded = false
    let bestIdx = undefined
    let minD = 1255
    for (let i = 0; i < slice.length; i++) {
      if (!slice[i])
        continue
      if (Math.abs(cc.x - slice[i].x) + Math.abs(cc.z - slice[i].z) < minD) {

        if (isGrounded) {
          bestIdx = i
          minD = Math.abs(cc.x - slice[i].x) + Math.abs(cc.z - slice[i].z)
        }
        else if (slice[i].y === 0 || matrix.isFilled(slice[i].x, slice[i].y - 1, slice[i].z)) {
          isGrounded = true
          bestIdx = i
          minD = Math.abs(cc.x - slice[i].x) + Math.abs(cc.z - slice[i].z)
        }
      }
    }
    return bestIdx ? slice[bestIdx] : undefined;
  }


  fillVoxel(c: Coord, matrix: Matrix, bot: Bot): boolean {

    // const fillPos = this.state.getBot(bid).pos.getAdded(c);
    // this.floatingVoxels.fill(fillPos.x, fillPos.y, fillPos.z, this.state.matrix);
    //
    // if (!this.floatingVoxels.allGrounded() && this.state.harmonics === 0)
    //   this.trace.execCommand(new command.Flip(), bid);

    let cc = bot.pos.getAdded(c)
    if (matrix.isValidCoord(cc) && !matrix.isFilled(cc.x, cc.y, cc.z)) {
      this.trace.execCommand(new command.Fill(c), bot.bid);
      return true;
    }

    return false;

    // if (this.floatingVoxels.allGrounded() && this.state.harmonics !== 0)
    //   this.trace.execCommand(new command.Flip(), bid);

  }

  fillUnder(matrix: Matrix, bot: Bot): boolean {

    return (this.fillVoxel(coord(-1, -1, 0), matrix, bot) ||
      this.fillVoxel(coord(0, -1, 0), matrix, bot) ||
      this.fillVoxel(coord(1, -1, 0), matrix, bot) ||
      this.fillVoxel(coord(0, -1, -1), matrix, bot) ||
      this.fillVoxel(coord(0, -1, 1), matrix, bot))
  }

  fillSlice(slice: Array<Coord>, matrix: Matrix, bot: Bot) {

    let cc = bot.pos.getCopy();

    while (1) {

      let c = this.findNextToFill(cc, slice, matrix)
      if (!c)
          break;

      let botC = c.getAdded(new Coord(0, 1, 0))

      this.getPath(cc, botC, bot.bid)

      cc = botC

      while(this.fillUnder(matrix, bot));

      // for (let i = 0; i < slice.length; i++) {
      //   if (!slice[i])
      //     continue
      //   if (Math.abs(slice[i].x - botC.x) + Math.abs(slice[i].z - botC.z) <= 1) {
      //     this.fillVoxel(new Coord(Math.sign(slice[i].x - botC.x), -1, Math.sign(slice[i].z - botC.z)), bid)
      //     delete slice[i];
      //   }
      // }
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
    while(i++ <= 30) {
      this.submitTask(new FissionTask(), (bot) => (bot.seeds.length > 0));
    }



    for (let level = 0; level < targetMatrix.r; level++) {
      let slice = this.getSlice(targetMatrix, level)
      //console.log(slice.length)
      if (slice === [])
        break

      this.fillSlice(slice, targetMatrix, this.state.getBot(1))
    }

    i = 0;
    while (i++ < 200) {

      this.executeStep()

    }

    this.trace.execCommand(new command.Halt())

    return this.trace
  }

  executeStep() {

    this.assignTasksFromQueue()

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

  submitTask(task: any, botPredicate?: (bot: Bot) => boolean) {
    this.taskQueue.push({ task, botPredicate })
  }

  assignTasksFromQueue() {
    for (let i = 0; i < this.taskQueue.length; i++) {
      const task = this.taskQueue[i]
      const bot = this.getFreeBot(task.botPredicate)
      if (bot) {
        this.botTasks[bot.bid] = task.task
        delete this.taskQueue[i]
      }
    }
    this.taskQueue = this.taskQueue.filter((e) => e)
  }

  getFreeBot(botPredicate?: (bot: Bot) => boolean): Bot | void {
    for (let bid in this.state.bots) {
      if (!this.botTasks[bid] || this.botTasks[bid].isFinished())
        if (!botPredicate || botPredicate(this.state.getBot(bid)))
          return this.state.getBot(bid);
    }
  }

}
