import fs from 'fs'
import {readModel} from "./model/reader"
import {serializeTrace} from "./model/writer";
import MultiSolver from "./multisolver";
import Solver from "./solve";

const modelName = (num: string) => {
    return "FA" + num + "_tgt.mdl";
};

const traceName = (num: string) => {
    return "FA" + num + '.nbt';
};

const exec = (inputFolder: string, outputFolder: string, num: string) => {
    let modelFileName = "./" + inputFolder + "/" + modelName(num);
    //console.log(modelFileName);
    const m = readModel(modelFileName);

    // let solution = new MultiSolver().solve(m);
    let solution = new Solver().solve(m);
    let dump = serializeTrace(solution.commands);

    // console.log(dump)
    let traceFileName = "./" + outputFolder + "/" + traceName(num);
    console.log(traceFileName);
    fs.writeFile(traceFileName, new Buffer(dump), err => {
        if (err) {
            throw err
        } else {
            if (process.send !== undefined) {
                process.send(dump.length);
            }
            return dump.length;
        }
    });

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
