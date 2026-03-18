export const VERIFICATION_EMAIL_TEMPLATE = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Verify Your Email</title>
</head>

<body style="margin:0; padding:0; font-family:'Inter', 'Segoe UI', Arial, sans-serif; background:#1e1f22;">
  <div style="max-width:560px; margin:30px auto; background:#2b2d31; border-radius:16px; overflow:hidden; box-shadow:0 8px 30px rgba(0,0,0,0.4);">

    <!-- Header -->
    <div style="background:#5865F2; padding:36px 30px; text-align:center;">
      <!-- Logo circle -->
      <div style="width:56px; height:56px; border-radius:50%; background:rgba(255,255,255,0.15); margin:0 auto 14px; line-height:56px; text-align:center;">
        <span style="font-size:24px; font-weight:900; color:#ffffff;">●</span>
      </div>
      <h1 style="color:#ffffff; margin:0; font-size:24px; font-weight:800; letter-spacing:-0.5px;">Verify Your Email</h1>
      <p style="color:rgba(255,255,255,0.75); margin-top:6px; font-size:14px; font-weight:500;">Complete your CircleCore account setup</p>
    </div>

    <!-- Content -->
    <div style="padding:32px 30px;">
      <p style="color:#F2F3F5; font-size:15px; line-height:1.6; margin:0 0 16px;">Hello,</p>

      <p style="color:#DBDEE1; font-size:15px; line-height:1.6; margin:0 0 16px;">Thanks for joining <b style="color:#F2F3F5;">CircleCore</b> — invite-only communities built around trust and real conversations.</p>

      <p style="color:#DBDEE1; font-size:15px; line-height:1.6; margin:0 0 8px;">Your verification code is:</p>

      <!-- Code Box -->
      <div style="text-align:center; margin:28px 0;">
        <div style="display:inline-block; background:#1e1f22; border:2px solid #3f4147; border-radius:12px; padding:20px 36px;">
          <span style="font-size:36px; font-weight:800; color:#F2F3F5; letter-spacing:10px; font-family:'Inter', 'Courier New', monospace;">{verificationCode}</span>
        </div>
      </div>

      <p style="color:#949BA4; font-size:14px; line-height:1.6; margin:0 0 8px;">Enter this code in the app to continue. The code expires in <b style="color:#F2F3F5;">24 hours</b>.</p>

      <p style="color:#6D6F78; font-size:13px; line-height:1.6; margin:0 0 0;">If you didn't sign up for CircleCore, you can safely ignore this email.</p>

      <div style="margin-top:32px; padding-top:20px; border-top:1px solid #3f4147;">
        <p style="color:#F2F3F5; font-size:14px; margin:0;">Best regards,<br><b>The CircleCore Team</b></p>
      </div>
    </div>

    <!-- Footer -->
    <div style="text-align:center; padding:16px 30px 20px; background:#1e1f22;">
      <p style="color:#6D6F78; font-size:11px; margin:0;">This is an automated email — please do not reply.</p>
    </div>

  </div>
</body>
</html>
`;


export const WELCOME_EMAIL_TEMPLATE = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Welcome to CircleCore</title>
</head>

<body style="margin:0; padding:0; font-family:'Inter', 'Segoe UI', Arial, sans-serif; background:#1e1f22;">
  <div style="max-width:560px; margin:30px auto; background:#2b2d31; border-radius:16px; overflow:hidden; box-shadow:0 8px 30px rgba(0,0,0,0.4);">

    <!-- Header -->
    <div style="background:linear-gradient(135deg, #5865F2 0%, #4752C4 100%); padding:40px 30px; text-align:center;">
      <div style="width:64px; height:64px; border-radius:50%; background:rgba(255,255,255,0.15); margin:0 auto 16px; line-height:64px; text-align:center;">
        <span style="font-size:28px;">✨</span>
      </div>
      <h1 style="color:#ffffff; margin:0; font-size:26px; font-weight:800; letter-spacing:-0.5px;">Welcome to CircleCore!</h1>
      <p style="color:rgba(255,255,255,0.75); margin-top:8px; font-size:14px; font-weight:500;">Your circle awaits</p>
    </div>

    <!-- Content -->
    <div style="padding:32px 30px;">
      <p style="color:#F2F3F5; font-size:15px; line-height:1.6; margin:0 0 16px;">Hey <b>{userName}</b>,</p>

      <p style="color:#DBDEE1; font-size:15px; line-height:1.6; margin:0 0 16px;">You're officially part of <b style="color:#F2F3F5;">CircleCore</b>. Your email has been verified and your account is ready to go.</p>

      <p style="color:#DBDEE1; font-size:15px; line-height:1.6; margin:0 0 24px;">Here's what you can do next:</p>

      <!-- Feature list -->
      <div style="background:#1e1f22; border-radius:12px; padding:20px 24px; margin-bottom:24px;">
        <div style="display:flex; margin-bottom:12px;">
          <span style="font-size:16px; margin-right:12px;">👤</span>
          <span style="color:#F2F3F5; font-size:14px; font-weight:600;">Set up your profile</span>
        </div>
        <div style="display:flex; margin-bottom:12px;">
          <span style="font-size:16px; margin-right:12px;">🌐</span>
          <span style="color:#F2F3F5; font-size:14px; font-weight:600;">Discover and join circles</span>
        </div>
        <div style="display:flex;">
          <span style="font-size:16px; margin-right:12px;">⚡</span>
          <span style="color:#F2F3F5; font-size:14px; font-weight:600;">Start real conversations</span>
        </div>
      </div>

      <div style="margin-top:28px; padding-top:20px; border-top:1px solid #3f4147;">
        <p style="color:#F2F3F5; font-size:14px; margin:0;">Welcome aboard,<br><b>The CircleCore Team</b></p>
      </div>
    </div>

    <!-- Footer -->
    <div style="text-align:center; padding:16px 30px 20px; background:#1e1f22;">
      <p style="color:#6D6F78; font-size:11px; margin:0;">This is an automated email — please do not reply.</p>
    </div>

  </div>
</body>
</html>
`;


export const PASSWORD_RESET_REQUEST_TEMPLATE = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Reset Your Password</title>
</head>

<body style="margin:0; padding:0; font-family:'Inter', 'Segoe UI', Arial, sans-serif; background:#1e1f22;">
  <div style="max-width:560px; margin:30px auto; background:#2b2d31; border-radius:16px; overflow:hidden; box-shadow:0 8px 30px rgba(0,0,0,0.4);">

    <!-- Header -->
    <div style="background:#313338; padding:36px 30px; text-align:center;">
      <div style="width:56px; height:56px; border-radius:50%; background:linear-gradient(135deg, #5865F2, #4752C4); margin:0 auto 14px; line-height:56px; text-align:center;">
        <span style="font-size:24px;">🔑</span>
      </div>
      <h1 style="color:#F2F3F5; margin:0; font-size:24px; font-weight:800; letter-spacing:-0.5px;">Reset Your Password</h1>
      <p style="color:#949BA4; margin-top:6px; font-size:14px; font-weight:500;">Secure your CircleCore account</p>
    </div>

    <!-- Content -->
    <div style="padding:32px 30px;">
      <p style="color:#F2F3F5; font-size:15px; line-height:1.6; margin:0 0 16px;">Hello,</p>

      <p style="color:#DBDEE1; font-size:15px; line-height:1.6; margin:0 0 16px;">We received a request to reset your <b style="color:#F2F3F5;">CircleCore</b> password. Click the button below to choose a new one.</p>

      <!-- Reset Button -->
      <div style="text-align:center; margin:28px 0;">
        <a href="{resetURL}"
           style="display:inline-block; background:#5865F2; color:#ffffff; padding:16px 36px; border-radius:12px; text-decoration:none; font-size:16px; font-weight:700; box-shadow:0 4px 14px rgba(88,101,242,0.35);">
          Reset Password
        </a>
      </div>

      <p style="color:#949BA4; font-size:14px; line-height:1.6; margin:0 0 8px;">This link expires in <b style="color:#F2F3F5;">1 hour</b>.</p>

      <p style="color:#6D6F78; font-size:13px; line-height:1.6; margin:0;">If you didn't request this, you can safely ignore this email — your password will remain unchanged.</p>

      <div style="margin-top:32px; padding-top:20px; border-top:1px solid #3f4147;">
        <p style="color:#F2F3F5; font-size:14px; margin:0;">Best regards,<br><b>The CircleCore Team</b></p>
      </div>
    </div>

    <!-- Footer -->
    <div style="text-align:center; padding:16px 30px 20px; background:#1e1f22;">
      <p style="color:#6D6F78; font-size:11px; margin:0;">This is an automated email — please do not reply.</p>
    </div>

  </div>
</body>
</html>
`;


export const PASSWORD_RESET_SUCCESS_TEMPLATE = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Password Reset Successful</title>
</head>

<body style="margin:0; padding:0; font-family:'Inter', 'Segoe UI', Arial, sans-serif; background:#1e1f22;">
  <div style="max-width:560px; margin:30px auto; background:#2b2d31; border-radius:16px; overflow:hidden; box-shadow:0 8px 30px rgba(0,0,0,0.4);">

    <!-- Header -->
    <div style="background:linear-gradient(135deg, #5865F2 0%, #4752C4 100%); padding:36px 30px; text-align:center;">
      <div style="width:64px; height:64px; border-radius:50%; background:rgba(255,255,255,0.15); margin:0 auto 14px; line-height:64px; text-align:center;">
        <span style="font-size:30px; color:#57F287;">✓</span>
      </div>
      <h1 style="color:#ffffff; margin:0; font-size:24px; font-weight:800; letter-spacing:-0.5px;">Password Updated</h1>
      <p style="color:rgba(255,255,255,0.75); margin-top:6px; font-size:14px; font-weight:500;">Your account is secure</p>
    </div>

    <!-- Content -->
    <div style="padding:32px 30px;">
      <p style="color:#F2F3F5; font-size:15px; line-height:1.6; margin:0 0 16px;">Hello,</p>

      <p style="color:#DBDEE1; font-size:15px; line-height:1.6; margin:0 0 16px;">Your <b style="color:#F2F3F5;">CircleCore</b> password has been successfully reset. You can now log in with your new password.</p>

      <!-- Success box -->
      <div style="text-align:center; margin:24px 0; background:rgba(87,242,135,0.08); border:2px solid rgba(87,242,135,0.2); border-radius:12px; padding:24px;">
        <div style="width:48px; height:48px; border-radius:50%; background:#57F287; margin:0 auto 12px; line-height:48px; text-align:center;">
          <span style="color:#1e1f22; font-size:24px; font-weight:bold;">✓</span>
        </div>
        <p style="color:#F2F3F5; font-size:15px; font-weight:700; margin:0;">Password changed successfully</p>
      </div>

      <p style="color:#949BA4; font-size:14px; line-height:1.6; margin:0 0 8px;">If you did <b>not</b> perform this action, please contact our support immediately.</p>

      <p style="color:#6D6F78; font-size:13px; line-height:1.6; margin:0;">Tip: Use a strong, unique password and never share it.</p>

      <div style="margin-top:32px; padding-top:20px; border-top:1px solid #3f4147;">
        <p style="color:#F2F3F5; font-size:14px; margin:0;">Stay safe,<br><b>The CircleCore Team</b></p>
      </div>
    </div>

    <!-- Footer -->
    <div style="text-align:center; padding:16px 30px 20px; background:#1e1f22;">
      <p style="color:#6D6F78; font-size:11px; margin:0;">This is an automated email — please do not reply.</p>
    </div>

  </div>
</body>
</html>
`;


export const INVITE_EMAIL_TEMPLATE = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>You're Invited!</title>
</head>

<body style="margin:0; padding:0; font-family:'Inter', 'Segoe UI', Arial, sans-serif; background:#1e1f22;">
  <div style="max-width:560px; margin:30px auto; background:#2b2d31; border-radius:16px; overflow:hidden; box-shadow:0 8px 30px rgba(0,0,0,0.4);">

    <!-- Header -->
    <div style="background:linear-gradient(135deg, #5865F2 0%, #4752C4 100%); padding:40px 30px; text-align:center;">
      <div style="width:64px; height:64px; border-radius:50%; background:rgba(255,255,255,0.15); margin:0 auto 16px; line-height:64px; text-align:center;">
        <span style="font-size:28px;">💌</span>
      </div>
      <h1 style="color:#ffffff; margin:0; font-size:26px; font-weight:800; letter-spacing:-0.5px;">You're Invited!</h1>
      <p style="color:rgba(255,255,255,0.75); margin-top:8px; font-size:14px; font-weight:500;">Join an exclusive community</p>
    </div>

    <!-- Content -->
    <div style="padding:32px 30px;">
      <p style="color:#F2F3F5; font-size:15px; line-height:1.6; margin:0 0 16px;">Hello,</p>

      <p style="color:#DBDEE1; font-size:15px; line-height:1.6; margin:0 0 16px;">You've been invited to join <b style="color:#F2F3F5;">{communityName}</b> on <b style="color:#F2F3F5;">CircleCore</b> — an invite-only platform built around trust and real conversations.</p>

      <p style="color:#DBDEE1; font-size:15px; line-height:1.6; margin:0 0 8px;">Your personal invite code is:</p>

      <!-- Code Box -->
      <div style="text-align:center; margin:24px 0;">
        <div style="display:inline-block; background:#1e1f22; border:2px solid #3f4147; border-radius:12px; padding:16px 32px;">
          <span style="font-size:22px; font-weight:800; color:#F2F3F5; letter-spacing:4px; font-family:'Inter', 'Courier New', monospace;">{inviteCode}</span>
        </div>
      </div>

      <!-- CTA Button -->
      <div style="text-align:center; margin:28px 0;">
        <a href="{inviteLink}"
           style="display:inline-block; background:#5865F2; color:#ffffff; padding:16px 40px; border-radius:12px; text-decoration:none; font-size:16px; font-weight:700; box-shadow:0 4px 14px rgba(88,101,242,0.35);">
          Join Now
        </a>
      </div>

      <p style="color:#949BA4; font-size:14px; line-height:1.6; margin:0 0 8px;">This invite expires in <b style="color:#F2F3F5;">30 days</b>. Click the button above or enter the code manually on CircleCore.</p>

      <p style="color:#6D6F78; font-size:13px; line-height:1.6; margin:0;">If you weren't expecting this invite, you can safely ignore this email.</p>

      <div style="margin-top:32px; padding-top:20px; border-top:1px solid #3f4147;">
        <p style="color:#F2F3F5; font-size:14px; margin:0;">See you inside,<br><b>The CircleCore Team</b></p>
      </div>
    </div>

    <!-- Footer -->
    <div style="text-align:center; padding:16px 30px 20px; background:#1e1f22;">
      <p style="color:#6D6F78; font-size:11px; margin:0;">This is an automated email — please do not reply.</p>
    </div>

  </div>
</body>
</html>
`;
