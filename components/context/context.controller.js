import MedicalContextController from '../medical_context/MedicalContextController'

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

export default { getContextsList, getContextDetail }