import Joi from 'joi'
import { UserError } from '../../helpers/UserError'
import MedicalContextController from '../medical_context/MedicalContextController'

import { ContextUpdateSchema } from '../../helpers/validators/context.validator'

const getContextsList = () => {
    return MedicalContextController.getContextsBasicData()
}

const getContextDetail = (context_id) => {
    try {
        return MedicalContextController.getContext(context_id).getContextDetail()
    } catch (error) {
        throw error
    }
}

const updateContext = async (context_id, data) => {
    var validations = Joi.validate(data, ContextUpdateSchema)
    if (validations.error) throw new UserError("Ivalid context data", validations.error.details)
    var context_data = validations.value
    return await MedicalContextController
        .getContext(context_id)
        .update(context_data)
        .then(response => response)
        .catch(error => error)
}

export default { getContextsList, getContextDetail, updateContext }