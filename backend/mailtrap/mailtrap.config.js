import { MailtrapClient } from "mailtrap";
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });


export const mailtrapClient = new MailtrapClient({
    token: process.env.MAILTRAP_TOKEN,
    endpoint: process.env.MAILTRAP_ENDPOINT
});

export const sender = {
    email: process.env.SENDER_EMAIL || "no-reply@circlecore.local",
    name: process.env.SENDER_NAME || "CircleCore",
};
