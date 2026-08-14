using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AVControl.Core.Dtos.Orchestration
{
    public class KaynakDegistirRequestDto
    {
        public int OutputZoneId { get; set; }
        public int InputSourceId { get; set; }
        public int KullaniciId { get; set; }
    }
}
