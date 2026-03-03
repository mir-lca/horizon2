"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MockBadge } from "@/components/horizon-ui";
import { createOracleErpAdapter } from "@/lib/integrations";
import { toast } from "sonner";
import type { SpendRecord } from "@/lib/evm-calculations";

const EMPTY_RECORD: SpendRecord = {
  category: 'labor',
  amount: 0,
  type: 'realized',
};

interface SpendDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (record: SpendRecord) => void;
}

function SpendDialog({ open, onOpenChange, onSave }: SpendDialogProps) {
  const [record, setRecord] = useState<SpendRecord>({ ...EMPTY_RECORD });

  const handleSave = () => {
    if (!record.amount || record.amount <= 0) {
      toast.error('Amount must be positive');
      return;
    }
    onSave(record);
    setRecord({ ...EMPTY_RECORD });
    onOpenChange(false);
  };

  const set = <K extends keyof SpendRecord>(key: K, value: SpendRecord[K]) =>
    setRecord((r) => ({ ...r, [key]: value }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>Add spend record</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Date</Label>
              <Input type="date" value={record.date ?? ''} onChange={(e) => set('date', e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Period</Label>
              <Input placeholder="e.g. 2025-Q1" value={record.period ?? ''} onChange={(e) => set('period', e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Category</Label>
              <Select value={record.category} onValueChange={(v) => set('category', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['labor','nre','capital','other'].map((c) => <SelectItem key={c} value={c}>{c.toUpperCase()}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Type</Label>
              <Select value={record.type} onValueChange={(v) => set('type', v as SpendRecord['type'])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="realized">Realized</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1">
            <Label>Amount (USD)</Label>
            <Input type="number" value={record.amount} onChange={(e) => set('amount', Number(e.target.value))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>SO number</Label>
              <Input value={record.soNumber ?? ''} onChange={(e) => set('soNumber', e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>PO number</Label>
              <Input value={record.poNumber ?? ''} onChange={(e) => set('poNumber', e.target.value)} />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave}>Add record</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface SpendRecordsTableProps {
  projectId: string;
  spendRecords: SpendRecord[];
  onUpdate: (records: SpendRecord[]) => Promise<void>;
}

export function SpendRecordsTable({ projectId, spendRecords, onUpdate }: SpendRecordsTableProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [pulling, setPulling] = useState(false);

  const handleAdd = async (record: SpendRecord) => {
    await onUpdate([...spendRecords, record]);
  };

  const handleDelete = async (index: number) => {
    if (!window.confirm('Delete this spend record?')) return;
    const updated = spendRecords.filter((_, i) => i !== index);
    await onUpdate(updated);
  };

  const handlePullFromOracle = async () => {
    setPulling(true);
    try {
      const adapter = createOracleErpAdapter();
      const actuals = await adapter.getActuals(projectId);
      const newRecords: SpendRecord[] = actuals.map((a) => ({
        period: a.period,
        category: a.category,
        amount: a.amount,
        type: a.type,
        soNumber: a.soNumber,
        poNumber: a.poNumber,
      }));
      await onUpdate([...spendRecords, ...newRecords]);
      toast.success(`Imported ${newRecords.length} records from Oracle`);
    } catch {
      toast.error('Failed to pull from Oracle');
    } finally {
      setPulling(false);
    }
  };

  const totalRealized = spendRecords
    .filter((r) => r.type === 'realized')
    .reduce((sum, r) => sum + r.amount, 0);

  const fmt = (n: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', notation: 'compact' }).format(n);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold">Spend records</h3>
          <MockBadge system="Oracle ERP" />
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={handlePullFromOracle} disabled={pulling}>
            {pulling ? 'Pulling...' : 'Pull from Oracle'}
          </Button>
          <Button size="sm" variant="outline" onClick={() => setDialogOpen(true)}>
            <Plus className="h-3 w-3 mr-1" /> Add
          </Button>
        </div>
      </div>

      <div className="text-xs text-muted-foreground">
        Realized spend: <span className="font-medium">{fmt(totalRealized)}</span>
      </div>

      {spendRecords.length === 0 && (
        <p className="text-sm text-muted-foreground italic">No spend records</p>
      )}

      {spendRecords.length > 0 && (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-3 py-2 text-xs font-medium">Period</th>
                <th className="text-left px-3 py-2 text-xs font-medium">Category</th>
                <th className="text-right px-3 py-2 text-xs font-medium">Amount</th>
                <th className="text-left px-3 py-2 text-xs font-medium">Type</th>
                <th className="text-left px-3 py-2 text-xs font-medium">SO / PO</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {spendRecords.map((r, i) => (
                <tr key={i} className="hover:bg-muted/30">
                  <td className="px-3 py-2 text-muted-foreground">{r.period ?? r.date ?? '—'}</td>
                  <td className="px-3 py-2">
                    <Badge variant="outline" className="text-xs">{r.category.toUpperCase()}</Badge>
                  </td>
                  <td className="px-3 py-2 text-right font-mono">{fmt(r.amount)}</td>
                  <td className="px-3 py-2">
                    <Badge variant={r.type === 'realized' ? 'secondary' : 'outline'} className="text-xs">
                      {r.type}
                    </Badge>
                  </td>
                  <td className="px-3 py-2 text-muted-foreground text-xs">
                    {[r.soNumber, r.poNumber].filter(Boolean).join(' / ') || '—'}
                  </td>
                  <td className="px-3 py-2">
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => handleDelete(i)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <SpendDialog open={dialogOpen} onOpenChange={setDialogOpen} onSave={handleAdd} />
    </div>
  );
}
