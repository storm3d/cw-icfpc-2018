import { coord, Layer, Matrix, parselayer, Region } from "../../src/model/model";
import { findCoveringRegion } from "../../src/model/planar";

describe("planar calculations", () => {

  test("empty region", () => {

    const area = `
        . . . . . . .
        . . . . . . .
        . . . . . . .
        . . . . . . .
        . . . . . . .
        . . . . . . .
        . . . . . . .`
    const layer = parselayer(area, 5)

    const region = findCoveringRegion(layer.getFilledVoxels(), layer)

    expect(region).toBeUndefined()
  })

  test("find region", () => {

    const area = `
        . . . . . . .
        . . . . . . .
        . . x x . . .
        . . x x x . .
        . . x x . . .
        . . . . . . .
        . . . . . . .`
    const layer = parselayer(area, 5)

    const region = findCoveringRegion(layer.getFilledVoxels(), layer)

    expect(region).toEqual(new Region(coord(2, 5, 2), coord(3, 5, 4)))
  })

})
