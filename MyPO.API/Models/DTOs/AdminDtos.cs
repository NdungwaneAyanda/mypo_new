using System.ComponentModel.DataAnnotations;

namespace MyPO.API.Models.DTOs;

public class AdminStatsDto
{
    public int TotalUsers        { get; set; }
    public int TotalApplications { get; set; }
    public int TotalFunders      { get; set; }
    public int PendingCount      { get; set; }
    public int FundedCount       { get; set; }
    public int ReviewedCount     { get; set; }
    public decimal TotalFundingRequested { get; set; }
}

public class AdminUserDto
{
    public Guid     Id        { get; set; }
    public string   Email     { get; set; } = string.Empty;
    public List<string> Roles { get; set; } = new();
    public string?  RefCode   { get; set; }
    public string?  CompanyName { get; set; }
    public DateTime CreatedAt { get; set; }
    public int      ApplicationCount { get; set; }
}

public class AdminApplicationDto
{
    public Guid     Id            { get; set; }
    public Guid     UserId        { get; set; }
    public string   RefCode       { get; set; } = string.Empty;
    public string   CompanyName   { get; set; } = string.Empty;
    public string   Email         { get; set; } = string.Empty;
    public string   Industry      { get; set; } = string.Empty;
    public string   Status        { get; set; } = string.Empty;
    public decimal  PoAmount      { get; set; }
    public decimal  AmountNeeded  { get; set; }
    public string?  PaymentTerms  { get; set; }
    public string?  AssignedFunderCompany { get; set; }
    public int      DocumentCount { get; set; }
    public DateTime CreatedAt     { get; set; }
    public DateTime UpdatedAt     { get; set; }
}

public class AdminFunderDto
{
    public Guid     Id            { get; set; }
    public Guid     UserId        { get; set; }
    public string   RefCode       { get; set; } = string.Empty;
    public string   CompanyName   { get; set; } = string.Empty;
    public string   Email         { get; set; } = string.Empty;
    public string?  FundingCapacity { get; set; }
    public bool     IsActive      { get; set; }
    public int      ClaimedCount  { get; set; }
    public DateTime CreatedAt     { get; set; }
}

public class SetRoleDto
{
    [Required] public string Role   { get; set; } = string.Empty;
    [Required] public string Action { get; set; } = "add"; // "add" | "remove"
}

public class SetStatusDto
{
    [Required] public string Status { get; set; } = string.Empty;
}

public class SetActiveDto
{
    public bool IsActive { get; set; }
}
