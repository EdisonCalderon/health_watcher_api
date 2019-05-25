'use strict';
import r from 'rethinkdb'


var config = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || '28015',
    db: process.env.DB_NAME || 'health_watcher'
}

const createConnection = async () => {
    return new Promise((resolve, reject) => {
        let count = 0;
        (function _connect() {
            r.connect(config, (error, connection) => {
                if (error && error.name === 'ReqlDriverError' && error.message.indexOf('Could not connect') === 0 && ++count < 31) {
                    console.log(error);
                    setTimeout(_connect, 1000);
                    return;
                }
                if (connection) return resolve(connection);
                return reject(null);
            });
        })();
    });
}


export default { createConnection };