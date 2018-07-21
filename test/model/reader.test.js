import { readModel } from "../../src/model/reader";

test("readModel", () => {
  const m = readModel("./problemsL/LA001_tgt.mdl");
  expect(m.r).toBe(20);

  expect(m.isFilled(0, 0, 0)).toBe(false);
  expect(m.isFilled(10, 0, 10)).toBe(true);
  expect(m.isFilled(10, 5, 10)).toBe(true);
  expect(m.isFilled(10, 6, 10)).toBe(false);

  let fn = 0;
  for (let z = 0; z < m.r; z++)
    for (let y = 0; y < m.r; y++)
      for (let x = 0; x < m.r; x++) if (m.isFilled(x, y, z)) fn++;

  expect(fn).toBe(511);
});
