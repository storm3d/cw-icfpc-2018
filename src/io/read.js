// @flow
import {readModel} from "../model/reader";
import {Matrix} from "../model/model";

const modelName = (num: string) => {
    return `FA${num}_tgt.mdl`;
};

const read = (inputFolder: string, num: string): Matrix => {
    let modelFileName = `./${inputFolder}/${modelName(num)}`;
    console.log(`read ${num} model`);

    return readModel(modelFileName);
};

module.exports = {
    read
};