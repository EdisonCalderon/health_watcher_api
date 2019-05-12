import Joi from 'joi';

const measurement = Joi.object().keys({
    value: Joi.number().min(0).required(),
    timestamp: Joi.number().min(1556826913569).required()
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

export { MeasurementSchemaV1, MeasurementSchemaV2 };