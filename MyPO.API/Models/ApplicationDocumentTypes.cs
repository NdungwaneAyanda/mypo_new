namespace MyPO.API.Models;

public static class ApplicationDocumentTypes
{
    public const string SubmittedQuote = "quote_submitted";
    public const string CipcDocument = "company_registration";
    public const string DirectorId = "director_id";
    public const string PurchaseOrder = "purchase_order";
    public const string ProofOfAddress = "proof_of_address";

    public static readonly string[] Required =
    [
        SubmittedQuote,
        CipcDocument
    ];

    public static bool HasAllRequired(IEnumerable<string> uploadedTypes)
    {
        var set = new HashSet<string>(uploadedTypes, StringComparer.OrdinalIgnoreCase);
        return Required.All(set.Contains);
    }
}
