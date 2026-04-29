import nodemailer from "nodemailer";
import { EMAIL_PASS, EMAIL_USER } from "../../config/config.service.js";
export const sendEmail = async ({ to, subject, html, }) => {
    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: EMAIL_USER,
            pass: EMAIL_PASS,
        },
    });
    const info = await transporter.sendMail({
        from: `"Sara7a App" <${EMAIL_USER}>`,
        to,
        subject,
        html,
    });
    return info;
};
