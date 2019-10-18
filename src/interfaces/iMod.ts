import { EModType } from '../enums/eModType';

export default interface IMod {
    type: EModType;
    id: number;
    name: string;
    updatedAt?: Date;
    keys?: string[];
}
