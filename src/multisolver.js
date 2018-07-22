// @flow

import { Bot, Coord, Matrix, State } from "./model/model";
import * as command from "./model/command"
import * as model from "./model/model"

// Bot strategies
class GoToPointBotStrategy {
  constructor(target: Coord) {
    this.target = target
  }

  execute(bot: Bot, solver: MultiSolver) {
     if(bot.pos.isEqual(this.target)) {
       if(solver.front.isEmpty() && bot.pos.isEqual(new Coord(0, 0, 0))) {
         solver.trace.execCommand(new command.Halt(), bot.bid)
       }
       else {
         bot.strategy = new FillNeighboursBotStrategy()
         bot.strategy.execute(bot, solver)
       }
     }
     else {

       let isMoved = false

       if(bot.pos.y !== this.target.y) {
         let dir = Math.sign(this.target.y - bot.pos.y)
         if(!solver.state.matrix.isFilled(bot.pos.x, bot.pos.y + dir, bot.pos.z)) {
           solver.trace.execCommand(new command.SMove(new Coord(0, dir, 0)), bot.bid)
           isMoved = true
         }
       }

       if(!isMoved && bot.pos.x !== this.target.x) {
         let dir = Math.sign(this.target.x - bot.pos.x)
         if(!solver.state.matrix.isFilled(bot.pos.x + dir, bot.pos.y, bot.pos.z)) {
           solver.trace.execCommand(new command.SMove(new Coord(dir, 0, 0)), bot.bid)
           isMoved = true
         }
       }

       if(!isMoved && bot.pos.z !== this.target.z) {
         let dir = Math.sign(this.target.z - bot.pos.z)
         if(!solver.state.matrix.isFilled(bot.pos.x, bot.pos.y, bot.pos.z + dir)) {
           solver.trace.execCommand(new command.SMove(new Coord(0, 0, dir)), bot.bid)
           isMoved = true
         }
       }

       if(!isMoved) {
         solver.trace.execCommand(new command.Halt(), bot.bid)
       }
     }
  }
}

class FillNeighboursBotStrategy {
  constructor() {
  }

  execute(bot: Bot, solver: MultiSolver) {

    let cell = solver.front.getNearPosForFill(bot.pos)
    if(cell) {
      solver.trace.execCommand(new command.Fill(new Coord(Math.sign(cell.x - bot.pos.x), Math.sign(cell.y - bot.pos.y), Math.sign(cell.z - bot.pos.z))), bot.bid)
      solver.front.deletePos(cell)
    }
    else {
      let target = solver.front.getNextPos()

      if(!target) {
        target = new Coord(0, 0, 0)
      }
      bot.strategy = new GoToPointBotStrategy(target)
      bot.strategy.execute(bot, solver)
    }
  }
}



class Front {
  constructor(matrix: Matrix, targetMatrix: Matrix) {
    this.arr = this._getFullSlice(targetMatrix, 0)
    this.matrix = matrix
    this.targetMatrix = targetMatrix

    this.closestCachedI = 0
  }

  _getFullSlice(m: Matrix, y: number): Array<Coord> {

    let slice = []
    for (let z = 0; z < m.r; z++)
      for (let x = 0; x < m.r; x++)
        if (m.isFilled(x, y, z))
          slice.push(new Coord(x, y, z))

    return slice
  }

  isEmpty() {
    return this.arr.length === 0
  }

  getInitPosForBot() {
    return this.arr[0].getAdded(new Coord(0, 1, 1))
  }

  getNextPos() {
    for (let i = 0; i < this.arr.length; i++) {
      if (!this.arr[i])
        continue
      return this.arr[i].getAdded(new Coord(0, 1, 0))
    }
    return undefined
  }

  getNearPosForFill(botC: Coord) {

    for (let i = 0; i < this.arr.length; i++) {
      if (!this.arr[i])
        continue
      let diff = new Coord(this.arr[i].x - botC.x, this.arr[i].y - botC.y, this.arr[i].z - botC.z)
      if(diff.getMlen() <= 2 && diff.getClen() == 1 && diff.y < 0) {
        this.closestCachedI = i
        return this.arr[i];
      }
    }
    return undefined
  }

  deletePos(c: Coord) {
    if(this.arr[this.closestCachedI] && c.isEqual(this.arr[this.closestCachedI]))
      this.arr[this.closestCachedI] = 0
    else {
      for (let i = 0; i < this.arr.length; i++) {
        if (!this.arr[i])
          continue
        if (c.isEqual(this.arr[i])) {
          this.arr[i] = 0
          break
        }
      }
    }

    while(this.arr[0] === 0)
      this.arr.shift()

    this.addNeighbours(c)
  }

  addNeighbours(c: Coord) {
    console.log(this.arr.length)

    for(let x = Math.max(0, c.x - 1); x <= c.x + 1; x++) {
      for (let y = Math.max(0, c.y - 1); y <= c.y + 1; y++) {
        for (let z = Math.max(0, c.z - 1); z <= c.z + 1; z++) {
          let diff = new Coord(x - c.x, y - c.y, z - c.z)
          if (diff.getMlen() <= 1 && diff.getClen() == 1
            && !this.matrix.isFilled(x, y, z) && this.targetMatrix.isFilled(x, y, z)) {
            let isAddedAlready = false
            for (let i = 0; i < this.arr.length; i++) {
              if (!this.arr[i])
                continue
              if (this.arr[i].x === x && this.arr[i].y === y && this.arr[i].z === z) {
                isAddedAlready = true
                break
              }
            }

            if (!isAddedAlready)
              this.arr.push(new Coord(x, y, z))
          }
        }
      }
    }
  }
}

export default class MultiSolver {

//  botStrategies: any
  front: Front
  trace: command.Trace
  state: State

  //floatingVoxels : FloatingVoxels;

  constructor() {
    //this.strategy = new GoToModelStrategy()
  }

  solve(targetMatrix: Matrix) {

    let matrix = new Matrix(targetMatrix.r)
    let bot = new Bot(1, new Coord(0, 0, 0), [...Array(39).keys()].map(x => x += 2))
    this.state = new model.State(matrix, bot);
    this.front = new Front(matrix, targetMatrix)

    //this.floatingVoxels = new FloatingVoxels(targetMatrix.r);
    this.trace = new command.Trace(this.state)
    bot.strategy = new GoToPointBotStrategy(this.front.getInitPosForBot())

    while(!this.state.isFinished) {
      for(let bid in this.state.bots) {
        let bot = this.state.bots[bid]
        bot.strategy.execute(bot, this)
      }

      this.state.doEnergyTick()
    }

    return this.trace
  }

}
