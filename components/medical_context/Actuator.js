import r from 'rethinkdb';
import db from '../../config/database';

const id = Symbol()
const context = Symbol()
const name = Symbol()

class Actuator {
    constructor(info) {
        this.setInfo(info)
    }

    setInfo(info) {
        this[id] = info.id
        this[name] = info.name
        this[context] = info.context
    }

    getIdentity() { 
        return { id: this[id], name: this[name] }
    }
}

export default Actuator