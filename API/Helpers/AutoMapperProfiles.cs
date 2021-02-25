using System.Linq;
using API.DTOs;
using API.Entities;
using AutoMapper;
using API.Extensions;
using System;

namespace API.Helpers
{
    /*
        Primary helper class for configuring automapper profiles.
        This class type is specified at Startup when we configure the automapper service.
        Helps us map Data Transfer Objects (DTOs) to Entities.
    */
    /// <summary>
    /// Primary helper class for configuring automapper profiles.
    /// This class type is specified at Startup when we configure the automapper service.
    /// Helps us map Data Transfer Objects (DTOs) to Entities.
    /// </summary>
    public class AutoMapperProfiles : Profile
    {
        // This helps us map from one object to another (e.g. User to UserDto, Photo to PhotoDto)
        public AutoMapperProfiles()
        {
            // If the mapping is not as straightforward, we need to clarify information for specific properties.
            // To map an individual property, specify the destination property,
            // (dest.PhotoUrl, in this case), then tell it where to map from (src is Photos. We want the first or default, then get the Url property from that).
            CreateMap<AppUser, MemberDto>()
                .ForMember(dest => dest.PhotoUrl, opt => opt.MapFrom(src => 
                    src.Photos.FirstOrDefault(x => x.IsMain).Url))
                .ForMember(dest => dest.Age, opt => opt.MapFrom(src => 
                    src.DateOfBirth.CalculateAge()));
            CreateMap<Photo, PhotoDto>();
            CreateMap<MemberUpdateDto, AppUser>();
            CreateMap<RegisterDto, AppUser>();
            CreateMap<Message, MessageDto>()
                .ForMember(dest => dest.SenderPhotoUrl, opt => opt.MapFrom(src => 
                    src.Sender.Photos.FirstOrDefault(x => x.IsMain).Url))
                .ForMember(dest => dest.RecipientPhotoUrl, opt => opt.MapFrom(src => 
                    src.Recipient.Photos.FirstOrDefault(x => x.IsMain).Url))
                .ForMember(dest => dest.SenderFirstName, opt => opt.MapFrom(src => 
                    src.Sender.FirstName))
                .ForMember(dest => dest.SenderLastName, opt => opt.MapFrom(src => 
                    src.Sender.LastName))
                .ForMember(dest => dest.RecipientFirstName, opt => opt.MapFrom(src => 
                    src.Recipient.FirstName))
                .ForMember(dest => dest.RecipientLastName, opt => opt.MapFrom(src => 
                    src.Recipient.LastName));
        }
    }
}