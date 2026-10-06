using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AVControl.Core.Entities
{
    public class FavoriTakim: BaseEntity
    {
        public required string TakimAdi { get; set; }

        public ICollection<FavoriTakimLig> FavoriTakimLigleri { get; set; } = new List<FavoriTakimLig>();
    }
}
