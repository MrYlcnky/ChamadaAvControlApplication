using AVControl.Core.Dtos.KioskLoginDtos;
using AVControl.Core.DTOs.AuthDtos;
using AVControl.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using AVControl.Core.Dtos.AuthDtos;
using AVControl.Core.Enums;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Text;

namespace AVControl.WEBAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly IKullaniciService _kullaniciService;
        private readonly ITokenService _tokenService;
        private readonly IConfiguration _configuration; // Token ayarlarını okumak için eklendi

        public AuthController(IKullaniciService kullaniciService, ITokenService tokenService, IConfiguration configuration)
        {
            _kullaniciService = kullaniciService;
            _tokenService = tokenService;
            _configuration = configuration;
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login(LoginDto loginDto)
        {
            var kullanici = await _kullaniciService.KimlikDogrulaAsync(loginDto.KullaniciAdi, loginDto.Sifre);

            if (kullanici == null)
            {
                return Unauthorized(new { mesaj = "Kullanıcı adı veya şifre hatalı!" });
            }

            var token = _tokenService.TokenUret(kullanici);

            return Ok(new
            {
                Token = token,
                KullaniciAdi = kullanici.KullaniciAdi,
                Rol = kullanici.Rol.ToString(),
                KullaniciId = kullanici.Id
            });
        }

        [HttpPost("kiosk-login")]
        public async Task<IActionResult> KioskLogin([FromBody] KioskLoginDto request)
        {
            if (request.PinKodu <= 0)
            {
                return BadRequest(new { mesaj = "Geçersiz PIN kodu." });
            }

            var kullanici = await _kullaniciService.KioskKimlikDogrulaAsync(request.PinKodu);

            if (kullanici == null)
            {
                return Unauthorized(new { mesaj = "Hatalı PIN kodu. Lütfen tekrar deneyin." });
            }

            var token = _tokenService.TokenUret(kullanici);

            return Ok(new
            {
                Token = token,
                KullaniciAdi = kullanici.KullaniciAdi,
                Rol = kullanici.Rol.ToString(),
                KullaniciId = kullanici.Id
            });
        }

        // ==========================================
        // YENİ EKLENEN OTOMATİK GİRİŞ ENDPOINT'İ
        // ==========================================
        [HttpGet("AutoLogin")]
        public IActionResult AutoLogin([FromQuery] string? kullaniciAdi)
        {
            var finalUserName = string.IsNullOrWhiteSpace(kullaniciAdi) ? "SuperAdmin" : kullaniciAdi.Trim();

            var tokenHandler = new JwtSecurityTokenHandler();
            var jwtSettings = _configuration.GetSection("JwtSettings");

            // appsettings.json'daki anahtar ismi "Secret"
            var secretKey = jwtSettings["Secret"];

            if (string.IsNullOrEmpty(secretKey))
            {
                return StatusCode(500, new { mesaj = "JWT Secret Key ayarlanmamış!" });
            }

            var key = Encoding.UTF8.GetBytes(secretKey);

            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, "9999"), // Portal yetkilisi için temsili ID
                new Claim(ClaimTypes.Name, finalUserName),
                new Claim(ClaimTypes.Role, KullaniciRolu.Admin.ToString()), // Admin rolü atanıyor
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
            };

            // ExpirationInMinutes değerini json'dan çekiyoruz, bulamazsa varsayılan 1440 (24 saat) yapıyoruz
            var expirationInMinutes = jwtSettings.GetValue<double>("ExpirationInMinutes", 1440);

            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(claims),
                Expires = DateTime.UtcNow.AddMinutes(expirationInMinutes),
                Issuer = jwtSettings["Issuer"],
                Audience = jwtSettings["Audience"],
                SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
            };

            var token = tokenHandler.CreateToken(tokenDescriptor);
            var tokenString = tokenHandler.WriteToken(token);

            // React uygulamanızdaki Login yanıtıyla aynı DTO yapısını dönüyoruz
            return Ok(new
            {
                Token = tokenString,
                KullaniciAdi = finalUserName,
                Rol = KullaniciRolu.Admin.ToString(),
                KullaniciId = 9999
            });
        }

        [HttpPost("sifre-degistir")]
        [Authorize]
        public async Task<IActionResult> SifreDegistir([FromBody] SifreDegistirDto request)
        {
            var kullaniciAdi = User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.Name)?.Value;

            if (string.IsNullOrEmpty(kullaniciAdi))
                return Unauthorized(new { mesaj = "Oturum süresi dolmuş veya geçersiz." });

            var kullanicilar = await _kullaniciService.KosulaGoreGetirAsync(x => x.KullaniciAdi == kullaniciAdi);
            var mevcutKullanici = kullanicilar.FirstOrDefault();

            if (mevcutKullanici == null)
                return NotFound(new { mesaj = "Kullanıcı bulunamadı." });

            bool sifreDogruMu = BCrypt.Net.BCrypt.Verify(request.MevcutSifre, mevcutKullanici.SifreHash);
            if (!sifreDogruMu)
                return BadRequest(new { mesaj = "Mevcut şifreniz yanlış." });

            mevcutKullanici.SifreHash = BCrypt.Net.BCrypt.HashPassword(request.YeniSifre);
            await _kullaniciService.GuncelleAsync(mevcutKullanici);

            return Ok(new { mesaj = "Şifreniz başarıyla değiştirildi." });
        }
    }
}