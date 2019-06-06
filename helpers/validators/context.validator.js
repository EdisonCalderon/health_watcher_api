import Joi from 'joi'

const ContextUpdateSchema = Joi.object().keys({
    enabled: Joi.bool().required()
})

export { ContextUpdateSchema }