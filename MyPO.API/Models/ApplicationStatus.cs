namespace MyPO.API.Models;

public static class ApplicationStatus
{
    public const string Provisional = "provisional";
    public const string ReadyForFunding = "ready_for_funding";
    public const string Reviewed = "reviewed";
    public const string Funded = "funded";
    public const string Declined = "declined";

    public const string PurchaseOrderType = "purchase_order";

    public static readonly string[] ValidStatuses =
    [
        Provisional,
        ReadyForFunding,
        Reviewed,
        Funded,
        Declined
    ];

    public static string Normalize(string status) => status switch
    {
        "pending" => ReadyForFunding,
        "successful" => Funded,
        _ => status
    };

    public static bool IsPurchaseOrder(string documentType) =>
        string.Equals(documentType, PurchaseOrderType, StringComparison.OrdinalIgnoreCase);

    public static bool IsProvisional(string status) =>
        Normalize(status) == Provisional;

    public static bool IsReadyForFunding(string status) =>
        Normalize(status) == ReadyForFunding;

    public static bool IsFunded(string status) =>
        Normalize(status) == Funded;
}
