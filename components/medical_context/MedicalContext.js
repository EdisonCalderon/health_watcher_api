import r from 'rethinkdb'
import path from 'path'
import db from '../../config/database'
import Sensor from "./Sensor"
import Actuator from "./Actuator"
import { UserError } from '../../helpers/UserError'
import awsIot from 'aws-iot-device-sdk'

const id = Symbol()
const name = Symbol()
const aws = Symbol()
const sensors_list = Symbol()
const actuators_list = Symbol()
const startSocket = Symbol()
const initSensors = Symbol()
const initActuators = Symbol()
const subscribeMQTT = Symbol()

class MedicalContext {
    constructor(info) {
        this[sensors_list] = {}
        this[actuators_list] = {}
        this[id] = info.id
        this[name] = info.name
        this[aws] = info.aws
        this[startSocket]()
        this[subscribeMQTT]()
        this[initSensors]()
        this[initActuators]()
    }

    [startSocket]() {
        const io = global.io
        const nsp = io.of(`/${this[id]}`)
        nsp.on('connection', function (socket) {
            console.log(`someone connected to: ${this[id]}`)
        });
    }

    [subscribeMQTT]() {
        const id_context = this[id];
        const aws_data = this[aws];
        if (!aws_data) return
        
        var device = awsIot.device({
            keyPath: path.join(__dirname, `../../config/certificates/${id_context}/${aws_data.keyPath}`),
            certPath: path.join(__dirname, `../../config/certificates/${id_context}/${aws_data.certPath}`),
            caPath: path.join(__dirname, `../../config/certificates/rootCA.pem`),
            clientId: aws_data.clientId,
            host: aws_data.host
        });

        device.on('connect', function () {
            device.subscribe(`$aws/things/${aws_data.clientId}/shadow/update`);
        });

        device.on('message', function (topic, payload) {
            console.log('message', topic, payload.toString());
        });
    }

    async [initSensors]() {
        const connection = await db.createConnection();
        await r.db(process.env.DB_NAME).table('sensor').getAll(this[id], { index: 'context' })
            .run(connection)
            .then(cursor => cursor.toArray())
            .then(result => { result.map(s => { this[sensors_list][s.id] = new Sensor(s) }) })

        r.db(process.env.DB_NAME).table('sensor').getAll(this[id], { index: 'context' }).changes().filter(r.row('old_val').eq(null))
            .run(connection)
            .then(cursor => cursor.each(s => { this[sensors_list][s.id] = new Sensor(s) }))
            .catch(error => console.log(error))
    }

    async [initActuators]() {
        const connection = await db.createConnection();
        await r.db(process.env.DB_NAME).table('actuator').getAll(this[id], { index: 'context' })
            .run(connection)
            .then(cursor => cursor.toArray())
            .then(result => { result.map(a => { this[actuators_list][a.id] = new Actuator(a) }) })

        r.db(process.env.DB_NAME).table('actuator').getAll(this[id], { index: 'context' }).changes().filter(r.row('old_val').eq(null))
            .run(connection)
            .then(cursor => cursor.each((e, a) => { if (!e) this[actuators_list][a.id] = new Actuator(a) }))
            .catch(error => console.log(error))
    }

    getSensor(id) {
        var ref = this[sensors_list][id];
        if (ref) return ref;
        if (!ref) throw new UserError("Sensor do not exists")
    }

    getActuator(id) {
        var ref = this[actuators_list][id];
        if (ref) return ref;
        if (!ref) throw new UserError("Actuator do not exists")
    }

    getIdentity() {
        return { id: this[id], name: this[name] }
    }

    getContextDetail() {
        let response = this.getIdentity()
        response.sensors = Object.keys(this[sensors_list]).map(x => { return this[sensors_list][x].getIdentity() })
        response.actuators = Object.keys(this[actuators_list]).map(x => { return this[actuators_list][x].getIdentity() })
        return response
    }
}

export default MedicalContext