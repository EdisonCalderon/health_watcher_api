import r from 'rethinkdb'
import path from 'path'
import Joi from 'joi'
import awsIot from 'aws-iot-device-sdk'
import db from '../../config/database'
import Sensor from "./Sensor"
import Actuator from "./Actuator"
import { UserError } from '../../helpers/UserError'

import { MeasurementSchemaV3 } from '../../helpers/validators/measurement.validator'

const id = Symbol()
const name = Symbol()
const aws = Symbol()
const enabled = Symbol()
const sensors_list = Symbol()
const actuators_list = Symbol()
const device = Symbol()

const startSocket = Symbol()
const initSensors = Symbol()
const initActuators = Symbol()
const subscribeMQTT = Symbol()
const handleError = Symbol()
const handleChange = Symbol()

class MedicalContext {
    constructor(info) {
        this[sensors_list] = {}
        this[actuators_list] = {}
        this.setInfo(info)
        this[startSocket]()
        this[subscribeMQTT]()
        this[initSensors]()
        this[initActuators]()
    }

    setInfo(info) {
        this[id] = info.id
        this[name] = info.name
        this[aws] = info.aws
        this[enabled] = info.enabled
    }

    [startSocket]() {
        const io = global.io
        const nsp = io.of(`/${this[id]}`)
        nsp.on('connection', function (socket) {
            console.log(`someone connected to: ${this[id]}`)
        });
    }

    [subscribeMQTT]() {
        const _this = this
        const id_context = this[id];
        const aws_data = this[aws];
        if (!aws_data) return

        var device_iot = awsIot.device({
            keyPath: path.join(__dirname, `../../config/certificates/${id_context}/${aws_data.keyPath}`),
            certPath: path.join(__dirname, `../../config/certificates/${id_context}/${aws_data.certPath}`),
            caPath: path.join(__dirname, `../../config/certificates/rootCA.pem`),
            clientId: require('uuid/v4')(),
            host: aws_data.host
        });

        this[device] = device_iot

        device_iot.on('connect', function () {
            device_iot.subscribe(`${aws_data.clientId}/out`);
        });

        device_iot.on('disconnected', function () {
            console.log('disconnected')
        });

        device_iot.on('disconnect', function () {
            console.log('disconnect')
        });

        device_iot.on('message', function (topic, payload) {
            payload = JSON.parse(payload.toString())
            var validations = Joi.validate(payload, MeasurementSchemaV3)
            if (validations.error) return _this[handleError]('Invalid Data', { type: 'sensor', id: payload.device.id })
            var register = validations.value
            var { signal, id } = register.device
            _this.getSensor(id)
                .addMeasurements([{ signal }])
                .catch(error => _this[handleError]('Invalid Data', { type: 'sensor', id }, error))
        });

        device_iot.on('error', (error) => {
            console.log(`[Context: ${id_context}] Error cliente MQTT`)
        })
    }

    async notifyDevice(action, object_id) {
        if (!this[aws]) return
        const type = (object_id === this[id]) ? 'context' :
            (Object.keys(this[actuators_list]).includes(object_id)) ? 'actuator' :
                (Object.keys(this[sensors_list]).includes(object_id)) ? 'sensor' : null
        if (!type) throw new UserError("Sensor do not exists")
        const payload = {
            object: type,
            identifier: (type !== 'context') ? object_id : undefined,
            action
        }
        const topic = `${this[aws].clientId}/in`
        this[device].publish(topic, JSON.stringify(payload))
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

    [handleChange](device_payload, group) {
        const device_group = (group == 'sensors') ? sensors_list : actuators_list
        const device_class = (group == 'sensors') ? Sensor : Actuator
        if (device_payload.old_val == null) {
            this[device_group][device_payload.new_val.id] = new device_class(c)
        }
        else if (device_payload.old_val != null && device_payload.new_val != null) {
            var device_instance = this[device_group][device_payload.new_val.id]
            device_instance.setInfo(device_payload.new_val)
        }
    }

    [handleError](error, device, err) {
        console.log(`[Device: ${device}] Error en mediciones`, error, err)
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
        return { id: this[id], name: this[name], aws: this[aws], enabled: this[enabled] }
    }

    getContextDetail() {
        let response = this.getIdentity()
        response.sensors = Object.keys(this[sensors_list]).map(x => { return this[sensors_list][x].getIdentity() })
        response.actuators = Object.keys(this[actuators_list]).map(x => { return this[actuators_list][x].getIdentity() })
        return response
    }

    async update(data) {
        var actionToNotify = (data.enabled) ? 'start' : 'stop'
        this.notifyDevice(actionToNotify, this[id])
        const connection = await db.createConnection();
        return await r.db(process.env.DB_NAME).table('context').get(this[id]).update(data)
            .run(connection)
    }
}

export default MedicalContext