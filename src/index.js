// @flow
import {serializeTrace} from "./model/writer";
import {read} from './io/read'
import {write} from './io/write'
import MultiSolver from "./multisolver";
import Solver from "./solve";

const exec = (inputFolder: string, outputFolder: string, num: string) => {

    let m = read(inputFolder, num, 'FA', 'tgt');
    // let solution = new MultiSolver().solve(m);
    let solver = new Solver();
    let solution = solver.solve(m);
    let dump = serializeTrace(solution.commands);
    write('FA', outputFolder, num, dump, solution.state.energy);

    m = read(inputFolder, num, 'FD', 'src');
    // let solution = new MultiSolver().solve(m);
    solver = new Solver();
    solution = solver.solve(m);
    let revertCommands = solver.revert();
    dump = serializeTrace(revertCommands);
    write('FD', outputFolder, num, dump, solution.state.energy)
};

if (process.send === undefined) {
    exec('problemsF', "solveF", "010");
}

process.on('message', (msg) => {
    if (msg === 'kill') {
        process.exit(0);
    } else if (msg === 'ask') {
        if (process.send !== undefined) {
            process.send('message');
        }
    } else {
        exec('problemsF', 'solveF', msg);
    }
});

module.exports = {
    exec
};
