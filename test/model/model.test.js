import { Coord, Matrix, Bot, State } from "../../src/model/model";

test("Coord", () => {
  const c = new Coord(1, 2, 3);
  expect(c.x).toBe(1);
  expect(c.y).toBe(2);
  expect(c.z).toBe(3);

  const v = new Coord(1, -1, 0);
  c.addVector(v)
  expect(c.x).toBe(2);
  expect(c.y).toBe(1);
  expect(c.z).toBe(3);

  expect(v.getMlen()).toBe(2);
  expect(v.getClen()).toBe(1);

  const c2 = new Coord(3, 1, 3);
  expect(c.getDiff(c2)).toEqual(new Coord(1, 0, 0));
  expect(c.getDiff(c2).getMlen()).toBe(1)
  expect(c.isAdjacent(c2)).toBe(true);

  const c3 = new Coord(4, 1, 3);
  expect(c.isAdjacent(c3)).toBe(false);

  /*
  isShortLinearDiff() {
    return this.isLinearDiff() && this.getMlen() <= 5
  }

  isLongLinearDiff() {
    return this.isLinearDiff() && this.getMlen() <= 15
  }

  isNearCoordDiff() {
    return this.getMlen() <= 2 && this.getClen() == 1
  }
   */

  expect(c3.isLinearDiff()).toBe(false);

  const sld = new Coord(5, 0, 0);
  const lld = new Coord(14, 0, 0);
  const xlld = new Coord(140, 0, 0);

  expect(sld.isShortLinearDiff()).toBe(true);
  expect(lld.isShortLinearDiff()).toBe(false);

  expect(lld.isLongLinearDiff()).toBe(true);
  expect(xlld.isLongLinearDiff()).toBe(false);

  expect(sld.isNearCoordDiff()).toBe(false);

  const nd1 = new Coord(1, 1, 0);
  const nd2 = new Coord(1, 0, 0);
  expect(nd1.isNearCoordDiff()).toBe(true);
  expect(nd2.isNearCoordDiff()).toBe(true);

});

test("Matrix", () => {

  const m = new Matrix(2)

  expect(m.isFilled(0, 0, 0)).toBe(false)

  m.fill(0, 0, 0)
  expect(m.isFilled(0, 0, 0)).toBe(true)

  expect(m.isValidCoord(new Coord(0, 1, 1))).toBe(true)
  expect(m.isValidCoord(new Coord(1, 1, 1))).toBe(true)
  expect(m.isValidCoord(new Coord(-1, 1, 1))).toBe(false)
  expect(m.isValidCoord(new Coord(2, 1, 1))).toBe(false)
});

test("State", () => {

  let matrix = new Matrix(2)
  let bot = new Bot(1, new Coord(0, 0, 0), [...Array(19).keys()].map(x => x+=2))
  let state = new State(matrix, bot)

  expect(state.getBotsNum()).toBe(1)
  expect(state.bots[1].seeds.length).toBe(19)
  expect(state.bots[1].seeds[0]).toBe(2)

});
