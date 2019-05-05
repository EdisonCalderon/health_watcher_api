import r from 'rethinkdb';
import db from '../../config/database';
import Joi from 'joi';
const io = global.io;

const nsp = io.of('/2304')
nsp.on('connection', function (socket) {
    console.log('someone connected');
    //nsp.emit('welcome', [1,2,3,4]);
});

setInterval(()=>{
    nsp.emit('measurement', Math.round(Math.random()*40000));
}, 1000)

let measurement = Joi.object().keys({
    value: Joi.number().min(0).required(),
    timestamp: Joi.number().min(1556826913569).required()
})

let device = Joi.object().keys({
    id: Joi.string().required(),
    measurements: Joi.array().items(measurement)
})

let contextv1 = Joi.object().keys({
    context_id: Joi.string().required(),
    device: device
})

let contextv2 = Joi.object().keys({
    context_id: Joi.string().required(),
    devices: Joi.array().items(device)
})

const reportMeasurements = async (data, version) => {
    try {
        if (version === 1) return Joi.validate(data, contextv1)
        else return Joi.validate(data, contextv2)

    } catch (error) {
        throw error;
    }
}

const getMeasurements = async (data) => {
    try {
        var connection = await db.createConnection();
        return await r.db(process.env.DB_NAME).table('measurement')
            .run(connection)
            .then(cursor => cursor.toArray())
            .then(result => { return result })
            .catch(error => response.send(error))
            .finally(() => { connection.close() })
    } catch (error) {
        throw error;
    }
}

export default { reportMeasurements };