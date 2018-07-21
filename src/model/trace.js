import { State } from "./model";

export class Trace {
  constructor() {
    this.commands = [];
  }
}

export class Halt {
  run(state : State, bid : number) {}
}

export class Wait {
  run(state : State, bid : number) {}
}

export class Flip {
  run(state : State, bid : number) {}
}

export class SMove {
  constructor(lld : Coord) {
    this.lld = lld;
  }

  run(state : State, bid : number) {}
}

export class LMove {
  constructor(sld1 : Coord, sld2 : Coord) {
    this.sld1 = sld1;
    this.sld2 = sld2;
  }

  run(state : State, bid : number) {}
}

export class Fission {
  constructor(nd : Coord, m : number) {
    this.nd = nd;
    this.m = m;
  }

  run(state : State, bid : number) {}
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
}

