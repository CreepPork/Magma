import IDiscordRichEmbed from './iDiscordRichEmbed';

export default interface IDiscordWebhookPayload {
    content?: string;
    username?: string;
    avatar_url?: string;
    tts?: boolean;
    embeds?: IDiscordRichEmbed[];
}
