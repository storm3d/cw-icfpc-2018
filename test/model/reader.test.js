import { readModel } from "../../dist/model/reader"

test("readModel first test", () => {
  const modelData = readModel("test/model/LA001_tgt.mdl");
  expect(modelData.r).toBe(20);
});
