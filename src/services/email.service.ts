import nodemailer from "nodemailer";

type SendMailParams = {
  to: string;
  subject: string;
  text?: string;
  html?: string;
};

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: process.env.SMTP_PORT === '465', // true for 465, false for 587
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  tls: {
    // This helps bypass some network restrictions/certificate issues
    rejectUnauthorized: false
  }
});

export const sendMail = async (data: SendMailParams) => {
  return transporter.sendMail({
    from: `"PureRaise Team" <${process.env.SMTP_USER}>`,
    ...data,
  });
};