import { Matrix, State } from "./model/model"
import * as command from "./model/command"

export const solve = (matrix : Matrix) => {
  let trace = new command.Trace()

  trace.addCommand(new command.Halt())

  return trace
}
