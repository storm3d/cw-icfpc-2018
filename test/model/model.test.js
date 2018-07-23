import { Coord, Matrix, Bot, State, Region } from "../../src/model/model";
import assert from 'assert';

test("Coord", () => {
  let c = new Coord(1, 2, 3);
  expect(c.x).toBe(1);
  expect(c.y).toBe(2);
  expect(c.z).toBe(3);

  const v = new Coord(1, -1, 0);
  c = c.getAdded(v)
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

  expect(m.isFilled(1, 1, 1)).toBe(false)

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

  expect(state.energy).toBe(0)
  state.doEnergyTick()
  expect(state.energy).toBe(8*3+20)
  state.harmonics = 1
  state.doEnergyTick()
  expect(state.energy).toBe(8*3+20 + 8*30+20)

});

test("Region", () => {

  let r1 = new Region(new Coord(0, 1, 0), new Coord(1, 1, 0));
  let r2 = new Region(new Coord(1, 1, 0), new Coord(2, 1, 0));
  expect(r1.isIntersects(r2)).toBe(true);

  let region1 = new Region(new Coord(0, 1, 1), new Coord(0, 1, 2));
  let region2 = new Region(new Coord(3, 1, 1), new Coord(5, 1, 1));
  let region3 = new Region(new Coord(4, 1, 1), new Coord(4, 1, 2));
  let region4 = new Region(new Coord(4, 1, 1), new Coord(4, 1, 2));
  let region5 = new Region(new Coord(5, 4, 3), new Coord(3, 2, 1));
  let region6 = new Region(new Coord(3, 2, 1), new Coord(5, 4, 3));
  let region7 = new Region(new Coord(3, 2, 1), new Coord(3, 4, 3));

  assert.deepEqual(region3, region4);

  expect(region1.isEqual(region4)).toBe(false);
  expect(region3.isEqual(region4)).toBe(true);
  expect(region5.isEqual(region6)).toBe(true);
  expect(region1.getDim()).toBe(1);
  expect(region2.getDim()).toBe(1);
  expect(region3.getDim()).toBe(1);
  expect(region4.getDim()).toBe(1);
  expect(region5.getDim()).toBe(3);
  expect(region6.getDim()).toBe(3);
  expect(region7.getDim()).toBe(2);

  expect(region1.isIntersects(region2)).toBe(false);
  expect(region2.isIntersects(region3)).toBe(true);

  let matrix = new Matrix(2)
  let bot = new Bot(1, new Coord(0, 0, 0), [...Array(19).keys()].map(x => x+=2))
  let state = new State(matrix, bot)
  state.addVolatileRegion(region1);
  assert.deepEqual(state.volatile[0], region1);

  state.doEnergyTick();
  //assert.deepEqual(state.volatile, []);
});

test("fission", () => {
  let matrix = new Matrix(2)
  let bot = new Bot(1, new Coord(0, 0, 0), [...Array(2).keys()].map(x => x += 10))
  let state = new State(matrix, bot)
  state.doFission(1, 0, new Coord(0, 1, 0))

  expect(state.bots[10]).not.toBeUndefined()
  expect(state.bots[1].seeds).toEqual(expect.arrayContaining([11]))
});
