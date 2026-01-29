"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Upload, FileText, X, AlertCircle, CheckCircle, Loader2 } from "lucide-react";

interface DocumentUploadProps {
  onFileSelect: (file: File) => void;
  selectedFile: File | null;
  onClear: () => void;
  isUploading?: boolean;
  error?: string | null;
}

const _ACCEPTED_TYPES = {
  "application/pdf": [".pdf"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": [".pptx"],
  "text/plain": [".txt"],
};

const MAX_SIZE_MB = 10;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

export function DocumentUpload({
  onFileSelect,
  selectedFile,
  onClear,
  isUploading = false,
  error,
}: DocumentUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const displayError = error || localError;

  const validateFile = (file: File): string | null => {
    // Check size
    if (file.size > MAX_SIZE_BYTES) {
      return `File size exceeds ${MAX_SIZE_MB}MB limit`;
    }

    // Check type
    const extension = file.name.toLowerCase().split(".").pop();
    const validExtensions = [".pdf", ".docx", ".pptx", ".txt"];
    if (!extension || !validExtensions.includes(`.${extension}`)) {
      return "Unsupported file format. Please use PDF, DOCX, PPTX, or TXT";
    }

    return null;
  };

  const handleFile = (file: File) => {
    setLocalError(null);
    
    const validationError = validateFile(file);
    if (validationError) {
      setLocalError(validationError);
      return;
    }

    onFileSelect(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (selectedFile) {
    return (
      <div className="space-y-2">
        <Label>Selected Document</Label>
        <div className="flex items-center gap-3 rounded-md border bg-muted/50 p-3">
          <FileText className="h-8 w-8 flex-shrink-0 text-primary" />
          <div className="flex-1 min-w-0">
            <p className="truncate font-medium">{selectedFile.name}</p>
            <p className="text-xs text-muted-foreground">
              {formatFileSize(selectedFile.size)}
            </p>
          </div>
          {isUploading ? (
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          ) : (
            <>
              <CheckCircle className="h-5 w-5 text-green-500" />
              <Button
                size="icon"
                variant="ghost"
                onClick={onClear}
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
        {displayError && (
          <div className="flex items-center gap-2 text-sm text-destructive">
            <AlertCircle className="h-4 w-4" />
            {displayError}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Label>Upload Document</Label>
      <div
        className={`relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-colors ${
          dragActive
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25 hover:border-muted-foreground/50"
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.docx,.pptx,.txt"
          onChange={handleChange}
          className="absolute inset-0 cursor-pointer opacity-0"
        />
        <Upload className="mb-2 h-8 w-8 text-muted-foreground" />
        <p className="text-sm font-medium">
          Drag & drop or{" "}
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="text-primary underline-offset-2 hover:underline"
          >
            browse
          </button>
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          PDF, DOCX, PPTX, or TXT (max {MAX_SIZE_MB}MB)
        </p>
      </div>
      {displayError && (
        <div className="flex items-center gap-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4" />
          {displayError}
        </div>
      )}
    </div>
  );
}
