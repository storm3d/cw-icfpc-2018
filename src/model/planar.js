// @flow
import { coord, Coord, Layer, Matrix, Region } from "./model";


export const findCoveringRegion = (plane: Array<Coord>, layer: Layer) : Region | void => {

  const start = plane[0];

  if (!start)
    return;

  let xlen = 1;
  let zlen = 1;
  let x1 = start.x;
  let x2 = start.x;
  let z1 = start.z;
  let z2 = start.z;
  const r = layer.getDimension();

  while (xlen <= 30 && x1 > 0 && layer.isFilled(x1 - 1, z1)) {
    x1--;
    xlen++;
  }

  while (xlen <= 30 && x2 < r - 1 && layer.isFilled(x2 + 1, z1)) {
    x2++;
    xlen++;
  }

  while (zlen <= 30 && z1 > 0 && layer.isXLineFilled(x1, x2, z1 - 1)) {
    z1--;
    zlen++;
  }

  while (zlen <= 30 && z2 < r - 1 && layer.isXLineFilled(x1, x2, z2 + 1)) {
    z2++;
    zlen++;
  }

  return new Region(coord(x1, layer.level, z1), coord(x2, layer.level, z2))
}
