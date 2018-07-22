import { readModel } from "../src/model/reader";
import PlanarSolver from "../src/planarsolve";

describe("planar solver", () => {

  test("solve real task", () => {
    const m = readModel('./problemsF/FA003_tgt.mdl')

    let solution = new PlanarSolver().solve(m)

    // console.log(solution.toString());
    // console.log(`Required steps: ${solution.commands.length}, energy: ${solution.state.energy}`);

    // expect(solution.commands.length).toBe(1564)

  })

})
