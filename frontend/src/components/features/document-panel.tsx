"use client";

import { useState } from "react";
import { Button } from "@/components/ui";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MockBadge } from "@/components/horizon-ui";
import { ExternalLink, Trash2, Plus } from "lucide-react";
import type { ProjectDocument } from "@/lib/types";

interface DocumentPanelProps {
  documents: ProjectDocument[];
  onUpdate: (docs: ProjectDocument[]) => Promise<void>;
}

export function DocumentPanel({ documents, onUpdate }: DocumentPanelProps) {
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [docType, setDocType] = useState<ProjectDocument['type']>("sharepoint");
  const [saving, setSaving] = useState(false);

  const handleAdd = async () => {
    if (!title.trim() || !url.trim()) return;
    setSaving(true);
    try {
      const newDoc: ProjectDocument = {
        id: crypto.randomUUID(),
        title: title.trim(),
        url: url.trim(),
        type: docType,
        addedAt: new Date().toISOString(),
      };
      await onUpdate([...documents, newDoc]);
      setTitle("");
      setUrl("");
      setDocType("sharepoint");
      setAdding(false);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Remove this document?")) return;
    await onUpdate(documents.filter((d) => d.id !== id));
  };

  const TYPE_LABELS: Record<ProjectDocument['type'], string> = {
    sharepoint: "SharePoint",
    link: "Link",
    file: "File",
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <MockBadge system="SharePoint" />
        <Button size="sm" variant="outline" onClick={() => setAdding(!adding)}>
          <Plus className="h-3 w-3 mr-1" /> Add document
        </Button>
      </div>

      {adding && (
        <div className="border rounded-lg p-4 space-y-3 bg-muted/30">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="doc-title">Title</Label>
              <Input
                id="doc-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Document title"
              />
            </div>
            <div className="space-y-1">
              <Label>Type</Label>
              <Select value={docType} onValueChange={(v) => setDocType(v as ProjectDocument['type'])}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sharepoint">SharePoint</SelectItem>
                  <SelectItem value="link">Link</SelectItem>
                  <SelectItem value="file">File</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="doc-url">URL</Label>
            <Input
              id="doc-url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://..."
            />
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleAdd} disabled={saving || !title.trim() || !url.trim()}>
              {saving ? "Saving..." : "Add"}
            </Button>
            <Button size="sm" variant="outline" onClick={() => setAdding(false)}>Cancel</Button>
          </div>
        </div>
      )}

      {documents.length === 0 && !adding && (
        <p className="text-sm text-muted-foreground italic">No documents linked yet.</p>
      )}

      {documents.length > 0 && (
        <div className="space-y-2">
          {documents.map((doc) => (
            <div key={doc.id} className="flex items-center justify-between border rounded-lg p-3">
              <div className="flex items-center gap-2 min-w-0">
                <Badge variant="outline" className="text-xs flex-shrink-0">
                  {TYPE_LABELS[doc.type]}
                </Badge>
                <span className="text-sm font-medium truncate">{doc.title}</span>
              </div>
              <div className="flex items-center gap-1 ml-2">
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 w-7 p-0"
                  onClick={() => window.open(doc.url, '_blank')}
                  title="Open document"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                  onClick={() => handleDelete(doc.id)}
                  title="Remove document"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
