export type Packet = {
    time: number;
    source: "client" | "server";
    packetId: number;
    packetName: string;
    length: number;
    data: any | object;

    index?: number;
    decode?: boolean;
    binary?: string; // Base64-encoded raw packet data.
};
