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


    const c = new Coord(1, 0, 0)
    const fill = new trace.Fill(c)
    fill.run(state, 1)

    expect(state.matrix.isFilled(c)).toBe(true);

  });

})
