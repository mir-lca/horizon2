"use client";

import { useState } from "react";
import { PageLayout } from "@/components/layout";
import { Button } from "@/components/ui";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { MockBadge } from "@/components/horizon-ui";
import { createHrSyncAdapter } from "@/lib/integrations";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Users, AlertTriangle, Archive, RotateCcw } from "lucide-react";
import type { Resource } from "@/lib/types";

function ResourcePoolTab() {
  const queryClient = useQueryClient();
  const [showArchived, setShowArchived] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const { data: resources = [], isLoading } = useQuery<Resource[]>({
    queryKey: ['resources', { includeArchived: showArchived }],
    queryFn: async () => {
      const url = showArchived ? '/api/resources?includeArchived=true' : '/api/resources';
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch resources');
      return res.json();
    },
  });

  const handleSync = async () => {
    setSyncing(true);
    try {
      const adapter = createHrSyncAdapter();
      const result = await adapter.syncEmployees();
      toast.success(`HR sync: ${result.synced} synced, ${result.errors} errors`);
    } catch {
      toast.error('HR sync failed');
    } finally {
      setSyncing(false);
    }
  };

  const handleArchive = async (id: string) => {
    if (!window.confirm('Archive this resource? It will be hidden from active lists.')) return;
    try {
      const res = await fetch(`/api/resources/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'archive' }),
      });
      if (!res.ok) throw new Error('Failed');
      queryClient.invalidateQueries({ queryKey: ['resources'] });
      toast.success('Resource archived');
    } catch {
      toast.error('Failed to archive resource');
    }
  };

  const handleRestore = async (id: string) => {
    try {
      const res = await fetch(`/api/resources/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'restore' }),
      });
      if (!res.ok) throw new Error('Failed');
      queryClient.invalidateQueries({ queryKey: ['resources'] });
      toast.success('Resource restored');
    } catch {
      toast.error('Failed to restore resource');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <MockBadge system="HR / Thrive" />
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer">
            <input
              type="checkbox"
              checked={showArchived}
              onChange={(e) => setShowArchived(e.target.checked)}
              className="rounded"
            />
            Show archived
          </label>
          <Button size="sm" variant="outline" onClick={handleSync} disabled={syncing}>
            {syncing ? 'Syncing...' : 'Sync from HR'}
          </Button>
        </div>
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Loading resources...</p>}

      {!isLoading && resources.length === 0 && (
        <p className="text-sm text-muted-foreground italic">No resources yet. Import from HR or add manually.</p>
      )}

      {resources.length > 0 && (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-3 py-2 text-xs font-medium">Resource</th>
                <th className="text-left px-3 py-2 text-xs font-medium">Competence</th>
                <th className="text-left px-3 py-2 text-xs font-medium">Business unit</th>
                <th className="text-left px-3 py-2 text-xs font-medium">Skills</th>
                <th className="text-right px-3 py-2 text-xs font-medium">Quantity</th>
                <th className="text-right px-3 py-2 text-xs font-medium">Wage / yr</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {resources.map((r: Resource) => (
                <tr key={r.id} className={r.archivedAt ? 'opacity-50 bg-muted/20' : 'hover:bg-muted/30'}>
                  <td className="px-3 py-2 font-medium">
                    <span className={r.archivedAt ? 'line-through' : ''}>{r.name ?? r.competenceName}</span>
                    {r.archivedAt && <Badge variant="outline" className="ml-2 text-xs">Archived</Badge>}
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">{r.competenceName}</td>
                  <td className="px-3 py-2 text-muted-foreground">{r.businessUnitId}</td>
                  <td className="px-3 py-2">
                    <div className="flex flex-wrap gap-1">
                      {(r.skills ?? []).map((s) => (
                        <Badge key={s} variant="outline" className="text-xs">{s}</Badge>
                      ))}
                    </div>
                  </td>
                  <td className="px-3 py-2 text-right">{r.quantity}</td>
                  <td className="px-3 py-2 text-right font-mono">
                    {r.yearlyWage
                      ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', notation: 'compact' }).format(r.yearlyWage)
                      : '—'}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {r.archivedAt ? (
                      <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => handleRestore(r.id)}>
                        <RotateCcw className="h-3 w-3 mr-1" /> Restore
                      </Button>
                    ) : (
                      <Button size="sm" variant="ghost" className="h-7 text-xs text-muted-foreground" onClick={() => handleArchive(r.id)}>
                        <Archive className="h-3 w-3 mr-1" /> Archive
                      </Button>
                    )}
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

function CapacityTab() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <h3 className="text-sm font-semibold">Resource capacity</h3>
        <MockBadge system="HR / Thrive" />
      </div>
      <div className="border rounded-lg p-6 text-center text-muted-foreground">
        <Users className="h-8 w-8 mx-auto mb-2 opacity-40" />
        <p className="text-sm">Resource leveling chart available after HR integration</p>
      </div>
    </div>
  );
}

function WorkforcePlanningTab() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <h3 className="text-sm font-semibold">Workforce planning</h3>
        <MockBadge system="HR / Thrive" />
      </div>
      <div className="border rounded-lg p-6 text-center text-muted-foreground">
        <AlertTriangle className="h-8 w-8 mx-auto mb-2 opacity-40" />
        <p className="text-sm">Demand vs supply planning requires HR system integration</p>
      </div>
    </div>
  );
}

export default function ResourcesPage() {
  const [tab, setTab] = useState("pool");

  return (
    <PageLayout
      header={{
        title: "Resources",
        subtitle: "Manage resource pool, capacity, and workforce planning",
      }}
    >
      <Tabs value={tab} onValueChange={setTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="pool">Resource pool</TabsTrigger>
          <TabsTrigger value="capacity">Capacity</TabsTrigger>
          <TabsTrigger value="workforce">Workforce planning</TabsTrigger>
        </TabsList>
        <TabsContent value="pool"><ResourcePoolTab /></TabsContent>
        <TabsContent value="capacity"><CapacityTab /></TabsContent>
        <TabsContent value="workforce"><WorkforcePlanningTab /></TabsContent>
      </Tabs>
    </PageLayout>
  );
}
