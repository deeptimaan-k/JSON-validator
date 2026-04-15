import Editor from "@monaco-editor/react";
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface JsonEditorProps {
  title: string;
  value: string;
  onChange: (value: string | undefined) => void;
  readOnly?: boolean;
}

export function JsonEditor({ title, value, onChange, readOnly = false }: JsonEditorProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      toast.success(`${title} copied to clipboard`);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error("Failed to copy JSON");
    }
  };

  return (
    <div className="bento-card h-full group/editor">
      <div className="bento-header">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
          <span className="bento-title">{title}</span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 rounded-lg hover:bg-white/5 text-muted-foreground hover:text-foreground transition-all"
            onClick={handleCopy}
            title="Copy to clipboard"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
          </Button>
          <div className="flex gap-1.5 ml-2">
            <div className="w-2.5 h-2.5 rounded-full bg-white/5 border border-white/10" />
            <div className="w-2.5 h-2.5 rounded-full bg-white/5 border border-white/10" />
            <div className="w-2.5 h-2.5 rounded-full bg-white/5 border border-white/10" />
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-hidden bg-black/20 backdrop-blur-sm">
        <Editor
          height="100%"
          defaultLanguage="json"
          theme="vs-dark"
          value={value}
          onChange={onChange}
          options={{
            readOnly,
            minimap: { enabled: false },
            fontSize: 13,
            fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
            scrollBeyondLastLine: false,
            automaticLayout: true,
            padding: { top: 16, bottom: 16 },
            lineNumbers: "on",
            glyphMargin: false,
            folding: true,
            lineDecorationsWidth: 10,
            lineNumbersMinChars: 3,
            formatOnPaste: true,
            formatOnType: true,
          }}
        />
      </div>
    </div>
  );
}
