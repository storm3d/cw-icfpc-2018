import { Coord, Matrix, Bot, State } from "../../src/model/model";
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

    const voidC = new trace.Void(nd)
    voidC.run(state, 1)

    expect(state.matrix.isFilled(nd.x, nd.y, nd.z)).toBe(false);
  })

  it("Fission should work", () => {
    const nd = new Coord(1, 0, 0)
    const fission = new trace.Fission(nd, 20)
    fission.run(state, 1)
    expect(state.getBotsNum()).toBe(2)
    expect(state.getBot(2).bid).toBe(2)

    expect(state.getBot(1).seeds.length).toBe(18)
    expect(state.getBot(2).seeds.length).toBe(20)
  })

})
