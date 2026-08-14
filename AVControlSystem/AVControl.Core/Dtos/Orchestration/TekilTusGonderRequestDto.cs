using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AVControl.Core.Dtos.Orchestration
{
    public class TekilTusGonderRequestDto
    {
        public int OutputZoneId { get; set; }
        public required string TusKodu { get; set; }
        public int KullaniciId { get; set; }
        public bool TvKontroluMu { get; set; } // YENİ: Eğer true ise sinyali Input'a değil Output'a (TV'ye) atacak!
    }
}
