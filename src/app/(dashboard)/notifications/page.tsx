"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiPost } from "@/lib/api-client";
import { PageHeader } from "@/components/shared/page-header";
import { MemberSearchInput } from "@/components/shared/member-search-input";
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
    mutationFn: () => {
      if (!broadcast && !userId.trim()) {
        throw new Error("Pilih anggota atau aktifkan broadcast");
      }
      return apiPost<{ sent_to: number }>("/admin/notifications/send", {
        title,
        message,
        type,
        user_id: broadcast ? undefined : userId.trim(),
        broadcast,
      });
    },
    onSuccess: (res) => {
      toast.success(`Notifikasi terkirim ke ${res.data.sent_to} penerima`);
      setTitle("");
      setMessage("");
      setUserId("");
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <PageHeader
        title="Kirim Notifikasi"
        description="Notifikasi muncul di app member (lonceng) dan banner perangkat"
      />
      <Card>
        <CardHeader>
          <CardTitle>Form Notifikasi</CardTitle>
          <CardDescription>
            Kirim ke satu anggota atau broadcast ke semua. Chat dari menu Chat
            otomatis menjadi notifikasi bertipe Chat di app member.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Judul</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Contoh: Promo bulan ini"
            />
          </div>
          <div className="space-y-2">
            <Label>Pesan</Label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              placeholder="Isi pesan yang akan dibaca member"
            />
          </div>
          <div className="space-y-2">
            <Label>Tipe</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="system">Sistem</SelectItem>
                <SelectItem value="promo">Promo</SelectItem>
                <SelectItem value="membership_reminder">
                  Pengingat Membership
                </SelectItem>
                <SelectItem value="workout_reminder">
                  Pengingat Latihan
                </SelectItem>
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
            <div className="space-y-2">
              <Label>Anggota</Label>
              <MemberSearchInput value={userId} onChange={setUserId} />
            </div>
          )}
          <Button
            onClick={() => mutation.mutate()}
            disabled={
              !title ||
              !message ||
              mutation.isPending ||
              (!broadcast && !userId.trim())
            }
          >
            Kirim
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
