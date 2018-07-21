import { Matrix } from "../../src/model/model";
import FloatingVoxels from "../../src/model/floating-voxels";

describe("floating voxels", () => {

  test("fill grounded", () => {

    const r: number = 10;

    const matrix = new Matrix(r);
    const floating = new FloatingVoxels(r);

    expect(floating.allGrounded()).toBe(true);

    matrix.fill(5, 1, 5);
    floating.fill(5, 1, 5, matrix);
    expect(floating.allGrounded()).toBe(false);

    matrix.fill(5, 0, 5);
    floating.fill(5, 0, 5, matrix);
    expect(floating.allGrounded()).toBe(true);

  });

  test("union grounded and not grounded", () => {

    const r: number = 10;

    const matrix = new Matrix(r);
    const floating = new FloatingVoxels(r);

    matrix.fill(5, 0, 5);
    floating.fill(5, 0, 5, matrix);

    matrix.fill(5, 1, 5);
    floating.fill(5, 1, 5, matrix);

    matrix.fill(7, 1, 5);
    floating.fill(7, 1, 5, matrix);

    expect(floating.allGrounded()).toBe(false);

    matrix.fill(6, 1, 5);
    floating.fill(6, 1, 5, matrix);
    expect(floating.allGrounded()).toBe(true);

  });

});
