// @flow
import fs from 'fs'

const traceName = (num: string, prefix: string) => {
    return `${prefix}${num}.nbt`;
};

const energyFileName = (num: string, prefix: string) => {
    return `${prefix}${num}.txt`;
};

function getEnegry(num: string, prefix: string): number {
    const filename = `./energy/${energyFileName(num, prefix)}`;
    try {
        const content = fs.readFileSync(filename).toString();

        return parseInt(content, 10);
    } catch (e) {
        return 0
    }
};

function putEnergy(num: string, energy: number, prefix: string) {
    let filename = `./energy/${energyFileName(num, prefix)}`;
    console.log('save energy');
    fs.writeFile(filename, String(energy), (err) => {
        if (err) {

            throw 'energy folder does not exist'
        }
    });
}

function moreEfective(num: string, energy: number, prefix: string) {
    const currentEnergy = getEnegry(num, prefix);
    if (currentEnergy === 0) {

        return true;
    }

    return energy < currentEnergy;
}

function traceExit(num: string, prefix: string): boolean {
    return fs.existsSync(traceName(num, prefix));
}

const write = (prefix: string, outputFolder: string, num: string, dump: Uint8Array, energy: number) => {

    if (moreEfective(num, energy, prefix) || !traceExit(num, prefix) || prefix === 'FD') {
        console.log(`write ${num} ${prefix} trace`);
        let traceFileName = `./${outputFolder}/${traceName(num, prefix)}`;

        fs.writeFile(traceFileName, Buffer.from(dump), err => {
            if (err) {
                throw err
            } else {
                putEnergy(num, energy, prefix);

                if (process.send !== undefined) {
                    process.send(dump.length);
                }
            }
        });
    } else {
        console.log(`previous trace for ${num} more/same effective`)
    }
};

module.exports = {
    write
};