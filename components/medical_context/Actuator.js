import r from 'rethinkdb';
import db from '../../config/database';

const id = Symbol()
const context = Symbol()
const name = Symbol()
const enabled = Symbol()
const roles = Symbol()

const context_ref = Symbol()

class Actuator {
    constructor(info, context_instance) {
        this.setInfo(info)
        this[context_ref] = context_instance
    }

    setInfo(info) {
        this[id] = info.id
        this[context] = info.context
        this[name] = info.name
        this[enabled] = info.enabled
        this[roles] = info.roles
    }

    getIdentity() { 
        return { id: this[id], name: this[name] }
    }

    getRoles() {
        return [...this[roles]]
    }

    async update(data) {
        var actionToNotify = (data.enabled) ? 'start' : 'stop'
        this[context_ref].notifyDevice(actionToNotify, this[id])
        const connection = await db.createConnection();
        return await r.db(process.env.DB_NAME).table('actuator').get(this[id]).update(data)
            .run(connection)
    }
}

export default Actuator