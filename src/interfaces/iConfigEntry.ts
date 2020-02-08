import IConfig from '../interfaces/iConfig';

export default interface IConfigEntry {
    displayName: string;
    config: keyof IConfig
    condition?: () => boolean,
}
