import fs from "fs";
import { Matrix, Coord, coord } from "./model";
import { Fill, Fission, Flip, FusionP, FusionS, Halt, LMove, SMove, Wait } from "./command";

export function readModel(file): Matrix {
  const data = fs.readFileSync(file);
  const r = data[0];

  const m = new Matrix(r);

  let byteI = 1;
  let bitI = 0;
  for (let x = 0; x < m.r; x++)
    for (let y = 0; y < m.r; y++)
      for (let z = 0; z < m.r; z++) {
        const byte = data[byteI];
        m.set(x, y, z, (byte & (1 << bitI)) === 0 ? 0 : 1);
        bitI++;
        if (bitI > 7) {
          bitI = 0;
          byteI++;
        }
      }

  return m;
}

export const sld: Coord = (axis: number, i: number) => {
  const d = i - 5;

  if (d === 0 || d > 5 || d < -5)
    throw `invalid coordinate difference ${d} for short linear distance for integer ${i}`;

  switch (axis) {
    case 0b01:
      return coord(d, 0, 0);
    case 0b10:
      return coord(0, d, 0);
    case 0b11:
      return coord(0, 0, d);
    default:
      throw `invalid axis for short linear distance for axis ${axis}`;
  }
};

export const lld: Coord = (axis: number, i: number) => {
  const d = i - 15;

  if (d === 0 || d > 15 || d < -15)
    throw `invalid coordinate difference ${d} for long linear distance for integer ${i}`;

  switch (axis) {
    case 0b01:
      return coord(d, 0, 0);
    case 0b10:
      return coord(0, d, 0);
    case 0b11:
      return coord(0, 0, d);
    default:
      throw `invalid axis for short linear distance for axis ${axis}`;
  }
};

export const nd: Coord = (byte: number) => {
  const dx = Math.floor(byte / 9) - 1;
  const dy = Math.floor((byte - (dx + 1) * 9) / 3) - 1;
  const dz = byte - ((dx + 1) * 9 + (dy + 1) * 3) - 1;

  const mlen = Math.abs(dx) + Math.abs(dy) + Math.abs(dz);
  if (mlen < 1 || mlen > 2)
    throw `Invalid near coordinate distance encoded in byte ${byte}`;

  return coord(dx, dy, dz);
};
export const fd: Coord = (byte0: number, byte1: number, byte2: number) => {
  if (byte0 > (30 + 30))
    throw `Invalid far coordinate distance encoded in byte ${byte0}`;
  if (byte1 > (30 + 30))
    throw `Invalid far coordinate distance encoded in byte ${byte1}`;
  if (byte2 > (30 + 30))
    throw `Invalid far coordinate distance encoded in byte ${byte2}`;

  const dx = byte0 - 30;
  const dy = byte1 - 30;
  const dz = byte2 - 30;
  return coord(dx, dy, dz);
};

export const readTrace: [Any] = (file) => {

  const data = fs.readFileSync(file);

  let pos = 0;
  const commands = [];

  while (pos < data.length) {
    const b1 = data[pos++];

    if (b1 === 0b11111111)
      commands.push(new Halt());
    else if (b1 === 0b11111110)
      commands.push(new Wait());
    else if (b1 === 0b11111101)
      commands.push(new Flip());
    else if ((b1 & 0b00001111)=== 0b0100) {
      const axis = (b1 & 0b00110000) >> 4;
      const d = data[pos++] & 0b00011111;
      commands.push(new SMove(lld(axis, d)));
    }
    else if ((b1 & 0b00001111)=== 0b1100) {
      const axis1 = (b1 & 0b00110000) >> 4;
      const axis2 = (b1 & 0b11000000) >> 6;
      const b2: number = data[pos++];
      const d1 = b2 & 0b00001111;
      const d2 = (b2 & 0b11110000) >> 4;
      commands.push(new LMove(sld(axis1, d1), sld(axis2, d2)));
    }
    else if ((b1 & 0b00000111) === 0b0111)
      commands.push(new FusionP(nd((b1 & 0b11111000) >> 3)));
    else if ((b1 & 0b00000111) === 0b110)
      commands.push(new FusionS(nd((b1 & 0b11111000) >> 3)));
    else if ((b1 & 0b00000111) === 0b101) {
      const ncd: Coord = nd((b1 & 0b11111000) >> 3);
      const m = data[pos++];
      commands.push(new Fission(ncd, m));
    }
    else if ((b1 & 0b00000111) === 0b011)
      commands.push(new Fill(nd((b1 & 0b11111000) >> 3)));
    else if ((b1 & 0b00000111) === 0b010)
      commands.push(new Void(nd((b1 & 0b11111000) >> 3)));
    else if ((b1 & 0b00000111) === 0b001) {
      const b2: number = data[pos++];
      const b3: number = data[pos++];
      const b4: number = data[pos++];
      const ncd: Coord = nd((b1 & 0b11111000) >> 3);
      const fcd: Coord = fd (b2, b3, b4);
      commands.push(new GFill(ncd, fcd));
    }
    else if ((b1 & 0b00000111) === 0b000) {
      const b2: number = data[pos++];
      const b3: number = data[pos++];
      const b4: number = data[pos++];
      const ncd: Coord = nd((b1 & 0b11111000) >> 3);
      const fcd: Coord = fd (b2, b3, b4);
      commands.push(new GVoid(ncd, fcd));
    }

  }
  return commands;
};
