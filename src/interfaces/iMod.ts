import { EModType } from '../enums/eModType';

export default interface IMod {
    type: EModType;
    id: number;
    isActive: boolean;
    name: string;
    updatedAt?: number;
    keys?: string[];
}
