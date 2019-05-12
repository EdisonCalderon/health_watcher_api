import r from 'rethinkdb'
import db from '../../config/database'

const id = Symbol()
const context = Symbol()
const name = Symbol()
const startSocket = Symbol()

class Sensor {
    constructor(info) {
        this[id] = info.id
        this[name] = info.name
        this[context] = info.context
        this[startSocket]()
    }

    [startSocket]() {
        const _this = this
        const io = global.io
        this.nsp = io.of(`/${this[context]}_${this[id]}`)
        this.nsp.on('connection', function (socket) {
            console.log(`someone connected to: ${_this[context]}_${_this[id]}`)
        });
    }

    addMeasurement(measurements) {
        const _this = this
        try {
            let areValid = measurements.every(x => { return x.sensor = _this.id && x.measurements != undefined && x.timestamp })
            if (!areValid) throw new Error('There are invalid measurements')
            return await r.db(process.env.DB_NAME).table('measurement')
                .run(connection)
                .then(result => { return result })
                .catch(error => { throw error })
                .finally(() => { connection.close() })
        } catch (error) {
            throw error;
        }
    }
}

export default Sensor