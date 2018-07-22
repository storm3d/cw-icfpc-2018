import Solver from "../src/solve";
import { readModel } from "../src/model/reader";
import { LMove } from "../src/model/command";
import { coord, Matrix } from "../src/model/model";

describe("solver", () => {

  test("getPath returns LMove", () => {

    const m = new Matrix(10)
    const solver = new Solver(m)

    solver.getPath(coord(0,0,0), coord(3, 0, 4), 1)

    expect(solver.trace.commands).toEqual(expect.arrayContaining([new LMove(coord(3, 0, 0), coord(0, 0, 4))]))

  })

  test("solve real task", () => {
    const m = readModel('./problemsL/LA001_tgt.mdl')

    let solution = new Solver().solve(m)

    // console.log(solution.toString());
    //console.log(`Required steps: ${solution.commands.length}, energy: ${solution.state.energy}`);

    // expect(solution.commands.length).toBe(1564)

  })

})
