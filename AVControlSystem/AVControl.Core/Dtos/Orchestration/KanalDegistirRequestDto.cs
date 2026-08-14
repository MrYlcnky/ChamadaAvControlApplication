using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AVControl.Core.Dtos.Orchestration
{
    public class KanalDegistirRequestDto
    {
        public int OutputZoneId { get; set; }
        public int ChannelListId { get; set; }
        public int KullaniciId { get; set; }
    }
}
