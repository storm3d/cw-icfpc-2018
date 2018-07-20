// matrix
// state (energy, harmonics, matrix, bots, trace)
// bot (bid, pos, seeds)

// coord


class Coord {
    constructor() {
        this.x = 0;
        this.y = 0;
        this.z = 0;
    }

    constructor(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;
    }
}

class Matrix {
    constructor(r) {
        this.r = r;
        this._buffer = new ArrayBuffer(r * 3);
        this.voxels = new Uint8Array(this._buffer);
    }

    fill(x, y, z) {
        this.voxels[this.coord2index(x, y, z)] = 1;
    }

    clear(x, y, z) {
        this.voxels[this.coord2index(x, y, z)] = 0;
    }

    isFilled(x, y, z) {
        return this.voxels[this.coord2index(x, y, z)] > 0;
    }

    coord2index(x, y, z) {
        return x + this.r * y + this.r * this.r * z;
    }
}

class Bot {
    constructor(bid) {
        this.bid = bid;
        this.pos = new Coord();
        this.seeds = [];
    }
}

class State {
    constructor(matrix, bot) {
        this.energy = 0;
        this.harmonics = 0;
        this.matrix = matrix;
        this.bots = [bot];
    }
}

export {
    Coord, Matrix, Bot, State
}