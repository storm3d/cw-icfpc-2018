import { coord, Layer, Matrix, parselayer, parsematrix, Region } from "../../src/model/model";
import { freeMove } from "../../src/model/move";
import { LMove, SMove } from "../../src/model/command";

describe("free move", () => {

  test("empty layer", () => {

    const area = `
        . . . . . . .
        . . . . . . .
        . . . . . . .
        . . . . . . .
        . . . . . . .
        . . . . . . .
        . . . . . . .`
    const matrix = parsematrix(area, 0)

    expect(freeMove(coord(0, 0, 0), coord(1, 0, 7), matrix))
      .toEqual(new SMove(coord(0, 0, 7)))

    expect(freeMove(coord(1, 0, 7), coord(0, 0, 0), matrix))
      .toEqual(new SMove(coord(0, 0, -7)))

    expect(freeMove(coord(0, 0, 0), coord(3, 0, 7), matrix))
      .toEqual(new LMove(coord(3, 0, 0), coord(0, 0, 5)))
  })

  test("filled layer", () => {

    const area = `
        . . x . . . .
        . . x . . . .
        . . . . . . .
        . . . . . . .
        . . . . . . .
        . . . . . . .
        . . . . . . .`
    const matrix = parsematrix(area, 0)

    expect(freeMove(coord(0, 0, 0), coord(7, 0, 3), matrix))
      .toEqual(new LMove(coord(0, 0, 3), coord(5, 0, 0)))

    expect(freeMove(coord(7, 0, 3), coord(0, 0, 0), matrix))
      .toEqual(new SMove(coord(-7, 0, 0)))

    expect(freeMove(coord(0, 0, 0), coord(3, 0, 1), matrix))
      .toEqual(new LMove(coord(1, 0, 0), coord(0, 0, 1)))
  })

})
