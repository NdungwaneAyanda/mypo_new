using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MyPO.API.Data;
using MyPO.API.Models.DTOs;
using MyPO.API.Models.Entities;
using MyPO.API.Services;
using System.Security.Claims;
using BCrypt.Net;

namespace MyPO.API.Controllers;

[ApiController]
[Route("api/funders")]
public class FundersController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly RefCodeService _refCodeService;
    private readonly TokenService _tokenService;
    private readonly ILogger<FundersController> _logger;

    public FundersController(AppDbContext db, RefCodeService refCodeService, TokenService tokenService, ILogger<FundersController> logger)
    {
        _db = db;
        _refCodeService = refCodeService;
        _tokenService = tokenService;
        _logger = logger;
    }

    // Public signup — creates a brand-new funder account (no prior login required)
    [HttpPost("signup")]
    public async Task<ActionResult<AuthResponseDto>> SignupFunder(RegisterFunderSignupDto dto)
    {
        var email = dto.Email.Trim().ToLower();
        if (await _db.Users.AnyAsync(u => u.Email == email))
            return BadRequest(new { message = "An account with this email already exists." });

        var user = new User
        {
            Email          = email,
            PasswordHash   = BCrypt.Net.BCrypt.HashPassword(dto.Password),
            EmailConfirmed = true
        };
        _db.Users.Add(user);
        _db.UserRoles.Add(new UserRole { UserId = user.Id, Role = "funder" });

        var refCode = await _refCodeService.GenerateFunderRefAsync();
        var funder = new RegisteredFunder
        {
            UserId             = user.Id,
            CompanyName        = dto.CompanyName,
            ContactName        = dto.ContactName,
            Email              = email,
            Phone              = dto.Phone,
            CompanyWebsite     = dto.CompanyWebsite,
            YearsInBusiness    = dto.YearsInBusiness,
            FundingCapacity    = dto.FundingCapacity,
            FundingDescription = dto.FundingDescription,
            Industries         = dto.Industries.ToArray(),
            MinPoAmount        = dto.MinPoAmount,
            MaxPoAmount        = dto.MaxPoAmount,
            UnsubscribeToken   = Guid.NewGuid().ToString("N"),
            RefCode            = refCode,
            IsActive           = true
        };
        _db.RegisteredFunders.Add(funder);
        await _db.SaveChangesAsync();

        _logger.LogInformation("New funder account created: {Email} | Company: {Company} | RefCode: {RefCode}",
            email, dto.CompanyName, refCode);

        var roles = new List<string> { "funder" };
        var token = _tokenService.CreateToken(user, roles);
        return Ok(new AuthResponseDto
        {
            Token = token,
            User  = new UserDto { Id = user.Id, Email = user.Email, Roles = roles }
        });
    }

    [Authorize]
    [HttpPost("register")]
    public async Task<ActionResult<FunderResponseDto>> RegisterFunder(RegisterFunderDto dto)
    {
        var userId = GetUserId();

        var existing = await _db.RegisteredFunders.FirstOrDefaultAsync(f => f.UserId == userId);
        if (existing != null)
            return BadRequest(new { message = "You are already registered as a funder." });

        var refCode = await _refCodeService.GenerateFunderRefAsync();

        var funder = new RegisteredFunder
        {
            UserId = userId,
            CompanyName = dto.CompanyName,
            ContactName = dto.ContactName,
            Email = dto.Email,
            Phone = dto.Phone,
            CompanyWebsite = dto.CompanyWebsite,
            YearsInBusiness = dto.YearsInBusiness,
            FundingCapacity = dto.FundingCapacity,
            FundingDescription = dto.FundingDescription,
            Industries = dto.Industries.ToArray(),
            MinPoAmount = dto.MinPoAmount,
            MaxPoAmount = dto.MaxPoAmount,
            UnsubscribeToken = Guid.NewGuid().ToString("N"),
            RefCode = refCode,
            IsActive = true
        };

        _db.RegisteredFunders.Add(funder);
        _logger.LogInformation("New funder registered: {Company} | RefCode: {RefCode} | UserId: {UserId}",
            dto.CompanyName, refCode, userId);

        var existingRole = await _db.UserRoles.FirstOrDefaultAsync(r => r.UserId == userId && r.Role == "funder");
        if (existingRole == null)
            _db.UserRoles.Add(new UserRole { UserId = userId, Role = "funder" });

        await _db.SaveChangesAsync();

        return Ok(MapToDto(funder));
    }

    [Authorize]
    [HttpGet("me")]
    public async Task<ActionResult<FunderResponseDto>> GetMyFunderProfile()
    {
        var userId = GetUserId();
        var funder = await _db.RegisteredFunders.FirstOrDefaultAsync(f => f.UserId == userId);
        if (funder == null) return NotFound();
        return Ok(MapToDto(funder));
    }

    private FunderResponseDto MapToDto(RegisteredFunder f) => new FunderResponseDto
    {
        Id = f.Id,
        CompanyName = f.CompanyName,
        ContactName = f.ContactName,
        Email = f.Email,
        Phone = f.Phone,
        CompanyWebsite = f.CompanyWebsite,
        YearsInBusiness = f.YearsInBusiness,
        FundingCapacity = f.FundingCapacity,
        FundingDescription = f.FundingDescription,
        Industries = f.Industries.ToList(),
        MinPoAmount = f.MinPoAmount,
        MaxPoAmount = f.MaxPoAmount,
        IsActive = f.IsActive,
        RefCode = f.RefCode,
        CreatedAt = f.CreatedAt
    };

    private Guid GetUserId() =>
        Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
}
