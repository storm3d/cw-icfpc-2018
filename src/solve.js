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

const getPath = (c1: Coord, c2: Coord, isBack = false) => {
  let cc = c1.getCopy();
  let commands = []

  if(!isBack) {
    while (cc.y !== c2.y) {
      commands.push(new command.SMove(new Coord(0, Math.sign(c2.y - cc.y), 0)))
      cc.y += Math.sign(c2.y - cc.y)
    }
  }

  while(cc.x !== c2.x) {
    commands.push(new command.SMove(new Coord(Math.sign(c2.x - cc.x), 0, 0)))
    cc.x += Math.sign(c2.x - cc.x)
  }

  while(cc.z !== c2.z) {
    commands.push(new command.SMove(new Coord(0, 0, Math.sign(c2.z - cc.z))))
    cc.z += Math.sign(c2.z - cc.z)
  }

  if(isBack) {
    while (cc.y !== c2.y) {
      commands.push(new command.SMove(new Coord(0, Math.sign(c2.y - cc.y), 0)))
      cc.y += Math.sign(c2.y - cc.y)
    }
  }

  return commands
}

const fillSlice = (start: Coord, slice : Array) => {
  let commands = []
  let cc = start.getCopy();

  while(1) {

    let bestI = undefined
    let minD = 1255
    for (let i = 0; i < slice.length; i++) {
      if (!slice[i])
        continue
      if (Math.abs(cc.x - slice[i].x) + Math.abs(cc.z - slice[i].z) < minD) {
        bestI = i
        minD = Math.abs(cc.x - slice[i].x) + Math.abs(cc.z - slice[i].z)
      }
    }

    //console.log(bestI)

    if(bestI === undefined)
      break

    let c = slice[bestI]
    slice[bestI] = undefined
    let botC = c.getAdded(new Coord(0, 1, 0))
    //console.log(botC)

    let path = getPath(cc, botC)
    //console.log(path)
    commands = commands.concat(path)
    cc = botC
    commands.push(new command.Fill(new Coord(0, -1, 0)))
  }

  return commands
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

    //console.log(state.getBot(1).pos)
    trace.execCommands(fillSlice(state.getBot(1).pos, slice))

  }

  let origin = new Coord(0, 0, 0)

  //console.log(state.getBot(1).pos)
  trace.execCommands(getPath(state.getBot(1).pos, origin, true))

  trace.execCommand(new command.Flip())
  trace.execCommand(new command.Halt())

  return trace
}

export {
  solve
}
