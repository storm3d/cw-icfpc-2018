import { fs } from "fs";
import { Matrix } from "./model"

function readModel(file) {

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
        setVoxel(matrix, num, i * 8, 0);
        setVoxel(matrix, num, i * 8, 1);
        setVoxel(matrix, num, i * 8, 2);
        setVoxel(matrix, num, i * 8, 3);
        setVoxel(matrix, num, i * 8, 4);
        setVoxel(matrix, num, i * 8, 5);
        setVoxel(matrix, num, i * 8, 6);
        setVoxel(matrix, num, i * 8, 7);
    }

}

function setVoxel(matrix, num, n, bit) {
    const z = n ;
}

function bitTest(num, bit) {
    ((num >> bit) % 2 != 0)
}
