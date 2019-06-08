import * as fs from 'fs-extra';

import { ISteamAcf } from '../interfaces/steamAcf';

export default class SteamAcf {
    public static acfToJson(file: string): ISteamAcf {
        const text = fs.readFileSync(file).toString();

        const oneLiner = text.replace(/(\s+)/g, '');
        const withColons = oneLiner.replace(/("[a-z|A-Z]\w+")|(}"\d+")|({"\d+")/g, '$&:');
        const withCommas = withColons.replace(/("\w+":"\w+")/g, '$&,');
        const withoutTrailingComma = withCommas.replace(/\,(?!\s*?[\{\[\"\'\w])/g, '');
        const withCommasForObjects = withoutTrailingComma.replace(/(}")/g, '},"');
        const encapsulateObject = '{' + withCommasForObjects + '}';

        return JSON.parse(encapsulateObject);
    }
}
