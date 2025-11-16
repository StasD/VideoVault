using Microsoft.AspNetCore.Http.HttpResults;

namespace VideoVaultApi.Common;

public static class HelperFunctions
{
    public static ProblemHttpResult NotFound(string title, string detail) =>
        Problem(StatusCodes.Status404NotFound, title, detail);

    public static ProblemHttpResult BadRequest(string title, string detail) =>
        Problem(StatusCodes.Status400BadRequest, title, detail);

    public static ProblemHttpResult InternalServerError(string title, string detail) =>
        Problem(StatusCodes.Status500InternalServerError, title, detail);

    public static ProblemHttpResult Problem(int statusCode, string title, string detail) =>
        TypedResults.Problem(detail, null, statusCode, title);

    public static ValidationProblem ValidationProblem(IDictionary<string, string[]> errors, string title, string detail) =>
        TypedResults.ValidationProblem(errors, detail, null, title);

    public static (string name, string ext) SplitFileName(string fileName)
    {
        int lastDotPos = fileName.LastIndexOf('.');

        return lastDotPos != -1
            ? (fileName[..lastDotPos].Trim(), fileName[(lastDotPos + 1)..].Trim().ToLower())
            : (fileName.Trim(), "");
    }

    public static void DeleteFile(string filePath)
    {
        try
        {
            File.Delete(filePath);
        }
        catch
        {
        }
    }
}
