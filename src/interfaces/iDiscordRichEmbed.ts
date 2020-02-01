export default interface IDiscordRichEmbed {
    title?: string;
    description?: string;
    url?: string;
    timestamp?: Date;
    color?: number;
    footer?: {
        text: string;
        icon_url?: string;
        proxy_icon_url?: string;
    };
    image?: {
        url?: string;
        proxy_url?: string;
        height?: number;
        width?: number;
    };
    thumbnail?: {
        url?: string;
        proxy_url?: string;
        height?: number;
        width?: number;
    };
    video?: {
        url?: string;
        height?: number;
        width?: number;
    };
    author?: {
        name?: string;
        url?: string;
        icon_url?: string;
        icon_proxy_url?: string;
    };
    fields?: {
        name: string;
        value: string;
        inline?: boolean;
    }[];
}
