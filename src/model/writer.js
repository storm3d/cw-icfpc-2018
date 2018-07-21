// @flow

import { Fill, Fission, Flip, FusionP, FusionS, Halt, LMove, SMove, Wait, Void, GFill, GVoid } from "./command";
import { Coord } from "./model";


const serSld: { axis: number, i: number } = (c: Coord) => {
  if (c.getMlen(c) > 5)
    throw `invalid short linear distance ${c}`;

  if (c.x !== 0 && c.y === 0 && c.z === 0)
    return { axis: 1, i: c.x + 5 };

  if (c.x === 0 && c.y !== 0 && c.z === 0)
    return { axis: 2, i: c.y + 5 };

  if (c.x === 0 && c.y === 0 && c.z !== 0)
    return { axis: 3, i: c.z + 5 };

  throw `invalid short linear distance ${c}`;
};

const serLld: { axis: number, i: number } = (c: Coord) => {
  if (c.getMlen(c) > 15)
    throw `invalid long linear distance ${c}`;

  if (c.x !== 0 && c.y === 0 && c.z === 0)
    return { axis: 1, i: c.x + 15 };

  if (c.x === 0 && c.y !== 0 && c.z === 0)
    return { axis: 2, i: c.y + 15 };

  if (c.x === 0 && c.y === 0 && c.z !== 0)
    return { axis: 3, i: c.z + 15 };

  throw `invalid long linear distance ${c}`;
};

const serFd: [ number ] = (c: Coord) => {
  if (c.x > 30 || c.x < -30)
    throw `invalid far distance x : ${c.x}`;
  if (c.y > 30 || c.y < -30)
    throw `invalid far distance y : ${c.y}`;
  if (c.z > 30 || c.z < -30)
    throw `invalid far distance z : ${c.z}`;

  return [c.x + 30, c.y + 30, c.z + 30];
};

const serNd: number = (c: Coord) => {
  const mlen = c.getMlen();
  if (mlen === 0 || mlen > 2)
    throw `invalid near coordinate difference ${c}`;

  return (c.x + 1) * 9 + (c.y + 1) * 3 + c.z + 1;
};

export const serializeTrace = (trace: [Any]) => {

  const buffer = new Uint8Array(trace.length * 3);

  let pos = 0;
  let k = 0;

  while (pos < trace.length) {

    const command = trace[pos++];

    if (command instanceof Halt)
      buffer[k++] = 0b11111111;
    else if (command instanceof Wait)
      buffer[k++] = 0b11111110;
    else if (command instanceof Flip)
      buffer[k++] = 0b11111101;
    else if (command instanceof SMove) {
      const lldParts = serLld(command.lld);
      const b1 = (lldParts.axis << 4) + 0b0100;
      const b2 = lldParts.i;
      buffer[k++] = b1;
      buffer[k++] = b2;
    }
    else if (command instanceof LMove) {
      const sld1 = serSld(command.sld1);
      const sld2 = serSld(command.sld2);
      const b1 = (sld2.axis << 6) + (sld1.axis << 4) + 0b1100;
      const b2 = (sld2.i << 4) + sld1.i;
      buffer[k++] = b1;
      buffer[k++] = b2;
    }
    else if (command instanceof FusionP)
      buffer[k++] = (serNd(command.nd) << 3) + 0b111;
    else if (command instanceof FusionS)
      buffer[k++] = (serNd(command.nd) << 3) + 0b110;
    else if (command instanceof Fission) {
      buffer[k++] = (serNd(command.nd) << 3) + 0b101;
      buffer[k++] = command.m;
    }
    else if (command instanceof Fill)
      buffer[k++] = (serNd(command.nd) << 3) + 0b011;
    else if (command instanceof Void)
      buffer[k++] = (serNd(command.nd) << 3) + 0b010;
    else if (command instanceof GFill) {
      buffer[k++] = (serNd(command.nd) << 3) + 0b001;
      const sfd = serFd(command.fd);
      buffer[k++] = sfd[0];
      buffer[k++] = sfd[1];
      buffer[k++] = sfd[2];
    }
    else if (command instanceof GVoid) {
      buffer[k++] = (serNd(command.nd) << 3) + 0b000;
      const sfd = serFd(command.fd);
      buffer[k++] = sfd[0];
      buffer[k++] = sfd[1];
      buffer[k++] = sfd[2];
    }
  }

  return buffer.slice(0, k);
};
