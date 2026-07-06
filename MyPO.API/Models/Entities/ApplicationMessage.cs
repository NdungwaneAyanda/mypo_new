using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MyPO.API.Models.Entities;

[Table("application_messages")]
public class ApplicationMessage
{
    [Key]
    [Column("id")]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Column("application_id")]
    public Guid ApplicationId { get; set; }

    [ForeignKey("ApplicationId")]
    public FundingApplication Application { get; set; } = null!;

    [Column("sender_id")]
    public Guid SenderId { get; set; }

    [ForeignKey("SenderId")]
    public User Sender { get; set; } = null!;

    [Column("receiver_id")]
    public Guid ReceiverId { get; set; }

    [ForeignKey("ReceiverId")]
    public User Receiver { get; set; } = null!;

    [Column("message_text")]
    public string MessageText { get; set; } = string.Empty;

    [Column("is_read")]
    public bool IsRead { get; set; } = false;

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
