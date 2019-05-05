import { UserError } from '../UserError';

const parseQuery = (data, options) => {
    if (!options || !options.paramType) throw new UserError("Unsupported field to parse");
    switch (options.paramType) {
        case 'filtered':
            return parseFilters(data, options);
        case 'sorted':
            return parseSorts(data);
        case 'page':
        case 'pageSize':
            return parsePagging(data);
        default:
            throw new UserError("Unsupported field to parse");
    }
}

const parsePagging = (number) => {
    if (!number) return 0;
    const response = parseInt(number);
    if (Number.isNaN(response)) throw new UserError("Error parsing page or pageSize");
    else return response;
}

const parseFilters = (filter, options) => {
    if (filter == undefined) return {};
    try {
        let isObject = typeof filter === 'object';
        const filter_copy = (isObject) ? filter : JSON.parse(filter);
        if (!filter_copy || filter_copy.length == 0) return {};
        let filters = {};
        filter_copy.map((x) => {
            isObject = typeof x === 'object';
            x = (isObject) ? x : JSON.parse(x);
            const customFormat = (options && options.customFormat) ? options.customFormat[x.id] : null;
            const fallTo = (customFormat === 'number') ? 0 : (customFormat === 'boolean') ? 1 : (customFormat === 'string') ? 2 : null;
            if (['number', 'boolean'].includes(typeof x.value)) filters[x.id] = x.value;
            else {
                let clean_text = x.value.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&").split('').join(' *');
                let value_numeric = parseFloat(clean_text);
                if (!isNaN(value_numeric) && [null, 0].includes(fallTo)) filters[x.id] = value_numeric;
                else {
                    let value_boolean = (x.value.toLowerCase() === 'true') ? true : (x.value.toLowerCase() === 'false') ? false : null;
                    if (value_boolean !== null && [null, 1].includes(fallTo)) filters[x.id] = value_boolean;
                    else filters[x.id] = new RegExp(clean_text, 'gi');
                }
            }
        });
        return filters;
    } catch (error) {
        throw new UserError('Error parsing Filters');
    }
}

const parseSorts = (sort) => {
    if (sort == undefined) return {};
    try {
        let isObject = typeof sort === 'object';
        const sort_copy = (isObject) ? sort : JSON.parse(sort);
        if (!sort_copy || sort_copy.length == 0) return {};
        let sorts = {};
        sort_copy.map((x) => {
            isObject = typeof x === 'object';
            x = (isObject) ? x : JSON.parse(x);
            sorts[x.id] = (x.desc) ? -1 : 1;
        });
        return sorts;
    } catch (error) {
        throw new UserError('Error parsing Sorts');
    }
}

export default { parseQuery };