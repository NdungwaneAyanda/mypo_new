using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MyPO.API.Data;
using MyPO.API.Models.DTOs;
using MyPO.API.Models.Entities;
using System.Security.Claims;

namespace MyPO.API.Controllers;

[Authorize(Roles = "admin")]
[ApiController]
[Route("api/admin")]
public class AdminController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly ILogger<AdminController> _logger;

    public AdminController(AppDbContext db, ILogger<AdminController> logger)
    {
        _db     = db;
        _logger = logger;
    }

    // ── Stats ─────────────────────────────────────────────────────────────────

    [HttpGet("stats")]
    public async Task<ActionResult<AdminStatsDto>> GetStats()
    {
        var apps = await _db.FundingApplications.ToListAsync();

        return Ok(new AdminStatsDto
        {
            TotalUsers               = await _db.Users.CountAsync(),
            TotalApplications        = apps.Count,
            TotalFunders             = await _db.RegisteredFunders.CountAsync(),
            PendingCount             = apps.Count(a => a.Status == "pending"),
            ReviewedCount            = apps.Count(a => a.Status == "reviewed"),
            FundedCount              = apps.Count(a => a.Status == "successful"),
            TotalFundingRequested    = apps.Sum(a => a.AmountNeeded)
        });
    }

    // ── Users ─────────────────────────────────────────────────────────────────

    [HttpGet("users")]
    public async Task<ActionResult<List<AdminUserDto>>> GetUsers()
    {
        var users = await _db.Users
            .Include(u => u.Roles)
            .Include(u => u.Profile)
            .Include(u => u.Applications)
            .OrderByDescending(u => u.CreatedAt)
            .ToListAsync();

        return Ok(users.Select(u => new AdminUserDto
        {
            Id               = u.Id,
            Email            = u.Email,
            Roles            = u.Roles.Select(r => r.Role).ToList(),
            RefCode          = u.Profile?.RefCode,
            CompanyName      = u.Profile?.CompanyName,
            CreatedAt        = u.CreatedAt,
            ApplicationCount = u.Applications.Count
        }).ToList());
    }

    [HttpPut("users/{id}/role")]
    public async Task<IActionResult> SetUserRole(Guid id, SetRoleDto dto)
    {
        var user = await _db.Users.Include(u => u.Roles).FirstOrDefaultAsync(u => u.Id == id);
        if (user == null) return NotFound();

        // Prevent removing admin role from yourself
        var callerId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        if (id == callerId && dto.Role == "admin" && dto.Action == "remove")
            return BadRequest(new { message = "You cannot remove your own admin role." });

        if (dto.Action == "add")
        {
            if (!user.Roles.Any(r => r.Role == dto.Role))
                _db.UserRoles.Add(new UserRole { UserId = id, Role = dto.Role });
        }
        else
        {
            var role = user.Roles.FirstOrDefault(r => r.Role == dto.Role);
            if (role != null) _db.UserRoles.Remove(role);
        }

        await _db.SaveChangesAsync();
        _logger.LogInformation("Admin {Admin} {Action}ed role '{Role}' on user {UserId}",
            callerId, dto.Action, dto.Role, id);

        return Ok(new { message = $"Role '{dto.Role}' {dto.Action}ed successfully." });
    }

    [HttpDelete("users/{id}")]
    public async Task<IActionResult> DeleteUser(Guid id)
    {
        var callerId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        if (id == callerId) return BadRequest(new { message = "You cannot delete your own account." });

        var user = await _db.Users.FindAsync(id);
        if (user == null) return NotFound();

        _db.Users.Remove(user);
        await _db.SaveChangesAsync();
        _logger.LogWarning("Admin {Admin} deleted user {Email} ({UserId})", callerId, user.Email, id);

        return Ok(new { message = "User deleted." });
    }

    // ── Applications ──────────────────────────────────────────────────────────

    [HttpGet("applications")]
    public async Task<ActionResult<List<AdminApplicationDto>>> GetApplications()
    {
        var apps = await _db.FundingApplications
            .Include(a => a.Documents)
            .Include(a => a.AssignedFunder)
            .OrderByDescending(a => a.CreatedAt)
            .ToListAsync();

        return Ok(apps.Select(a => new AdminApplicationDto
        {
            Id                    = a.Id,
            UserId                = a.UserId,
            RefCode               = a.RefCode ?? a.Id.ToString()[..8].ToUpper(),
            CompanyName           = a.CompanyName,
            Email                 = a.Email,
            Industry              = a.Industry ?? string.Empty,
            Status                = a.Status,
            PoAmount              = a.PoAmount,
            AmountNeeded          = a.AmountNeeded,
            PaymentTerms          = a.PaymentTerms,
            AssignedFunderCompany = a.AssignedFunder?.CompanyName,
            DocumentCount         = a.Documents.Count,
            CreatedAt             = a.CreatedAt,
            UpdatedAt             = a.UpdatedAt
        }).ToList());
    }

    [HttpPut("applications/{id}/status")]
    public async Task<IActionResult> SetApplicationStatus(Guid id, SetStatusDto dto)
    {
        var validStatuses = new[] { "pending", "reviewed", "successful", "declined" };
        if (!validStatuses.Contains(dto.Status))
            return BadRequest(new { message = "Invalid status value." });

        var app = await _db.FundingApplications.FindAsync(id);
        if (app == null) return NotFound();

        var prev = app.Status;
        app.Status    = dto.Status;
        app.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        var adminId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        _logger.LogInformation("Admin {Admin} changed application {RefCode} status: {Prev} → {New}",
            adminId, app.RefCode, prev, dto.Status);

        return Ok(new { message = $"Status updated to '{dto.Status}'." });
    }

    [HttpDelete("applications/{id}")]
    public async Task<IActionResult> DeleteApplication(Guid id)
    {
        var app = await _db.FundingApplications.FindAsync(id);
        if (app == null) return NotFound();

        _db.FundingApplications.Remove(app);
        await _db.SaveChangesAsync();

        var adminId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        _logger.LogWarning("Admin {Admin} deleted application {RefCode}", adminId, app.RefCode);

        return Ok(new { message = "Application deleted." });
    }

    // ── Funders ───────────────────────────────────────────────────────────────

    [HttpGet("funders")]
    public async Task<ActionResult<List<AdminFunderDto>>> GetFunders()
    {
        var funders = await _db.RegisteredFunders
            .Include(f => f.AssignedApplications)
            .OrderByDescending(f => f.CreatedAt)
            .ToListAsync();

        return Ok(funders.Select(f => new AdminFunderDto
        {
            Id              = f.Id,
            UserId          = f.UserId,
            RefCode         = f.RefCode ?? f.Id.ToString()[..8].ToUpper(),
            CompanyName     = f.CompanyName,
            Email           = f.Email,
            FundingCapacity = f.FundingCapacity,
            IsActive        = f.IsActive,
            ClaimedCount    = f.AssignedApplications.Count,
            CreatedAt       = f.CreatedAt
        }).ToList());
    }

    [HttpPut("funders/{id}/active")]
    public async Task<IActionResult> SetFunderActive(Guid id, SetActiveDto dto)
    {
        var funder = await _db.RegisteredFunders.FindAsync(id);
        if (funder == null) return NotFound();

        funder.IsActive = dto.IsActive;
        await _db.SaveChangesAsync();

        var adminId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        _logger.LogInformation("Admin {Admin} set funder {Company} IsActive={Active}",
            adminId, funder.CompanyName, dto.IsActive);

        return Ok(new { message = $"Funder {(dto.IsActive ? "activated" : "deactivated")}." });
    }
}
