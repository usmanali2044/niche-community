import {
    VERIFICATION_EMAIL_TEMPLATE,
    WELCOME_EMAIL_TEMPLATE,
    PASSWORD_RESET_REQUEST_TEMPLATE,
    PASSWORD_RESET_SUCCESS_TEMPLATE,
    INVITE_EMAIL_TEMPLATE,
} from "./emailtemplate.js";
import { mailtrapClient, sender } from "./mailtrap.config.js";

export const sendVerificationEmail = async (email, verificationToken) => {
    const recipient = [{ email }];
    try {
        const response = await mailtrapClient.send({
            from: sender,
            to: recipient,
            subject: "Verify your email — CircleCore",
            html: VERIFICATION_EMAIL_TEMPLATE.replace("{verificationCode}", verificationToken),
            category: "Email Verification",
        });
        console.log("Verification email sent successfully", response);
    } catch (error) {
        console.log("Error sending verification email:", error);
        throw new Error(`Error sending verification email: ${error}`);
    }
};

export const sendWelcomeEmail = async (email, name) => {
    const recipient = [{ email }];
    try {
        const response = await mailtrapClient.send({
            from: sender,
            to: recipient,
            subject: "Welcome to CircleCore! ✨",
            html: WELCOME_EMAIL_TEMPLATE.replace("{userName}", name),
            category: "Welcome Email",
        });
        console.log("Welcome email sent successfully", response);
    } catch (error) {
        console.log("Error sending welcome email:", error);
    }
};

export const sendResetPasswordEmail = async (email, resetUrl) => {
    const recipient = [{ email }];
    try {
        const response = await mailtrapClient.send({
            from: sender,
            to: recipient,
            subject: "Reset your password — CircleCore",
            html: PASSWORD_RESET_REQUEST_TEMPLATE.replace("{resetURL}", resetUrl),
            category: "Password Reset",
        });
        console.log("Reset password email sent successfully", response);
    } catch (error) {
        console.log("Error sending reset password email:", error);
        throw new Error(`Error sending reset password email: ${error}`);
    }
};

export const sendResetSuccessEmail = async (email) => {
    const recipient = [{ email }];
    try {
        const response = await mailtrapClient.send({
            from: sender,
            to: recipient,
            subject: "Password reset successful — CircleCore",
            html: PASSWORD_RESET_SUCCESS_TEMPLATE,
            category: "Password Reset Success",
        });
        console.log("Password reset success email sent", response);
    } catch (error) {
        console.log("Error sending reset success email:", error);
        throw new Error(`Error sending reset success email: ${error}`);
    }
};

export const sendInviteEmail = async (email, communityName, inviteCode) => {
    const recipient = [{ email }];
    try {
        const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
        const inviteLink = `${clientUrl}/invite-link?code=${encodeURIComponent(inviteCode)}`;
        const html = INVITE_EMAIL_TEMPLATE
            .replace(/{communityName}/g, communityName)
            .replace(/{inviteCode}/g, inviteCode)
            .replace(/{inviteLink}/g, inviteLink);

        const response = await mailtrapClient.send({
            from: sender,
            to: recipient,
            subject: `You're invited to join ${communityName} on CircleCore! 💌`,
            html,
            category: "Community Invite",
        });
        console.log("Invite email sent successfully", response);
    } catch (error) {
        console.log("Error sending invite email:", error);
        throw new Error(`Error sending invite email: ${error}`);
    }
};
