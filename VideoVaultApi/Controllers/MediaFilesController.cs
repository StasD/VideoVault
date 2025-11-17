using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using VideoVaultApi.Common;
using VideoVaultApi.Models;

namespace VideoVaultApi.Controllers;

[AllowAnonymous]
[ApiController]
[Route("api/[controller]")]
public class MediaFilesController(IConfiguration configuration) : ControllerBase
{
    private const int MAX_SIZE_MB = 200;
    private const int BUFFER_LENGTH = 4096;
    private const string TEMP_FILE_PREFIX = "_########_";
    private static readonly string[] AllowedMimeTypes = ["video/mp4"];
    private static readonly string[] AllowedExtensions = ["mp4"];
    private static readonly DateTime UnixEpoch = new(1970, 1, 1, 0, 0, 0, DateTimeKind.Utc);
    private readonly string MediaFolderPath = configuration["MediaFolderPath"]!;

    [HttpGet("ListMediaFiles")]
    public  Ok<List<MediaFileModel>> ListMediaFiles(string? ext = null, string? search = null)
        => TypedResults.Ok(new DirectoryInfo(MediaFolderPath).GetFiles()
            .Where(fi =>
                !fi.Name.StartsWith(TEMP_FILE_PREFIX, StringComparison.Ordinal) &&
                (ext?.Split(",") ?? AllowedExtensions)
                    .Any(s => s.Equals(fi.Extension.TrimStart('.'), StringComparison.OrdinalIgnoreCase)) &&
                (search == null || fi.Name.Contains(search, StringComparison.OrdinalIgnoreCase)))
            .Select(fi => new MediaFileModel {
                Ext = fi.Extension.TrimStart('.'),
                Name = fi.Name,
                LastModified = fi.LastWriteTimeUtc,
                Size = fi.Length
            }).ToList());

    [HttpPost("Upload")]
    // [RequestSizeLimit(MAX_SIZE_MB * 1024 * 1024)]
    [DisableRequestSizeLimit] // using this because the attribute above does not allow to specify error message
    public async Task<Results<Ok, ProblemHttpResult>> UploadFile(string fileName, long? fileLastModified)
    {
        const string errorTitle = "Error Uploading File";

        var (name, ext) = HelperFunctions.SplitFileName(fileName);

        if (string.IsNullOrEmpty(ext) || !AllowedExtensions.Contains(ext))
        {
            return HelperFunctions.BadRequest(errorTitle, "Invalid file extension.");
        }

        if (string.IsNullOrEmpty(name))
        {
            return HelperFunctions.BadRequest(errorTitle, "File name cannot be empty.");
        }

        var contentLength = Request.ContentLength;

        if (contentLength == null || contentLength > MAX_SIZE_MB * 1024 * 1024)
        {
            return HelperFunctions.BadRequest(errorTitle, "Invalid file size.");
        }

        var mimeType = Request.ContentType;

        if (string.IsNullOrEmpty(mimeType) || !AllowedMimeTypes.Contains(mimeType))
        {
            return HelperFunctions.BadRequest(errorTitle, "Invalid file type.");
        }

        var tempFilePath = Path.Combine(MediaFolderPath, $"{TEMP_FILE_PREFIX}{name}.{ext}");
        var filePath = Path.Combine(MediaFolderPath, $"{name}.{ext}");

        try
        {
            using (var readStream = Request.Body)
            using (var writeStream = new FileStream(tempFilePath, FileMode.Create, FileAccess.Write, FileShare.None, BUFFER_LENGTH, true))
            {
                var buffer = new byte[BUFFER_LENGTH];
                int bytesRead = 0;
                long totalBytesUploaded = 0;

                do
                {
                    bytesRead = await readStream.ReadAsync(buffer);

                    if (bytesRead > 0) {
                        await writeStream.WriteAsync(buffer.AsMemory(0, bytesRead));
                        totalBytesUploaded += bytesRead;
                    }
                }
                while (bytesRead != 0);

                if (totalBytesUploaded != contentLength)
                {
                    HelperFunctions.DeleteFile(tempFilePath); // delete partially uploaded file
                    return HelperFunctions.InternalServerError(errorTitle, "Could not upload file.");
                }
            }

            // following statements should be after closing writeStream, thus outside 'using'

            // set 'Last Modified' date
            if (fileLastModified != null)
            {
                System.IO.File.SetLastWriteTime(tempFilePath, UnixEpoch.AddMilliseconds(Convert.ToDouble(fileLastModified)));
            }

            // rename temp file
            System.IO.File.Move(tempFilePath, filePath, true);
        }
        catch
        {
            HelperFunctions.DeleteFile(tempFilePath); // delete partially uploaded file
            return HelperFunctions.InternalServerError(errorTitle, "Could not upload file.");
        }

        return TypedResults.Ok();
    }
}
