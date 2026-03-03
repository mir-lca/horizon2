"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { PageLayout } from "@/components/layout";
import { Button } from "@/components/ui";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";

interface Program {
  id: string;
  name: string;
  status: string;
  description?: string;
  createdAt: string;
}

export default function ProgramsPage() {
  const router = useRouter();
  const { data: programs = [], isLoading } = useQuery<Program[]>({
    queryKey: ['programs'],
    queryFn: async () => {
      const res = await fetch('/api/programs');
      if (!res.ok) throw new Error('Failed to fetch programs');
      return res.json();
    },
  });

  return (
    <PageLayout
      header={{
        title: "Programs",
        subtitle: "Manage programs and their constituent projects",
        actions: (
          <Button size="sm">
            <Plus className="h-3 w-3 mr-1" /> New program
          </Button>
        ),
      }}
    >
      <div className="space-y-4">
        {isLoading && <p className="text-sm text-muted-foreground">Loading programs...</p>}

        {!isLoading && programs.length === 0 && (
          <div className="border rounded-lg p-8 text-center text-muted-foreground">
            <p className="text-sm">No programs yet. Create one to group related projects.</p>
          </div>
        )}

        <div className="space-y-2">
          {programs.map((program) => (
            <div key={program.id} className="border rounded-lg p-4 flex items-center justify-between hover:bg-accent/30 cursor-pointer" onClick={() => router.push(`/programs/${program.id}`)}>
              <div>
                <p className="font-medium text-sm">{program.name}</p>
                {program.description && (
                  <p className="text-xs text-muted-foreground mt-0.5">{program.description}</p>
                )}
              </div>
              <Badge
                variant={program.status === 'active' ? 'secondary' : 'outline'}
                className="text-xs"
              >
                {program.status}
              </Badge>
            </div>
          ))}
        </div>
      </div>
    </PageLayout>
  );
}
