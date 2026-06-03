"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiPost } from "@/lib/api-client";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function NotificationsPage() {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [type, setType] = useState("system");
  const [userId, setUserId] = useState("");
  const [broadcast, setBroadcast] = useState(false);

  const mutation = useMutation({
    mutationFn: () =>
      apiPost<{ sent_to: number }>("/admin/notifications/send", {
        title,
        message,
        type,
        user_id: broadcast ? undefined : userId || undefined,
        broadcast,
      }),
    onSuccess: (res) => {
      toast.success(`Notifikasi terkirim ke ${res.data.sent_to} penerima`);
      setTitle("");
      setMessage("");
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <PageHeader
        title="Kirim Notifikasi"
        description="Kirim notifikasi ke anggota tertentu atau semua"
      />
      <Card>
        <CardHeader>
          <CardTitle>Form Notifikasi</CardTitle>
          <CardDescription>Pilih broadcast untuk kirim ke semua anggota</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Judul</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div>
            <Label>Pesan</Label>
            <Textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={4} />
          </div>
          <div>
            <Label>Tipe</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="system">Sistem</SelectItem>
                <SelectItem value="promo">Promo</SelectItem>
                <SelectItem value="membership_reminder">Pengingat Membership</SelectItem>
                <SelectItem value="workout_reminder">Pengingat Latihan</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="broadcast"
              checked={broadcast}
              onChange={(e) => setBroadcast(e.target.checked)}
            />
            <Label htmlFor="broadcast">Kirim ke semua anggota</Label>
          </div>
          {!broadcast && (
            <div>
              <Label>ID Anggota (opsional)</Label>
              <Input value={userId} onChange={(e) => setUserId(e.target.value)} />
            </div>
          )}
          <Button
            onClick={() => mutation.mutate()}
            disabled={!title || !message || mutation.isPending}
          >
            Kirim
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
