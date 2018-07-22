import { exec } from "../src";

describe("index test", () => {
  test("smoke", () => {
      exec('problemsF', "solveF", "001");
  })
})
