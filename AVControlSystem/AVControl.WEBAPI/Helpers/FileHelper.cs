using Microsoft.AspNetCore.Http;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using ImageMagick; 

namespace AVControl.WEBAPI.Helpers
{
    public static class FileHelper
    {
        public static async Task<string?> GorselKaydetAsync(IFormFile? dosya, int cihazId, string cihazAdi)
        {
            if (dosya == null || dosya.Length == 0) return null;

            // Cihaz adını temizle
            string temizAd = IsimTemizle(cihazAdi);

            //  Gelen dosya ne olursa olsun, biz hep .jpg olarak kaydedeceğiz
            var yeniDosyaAdi = $"{cihazId}_{temizAd}.jpg";

            var klasorYolu = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "images", "cihazlar");

            if (!Directory.Exists(klasorYolu))
                Directory.CreateDirectory(klasorYolu);

            var tamYol = Path.Combine(klasorYolu, yeniDosyaAdi);

            // Magick.NET ile her formatı okuyup JPG'e çevirme
            using (var stream = dosya.OpenReadStream())
            {
                using (var image = new MagickImage(stream))
                {
                    // Formatı JPG olarak zorla
                    image.Format = MagickFormat.Jpg;

                    // Web için dosya boyutunu optimize et (Gözle görülür kalite kaybı olmadan boyutu küçültür)
                    image.Quality = 85;

                    // Yeni formatıyla dosyayı sunucuya asenkron olarak yaz
                    await image.WriteAsync(tamYol);
                }
            }

            return $"/images/cihazlar/{yeniDosyaAdi}";
        }

        private static string IsimTemizle(string metin)
        {
            if (string.IsNullOrWhiteSpace(metin)) return "cihaz";

            var invalidChars = Path.GetInvalidFileNameChars();
            var temizMetin = new string(metin.Where(ch => !invalidChars.Contains(ch)).ToArray());

            temizMetin = temizMetin.Replace(" ", "_").ToLowerInvariant();
            temizMetin = temizMetin.Replace("ı", "i").Replace("ğ", "g").Replace("ü", "u")
                                   .Replace("ş", "s").Replace("ö", "o").Replace("ç", "c");

            return temizMetin;
        }
    }
}