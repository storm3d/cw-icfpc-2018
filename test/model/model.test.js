import { Coord, Matrix, Bot, State } from "../../src/model/model";

test("Coord ctor", () => {
  const c = new Coord(1, 2, 3);
  expect(c.x).toBe(1);
  expect(c.y).toBe(2);
  expect(c.z).toBe(3);

  const v = new Coord(1, -1, 0);
  c.addVector(v)
  expect(c.x).toBe(2);
  expect(c.y).toBe(1);
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
  let bot = new Bot(1, new Coord(0, 0, 0), [...Array(19).keys()].map(x => x+=2))
  let state = new State(matrix, bot)

  expect(state.getBotsNum()).toBe(1)
  expect(state.bots[1].seeds.length).toBe(19)
  expect(state.bots[1].seeds[0]).toBe(2)

});
