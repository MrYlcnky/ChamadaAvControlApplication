using Microsoft.EntityFrameworkCore.Metadata;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AVControl.Data.Migrations
{
    /// <inheritdoc />
    public partial class FavoriTakimLigIliskisi : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "FavoriTakimLigleri",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    FavoriTakimId = table.Column<int>(type: "int", nullable: false),
                    LigAdi = table.Column<string>(type: "varchar(255)", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    AktifMi = table.Column<bool>(type: "tinyint(1)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FavoriTakimLigleri", x => x.Id);
                    table.ForeignKey(
                        name: "FK_FavoriTakimLigleri_FavoriTakimlar_FavoriTakimId",
                        column: x => x.FavoriTakimId,
                        principalTable: "FavoriTakimlar",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateIndex(
                name: "IX_FavoriTakimLigleri_FavoriTakimId_LigAdi",
                table: "FavoriTakimLigleri",
                columns: new[] { "FavoriTakimId", "LigAdi" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "FavoriTakimLigleri");
        }
    }
}
