export interface EmailMessage {
    id: string;
    from: string;
    subject: string;
    isRead: boolean;
    receivedAt: Date;
}