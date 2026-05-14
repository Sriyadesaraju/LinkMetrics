import { useState } from "react";
import { useUTMSuggest } from "../lib/hooks";
interface UTMParams {
  source: string;
  medium: string;
  campaign: string;
  content: string;
  term: string;
}

interface Props {
  baseUrl: string;
  onChange: (finalUrl: string) => void;
}

export function UTMBuilder({ baseUrl, onChange }: Props) {
  const [params, setParams] = useState<UTMParams>({
    source: "",
    medium: "",
    campaign: "",
    content: "",
    term: "",
  });
  const { mutate: suggest, isPending: suggesting } = useUTMSuggest();

  const buildUrl = (updated: UTMParams) => {
    if (!baseUrl) return baseUrl;
    try {
      const url = new URL(baseUrl);
      if (updated.source) url.searchParams.set("utm_source", updated.source);
      if (updated.medium) url.searchParams.set("utm_medium", updated.medium);
      if (updated.campaign)
        url.searchParams.set("utm_campaign", updated.campaign);
      if (updated.content) url.searchParams.set("utm_content", updated.content);
      if (updated.term) url.searchParams.set("utm_term", updated.term);
      return url.toString();
    } catch {
      return baseUrl;
    }
  };

  const handleChange = (field: keyof UTMParams, value: string) => {
    const updated = { ...params, [field]: value };
    setParams(updated);
    onChange(buildUrl(updated));
  };

  const handleAISuggest = () => {
    if (!baseUrl) return;
    suggest(baseUrl, {
      onSuccess: (data) => {
        const updated = {
          source: data.source ?? "",
          medium: data.medium ?? "",
          campaign: data.campaign ?? "",
          content: data.content ?? "",
          term: data.term ?? "",
        };
        setParams(updated);
        onChange(buildUrl(updated));
      },
    });
  };

  const fields: { key: keyof UTMParams; label: string; placeholder: string }[] =
    [
      {
        key: "source",
        label: "Source",
        placeholder: "google, twitter, newsletter",
      },
      { key: "medium", label: "Medium", placeholder: "cpc, email, social" },
      { key: "campaign", label: "Campaign", placeholder: "summer-sale-2024" },
      { key: "content", label: "Content", placeholder: "banner-top" },
      { key: "term", label: "Term", placeholder: "running+shoes" },
    ];

  return (
    <div className="border rounded-lg p-3 mt-2 bg-gray-50 space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
          UTM Parameters
        </p>
        <button
          type="button"
          onClick={handleAISuggest}
          disabled={!baseUrl || suggesting}
          className="text-xs bg-purple-600 text-white px-2 py-1 rounded hover:bg-purple-700 disabled:opacity-40"
        >
          {suggesting ? "Thinking..." : "✦ AI Suggest"}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {fields.map(({ key, label, placeholder }) => (
          <div key={key}>
            <label className="text-xs text-gray-500 mb-1 block">{label}</label>
            <input
              type="text"
              value={params[key]}
              onChange={(e) => handleChange(key, e.target.value)}
              placeholder={placeholder}
              className="w-full border rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        ))}
      </div>

      {baseUrl && (
        <div className="mt-2">
          <p className="text-xs text-gray-400 mb-1">Preview URL:</p>
          <p className="text-xs font-mono text-blue-600 break-all bg-white border rounded p-2">
            {buildUrl(params) || baseUrl}
          </p>
        </div>
      )}
    </div>
  );
}
