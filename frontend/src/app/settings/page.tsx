"use client";

import { useState } from "react";
import { PageLayout } from "@/components/layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { MockBadge } from "@/components/horizon-ui";
import { CapitalAssetDialog } from "@/components/features/capital-asset-dialog";
import { OkrDialog } from "@/components/features/okr-dialog";
import { GovernanceStagePipeline } from "@/components/features/governance-stage-pipeline";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  useLabourRates,
  useUpsertLabourRate,
  useDeleteLabourRate,
  useSkills,
  useUpsertSkill,
  useDeleteSkill,
  useUserRoles,
  useUpsertUserRole,
  useDeleteUserRole,
} from "@/lib/queries";
import type { CapitalAsset, Okr, LabourRate, Skill, UserRole } from "@/lib/types";

// ─── Alert rules tab ───────────────────────────────────────────────────────────

interface AlertRule {
  id: string;
  name: string;
  conditionType: string;
  conditionConfig: Record<string, unknown>;
  notificationChannels: string[];
  active: boolean;
  createdAt: string;
}

function AlertRulesTab() {
  const queryClient = useQueryClient();
  const { data: rules = [], isLoading } = useQuery<AlertRule[]>({
    queryKey: ['alert-rules'],
    queryFn: async () => {
      const res = await fetch('/api/alert-rules');
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const res = await fetch(`/api/alert-rules/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active }),
      });
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alert-rules'] });
      toast.success('Alert rule updated');
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Alert rules</h3>
        <Button size="sm" variant="outline">
          <Plus className="h-3 w-3 mr-1" /> New rule
        </Button>
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Loading...</p>}
      {!isLoading && rules.length === 0 && (
        <p className="text-sm text-muted-foreground italic">No alert rules configured</p>
      )}

      {rules.map((rule) => (
        <div key={rule.id} className="flex items-center justify-between border rounded-lg p-3">
          <div>
            <p className="text-sm font-medium">{rule.name}</p>
            <p className="text-xs text-muted-foreground">{rule.conditionType}</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={rule.active ? "secondary" : "outline"} className="text-xs">
              {rule.active ? 'Active' : 'Inactive'}
            </Badge>
            <Button
              size="sm"
              variant="outline"
              className="text-xs h-7"
              onClick={() => toggleActive.mutate({ id: rule.id, active: !rule.active })}
            >
              {rule.active ? 'Disable' : 'Enable'}
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Custom attributes tab ─────────────────────────────────────────────────────

interface CustomAttrDef {
  id: string;
  key: string;
  label: string;
  fieldType: string;
  required: boolean;
  sortOrder: number;
}

function CustomAttributesTab() {
  const { data: defs = [], isLoading } = useQuery<CustomAttrDef[]>({
    queryKey: ['custom-attr-defs'],
    queryFn: async () => {
      const res = await fetch('/api/custom-attributes/definitions');
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Custom attributes</h3>
        <Button size="sm" variant="outline">
          <Plus className="h-3 w-3 mr-1" /> Add attribute
        </Button>
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Loading...</p>}

      {defs.length > 0 && (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-3 py-2 text-xs font-medium">Key</th>
                <th className="text-left px-3 py-2 text-xs font-medium">Label</th>
                <th className="text-left px-3 py-2 text-xs font-medium">Type</th>
                <th className="text-left px-3 py-2 text-xs font-medium">Required</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {defs.map((d) => (
                <tr key={d.id} className="hover:bg-muted/30">
                  <td className="px-3 py-2 font-mono text-xs">{d.key}</td>
                  <td className="px-3 py-2">{d.label}</td>
                  <td className="px-3 py-2">
                    <Badge variant="outline" className="text-xs">{d.fieldType}</Badge>
                  </td>
                  <td className="px-3 py-2">
                    {d.required ? <Badge variant="secondary" className="text-xs">Required</Badge> : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Capital assets tab ────────────────────────────────────────────────────────

function CapitalAssetsTab() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selected, setSelected] = useState<CapitalAsset | null>(null);

  const { data: assets = [], isLoading } = useQuery<CapitalAsset[]>({
    queryKey: ['capital-assets'],
    queryFn: async () => {
      const res = await fetch('/api/capital-assets');
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
  });

  const handleSave = async (payload: Partial<CapitalAsset>) => {
    const url = selected ? `/api/capital-assets/${selected.id}` : '/api/capital-assets';
    const method = selected ? 'PUT' : 'POST';
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Failed to save');
    queryClient.invalidateQueries({ queryKey: ['capital-assets'] });
    toast.success(selected ? 'Asset updated' : 'Asset created');
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this asset?')) return;
    const res = await fetch(`/api/capital-assets/${id}`, { method: 'DELETE' });
    if (!res.ok) { toast.error('Failed to delete'); return; }
    queryClient.invalidateQueries({ queryKey: ['capital-assets'] });
    toast.success('Asset deleted');
  };

  const fmt = (n: number | null | undefined) =>
    n != null ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', notation: 'compact' }).format(n) : '—';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold">Capital assets</h3>
          <MockBadge system="Oracle ERP" />
        </div>
        <Button size="sm" variant="outline" onClick={() => { setSelected(null); setDialogOpen(true); }}>
          <Plus className="h-3 w-3 mr-1" /> New asset
        </Button>
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Loading...</p>}
      {!isLoading && assets.length === 0 && (
        <p className="text-sm text-muted-foreground italic">No capital assets recorded</p>
      )}

      {assets.length > 0 && (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-3 py-2 text-xs font-medium">Name</th>
                <th className="text-left px-3 py-2 text-xs font-medium">Type</th>
                <th className="text-left px-3 py-2 text-xs font-medium">Status</th>
                <th className="text-left px-3 py-2 text-xs font-medium">Owner</th>
                <th className="text-right px-3 py-2 text-xs font-medium">Value</th>
                <th className="text-left px-3 py-2 text-xs font-medium">Calibration due</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {assets.map((a) => (
                <tr key={a.id} className="hover:bg-muted/30">
                  <td className="px-3 py-2 font-medium">{a.name}</td>
                  <td className="px-3 py-2"><Badge variant="outline" className="text-xs">{a.assetType}</Badge></td>
                  <td className="px-3 py-2"><Badge variant={a.status === 'active' ? 'secondary' : 'outline'} className="text-xs">{a.status}</Badge></td>
                  <td className="px-3 py-2 text-muted-foreground">{a.owner ?? '—'}</td>
                  <td className="px-3 py-2 text-right font-mono">{fmt(a.value)}</td>
                  <td className="px-3 py-2 text-muted-foreground">{a.calibrationDue ?? '—'}</td>
                  <td className="px-3 py-2 text-right">
                    <div className="flex justify-end gap-1">
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => { setSelected(a); setDialogOpen(true); }}>
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive hover:text-destructive" onClick={() => handleDelete(a.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <CapitalAssetDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        asset={selected}
        onSave={handleSave}
      />
    </div>
  );
}

// ─── OKRs tab ──────────────────────────────────────────────────────────────────

function OkrsTab() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selected, setSelected] = useState<Okr | null>(null);
  const [defaultParentId, setDefaultParentId] = useState<string | undefined>();
  const [defaultType, setDefaultType] = useState<'objective' | 'key_result'>('objective');

  const { data: okrs = [], isLoading } = useQuery<Okr[]>({
    queryKey: ['okrs'],
    queryFn: async () => {
      const res = await fetch('/api/okrs');
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
  });

  const objectives = okrs.filter((o) => o.type === 'objective');
  const keyResults = (parentId: string) => okrs.filter((o) => o.type === 'key_result' && o.parentId === parentId);

  const handleSave = async (payload: Partial<Okr>) => {
    const url = selected ? `/api/okrs/${selected.id}` : '/api/okrs';
    const method = selected ? 'PUT' : 'POST';
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Failed to save');
    queryClient.invalidateQueries({ queryKey: ['okrs'] });
    toast.success(selected ? 'OKR updated' : 'OKR created');
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this OKR?')) return;
    const res = await fetch(`/api/okrs/${id}`, { method: 'DELETE' });
    if (!res.ok) { toast.error('Failed to delete'); return; }
    queryClient.invalidateQueries({ queryKey: ['okrs'] });
    toast.success('OKR deleted');
  };

  const openCreate = (type: 'objective' | 'key_result', parentId?: string) => {
    setSelected(null);
    setDefaultType(type);
    setDefaultParentId(parentId);
    setDialogOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">OKR management</h3>
        <Button size="sm" variant="outline" onClick={() => openCreate('objective')}>
          <Plus className="h-3 w-3 mr-1" /> New objective
        </Button>
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Loading...</p>}
      {!isLoading && objectives.length === 0 && (
        <p className="text-sm text-muted-foreground italic">No objectives defined yet</p>
      )}

      <div className="space-y-3">
        {objectives.map((obj) => {
          const krs = keyResults(obj.id);
          return (
            <div key={obj.id} className="border rounded-lg overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 bg-muted/30">
                <div>
                  <p className="text-sm font-medium">{obj.title}</p>
                  {obj.owner && <p className="text-xs text-muted-foreground">{obj.owner}</p>}
                </div>
                <div className="flex items-center gap-1">
                  <Badge variant="outline" className="text-xs">{obj.status}</Badge>
                  <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => openCreate('key_result', obj.id)}>
                    <Plus className="h-3 w-3 mr-1" /> KR
                  </Button>
                  <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => { setSelected(obj); setDefaultType('objective'); setDefaultParentId(undefined); setDialogOpen(true); }}>
                    <Pencil className="h-3 w-3" />
                  </Button>
                  <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive hover:text-destructive" onClick={() => handleDelete(obj.id)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              {krs.length > 0 && (
                <div className="divide-y">
                  {krs.map((kr) => (
                    <div key={kr.id} className="flex items-center justify-between px-6 py-2">
                      <div>
                        <p className="text-sm">{kr.title}</p>
                        {kr.targetValue != null && (
                          <p className="text-xs text-muted-foreground">Target: {kr.targetValue} {kr.unit ?? ''}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <Badge variant="secondary" className="text-xs">{kr.status}</Badge>
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => { setSelected(kr); setDefaultType('key_result'); setDefaultParentId(kr.parentId); setDialogOpen(true); }}>
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive hover:text-destructive" onClick={() => handleDelete(kr.id)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <OkrDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        okr={selected}
        defaultType={defaultType}
        defaultParentId={defaultParentId}
        onSave={handleSave}
      />
    </div>
  );
}

// ─── Labour rates tab ──────────────────────────────────────────────────────────

const SENIORITY_LEVELS = ['junior', 'mid', 'senior', 'lead', 'principal'] as const;
const CURRENCIES = ['USD', 'EUR', 'DKK', 'GBP', 'JPY', 'CNY'] as const;

interface LabourRateFormState {
  region: string;
  seniorityLevel: string;
  roleCategory: string;
  ratePerHour: string;
  currency: string;
  effectiveDate: string;
}

const EMPTY_RATE_FORM: LabourRateFormState = {
  region: '',
  seniorityLevel: 'mid',
  roleCategory: '',
  ratePerHour: '',
  currency: 'USD',
  effectiveDate: '',
};

function LabourRatesTab() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selected, setSelected] = useState<LabourRate | null>(null);
  const [form, setForm] = useState<LabourRateFormState>(EMPTY_RATE_FORM);

  const { data: rates = [], isLoading } = useLabourRates();
  const upsert = useUpsertLabourRate();
  const remove = useDeleteLabourRate();

  const openCreate = () => {
    setSelected(null);
    setForm(EMPTY_RATE_FORM);
    setDialogOpen(true);
  };

  const openEdit = (rate: LabourRate) => {
    setSelected(rate);
    setForm({
      region: rate.region,
      seniorityLevel: rate.seniorityLevel,
      roleCategory: rate.roleCategory ?? '',
      ratePerHour: String(rate.ratePerHour),
      currency: rate.currency,
      effectiveDate: rate.effectiveDate,
    });
    setDialogOpen(true);
  };

  const handleSave = () => {
    const payload: Partial<LabourRate> = {
      ...(selected ? { id: selected.id } : {}),
      region: form.region,
      seniorityLevel: form.seniorityLevel,
      roleCategory: form.roleCategory || undefined,
      ratePerHour: Number(form.ratePerHour),
      currency: form.currency,
      effectiveDate: form.effectiveDate,
    };
    upsert.mutate(payload, {
      onSuccess: () => setDialogOpen(false),
    });
  };

  const handleDelete = (id: string) => {
    if (!window.confirm('Delete this rate?')) return;
    remove.mutate(id);
  };

  const fmt = (n: number) => new Intl.NumberFormat('en-US', { minimumFractionDigits: 2 }).format(n);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Labour rates</h3>
        <Button size="sm" variant="outline" onClick={openCreate}>
          <Plus className="h-3 w-3 mr-1" /> New rate
        </Button>
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Loading...</p>}
      {!isLoading && rates.length === 0 && (
        <p className="text-sm text-muted-foreground italic">No labour rates configured</p>
      )}

      {rates.length > 0 && (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-3 py-2 text-xs font-medium">Region</th>
                <th className="text-left px-3 py-2 text-xs font-medium">Seniority</th>
                <th className="text-left px-3 py-2 text-xs font-medium">Role category</th>
                <th className="text-right px-3 py-2 text-xs font-medium">Rate/hr</th>
                <th className="text-left px-3 py-2 text-xs font-medium">Currency</th>
                <th className="text-left px-3 py-2 text-xs font-medium">Effective date</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {rates.map((r) => (
                <tr key={r.id} className="hover:bg-muted/30">
                  <td className="px-3 py-2">{r.region}</td>
                  <td className="px-3 py-2">
                    <Badge variant="outline" className="text-xs">{r.seniorityLevel}</Badge>
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">{r.roleCategory ?? '—'}</td>
                  <td className="px-3 py-2 text-right font-mono">{fmt(r.ratePerHour)}</td>
                  <td className="px-3 py-2 text-muted-foreground">{r.currency}</td>
                  <td className="px-3 py-2 text-muted-foreground">{r.effectiveDate}</td>
                  <td className="px-3 py-2 text-right">
                    <div className="flex justify-end gap-1">
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => openEdit(r)}>
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive hover:text-destructive" onClick={() => handleDelete(r.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{selected ? 'Edit rate' : 'New rate'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1">
              <Label className="text-xs">Region</Label>
              <Input
                value={form.region}
                onChange={(e) => setForm((f) => ({ ...f, region: e.target.value }))}
                placeholder="e.g. EMEA, US, APAC"
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Seniority level</Label>
              <select
                className="w-full text-sm border rounded px-2 py-1.5 h-8"
                value={form.seniorityLevel}
                onChange={(e) => setForm((f) => ({ ...f, seniorityLevel: e.target.value }))}
              >
                {SENIORITY_LEVELS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Role category (optional)</Label>
              <Input
                value={form.roleCategory}
                onChange={(e) => setForm((f) => ({ ...f, roleCategory: e.target.value }))}
                placeholder="e.g. Software Engineer"
                className="h-8 text-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Rate per hour</Label>
                <Input
                  type="number"
                  min={0}
                  step={0.01}
                  value={form.ratePerHour}
                  onChange={(e) => setForm((f) => ({ ...f, ratePerHour: e.target.value }))}
                  placeholder="0.00"
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Currency</Label>
                <select
                  className="w-full text-sm border rounded px-2 py-1.5 h-8"
                  value={form.currency}
                  onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value }))}
                >
                  {CURRENCIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Effective date</Label>
              <Input
                type="date"
                value={form.effectiveDate}
                onChange={(e) => setForm((f) => ({ ...f, effectiveDate: e.target.value }))}
                className="h-8 text-sm"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={upsert.isPending || !form.region || !form.ratePerHour || !form.effectiveDate}
            >
              {upsert.isPending ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Skills tab ────────────────────────────────────────────────────────────────

interface SkillFormState {
  name: string;
  category: string;
  description: string;
}

const EMPTY_SKILL_FORM: SkillFormState = { name: '', category: '', description: '' };

function SkillsTab() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selected, setSelected] = useState<Skill | null>(null);
  const [form, setForm] = useState<SkillFormState>(EMPTY_SKILL_FORM);

  const { data: skills = [], isLoading } = useSkills();
  const upsert = useUpsertSkill();
  const remove = useDeleteSkill();

  const openCreate = () => {
    setSelected(null);
    setForm(EMPTY_SKILL_FORM);
    setDialogOpen(true);
  };

  const openEdit = (skill: Skill) => {
    setSelected(skill);
    setForm({
      name: skill.name,
      category: skill.category ?? '',
      description: skill.description ?? '',
    });
    setDialogOpen(true);
  };

  const handleSave = () => {
    const payload: Partial<Skill> = {
      ...(selected ? { id: selected.id } : {}),
      name: form.name,
      category: form.category || undefined,
      description: form.description || undefined,
    };
    upsert.mutate(payload, {
      onSuccess: () => setDialogOpen(false),
    });
  };

  const handleDelete = (id: string) => {
    if (!window.confirm('Delete this skill?')) return;
    remove.mutate(id);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Skills</h3>
        <Button size="sm" variant="outline" onClick={openCreate}>
          <Plus className="h-3 w-3 mr-1" /> Add skill
        </Button>
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Loading...</p>}
      {!isLoading && skills.length === 0 && (
        <p className="text-sm text-muted-foreground italic">No skills defined</p>
      )}

      {skills.length > 0 && (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-3 py-2 text-xs font-medium">Name</th>
                <th className="text-left px-3 py-2 text-xs font-medium">Category</th>
                <th className="text-left px-3 py-2 text-xs font-medium">Description</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {skills.map((s) => (
                <tr key={s.id} className="hover:bg-muted/30">
                  <td className="px-3 py-2 font-medium">{s.name}</td>
                  <td className="px-3 py-2">
                    {s.category ? (
                      <Badge variant="outline" className="text-xs">{s.category}</Badge>
                    ) : '—'}
                  </td>
                  <td className="px-3 py-2 text-muted-foreground text-xs">{s.description ?? '—'}</td>
                  <td className="px-3 py-2 text-right">
                    <div className="flex justify-end gap-1">
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => openEdit(s)}>
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive hover:text-destructive" onClick={() => handleDelete(s.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{selected ? 'Edit skill' : 'Add skill'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1">
              <Label className="text-xs">Name</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Skill name"
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Category (optional)</Label>
              <Input
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                placeholder="e.g. Technical, Soft skills"
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Description (optional)</Label>
              <Input
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Brief description"
                className="h-8 text-sm"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={upsert.isPending || !form.name}
            >
              {upsert.isPending ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── User roles tab (access control) ──────────────────────────────────────────

const ROLE_VARIANT: Record<UserRole['role'], 'destructive' | 'secondary' | 'outline'> = {
  admin: 'destructive',
  pm: 'secondary',
  viewer: 'outline',
};

interface UserRoleFormState {
  userEmail: string;
  displayName: string;
  role: UserRole['role'];
}

const EMPTY_ROLE_FORM: UserRoleFormState = { userEmail: '', displayName: '', role: 'viewer' };

function UserRolesTab() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selected, setSelected] = useState<UserRole | null>(null);
  const [form, setForm] = useState<UserRoleFormState>(EMPTY_ROLE_FORM);

  const { data: userRoles = [], isLoading } = useUserRoles();
  const upsert = useUpsertUserRole();
  const remove = useDeleteUserRole();

  const openCreate = () => {
    setSelected(null);
    setForm(EMPTY_ROLE_FORM);
    setDialogOpen(true);
  };

  const openEdit = (ur: UserRole) => {
    setSelected(ur);
    setForm({
      userEmail: ur.userEmail,
      displayName: ur.displayName ?? '',
      role: ur.role,
    });
    setDialogOpen(true);
  };

  const handleSave = () => {
    const payload: Partial<UserRole> = {
      ...(selected ? { id: selected.id } : {}),
      userEmail: form.userEmail,
      displayName: form.displayName || undefined,
      role: form.role,
    };
    upsert.mutate(payload, {
      onSuccess: () => setDialogOpen(false),
    });
  };

  const handleDelete = (id: string) => {
    if (!window.confirm('Remove this user role?')) return;
    remove.mutate(id);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Access control</h3>
        <Button size="sm" variant="outline" onClick={openCreate}>
          <Plus className="h-3 w-3 mr-1" /> Add user
        </Button>
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Loading...</p>}
      {!isLoading && userRoles.length === 0 && (
        <p className="text-sm text-muted-foreground italic">No user roles configured</p>
      )}

      {userRoles.length > 0 && (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-3 py-2 text-xs font-medium">Email</th>
                <th className="text-left px-3 py-2 text-xs font-medium">Display name</th>
                <th className="text-left px-3 py-2 text-xs font-medium">Role</th>
                <th className="text-left px-3 py-2 text-xs font-medium">Created</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {userRoles.map((ur) => (
                <tr key={ur.id} className="hover:bg-muted/30">
                  <td className="px-3 py-2 font-mono text-xs">{ur.userEmail}</td>
                  <td className="px-3 py-2 text-muted-foreground">{ur.displayName ?? '—'}</td>
                  <td className="px-3 py-2">
                    <Badge variant={ROLE_VARIANT[ur.role]} className="text-xs">{ur.role}</Badge>
                  </td>
                  <td className="px-3 py-2 text-muted-foreground text-xs">
                    {new Date(ur.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <div className="flex justify-end gap-1">
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => openEdit(ur)}>
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive hover:text-destructive" onClick={() => handleDelete(ur.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{selected ? 'Edit user role' : 'Add user'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1">
              <Label className="text-xs">Email</Label>
              <Input
                type="email"
                value={form.userEmail}
                onChange={(e) => setForm((f) => ({ ...f, userEmail: e.target.value }))}
                placeholder="user@example.com"
                className="h-8 text-sm"
                disabled={!!selected}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Display name (optional)</Label>
              <Input
                value={form.displayName}
                onChange={(e) => setForm((f) => ({ ...f, displayName: e.target.value }))}
                placeholder="Full name"
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Role</Label>
              <select
                className="w-full text-sm border rounded px-2 py-1.5 h-8"
                value={form.role}
                onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as UserRole['role'] }))}
              >
                <option value="viewer">Viewer</option>
                <option value="pm">PM</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={upsert.isPending || !form.userEmail}
            >
              {upsert.isPending ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const [tab, setTab] = useState("attributes");

  return (
    <PageLayout
      header={{
        title: "Settings",
        subtitle: "Custom attributes, alert rules, calendars, and access control",
      }}
    >
      <Tabs value={tab} onValueChange={setTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="attributes">Custom attributes</TabsTrigger>
          <TabsTrigger value="alerts">Alert rules</TabsTrigger>
          <TabsTrigger value="assets">Assets</TabsTrigger>
          <TabsTrigger value="okrs">OKRs</TabsTrigger>
          <TabsTrigger value="labour-rates">Labour rates</TabsTrigger>
          <TabsTrigger value="skills">Skills</TabsTrigger>
          <TabsTrigger value="governance">Governance</TabsTrigger>
          <TabsTrigger value="access">Access control</TabsTrigger>
        </TabsList>

        <TabsContent value="attributes">
          <CustomAttributesTab />
        </TabsContent>
        <TabsContent value="alerts">
          <AlertRulesTab />
        </TabsContent>
        <TabsContent value="assets">
          <CapitalAssetsTab />
        </TabsContent>
        <TabsContent value="okrs">
          <OkrsTab />
        </TabsContent>
        <TabsContent value="labour-rates">
          <LabourRatesTab />
        </TabsContent>
        <TabsContent value="skills">
          <SkillsTab />
        </TabsContent>
        <TabsContent value="governance">
          <GovernanceStagePipeline />
        </TabsContent>
        <TabsContent value="access">
          <UserRolesTab />
        </TabsContent>
      </Tabs>
    </PageLayout>
  );
}
