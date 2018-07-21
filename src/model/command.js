import { State } from "./model";

export class Trace {
  constructor() {
    this.commands = [];
  }

  addCommand(c) {
    this.commands.push(c)
  }
}

export class Halt {
  run(state : State, bid : number) {
    let bot = state.getBot(bid)

    if(bot.pos.x !== 0 || bot.pos.y !== 0 || bot.pos.z !== 0)
      throw "Not in origin"

    if(state.getBotsNum() !== 1)
      throw "Not only bot"

    if(state.harmonics !== 0)
      throw "Not low harmonics"

  }

  toString() : string {

  }
}

export class Wait {
  run(state : State, bid : number) {
    // nothing to do here!
  }

  toString() : string {
  }
}

export class Flip {
  run(state : State, bid : number) {
    state.harmonics = state.harmonics === 1 ? 0 : 1
  }

  toString() : string {
  }
}

export class SMove {
  constructor(lld : Coord) {
    if(!lld.isLongLinearDiff())
      throw "Not a lld"

    this.lld = lld;

  }

  run(state: State, bid: number) {
    let bot = state.getBot(bid)

    let c = bot.pos.getAdded(this.lld)
    if(!state.matrix.isValidCoord(c))
      throw "Not valid coord"

    bot.pos = c
    state.spendEnergy(this.lld.getMlen()*2)
  }

  toString() : string {
  }
}

export class LMove {
  constructor(sld1 : Coord, sld2 : Coord) {
    if(!sld1.isShortLinearDiff())
      throw "1 is not a sld"
    if(!sld2.isShortLinearDiff())
      throw "2 is not a sld"

    this.sld1 = sld1;
    this.sld2 = sld2;
  }

  run(state: State, bid: number) {
    let bot = state.getBot(bid)

    let c1 = bot.pos.getAdded(this.sld1)
    if(!state.matrix.isValidCoord(c1))
      throw "C1 is not valid coord"

    let c2 = c1.getAdded(this.sld2)
    if(!state.matrix.isValidCoord(c2))
      throw "C2 is not valid coord"

    bot.pos = c2
    state.spendEnergy((this.sld1.getMlen() + 2 + this.sld2.getMlen())*2)
  }

  toString() : string {
  }
}

export class FusionP {
  constructor(nd : Coord) {
    this.nd = nd;
  }

  run(state : State, bid : number) { throw "unsupported" }

  toString() : string {
  }

}

export class FusionS {
  constructor(nd : Coord) {
    this.nd = nd;
  }

  run(state : State, bid : number) { throw "unsupported" }

  toString() : string {
  }

}

export class Fission {
  constructor(nd : Coord, m : number) {
    this.nd = nd;
    this.m = m;
  }

  run(state : State, bid : number) {}

  toString() : string {
  }
}

export class Fill {
  constructor(nd : Coord) {
    if(!nd.isNearCoordDiff())
      throw "Not a nd"
    this.nd = nd;
  }

  run(state : State, bid : number) {
    let bot = state.getBot(bid)
    let c = bot.pos.getAdded(this.nd)
    if(!state.matrix.isValidCoord(c))
      throw "Not valid coord"

    let isAlreadyFilled = state.matrix.isFilled(c)
    state.matrix.fill(c)

    state.spendEnergy(isAlreadyFilled ? 6 : 12)
  }

  toString() : string {
  }
}

