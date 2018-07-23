// @flow
import fs from 'fs'

const traceName = (num: string) => {
    return `FA${num}.nbt`;
};

const energyFileName = (num: string) => {
    return `FA${num}.txt`;
};

function getEnegry(num: string): number {
    const filename = `./energy/${energyFileName(num)}`;
    try {
        const content = fs.readFileSync(filename).toString();

        return parseInt(content, 10);
    } catch (e) {
        return 0
    }
};

function putEnergy(num: string, energy: number) {
    let filename = `./energy/${energyFileName(num)}`;
    console.log('save energy');
    fs.writeFile(filename, String(energy), (err) => {
        if (err) {

            throw 'energy folder does not exist'
        }
    });
}

function moreEfective(num: string, energy: number) {
    const currentEnergy = getEnegry(num);
    if (currentEnergy === 0) {

        return true;
    }

    return energy < currentEnergy;
}

function traceExit(num: string): boolean {
    return fs.existsSync(traceName(num));
}

const write = (outputFolder: string, num: string, dump: Uint8Array, energy: number) => {

    if (moreEfective(num, energy) || !traceExit(num)) {
        console.log(`write ${num} trace`);
        let traceFileName = `./${outputFolder}/${traceName(num)}`;

        fs.writeFile(traceFileName, Buffer.from(dump), err => {
            if (err) {
                throw err
            } else {
                putEnergy(num, energy);

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