// @flow
import fs from 'fs'
import {readModel} from "./model/reader"
import {serializeTrace} from "./model/writer";
import Solver from "./solve";

const modelName = (num: string) => {
    return "LA" + num + "_tgt.mdl";
};

const traceName = (num: string) => {
    return "LA" + num + '.nbt';
};

const exec = (inputFolder: string, outputFolder: string, num: string) => {
    let modelFileName = "./" + inputFolder + "/" + modelName(num);
    console.log(modelFileName);
    const m = readModel(modelFileName);

    let solution = new Solver().solve(m);
    let dump = serializeTrace(solution.commands);

    // console.log(dump)

    // TODO: now write the solution

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

if (process.send !== undefined) {
    exec('problemsL', "solve", "001");
}

process.on('message', (msg) => {
    if (msg === 'kill') {
        process.exit(0);
    } else if (msg === 'ask') {
        if (process.send !== undefined) {
            process.send('message');
        }
    } else {
        exec('problemsL', 'solve', msg);
    }
});

module.exports = {
    exec
};
