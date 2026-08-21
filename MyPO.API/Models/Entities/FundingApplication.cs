using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using MyPO.API.Models;

namespace MyPO.API.Models.Entities;

[Table("funding_applications")]
public class FundingApplication
{
    [Key]
    [Column("id")]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Column("user_id")]
    public Guid UserId { get; set; }

    [ForeignKey("UserId")]
    public User User { get; set; } = null!;

    [Column("company_name")]
    public string CompanyName { get; set; } = string.Empty;

    [Column("contact_name")]
    public string ContactName { get; set; } = string.Empty;

    [Column("email")]
    public string Email { get; set; } = string.Empty;

    [Column("phone")]
    public string Phone { get; set; } = string.Empty;

    [Column("industry")]
    public string Industry { get; set; } = string.Empty;

    [Column("po_amount")]
    public decimal PoAmount { get; set; }

    [Column("cost_of_delivery")]
    public decimal CostOfDelivery { get; set; }

    [Column("amount_needed")]
    public decimal AmountNeeded { get; set; }

    [Column("platform_fee_percent")]
    public decimal? PlatformFeePercent { get; set; }

    [Column("platform_fee_amount")]
    public decimal? PlatformFeeAmount { get; set; }

    [Column("customer_name")]
    public string CustomerName { get; set; } = string.Empty;

    [Column("payment_terms")]
    public string PaymentTerms { get; set; } = string.Empty;

    [Column("description")]
    public string? Description { get; set; }

    [Column("status")]
    public string Status { get; set; } = ApplicationStatus.Provisional;

    [Column("assigned_funder_id")]
    public Guid? AssignedFunderId { get; set; }

    [ForeignKey("AssignedFunderId")]
    public RegisteredFunder? AssignedFunder { get; set; }

    [Column("ref_code")]
    public string? RefCode { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<ApplicationDocument> Documents { get; set; } = new List<ApplicationDocument>();
    public ICollection<ApplicationMessage> Messages { get; set; } = new List<ApplicationMessage>();
}
