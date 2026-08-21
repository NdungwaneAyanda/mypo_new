using Microsoft.EntityFrameworkCore;
using MyPO.API.Models.Entities;

namespace MyPO.API.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<User> Users => Set<User>();
    public DbSet<Profile> Profiles => Set<Profile>();
    public DbSet<UserRole> UserRoles => Set<UserRole>();
    public DbSet<FundingApplication> FundingApplications => Set<FundingApplication>();
    public DbSet<RegisteredFunder> RegisteredFunders => Set<RegisteredFunder>();
    public DbSet<ApplicationDocument> ApplicationDocuments => Set<ApplicationDocument>();
    public DbSet<ApplicationMessage> ApplicationMessages => Set<ApplicationMessage>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<User>(entity =>
        {
            entity.HasIndex(u => u.Email).IsUnique();
        });

        modelBuilder.Entity<Profile>(entity =>
        {
            entity.HasOne(p => p.User)
                  .WithOne(u => u.Profile)
                  .HasForeignKey<Profile>(p => p.Id)
                  .OnDelete(DeleteBehavior.Cascade);
            entity.HasIndex(p => p.RefCode).IsUnique();
        });

        modelBuilder.Entity<UserRole>(entity =>
        {
            entity.HasOne(r => r.User)
                  .WithMany(u => u.Roles)
                  .HasForeignKey(r => r.UserId)
                  .OnDelete(DeleteBehavior.Cascade);
            entity.HasIndex(r => new { r.UserId, r.Role }).IsUnique();
        });

        modelBuilder.Entity<FundingApplication>(entity =>
        {
            entity.HasOne(a => a.User)
                  .WithMany(u => u.Applications)
                  .HasForeignKey(a => a.UserId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(a => a.AssignedFunder)
                  .WithMany(f => f.AssignedApplications)
                  .HasForeignKey(a => a.AssignedFunderId)
                  .OnDelete(DeleteBehavior.SetNull);

            entity.Property(a => a.PoAmount).HasColumnType("numeric(18,2)");
            entity.Property(a => a.CostOfDelivery).HasColumnType("numeric(18,2)");
            entity.Property(a => a.AmountNeeded).HasColumnType("numeric(18,2)");
            entity.Property(a => a.PlatformFeePercent).HasColumnType("numeric(5,2)");
            entity.Property(a => a.PlatformFeeAmount).HasColumnType("numeric(18,2)");
            entity.HasIndex(a => a.RefCode).IsUnique();
        });

        modelBuilder.Entity<RegisteredFunder>(entity =>
        {
            entity.HasOne(f => f.User)
                  .WithOne()
                  .HasForeignKey<RegisteredFunder>(f => f.UserId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.Property(f => f.Industries).HasColumnType("text[]");
            entity.Property(f => f.MinPoAmount).HasColumnType("numeric(18,2)");
            entity.Property(f => f.MaxPoAmount).HasColumnType("numeric(18,2)");
            entity.HasIndex(f => f.RefCode).IsUnique();
        });

        modelBuilder.Entity<ApplicationDocument>(entity =>
        {
            entity.HasOne(d => d.Application)
                  .WithMany(a => a.Documents)
                  .HasForeignKey(d => d.ApplicationId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<ApplicationMessage>(entity =>
        {
            entity.HasOne(m => m.Application)
                  .WithMany(a => a.Messages)
                  .HasForeignKey(m => m.ApplicationId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(m => m.Sender)
                  .WithMany(u => u.SentMessages)
                  .HasForeignKey(m => m.SenderId)
                  .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(m => m.Receiver)
                  .WithMany(u => u.ReceivedMessages)
                  .HasForeignKey(m => m.ReceiverId)
                  .OnDelete(DeleteBehavior.Restrict);
        });
    }
}
