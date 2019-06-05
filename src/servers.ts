import * as _ from 'lodash';

export const supportedServers: ISupportedServer[] = [
    {
        executableName: 'arma3server',
        gameAppId: 107410,
        name: 'Arma 3',
        serverAppId: 233780,
    },
];

export interface ISupportedServer {
    gameAppId: number;
    serverAppId: number;
    name: string;
    executableName: string;
}
