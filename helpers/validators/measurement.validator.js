import Joi from 'joi'

const measurement = Joi.object().keys({
    signal: Joi.number().min(0).required(),
    value: Joi.number().min(0),
    timestamp: Joi.number().min(1556826913569)
})

const device = Joi.object().keys({
    id: Joi.string().required(),
    measurements: Joi.array().items(measurement)
})

const MeasurementSchemaV1 = Joi.object().keys({
    context_id: Joi.string().required(),
    device: device
})

const MeasurementSchemaV2 = Joi.object().keys({
    context_id: Joi.string().required(),
    devices: Joi.array().items(device)
})

const MeasurementSchemaV3 = Joi.object().keys({
    context_id: Joi.string().required(),
    device: measurement.append({
        id: Joi.string().required()
    })
})

export { MeasurementSchemaV1, MeasurementSchemaV2, MeasurementSchemaV3 }