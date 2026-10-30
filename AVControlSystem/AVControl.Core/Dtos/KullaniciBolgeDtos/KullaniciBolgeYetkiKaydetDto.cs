namespace AVControl.Core.Dtos.KullaniciBolgeDtos
{
    public sealed class KullaniciBolgeYetkiKaydetDto
    {
        // [] verilirse kullanıcının tüm bölge atamaları kaldırılır.
        // null değerini istemiyoruz; boş liste açıkça gönderilmeli.
        public List<int>? BolgeIds { get; set; }
    }
}
