// @flow
import fs from 'fs'
import {solve} from "./solve"
import {readModel} from "./model/reader"
import {serializeTrace} from "./model/writer";

const modelName = (num: string) => {
    return "LA" + num + "_tgt.mdl";
};

const traceName = (num: string) => {
    return "LA" + num + '.nbt';
};

const exec = (inputFolder: string, outputFolder: string, num: string) => {
    let modelFileName = "./" + inputFolder + "/" + modelName(num);
    // console.log(modelFileName);
    const m = readModel(modelFileName);

    let solution = solve(m);
    let dump = serializeTrace(solution.commands);

    // console.log(dump)

    // TODO: now write the solution

    let traceFileName = "./" + outputFolder + "/" + traceName(num);
    // console.log(traceFileName);
    fs.writeFile(traceFileName, dump, err => {
            if (err) {
                console.log(err);
            }

            // console.log("The file was saved!")
        }
    )

};

if (process.argv.length > 2 && process.argv[2] !== "--watchAll") {
    exec(process.argv[2], process.argv[3], process.argv[4])
} else {
    exec('problemsL', "solve", "001");
}



module.exports = {
    exec
};
