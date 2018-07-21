import { Coord, Matrix, Bot, State } from "../../src/model/model";

test("Coord ctor", () => {
  const c = new Coord(1, 2, 3);

  expect(c.x).toBe(1);
  expect(c.y).toBe(2);
  expect(c.z).toBe(3);

});

test("Matrix", () => {

  const m = new Matrix(2)

  expect(m.isFilled(0, 0, 0)).toBe(false)

  m.fill(0, 0, 0)
  expect(m.isFilled(0, 0, 0)).toBe(true)

});

test("State", () => {

  let matrix = new Matrix(2)
  let bot = new Bot(1, new Coord(0, 0, 0), [...Array(10).keys()].map(x => x++))
  let state = new State(matrix, bot)



});
