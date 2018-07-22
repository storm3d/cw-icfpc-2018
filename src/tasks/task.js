// @flow

import { Fission, Trace, Wait } from "../model/command";
import { Bot, coord, Coord, Matrix } from "../model/model";
import { move } from "../model/move";

export class Task {

  isFinished() {
    throw "Task completed unsupported"
  }

  execute(trace: Trace) {
    throw "Task execute unsupported"
  }

}

export class MoveTask {
  to: Coord;
  matrix: Matrix;
  finished: boolean;

  constructor(to: Coord, matrix: Matrix) {
    this.to = to;
    this.matrix = matrix;
    this.finished = false;
  }

  execute(trace: Trace, bot: Bot) {

    const c = move(bot.pos, this.to, this.matrix);

    if (c) {
      try {
        trace.execCommand(c, bot.bid);
        this.finished = bot.pos.getDiff(this.to).getMlen() == 0;
      } catch(e) {
        trace.execCommand(new Wait(), bot.bid);
      }
    }
    else
      trace.execCommand(new Wait(), bot.bid);
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
    try {
      if (bot.seeds.length)
        trace.execCommand(new Fission(coord(1, 0, 0), bot.seeds.length / 2 + 1), bot.bid);
      else
        trace.execCommand(new Wait(), bot.bid);

      this.finished = true;

    } catch (e) {
      trace.execCommand(new Wait(), bot.bid);
    }
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

