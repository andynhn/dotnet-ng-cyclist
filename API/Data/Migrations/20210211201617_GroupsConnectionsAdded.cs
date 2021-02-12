using Microsoft.EntityFrameworkCore.Migrations;

namespace API.Data.Migrations
{
    public partial class GroupsConnectionsAdded : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "CyclingCategory",
                table: "AspNetUsers",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CyclingFrequency",
                table: "AspNetUsers",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "SkillLevel",
                table: "AspNetUsers",
                type: "TEXT",
                nullable: true);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CyclingCategory",
                table: "AspNetUsers");

            migrationBuilder.DropColumn(
                name: "CyclingFrequency",
                table: "AspNetUsers");

            migrationBuilder.DropColumn(
                name: "SkillLevel",
                table: "AspNetUsers");
        }
    }
}
