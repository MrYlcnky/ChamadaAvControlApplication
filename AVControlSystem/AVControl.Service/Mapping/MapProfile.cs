using AutoMapper;
using AVControl.Core.Dtos.ChannelListDtos;
using AVControl.Core.Dtos.FavoriLigDtos;
using AVControl.Core.Dtos.FavoriTakim;
using AVControl.Core.Dtos.FavoriTakimDtos;
using AVControl.Core.Dtos.InputSourceDtos;
using AVControl.Core.Dtos.IrTransmitterDtos;
using AVControl.Core.Dtos.IslemLogDtos;
using AVControl.Core.Dtos.KullaniciDtos;
using AVControl.Core.Dtos.LedProcessorDtos;
using AVControl.Core.Dtos.MacTakvimDtos;
using AVControl.Core.Dtos.MatrixDeviceDtos;
using AVControl.Core.Dtos.OutputZoneDtos;
using AVControl.Core.Dtos.RemoteButtonDtos;
using AVControl.Core.Dtos.RemoteControlDtos;
using AVControl.Core.Entities;

namespace AVControl.Service.Mapping
{
    public class MapProfile : Profile
    {
        public MapProfile()
        {
            // 1. MatrixDevice
            CreateMap<MatrixDevice, MatrixDeviceEkleDto>().ReverseMap();
            CreateMap<MatrixDevice, MatrixDeviceGuncelleDto>().ReverseMap();
            CreateMap<MatrixDevice, MatrixDeviceListeDto>().ReverseMap();

            // 2. LedProcessor
            CreateMap<LedProcessor, LedProcessorEkleDto>().ReverseMap();
            CreateMap<LedProcessor, LedProcessorGuncelleDto>().ReverseMap();
            CreateMap<LedProcessor, LedProcessorListeDto>().ReverseMap();

            // 3. RemoteControl
            CreateMap<RemoteControl, RemoteControlEkleDto>().ReverseMap();
            CreateMap<RemoteControl, RemoteControlGuncelleDto>().ReverseMap();
            CreateMap<RemoteControl, RemoteControlListeDto>().ReverseMap();

            // 4. RemoteButton (İlişkili Kumanda Markasını Çekiyoruz)
            CreateMap<RemoteButton, RemoteButtonEkleDto>().ReverseMap();
            CreateMap<RemoteButton, RemoteButtonGuncelleDto>().ReverseMap();
            CreateMap<RemoteButton, RemoteButtonListeDto>()
                .ForMember(dest => dest.KumandaMarkaModel, opt => opt.MapFrom(src => src.RemoteControl != null ? src.RemoteControl.KumandaMarkaModel : null));

            // 5. InputSource (İlişkili Cihaz İsimlerini Çekiyoruz)
            CreateMap<InputSource, InputSourceEkleDto>().ReverseMap();
            CreateMap<InputSource, InputSourceGuncelleDto>().ReverseMap();
            CreateMap<InputSource, InputSourceListeDto>()
                .ForMember(dest => dest.MatrixDeviceAdi, opt => opt.MapFrom(src => src.MatrixDevice != null ? src.MatrixDevice.CihazAdi : null))
                .ForMember(dest => dest.KumandaMarkaModel, opt => opt.MapFrom(src => src.RemoteControl != null ? src.RemoteControl.KumandaMarkaModel : null))
                .ForMember(dest => dest.IrTransmitterAdi, opt => opt.MapFrom(src => src.IrTransmitter != null ? src.IrTransmitter.CihazAdi : null));

            // 6. OutputZone (İlişkili Cihaz İsimlerini Çekiyoruz)
            CreateMap<OutputZone, OutputZoneEkleDto>().ReverseMap();
            CreateMap<OutputZone, OutputZoneGuncelleDto>().ReverseMap();
            CreateMap<OutputZone, OutputZoneListeDto>()
                .ForMember(dest => dest.MatrixDeviceAdi, opt => opt.MapFrom(src => src.MatrixDevice != null ? src.MatrixDevice.CihazAdi : null))
                .ForMember(dest => dest.LedProcessorAdi, opt => opt.MapFrom(src => src.LedProcessor != null ? src.LedProcessor.CihazAdi : null))
                .ForMember(dest => dest.RemoteControlAdi, opt => opt.MapFrom(src => src.RemoteControl != null ? src.RemoteControl.KumandaMarkaModel : null))
                .ForMember(dest => dest.IrTransmitterAdi, opt => opt.MapFrom(src => src.IrTransmitter != null ? src.IrTransmitter.CihazAdi : null))
                .ForMember(dest => dest.ViplexKontroluVarMi, opt => opt.MapFrom(src => src.LedProcessor != null ? src.LedProcessor.ViplexKontroluVarMi :    false))
                .ForMember(dest => dest.CihazGorselUrl, opt => opt.MapFrom(src => src.LedProcessor != null ? src.LedProcessor.CihazGorselUrl : null)); 

            // 7. ChannelList (İlişkili Kaynak Adını Çekiyoruz)
            CreateMap<ChannelList, ChannelListEkleDto>().ReverseMap();
            CreateMap<ChannelList, ChannelListGuncelleDto>().ReverseMap();
            CreateMap<ChannelList, ChannelListListeDto>()
    .ForMember(dest => dest.KaynakAdi, opt => opt.MapFrom(src => src.InputSource != null ? src.InputSource.InputName : null))
    .ForMember(dest => dest.MatrixCihazAdi, opt => opt.MapFrom(src => src.InputSource != null && src.InputSource.MatrixDevice != null ? src.InputSource.MatrixDevice.CihazAdi : null))
    .ForMember(dest => dest.PiCihazAdi, opt => opt.MapFrom(src => src.InputSource != null && src.InputSource.IrTransmitter != null ? src.InputSource.IrTransmitter.CihazAdi : null))
    .ForMember(dest => dest.KumandaAdi, opt => opt.MapFrom(src => src.InputSource != null && src.InputSource.RemoteControl != null ? src.InputSource.RemoteControl.KumandaMarkaModel : null));

            // 8. Kullanici
            CreateMap<Kullanici, KullaniciEkleDto>().ReverseMap();
            CreateMap<Kullanici, KullaniciListeDto>().ReverseMap();
            CreateMap<KullaniciGuncelleDto, Kullanici>()
            .ForMember(dest => dest.AktifMi, opt => opt.MapFrom(src => src.AktifMi))
            .ForMember(dest => dest.SifreHash, opt => opt.Ignore())
            .ReverseMap();

            // 9. IslemLog (Kullanıcının Adı ve Soyadını birleştirip gönderiyoruz)
            CreateMap<IslemLog, IslemLogEkleDto>().ReverseMap();
            CreateMap<IslemLog, IslemLogListeDto>()
                .ForMember(dest => dest.KullaniciAdSoyad, opt => opt.MapFrom(src => src.Kullanici != null ? $"{src.Kullanici.Ad} {src.Kullanici.Soyad}" : null));

            // IrTransmitter
            CreateMap<IrTransmitter, IrTransmitterEkleDto>().ReverseMap();
            CreateMap<IrTransmitter, IrTransmitterGuncelleDto>().ReverseMap();
            CreateMap<IrTransmitter, IrTransmitterListeDto>().ReverseMap();

            // Favori Takım
            CreateMap<FavoriTakim, FavoriTakimListeDto>()
                .ForMember(
                    dest => dest.Ligler,
                    opt => opt.MapFrom(src =>
                        src.FavoriTakimLigleri
                            .Where(x => x.AktifMi)
                            .Select(x => x.LigAdi)
                            .ToList()
                    )
                );

            CreateMap<FavoriTakimEkleDto, FavoriTakim>()
                .ForMember(
                    dest => dest.FavoriTakimLigleri,
                    opt => opt.Ignore()
                );

            CreateMap<FavoriTakimGuncelleDto, FavoriTakim>()
                .ForMember(
                    dest => dest.FavoriTakimLigleri,
                    opt => opt.Ignore()
                );

            // Favori Lig 
            CreateMap<FavoriLig, FavoriLigListeDto>().ReverseMap();
            CreateMap<FavoriLig, FavoriLigEkleDto>().ReverseMap();
            CreateMap<FavoriLig, FavoriLigGuncelleDto>().ReverseMap();

            // MacTakvim
            CreateMap<MacTakvim, MacTakvimListeDto>().ReverseMap();
            CreateMap<MacTakvim, MacTakvimEkleDto>().ReverseMap();
            CreateMap<MacTakvim, MacTakvimGuncelleDto>().ReverseMap();
        }
    }
}