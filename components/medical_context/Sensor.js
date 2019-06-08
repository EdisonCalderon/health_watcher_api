import r from 'rethinkdb'
import moment from 'moment'
import db from '../../config/database'
import { UserError } from '../../helpers/UserError'

const id = Symbol()
const context = Symbol()
const name = Symbol()
const enabled = Symbol()
const constraints = Symbol()
const lastIncident = Symbol()
const lastNotification = Symbol()
const context_ref = Symbol()

const startSocket = Symbol()
const listenForMeasurements = Symbol()
const handleMeasurement = Symbol()
const handleAlert = Symbol()

class Sensor {
    constructor(info, context_instance) {
        this.setInfo(info)
        this[context_ref] = context_instance
        this[startSocket]()
        this[listenForMeasurements]()
    }

    setInfo(info) {
        this[id] = info.id
        this[context] = info.context
        this[name] = info.name
        this[enabled] = info.enabled
        this[constraints] = info.constraints
        this[lastIncident] = info.lastIncident
        this[lastNotification] = info.lastNotification
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
            .then(cursor => cursor.each((e, m) => { if (!e) this[handleMeasurement](m) }))
            .catch(error => console.log(error))
    }

    [handleMeasurement](measurement) {
        measurement = measurement.new_val
        this.nsp.emit('measurement', measurement)
        const { max, min } = this[constraints] || {}

        if (max != null && !isNaN(+max) && measurement.signal > max) return this[handleAlert]("MAX")
        if (min != null && !isNaN(+min) && measurement.signal < min) return this[handleAlert]("MIN")
    }

    [handleAlert](type) {
        const now = Date.now()
        const last_notification = this[lastNotification]
        this.update({ lastIncident: now })
        if (!last_notification || moment().diff(moment(last_notification).add(5, 'm')) > 0) {
            this.update({ lastNotification: now })
            const complement = (type === 'MAX') ? 'encima' : 'debajo'
            const template = `El sensor ${this[name]} está reportando valores por ${complement} de lo normal`
            this[context_ref].notifyAlert(template)
        }
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

    async update(data) {
        const connection = await db.createConnection();
        return await r.db(process.env.DB_NAME).table('sensor').get(this[id]).update(data)
            .run(connection)
    }
}

export default Sensor