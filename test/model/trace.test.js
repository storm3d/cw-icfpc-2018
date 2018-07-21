import { Coord, Matrix, Bot, State } from "../../src/model/model";
import * as trace from "../../src/model/trace";

describe('command ', () => {

  let state

  beforeEach(() => {
    let matrix = new Matrix(2)
    let bot = new Bot(1, new Coord(0, 0, 0), [...Array(19).keys()].map(x => x+=2))
    state = new State(matrix, bot)
  });

  it(" Fill should work", () => {

    const nd = new Coord(1, 0, 0)
    const fill = new trace.Fill(nd)
    fill.run(state, 1)

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
  });

})
