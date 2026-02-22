import { useState } from "react";
import Editor from "@monaco-editor/react";

const LANGUAGES = [
    "javascript", "typescript", "python", "java", "c", "cpp",
    "csharp", "go", "rust", "html", "css", "json", "markdown",
    "sql", "bash", "yaml", "xml",
];

export default function CodeEditor({ onShare }) {
    const [code, setCode] = useState("// Write your code here…\n");
    const [language, setLanguage] = useState("javascript");
    const [sharing, setSharing] = useState(false);

    const handleShare = async () => {
        if (!code.trim()) return;
        setSharing(true);
        try {
            onShare(code, language);
        } finally {
            setTimeout(() => setSharing(false), 600);
        }
    };

    return (
        <div className="code-section">
            <div className="code-toolbar">
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: "0.82rem", color: "var(--text-muted)", fontWeight: 500 }}>
                        Language:
                    </span>
                    <select
                        id="language-select"
                        className="lang-select"
                        value={language}
                        onChange={(e) => setLanguage(e.target.value)}
                    >
                        {LANGUAGES.map((l) => (
                            <option key={l} value={l}>
                                {l.charAt(0).toUpperCase() + l.slice(1)}
                            </option>
                        ))}
                    </select>
                </div>

                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <button
                        id="clear-code-btn"
                        className="btn btn-ghost btn-sm"
                        onClick={() => setCode("")}
                    >
                        Clear
                    </button>
                    <button
                        id="share-code-btn"
                        className="btn btn-primary btn-sm"
                        onClick={handleShare}
                        disabled={sharing || !code.trim()}
                    >
                        {sharing ? <><span className="spinner" style={{ width: 12, height: 12 }} /> Sharing…</> : "⬆ Share Snippet"}
                    </button>
                </div>
            </div>

            <div className="code-editor-wrapper">
                <Editor
                    height="100%"
                    theme="vs-dark"
                    language={language}
                    value={code}
                    onChange={(val) => setCode(val || "")}
                    options={{
                        fontSize: 13,
                        fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                        fontLigatures: true,
                        minimap: { enabled: false },
                        wordWrap: "on",
                        scrollBeyondLastLine: false,
                        lineNumbers: "on",
                        padding: { top: 12 },
                        renderLineHighlight: "gutter",
                        smoothScrolling: true,
                        cursorBlinking: "smooth",
                        formatOnPaste: true,
                    }}
                />
            </div>
        </div>
    );
}
