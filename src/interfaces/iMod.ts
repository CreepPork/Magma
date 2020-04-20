import { EModType } from '../enums/eModType';

export default interface IMod {
    id: number;
    steamId?: number;
    isActive: boolean;
    name: string;
    updatedAt?: number;
    keys?: string[];
    type: EModType;
}
