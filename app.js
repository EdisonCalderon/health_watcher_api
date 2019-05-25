import express from 'express';
import path from 'path';
import cookieParser from 'cookie-parser';
import log4js from 'log4js';
import passport from "passport";
import cors from 'cors';

import router from './config/routes';
import passport_init from './config/passport';

import { UserError } from './helpers/UserError';

passport_init.init();
const app = express();

app.use(log4js.connectLogger(log4js.getLogger("http"), { level: 'auto' }));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(passport.initialize());
app.use(passport.session());

app.use(cors())

app.use('/', router);

const log = log4js.getLogger("app");
app.use((err, req, res, next) => {
    if (err instanceof UserError) {
        res.status(400).send({ error: err.message, details: err.details });
    } else {
        log.error(err);
        res.status(500).send({ error: err.message });
    }
})

export default app;