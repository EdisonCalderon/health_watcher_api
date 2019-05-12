import Joi from 'joi'
import { UserError } from '../../helpers/UserError'
import MedicalContextController from '../medical_context/MedicalContextController'

import { MeasurementSchemaV1, MeasurementSchemaV2 } from '../../helpers/validators/measurement.validator'

const reportMeasurements = async (data, version) => {
    try {
        var validations = (version === 1) ? Joi.validate(data, MeasurementSchemaV1) : Joi.validate(data, MeasurementSchemaV2)
        if (validations.error) throw new UserError("Ivalid measurements data", validations.error.details)
        var registers = validations.value
        if (version === 1) registers.devices = [registers.device]
        let result = {}
        await Promise.all(registers.devices.map(async (device) => {
            await MedicalContextController
                .getContext(registers.context_id)
                .getSensor(device.id)
                .addMeasurements(device.measurements)
                .then(response => result[device.id] = response)
                .catch(error => result[device.id] = error)
        }))
        return result
    } catch (error) {
        throw error
    }
}

export default { reportMeasurements };