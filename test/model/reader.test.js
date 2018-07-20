import { readModel } from "../../src/model/reader";

test("readModel", () => {

  let m = readModel('./problemsL/LA001_tgt.mdl')
  expect(m.r).toBe(20);

  let fn = 0;
  for(let x = 0; x < m.r; x++)
  	for(let y = 0; y < m.r; y++)
  		for(let z = 0; z < m.r; z++)
  			if(m.isFilled(x, y, z))
  				fn++;

  expect(fn).toBe(511);

});
