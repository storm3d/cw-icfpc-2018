// @flow

import { Bot, coord, Coord, Matrix, State } from "./model/model";
import * as command from "./model/command"
import * as model from "./model/model"
import FloatingVoxels from "./model/floating-voxels";
import { FissionTask, FreeMoveTask, SingleCommandTask } from "./tasks/task";
import { Trace } from "./model/command";
import { freeMove } from "./model/move";
import { Wait } from "./model/command";

export default class PlanarSolver {

  targetMatrix: Matrix
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

      this.targetMatrix = targetMatrix;
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

  findNextToFill(start: Coord, slice: Array<Coord>, matrix: Matrix) : Coord | void {
    let cc = start.getCopy();
    let bestIdx = undefined
    let minD = 1000000000
    for (let i = 0; i < slice.length; i++) {
      if (!slice[i])
        continue

      const isGrounded = (slice[i].y === 0
        || matrix.isFilled(slice[i].x, slice[i].y - 1, slice[i].z)
        || matrix.isFilled(slice[i].x - 1, slice[i].y, slice[i].z)
        || matrix.isFilled(slice[i].x + 1, slice[i].y, slice[i].z)
        || matrix.isFilled(slice[i].x, slice[i].y, slice[i].z - 1)
        || matrix.isFilled(slice[i].x, slice[i].y, slice[i].z + 1))

      const dist = (Math.abs(cc.x - slice[i].x) + Math.abs(cc.z - slice[i].z)) * (isGrounded ? 1 : 1000)

      if (dist < minD) {
          bestIdx = i
          minD = dist
      }
    }
    return bestIdx !== undefined ? slice[bestIdx] : undefined;;
  }


  fillVoxel(c: Coord, matrix: Matrix, targetMatrix: Matrix, bot: Bot) {

    // const fillPos = this.state.getBot(bid).pos.getAdded(c);
    // this.floatingVoxels.fill(fillPos.x, fillPos.y, fillPos.z, this.state.matrix);
    //
    // if (!this.floatingVoxels.allGrounded() && this.state.harmonics === 0)
    //   this.trace.execCommand(new command.Flip(), bid);

    let cc = bot.pos.getAdded(c)
    if (matrix.isValidCoord(cc) && targetMatrix.isFilled(cc.x, cc.y, cc.z) && !matrix.isFilled(cc.x, cc.y, cc.z)) {
      return new command.Fill(c)
    }

    // if (this.floatingVoxels.allGrounded() && this.state.harmonics !== 0)
    //   this.trace.execCommand(new command.Flip(), bid);

  }

  fillUnder(matrix: Matrix, targetMatrix: Matrix, bot: Bot) {

    return (this.fillVoxel(coord(-1, -1, 0), matrix, targetMatrix, bot) ||
      this.fillVoxel(coord(1, -1, 0), matrix, targetMatrix, bot) ||
      this.fillVoxel(coord(0, -1, -1), matrix, targetMatrix, bot) ||
      this.fillVoxel(coord(0, -1, 1), matrix, targetMatrix, bot) ||
      this.fillVoxel(coord(0, -1, 0), matrix, targetMatrix, bot))
  }

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


    this.submitTask(new SingleCommandTask(new command.Flip()));
    for (let k = 0; k < 30; k++) {
      this.submitTask(new FissionTask(), (bot) => (bot.seeds.length > 0));
    }
    this.executeStep()

    const MAX_STEPS = 10000;

    for (let level = 0; level < targetMatrix.r; level++) {
      let slice = this.getSlice(targetMatrix, level)
      while (slice.find((c) => ( c !== undefined ))) {
        this.executeStep(() => (new FillNearestTask(this, slice)))

        if (this.state.step >= MAX_STEPS)
          return this.trace;
      }
    }

    while (this.hasPendingTasks())
      this.executeStep()

    for (let i = 0; i < this.state.getBotsNum(); i++)
      this.submitTask(new FreeMoveTask(coord(0, 0, 0), this.state.matrix));

    this.executeStep()
    this.executeStep()
    this.executeStep()
    this.executeStep()
    this.executeStep()

    this.submitTask(new SingleCommandTask(new command.Flip()))
    this.executeStep()

    this.submitTask(new SingleCommandTask(new command.Halt()))
    this.executeStep()

    return this.trace
  }

  executeStep(defaultTaskCallback?: () => any) {

    this.assignTasksFromQueue()

    for (let bid in this.state.bots) {
      let bot = this.state.getBot(bid);
      if (!this.botTasks[bid] || this.botTasks[bid].isFinished()) {

        const task = defaultTaskCallback ? defaultTaskCallback() : new SingleCommandTask(new command.Wait())

        this.botTasks[bot.bid] = task
        task.execute(this.trace, bot)
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

  getFreeBot(botPredicate?: (bot: Bot) => boolean): Bot | void {
    for (let bid in this.state.bots) {
      if (!this.botTasks[bid] || this.botTasks[bid].isFinished())
        if (!botPredicate || botPredicate(this.state.getBot(bid)))
          return this.state.getBot(bid);
    }
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

  hasPendingTasks() {
    if (this.taskQueue.length > 0)
      return true;

    for (let bid in this.state.bots) {
      if (this.botTasks[bid] && !this.botTasks[bid].isFinished())
        return true;
    }
    return false;
  }
}

class FillNearestTask {
  solver: PlanarSolver
  slice: Array<Coord>
  finished: boolean
  blockedCounter: number
  target: Coord | void

  constructor(solver: PlanarSolver, slice: Array<Coord>) {
    this.solver = solver
    this.slice = slice
    this.finished = false
    this.blockedCounter = 0
  }

  isFinished() {
    return this.finished
  }

  execute(trace: Trace, bot: Bot) {

    if (this.blockedCounter >= 3)
    {
      const r = this.solver.state.matrix.r
      const x = Math.floor(Math.random() * r)
      const z = Math.floor(Math.random() * r)

      this.target = coord(x, bot.pos.y, z)

      // console.log(`Bot ${bot.bid} blocked, randomly moving to ${this.target.toString()}`)

      const mc = freeMove(bot.pos, this.target, this.solver.state.matrix)
      trace.execCommand(mc ? mc : new Wait(), bot.bid)
      this.blockedCounter = 0
      // this.finished = true
      return
    }

    if (!this.target) {
      const tofill = this.solver.findNextToFill(bot.pos, this.slice, this.solver.state.matrix)
      if (tofill)
        this.target = tofill.getAdded(coord(0, 1, 0))
    }

    if (!this.target) {
      trace.execCommand(new Wait(), bot.bid)
      this.finished = true;
      return
    }

    const mc = freeMove(bot.pos, this.target, this.solver.state.matrix);

    if (mc) {
      this.blockedCounter = trace.execCommand(mc, bot.bid) ? 0 : this.blockedCounter + 1;
      return
    }

    // arrived to destination, filling under
    const fillc = this.solver.fillUnder(this.solver.state.matrix, this.solver.targetMatrix, bot)
    if (fillc) {
      let ran = trace.execCommand(fillc, bot.bid)
      this.blockedCounter = ran ? 0 : this.blockedCounter + 1

      if (ran) {
        const filled = bot.pos.getAdded(fillc.nd)
        const idx = this.slice.findIndex((c) => (c !== undefined && c.x === filled.x && c.y === filled.y && c.z === filled.z ))
        delete this.slice[idx]
      }
    }
    else {
      trace.execCommand(new Wait(), bot.bid)
      this.finished = true;
    }

  }

}

