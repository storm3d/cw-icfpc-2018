import MultiSolver from "../src/multisolver";
import { readModel } from "../src/model/reader";

test("multisolve", () => {
  const m = readModel('./problemsF/FA003_tgt.mdl')

  // let solution = new MultiSolver().solve(m)
  //
  // // console.log(solution.toString());
  // console.log(`Required steps: ${solution.commands.length}, energy: ${solution.state.energy}`);
  //
  // expect(solution.commands.length).toBeGreaterThan(1)

});
