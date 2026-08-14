using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AVControl.Core.Dtos.FavoriTakimDtos
{
    public class FavoriTakimListeDto
    {
        public int Id { get; set; }
        public required string TakimAdi { get; set; }
        public bool AktifMi { get; set; }
    }
}
