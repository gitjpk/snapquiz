"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileText, Link, MessageSquare } from "lucide-react";

type SourceType = "topic" | "document" | "url";

interface GenerationSource {
  type: SourceType;
  value: string;
  file?: File;
}

interface SourceSelectorProps {
  source: GenerationSource | null;
  onSourceChange: (source: GenerationSource | null) => void;
}

const SOURCE_TABS: { type: SourceType; label: string; icon: React.ReactNode; description: string }[] = [
  {
    type: "topic",
    label: "Topic",
    icon: <MessageSquare className="h-4 w-4" />,
    description: "Enter a topic or subject",
  },
  {
    type: "document",
    label: "Document",
    icon: <FileText className="h-4 w-4" />,
    description: "Upload PDF, DOCX, or TXT",
  },
  {
    type: "url",
    label: "URL",
    icon: <Link className="h-4 w-4" />,
    description: "Generate from a webpage",
  },
];

export function SourceSelector({ source, onSourceChange }: SourceSelectorProps) {
  const selectedType = source?.type || "topic";

  const handleTypeChange = (type: SourceType) => {
    onSourceChange({ type, value: "", file: undefined });
  };

  const handleValueChange = (value: string) => {
    onSourceChange({ ...source, type: selectedType, value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onSourceChange({
        type: "document",
        value: file.name,
        file,
      });
    }
  };

  return (
    <div className="space-y-4">
      <Label>Source Type</Label>
      
      {/* Tab Buttons */}
      <div className="flex gap-2">
        {SOURCE_TABS.map((tab) => (
          <button
            key={tab.type}
            type="button"
            onClick={() => handleTypeChange(tab.type)}
            className={`flex items-center gap-2 rounded-md border px-4 py-2 text-sm transition-colors ${
              selectedType === tab.type
                ? "border-primary bg-primary/10 text-primary"
                : "border-input bg-background hover:bg-accent"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Source Input */}
      <div className="space-y-2">
        {selectedType === "topic" && (
          <>
            <Label htmlFor="topic">Topic or Subject</Label>
            <Input
              id="topic"
              placeholder="e.g., World War II, Photosynthesis, JavaScript basics"
              value={source?.value || ""}
              onChange={(e) => handleValueChange(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Enter any topic you want to create a quiz about
            </p>
          </>
        )}

        {selectedType === "document" && (
          <>
            <Label htmlFor="document">Upload Document</Label>
            <div className="space-y-2">
              <Input
                id="document"
                type="file"
                accept=".pdf,.docx,.doc,.txt,.pptx"
                onChange={handleFileChange}
                className="cursor-pointer"
              />
              <p className="text-xs text-muted-foreground">
                Supported formats: PDF, DOCX, TXT, PPTX (max 50MB)
              </p>
              {source?.file && (
                <p className="text-sm text-green-600">
                  Selected: {source.file.name}
                </p>
              )}
            </div>
          </>
        )}

        {selectedType === "url" && (
          <>
            <Label htmlFor="url">Web Page URL</Label>
            <Input
              id="url"
              type="url"
              placeholder="https://en.wikipedia.org/wiki/..."
              value={source?.value || ""}
              onChange={(e) => handleValueChange(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Enter the URL of an article or webpage
            </p>
          </>
        )}
      </div>
    </div>
  );
}
