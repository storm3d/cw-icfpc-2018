import { solve } from "../src/solve";
import { readModel } from "../src/model/reader";

test("solve", () => {
  const m = readModel('./problemsL/LA001_tgt.mdl')

  let solution = solve(m)

  expect(solution.commands.length).toBe(1)
});
