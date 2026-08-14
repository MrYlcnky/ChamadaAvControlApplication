using System;
using Microsoft.EntityFrameworkCore.Metadata;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AVControl.Data.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterDatabase()
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "IrTransmitters",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    CihazAdi = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    IpAdresi = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    MacAdresi = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    CihazGorselUrl = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    AktifMi = table.Column<bool>(type: "tinyint(1)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_IrTransmitters", x => x.Id);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "Kullanicilar",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    Ad = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Soyad = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    KullaniciAdi = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    SifreHash = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    PinKodu = table.Column<int>(type: "int", nullable: true),
                    Rol = table.Column<int>(type: "int", nullable: false),
                    AktifMi = table.Column<bool>(type: "tinyint(1)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Kullanicilar", x => x.Id);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "LedProcessors",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    CihazAdi = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    IpAdresi = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Port = table.Column<int>(type: "int", nullable: false),
                    MacAdresi = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    KullanicidaGosterilsinMi = table.Column<bool>(type: "tinyint(1)", nullable: false),
                    ViplexKontroluVarMi = table.Column<bool>(type: "tinyint(1)", nullable: false),
                    CihazGorselUrl = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    CihazMarka = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    SeriNo = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    KullaniciAdi = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Sifre = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    AktifMi = table.Column<bool>(type: "tinyint(1)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LedProcessors", x => x.Id);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "MatrixDevices",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    CihazAdi = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    IpAdresi = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    TelnetPort = table.Column<int>(type: "int", nullable: false),
                    MacAdresi = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    InputSayisi = table.Column<int>(type: "int", nullable: false),
                    OutputSayisi = table.Column<int>(type: "int", nullable: false),
                    CihazGorselUrl = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    AktifMi = table.Column<bool>(type: "tinyint(1)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MatrixDevices", x => x.Id);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "RemoteControls",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    CihazTipi = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    KumandaMarkaModel = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    ProtokolTipi = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    AktifMi = table.Column<bool>(type: "tinyint(1)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RemoteControls", x => x.Id);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "IslemLoglari",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    KullaniciId = table.Column<int>(type: "int", nullable: false),
                    IslemTipi = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Detaylar = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    OlusturulmaTarihi = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    AktifMi = table.Column<bool>(type: "tinyint(1)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_IslemLoglari", x => x.Id);
                    table.ForeignKey(
                        name: "FK_IslemLoglari_Kullanicilar_KullaniciId",
                        column: x => x.KullaniciId,
                        principalTable: "Kullanicilar",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "InputSources",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    InputName = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    MatrixDeviceId = table.Column<int>(type: "int", nullable: false),
                    RemoteControlId = table.Column<int>(type: "int", nullable: true),
                    PortNumarasi = table.Column<int>(type: "int", nullable: false),
                    KanalKontrolVarMi = table.Column<bool>(type: "tinyint(1)", nullable: false),
                    IrTransmitterId = table.Column<int>(type: "int", nullable: true),
                    AktifMi = table.Column<bool>(type: "tinyint(1)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_InputSources", x => x.Id);
                    table.ForeignKey(
                        name: "FK_InputSources_IrTransmitters_IrTransmitterId",
                        column: x => x.IrTransmitterId,
                        principalTable: "IrTransmitters",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_InputSources_MatrixDevices_MatrixDeviceId",
                        column: x => x.MatrixDeviceId,
                        principalTable: "MatrixDevices",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_InputSources_RemoteControls_RemoteControlId",
                        column: x => x.RemoteControlId,
                        principalTable: "RemoteControls",
                        principalColumn: "Id");
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "OutputZones",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    MatrixDeviceId = table.Column<int>(type: "int", nullable: false),
                    LedProcessorId = table.Column<int>(type: "int", nullable: true),
                    PortKodu = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    BolgeAdi = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    GuncelInputSourceId = table.Column<int>(type: "int", nullable: true),
                    GuncelChannelListId = table.Column<int>(type: "int", nullable: true),
                    RemoteControlId = table.Column<int>(type: "int", nullable: true),
                    IrTransmitterId = table.Column<int>(type: "int", nullable: true),
                    AktifMi = table.Column<bool>(type: "tinyint(1)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_OutputZones", x => x.Id);
                    table.ForeignKey(
                        name: "FK_OutputZones_IrTransmitters_IrTransmitterId",
                        column: x => x.IrTransmitterId,
                        principalTable: "IrTransmitters",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_OutputZones_LedProcessors_LedProcessorId",
                        column: x => x.LedProcessorId,
                        principalTable: "LedProcessors",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_OutputZones_MatrixDevices_MatrixDeviceId",
                        column: x => x.MatrixDeviceId,
                        principalTable: "MatrixDevices",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_OutputZones_RemoteControls_RemoteControlId",
                        column: x => x.RemoteControlId,
                        principalTable: "RemoteControls",
                        principalColumn: "Id");
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "RemoteButtons",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    RemoteControlId = table.Column<int>(type: "int", nullable: false),
                    TusKodu = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    RawDataJson = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    AktifMi = table.Column<bool>(type: "tinyint(1)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RemoteButtons", x => x.Id);
                    table.ForeignKey(
                        name: "FK_RemoteButtons_RemoteControls_RemoteControlId",
                        column: x => x.RemoteControlId,
                        principalTable: "RemoteControls",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "ChannelLists",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    InputSourceId = table.Column<int>(type: "int", nullable: false),
                    KanalNumarasi = table.Column<int>(type: "int", nullable: false),
                    KanalAdi = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    LogoUrl = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    KullanicidaGosterilsinMi = table.Column<bool>(type: "tinyint(1)", nullable: false),
                    AktifMi = table.Column<bool>(type: "tinyint(1)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ChannelLists", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ChannelLists_InputSources_InputSourceId",
                        column: x => x.InputSourceId,
                        principalTable: "InputSources",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.InsertData(
                table: "Kullanicilar",
                columns: new[] { "Id", "Ad", "AktifMi", "KullaniciAdi", "PinKodu", "Rol", "SifreHash", "Soyad" },
                values: new object[] { 1, "Sistem", true, "IT", 6161, 1, "$2a$11$nB8kNi06IPQiG//LeYdNqe10O54oTT9NvQ5QASZ641yBgrbT9mZlq", "Yöneticisi" });

            migrationBuilder.CreateIndex(
                name: "IX_ChannelLists_InputSourceId",
                table: "ChannelLists",
                column: "InputSourceId");

            migrationBuilder.CreateIndex(
                name: "IX_InputSources_IrTransmitterId",
                table: "InputSources",
                column: "IrTransmitterId");

            migrationBuilder.CreateIndex(
                name: "IX_InputSources_MatrixDeviceId",
                table: "InputSources",
                column: "MatrixDeviceId");

            migrationBuilder.CreateIndex(
                name: "IX_InputSources_RemoteControlId",
                table: "InputSources",
                column: "RemoteControlId");

            migrationBuilder.CreateIndex(
                name: "IX_IslemLoglari_KullaniciId",
                table: "IslemLoglari",
                column: "KullaniciId");

            migrationBuilder.CreateIndex(
                name: "IX_OutputZones_IrTransmitterId",
                table: "OutputZones",
                column: "IrTransmitterId");

            migrationBuilder.CreateIndex(
                name: "IX_OutputZones_LedProcessorId",
                table: "OutputZones",
                column: "LedProcessorId");

            migrationBuilder.CreateIndex(
                name: "IX_OutputZones_MatrixDeviceId",
                table: "OutputZones",
                column: "MatrixDeviceId");

            migrationBuilder.CreateIndex(
                name: "IX_OutputZones_RemoteControlId",
                table: "OutputZones",
                column: "RemoteControlId");

            migrationBuilder.CreateIndex(
                name: "IX_RemoteButtons_RemoteControlId",
                table: "RemoteButtons",
                column: "RemoteControlId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ChannelLists");

            migrationBuilder.DropTable(
                name: "IslemLoglari");

            migrationBuilder.DropTable(
                name: "OutputZones");

            migrationBuilder.DropTable(
                name: "RemoteButtons");

            migrationBuilder.DropTable(
                name: "InputSources");

            migrationBuilder.DropTable(
                name: "Kullanicilar");

            migrationBuilder.DropTable(
                name: "LedProcessors");

            migrationBuilder.DropTable(
                name: "IrTransmitters");

            migrationBuilder.DropTable(
                name: "MatrixDevices");

            migrationBuilder.DropTable(
                name: "RemoteControls");
        }
    }
}
