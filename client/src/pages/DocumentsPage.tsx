import React from "react";
import DocumentManager from "@/components/DocumentManager";
import { FileText } from "lucide-react";

export default function DocumentsPage() {
  return (
    <div className="space-y-8 page-enter">
      {/* Header */}
      <div>
        <span className="eyebrow inline-flex items-center gap-1.5 text-xs font-semibold text-primary uppercase tracking-wider">
          <FileText size={14} /> LEARNING MATERIAL & EXTRACTION
        </span>
        <h1 className="text-2xl font-bold tracking-tight text-foreground mt-1">
          Upload & Analyze Study Material
        </h1>
        <p className="text-sm text-muted-foreground">
          Upload PDFs, notes, or course documents. Our AI cleans formatting, extracts core definitions, generates grounded MCQs, and lets you ask questions directly about the file.
        </p>
      </div>

      <DocumentManager />
    </div>
  );
}
