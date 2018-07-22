// @flow
import { Coord, State, Region } from "./model";

export class Trace {
  state: State;
  commands: Array<any>;

  constructor(state: State) {
    this.state = state;
    this.commands = [];
  }

  execCommand(c: any, bid: number) {
    this.commands.push(c)
    c.run(this.state, bid)
  }


  toString(max: number) {

    let n = max ? max : this.commands.length;

    let result = "";

    for (let i = 0; i < n; i++)
      result += this.commands[i].toString() + "\n";

    return result;
  }
}

export class Halt {
  run(state: State, bid: number) {
    let bot = state.getBot(bid)

    //if (bot.pos.x !== 0 || bot.pos.y !== 0 || bot.pos.z !== 0)
    //  throw "Not in origin"

    if (state.getBotsNum() !== 1)
      throw "Not only bot"

    if (state.harmonics !== 0)
      throw "Not low harmonics"

    state.isFinished = true
  }

  toString(): string {
    return "Halt"
  }
}

export class Wait {
  run(state: State, bid: number) {
    // nothing to do here!
  }

  toString(): string {
    return "Wait"
  }
}

export class Flip {
  run(state: State, bid: number) {
    state.harmonics = state.harmonics === 1 ? 0 : 1
  }

  toString(): string {
    return "Flip"
  }
}

export class SMove {
  lld: Coord;

  constructor(lld: Coord) {
    if (!lld.isLongLinearDiff())
      throw "Not a lld"

    this.lld = lld;

  }

  run(state: State, bid: number) {
    let bot = state.getBot(bid)

    let c = bot.pos.getAdded(this.lld)
    if (!state.matrix.isValidCoord(c))
      throw "Not valid coord"

    bot.pos = c
    state.spendEnergy(this.lld.getMlen() * 2)
  }

  toString(): string {
    return `SMove ${this.lld.toString()}`;
  }
}

export class LMove {
  sld1: Coord;
  sld2: Coord;

  constructor(sld1: Coord, sld2: Coord) {
    if (!sld1.isShortLinearDiff())
      throw "1 is not a sld"
    if (!sld2.isShortLinearDiff())
      throw "2 is not a sld"

    this.sld1 = sld1;
    this.sld2 = sld2;
  }

  run(state: State, bid: number) {
    let bot = state.getBot(bid)

    let c1 = bot.pos.getAdded(this.sld1)
    if (!state.matrix.isValidCoord(c1))
      throw "C1 is not valid coord"

    let c2 = c1.getAdded(this.sld2)
    if (!state.matrix.isValidCoord(c2))
      throw "C2 is not valid coord"

    bot.pos = c2
    state.spendEnergy((this.sld1.getMlen() + 2 + this.sld2.getMlen()) * 2)
  }

  toString(): string {
    return `LMove ${this.sld1.toString()} ${this.sld2.toString()}`;
  }
}

export class FusionP {
  nd: Coord;

  constructor(nd: Coord) {
    this.nd = nd;
  }

  run(state: State, bid: number) {
    throw "unsupported"
  }

  toString(): string {
    return "FusionP"
  }

}

export class FusionS {
  nd: Coord;

  constructor(nd: Coord) {
    this.nd = nd;
  }

  run(state: State, bid: number) {
    throw "unsupported"
  }

  toString(): string {
    return "FusionS"
  }

}

export class Fission {
  nd: Coord;
  m: number;

  constructor(nd: Coord, m: number) {
    this.nd = nd;
    this.m = m;
  }

  run(state: State, bid: number) {
  }

  toString(): string {
    return "Fission"
  }
}

export class Fill {
  nd: Coord;

  constructor(nd: Coord) {
    if (!nd.isNearCoordDiff())
      throw "Not a nd"
    this.nd = nd.getCopy();
  }

  run(state: State, bid: number) {
    let bot = state.getBot(bid)
    let c = bot.pos.getAdded(this.nd)
    if (!state.matrix.isValidCoord(c))
      throw "Not valid coord"
    if (state.bots.length > 1) {
      if (!bot.pos.isAdjacent(c) && state.verifyRegion(new Region(bot.pos, c))) {
        state.addRegion(new Region(bot.pos, c));
      } else if (bot.pos.isAdjacent(c) && state.verifyRegion(new Region(bot.pos, bot.pos)) &&
        state.verifyRegion(new Region(c, c))) {
        state.addRegion(new Region(bot.pos, bot.pos));
        state.addRegion(new Region(c, c));
      } else {
        let err = new Error("Regions Intersection");
        throw err;
      }
    }

    let isAlreadyFilled = state.matrix.isFilled(c.x, c.y, c.z)
    state.matrix.fill(c.x, c.y, c.z)

    state.spendEnergy(isAlreadyFilled ? 6 : 12)
  }

  toString(): string {
    return `Fill ${this.nd.toString()}`;
  }
}

export class Void {
  nd: Coord;

  constructor(nd: Coord) {
    if (!nd.isNearCoordDiff())
      throw "Not a nd"
    this.nd = nd;
  }

  run(state: State, bid: number) {
    let bot = state.getBot(bid)
    let c = bot.pos.getAdded(this.nd)
    if (!state.matrix.isValidCoord(c))
      throw "Not valid coord"

    let isAlreadyFilled = state.matrix.isFilled(c.x, c.y, c.z)
    state.matrix.clear(c.x, c.y, c.z)

    state.spendEnergy(isAlreadyFilled ? -12 : 3)
  }

  toString(): string {
    return `Void ${this.nd.toString()}`
  }
}

export class GFill {
  nd: Coord;
  fd: Coord;

  constructor(nd: Coord, fd: Coord) {
    this.nd = nd;
    this.fd = fd;
  }

  run(state: State, bid: number) {
    throw "unsupported"
  }

  toString(): string {
    return `GFill ${this.nd.toString()} ${this.fd.toString()}`
  }

}

export class GVoid {
  nd: Coord;
  fd: Coord;

  constructor(nd: Coord, fd: Coord) {
    this.nd = nd;
    this.fd = fd;
  }

  run(state: State, bid: number) {
    throw "unsupported"
  }

  toString(): string {
    return `GVoid ${this.nd.toString()} ${this.fd.toString()}`
  }

}
