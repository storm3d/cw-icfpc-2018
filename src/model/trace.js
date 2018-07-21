import { State } from "./model";

export class Trace {
  constructor() {
    this.commands = [];
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

  toSting() : string {
  }
}

export class Wait {
  run(state : State, bid : number) {
    // nothing to do here!
  }

  toSting() : string {
  }
}

export class Flip {
  run(state : State, bid : number) {
    state.harmonics = state.harmonics === 1 ? 0 : 1
  }

  toSting() : string {
  }
}

export class SMove {
  constructor(lld : Coord) {
    if(!lld.isLongLinearDiff())
      throw "Not a lld"

    this.lld = lld;

  }

  run(state : State, bid : number) {
    let bot = state.getBot(bid)

    let c = bot.pos.getAdded(this.lld)
    if(!state.matrix.isValidCoord(c))
      throw "Not valid coord"

    bot.pos = c
    state.spendEnergy(this.lld.getMlen()*2)
  }

  toSting() : string {
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

  run(state : State, bid : number) {}

  toSting() : string {
  }
}

export class Fission {
  constructor(nd : Coord, m : number) {
    this.nd = nd;
    this.m = m;
  }

  run(state : State, bid : number) {}

  toSting() : string {
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

  toSting() : string {
  }
}

