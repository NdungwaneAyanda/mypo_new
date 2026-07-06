using System.ComponentModel.DataAnnotations;

namespace MyPO.API.Models.DTOs;

public class CreateApplicationDto
{
    [Required] public string CompanyName { get; set; } = string.Empty;
    [Required] public string ContactName { get; set; } = string.Empty;
    [Required, EmailAddress] public string Email { get; set; } = string.Empty;
    [Required] public string Phone { get; set; } = string.Empty;
    [Required] public string Industry { get; set; } = string.Empty;
    [Required] public decimal PoAmount { get; set; }
    [Required] public decimal CostOfDelivery { get; set; }
    [Required] public decimal AmountNeeded { get; set; }
    [Required] public string CustomerName { get; set; } = string.Empty;
    [Required] public string PaymentTerms { get; set; } = string.Empty;
    public string? Description { get; set; }
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
    public string Action { get; set; } = string.Empty; // "claim" or "take"
}

public class MessageDto
{
    [Required] public string MessageText { get; set; } = string.Empty;
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
