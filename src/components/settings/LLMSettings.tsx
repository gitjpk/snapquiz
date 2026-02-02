"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { useTranslations } from "@/components/providers/SiteSettingsProvider";

type LLMProvider = "openai" | "anthropic" | "azure-foundry";

// Available models for Azure AI Foundry
const AZURE_FOUNDRY_MODELS = [
  { id: "Mistral-Large-3", name: "Mistral Large 3" },
  { id: "DeepSeek-V3.2", name: "DeepSeek V3.2" },
  { id: "gpt-5.2-chat", name: "GPT-5.2 Chat" },
];

interface LLMSettingsData {
  provider: LLMProvider;
  apiEndpoint: string;
  model?: string;
  detectedModel: string | null;
}

const DEFAULT_ENDPOINTS: Record<LLMProvider, string> = {
  openai: "https://api.openai.com",
  anthropic: "https://api.anthropic.com",
  "azure-foundry": "https://snapquiz-resource.services.ai.azure.com/openai/v1",
};

export function LLMSettings() {
  const t = useTranslations();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [provider, setProvider] = useState<LLMProvider>("openai");
  const [apiEndpoint, setApiEndpoint] = useState(DEFAULT_ENDPOINTS.openai);
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState<string>("Mistral-Large-3");
  const [_detectedModel, setDetectedModel] = useState<string | null>(null);
  const [hasExistingSettings, setHasExistingSettings] = useState(false);

  // Load existing settings on mount
  useEffect(() => {
    async function loadSettings() {
      try {
        const response = await fetch("/api/llm/settings");
        if (response.ok) {
          const data: LLMSettingsData = await response.json();
          setProvider(data.provider);
          setApiEndpoint(data.apiEndpoint);
          if (data.model) setModel(data.model);
          setDetectedModel(data.detectedModel);
          setHasExistingSettings(true);
        } else if (response.status === 404) {
          // No settings yet, use defaults
          setHasExistingSettings(false);
        }
      } catch (err) {
        console.error("Failed to load LLM settings:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadSettings();
  }, []);

  // Update endpoint when provider changes
  const handleProviderChange = (newProvider: LLMProvider) => {
    setProvider(newProvider);
    // Only update endpoint if it's still the default for the old provider
    if (apiEndpoint === DEFAULT_ENDPOINTS[provider]) {
      setApiEndpoint(DEFAULT_ENDPOINTS[newProvider]);
    }
  };

  const handleTest = async () => {
    setIsTesting(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch("/api/llm/test-connection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider, apiEndpoint, apiKey, ...(provider === "azure-foundry" && { model }) }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(t.llm.connectionSuccess);
      } else {
        setError(data.error || t.llm.connectionFailed);
      }
    } catch (err) {
      setError(t.llm.connectionFailed);
      console.error("Test connection error:", err);
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const body: Record<string, string> = { provider, apiEndpoint };
      if (apiKey) {
        body.apiKey = apiKey;
      }
      if (provider === "azure-foundry") {
        body.model = model;
      }

      const response = await fetch("/api/llm/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        const data = await response.json();
        setDetectedModel(data.detectedModel);
        setSuccess(t.llm.settingsSaved);
        setApiKey(""); // Clear the API key field
        setHasExistingSettings(true);
      } else {
        const data = await response.json();
        setError(data.message || t.common.error);
      }
    } catch (err) {
      setError(t.common.error);
      console.error("Save settings error:", err);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t.llm.title}</CardTitle>
        <CardDescription>
          {t.llm.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Provider Selection */}
        <div className="space-y-2">
          <Label htmlFor="provider">{t.llm.provider}</Label>
          <select
            id="provider"
            value={provider}
            onChange={(e) => handleProviderChange(e.target.value as LLMProvider)}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
          >
            <option value="openai">OpenAI (LMP)</option>
            <option value="anthropic">Anthropic (LMP)</option>
            <option value="azure-foundry">Azure AI Foundry</option>
          </select>
        </div>

        {/* Model Selection (Azure AI Foundry only) */}
        {provider === "azure-foundry" && (
          <div className="space-y-2">
            <Label htmlFor="model">{t.llm.model}</Label>
            <select
              id="model"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
            >
              {AZURE_FOUNDRY_MODELS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* API Endpoint */}
        <div className="space-y-2">
          <Label htmlFor="apiEndpoint">{t.llm.apiEndpoint}</Label>
          <Input
            id="apiEndpoint"
            type="url"
            value={apiEndpoint}
            onChange={(e) => setApiEndpoint(e.target.value)}
            placeholder="https://api.openai.com or http://127.0.0.1:4000"
          />
          <p className="text-xs text-muted-foreground">
            Use custom endpoint for self-hosted or proxy services (HTTP allowed for localhost)
          </p>
        </div>

        {/* API Key */}
        <div className="space-y-2">
          <Label htmlFor="apiKey">{t.llm.apiKey}</Label>
          <Input
            id="apiKey"
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder={t.llm.apiKeyPlaceholder}
          />
        </div>

        {/* Status Messages */}
        {error && (
          <div className="flex items-center gap-2 text-sm text-destructive">
            <XCircle className="h-4 w-4" />
            {error}
          </div>
        )}

        {success && (
          <div className="flex items-center gap-2 text-sm text-green-600">
            <CheckCircle className="h-4 w-4" />
            {success}
          </div>
        )}

        {/* Connection Status */}
        {hasExistingSettings && !success && !error && (
          <div className="flex items-center gap-2 text-sm text-green-600">
            <CheckCircle className="h-4 w-4" />
            Connected
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            onClick={handleTest}
            disabled={isTesting || isSaving}
          >
            {isTesting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {t.llm.testing}
              </>
            ) : (
              t.llm.testConnection
            )}
          </Button>
          <Button onClick={handleSave} disabled={isTesting || isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {t.llm.saving}
              </>
            ) : (
              t.llm.saveSettings
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
