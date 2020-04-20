import IConfig from './iConfig';

export default interface IConfigEntry {
    displayName: string;
    config: keyof IConfig
    condition?: () => boolean,
}
