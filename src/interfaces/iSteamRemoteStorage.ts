import ISteamPublishedFile from './iSteamPublishedFile';

export default interface ISteamRemoteStorage {
    response: {
        result: number;
        resultcount: number;
        publishedfiledetails: ISteamPublishedFile[];
    };
}
