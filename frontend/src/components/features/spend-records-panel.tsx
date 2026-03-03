"use client";

import { useState, useMemo } from "react";
import { Plus, Edit2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSpendRecords, useUpsertSpendRecord, useDeleteSpendRecord } from "@/lib/queries";
import type { SpendRecordFull } from "@/lib/types";

const fmtAmount = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", notation: "compact", maximumFractionDigits: 1 }).format(n);

const CATEGORY_OPTIONS = ["labor", "nre", "capital"] as const;
type Category = typeof CATEGORY_OPTIONS[number];

const SUBCATEGORY_MAP: Record<Category, string[]> = {
  labor: ["regular-fte", "contractor", "subcontractor"],
  nre: ["parts", "supplies", "licenses"],
  capital: ["testers", "tbus"],
};

function labelOf(str: string) {
  return str.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

const EMPTY_RECORD = {
  recordDate: "",
  category: "labor" as Category,
  subcategory: "regular-fte",
  amount: "",
  description: "",
  poNumber: "",
  soNumber: "",
  vendor: "",
  isActual: true,
};

interface SpendDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  record?: SpendRecordFull;
}

function SpendDialog({ open, onOpenChange, projectId, record }: SpendDialogProps) {
  const [recordDate, setRecordDate] = useState(record?.recordDate ?? "");
  const [category, setCategory] = useState<Category>((record?.category as Category) ?? "labor");
  const [subcategory, setSubcategory] = useState(record?.subcategory ?? "regular-fte");
  const [amount, setAmount] = useState(record?.amount?.toString() ?? "");
  const [description, setDescription] = useState(record?.description ?? "");
  const [poNumber, setPoNumber] = useState(record?.poNumber ?? "");
  const [soNumber, setSoNumber] = useState(record?.soNumber ?? "");
  const [vendor, setVendor] = useState(record?.vendor ?? "");
  const [isActual, setIsActual] = useState(record?.isActual ?? true);

  const upsertRecord = useUpsertSpendRecord();
  const deleteRecord = useDeleteSpendRecord();

  const handleCategoryChange = (val: Category) => {
    setCategory(val);
    setSubcategory(SUBCATEGORY_MAP[val][0]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recordDate || !amount) return;
    await upsertRecord.mutateAsync({
      id: record?.id,
      projectId,
      recordDate,
      category,
      subcategory,
      amount: parseFloat(amount),
      description: description || undefined,
      poNumber: poNumber || undefined,
      soNumber: soNumber || undefined,
      vendor: vendor || undefined,
      isActual,
    });
    onOpenChange(false);
  };

  const handleDelete = async () => {
    if (!record) return;
    if (!window.confirm("Delete this spend record?")) return;
    await deleteRecord.mutateAsync({ id: record.id, projectId });
    onOpenChange(false);
  };

  const isPending = upsertRecord.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{record ? "Edit spend record" : "Add spend record"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sr-date">Date *</Label>
              <Input id="sr-date" type="date" value={recordDate} onChange={(e) => setRecordDate(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sr-amount">Amount *</Label>
              <Input id="sr-amount" type="number" step="0.01" min={0} value={amount} onChange={(e) => setAmount(e.target.value)} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Category *</Label>
              <Select value={category} onValueChange={(v) => handleCategoryChange(v as Category)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORY_OPTIONS.map((c) => (
                    <SelectItem key={c} value={c}>{labelOf(c)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Subcategory</Label>
              <Select value={subcategory} onValueChange={setSubcategory}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SUBCATEGORY_MAP[category].map((s) => (
                    <SelectItem key={s} value={s}>{labelOf(s)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="sr-desc">Description</Label>
            <Input id="sr-desc" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sr-po">PO number</Label>
              <Input id="sr-po" value={poNumber} onChange={(e) => setPoNumber(e.target.value)} placeholder="PO-XXXX" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sr-so">SO number</Label>
              <Input id="sr-so" value={soNumber} onChange={(e) => setSoNumber(e.target.value)} placeholder="SO-XXXX" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="sr-vendor">Vendor</Label>
            <Input id="sr-vendor" value={vendor} onChange={(e) => setVendor(e.target.value)} />
          </div>
          <div className="flex items-center gap-2">
            <input
              id="sr-actual"
              type="checkbox"
              checked={isActual}
              onChange={(e) => setIsActual(e.target.checked)}
              className="rounded border"
            />
            <Label htmlFor="sr-actual">Actual spend (uncheck for forecast)</Label>
          </div>
          <DialogFooter className="flex justify-between">
            {record && (
              <Button type="button" variant="destructive" size="sm" onClick={handleDelete} disabled={deleteRecord.isPending}>
                <Trash2 className="h-3 w-3 mr-1" /> Delete
              </Button>
            )}
            <div className="flex gap-2 ml-auto">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" disabled={isPending}>{isPending ? "Saving..." : "Save"}</Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

interface SpendRecordsPanelProps {
  projectId: string;
}

export function SpendRecordsPanel({ projectId }: SpendRecordsPanelProps) {
  const { data: records = [], isLoading } = useSpendRecords(projectId);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<SpendRecordFull | undefined>();

  const handleAdd = () => {
    setEditing(undefined);
    setDialogOpen(true);
  };

  const handleEdit = (r: SpendRecordFull) => {
    setEditing(r);
    setDialogOpen(true);
  };

  const categoryTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    records.forEach((r: SpendRecordFull) => {
      totals[r.category] = (totals[r.category] ?? 0) + r.amount;
    });
    return totals;
  }, [records]);

  const grandTotal = useMemo(() => records.reduce((sum: number, r: SpendRecordFull) => sum + r.amount, 0), [records]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Spend records</h3>
        <Button size="sm" variant="outline" onClick={handleAdd}>
          <Plus className="h-3 w-3 mr-1" /> Add spend
        </Button>
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Loading...</p>}

      {!isLoading && records.length === 0 && (
        <p className="text-sm text-muted-foreground italic">No spend records yet</p>
      )}

      {!isLoading && records.length > 0 && (
        <div className="rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground">Date</th>
                <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground">Category</th>
                <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground">Subcategory</th>
                <th className="text-right px-3 py-2 text-xs font-medium text-muted-foreground">Amount</th>
                <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground">PO #</th>
                <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground">SO #</th>
                <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground">Vendor</th>
                <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground">Type</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {records.map((r: SpendRecordFull) => (
                <tr key={r.id} className="hover:bg-muted/30 group">
                  <td className="px-3 py-2 text-xs whitespace-nowrap">{formatDate(r.recordDate)}</td>
                  <td className="px-3 py-2 text-xs">{labelOf(r.category)}</td>
                  <td className="px-3 py-2 text-xs text-muted-foreground">{r.subcategory ? labelOf(r.subcategory) : "-"}</td>
                  <td className="px-3 py-2 text-xs text-right font-medium tabular-nums">{fmtAmount(r.amount)}</td>
                  <td className="px-3 py-2 text-xs text-muted-foreground">{r.poNumber || "-"}</td>
                  <td className="px-3 py-2 text-xs text-muted-foreground">{r.soNumber || "-"}</td>
                  <td className="px-3 py-2 text-xs text-muted-foreground truncate max-w-[100px]">{r.vendor || "-"}</td>
                  <td className="px-3 py-2">
                    <Badge variant={r.isActual ? "default" : "secondary"} className="text-xs">
                      {r.isActual ? "Actual" : "Forecast"}
                    </Badge>
                  </td>
                  <td className="px-3 py-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                      onClick={() => handleEdit(r)}
                    >
                      <Edit2 className="h-3 w-3" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-muted/50 border-t-2">
              <tr>
                <td colSpan={3} className="px-3 py-2 text-xs font-medium">
                  Totals by category:
                  {Object.entries(categoryTotals).map(([cat, total]) => (
                    <span key={cat} className="ml-2 text-muted-foreground">
                      {labelOf(cat)}: <span className="font-medium text-foreground">{fmtAmount(total)}</span>
                    </span>
                  ))}
                </td>
                <td className="px-3 py-2 text-xs font-semibold text-right tabular-nums">{fmtAmount(grandTotal)}</td>
                <td colSpan={5} />
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      <SpendDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        projectId={projectId}
        record={editing}
      />
    </div>
  );
}
