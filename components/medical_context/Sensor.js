import r from 'rethinkdb'
import db from '../../config/database'
import { UserError } from '../../helpers/UserError'

const id = Symbol()
const context = Symbol()
const name = Symbol()
const startSocket = Symbol()
const listenForMeasurements = Symbol()

class Sensor {
    constructor(info) {
        this[id] = info.id
        this[name] = info.name
        this[context] = info.context
        this[startSocket]()
        this[listenForMeasurements]()
    }

    [startSocket]() {
        const _this = this
        const io = global.io
        this.nsp = io.of(`/${this[context]}_${this[id]}`)
        this.nsp.on('connection', function (socket) {
            console.log(`someone connected to: ${_this[context]}_${_this[id]}`)
        });
    }

    async [listenForMeasurements]() {
        const connection = await db.createConnection()
        r.db(process.env.DB_NAME).table('measurement').getAll(this[id], { index: 'sensor' })
            .changes().filter(r.row('old_val').eq(null))
            .run(connection)
            .then(cursor => cursor.each((e, m) => { if (!e) this.nsp.emit('measurement', m.new_val) }))
            .catch(error => console.log(error))
    }

    async addMeasurements(measurements) {
        const _this = this
        try {
            measurements = measurements.map(x => { return { ...x, timestamp: x.timestamp ? x.timestamp : Date.now() } })
            let areValid = measurements.every(x => { return x.signal != undefined && x.timestamp })
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

    getIdentity() {
        return { id: this[id], name: this[name] }
    }
}

export default Sensor