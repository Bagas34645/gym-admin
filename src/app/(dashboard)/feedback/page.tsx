"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api-client";
import { PageHeader } from "@/components/shared/page-header";
import { TablePagination } from "@/components/shared/table-pagination";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDateTime } from "@/lib/format";

interface FeedbackItem {
  id: string;
  rating: number;
  category?: string;
  message?: string | null;
  is_anonymous?: boolean;
  created_at: string;
  user?: { name: string; email: string } | null;
}

export default function FeedbackPage() {
  const [page, setPage] = useState(1);

  const query = useQuery({
    queryKey: ["admin", "feedback", page],
    queryFn: () =>
      apiGet<FeedbackItem[]>("/admin/feedback", { page, per_page: 20 }),
  });

  const items = query.data?.data ?? [];

  return (
    <div className="space-y-6">
      <PageHeader title="Feedback" description="Ulasan dari anggota" />

      {query.isLoading ? (
        <Skeleton className="h-64" />
      ) : (
        <>
          <Card>
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Anggota</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead>Komentar</TableHead>
                    <TableHead>Waktu</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((f) => (
                    <TableRow key={f.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">
                            {f.is_anonymous ? "Anonim" : (f.user?.name ?? "-")}
                          </p>
                          {!f.is_anonymous && (
                            <p className="text-xs text-muted-foreground">
                              {f.user?.email}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{f.rating}/5</TableCell>
                      <TableCell className="max-w-md truncate">
                        {f.message || "-"}
                      </TableCell>
                      <TableCell>{formatDateTime(f.created_at)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          {query.data?.meta && (
            <TablePagination meta={query.data.meta} onPageChange={setPage} />
          )}
        </>
      )}
    </div>
  );
}
