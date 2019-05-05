import { IncomingForm } from 'formidable';
import { UserError } from '../UserError';

/**
 * @description Middleware to get Files in req.files
 */
const interceptFiles = (req, res, next) => {
    const form = new IncomingForm();
    const files = [];
    form
        .parse(req, (err, fields) => {
            if (err) handleError(error);
            else { req.fields = fields; }
        })
        .on('error', (error) => { handleError(error); })
        .on('file', (name, file) => { files.push({ name, file }); })
        .on('end', () => {
            if (files.length === 0) return next(new UserError("No file has been attached"));
            req.files = files;
            return next();
        });

    const handleError = (error) => {
        return next(error);
    }
}

export default { interceptFiles, resolveCustomer };