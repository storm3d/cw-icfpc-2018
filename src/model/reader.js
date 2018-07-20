import { fs } from "fs";
import { Matrix } from "./model"

export function readModel(file) {

    const data = fs.readFileSync(file);
    const r = data[0];

    const matrix = new Matrix(r);

    // n = x × R × R + y × R + z
    // n = i * 8 + [0..7]

    // z = n % r
    // y = (n - z) / r % r
    // x = (n - z - y) / r * r

    for (var i = 0; i < r * r * r / 8; i++)
    {
        var num = data[i + 1];
        setVoxel(matrix, r, num, i, 0);
        setVoxel(matrix, r, num, i, 1);
        setVoxel(matrix, r, num, i, 2);
        setVoxel(matrix, r, num, i, 3);
        setVoxel(matrix, r, num, i, 4);
        setVoxel(matrix, r, num, i, 5);
        setVoxel(matrix, r, num, i, 6);
        setVoxel(matrix, r, num, i, 7);
    }

}

function setVoxel(matrix: Matrix, r, num, byte, bit) {

  if (!bitTest(num, bit))
    return;

  const n = byte * 8 + bit;
  const z = n % r;
  const y = (n - z) / r % r;
  const x = (n - z - y) / r / r;

  if (x < r && y < r && z < r)
    matrix.fill(x, y, z);
}

function bitTest(num, bit) {
    ((num >> bit) % 2 != 0)
}
