import {cpus} from "os";
import child_process from 'child_process'

function formatNum(num, size = 2) {
    let s = String(num);
    while (s.length < (size || 2)) {
        s = "0" + s;
    }
    return s;
}

const launch = () => {
    let numCPUs = cpus().length;
    console.log('Before fork');

    let models = Array.from({length: 186}, (v, k) => k + 1);

    for (let i = 0; i < numCPUs; i++) {
        let worker = child_process.fork("./dist/index.js");
        worker.send('ask');
        worker.on('message', (msg) => {
            console.log('Message from child', msg);
            if (models.length > 0) {
                let model = models.pop();
                worker.send(formatNum(model, 3));
            } else {
                worker.send('kill');
            }
        });
    }
    console.log('After fork')
};

const launcher = () => {
    launch();
};

launcher();

module.exports = {
    launch
};
