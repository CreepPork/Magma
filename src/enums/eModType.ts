export enum EModType {
    /**
     * Required for all clients including the server.
     */
    all,

    /**
     * Required only for clients excluding the server.
     */
    client,

    /**
     * Required only for the server excluding the clients.
     */
    server,
}
