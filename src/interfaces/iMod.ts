import { EModType } from '../enums/eModType';

export default interface IMod {
    id: number;
    steamId?: number;
    isActive: boolean;
    isLocal: boolean;
    name: string;
    updatedAt?: number;
    keys?: string[];
    type: EModType;
}
