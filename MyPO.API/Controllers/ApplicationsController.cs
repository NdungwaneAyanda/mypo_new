using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using MyPO.API.Data;
using MyPO.API.Hubs;
using MyPO.API.Models;
using MyPO.API.Models.DTOs;
using MyPO.API.Models.Entities;
using MyPO.API.Services;
using System.Security.Claims;

namespace MyPO.API.Controllers;

[Authorize]
[ApiController]
[Route("api/applications")]
public class ApplicationsController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly RefCodeService _refCodeService;
    private readonly IEmailService _emailService;
    private readonly IHubContext<NotificationHub> _notificationHub;
    private readonly IHubContext<ChatHub> _chatHub;
    private readonly IWebHostEnvironment _env;
    private readonly IConfiguration _config;
    private readonly ILogger<ApplicationsController> _logger;

    public ApplicationsController(AppDbContext db, RefCodeService refCodeService,
        IEmailService emailService, IHubContext<NotificationHub> notificationHub,
        IHubContext<ChatHub> chatHub, IWebHostEnvironment env, IConfiguration config,
        ILogger<ApplicationsController> logger)
    {
        _db = db;
        _refCodeService = refCodeService;
        _chatHub = chatHub;
        _emailService = emailService;
        _notificationHub = notificationHub;
        _env = env;
        _config = config;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult<List<ApplicationResponseDto>>> GetApplications()
    {
        var userId = GetUserId();
        var roles = GetRoles();
        var isFunder = roles.Contains("funder");

        List<FundingApplication> apps;

        if (isFunder)
        {
            var funder = await _db.RegisteredFunders.FirstOrDefaultAsync(f => f.UserId == userId);
            if (funder == null) return Ok(new List<ApplicationResponseDto>());

            apps = await _db.FundingApplications
                .Include(a => a.Documents)
                .Include(a => a.AssignedFunder)
                .Where(a => a.Status == ApplicationStatus.ReadyForFunding || a.Status == "pending" ||
                            a.Status == ApplicationStatus.Reviewed ||
                            ((a.Status == ApplicationStatus.Funded || a.Status == "successful") &&
                             a.AssignedFunderId == funder.Id))
                .OrderByDescending(a => a.CreatedAt)
                .ToListAsync();
        }
        else
        {
            var user = await _db.Users.Include(u => u.Profile).FirstOrDefaultAsync(u => u.Id == userId);
            var userEmail = user?.Profile?.Email ?? user?.Email ?? "";

            apps = await _db.FundingApplications
                .Include(a => a.Documents)
                .Include(a => a.AssignedFunder)
                .Where(a => a.UserId == userId || a.Email == userEmail)
                .OrderByDescending(a => a.CreatedAt)
                .ToListAsync();
        }

        return Ok(apps.Select(MapToDto).ToList());
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ApplicationResponseDto>> GetApplication(Guid id)
    {
        var userId = GetUserId();
        var roles = GetRoles();

        var app = await _db.FundingApplications
            .Include(a => a.Documents)
            .Include(a => a.AssignedFunder)
            .FirstOrDefaultAsync(a => a.Id == id);

        if (app == null) return NotFound();

        if (!CanAccessApplication(app, userId, roles))
            return Forbid();

        return Ok(MapToDto(app));
    }

    [HttpPost]
    public async Task<ActionResult<ApplicationResponseDto>> CreateApplication(CreateApplicationDto dto)
    {
        var userId = GetUserId();
        var refCode = await _refCodeService.GenerateApplicationRefAsync();

        var app = new FundingApplication
        {
            UserId = userId,
            CompanyName = dto.CompanyName,
            ContactName = dto.ContactName,
            Email = dto.Email,
            Phone = dto.Phone,
            Industry = dto.Industry,
            PoAmount = dto.PoAmount,
            CostOfDelivery = dto.CostOfDelivery,
            AmountNeeded = dto.AmountNeeded,
            CustomerName = dto.CustomerName,
            PaymentTerms = dto.PaymentTerms,
            Description = dto.Description,
            Status = ApplicationStatus.Provisional,
            RefCode = refCode
        };

        _db.FundingApplications.Add(app);

        var profile = await _db.Profiles.FirstOrDefaultAsync(p => p.Id == userId);
        if (profile != null)
        {
            profile.CompanyName ??= dto.CompanyName;
            profile.ContactName ??= dto.ContactName;
            profile.Phone ??= dto.Phone;
            profile.UpdatedAt = DateTime.UtcNow;
        }

        await _db.SaveChangesAsync();
        _logger.LogInformation("New provisional application submitted: {RefCode} by {Email} | Company: {Company} | Amount: R{Amount:N0}",
            refCode, dto.Email, dto.CompanyName, dto.AmountNeeded);

        await _emailService.SendApplicationReceivedEmailAsync(dto.Email, refCode);

        var created = await _db.FundingApplications
            .Include(a => a.Documents)
            .Include(a => a.AssignedFunder)
            .FirstAsync(a => a.Id == app.Id);

        return CreatedAtAction(nameof(GetApplication), new { id = app.Id }, MapToDto(created));
    }

    [HttpPost("{id}/documents")]
    public async Task<ActionResult<DocumentResponseDto>> UploadDocument(Guid id, IFormFile file, [FromQuery] string documentType)
    {
        var userId = GetUserId();
        var roles = GetRoles();

        var app = await _db.FundingApplications
            .Include(a => a.Documents)
            .FirstOrDefaultAsync(a => a.Id == id);
        if (app == null) return NotFound();
        if (!CanAccessApplication(app, userId, roles)) return Forbid();

        _logger.LogInformation("Document upload: AppId={AppId} | Type={Type} | File={File} | Size={Size}KB",
            id, documentType, file.FileName, file.Length / 1024);

        if (file.Length > 5 * 1024 * 1024)
            return BadRequest(new { message = "File size must be under 5MB." });

        var allowedTypes = new[] { ".pdf", ".doc", ".docx" };
        var ext = Path.GetExtension(file.FileName).ToLower();
        if (!allowedTypes.Contains(ext))
            return BadRequest(new { message = "Only PDF, DOC, and DOCX files are allowed." });

        var uploadPath = Path.Combine(_env.ContentRootPath, "uploads", "applications", id.ToString(), documentType);
        Directory.CreateDirectory(uploadPath);

        var safeFileName = $"{Guid.NewGuid()}{ext}";
        var filePath = Path.Combine(uploadPath, safeFileName);

        await using var stream = new FileStream(filePath, FileMode.Create);
        await file.CopyToAsync(stream);

        var relPath = Path.Combine("applications", id.ToString(), documentType, safeFileName).Replace("\\", "/");

        var doc = new ApplicationDocument
        {
            ApplicationId = id,
            DocumentType = documentType,
            FileName = file.FileName,
            FilePath = relPath,
            FileSize = file.Length
        };

        _db.ApplicationDocuments.Add(doc);
        await _db.SaveChangesAsync();

        await PromoteWhenPurchaseOrderUploadedAsync(app, documentType);

        return Ok(new DocumentResponseDto
        {
            Id = doc.Id,
            DocumentType = doc.DocumentType,
            FileName = doc.FileName,
            FileSize = doc.FileSize,
            CreatedAt = doc.CreatedAt
        });
    }

    [HttpPut("{id}/documents/{docId}")]
    public async Task<ActionResult<DocumentResponseDto>> ReplaceDocument(Guid id, Guid docId, IFormFile file)
    {
        var userId = GetUserId();
        var roles = GetRoles();

        var app = await _db.FundingApplications.FirstOrDefaultAsync(a => a.Id == id);
        if (app == null) return NotFound();
        if (!CanAccessApplication(app, userId, roles)) return Forbid();

        var doc = await _db.ApplicationDocuments.FirstOrDefaultAsync(d => d.Id == docId && d.ApplicationId == id);
        if (doc == null) return NotFound();

        if (file.Length > 5 * 1024 * 1024)
            return BadRequest(new { message = "File size must be under 5MB." });

        var allowedTypes = new[] { ".pdf", ".doc", ".docx" };
        var ext = Path.GetExtension(file.FileName).ToLower();
        if (!allowedTypes.Contains(ext))
            return BadRequest(new { message = "Only PDF, DOC, and DOCX files are allowed." });

        // Delete the old physical file
        var oldFilePath = Path.Combine(_env.ContentRootPath, "uploads", doc.FilePath.Replace("/", Path.DirectorySeparatorChar.ToString()));
        if (System.IO.File.Exists(oldFilePath))
            System.IO.File.Delete(oldFilePath);

        // Save new file
        var uploadPath = Path.Combine(_env.ContentRootPath, "uploads", "applications", id.ToString(), doc.DocumentType);
        Directory.CreateDirectory(uploadPath);

        var safeFileName = $"{Guid.NewGuid()}{ext}";
        var filePath = Path.Combine(uploadPath, safeFileName);

        await using var stream = new FileStream(filePath, FileMode.Create);
        await file.CopyToAsync(stream);

        var relPath = Path.Combine("applications", id.ToString(), doc.DocumentType, safeFileName).Replace("\\", "/");

        doc.FileName = file.FileName;
        doc.FilePath = relPath;
        doc.FileSize = file.Length;

        await _db.SaveChangesAsync();

        return Ok(new DocumentResponseDto
        {
            Id = doc.Id,
            DocumentType = doc.DocumentType,
            FileName = doc.FileName,
            FileSize = doc.FileSize,
            CreatedAt = doc.CreatedAt
        });
    }

    [HttpGet("{id}/documents/{docId}/download")]
    public async Task<IActionResult> DownloadDocument(Guid id, Guid docId)
    {
        var userId = GetUserId();
        var roles = GetRoles();

        var app = await _db.FundingApplications
            .Include(a => a.AssignedFunder)
            .FirstOrDefaultAsync(a => a.Id == id);

        if (app == null) return NotFound();
        if (!CanAccessApplication(app, userId, roles)) return Forbid();

        var doc = await _db.ApplicationDocuments.FirstOrDefaultAsync(d => d.Id == docId && d.ApplicationId == id);
        if (doc == null) return NotFound();

        var filePath = Path.Combine(_env.ContentRootPath, "uploads", doc.FilePath.Replace("/", Path.DirectorySeparatorChar.ToString()));
        if (!System.IO.File.Exists(filePath)) return NotFound(new { message = "File not found on server." });

        var contentType = doc.FileName.EndsWith(".pdf") ? "application/pdf" : "application/octet-stream";
        return PhysicalFile(filePath, contentType, doc.FileName);
    }

    [HttpPut("{id}/claim")]
    public async Task<ActionResult<ApplicationResponseDto>> ClaimApplication(Guid id, ClaimApplicationDto dto)
    {
        var userId = GetUserId();
        var roles = GetRoles();

        if (!roles.Contains("funder"))
            return Forbid();

        var funder = await _db.RegisteredFunders.FirstOrDefaultAsync(f => f.UserId == userId);
        if (funder == null) return BadRequest(new { message = "You are not registered as a funder." });

        var app = await _db.FundingApplications
            .Include(a => a.AssignedFunder)
            .Include(a => a.Documents)
            .FirstOrDefaultAsync(a => a.Id == id);

        if (app == null) return NotFound();

        if (dto.Action == "take")
        {
            var canTake = app.AssignedFunderId == funder.Id &&
                          (ApplicationStatus.IsReadyForFunding(app.Status) || app.Status == ApplicationStatus.Reviewed);
            if (!canTake)
                return BadRequest(new { message = "You must claim this application before taking the offer." });

            var percent = PlatformFee.ResolvePercent(_config);
            app.Status = ApplicationStatus.Funded;
            app.PlatformFeePercent = percent;
            app.PlatformFeeAmount = PlatformFee.Calculate(app.AmountNeeded, percent);
            app.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();
            _logger.LogInformation("Application FUNDED: {RefCode} by funder {FunderCompany} (UserId={FunderId}) | Platform fee: R{Fee:N2} ({Percent}%)",
                app.RefCode, funder.CompanyName, userId, app.PlatformFeeAmount, percent);
            await _emailService.SendApplicationSuccessEmailAsync(app.Email, app.RefCode ?? app.Id.ToString(), funder.CompanyName);
        }
        else
        {
            if (!ApplicationStatus.IsReadyForFunding(app.Status))
                return BadRequest(new { message = "Application is not ready for funding yet. A purchase order document is required." });

            if (app.AssignedFunderId != null)
                return BadRequest(new { message = "This application has already been claimed." });

            app.AssignedFunderId = funder.Id;
            app.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();
            _logger.LogInformation("Application CLAIMED: {RefCode} by funder {FunderCompany}",
                app.RefCode, funder.CompanyName);
        }

        var updated = await _db.FundingApplications
            .Include(a => a.Documents)
            .Include(a => a.AssignedFunder)
            .FirstAsync(a => a.Id == id);

        return Ok(MapToDto(updated));
    }

    [HttpGet("{id}/messages")]
    public async Task<ActionResult<List<MessageResponseDto>>> GetMessages(Guid id)
    {
        var userId = GetUserId();
        var roles = GetRoles();

        var app = await _db.FundingApplications
            .Include(a => a.AssignedFunder)
            .FirstOrDefaultAsync(a => a.Id == id);

        if (app == null) return NotFound();
        if (!CanAccessApplication(app, userId, roles)) return Forbid();

        var messages = await _db.ApplicationMessages
            .Include(m => m.Sender)
            .Where(m => m.ApplicationId == id)
            .OrderBy(m => m.CreatedAt)
            .ToListAsync();

        var unread = messages.Where(m => m.ReceiverId == userId && !m.IsRead).ToList();
        unread.ForEach(m => m.IsRead = true);
        if (unread.Any()) await _db.SaveChangesAsync();

        return Ok(messages.Select(m => new MessageResponseDto
        {
            Id = m.Id,
            ApplicationId = m.ApplicationId,
            SenderId = m.SenderId,
            SenderEmail = m.Sender.Email,
            ReceiverId = m.ReceiverId,
            MessageText = m.MessageText,
            IsRead = m.IsRead,
            CreatedAt = m.CreatedAt
        }).ToList());
    }

    [HttpPost("{id}/messages")]
    public async Task<ActionResult<MessageResponseDto>> SendMessage(Guid id, MessageDto dto)
    {
        var userId = GetUserId();
        var roles = GetRoles();

        var app = await _db.FundingApplications
            .Include(a => a.AssignedFunder)
            .FirstOrDefaultAsync(a => a.Id == id);

        if (app == null) return NotFound();
        if (!ApplicationStatus.IsFunded(app.Status)) return BadRequest(new { message = "Chat is only available for funded applications." });
        if (!CanAccessApplication(app, userId, roles)) return Forbid();

        Guid receiverId;
        if (app.UserId == userId)
        {
            var funder = await _db.RegisteredFunders.FirstOrDefaultAsync(f => f.Id == app.AssignedFunderId);
            if (funder == null) return BadRequest(new { message = "No funder assigned." });
            receiverId = funder.UserId;
        }
        else
        {
            receiverId = app.UserId;
        }

        var message = new ApplicationMessage
        {
            ApplicationId = id,
            SenderId = userId,
            ReceiverId = receiverId,
            MessageText = dto.MessageText
        };

        _db.ApplicationMessages.Add(message);
        await _db.SaveChangesAsync();

        var sender = await _db.Users.FindAsync(userId);

        var responseDto = new MessageResponseDto
        {
            Id = message.Id,
            ApplicationId = message.ApplicationId,
            SenderId = message.SenderId,
            SenderEmail = sender?.Email ?? "",
            ReceiverId = message.ReceiverId,
            MessageText = message.MessageText,
            IsRead = message.IsRead,
            CreatedAt = message.CreatedAt
        };

        // Broadcast to all connected clients in the application room so chat
        // updates in real-time without the other party needing to refresh.
        await _chatHub.Clients.Group($"app-{id}").SendAsync("ReceiveMessage", new
        {
            id          = responseDto.Id,
            applicationId = responseDto.ApplicationId,
            senderId    = responseDto.SenderId,
            senderEmail = responseDto.SenderEmail,
            receiverId  = responseDto.ReceiverId,
            messageText = responseDto.MessageText,
            isRead      = responseDto.IsRead,
            createdAt   = responseDto.CreatedAt
        });

        return Ok(responseDto);
    }

    private ApplicationResponseDto MapToDto(FundingApplication app)
    {
        return new ApplicationResponseDto
        {
            Id = app.Id,
            UserId = app.UserId,
            CompanyName = app.CompanyName,
            ContactName = app.ContactName,
            Email = app.Email,
            Phone = app.Phone,
            Industry = app.Industry,
            PoAmount = app.PoAmount,
            CostOfDelivery = app.CostOfDelivery,
            AmountNeeded = app.AmountNeeded,
            CustomerName = app.CustomerName,
            PaymentTerms = app.PaymentTerms,
            Description = app.Description,
            Status = ApplicationStatus.Normalize(app.Status),
            RefCode = app.RefCode,
            AssignedFunderId = app.AssignedFunderId,
            AssignedFunderUserId = app.AssignedFunder?.UserId,
            AssignedFunderCompany = app.AssignedFunder?.CompanyName,
            PlatformFeePercent = app.PlatformFeePercent ?? PlatformFee.ResolvePercent(_config),
            EstimatedPlatformFee = PlatformFee.Calculate(app.AmountNeeded, app.PlatformFeePercent ?? PlatformFee.ResolvePercent(_config)),
            PlatformFeeAmount = app.PlatformFeeAmount,
            CreatedAt = app.CreatedAt,
            UpdatedAt = app.UpdatedAt,
            Documents = app.Documents.Select(d => new DocumentResponseDto
            {
                Id = d.Id,
                DocumentType = d.DocumentType,
                FileName = d.FileName,
                FileSize = d.FileSize,
                CreatedAt = d.CreatedAt
            }).ToList()
        };
    }

    private async Task PromoteWhenPurchaseOrderUploadedAsync(FundingApplication app, string documentType)
    {
        if (!ApplicationStatus.IsPurchaseOrder(documentType)) return;
        if (!ApplicationStatus.IsProvisional(app.Status)) return;

        app.Status = ApplicationStatus.ReadyForFunding;
        app.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        _logger.LogInformation("Application READY FOR FUNDING: {RefCode} (purchase order uploaded)", app.RefCode);

        await _notificationHub.Clients.Group("funders").SendAsync("NewOpportunity", new
        {
            refCode = app.RefCode,
            companyName = app.CompanyName,
            amount = app.AmountNeeded,
            industry = app.Industry
        });
    }

    private bool CanAccessApplication(FundingApplication app, Guid userId, List<string> roles)
    {
        if (app.UserId == userId) return true;
        if (roles.Contains("funder")) return true;
        return false;
    }

    private Guid GetUserId() =>
        Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);

    private List<string> GetRoles() =>
        User.FindAll(ClaimTypes.Role).Select(c => c.Value).ToList();
}
