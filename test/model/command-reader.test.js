import { sld, lld, nd, readTrace } from "../../src/model/reader";
import { coord, Coord } from "../../src/model/model";
import { Flip, SMove } from "../../src/model/command";

describe("read command", () => {

  test("read ssd", () => {
    const result: Coord = sld(1, 0);

    expect(result.x).toBe(-5);
    expect(result.y).toBe(0);
    expect(result.z).toBe(0);
  });

  test("read lld", () => {

    const result: Coord = lld(1, 0);

    expect(result.x).toBe(-15);
    expect(result.y).toBe(0);
    expect(result.z).toBe(0);
  });

  test("read nd", () => {

    const result: Coord = nd(21);

    expect(result.x).toBe(1);
    expect(result.y).toBe(0);
    expect(result.z).toBe(-1);
  });

  test("read small trace file", () => {

    const trace = readTrace("./dfltTracesL/LA002.nbt");

    expect(trace.length).toBe(693);

    expect(trace[0]).toEqual(new Flip());
    expect(trace[1]).toEqual(new SMove(coord(0, 0, 1)));
    expect(trace[2]).toEqual(new SMove(coord(0, 0, 1)));
    expect(trace[3]).toEqual(new SMove(coord(0, 0, 1)));
    expect(trace[4]).toEqual(new SMove(coord(0, 0, 1)));
    expect(trace[5]).toEqual(new SMove(coord(0, 0, 1)));
    expect(trace[6]).toEqual(new SMove(coord(0, 0, 1)));
    expect(trace[7]).toEqual(new SMove(coord(0, 0, 1)));
    expect(trace[8]).toEqual(new SMove(coord(0, 1, 0)));
    expect(trace[9]).toEqual(new SMove(coord(1, 0, 0)));

    // for (let i = 0; i < 20; i++)
    //   console.log(trace[i]);
  });
});
