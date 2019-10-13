export default interface IMod {
    clientSide: boolean;
    serverSide: boolean;
    id: number;
    name: string;
    updatedAt?: Date;
    keys?: string[];
}
