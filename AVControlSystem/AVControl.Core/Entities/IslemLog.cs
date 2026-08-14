using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AVControl.Core.Entities
{
    public class IslemLog:BaseEntity
    {
        public int KullaniciId { get; set; }
        public virtual Kullanici? Kullanici { get; set; }

        public string? IslemTipi { get; set; } // "KaynakDegisti", "KanalDegisti"

        public string? Detaylar { get; set; }

        public DateTime OlusturulmaTarihi { get; set; } = DateTime.Now;
    }
}
