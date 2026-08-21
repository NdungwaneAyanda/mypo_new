using Microsoft.Extensions.Configuration;

namespace MyPO.API.Models;

public static class PlatformFee
{
    public const decimal DefaultPercent = 2m;

    public static decimal ResolvePercent(IConfiguration config)
    {
        var raw = config.GetValue<decimal?>("Platform:FunderFeePercent");
        return raw is > 0 and <= 100 ? raw.Value : DefaultPercent;
    }

    public static decimal Calculate(decimal amountNeeded, decimal percent) =>
        Math.Round(amountNeeded * percent / 100m, 2, MidpointRounding.AwayFromZero);
}
