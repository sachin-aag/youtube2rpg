"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type ProcessingStatus = "idle" | "uploading" | "parsing" | "generating" | "complete" | "error";

interface ChapterPreview {
  chapterNumber: number;
  title: string;
  contentPreview: string;
}

interface ProcessingState {
  status: ProcessingStatus;
  message: string;
  progress?: number;
  chapters?: ChapterPreview[];
  gameId?: string;
  error?: string;
}

export default function CreatePage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [processing, setProcessing] = useState<ProcessingState>({
    status: "idle",
    message: "",
  });

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type === "application/pdf") {
        setFile(droppedFile);
      } else {
        alert("Please upload a PDF file");
      }
    }
  }, []);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  }, []);

  const handleUpload = async () => {
    if (!file) return;

    setProcessing({ status: "uploading", message: "Uploading PDF..." });

    try {
      // Create form data
      const formData = new FormData();
      formData.append("file", file);

      // Upload and process
      const response = await fetch("/api/games/create", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to process PDF");
      }

      // Stream processing updates
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error("No response stream");
      }

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = decoder.decode(value);
        const lines = text.split("\n").filter(Boolean);

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));
              setProcessing((prev) => ({
                ...prev,
                ...data,
              }));

              if (data.status === "complete" && data.gameId) {
                // Redirect to the new game
                setTimeout(() => {
                  router.push(`/game/${data.gameId}`);
                }, 1500);
              }
            } catch {
              // Ignore parse errors
            }
          }
        }
      }
    } catch (error) {
      console.error("Upload error:", error);
      setProcessing({
        status: "error",
        message: "Failed to process PDF",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };

  const resetUpload = () => {
    setFile(null);
    setProcessing({ status: "idle", message: "" });
  };

  return (
    <div className="font-pixel min-h-screen bg-[#1a1b26] text-zinc-100" style={{ imageRendering: "pixelated" }}>
      <div className="mx-auto max-w-4xl px-6 py-10">
        {/* Header */}
        <header className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs uppercase text-zinc-500 hover:text-amber-400 transition-colors"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Games
          </Link>
          <h1 className="mt-4 text-xl font-bold uppercase tracking-wide text-white">
            Create Your Own RPG
          </h1>
          <p className="mt-2 text-[10px] uppercase leading-relaxed text-zinc-400 sm:text-xs">
            Transform any PDF into an interactive learning game
          </p>
        </header>

        {/* How it works section */}
        <section className="mb-10">
          <h2 className="mb-4 text-sm font-bold uppercase text-amber-400">How It Works</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
            {[
              { step: 1, title: "Upload PDF", desc: "Drop any book, notes, or course material" },
              { step: 2, title: "AI Splits", desc: "Chapters are detected automatically" },
              { step: 3, title: "Questions", desc: "3 quiz questions per chapter" },
              { step: 4, title: "Play!", desc: "Battle NPCs to test your knowledge" },
            ].map(({ step, title, desc }) => (
              <div
                key={step}
                className="pixel-shadow rounded-none border-2 border-zinc-600 bg-zinc-800 p-4"
              >
                <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-none border-2 border-amber-500 bg-amber-500/20 text-sm font-bold text-amber-400">
                  {step}
                </div>
                <h3 className="text-xs font-bold uppercase text-white">{title}</h3>
                <p className="mt-1 text-[10px] text-zinc-400">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Upload section */}
        <section className="mb-10">
          <h2 className="mb-4 text-sm font-bold uppercase text-amber-400">Upload Your PDF</h2>

          {processing.status === "idle" ? (
            <>
              {/* Drop zone */}
              <div
                className={`pixel-shadow relative rounded-none border-2 border-dashed p-10 text-center transition-colors ${
                  dragActive
                    ? "border-amber-400 bg-amber-400/10"
                    : file
                    ? "border-emerald-500 bg-emerald-500/10"
                    : "border-zinc-600 bg-zinc-800 hover:border-zinc-500"
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={handleFileChange}
                  className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                />

                {file ? (
                  <div className="flex flex-col items-center gap-3">
                    <svg className="h-12 w-12 text-emerald-400" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm-1 7V3.5L18.5 9H13z" />
                    </svg>
                    <p className="text-sm font-bold text-emerald-400">{file.name}</p>
                    <p className="text-xs text-zinc-400">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3">
                    <svg className="h-12 w-12 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                      />
                    </svg>
                    <p className="text-xs uppercase text-zinc-400">
                      Drag and drop your PDF here, or click to browse
                    </p>
                    <p className="text-[10px] text-zinc-500">
                      Supports books, notes, course materials, research papers
                    </p>
                  </div>
                )}
              </div>

              {/* Upload button */}
              {file && (
                <div className="mt-4 flex justify-center gap-4">
                  <button
                    onClick={resetUpload}
                    className="pixel-shadow rounded-none border-2 border-zinc-600 bg-zinc-700 px-6 py-3 text-xs font-bold uppercase text-zinc-300 transition hover:bg-zinc-600"
                  >
                    Clear
                  </button>
                  <button
                    onClick={handleUpload}
                    className="pixel-shadow rounded-none border-2 border-emerald-600 bg-emerald-600 px-8 py-3 text-xs font-bold uppercase text-white transition hover:bg-emerald-500"
                  >
                    Generate RPG
                  </button>
                </div>
              )}
            </>
          ) : (
            /* Processing status */
            <div className="pixel-shadow rounded-none border-2 border-zinc-600 bg-zinc-800 p-8">
              <div className="flex flex-col items-center gap-4">
                {processing.status === "error" ? (
                  <>
                    <svg className="h-12 w-12 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <p className="text-sm font-bold text-red-400">{processing.message}</p>
                    {processing.error && (
                      <p className="text-xs text-zinc-400">{processing.error}</p>
                    )}
                    <button
                      onClick={resetUpload}
                      className="mt-2 pixel-shadow rounded-none border-2 border-zinc-600 bg-zinc-700 px-6 py-2 text-xs font-bold uppercase text-zinc-300 transition hover:bg-zinc-600"
                    >
                      Try Again
                    </button>
                  </>
                ) : processing.status === "complete" ? (
                  <>
                    <svg className="h-12 w-12 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <p className="text-sm font-bold text-emerald-400">{processing.message}</p>
                    <p className="text-xs text-zinc-400">Redirecting to your game...</p>
                  </>
                ) : (
                  <>
                    {/* Spinner */}
                    <div className="relative h-12 w-12">
                      <div className="absolute inset-0 animate-spin rounded-full border-4 border-amber-400 border-t-transparent" />
                    </div>
                    <p className="text-sm font-bold text-amber-400">{processing.message}</p>
                    {processing.progress !== undefined && (
                      <div className="w-full max-w-xs">
                        <div className="h-3 w-full overflow-hidden rounded-none border-2 border-zinc-600 bg-zinc-700">
                          <div
                            className="h-full transition-[width] duration-300"
                            style={{
                              width: `${processing.progress}%`,
                              background:
                                "repeating-linear-gradient(90deg, #facc15 0px, #facc15 4px, #eab308 4px, #eab308 8px)",
                            }}
                          />
                        </div>
                        <p className="mt-1 text-right text-[10px] text-zinc-400">
                          {processing.progress}%
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Chapter preview */}
              {processing.chapters && processing.chapters.length > 0 && (
                <div className="mt-6 border-t border-zinc-700 pt-4">
                  <h3 className="mb-3 text-xs font-bold uppercase text-zinc-400">
                    Detected Chapters
                  </h3>
                  <div className="max-h-48 overflow-y-auto">
                    {processing.chapters.map((chapter) => (
                      <div
                        key={chapter.chapterNumber}
                        className="mb-2 rounded-none border border-zinc-700 bg-zinc-900 p-3"
                      >
                        <p className="text-xs font-bold text-white">
                          {chapter.chapterNumber}. {chapter.title}
                        </p>
                        <p className="mt-1 text-[10px] text-zinc-500 line-clamp-2">
                          {chapter.contentPreview}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </section>

        {/* Tips section */}
        <section>
          <h2 className="mb-4 text-sm font-bold uppercase text-amber-400">Tips for Best Results</h2>
          <div className="pixel-shadow rounded-none border-2 border-zinc-600 bg-zinc-800 p-6">
            <ul className="space-y-3 text-xs text-zinc-300">
              <li className="flex items-start gap-3">
                <span className="text-emerald-400">✓</span>
                <span>PDFs with clear chapter headings work best for automatic splitting</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-emerald-400">✓</span>
                <span>Educational content (textbooks, non-fiction) generates better questions</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-emerald-400">✓</span>
                <span>Longer documents create more levels and longer gameplay</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-amber-400">!</span>
                <span>Processing may take a few minutes for large documents</span>
              </li>
            </ul>
          </div>
        </section>
      </div>
    </div>
  );
}
