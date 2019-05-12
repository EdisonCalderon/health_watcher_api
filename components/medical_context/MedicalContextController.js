import r from 'rethinkdb';
import db from '../../config/database';
import MedicalContext from "./MedicalContext";

const init = Symbol();
let medical_contexts = Symbol();

class MedicalContextController {
    constructor() {
        this[medical_contexts] = {};
        this[init]();
    }

    async [init]() {
        const connection = await db.createConnection();
        await r.db(process.env.DB_NAME).table('context')
            .run(connection)
            .then(cursor => cursor.toArray())
            .then(result => { result.map(c => { this[medical_contexts][c.id] = new MedicalContext(c) }) })

        r.db(process.env.DB_NAME).table('context').changes().filter(r.row('old_val').eq(null))
            .run(connection)
            .then(cursor => cursor.each(c => { this[medical_contexts][c.id] = new MedicalContext(c) }))
            .catch(error => console.log(error))
    }

    getContext = (id) => {
        var ref = this[medical_contexts][id];
        if (ref) return ref;
        if (!ref) throw new Error("Context do not exists");
    }
}

export default new MedicalContextController()