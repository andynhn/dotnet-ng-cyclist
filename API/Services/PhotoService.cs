using System.Threading.Tasks;
using API.Helpers;
using API.Interfaces;
using CloudinaryDotNet;
using CloudinaryDotNet.Actions;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Options;

namespace API.Services
{
    /*
        Primary service related to Photos and Cloudinary
    */
    /// <summary>
    /// Primary service related to Photos and Cloudinary
    /// </summary>
    public class PhotoService : IPhotoService
    {
        private readonly Cloudinary _cloudinary;
        // Configure the class to use Cloudinary Settings specified in our config
        public PhotoService(IOptions<CloudinarySettings> config)
        {
            var acc = new Account
            (
                config.Value.CloudName,
                config.Value.ApiKey,
                config.Value.ApiSecret
            );

            _cloudinary = new Cloudinary(acc);
        }

        /// <summary>
        /// Method to Add a photo to cloudinary, given an IFormFile
        /// </summary>
        /// <returns>
        /// Parsed result after upload of the image resource.
        /// </returns>
        public async Task<ImageUploadResult> AddPhotoAsync(IFormFile file)
        {
            var uploadResult = new ImageUploadResult();

            // get our file as a stream of data
            if (file.Length > 0)
            {
                // crop to square and focus on the face.
                using var stream = file.OpenReadStream();
                var uploadParams = new ImageUploadParams()
                {
                    File = new FileDescription(file.FileName, stream),
                    Transformation = new Transformation().Height(500).Width(500).Crop("fill").Gravity("face")
                };
                uploadResult = await _cloudinary.UploadAsync(uploadParams);
            }
            
            return uploadResult;
        }

        /// <summary>
        /// Method to delete a photo from cloudinary, given the photo's publicId.
        /// </summary>
        /// <returns>
        /// Parsed result of asset deletion.
        /// </returns>
        public async Task<DeletionResult> DeletePhotoAsync(string publicId)
        {
            var deleteParams = new DeletionParams(publicId);

            var result = await _cloudinary.DestroyAsync(deleteParams);

            return result;
        }
    }
}