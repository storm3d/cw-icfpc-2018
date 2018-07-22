const express = require('express');
const app = express();
const port = 3001;
const path  = require('path');

const tracePath = 'solveF/FA003.nbt';
const modelPath = 'problemsF/FA003_tgt.mdl';

app.get('/trace', (request, response) => {
  response.sendFile(path.join(process.cwd(), tracePath));
});
app.get('/model', (request, response) => {
  response.sendFile(path.join(process.cwd(), modelPath));
});

app.get('/assets/:filename', (request, response) => {
  response.sendFile(path.join(process.cwd(), 'visualizer/' + request.url));
});
app.get('/', (request, response) => {
  response.sendFile(path.join(process.cwd(), 'visualizer/executer.html'));
});


app.listen(port, (err) => {
  if (err) {
    return console.log('something bad happened', err)
  }

  console.log(`server is listening on ${port}`)
})
