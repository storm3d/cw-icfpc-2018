// @flow

import { solve } from "./solve.js"
import { readModel } from "./model/reader"

const exec = () => {
  const m = readModel('./problemsL/LA001_tgt.mdl')

  let solution = solve(m)

  // TODO: now write the solution
};

exec();

module.exports = {
  exec
}
