// @flow

import { Bot, coord, Coord, Matrix, State } from "./model/model";
import * as command from "./model/command"
import * as model from "./model/model"
import { move } from "./model/move";
import { Void } from "./model/command";

// Bot strategies
class FusionBotStrategy {
  constructor(nd : Coord, isPrimary : boolean, step) {
    this.nd = nd;
    this.isPrimary = isPrimary;
    this.step = step
  }

  execute(bot: Bot, solver: MultiSolver) {
    if(solver.step < this.step) {
      solver.trace.execCommand(new command.Wait(), bot.bid);
      console.log("fus waiting");
      return;
    }

    if(this.isPrimary) {
      console.log("fus prim");
      solver.trace.execCommand(new command.FusionP(this.nd), bot.bid);
      bot.strategy = new GoToPointBotStrategy(solver.front.getInitTargetPosForBot());
      console.log("fus prim succ");
    }
    else {
      console.log("fus sec");
      solver.trace.execCommand(new command.FusionS(this.nd), bot.bid);
      console.log("fus sec succ");
    }


  }
}
class FissionBotStrategy {
  constructor() {

  }

  execute(bot: Bot, solver: MultiSolver) {
    if(!bot.seeds.length) {
      bot.strategy = new GoToPointBotStrategy(solver.front.getInitTargetPosForBot());
      bot.strategy.execute(bot, solver);
    }
    else if (!solver.state.matrix.isFilled(bot.pos.x + 1, bot.pos.y, bot.pos.z)) {
      let childBid = bot.seeds[0];
      console.log("fiss: " + bot.bid + " " + childBid);
      if(solver.trace.execCommand(new command.Fission(new Coord(1, 0, 0), Math.floor(bot.seeds.length / 2)), bot.bid)) {
        let child = solver.state.getBot(childBid);

        bot.strategy = new GoToPointBotStrategy(solver.front.getInitTargetPosForBot());
        child.strategy = new GoToPointBotStrategy(solver.front.getInitTargetPosForBot());
      }
    }
    else {
      bot.strategy = new GoToPointBotStrategy(solver.front.getInitTargetPosForBot());
      bot.strategy.execute(bot, solver);
    }
  }
}

class GoToPointBotStrategy {
  constructor(target: Coord) {
    this.target = target
    this.waitingTurns = 0
  }

  execute(bot: Bot, solver: MultiSolver) {
    console.log("going to "+this.target);

    if (bot.pos.isEqual(this.target)) {
      if (solver.front.isEmpty() && bot.pos.isEqual(new Coord(0, 0, 0))) {
        solver.isHalt = true;
      }
      else {
        //console.log("arrived at: " + bot.pos.toString());
        //console.log(solver.front.arr.length);

        if (solver.state.getBotsNum() < solver.front.size/2)
          bot.strategy = new FissionBotStrategy();
        else
          bot.strategy = new FillNeighboursBotStrategy();
        bot.strategy.execute(bot, solver);
      }
    }
    else {
        const torun = move(bot.pos, this.target, solver.state.matrix);

        let isExecuted = false;
        if(torun)
          isExecuted = solver.trace.execCommand(torun, bot.bid);
        else {
          // blocked!

          console.log("blocked!")
        }

        if(!isExecuted) {
          this.waitingTurns++;

          if (this.waitingTurns > 3) {
            let from = bot.pos;
            let to = this.target;
            const diff = from.getDiff(to);
            let dirC;

            if (Math.abs(diff.x) > Math.abs(diff.y) && Math.abs(diff.x) > Math.abs(diff.z))
              dirC = (coord(Math.sign(diff.x), 0, 0));
            else if (Math.abs(diff.y) > Math.abs(diff.z))
              dirC = (coord(0, Math.sign(diff.x), 0));
            else
              dirC = (coord(0, 0, Math.sign(diff.z)));

            let closeC = bot.pos.getAdded(dirC);
            let otherBot = solver.state.findBotByCoord(closeC)
            if(otherBot && otherBot != bot) {
              console.log("BOT in a way");

              if(solver.front.size*2 <= solver.state.getBotsNum() && !(otherBot.strategy instanceof FusionBotStrategy)) {
                console.log("FUSION TIME " + (otherBot.strategy instanceof FusionBotStrategy) + " " + (solver.step + 1));
                bot.strategy = new FusionBotStrategy(dirC, true, solver.step + 1);
                otherBot.strategy = new FusionBotStrategy(new Coord(-dirC.x, -dirC.y, -dirC.z), false, solver.step + 1);
              }
            }
            else
              bot.strategy = new GoToPointBotStrategy(solver.front.getInitTargetPosForBot());
          }
        }
      }
  }
}

class FillNeighboursBotStrategy {
  constructor() {
    this.waitingTurns = 0
  }

  execute(bot: Bot, solver: MultiSolver) {
    console.log("filling")
    let isDoneFilling = false

      let cell = solver.front.getNearPosForFill(bot.pos)
      if (cell) {
        let fillDirection = new Coord(Math.sign(cell.x - bot.pos.x), Math.sign(cell.y - bot.pos.y), Math.sign(cell.z - bot.pos.z))

        if(solver.trace.execCommand(new command.Fill(fillDirection), bot.bid)) {
          solver.front.deletePos(cell);
        }
        else {
          this.waitingTurns++
          if (this.waitingTurns > 3) {
            console.log("cadd " + bot.pos)
            bot.strategy = new GoToPointBotStrategy(solver.front.getInitTargetPosForBot());
          }
        }
        isDoneFilling = true;
      }

      if (!isDoneFilling) {
        let target = solver.front.getNextTargetPos(bot.pos)

        if (!target) {
          target = new Coord(0, 0, 0)
        }
        bot.strategy = new GoToPointBotStrategy(target)
        bot.strategy.execute(bot, solver)
      }
  }
}


class Front {
  constructor(matrix: Matrix, targetMatrix: Matrix) {
    this.arr = this._getFullSlice(targetMatrix, 0);
    this.matrix = matrix;
    this.targetMatrix = targetMatrix;
    this.y = 0;
    this.isModelFinished = false;
    this.size = 0;

    this.closestCachedI = 0
  }

  _getFullSlice(m: Matrix, y: number): Array<Coord> {

    let slice = []
    for (let z = 0; z < m.r; z++)
      for (let x = 0; x < m.r; x++)
        if (m.isFilled(x, y, z)) {
          slice.push(new Coord(x, y, z));
          this.size++;
        }

    return slice
  }

  _checkArr() {
    if(this.isModelFinished)
      return false;
    if (!this.arr.length) {
      console.log("add floor to " + this.y)
      this.y++;
      if(this.y === this.matrix.r - 1)
        return false;

      this.arr = this._getFullSlice(this.targetMatrix, this.y);

      if (!this.arr.length) {
        this.isModelFinished = true;
        return false;
      }
    }
    return true;
  }

  isEmpty() {
    return this.arr.length === 0
  }

  getInitTargetPosForBot() {
    if(!this._checkArr())
      return new Coord();

    while(1) {
      let c = this.arr[Math.floor(Math.random() * this.arr.length)]
      if(c)
        return c.getAdded(new Coord(0, 1, 0));
    }
  }

  getNextTargetPos(c: Coord) {
    if(!this._checkArr())
      return new Coord();

    let closestI = 0
    let closestDist = 255

    for (let i = 0; i < this.arr.length; i++) {
      if (!this.arr[i])
        continue;

      let diff = new Coord(this.arr[i].x - c.x, this.arr[i].y - c.y, this.arr[i].z - c.z)
      if (diff.getMlen() < closestDist) {
        closestDist = diff.getMlen();
        closestI = i
      }
    }

    return this.arr[closestI].getAdded(new Coord(0, 1, 0))
  }

  getNearPosForFill(botC: Coord) {
    if(!this._checkArr())
      return undefined;

    for (let i = 0; i < this.arr.length; i++) {
      if (!this.arr[i])
        continue
      if(this.arr[i].x === botC.x && this.arr[i].z === botC.z && this.arr[i].y === botC.y - 1)
        return this.arr[i];
      let diff = new Coord(this.arr[i].x - botC.x, this.arr[i].y - botC.y, this.arr[i].z - botC.z)
      if (diff.getMlen() <= 2 && diff.getClen() === 1 /*&& diff.y < 0*/) {
        this.closestCachedI = i
        return this.arr[i];
      }
    }
    return undefined
  }

  deletePos(c: Coord) {
    if (this.arr[this.closestCachedI] && c.isEqual(this.arr[this.closestCachedI])) {
      this.arr[this.closestCachedI] = 0
      this.size--;
    }
    else {
      for (let i = 0; i < this.arr.length; i++) {
        if (!this.arr[i])
          continue
        if (c.isEqual(this.arr[i])) {
          this.arr[i] = 0;
          this.size--;
          break
        }
      }
    }

    while (this.arr[0] === 0)
      this.arr.shift()

    //this.addNeighbours(c)
  }

  addPos(c: Coord) {
    this.arr.push(c);
    this.size++;
  }

  /*
  addNeighbours(c: Coord) {
    //console.log(this.arr.length)

    for (let x = Math.max(0, c.x - 1); x <= c.x + 1; x++) {
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
  */
}

export default class MultiSolver {

//  botStrategies: any
  front: Front
  trace: command.Trace
  state: State

  //floatingVoxels : FloatingVoxels;

  constructor() {
    //this.strategy = new GoToModelStrategy()
    this.isHalt = false;
    this.step = 0;
  }

  solve(targetMatrix: Matrix) {

    let matrix = new Matrix(targetMatrix.r);
    let bot = new Bot(1, new Coord(0, 0, 0), [...Array(39).keys()].map(x => x += 2));
    this.state = new model.State(matrix, bot);
    this.front = new Front(matrix, targetMatrix);

    //this.floatingVoxels = new FloatingVoxels(targetMatrix.r);
    this.trace = new command.Trace(this.state);
    bot.strategy = new FissionBotStrategy();

    this.trace.execCommand(new command.Flip(), 1);
    this.state.doEnergyTick();

    this.step = 1;
    while (!this.state.isFinished) {
      //if(this.step > 2550)
        //break

      for (let bid in this.state.bots) {
        let bot = this.state.bots[bid];
        console.log("Step: " + this.step + " bot=" + bid + " pos=" + bot.pos.toString());
        bot.strategy.execute(bot, this);

        if(this.isHalt) {
          this.state.isFinished = true;
          break;
        }
      }

      this.step++
      this.state.doEnergyTick();
    }

    if (this.state.harmonics !== 0 ) {
      this.trace.execCommand(new command.Flip(), this.state.bots[Object.keys(this.state.bots)[0]].bid);
      this.state.doEnergyTick();
    }

    this.trace.execCommand(new command.Halt(), this.state.bots[Object.keys(this.state.bots)[0]].bid);
    this.state.doEnergyTick();

    return this.trace
  }

}
