import { Coord, Matrix, Bot, State } from "../../src/model/model";
import * as trace from "../../src/model/trace";

describe('command ', () => {

  let state

  beforeEach(() => {
    let matrix = new Matrix(20)
    let bot = new Bot(1, new Coord(0, 0, 0), [...Array(19).keys()].map(x => x+=2))
    state = new State(matrix, bot)
  })

  it("Halt should work", () => {
    const halt = new trace.Halt()
    halt.run(state, 1)
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
    expect(state.getBot(1).pos.isEqual(new Coord(4, 0, 0))).toBe(true)
  })

  it("Fill should work", () => {

    const nd = new Coord(1, 0, 0)
    const fill = new trace.Fill(nd)

    expect(state.getEnergy()).toBe(0)
    fill.run(state, 1)
    expect(state.getEnergy()).toBe(12)
    fill.run(state, 1)
    expect(state.getEnergy()).toBe(12+6)

    expect(state.matrix.isFilled(nd)).toBe(true);

    expect(() => {
      const nnd = new Coord(1, 1, 1)
      new trace.Fill(nnd)
    }).toThrow("Not a nd")

    expect(() => {
      const fill2 = new trace.Fill(new Coord(-1, 0, 0))
      fill2.run(state, 1)
    }).toThrowError("Not valid coord")

    expect(() => {
      const fill2 = new trace.Fill(new Coord(1, 0, 0))
      fill2.run(state, 2)
    }).toThrowError("Bot not found")

  })

})
