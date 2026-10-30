using Microsoft.EntityFrameworkCore.Metadata;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AVControl.Data.Migrations
{
    /// <inheritdoc />
    public partial class KullaniciBolgeYetkileri : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "KullaniciBolgeleri",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    KullaniciId = table.Column<int>(type: "int", nullable: false),
                    OutputZoneId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_KullaniciBolgeleri", x => x.Id);
                    table.ForeignKey(
                        name: "FK_KullaniciBolgeleri_Kullanicilar_KullaniciId",
                        column: x => x.KullaniciId,
                        principalTable: "Kullanicilar",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_KullaniciBolgeleri_OutputZones_OutputZoneId",
                        column: x => x.OutputZoneId,
                        principalTable: "OutputZones",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateIndex(
                name: "IX_KullaniciBolgeleri_KullaniciId_OutputZoneId",
                table: "KullaniciBolgeleri",
                columns: new[] { "KullaniciId", "OutputZoneId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_KullaniciBolgeleri_OutputZoneId",
                table: "KullaniciBolgeleri",
                column: "OutputZoneId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "KullaniciBolgeleri");
        }
    }
}
