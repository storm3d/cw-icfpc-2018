// @flow
import {serializeTrace} from "./model/writer";
import {read} from './io/read'
import {write} from './io/write'
import MultiSolver from "./multisolver";
import Solver from "./solve";

const exec = (inputFolder: string, outputFolder: string, num: string) => {

    const m = read(inputFolder, num);

    // let solution = new MultiSolver().solve(m);
    let solution = new Solver().solve(m);
    let dump = serializeTrace(solution.commands);

    write(outputFolder, num, dump, solution.state.energy)
};

if (process.send === undefined) {
    exec('problemsF', "solveF", "001");
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
