using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MyPO.API.Models.Entities;

[Table("application_documents")]
public class ApplicationDocument
{
    [Key]
    [Column("id")]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Column("application_id")]
    public Guid ApplicationId { get; set; }

    [ForeignKey("ApplicationId")]
    public FundingApplication Application { get; set; } = null!;

    [Column("document_type")]
    public string DocumentType { get; set; } = string.Empty;

    [Column("file_name")]
    public string FileName { get; set; } = string.Empty;

    [Column("file_path")]
    public string FilePath { get; set; } = string.Empty;

    [Column("file_size")]
    public long FileSize { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
