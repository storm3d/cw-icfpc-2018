import { Coord, Matrix } from "../../src/model/model";

test("Coord ctor", () => {
  const c = new Coord(1, 2, 3);

  expect(c.x).toBe(1);
  expect(c.y).toBe(2);
  expect(c.z).toBe(3);
  
});
