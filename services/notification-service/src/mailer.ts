import nodemailer from 'nodemailer';

const SMTP_HOST = process.env.MAILHOG_SMTP_HOST || 'localhost';
const SMTP_PORT = parseInt(process.env.MAILHOG_SMTP_PORT || '1025');

const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT,
  secure: false,
});

export async function sendTaskNotification(email: string, subject: string, body: string): Promise<void> {
  await transporter.sendMail({
    from: '"Overengineered TODO" <todo@overengineered.app>',
    to: email,
    subject,
    text: body,
    html: `<h2>${subject}</h2><p>${body}</p>`,
  });
  console.log(`[notification-service] Email sent: ${subject}`);
}
