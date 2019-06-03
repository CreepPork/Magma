import * as _ from 'lodash';

export const supportedServers: ISupportedServer[] = [
    {
        executableName: 'arma3server',
        gameAppId: 107410,
        name: 'Arma 3',
        serverAppId: 233780,
    },
];

export function getGame(gameAppId: number): ISupportedServer {
    return _.find(supportedServers, { gameAppId }) as ISupportedServer;
}

export interface ISupportedServer {
    gameAppId: number;
    serverAppId: number;
    name: string;
    executableName: string;
}
