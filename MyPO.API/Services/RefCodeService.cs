using Microsoft.EntityFrameworkCore;
using MyPO.API.Data;

namespace MyPO.API.Services;

public class RefCodeService
{
    private readonly AppDbContext _db;

    public RefCodeService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<string> GenerateApplicationRefAsync()
    {
        var count = await _db.FundingApplications.CountAsync();
        return $"APP-{(count + 1):D4}";
    }

    public async Task<string> GenerateFunderRefAsync()
    {
        var count = await _db.RegisteredFunders.CountAsync();
        return $"FUN-{(count + 1):D4}";
    }

    public async Task<string> GenerateSupplierRefAsync()
    {
        var count = await _db.Profiles.CountAsync();
        return $"SUP-{(count + 1):D4}";
    }
}
