import fs from "fs";
import { readTrace } from "../../src/model/reader";
import { serializeTrace } from "../../src/model/writer";

describe("write command", () => {

  test("read-write trace", () => {

    const file = "./dfltTracesL/LA002.nbt";
    const trace = readTrace(file);
    const dump = serializeTrace(trace);

    expect(dump).toEqual(Uint8Array.from(fs.readFileSync(file)));
  });

  test("read-write full trace", () => {

    const file = "./dfltTracesF/FA001.nbt";
    const trace = readTrace(file);
    const dump = serializeTrace(trace);

    expect(dump).toEqual(Uint8Array.from(fs.readFileSync(file)));
  });

});
