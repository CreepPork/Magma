// tslint:disable: interface-name

export interface Tag {
    tag: string;
}

export interface Publishedfiledetail {
    publishedfileid: string;
    result: number;
    creator: string;
    creator_app_id: number;
    consumer_app_id: number;
    filename: string;
    file_size: number;
    file_url: string;
    hcontent_file: string;
    preview_url: string;
    hcontent_preview: string;
    title: string;
    description: string;
    time_created: number;
    time_updated: number;
    visibility: number;
    banned: number;
    ban_reason: string;
    subscriptions: number;
    favorited: number;
    lifetime_subscriptions: number;
    lifetime_favorited: number;
    views: number;
    tags: Tag[];
}

export interface Response {
    result: number;
    resultcount: number;
    publishedfiledetails: Publishedfiledetail[];
}

export interface ISteamPublishedFile {
    response: Response;
}
