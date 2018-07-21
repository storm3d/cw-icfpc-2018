import fs from "fs";
import { Coord, Matrix } from "./model";
import * as trace from "../../src/model/trace";

export function readModel(file) {
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

export function readTrace(file) {
  const data = fs.readFileSync(file);

  // TODO: error handling for invalid cases ?
  const llda = function(bits){ return bits & 3;};
  const lldi = function(bits){ return (bits & 15) - 5;};
  const slda = function(bits){ return bits & 3;};
  const sldi = function(bits){ return (bits & 31) - 15;};
  const ai2C = function(a, i) {
    if (a == 1) {return new Coord(i,0,0);}
    if (a == 2) {return new Coord(0,i,0);}
    if (a == 3) {return new Coord(0,0,i);}
        };
  const nd2C = function(bits){
      const n = bits & 31;
      const dz = (n % 3) - 1;
      const nz = (n - (dz + 1)) / 3; // n w/o z
      const dy = (nz % 3) - 1;
      const nyz = (nz - (dy + 1)) / 3; // n w/o y&z
      const dx = nyz - 1;
      return new Coord(dx, dy, dz);
  };
  
  const t = new trace.Trace();
  for (let i = 0; i < data.length; i++) {
    if (data[i] == 255) {
      t.commands.push(new trace.Halt());
    }else if (data[i] == 254) {
      t.commands.push(new trace.Wait());
    }else if (data[i] == 253) {
      t.commands.push(new trace.Flip());
    }else if (data[i] & 0xf == 4)
    {
      const a = llda(data[i] >> 4);
      i++;
      const i = lldi(data[i]);
      const c = ai2C(a, i);
      t.commands.push(new trace.SMove(c));
    }else if (data[i] & 0xf == 6)
    {
      const a1 = slda(data[i] >> 4);
      const a2 = slda(data[i] >> 6);
      i++;
      const i1 = sldi(data[i]);
      const i2 = sldi(data[i] >> 4);
      const c1 = ai2C(a1, i1);
      const c2 = ai2C(a2, i1);
      t.commands.push(new trace.LMove(c1, c2));
    }
    else if (data[i] & 0x7 == 7)
    {
      const c = nd2C(data[i] >> 3);
      //t.commands.push(new trace.FusionP(c));
    }
    else if (data[i] & 0x7 == 6)
    {
      const c = nd2C(data[i] >> 3);
      //t.commands.push(new trace.FusionS(c));
    }
    else if (data[i] & 0x7 == 5)
    {
      const c = nd2C(data[i] >> 3);
      i++;
      const m = data[i];
      t.commands.push(new trace.Fission(c, m));
    }
    else if (data[i] & 0x7 == 3)
    {
      const c = nd2C(data[i] >> 3);
      t.commands.push(new trace.Fill(c));
    }
  }

  return t;
}