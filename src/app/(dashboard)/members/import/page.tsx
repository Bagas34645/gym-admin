"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { apiUpload } from "@/lib/api-client";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ImportResult {
  imported: number;
  skipped: number;
  errors: number;
  error_rows?: { row: number; message: string }[];
}

export default function ImportMembersPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  const handleImport = async () => {
    if (!file) {
      toast.error("Pilih file terlebih dahulu");
      return;
    }
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await apiUpload<ImportResult>("/admin/members/import", fd);
      setResult(res.data);
      toast.success(res.message);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <PageHeader
        title="Import Anggota"
        description="Unggah file CSV atau XLSX"
      />
      <Card>
        <CardHeader>
          <CardTitle>Upload File</CardTitle>
          <CardDescription>Format: nama, email, phone, password</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="file">File</Label>
            <Input
              id="file"
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.back()}>
              Batal
            </Button>
            <Button onClick={handleImport} disabled={loading || !file}>
              {loading ? "Mengimpor..." : "Import"}
            </Button>
          </div>
          {result && (
            <div className="rounded-lg border p-4 text-sm">
              <p>Berhasil: {result.imported}</p>
              <p>Dilewati: {result.skipped}</p>
              <p>Error: {result.errors}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
