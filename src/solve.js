// @flow

import { Bot, Coord, Matrix, State } from "./model/model";
import * as command from "./model/command"
import * as model from "./model/model"
import FloatingVoxels from "./model/floating-voxels";

export default class Solver {

  getSlice(m: Matrix, y: number): Array {

    let slice = []
    for (let z = 0; z < m.r; z++)
      for (let x = 0; x < m.r; x++)
        if (m.isFilled(x, y, z))
          slice.push(new Coord(x, y, z))

    return slice
  }

  getPath(c1: Coord, c2: Coord, isBack = false): Array {
    let cc = c1.getCopy();
    let commands = []

    if (!isBack) {
      while (cc.y !== c2.y) {
        let diff = Math.sign(c2.y - cc.y) * (Math.abs(c2.y - cc.y) > 15 ? 15 : Math.abs(c2.y - cc.y))
        commands.push(new command.SMove(new Coord(0, diff, 0)))
        cc.y += diff
      }
    }

    while (cc.x !== c2.x) {
      let diff = Math.sign(c2.x - cc.x) * (Math.abs(c2.x - cc.x) > 15 ? 15 : Math.abs(c2.x - cc.x))
      commands.push(new command.SMove(new Coord(diff, 0, 0)))
      cc.x += diff
    }

    while (cc.z !== c2.z) {
      let diff = Math.sign(c2.z - cc.z) * (Math.abs(c2.z - cc.z) > 15 ? 15 : Math.abs(c2.z - cc.z))
      commands.push(new command.SMove(new Coord(0, 0, diff)))
      cc.z += diff
    }

    if (isBack) {
      while (cc.y !== c2.y) {
        let diff = Math.sign(c2.y - cc.y) * (Math.abs(c2.y - cc.y) > 15 ? 15 : Math.abs(c2.y - cc.y))
        commands.push(new command.SMove(new Coord(0, diff, 0)))
        cc.y += diff
      }
    }

    return commands
  }


  fillVoxel(c: Coord) {
    let commands = [];

    const botPos = this.state.getBot(1).pos;
    this.floatingVoxels.fill(botPos.getAdded(c));

    if (!this.floatingVoxels.allGrounded() && this.state.harmonics === 0)
      commands.push(new command.Flip());

    commands.push(new command.Fill(c));

    if (this.floatingVoxels.allGrounded() && this.state.harmonics !== 0)
      commands.push(new command.Flip());

    return commands;
  }

  fillSlice(start: Coord, slice: Array, matrix: Matrix) {
    let commands = []
    let cc = start.getCopy();

    let isGrounded = false

    while (1) {

      let bestI = undefined
      let minD = 1255
      for (let i = 0; i < slice.length; i++) {
        if (!slice[i])
          continue
        if (Math.abs(cc.x - slice[i].x) + Math.abs(cc.z - slice[i].z) < minD) {

          //console.log(matrix.isFilled(slice[i].x, slice[i].y - 1, slice[i].z))
          if (isGrounded) {
            bestI = i
            minD = Math.abs(cc.x - slice[i].x) + Math.abs(cc.z - slice[i].z)
          }
          else if (slice[i].y === 0 || matrix.isFilled(slice[i].x, slice[i].y - 1, slice[i].z)) {
            isGrounded = true
            bestI = i
            minD = Math.abs(cc.x - slice[i].x) + Math.abs(cc.z - slice[i].z)
          }
        }
      }

      //console.log(bestI)

      if (bestI === undefined)
        break

      let c = slice[bestI]
      slice[bestI] = undefined
      let botC = c.getAdded(new Coord(0, 1, 0))
      //console.log(botC)

      let path = this.getPath(cc, botC)
      //console.log(path)
      commands = commands.concat(path)
      cc = botC
      commands = commands.concat(this.fillVoxel(new Coord(0, -1, 0)));
    }

    return commands
  };

  solve(targetMatrix: Matrix) {

    let matrix = new Matrix(targetMatrix.r)
    let bot = new Bot(1, new Coord(0, 0, 0), [...Array(19).keys()].map(x => x += 2))

    this.state = new model.State(matrix, bot);
    this.floatingVoxels = new FloatingVoxels(targetMatrix.r);

    let trace = new command.Trace(this.state)

    // trace.execCommand(new command.Flip())

    for (let level = 0; level < matrix.r; level++) {
      let slice = this.getSlice(targetMatrix, level)
      //console.log(slice.length)
      if (slice === [])
        break

      //console.log(state.getBot(1).pos)
      trace.execCommands(this.fillSlice(this.state.getBot(1).pos, slice, targetMatrix))

    }

    let origin = new Coord(0, 0, 0)

    //console.log(this.state.getBot(1).pos)
    trace.execCommands(this.getPath(this.state.getBot(1).pos, origin, true))

    trace.execCommand(new command.Flip())
    trace.execCommand(new command.Halt())

    return trace
  }

}
