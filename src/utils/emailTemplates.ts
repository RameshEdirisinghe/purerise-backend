// ─────────────────────────────────────────────────────────────────────────────
// PureRaise Email Templates
// All templates return self-contained HTML strings.
// Do NOT inline styles via JS — keep everything inside <style> tags
// so they survive most email clients.
// ─────────────────────────────────────────────────────────────────────────────

const baseStyles = `
  body{margin:0;padding:0;background:#f8fafc;font-family:'Inter',Arial,sans-serif;color:#1e293b;}
  .wrapper{max-width:620px;margin:0 auto;padding:32px 16px;}
  .logo-bar{text-align:center;padding:24px 0 32px;}
  .logo-text{font-size:26px;font-weight:900;color:#f97316;letter-spacing:-0.5px;}
  .logo-dot{color:#0f172a;}
  .card{background:#ffffff;border-radius:24px;box-shadow:0 4px 24px rgba(15,23,42,.08);overflow:hidden;}
  .card-accent{height:5px;background:linear-gradient(90deg,#f97316 0%,#fb923c 100%);}
  .card-accent.green{background:linear-gradient(90deg,#16a34a 0%,#22c55e 100%);}
  .card-accent.red{background:linear-gradient(90deg,#dc2626 0%,#ef4444 100%);}
  .card-body{padding:40px;}
  .badge{display:inline-block;padding:4px 14px;border-radius:99px;font-size:11px;font-weight:700;letter-spacing:.5px;text-transform:uppercase;margin-bottom:20px;}
  .badge.success{background:#f0fdf4;color:#16a34a;border:1px solid #bbf7d0;}
  .badge.danger{background:#fef2f2;color:#dc2626;border:1px solid #fecaca;}
  .badge.info{background:#eff6ff;color:#2563eb;border:1px solid #bfdbfe;}
  h2{font-size:22px;font-weight:800;color:#0f172a;margin:0 0 16px;line-height:1.3;}
  p{font-size:15px;line-height:1.75;color:#475569;margin:0 0 14px;}
  .highlight-box{background:#f8fafc;border-left:4px solid #f97316;border-radius:8px;padding:16px 20px;margin:22px 0;}
  .highlight-box.red-border{border-color:#ef4444;}
  .highlight-box strong{display:block;font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.8px;margin-bottom:6px;}
  .highlight-box span{font-size:16px;font-weight:700;color:#0f172a;}
  .btn{display:inline-block;background:linear-gradient(135deg,#f97316 0%,#fb923c 100%);color:#ffffff!important;font-size:14px;font-weight:700;padding:14px 32px;border-radius:14px;text-decoration:none;margin-top:28px;letter-spacing:.2px;box-shadow:0 4px 14px rgba(249,115,22,.3);}
  .btn.dark{background:linear-gradient(135deg,#0f172a 0%,#1e293b 100%);box-shadow:0 4px 14px rgba(15,23,42,.3);}
  .divider{border:none;border-top:1px solid #f1f5f9;margin:28px 0;}
  .meta-row{display:flex;gap:32px;margin:20px 0;}
  .meta-item .label{font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.6px;margin-bottom:4px;}
  .meta-item .value{font-size:15px;font-weight:700;color:#0f172a;}
  .footer{text-align:center;padding:28px 0 8px;}
  .footer p{font-size:12px;color:#94a3b8;margin:0;}
  .footer a{color:#f97316;text-decoration:none;}
`;

// ─── 1. Campaign Owner Account Approved ──────────────────────────────────────
export const getOnboardingApprovalTemplate = (name: string, loginUrl: string): string => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>Your Account is Approved – PureRaise</title>
  <style>${baseStyles}</style>
</head>
<body>
  <div class="wrapper">
    <div class="logo-bar">
      <span class="logo-text">Pure<span class="logo-dot">Raise</span></span>
    </div>

    <div class="card">
      <div class="card-accent green"></div>
      <div class="card-body">
        <span class="badge success">✓ Account Approved</span>
        <h2>Your Campaign Owner Account Has Been Approved 🎉</h2>
        <p>Hi <strong>${name}</strong>,</p>
        <p>Congratulations! We're excited to let you know that your Campaign Owner application on <strong>PureRaise</strong> has been reviewed and <strong>officially approved</strong>.</p>
        <p>Your identity verification is complete and your account is now fully active. You can now log in and start creating campaigns to raise funds for your projects.</p>

        <div class="highlight-box">
          <strong>What you can do now</strong>
          <span>✦ Create &amp; launch campaigns &nbsp; ✦ Manage milestones &nbsp; ✦ Withdraw funds</span>
        </div>

        <p>Thank you for choosing PureRaise. We look forward to supporting your journey!</p>

        <a href="${loginUrl}" class="btn">Go to Dashboard →</a>
      </div>
    </div>

    <div class="footer">
      <p>© 2026 PureRaise Foundation. All rights reserved.<br/>
      Questions? <a href="mailto:adminpureraise@gmail.com">adminpureraise@gmail.com</a></p>
    </div>
  </div>
</body>
</html>
`;

// ─── 2. Campaign Owner Account Rejected ──────────────────────────────────────
export const getOnboardingRejectionTemplate = (name: string, notes: string, retryUrl: string): string => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>Application Update – PureRaise</title>
  <style>${baseStyles}</style>
</head>
<body>
  <div class="wrapper">
    <div class="logo-bar">
      <span class="logo-text">Pure<span class="logo-dot">Raise</span></span>
    </div>

    <div class="card">
      <div class="card-accent red"></div>
      <div class="card-body">
        <span class="badge danger">Application Update</span>
        <h2>Update on Your Campaign Owner Application</h2>
        <p>Hi <strong>${name}</strong>,</p>
        <p>Thank you for your interest in becoming a Campaign Owner on PureRaise. After carefully reviewing your application, we are unable to approve it at this time.</p>

        <div class="highlight-box red-border">
          <strong>Reviewer Feedback</strong>
          <span>${notes || 'Please ensure all submitted documents are clear, valid, and match the information provided.'}</span>
        </div>

        <p>Don't worry — you are welcome to address the feedback above and re-submit your application at any time. Our team will review it again promptly.</p>

        <a href="${retryUrl}" class="btn dark">Submit New Application →</a>
      </div>
    </div>

    <div class="footer">
      <p>© 2026 PureRaise Foundation. All rights reserved.<br/>
      Need help? <a href="mailto:adminpureraise@gmail.com">adminpureraise@gmail.com</a></p>
    </div>
  </div>
</body>
</html>
`;

// ─── 3. Campaign Approved ─────────────────────────────────────────────────────
export const getCampaignApprovalTemplate = (name: string, campaignTitle: string, dashboardUrl: string): string => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>Your Campaign is Live – PureRaise</title>
  <style>${baseStyles}</style>
</head>
<body>
  <div class="wrapper">
    <div class="logo-bar">
      <span class="logo-text">Pure<span class="logo-dot">Raise</span></span>
    </div>

    <div class="card">
      <div class="card-accent green"></div>
      <div class="card-body">
        <span class="badge success">✓ Campaign Approved</span>
        <h2>Your Campaign Has Been Approved ✅</h2>
        <p>Hi <strong>${name}</strong>,</p>
        <p>Fantastic news! Your campaign has been reviewed by our team and is now <strong>live on PureRaise</strong>. Contributors can discover, support, and fund your project starting right now.</p>

        <div class="highlight-box">
          <strong>Campaign Title</strong>
          <span>${campaignTitle}</span>
        </div>

        <p>Here's what happens next:</p>
        <p>
          • Your campaign is now publicly visible on the platform<br/>
          • Contributors worldwide can back your project<br/>
          • Funds are released to you as milestones are completed<br/>
          • Share your campaign link to attract more backers!
        </p>

        <p>Thank you for bringing your idea to PureRaise. We're rooting for your success!</p>

        <a href="${dashboardUrl}" class="btn">View My Campaign →</a>
      </div>
    </div>

    <div class="footer">
      <p>© 2026 PureRaise Foundation. All rights reserved.<br/>
      Questions? <a href="mailto:adminpureraise@gmail.com">adminpureraise@gmail.com</a></p>
    </div>
  </div>
</body>
</html>
`;

// ─── 4. Campaign Rejected ─────────────────────────────────────────────────────
export const getCampaignRejectionTemplate = (name: string, campaignTitle: string, notes: string, editUrl: string): string => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>Campaign Review Update – PureRaise</title>
  <style>${baseStyles}</style>
</head>
<body>
  <div class="wrapper">
    <div class="logo-bar">
      <span class="logo-text">Pure<span class="logo-dot">Raise</span></span>
    </div>

    <div class="card">
      <div class="card-accent red"></div>
      <div class="card-body">
        <span class="badge danger">Review Update</span>
        <h2>Update on Your Campaign</h2>
        <p>Hi <strong>${name}</strong>,</p>
        <p>Thank you for submitting your campaign to PureRaise. After a careful review by our moderation team, we are unable to approve your campaign in its current state.</p>

        <div class="highlight-box">
          <strong>Campaign Title</strong>
          <span>${campaignTitle}</span>
        </div>

        <div class="highlight-box red-border">
          <strong>Reviewer Feedback</strong>
          <span>${notes || 'Please ensure your campaign description and goals are clear and follow our community guidelines.'}</span>
        </div>

        <p>You can update your campaign based on the feedback above and re-submit it for approval. Our team will review it again as soon as possible.</p>

        <a href="${editUrl}" class="btn dark">Edit Campaign →</a>
      </div>
    </div>

    <div class="footer">
      <p>© 2026 PureRaise Foundation. All rights reserved.<br/>
      Need help? <a href="mailto:adminpureraise@gmail.com">adminpureraise@gmail.com</a></p>
    </div>
  </div>
</body>
</html>
`;
