import { readModel } from "../../src/model/reader";

test("Coord ctor", () => {

  let m = readModel('./problemsL/LA001_tgt.mdl')
  expect(m.r).toBe(20);
  expect(m.isFilled(0, 0, 0)).toBe(false);

});
