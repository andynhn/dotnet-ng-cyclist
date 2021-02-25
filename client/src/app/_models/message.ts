export interface Message {
    id: number;
    senderId: number;
    senderUsername: string;
    senderFirstName: string;
    senderLastName: string;
    senderPhotoUrl: string;
    recipientId: number;
    recipientUsername: string;
    recipientFirstName: string;
    recipientLastName: string;
    recipientPhotoUrl: string;
    content: string;
    dateRead?: Date;
    messageSent: Date;
}
