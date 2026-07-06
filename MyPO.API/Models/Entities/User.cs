using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MyPO.API.Models.Entities;

[Table("users")]
public class User
{
    [Key]
    [Column("id")]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Column("email")]
    public string Email { get; set; } = string.Empty;

    [Column("password_hash")]
    public string PasswordHash { get; set; } = string.Empty;

    [Column("email_confirmed")]
    public bool EmailConfirmed { get; set; } = false;

    [Column("email_confirmation_token")]
    public string? EmailConfirmationToken { get; set; }

    [Column("password_reset_token")]
    public string? PasswordResetToken { get; set; }

    [Column("password_reset_expires")]
    public DateTime? PasswordResetExpires { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public Profile? Profile { get; set; }
    public ICollection<UserRole> Roles { get; set; } = new List<UserRole>();
    public ICollection<FundingApplication> Applications { get; set; } = new List<FundingApplication>();
    public ICollection<ApplicationMessage> SentMessages { get; set; } = new List<ApplicationMessage>();
    public ICollection<ApplicationMessage> ReceivedMessages { get; set; } = new List<ApplicationMessage>();
}
