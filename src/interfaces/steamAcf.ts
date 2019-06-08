export interface IWorkshopItem {
    manifest: string;
    timeupdated: string;
    timetouched?: string;
    BytesDownloaded?: string;
    BytesToDownload?: string;
    size?: string;
}

export interface IWorkshopItemInstalled {
    size: string;
    timeupdated: string;
    manifest: string;
}

export interface IWorkshopItemsInstalled {
    [id: string]: IWorkshopItemInstalled;
}

export interface IWorkshopItemDetails {
    [id: string]: IWorkshopItem;
}

export interface IAppWorkshop {
    appid: string;
    SizeOnDisk: string;
    NeedsUpdate: string;
    NeedsDownload: string;
    TimeLastUpdated: string;
    TimeLastAppRan: string;
    WorkshopItemsInstalled: IWorkshopItemsInstalled;
    WorkshopItemDetails: IWorkshopItemDetails;
}

export interface ISteamAcf {
    AppWorkshop: IAppWorkshop;
}
