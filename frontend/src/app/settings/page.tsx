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
import type { CapitalAsset, Okr } from "@/lib/types";

// --- Alert rules tab ---
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

// --- Custom attributes tab ---
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

// --- Capital assets tab ---

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

// --- OKRs tab ---

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
        <TabsContent value="access">
          <div className="border rounded-lg p-8 text-center text-muted-foreground">
            <p className="text-sm">Role-based access control — assign users to roles via Azure AD</p>
          </div>
        </TabsContent>
      </Tabs>
    </PageLayout>
  );
}
