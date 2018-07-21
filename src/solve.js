import { Bot, Coord, Matrix, State } from "./model/model";
import * as command from "./model/command"
import * as model from "./model/model"

const getSlice = (m: Matrix, y: number) => {

  let slice = []
  for (let z = 0; z < m.r; z++)
      for (let x = 0; x < m.r; x++)
      if (m.isFilled(x, y, z))
        slice.push(new Coord(x, y, z))

  return slice
}

const getPath = (c1: Coord, c2: Coord) => {
  return []
}

const fillSlice = (c: Coord, slice : Array) => {
  return []
}

const solve = (targetMatrix : Matrix) => {

  let matrix = new Matrix(targetMatrix.r)
  let bot = new Bot(1, new Coord(0, 0, 0), [...Array(19).keys()].map(x => x+=2))
  let state = new model.State(matrix, bot)
  let trace = new command.Trace(state)

  trace.execCommand(new command.Flip())

  for(let level = 0; level < matrix.r; level++) {
    let slice = getSlice(targetMatrix, level)
    //console.log(slice.length)
    if(slice === [])
      break

    trace.execCommands(fillSlice(state.getBot(1).pos, slice))
  }

  let origin = new Coord(0, 0, 0)
  trace.execCommands(getPath(state.getBot(1).pos, origin))

  trace.execCommand(new command.Flip())
  trace.execCommand(new command.Halt())

  return trace
}

export {
  solve
}
