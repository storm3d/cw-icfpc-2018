// @flow
import { Coord, State, Bot, Region } from "./model";

export class Trace {
  state: State;
  commands: Array<any>;

  constructor(state: State) {
    this.state = state;
    this.commands = [];
  }

  execCommand(c: any, bid: number | void) {
    this.commands.push(c)
    c.run(this.state, bid)

    this.state.doEnergyTick();
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
    let bot = state.getBot(bid);

    state.addVolatileRegion(new Region(bot.pos, bot.pos));
    //
    // if (bot.pos.x !== 0 || bot.pos.y !== 0 || bot.pos.z !== 0)
    //   throw "Not in origin"

    if (state.getBotsNum() !== 1)
      throw "Not only bot";

    if (state.harmonics !== 0)
      throw "Not low harmonics";

    state.isFinished = true
  }

  toString(): string {
    return "Halt"
  }
}

export class Wait {
  run(state: State, bid: number) {
    let bot = state.getBot(bid);
    state.addVolatileRegion(new Region(bot.pos, bot.pos));
  }

  toString(): string {
    return "Wait"
  }
}

export class Flip {
  run(state: State, bid: number) {
    let bot = state.getBot(bid)
    state.addVolatileRegion(new Region(bot.pos, bot.pos));

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
      throw `SMove: Not a lld ${lld.toString()}`;

    this.lld = lld.getCopy();

  }

  run(state: State, bid: number) {
    let bot = state.getBot(bid)
    let c = bot.pos.getAdded(this.lld)
    state.addVolatileRegion(new Region(bot.pos, c));

    if (!state.matrix.isValidCoord(c))
      throw `SMove: not valid coord ${c.toString()}`;

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
      throw `1 is not a sld: ${sld1.toString()}`;
    if (!sld2.isShortLinearDiff())
      throw `2 is not a sld: ${sld2.toString()}`;

    this.sld1 = sld1.getCopy();
    this.sld2 = sld2.getCopy();
  }

  run(state: State, bid: number) {
    let bot = state.getBot(bid);
    let c1 = bot.pos.getAdded(this.sld1);
    if (!state.matrix.isValidCoord(c1))
      throw `LMove: C1 is not a valid coord ${c1.toString()}`;

    state.addVolatileRegion(new Region(bot.pos, c1));

    let c2 = c1.getAdded(this.sld2);
    if (!state.matrix.isValidCoord(c2))
      throw `LMove: C2 is not a valid coord ${c2.toString()}`;

    state.addVolatileRegion(new Region(c1, c2), true);

    bot.pos = c2;
    state.spendEnergy((this.sld1.getMlen() + 2 + this.sld2.getMlen()) * 2)
  }

  toString(): string {
    return `LMove ${this.sld1.toString()} ${this.sld2.toString()}`;
  }
}

export class FusionP {
  nd: Coord;

  constructor(nd: Coord) {
    if (!nd.isNearCoordDiff())
      throw `Not a nd: ${nd.toString()}`
    this.nd = nd.getCopy();

  }

  run(state: State, bid: number) {
    const bot = state.getBot(bid)
    const c = bot.pos.getAdded(this.nd)
    const botS = state.findBotByCoord(c)
    if (!botS)
      throw `FusionP: not found secondary bot in ${c.toString()}`

    if (state.checkFusionP(bid, botS.bid)) {
      state.addVolatileRegion(new Region(bot.pos, bot.pos));
      state.addVolatileRegion(new Region(c, c));

      state.doFusion(bid, botS.bid)
      state.spendEnergy(24)
    }
  }

  toString(): string {
    return `FusionP ${this.nd.toString()}`
  }

}

export class FusionS {
  nd: Coord;

  constructor(nd: Coord) {
    if (!nd.isNearCoordDiff())
      throw `Not a nd: ${nd.toString()}`
    this.nd = nd.getCopy();

  }

  run(state: State, bid: number) {
    const bot = state.getBot(bid)
    const c = bot.pos.getAdded(this.nd)
    const botP = state.findBotByCoord(c)
    if (!botP)
      throw `FusionS: not found primary bot in ${c.toString()}`

    if (state.checkFusionS(botP.bid, bid)) {
      state.addVolatileRegion(new Region(bot.pos, bot.pos));
      state.addVolatileRegion(new Region(c, c));

      state.doFusion(botP.bid, bid)
      state.spendEnergy(24)
    }
  }

  toString(): string {
    return `FusionS ${this.nd.toString()}`
  }
}

export class Fission {
  nd: Coord;
  m: number;

  constructor(nd: Coord, m: number) {
    if (!nd.isNearCoordDiff())
      throw `Not a nd: ${nd.toString()}`
    this.nd = nd.getCopy();
    this.m = m;
  }

  run(state: State, bid: number) {
    let bot = state.getBot(bid)
    let c = bot.pos.getAdded(this.nd)
    if (!state.matrix.isValidCoord(c))
      throw `Fission: not valid coord ${c.toString()}`

    if(state.matrix.isFilled(c.x, c.y, c.z))
      throw `Fission: voxel is filled ${c.toString()}`

    state.addVolatileRegion(new Region(bot.pos, bot.pos));
    state.addVolatileRegion(new Region(c, c));

    if(this.m + 1 > bot.seeds.length)
      throw `Fission: m exceeds available seeds`


    state.doFission(bid, this.m, c);
    state.spendEnergy(24)

  }

  toString(): string {
    return `Fission ${this.nd.toString()} ${this.m}`
  }
}

export class Fill {
  nd: Coord;

  constructor(nd: Coord) {
    if (!nd.isNearCoordDiff())
      throw `Not a nd: ${nd.toString()}`
    this.nd = nd.getCopy();
  }

  run(state: State, bid: number) {
    let bot = state.getBot(bid)
    let c = bot.pos.getAdded(this.nd)
    if (!state.matrix.isValidCoord(c))
      throw `Fill: not valid coord ${c.toString()}`

    state.addVolatileRegion(new Region(bot.pos, bot.pos));
    state.addVolatileRegion(new Region(c, c));

    /*
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
    */

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
      throw `Not a nd: ${nd.toString()}`
    this.nd = nd.getCopy();
  }

  run(state: State, bid: number) {
    let bot = state.getBot(bid)
    let c = bot.pos.getAdded(this.nd)
    if (!state.matrix.isValidCoord(c))
      throw `Void for not valid coord: ${this.nd.toString()}`

    state.addVolatileRegion(new Region(bot.pos, bot.pos));
    state.addVolatileRegion(new Region(c, c));

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
    if (!nd.isNearCoordDiff())
      throw `Not a nd: ${nd.toString()}`
    this.nd = nd.getCopy();
    this.fd = fd.getCopy();
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
    if (!nd.isNearCoordDiff())
      throw `Not a nd: ${nd.toString()}`
    this.nd = nd.getCopy();
    this.fd = fd.getCopy();
  }

  run(state: State, bid: number) {
    throw "unsupported"
  }

  toString(): string {
    return `GVoid ${this.nd.toString()} ${this.fd.toString()}`
  }

}
