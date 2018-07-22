// @flow

import { Bot, Coord, Matrix, State } from "./model/model";
import * as command from "./model/command"
import * as model from "./model/model"

// Bot strategies
class FissionBotStrategy {
  constructor() {

  }

  execute(bot: Bot, solver: MultiSolver) {
    if(!solver.state.matrix.isFilled(bot.pos.x + 1, bot.pos.y, bot.pos.z)) {
      let childBid = bot.seeds[0];

      solver.trace.execCommand(new command.Fission(new Coord(1, 0, 0), Math.floor(bot.seeds.length/2)), bot.bid);

      let child = solver.state.getBot(childBid);

      bot.strategy = new GoToPointBotStrategy(solver.front.getInitTargetPosForBot());

      child.strategy = new GoToPointBotStrategy(solver.front.getInitTargetPosForBot());
    }
    else
      throw "Can't fission"
  }
}

class GoToPointBotStrategy {
  constructor(target: Coord) {
    this.target = target
    this.waitingTurns = 0
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
       try {
         if (bot.pos.y !== this.target.y) {
           let dir = Math.sign(this.target.y - bot.pos.y)
           if (!solver.state.matrix.isFilled(bot.pos.x, bot.pos.y + dir, bot.pos.z)) {
             solver.trace.execCommand(new command.SMove(new Coord(0, dir, 0)), bot.bid)
             isMoved = true
           }
         }

         if (!isMoved && bot.pos.x !== this.target.x) {
           let dir = Math.sign(this.target.x - bot.pos.x)
           if (!solver.state.matrix.isFilled(bot.pos.x + dir, bot.pos.y, bot.pos.z)) {
             solver.trace.execCommand(new command.SMove(new Coord(dir, 0, 0)), bot.bid)
             isMoved = true
           }
         }

         if (!isMoved && bot.pos.z !== this.target.z) {
           let dir = Math.sign(this.target.z - bot.pos.z)
           if (!solver.state.matrix.isFilled(bot.pos.x, bot.pos.y, bot.pos.z + dir)) {
             solver.trace.execCommand(new command.SMove(new Coord(0, 0, dir)), bot.bid)
             isMoved = true
           }
         }
       } catch(e) {

         //console.log("waiting " + bot.bid + " " + solver.front.arr.length)
         solver.trace.execCommand(new command.Wait(), bot.bid)
         isMoved = true
         this.waitingTurns++

         if(this.waitingTurns > 3)
           bot.strategy = new FillNeighboursBotStrategy();

       }

       if(!isMoved) {
         //console.log("Void!")
         if(bot.pos.y !== this.target.y) {
           let dir = new Coord(0, Math.sign(this.target.y - bot.pos.y), 0)
           solver.trace.execCommand(new command.Void(dir), bot.bid)

           solver.front.addPos(new Coord(bot.pos.x + dir.x, bot.pos.y + dir.y, bot.pos.z + dir.z))
         }
         else if(bot.pos.x !== this.target.x) {
           let dir = new Coord(Math.sign(this.target.x - bot.pos.x), 0, 0)
           solver.trace.execCommand(new command.Void(dir), bot.bid)

           solver.front.addPos(new Coord(bot.pos.x + dir.x, bot.pos.y + dir.y, bot.pos.z + dir.z))
         }
         else if(!isMoved && bot.pos.z !== this.target.z) {
           let dir = new Coord(0, 0, Math.sign(this.target.z - bot.pos.z))
           solver.trace.execCommand(new command.Void(dir), bot.bid)

           solver.front.addPos(new Coord(bot.pos.x + dir.x, bot.pos.y + dir.y, bot.pos.z + dir.z))
         }
       }
     }
  }
}

class FillNeighboursBotStrategy {
  constructor() {
    this.exitsNum = -1
  }

  execute(bot: Bot, solver: MultiSolver) {

    if(this.exitsNum === -1) {
      this.exitsNum = solver.state.matrix.getFreeWalkableNeighboursNum()
    }

    let isDoneFilling = false


    let cell = solver.front.getNearPosForFill(bot.pos)
    if(cell) {
      let fillDirection = new Coord(Math.sign(cell.x - bot.pos.x), Math.sign(cell.y - bot.pos.y), Math.sign(cell.z - bot.pos.z))

      if(!(fillDirection.getMlen() === 1 && this.exitsNum < 2)) {

        solver.trace.execCommand(new command.Fill(fillDirection), bot.bid)
        solver.front.deletePos(cell)

        if (fillDirection.getMlen() === 1)
          this.exitsNum--

        isDoneFilling= true
      }
    }

    if(!isDoneFilling) {
      let target = solver.front.getNextTargetPos(bot.pos)

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

  getInitTargetPosForBot() {
    return this.arr[Math.floor(Math.random() * this.arr.length)].getAdded(new Coord(0, 1, 1))
  }

  getNextTargetPos(c: Coord) {

    if(!this.arr.length)
      return undefined;

    let closestI = 0
    let closestDist = 255
    for (let i = 0; i < this.arr.length; i++) {
      if (!this.arr[i])
        continue;

      let diff = new Coord(this.arr[i].x - c.x, this.arr[i].y - c.y, this.arr[i].z - c.z)
      if(diff.getMlen() < closestDist) {
        closestDist = diff.getMlen();
        closestI = i
      }
    }

    return this.arr[closestI].getAdded(new Coord(0, 1, 0))
  }

  getNearPosForFill(botC: Coord) {

    for (let i = 0; i < this.arr.length; i++) {
      if (!this.arr[i])
        continue
      let diff = new Coord(this.arr[i].x - botC.x, this.arr[i].y - botC.y, this.arr[i].z - botC.z)
      if(diff.getMlen() <= 2 && diff.getClen() === 1 && diff.y < 0) {
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

  addPos(c: Coord) {
    this.arr.push(c)
  }

  addNeighbours(c: Coord) {
    //console.log(this.arr.length)

    for(let x = Math.max(0, c.x - 1); x <= c.x + 1; x++) {
      for (let y = Math.max(0, c.y - 1); y <= c.y + 1; y++) {
        for (let z = Math.max(0, c.z - 1); z <= c.z + 1; z++) {
          let diff = new Coord(x - c.x, y - c.y, z - c.z)
          if (diff.getMlen() <= 1 && !this.matrix.isFilled(x, y, z) && this.targetMatrix.isFilled(x, y, z)) {
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
    bot.strategy = new FissionBotStrategy()

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
