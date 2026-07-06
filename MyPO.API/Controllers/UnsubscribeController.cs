using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MyPO.API.Data;

namespace MyPO.API.Controllers;

[ApiController]
[Route("api/unsubscribe")]
public class UnsubscribeController : ControllerBase
{
    private readonly AppDbContext _db;

    public UnsubscribeController(AppDbContext db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> ValidateToken([FromQuery] string token)
    {
        var funder = await _db.RegisteredFunders.FirstOrDefaultAsync(f => f.UnsubscribeToken == token);
        if (funder == null) return NotFound(new { message = "Invalid token." });
        return Ok(new { email = funder.Email });
    }

    [HttpPost]
    public async Task<IActionResult> Confirm([FromBody] UnsubscribeRequest req)
    {
        var funder = await _db.RegisteredFunders.FirstOrDefaultAsync(f => f.UnsubscribeToken == req.Token);
        if (funder == null) return NotFound(new { message = "Invalid token." });

        funder.IsActive = false;
        funder.UnsubscribeToken = null;
        await _db.SaveChangesAsync();

        return Ok(new { message = "Unsubscribed successfully." });
    }
}

public record UnsubscribeRequest(string Token);
