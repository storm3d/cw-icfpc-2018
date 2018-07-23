// @flow
import {readModel} from "../model/reader";
import {Matrix} from "../model/model";

const modelName = (num: string, prefix: string, target: string) => {
    return `${prefix}${num}_${target}.mdl`;
};

const read = (inputFolder: string, num: string, prefix: string, target: string): Matrix => {
    let modelFileName = `./${inputFolder}/${modelName(num, prefix, target)}`;
    console.log(`read ${num} ${prefix} model`);

    return readModel(modelFileName);
};

module.exports = {
    read
};