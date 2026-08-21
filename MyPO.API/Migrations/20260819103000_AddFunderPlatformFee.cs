using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MyPO.API.Migrations
{
    [DbContext(typeof(Data.AppDbContext))]
    [Migration("20260819103000_AddFunderPlatformFee")]
    public partial class AddFunderPlatformFee : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "platform_fee_amount",
                table: "funding_applications",
                type: "numeric(18,2)",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "platform_fee_percent",
                table: "funding_applications",
                type: "numeric(5,2)",
                nullable: true);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "platform_fee_amount",
                table: "funding_applications");

            migrationBuilder.DropColumn(
                name: "platform_fee_percent",
                table: "funding_applications");
        }
    }
}
