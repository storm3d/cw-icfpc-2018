import { Coord, Matrix, Bot, State, coord } from "../../src/model/model";
import * as trace from "../../src/model/command";

describe('command ', () => {

  let state

  beforeEach(() => {
    let matrix = new Matrix(20)
    let bot = new Bot(1, new Coord(0, 0, 0), [...Array(39).keys()].map(x => x+=2))
    state = new State(matrix, bot)
  })

  it("Halt should work", () => {
    const halt = new trace.Halt()
    halt.run(state, 1)
    expect(state.getBotsNum()).toBe(1)
  })

  it("Halt when harmonics not equal to 0", ()=>{
    const halt = new trace.Halt()
    const flip = new trace.Flip()
    flip.run(state, 1)
    state.volatile = []
    expect(()=>{
      halt.run(state, 1)

    }).toThrow("Not low harmonics")
  })

  it("Flip should work", () => {
    expect(state.harmonics).toBe(0)
    const flip = new trace.Flip()
    flip.run(state, 1)
    expect(state.harmonics).toBe(1)
  })

  it("SMove should work", () => {

    expect(state.getEnergy()).toBe(0)
    const lld = new Coord(2, 0, 0)
    const sm = new trace.SMove(lld)
    sm.run(state, 1)
    expect(state.getBot(1).pos.isEqual(lld)).toBe(true)

    expect(lld.getMlen()).toBe(2)
    expect(state.getEnergy()).toBe(4)

    state.volatile = []
    sm.run(state, 1)
    expect(state.getBot(1).pos.isEqual(lld)).toBe(false)
    expect(state.getBot(1).pos).toEqual(new Coord(4, 0, 0))
  })

  it("LMove should work", () => {
    expect(state.getEnergy()).toBe(0)
    const sld1 = new Coord(2, 0, 0)
    const sld2 = new Coord(0, 2, 0)
    const final = new Coord(2, 2, 0)
    const lm = new trace.LMove(sld1, sld2)
    lm.run(state, 1)
    expect(state.getBot(1).pos).toEqual(final)

    expect(state.getEnergy()).toBe(12)
  })

  it("Fill should work", () => {

    const nd2 = new Coord(10, 10, 10)
    expect(state.matrix.isFilled(nd2)).toBe(false);

    const nd = new Coord(1, 0, 0)
    const fill = new trace.Fill(nd)

    expect(state.getEnergy()).toBe(0)
    fill.run(state, 1)
    expect(state.matrix.isFilled(nd2)).toBe(false);

    state.volatile = []
    expect(state.getEnergy()).toBe(12)
    fill.run(state, 1)
    expect(state.getEnergy()).toBe(12+6)

    expect(state.matrix.isFilled(nd.x, nd.y, nd.z)).toBe(true);

    expect(() => {
      const nnd = new Coord(1, 1, 1)
      new trace.Fill(nnd)
    }).toThrow("Not a nd")

    expect(() => {
      const fill2 = new trace.Fill(new Coord(-1, 0, 0))
      fill2.run(state, 1)
    }).toThrowError("Fill: not valid coord <-1,0,0>")

    expect(() => {
      const fill2 = new trace.Fill(new Coord(1, 0, 0))
      fill2.run(state, 2)
    }).toThrowError("Bot not found")

  })

  it("Void should work", () => {

    const nd = new Coord(1, 0, 0)
    const fill = new trace.Fill(nd)

    expect(state.getEnergy()).toBe(0)
    fill.run(state, 1)
    expect(state.getEnergy()).toBe(12)
    expect(state.matrix.isFilled(nd.x, nd.y, nd.z)).toBe(true);

    state.volatile = []
    const voidC = new trace.Void(nd)
    voidC.run(state, 1)

    expect(state.matrix.isFilled(nd.x, nd.y, nd.z)).toBe(false);
  })

  it("Fission and Fusions should work", () => {
    const nd = new Coord(1, 0, 0)
    const fission = new trace.Fission(nd, 20)
    fission.run(state, 1)
    state.doEnergyTick()
    expect(state.getBotsNum()).toBe(2)
    expect(state.getBot(2).bid).toBe(2)

    expect(state.getBot(1).seeds.length).toBe(18)
    expect(state.getBot(2).seeds.length).toBe(20)
    expect(state.getBot(1).seeds[0]).toBe(23)
    expect(state.getBot(1).seeds[17]).toBe(40)
    expect(state.getBot(2).seeds[0]).toBe(3)
    expect(state.getBot(2).seeds[19]).toBe(22)

    const nd2 = new Coord(-1, 0, 0)
    const fusionP = new trace.FusionP(nd)
    const fusionS = new trace.FusionS(nd2)
    fusionP.run(state, 1)
    fusionS.run(state, 2)
    expect(state.getBotsNum()).toBe(1)
    expect(state.getBot(1).seeds.length).toBe(39)
    expect(state.getBot(1).seeds).toEqual([...Array(39).keys()].map(x => x += 2))

    state.doEnergyTick()
    fission.run(state, 1)
    state.doEnergyTick()
    const fission2 = new trace.Fission(nd, 2)
    fission2.run(state, 2)
    state.doEnergyTick()
    fusionS.run(state, 3)
    fusionP.run(state, 1)
    expect(()=> {
      state.doEnergyTick()
    }).toThrowError("unmatched fusions: [<1,t:p,n:2>,<3,t:s,n:2>]")

    const fusionP2 = new trace.FusionP(nd2)
    const fusionS2 = new trace.FusionS(nd)
    state.fusions={}
    fusionS2.run(state, 1)
    fusionP2.run(state, 2)
    state.doEnergyTick()
    fusionP2.run(state, 3)
    fusionS2.run(state, 2)
    state.doEnergyTick()
    expect(state.getBot(3).seeds).toEqual([1,2].concat([...Array(37).keys()].map(x => x += 4)))
})

  it("GFill & GVoid should work", () => {
    const nd = new Coord(1, 0, 0)
    const fission = new trace.Fission(nd, 20)
    fission.run(state, 1)
    state.doEnergyTick()

    const smove = new trace.SMove(coord(5,0,0))
    smove.run(state, 2)
    expect(state.getBot(2).pos).toEqual(coord(6, 0, 0))
    state.doEnergyTick()

    const gfill1 = new trace.GFill(coord(0, 1, 0), coord(6, 0, 0))
    const gfill2 = new trace.GFill(coord(0, 1, 0), coord(-6, 0, 0))
    gfill1.run(state, 1)
    gfill2.run(state, 2)
    state.doEnergyTick()
    expect(state.matrix.isFilled(0, 1, 0)).toBe(true);
    expect(state.matrix.isFilled(1, 1, 0)).toBe(true);
    expect(state.matrix.isFilled(2, 1, 0)).toBe(true);
    expect(state.matrix.isFilled(3, 1, 0)).toBe(true);
    expect(state.matrix.isFilled(4, 1, 0)).toBe(true);
    expect(state.matrix.isFilled(5, 1, 0)).toBe(true);
    expect(state.matrix.isFilled(6, 1, 0)).toBe(true);

    const gvoid1 = new trace.GVoid(coord(0, 1, 0), coord(6, 0, 0))
    const gvoid2 = new trace.GVoid(coord(0, 1, 0), coord(-6, 0, 0))
    gvoid1.run(state, 1)
    gvoid2.run(state, 2)
    state.doEnergyTick()
    expect(state.matrix.isFilled(0, 1, 0)).toBe(false);
    expect(state.matrix.isFilled(1, 1, 0)).toBe(false);
    expect(state.matrix.isFilled(2, 1, 0)).toBe(false);
    expect(state.matrix.isFilled(3, 1, 0)).toBe(false);
    expect(state.matrix.isFilled(4, 1, 0)).toBe(false);
    expect(state.matrix.isFilled(5, 1, 0)).toBe(false);
    expect(state.matrix.isFilled(6, 1, 0)).toBe(false);

    expect(()=> {
      gfill1.run(state, 1)
      state.doEnergyTick()
    }).toThrowError("unmatched GFills: [{r:[<0,1,0>,<6,1,0>],ids:[1],coords:[<0,1,0>]]")
    state.groupFills = []

    expect(()=> {
      gvoid1.run(state, 2)
      state.doEnergyTick()
    }).toThrowError("unmatched GVoids: [{r:[<6,1,0>,<12,1,0>],ids:[2],coords:[<6,1,0>]]")
    state.groupVoids = []
})

})
