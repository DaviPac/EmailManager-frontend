import { Attachment } from "./attachment.model";

export interface EmailDetails {
    id: string;
    from: string;
    to: string;
    cc?: string;
    subject: string;
    textBody?: string;
    htmlBody?: string;
    isRead: boolean;
    receivedAt: Date;
    attachments: Attachment[];
}