using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MyPO.API.Models.Entities;

[Table("registered_funders")]
public class RegisteredFunder
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

    [Column("company_website")]
    public string? CompanyWebsite { get; set; }

    [Column("years_in_business")]
    public int? YearsInBusiness { get; set; }

    [Column("funding_capacity")]
    public string? FundingCapacity { get; set; }

    [Column("funding_description")]
    public string? FundingDescription { get; set; }

    [Column("industries", TypeName = "text[]")]
    public string[] Industries { get; set; } = Array.Empty<string>();

    [Column("min_po_amount")]
    public decimal? MinPoAmount { get; set; }

    [Column("max_po_amount")]
    public decimal? MaxPoAmount { get; set; }

    [Column("is_active")]
    public bool IsActive { get; set; } = true;

    [Column("unsubscribe_token")]
    public string? UnsubscribeToken { get; set; }

    [Column("ref_code")]
    public string? RefCode { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<FundingApplication> AssignedApplications { get; set; } = new List<FundingApplication>();
}
