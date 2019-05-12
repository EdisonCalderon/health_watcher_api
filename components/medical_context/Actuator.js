import r from 'rethinkdb';
import db from '../../config/database';

const id = Symbol()
const context = Symbol()
const name = Symbol()

class Actuator {
    constructor(info, context_ref) {
        this[id] = info.id;
        this[name] = info.name;
        this[context] = context_ref;     
    }
}

export default Actuator