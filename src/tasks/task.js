// @flow

import { Fission, Trace, Wait } from "../model/command";
import { Bot, coord, Coord, Matrix, VolatileError } from "../model/model";
import { freeMove, move } from "../model/move";

export class Task {

  isFinished() {
    throw "Task completed unsupported"
  }

  execute(trace: Trace) {
    throw "Task execute unsupported"
  }

}

export class SingleCommandTask {
  command: any;
  finished: boolean;

  constructor(command: any) {
    this.command = command
    this.finished = false;
  }

  execute(trace: Trace, bot: Bot) {
    this.finished = trace.execCommand(this.command, bot.bid);
  }

  isFinished() {
    return this.finished;
  }
}

export class FreeMoveTask {
  to: Coord;
  matrix: Matrix;
  finished: boolean;

  constructor(to: Coord, matrix: Matrix) {
    this.to = to;
    this.matrix = matrix;
    this.finished = false;
  }

  execute(trace: Trace, bot: Bot) {

    const c = freeMove(bot.pos, this.to, this.matrix);

    if (c) {
        trace.execCommand(c, bot.bid);
        this.finished = bot.pos.getDiff(this.to).getMlen() == 0;
    }
    else {
      trace.execCommand(new Wait(), bot.bid);
      this.finished = true;
    }
  }

  isFinished() {
    return this.finished;
  }

}

export class FissionTask {
  finished: boolean;

  constructor() {
    this.finished = false;
  }

  execute(trace: Trace, bot: Bot) {
      if (bot.seeds.length) {
        const m = Math.floor(bot.seeds.length / 2)
        this.finished = trace.execCommand(new Fission(coord(0, 0, 1), m), bot.bid);
      }
      else
        throw new Error("Cannot fission bot without seeds")
  }

  isFinished() {
    return this.finished;
  }
}


// tasks and jobs
// gfill region job
// fission
// fusion job
// fill nearest (default and low priority)
//

// Job - gfill region
// 4 bots
// 4 corners
// create 4 tasks to go
// create gfill task

// Job - fusion

//

// bots pool

