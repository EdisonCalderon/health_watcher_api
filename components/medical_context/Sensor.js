import r from 'rethinkdb'
import db from '../../config/database'
import { UserError } from '../../helpers/UserError'

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

    async addMeasurements(measurements) {
        const _this = this
        try {
            let areValid = measurements.every(x => { return x.value != undefined && x.timestamp })
            if (!areValid) throw new UserError('There are invalid measurements')
            measurements.map(x => x.sensor = _this[id])
            const connection = await db.createConnection();
            return await r.db(process.env.DB_NAME).table('measurement').insert(measurements)
                .run(connection)
                .then(result => { return result.inserted })
                .catch(error => { throw error })
                .finally(() => { connection.close() })
        } catch (error) {
            throw error
        }
    }
}

export default Sensor