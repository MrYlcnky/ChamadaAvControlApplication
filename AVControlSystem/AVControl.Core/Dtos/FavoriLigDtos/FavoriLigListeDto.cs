using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AVControl.Core.Dtos.FavoriLigDtos
{
    public class FavoriLigListeDto
    {
        public int Id { get; set; }
        public required string LigAdi { get; set; }
        public bool AktifMi { get; set; }
    }
}
