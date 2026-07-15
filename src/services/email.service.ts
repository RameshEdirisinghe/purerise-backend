import nodemailer from 'nodemailer';
import {
  getOnboardingApprovalTemplate,
  getOnboardingRejectionTemplate,
  getCampaignApprovalTemplate,
  getCampaignRejectionTemplate,
} from '../utils/emailTemplates';

// ─── Transporter (singleton) ──────────────────────────────────────────────────
// Initialized once at module load. SMTP credentials are read from env variables
// — never hardcoded.

console.log('📧 Email service initializing with host:', process.env.SMTP_HOST);

const transporter = nodemailer.createTransport({
  host:   process.env.SMTP_HOST,
  port:   Number(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === 'true', // true only for port 465
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  tls: {
    rejectUnauthorized: false,   // helps on some corporate / shared networks
  },
});

// ─── Types ────────────────────────────────────────────────────────────────────

interface SendMailParams {
  to:       string;
  subject:  string;
  text?:    string;
  html?:    string;
}

// ─── Low-level send helper ────────────────────────────────────────────────────

export const sendMail = async (data: SendMailParams): Promise<void> => {
  const fromName    = process.env.EMAIL_FROM_NAME    || 'PureRaise';
  const fromAddress = process.env.EMAIL_FROM_ADDRESS || process.env.SMTP_USER;
  await transporter.sendMail({
    from: `"${fromName}" <${fromAddress}>`,
    ...data,
  });
};

// ─── High-level named functions ───────────────────────────────────────────────

/**
 * Send approval email to a campaign owner whose KYC / onboarding was approved.
 *
 * @param recipientEmail  Email address of the campaign owner
 * @param recipientName   Display name of the campaign owner
 */
export const sendCampaignOwnerApprovedEmail = async (
  recipientEmail: string,
  recipientName:  string
): Promise<void> => {
  const loginUrl = `${process.env.CLIENT_URL}/login`;
  await sendMail({
    to:      recipientEmail,
    subject: 'Your Campaign Owner Account Has Been Approved 🎉',
    html:    getOnboardingApprovalTemplate(recipientName, loginUrl),
  });
};

/**
 * Send rejection email to a campaign owner whose KYC / onboarding was rejected.
 *
 * @param recipientEmail  Email address of the campaign owner
 * @param recipientName   Display name of the campaign owner
 * @param notes           Reviewer feedback / reason for rejection
 */
export const sendCampaignOwnerRejectedEmail = async (
  recipientEmail: string,
  recipientName:  string,
  notes?:         string
): Promise<void> => {
  const retryUrl = `${process.env.CLIENT_URL}/onboarding/campaign-owner`;
  await sendMail({
    to:      recipientEmail,
    subject: 'Update on Your PureRaise Campaign Owner Application',
    html:    getOnboardingRejectionTemplate(recipientName, notes || '', retryUrl),
  });
};

/**
 * Send approval email to a campaign owner whose campaign was approved by admin.
 *
 * @param recipientEmail  Email address of the campaign owner
 * @param recipientName   Display name of the campaign owner
 * @param campaignTitle   Title of the approved campaign
 */
export const sendCampaignApprovedEmail = async (
  recipientEmail: string,
  recipientName:  string,
  campaignTitle:  string
): Promise<void> => {
  const dashboardUrl = `${process.env.CLIENT_URL}/campaign-owner/dashboard`;
  await sendMail({
    to:      recipientEmail,
    subject: 'Your Campaign Has Been Approved ✅',
    html:    getCampaignApprovalTemplate(recipientName, campaignTitle, dashboardUrl),
  });
};

/**
 * Send rejection email to a campaign owner whose campaign was rejected by admin.
 *
 * @param recipientEmail  Email address of the campaign owner
 * @param recipientName   Display name of the campaign owner
 * @param campaignTitle   Title of the rejected campaign
 * @param notes           Reviewer feedback / reason for rejection
 */
export const sendCampaignRejectedEmail = async (
  recipientEmail: string,
  recipientName:  string,
  campaignTitle:  string,
  notes?:         string
): Promise<void> => {
  const editUrl = `${process.env.CLIENT_URL}/campaign-owner/create`;
  await sendMail({
    to:      recipientEmail,
    subject: `Update on Your Campaign: "${campaignTitle}"`,
    html:    getCampaignRejectionTemplate(recipientName, campaignTitle, notes || '', editUrl),
  });
};