import { useRef } from "react";
import { Upload, FileCheck, X, AlertCircle, Loader2, RotateCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";

export type UploadStatus = "idle" | "uploading" | "uploaded" | "error";

export interface DocumentFile {
  type: string;
  label: string;
  file: File | null;
  status?: UploadStatus;
  progress?: number;
  errorMessage?: string;
}

const REQUIRED_DOCUMENTS = [
  { type: "purchase_order", label: "Purchase Order" },
  { type: "company_registration", label: "Company Registration Document" },
  { type: "bank_confirmation", label: "Bank Confirmation Letter" },
  { type: "director_id", label: "Director ID" },
  { type: "company_proof_address", label: "Company Proof of Address" },
  { type: "director_proof_address", label: "Director Proof of Address" },
];

const ACCEPTED_TYPES = ".pdf,.doc,.docx";
const ACCEPTED_MIME_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_FILE_SIZE_LABEL = "5MB";

export const validateFile = (file: File): string | null => {
  if (file.size > MAX_FILE_SIZE) {
    return `File exceeds ${MAX_FILE_SIZE_LABEL} limit`;
  }
  // Some browsers leave file.type empty for .doc — fall back to extension check
  const ext = file.name.toLowerCase().split(".").pop() || "";
  const validExt = ["pdf", "doc", "docx"].includes(ext);
  const validMime = !file.type || ACCEPTED_MIME_TYPES.includes(file.type);
  if (!validExt || !validMime) {
    return "Only PDF, DOC, or DOCX files are allowed";
  }
  return null;
};

interface DocumentUploadProps {
  documents: DocumentFile[];
  onDocumentsChange: (documents: DocumentFile[]) => void;
  onValidationError?: (message: string) => void;
  onRetry?: (docType: string) => void;
  disabled?: boolean;
}

const DocumentUpload = ({
  documents,
  onDocumentsChange,
  onValidationError,
  onRetry,
  disabled,
}: DocumentUploadProps) => {
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const handleFileSelect = (docType: string, file: File | null) => {
    if (file) {
      const validationError = validateFile(file);
      if (validationError) {
        onValidationError?.(validationError);
        if (fileInputRefs.current[docType]) {
          fileInputRefs.current[docType]!.value = "";
        }
        return;
      }
    }
    const updated = documents.map((d) =>
      d.type === docType
        ? { ...d, file, status: "idle" as UploadStatus, progress: 0, errorMessage: undefined }
        : d
    );
    onDocumentsChange(updated);
  };

  const handleRemoveFile = (docType: string) => {
    const updated = documents.map((d) =>
      d.type === docType
        ? { ...d, file: null, status: "idle" as UploadStatus, progress: 0, errorMessage: undefined }
        : d
    );
    onDocumentsChange(updated);
    if (fileInputRefs.current[docType]) {
      fileInputRefs.current[docType]!.value = "";
    }
  };

  const uploadedCount = documents.filter((d) => d.file).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Upload required documents (PDF, DOC — max {MAX_FILE_SIZE_LABEL} each)
        </p>
        <span className="text-sm font-medium text-accent">
          {uploadedCount}/{documents.length} attached
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {documents.map((doc) => {
          const status = doc.status ?? "idle";
          const isUploading = status === "uploading";
          const isError = status === "error";
          const isUploaded = status === "uploaded";

          return (
            <div
              key={doc.type}
              className={cn(
                "relative rounded-xl border-2 border-dashed p-4 transition-all duration-200",
                isError
                  ? "border-destructive/50 bg-destructive/5"
                  : doc.file
                  ? "border-accent/50 bg-accent/5"
                  : "border-border hover:border-accent/30 hover:bg-muted/50"
              )}
            >
              <input
                ref={(el) => { fileInputRefs.current[doc.type] = el; }}
                type="file"
                accept={ACCEPTED_TYPES}
                className="hidden"
                disabled={disabled || isUploading}
                onChange={(e) => handleFileSelect(doc.type, e.target.files?.[0] || null)}
              />

              {doc.file ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    {isUploading ? (
                      <Loader2 className="w-5 h-5 text-accent shrink-0 animate-spin" />
                    ) : isError ? (
                      <AlertCircle className="w-5 h-5 text-destructive shrink-0" />
                    ) : (
                      <FileCheck className={cn("w-5 h-5 shrink-0", isUploaded ? "text-accent" : "text-muted-foreground")} />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground truncate">
                        {doc.label}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {doc.file.name} ({(doc.file.size / 1024).toFixed(0)} KB)
                      </p>
                    </div>
                    {isError && onRetry && (
                      <button
                        type="button"
                        onClick={() => onRetry(doc.type)}
                        className="p-1 rounded-md hover:bg-accent/10 text-muted-foreground hover:text-accent transition-colors"
                        title="Retry upload"
                      >
                        <RotateCw className="w-4 h-4" />
                      </button>
                    )}
                    {!isUploading && !isUploaded && (
                      <button
                        type="button"
                        onClick={() => handleRemoveFile(doc.type)}
                        className="p-1 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {(isUploading || isError) && (
                    <Progress
                      value={doc.progress ?? 0}
                      className={cn("h-1", isError && "[&>div]:bg-destructive")}
                    />
                  )}

                  {isError && doc.errorMessage && (
                    <p className="text-xs text-destructive pl-8">{doc.errorMessage}</p>
                  )}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRefs.current[doc.type]?.click()}
                  disabled={disabled}
                  className="w-full flex items-center gap-3 text-left disabled:opacity-50"
                >
                  <Upload className="w-5 h-5 text-muted-foreground shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground">
                      {doc.label}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Click to upload
                    </p>
                  </div>
                  <AlertCircle className="w-4 h-4 text-destructive/60 shrink-0" />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export { REQUIRED_DOCUMENTS, MAX_FILE_SIZE, MAX_FILE_SIZE_LABEL, ACCEPTED_MIME_TYPES };
export default DocumentUpload;
