namespace MyPO.API.Services;

public interface IEmailService
{
    Task SendPasswordResetEmailAsync(string toEmail, string resetLink);
    Task SendApplicationReceivedEmailAsync(string toEmail, string refCode);
    Task SendApplicationSuccessEmailAsync(string toEmail, string refCode, string funderCompany);
    Task SendContactEmailAsync(string fromName, string fromEmail, string subject, string message);
    Task NotifyFundersNewApplicationAsync(string appRefCode, string companyName, decimal amount);
}

public class EmailService : IEmailService
{
    private readonly IConfiguration _config;
    private readonly ILogger<EmailService> _logger;
    private readonly HttpClient _httpClient;

    public EmailService(IConfiguration config, ILogger<EmailService> logger, IHttpClientFactory httpClientFactory)
    {
        _config = config;
        _logger = logger;
        _httpClient = httpClientFactory.CreateClient("Resend");
    }

    public async Task SendPasswordResetEmailAsync(string toEmail, string resetLink)
    {
        var body = $@"
              <h2 style='margin:0 0 12px;font-size:22px;color:#1e3a5f'>Reset Your Password</h2>
              <p style='margin:0 0 24px;color:#4b5563;line-height:1.6'>
                Click the button below to reset your MyPO password. This link expires in <strong>1 hour</strong>.
              </p>
              <a href='{resetLink}' style='display:inline-block;background:#1e3a5f;color:#ffffff;padding:13px 28px;text-decoration:none;border-radius:8px;font-weight:700;font-size:15px;letter-spacing:.3px'>
                Reset Password
              </a>
              <p style='margin:28px 0 0;color:#9ca3af;font-size:12px;line-height:1.5'>
                If you didn't request a password reset, you can safely ignore this email. Your password will not change.
              </p>";

        await SendEmailAsync(toEmail, "Reset Your MyPO Password", WrapLayout(body));
    }

    public async Task SendApplicationReceivedEmailAsync(string toEmail, string refCode)
    {
        var body = $@"
              <h2 style='margin:0 0 12px;font-size:22px;color:#1e3a5f'>Application Received</h2>
              <p style='margin:0 0 16px;color:#4b5563;line-height:1.6'>
                Thank you for submitting your PO funding application. We've received it and it is now under review.
              </p>
              <div style='background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px 20px;margin-bottom:24px'>
                <p style='margin:0;font-size:13px;color:#065f46;font-weight:600;letter-spacing:.05em;text-transform:uppercase'>Reference Number</p>
                <p style='margin:4px 0 0;font-size:22px;font-weight:800;color:#047857;letter-spacing:1px'>{refCode}</p>
              </div>
              <p style='margin:0 0 24px;color:#4b5563;line-height:1.6'>
                We'll notify you as soon as a funder expresses interest in your application.
              </p>
              <a href='https://mypo.co.za/dashboard' style='display:inline-block;background:#1e3a5f;color:#ffffff;padding:13px 28px;text-decoration:none;border-radius:8px;font-weight:700;font-size:15px'>
                View My Dashboard
              </a>";

        await SendEmailAsync(toEmail, $"Application Received – {refCode}", WrapLayout(body));
    }

    public async Task SendApplicationSuccessEmailAsync(string toEmail, string refCode, string funderCompany)
    {
        var body = $@"
              <h2 style='margin:0 0 12px;font-size:22px;color:#047857'>🎉 Great News — You're Funded!</h2>
              <p style='margin:0 0 16px;color:#4b5563;line-height:1.6'>
                Your PO funding application has been accepted by a funder. Here are the details:
              </p>
              <div style='background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px 20px;margin-bottom:24px'>
                <table style='width:100%;border-collapse:collapse'>
                  <tr>
                    <td style='padding:6px 0;color:#065f46;font-weight:700;font-size:13px;text-transform:uppercase;letter-spacing:.05em;width:120px'>Reference</td>
                    <td style='padding:6px 0;font-weight:700;color:#111827'>{refCode}</td>
                  </tr>
                  <tr>
                    <td style='padding:6px 0;color:#065f46;font-weight:700;font-size:13px;text-transform:uppercase;letter-spacing:.05em'>Funder</td>
                    <td style='padding:6px 0;font-weight:700;color:#111827'>{funderCompany}</td>
                  </tr>
                </table>
              </div>
              <p style='margin:0 0 24px;color:#4b5563;line-height:1.6'>
                Log in to your dashboard to start chatting with your funder and finalise the funding process.
              </p>
              <a href='https://mypo.co.za/dashboard' style='display:inline-block;background:#047857;color:#ffffff;padding:13px 28px;text-decoration:none;border-radius:8px;font-weight:700;font-size:15px'>
                Go to Dashboard
              </a>";

        await SendEmailAsync(toEmail, $"Your Application Was Funded! – {refCode}", WrapLayout(body));
    }

    public async Task SendContactEmailAsync(string fromName, string fromEmail, string subject, string message)
    {
        var body = $@"
              <h2 style='margin:0 0 16px;font-size:20px;color:#1e3a5f'>New Contact Form Message</h2>
              <table style='width:100%;border-collapse:collapse;margin-bottom:16px;font-size:14px'>
                <tr>
                  <td style='padding:8px 12px;background:#f9fafb;border:1px solid #e5e7eb;font-weight:700;color:#6b7280;width:80px'>From</td>
                  <td style='padding:8px 12px;border:1px solid #e5e7eb;color:#111827'>{fromName} &lt;{fromEmail}&gt;</td>
                </tr>
                <tr>
                  <td style='padding:8px 12px;background:#f9fafb;border:1px solid #e5e7eb;font-weight:700;color:#6b7280'>Subject</td>
                  <td style='padding:8px 12px;border:1px solid #e5e7eb;color:#111827'>{(string.IsNullOrEmpty(subject) ? "(no subject)" : subject)}</td>
                </tr>
              </table>
              <div style='background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:16px 20px;margin-bottom:16px'>
                <p style='margin:0;white-space:pre-wrap;line-height:1.7;color:#374151;font-size:14px'>{message}</p>
              </div>
              <p style='margin:0;color:#9ca3af;font-size:12px'>Reply directly to this email to respond to {fromName}.</p>";

        await SendEmailAsync(
            toEmail:  "info@mypo.co.za",
            subject:  $"[Contact] {(string.IsNullOrEmpty(subject) ? fromName : subject)}",
            htmlBody: WrapLayout(body, isInternal: true),
            replyTo:  fromEmail
        );
    }

    public async Task NotifyFundersNewApplicationAsync(string appRefCode, string companyName, decimal amount)
    {
        _logger.LogInformation("New application {RefCode} from {Company} for R{Amount:N0} - funder notifications would be sent here",
            appRefCode, companyName, amount);
    }

    // ── Shared branded email layout ──────────────────────────────────────────
    private static string WrapLayout(string bodyContent, bool isInternal = false)
    {
        var year = DateTime.UtcNow.Year;
        var footerNote = isInternal
            ? "This is an internal notification from the MyPO platform."
            : "You're receiving this email because you have an account on MyPO.<br>Questions? Contact us at <a href='mailto:info@mypo.co.za' style='color:#10b981'>info@mypo.co.za</a>";

        return $@"<!DOCTYPE html>
<html lang='en'>
<head><meta charset='UTF-8'><meta name='viewport' content='width=device-width,initial-scale=1'></head>
<body style='margin:0;padding:0;background:#f3f4f6;font-family:Arial,Helvetica,sans-serif'>
  <table width='100%' cellpadding='0' cellspacing='0' style='background:#f3f4f6;padding:40px 16px'>
    <tr><td align='center'>
      <table width='600' cellpadding='0' cellspacing='0' style='max-width:600px;width:100%'>

        <!-- ── Logo header ── -->
        <tr>
          <td align='center' style='background:linear-gradient(135deg,#0d1b2e 0%,#1e3a5f 60%,#0a3535 100%);border-radius:12px 12px 0 0;padding:32px 40px'>
            <table cellpadding='0' cellspacing='0'>
              <tr>
                <td style='padding-right:10px'>
                  <!-- Icon mark: two overlapping squares in teal -->
                  <div style='width:42px;height:42px;background:#10b981;border-radius:8px;display:inline-block;position:relative;vertical-align:middle'>
                    <div style='width:26px;height:26px;border:3px solid rgba(255,255,255,0.9);border-radius:4px;position:absolute;top:6px;left:6px'></div>
                  </div>
                </td>
                <td style='vertical-align:middle'>
                  <span style='font-size:28px;font-weight:900;color:#ffffff;letter-spacing:-0.5px;line-height:1'>My</span><span style='font-size:28px;font-weight:900;color:#10b981;letter-spacing:-0.5px'>PO</span>
                  <div style='font-size:10px;color:rgba(255,255,255,0.5);letter-spacing:2px;text-transform:uppercase;margin-top:2px'>Purchase Order Funding</div>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- ── Body ── -->
        <tr>
          <td style='background:#ffffff;padding:40px 40px 32px;border-left:1px solid #e5e7eb;border-right:1px solid #e5e7eb'>
            {bodyContent}
          </td>
        </tr>

        <!-- ── Footer ── -->
        <tr>
          <td style='background:#f9fafb;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px;padding:20px 40px;text-align:center'>
            <p style='margin:0 0 6px;font-size:12px;color:#9ca3af;line-height:1.6'>{footerNote}</p>
            <p style='margin:0;font-size:11px;color:#d1d5db'>© {year} MyPO (Pty) Ltd · <a href='https://mypo.co.za/privacy' style='color:#9ca3af;text-decoration:none'>Privacy Policy</a> · <a href='https://mypo.co.za/terms' style='color:#9ca3af;text-decoration:none'>Terms of Service</a></p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>";
    }

    private async Task SendEmailAsync(string toEmail, string subject, string htmlBody, string? replyTo = null)
    {
        var apiKey = _config["Resend:ApiKey"];
        var fromEmail = _config["Resend:FromEmail"] ?? "noreply@mypo.co.za";

        if (string.IsNullOrEmpty(apiKey) || apiKey == "your-resend-api-key")
        {
            _logger.LogInformation("[EMAIL SIMULATION] To: {To} | Subject: {Subject} | ReplyTo: {ReplyTo}",
                toEmail, subject, replyTo ?? "(none)");
            return;
        }

        try
        {
            // Build payload — only include reply_to when supplied so Resend
            // does not reject the request with an empty/null value.
            object payload = replyTo != null
                ? (object)new { from = fromEmail, to = new[] { toEmail }, reply_to = replyTo, subject, html = htmlBody }
                : (object)new { from = fromEmail, to = new[] { toEmail }, subject, html = htmlBody };

            _httpClient.DefaultRequestHeaders.Clear();
            _httpClient.DefaultRequestHeaders.Add("Authorization", $"Bearer {apiKey}");

            var response = await _httpClient.PostAsJsonAsync("https://api.resend.com/emails", payload);
            if (!response.IsSuccessStatusCode)
            {
                var body = await response.Content.ReadAsStringAsync();
                _logger.LogWarning("Email send failed: {Status} – {Body}", response.StatusCode, body);
            }
            else
            {
                _logger.LogInformation("Email sent to {To}", toEmail);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send email to {Email}", toEmail);
        }
    }
}
