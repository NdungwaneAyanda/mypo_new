using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using MyPO.API.Data;
using MyPO.API.Models.DTOs;
using MyPO.API.Models.Entities;
using MyPO.API.Services;

namespace MyPO.API.Controllers;

[ApiController]
[Route("api/auth")]
[EnableRateLimiting("auth")]
public class AuthController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly TokenService _tokenService;
    private readonly RefCodeService _refCodeService;
    private readonly IEmailService _emailService;
    private readonly IConfiguration _config;
    private readonly ILogger<AuthController> _logger;

    public AuthController(AppDbContext db, TokenService tokenService, RefCodeService refCodeService,
        IEmailService emailService, IConfiguration config, ILogger<AuthController> logger)
    {
        _db = db;
        _tokenService = tokenService;
        _refCodeService = refCodeService;
        _emailService = emailService;
        _config = config;
        _logger = logger;
    }

    [HttpPost("register")]
    public async Task<ActionResult<AuthResponseDto>> Register(RegisterDto dto)
    {
        if (await _db.Users.AnyAsync(u => u.Email == dto.Email.ToLower()))
        {
            _logger.LogWarning("Registration attempt with already-used email {Email}", dto.Email.ToLower());
            return BadRequest(new { message = "Email already in use." });
        }

        var user = new User
        {
            Email = dto.Email.ToLower(),
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
            EmailConfirmed = true
        };

        _db.Users.Add(user);

        var refCode = await _refCodeService.GenerateSupplierRefAsync();
        var profile = new Profile
        {
            Id = user.Id,
            Email = user.Email,
            RefCode = refCode,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _db.Profiles.Add(profile);

        var role = new UserRole { UserId = user.Id, Role = "supplier" };
        _db.UserRoles.Add(role);

        await _db.SaveChangesAsync();
        _logger.LogInformation("New supplier registered: {Email} | RefCode: {RefCode}", user.Email, refCode);

        var roles = new List<string> { "supplier" };
        var token = _tokenService.CreateToken(user, roles);

        return Ok(new AuthResponseDto
        {
            Token = token,
            User = new UserDto
            {
                Id = user.Id,
                Email = user.Email,
                Roles = roles,
                Profile = new ProfileDto { Email = profile.Email, RefCode = profile.RefCode }
            }
        });
    }

    [HttpPost("login")]
    public async Task<ActionResult<AuthResponseDto>> Login(LoginDto dto)
    {
        var user = await _db.Users
            .Include(u => u.Profile)
            .Include(u => u.Roles)
            .FirstOrDefaultAsync(u => u.Email == dto.Email.ToLower());

        if (user == null || !BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash))
        {
            _logger.LogWarning("Failed login attempt for {Email}", dto.Email.ToLower());
            return Unauthorized(new { message = "Invalid email or password." });
        }
        _logger.LogInformation("User logged in: {Email}", user.Email);

        var roles = user.Roles.Select(r => r.Role).ToList();
        var token = _tokenService.CreateToken(user, roles);

        return Ok(new AuthResponseDto
        {
            Token = token,
            User = new UserDto
            {
                Id = user.Id,
                Email = user.Email,
                Roles = roles,
                Profile = user.Profile == null ? null : new ProfileDto
                {
                    CompanyName = user.Profile.CompanyName,
                    ContactName = user.Profile.ContactName,
                    Email = user.Profile.Email,
                    Phone = user.Profile.Phone,
                    RefCode = user.Profile.RefCode
                }
            }
        });
    }

    [HttpPost("forgot-password")]
    public async Task<IActionResult> ForgotPassword(ForgotPasswordDto dto)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == dto.Email.ToLower());
        if (user == null)
            return Ok(new { message = "If that email exists, a reset link has been sent." });

        user.PasswordResetToken = Guid.NewGuid().ToString("N");
        user.PasswordResetExpires = DateTime.UtcNow.AddHours(1);
        await _db.SaveChangesAsync();
        _logger.LogInformation("Password reset requested for {Email}", dto.Email.ToLower());

        var frontendUrl = _config["FrontendUrl"] ?? "http://localhost:4200";
        var resetLink = $"{frontendUrl}/reset-password?token={user.PasswordResetToken}";
        await _emailService.SendPasswordResetEmailAsync(user.Email, resetLink);

        return Ok(new { message = "If that email exists, a reset link has been sent." });
    }

    [HttpPost("reset-password")]
    public async Task<IActionResult> ResetPassword(ResetPasswordDto dto)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u =>
            u.PasswordResetToken == dto.Token &&
            u.PasswordResetExpires > DateTime.UtcNow);

        if (user == null)
            return BadRequest(new { message = "Invalid or expired reset token." });

        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.NewPassword);
        user.PasswordResetToken = null;
        user.PasswordResetExpires = null;
        await _db.SaveChangesAsync();

        return Ok(new { message = "Password reset successfully." });
    }

    [Authorize]
    [HttpGet("me")]
    public async Task<ActionResult<UserDto>> GetMe()
    {
        var userId = GetUserId();
        var user = await _db.Users
            .Include(u => u.Profile)
            .Include(u => u.Roles)
            .FirstOrDefaultAsync(u => u.Id == userId);

        if (user == null) return NotFound();

        return Ok(new UserDto
        {
            Id = user.Id,
            Email = user.Email,
            Roles = user.Roles.Select(r => r.Role).ToList(),
            Profile = user.Profile == null ? null : new ProfileDto
            {
                CompanyName = user.Profile.CompanyName,
                ContactName = user.Profile.ContactName,
                Email = user.Profile.Email,
                Phone = user.Profile.Phone,
                RefCode = user.Profile.RefCode
            }
        });
    }

    private Guid GetUserId() =>
        Guid.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)!.Value);
}
