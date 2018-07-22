// @flow

import { clamp, coord, Coord, Matrix } from "../model/model";
import * as command from "../model/command";
import { Void } from "../model/command";

export function move(from: Coord, to: Coord, matrix: Matrix) {

  if (from.getDiff(to).getMlen() === 0)
    return;

  const move = freeMove(from, to, matrix);

  if (move)
    return move;

  const diff = from.getDiff(to);

  if (Math.abs(diff.x) > Math.abs(diff.y) && Math.abs(diff.x) > Math.abs(diff.z))
    return new Void(coord(Math.sign(diff.x), 0, 0));
  else if (Math.abs(diff.y) > Math.abs(diff.z))
    return new Void(coord(0, Math.sign(diff.x), 0));
  else
    return new Void(coord(0, 0, Math.sign(diff.z)));
}

export function freeMove(from: Coord, to: Coord, matrix: Matrix) {

  const diff = from.getDiff(to);

  const maxLd = 3;
  const maxSd = 1;

  let xlld = clamp(diff.x, maxLd);
  let ylld = clamp(diff.y, maxLd);
  let zlld = clamp(diff.z, maxLd);

  xlld = xClamp2Wall(xlld, from, matrix)
  ylld = yClamp2Wall(ylld, from, matrix)
  zlld = zClamp2Wall(zlld, from, matrix)

  const moves = [];

  if (xlld != 0) moves.push(new command.SMove(coord(xlld, 0, 0)));
  if (ylld != 0) moves.push(new command.SMove(coord(0, ylld, 0)));
  if (zlld != 0) moves.push(new command.SMove(coord(0, 0, zlld)));

  const xsld = clamp(xlld, maxSd);
  const ysld = clamp(ylld, maxSd);
  const zsld = clamp(zlld, maxSd);

  if (xsld != 0 && ysld != 0) {
    let y = yClamp2Wall(clamp(diff.y, maxSd), from.getAdded(coord(xsld, 0, 0)), matrix);
    if (y != 0)
      moves.push(new command.LMove(coord(xsld, 0, 0), coord(0, y, 0)));

    let x = xClamp2Wall(clamp(diff.x, maxSd), from.getAdded(coord(0, ysld, 0)), matrix)
    if (x!=0)
      moves.push(new command.LMove(coord(0, ysld, 0), coord(x, 0, 0)));
  }

  if (xsld != 0 && zsld != 0) {
    let z = zClamp2Wall(clamp(diff.z, maxSd), from.getAdded(coord(xsld, 0, 0)), matrix);
    if (z != 0)
      moves.push(new command.LMove(coord(xsld, 0, 0), coord(0, 0, z)));

    let x = xClamp2Wall(clamp(diff.x, maxSd), from.getAdded(coord(0, 0, zsld)), matrix)
    if (x!=0)
      moves.push(new command.LMove(coord(0, 0, zsld), coord(x, 0, 0)));
  }

  if (ysld != 0 && zsld != 0) {
    let z = zClamp2Wall(clamp(diff.z, maxSd), from.getAdded(coord(0, ysld, 0)), matrix);
    if (z != 0)
      moves.push(new command.LMove(coord(0, ysld, 0), coord(0, 0, z)));

    let y = yClamp2Wall(clamp(diff.y, maxSd), from.getAdded(coord(0, 0, zsld)), matrix);
    if (y != 0)
      moves.push(new command.LMove(coord(0, 0, zsld), coord(0, y, 0)));
  }

  if (moves.length === 0)
    return;

  let best = moves[0];
  let bestMlen = best.mlen();

  for (let k = 1; k < moves.length; k++) {
    const mlen = moves[k].mlen();
    if (mlen > bestMlen) {
      bestMlen = mlen;
      best = moves[k];
    }
  }

  return best;
}

function xClamp2Wall(d: number, from: Coord, matrix: Matrix) {
  const sign = Math.sign(d);
  let i = 1;
  while (i <= Math.abs(d) && !matrix.isFilled(from.x + sign * i, from.y, from.z))
    i++;
  return sign * (i - 1);
}

function yClamp2Wall(d: number, from: Coord, matrix: Matrix) {
  const sign = Math.sign(d);
  let i = 1;
  while (i <= Math.abs(d) && !matrix.isFilled(from.x, from.y + sign * i, from.z))
    i++;
  return sign * (i - 1);
}

function zClamp2Wall(d: number, from: Coord, matrix: Matrix) {
  const sign = Math.sign(d);
  let i = 1;
  while (i <= Math.abs(d) && !matrix.isFilled(from.x, from.y, from.z + sign * i))
    i++;
  return sign * (i - 1);
}
