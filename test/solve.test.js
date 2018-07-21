import Solver from "../src/solve";
import { readModel } from "../src/model/reader";

test("solve", () => {
  const m = readModel('./problemsL/LA001_tgt.mdl')

  let solution = new Solver().solve(m)

//  expect(solution.commands.length).toBe(1564)
});
