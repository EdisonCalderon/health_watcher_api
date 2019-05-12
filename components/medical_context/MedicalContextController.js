import r from 'rethinkdb'
import db from '../../config/database'
import MedicalContext from "./MedicalContext"
import { UserError } from '../../helpers/UserError'

const init = Symbol()
let medical_contexts = Symbol()

class MedicalContextController {
    constructor() {
        this[medical_contexts] = {}
        this[init]()
    }

    async [init]() {
        const connection = await db.createConnection();
        await r.db(process.env.DB_NAME).table('context')
            .run(connection)
            .then(cursor => cursor.toArray())
            .then(result => { result.map(c => { this[medical_contexts][c.id] = new MedicalContext(c) }) })

        r.db(process.env.DB_NAME).table('context').changes().filter(r.row('old_val').eq(null))
            .run(connection)
            .then(cursor => cursor.each((e, c) => { if (!e) this[medical_contexts][c.id] = new MedicalContext(c) }))
            .catch(error => console.log(error))
    }

    getContext = (id) => {
        var ref = this[medical_contexts][id]
        if (ref) return ref
        if (!ref) throw new UserError("Context do not exists")
    }

    getContextsBasicData = () => {
        return Object.keys(this[medical_contexts]).map(x => { return this[medical_contexts][x].getIdentity() })
    }
}

export default new MedicalContextController()