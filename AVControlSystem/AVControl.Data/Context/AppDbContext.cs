using AVControl.Core.Entities;
using AVControl.Core.Enums;
using Microsoft.EntityFrameworkCore;

namespace AVControl.Data.Context
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options)
            : base(options)
        {
        }

        public DbSet<Kullanici> Kullanicilar { get; set; }
        public DbSet<IslemLog> IslemLoglari { get; set; }
        public DbSet<MatrixDevice> MatrixDevices { get; set; }
        public DbSet<LedProcessor> LedProcessors { get; set; }
        public DbSet<RemoteControl> RemoteControls { get; set; }
        public DbSet<RemoteButton> RemoteButtons { get; set; }
        public DbSet<InputSource> InputSources { get; set; }
        public DbSet<OutputZone> OutputZones { get; set; }
        public DbSet<ChannelList> ChannelLists { get; set; }
        public DbSet<IrTransmitter> IrTransmitters { get; set; }

        public DbSet<FavoriTakim> FavoriTakimlar { get; set; }
        public DbSet<FavoriLig> FavoriLigler { get; set; }
        public DbSet<FavoriTakimLig> FavoriTakimLigleri { get; set; }
        public DbSet<MacTakvim> MacTakvimler { get; set; }

        // Kullanıcıya özel bölge yetkileri.
        public DbSet<KullaniciBolge> KullaniciBolgeleri { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<Kullanici>()
                .ToTable("Kullanicilar");

            modelBuilder.Entity<IslemLog>()
                .ToTable("IslemLoglari");

            modelBuilder.Entity<FavoriTakimLig>()
                .ToTable("FavoriTakimLigleri");

            modelBuilder.Entity<FavoriTakimLig>()
                .HasOne(x => x.FavoriTakim)
                .WithMany(x => x.FavoriTakimLigleri)
                .HasForeignKey(x => x.FavoriTakimId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<FavoriTakimLig>()
                .HasIndex(x => new
                {
                    x.FavoriTakimId,
                    x.LigAdi
                })
                .IsUnique();

            // Her kullanıcı bir bölgeyi yalnızca bir defa alabilir.
            modelBuilder.Entity<KullaniciBolge>(entity =>
            {
                entity.ToTable("KullaniciBolgeleri");
                entity.HasKey(x => x.Id);

                entity.HasIndex(x => new { x.KullaniciId, x.OutputZoneId })
                    .IsUnique();

                entity.HasOne(x => x.Kullanici)
                    .WithMany(x => x.KullaniciBolgeleri)
                    .HasForeignKey(x => x.KullaniciId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(x => x.OutputZone)
                    .WithMany(x => x.KullaniciBolgeleri)
                    .HasForeignKey(x => x.OutputZoneId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            modelBuilder.Entity<Kullanici>().HasData(
                new Kullanici
                {
                    Id = 1,
                    Ad = "Sistem",
                    Soyad = "Yöneticisi",
                    KullaniciAdi = "IT",
                    SifreHash =
                        "$2a$11$nB8kNi06IPQiG//LeYdNqe10O54oTT9NvQ5QASZ641yBgrbT9mZlq",
                    Rol = KullaniciRolu.Admin,
                    PinKodu = 6161,
                    AktifMi = true
                }
            );

            base.OnModelCreating(modelBuilder);
        }
    }
}
