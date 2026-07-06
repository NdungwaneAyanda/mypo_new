using System.ComponentModel.DataAnnotations;

namespace MyPO.API.Models.DTOs;

public class RegisterFunderSignupDto
{
    [Required, EmailAddress] public string Email    { get; set; } = string.Empty;
    [Required, MinLength(8)] public string Password { get; set; } = string.Empty;
    [Required] public string CompanyName      { get; set; } = string.Empty;
    [Required] public string ContactName      { get; set; } = string.Empty;
    [Required] public string Phone            { get; set; } = string.Empty;
    public string? CompanyWebsite             { get; set; }
    public int? YearsInBusiness               { get; set; }
    public string? FundingCapacity            { get; set; }
    public string? FundingDescription         { get; set; }
    public List<string> Industries            { get; set; } = new();
    public decimal? MinPoAmount               { get; set; }
    public decimal? MaxPoAmount               { get; set; }
}

public class RegisterFunderDto
{
    [Required] public string CompanyName { get; set; } = string.Empty;
    [Required] public string ContactName { get; set; } = string.Empty;
    [Required, EmailAddress] public string Email { get; set; } = string.Empty;
    [Required] public string Phone { get; set; } = string.Empty;
    public string? CompanyWebsite { get; set; }
    public int? YearsInBusiness { get; set; }
    public string? FundingCapacity { get; set; }
    public string? FundingDescription { get; set; }
    public List<string> Industries { get; set; } = new();
    public decimal? MinPoAmount { get; set; }
    public decimal? MaxPoAmount { get; set; }
}

public class FunderResponseDto
{
    public Guid Id { get; set; }
    public string CompanyName { get; set; } = string.Empty;
    public string ContactName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string? CompanyWebsite { get; set; }
    public int? YearsInBusiness { get; set; }
    public string? FundingCapacity { get; set; }
    public string? FundingDescription { get; set; }
    public List<string> Industries { get; set; } = new();
    public decimal? MinPoAmount { get; set; }
    public decimal? MaxPoAmount { get; set; }
    public bool IsActive { get; set; }
    public string? RefCode { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class ContactDto
{
    [Required] public string Name { get; set; } = string.Empty;
    [Required, EmailAddress] public string Email { get; set; } = string.Empty;
    [Required] public string Subject { get; set; } = string.Empty;
    [Required] public string Message { get; set; } = string.Empty;
}
