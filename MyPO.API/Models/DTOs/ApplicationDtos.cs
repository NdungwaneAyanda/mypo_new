using System.ComponentModel.DataAnnotations;

namespace MyPO.API.Models.DTOs;

public class CreateApplicationDto
{
    [Required, MaxLength(200)] public string CompanyName { get; set; } = string.Empty;
    [Required, MaxLength(200)] public string ContactName { get; set; } = string.Empty;
    [Required, EmailAddress, MaxLength(254)] public string Email { get; set; } = string.Empty;
    [Required, MaxLength(20)] public string Phone { get; set; } = string.Empty;
    [Required, MaxLength(100)] public string Industry { get; set; } = string.Empty;
    [Required, Range(0.01, 100_000_000)] public decimal PoAmount { get; set; }
    [Required, Range(0.01, 100_000_000)] public decimal CostOfDelivery { get; set; }
    [Required, Range(0.01, 100_000_000)] public decimal AmountNeeded { get; set; }
    [Required, MaxLength(200)] public string CustomerName { get; set; } = string.Empty;
    [Required, MaxLength(100)] public string PaymentTerms { get; set; } = string.Empty;
    [MaxLength(2000)] public string? Description { get; set; }
}

public class ApplicationResponseDto
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string CompanyName { get; set; } = string.Empty;
    public string ContactName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string Industry { get; set; } = string.Empty;
    public decimal PoAmount { get; set; }
    public decimal CostOfDelivery { get; set; }
    public decimal AmountNeeded { get; set; }
    public string CustomerName { get; set; } = string.Empty;
    public string PaymentTerms { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string Status { get; set; } = string.Empty;
    public string? RefCode { get; set; }
    public Guid? AssignedFunderId { get; set; }
    public string? AssignedFunderCompany { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public List<DocumentResponseDto> Documents { get; set; } = new();
}

public class DocumentResponseDto
{
    public Guid Id { get; set; }
    public string DocumentType { get; set; } = string.Empty;
    public string FileName { get; set; } = string.Empty;
    public long FileSize { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class ClaimApplicationDto
{
    [Required] public string Action { get; set; } = string.Empty; // "review" or "take"
}

public class MessageDto
{
    [Required, MaxLength(5000)] public string MessageText { get; set; } = string.Empty;
}

public class MessageResponseDto
{
    public Guid Id { get; set; }
    public Guid ApplicationId { get; set; }
    public Guid SenderId { get; set; }
    public string SenderEmail { get; set; } = string.Empty;
    public Guid ReceiverId { get; set; }
    public string MessageText { get; set; } = string.Empty;
    public bool IsRead { get; set; }
    public DateTime CreatedAt { get; set; }
}
