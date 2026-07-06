using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MyPO.API.Data;
using MyPO.API.Models.DTOs;
using System.Security.Claims;

namespace MyPO.API.Controllers;

[Authorize]
[ApiController]
[Route("api/profile")]
public class ProfileController : ControllerBase
{
    private readonly AppDbContext _db;

    public ProfileController(AppDbContext db) => _db = db;

    [HttpGet]
    public async Task<ActionResult<ProfileDto>> GetProfile()
    {
        var userId = GetUserId();
        var profile = await _db.Profiles.FirstOrDefaultAsync(p => p.Id == userId);
        if (profile == null) return NotFound();

        return Ok(new ProfileDto
        {
            CompanyName = profile.CompanyName,
            ContactName = profile.ContactName,
            Email = profile.Email,
            Phone = profile.Phone,
            RefCode = profile.RefCode
        });
    }

    [HttpPut]
    public async Task<ActionResult<ProfileDto>> UpdateProfile(UpdateProfileDto dto)
    {
        var userId = GetUserId();
        var profile = await _db.Profiles.FirstOrDefaultAsync(p => p.Id == userId);
        if (profile == null) return NotFound();

        if (dto.CompanyName != null) profile.CompanyName = dto.CompanyName;
        if (dto.ContactName != null) profile.ContactName = dto.ContactName;
        if (dto.Phone != null) profile.Phone = dto.Phone;
        profile.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();

        return Ok(new ProfileDto
        {
            CompanyName = profile.CompanyName,
            ContactName = profile.ContactName,
            Email = profile.Email,
            Phone = profile.Phone,
            RefCode = profile.RefCode
        });
    }

    private Guid GetUserId() =>
        Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
}
