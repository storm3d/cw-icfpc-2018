import fs from "fs";
import { Matrix } from "./model"

export function readModel(file) {

    const data = fs.readFileSync(file)
    const r = data[0]

    let m = new Matrix(r)

    let byteI = 1;
    let bitI = 0;
    for(let x = 0; x < m.r; x++)
      for(let y = 0; y < m.r; y++)
        for(let z = 0; z < m.r; z++) {     
        
          let byte = data[byteI]
          m.set(x, y, z, (byte & (1 << bitI)) === 0 ? 0 : 1);
          bitI++;
          if(bitI > 7) {
            bitI = 0
            byteI++
          }
        }

    return m
}
