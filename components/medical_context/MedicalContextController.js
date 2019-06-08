import r from 'rethinkdb'
import db from '../../config/database'
import MedicalContext from "./MedicalContext"
import { UserError } from '../../helpers/UserError'

const init = Symbol()
let medical_contexts = Symbol()

let handleChange = Symbol()

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

        r.db(process.env.DB_NAME).table('context').changes()
            .run(connection)
            .then(cursor => cursor.each((e, c) => { if (!e) this[handleChange](c) }))
            .catch(error => console.log(error))
    }

    [handleChange](context) {
        if (context.old_val == null) {
            this[medical_contexts][context.new_val.id] = new MedicalContext(c)
        }
        else if (context.old_val != null && context.new_val != null) {
            var context_instance = this[medical_contexts][context.new_val.id]
            context_instance.setInfo(context.new_val)
        }
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