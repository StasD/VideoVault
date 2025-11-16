namespace VideoVaultApi.Models;

public record MediaFileModel
{
    public required string Name { get; init; }
    public required string Ext { get; init; }
    public required DateTime LastModified { get; init; }
    public required long Size { get; init; }
}
