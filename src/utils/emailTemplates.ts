export const getOnboardingApprovalTemplate = (name: string, loginUrl: string) => `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: 'Inter', sans-serif; line-height: 1.6; color: #1e293b; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
    .header { text-align: center; margin-bottom: 40px; }
    .logo { font-size: 24px; font-weight: bold; color: #f97316; }
    .content { background: #ffffff; border: 1px solid #f1f5f9; border-radius: 24px; padding: 40px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); }
    .title { font-size: 20px; font-weight: bold; margin-bottom: 20px; color: #0f172a; }
    .button { display: inline-block; background: #f97316; color: #ffffff !important; padding: 14px 28px; border-radius: 12px; font-weight: bold; text-decoration: none; margin-top: 30px; }
    .footer { text-align: center; margin-top: 40px; font-size: 12px; color: #64748b; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">PureRaise</div>
    </div>
    <div class="content">
      <div class="title">Welcome Aboard, ${name}!</div>
      <p>We are thrilled to inform you that your campaign owner application has been <strong>approved</strong>. Your identity verification is complete, and your account is now fully active.</p>
      <p>You can now start launching campaigns and raising funds on the PureRaise platform.</p>
      <a href="${loginUrl}" class="button">Go to Dashboard</a>
    </div>
    <div class="footer">
      © 2024 PureRaise Foundation. All rights reserved.
    </div>
  </div>
</body>
</html>
`;

export const getOnboardingRejectionTemplate = (name: string, notes: string, retryUrl: string) => `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: 'Inter', sans-serif; line-height: 1.6; color: #1e293b; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
    .header { text-align: center; margin-bottom: 40px; }
    .logo { font-size: 24px; font-weight: bold; color: #f97316; }
    .content { background: #ffffff; border: 1px solid #f1f5f9; border-radius: 24px; padding: 40px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); }
    .title { font-size: 20px; font-weight: bold; margin-bottom: 20px; color: #0f172a; }
    .notes { background: #f8fafc; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0; font-style: italic; }
    .button { display: inline-block; background: #0f172a; color: #ffffff !important; padding: 14px 28px; border-radius: 12px; font-weight: bold; text-decoration: none; margin-top: 30px; }
    .footer { text-align: center; margin-top: 40px; font-size: 12px; color: #64748b; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">PureRaise</div>
    </div>
    <div class="content">
      <div class="title">Update on your application</div>
      <p>Hello ${name},</p>
      <p>Thank you for your interest in becoming a campaign owner on PureRaise. After reviewing your application, we regret to inform you that we cannot approve it at this time.</p>
      
      <div class="notes">
        <strong>Admin Feedback:</strong><br/>
        ${notes || "No specific reason provided. Please ensure all documents are clear and valid."}
      </div>

      <p>Don't worry, you can re-submit your application at any time by ensuring the requirements are met.</p>
      <a href="${retryUrl}" class="button">Submit New Application</a>
    </div>
    <div class="footer">
      © 2024 PureRaise Foundation. All rights reserved.
    </div>
  </div>
</body>
</html>
`;
