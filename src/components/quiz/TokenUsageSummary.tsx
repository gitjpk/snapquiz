"use client";

import { Info } from "lucide-react";

interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
}

interface TokenUsageSummaryProps {
  tokenUsage: TokenUsage;
}

export function TokenUsageSummary({ tokenUsage }: TokenUsageSummaryProps) {
  return (
    <div className="flex items-center gap-2 rounded-md border bg-muted/50 px-3 py-2 text-sm">
      <Info className="h-4 w-4 text-muted-foreground" />
      <span className="text-muted-foreground">
        Token usage: {tokenUsage.inputTokens.toLocaleString()} input + {tokenUsage.outputTokens.toLocaleString()} output = {tokenUsage.totalTokens.toLocaleString()} total
      </span>
    </div>
  );
}
