"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { CheckCircle2, Loader2, ScanFace, XCircle } from "lucide-react";
import { apiUpload } from "@/lib/api-client";
import { ApiClientError } from "@/lib/api-envelope";

interface KioskResult {
  attendance_id: string;
  member_name: string;
  member_photo_url: string | null;
  check_in_time: string;
  membership_valid_until: string;
  already_checked_in: boolean;
  confidence: number | null;
}

type Outcome =
  | { kind: "success"; data: KioskResult }
  | { kind: "warning"; message: string };

const SCAN_INTERVAL_MS = 3000;
const RESULT_DISPLAY_MS = 5000;

export default function KioskPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const lockedRef = useRef(false);

  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [outcome, setOutcome] = useState<Outcome | null>(null);

  const captureBlob = useCallback(async (): Promise<Blob | null> => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.videoWidth === 0) return null;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return new Promise((resolve) =>
      canvas.toBlob((b) => resolve(b), "image/jpeg", 0.9),
    );
  }, []);

  const scanOnce = useCallback(async () => {
    if (lockedRef.current) return;
    lockedRef.current = true;
    setScanning(true);
    try {
      const blob = await captureBlob();
      if (!blob) return;

      const fd = new FormData();
      fd.append("face_image", blob, "kiosk.jpg");

      const res = await apiUpload<KioskResult>("/kiosk/checkin", fd);

      setOutcome({ kind: "success", data: res.data });
      await new Promise((r) => setTimeout(r, RESULT_DISPLAY_MS));
      setOutcome(null);
    } catch (err) {
      // Membership problems (403) deserve visible feedback since the person was
      // recognized. Unrecognized faces / no face (404/400) are normal between
      // visitors, so we silently keep scanning.
      const status = err instanceof ApiClientError ? err.status : 0;
      if (status === 403) {
        const message =
          err instanceof Error ? err.message : "Membership tidak aktif";
        setOutcome({ kind: "warning", message });
        await new Promise((r) => setTimeout(r, RESULT_DISPLAY_MS));
        setOutcome(null);
      }
    } finally {
      setScanning(false);
      lockedRef.current = false;
    }
  }, [captureBlob]);

  useEffect(() => {
    let cancelled = false;

    async function start() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => undefined);
        }
        setCameraReady(true);
      } catch {
        setCameraError(
          "Tidak dapat mengakses kamera. Pastikan izin kamera diberikan untuk halaman ini.",
        );
      }
    }

    start();

    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!cameraReady) return;
    const id = setInterval(() => {
      void scanOnce();
    }, SCAN_INTERVAL_MS);
    return () => clearInterval(id);
  }, [cameraReady, scanOnce]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 p-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight">Check-in Wajah</h1>
        <p className="mt-1 text-zinc-400">
          Posisikan wajah Anda di tengah kamera untuk absen otomatis
        </p>
      </div>

      <div className="relative aspect-video w-full max-w-3xl overflow-hidden rounded-3xl border-4 border-zinc-800 bg-black shadow-2xl">
        <video
          ref={videoRef}
          playsInline
          muted
          className="size-full -scale-x-100 object-cover"
        />
        <canvas ref={canvasRef} className="hidden" />

        {/* Framing guide */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="aspect-square h-3/4 rounded-full border-4 border-white/30" />
        </div>

        {/* Scanning indicator */}
        {scanning && !outcome && (
          <div className="absolute left-1/2 top-4 flex -translate-x-1/2 items-center gap-2 rounded-full bg-black/60 px-4 py-2 text-sm">
            <Loader2 className="size-4 animate-spin" />
            Memindai...
          </div>
        )}

        {cameraError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-zinc-950/90 p-8 text-center">
            <XCircle className="size-12 text-red-500" />
            <p className="max-w-md text-zinc-300">{cameraError}</p>
          </div>
        )}

        {!cameraReady && !cameraError && (
          <div className="absolute inset-0 flex items-center justify-center bg-zinc-950/80">
            <Loader2 className="size-10 animate-spin text-zinc-400" />
          </div>
        )}

        {/* Result overlay */}
        {outcome?.kind === "success" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-emerald-950/90 p-8 text-center">
            {outcome.data.member_photo_url ? (
              <Image
                src={outcome.data.member_photo_url}
                alt={outcome.data.member_name}
                width={120}
                height={120}
                unoptimized
                className="size-28 rounded-full border-4 border-emerald-400 object-cover"
              />
            ) : (
              <div className="flex size-28 items-center justify-center rounded-full border-4 border-emerald-400 bg-emerald-900">
                <CheckCircle2 className="size-14 text-emerald-300" />
              </div>
            )}
            <div>
              <p className="text-sm uppercase tracking-widest text-emerald-300">
                {outcome.data.already_checked_in ? "Sudah Check-in" : "Check-in Berhasil"}
              </p>
              <p className="text-4xl font-bold">{outcome.data.member_name}</p>
              <p className="mt-2 text-emerald-200">
                Membership aktif s/d {outcome.data.membership_valid_until}
              </p>
            </div>
          </div>
        )}

        {outcome?.kind === "warning" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-amber-950/90 p-8 text-center">
            <XCircle className="size-16 text-amber-400" />
            <p className="text-2xl font-semibold">{outcome.message}</p>
            <p className="text-amber-200">Silakan hubungi resepsionis</p>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 text-sm text-zinc-500">
        <ScanFace className="size-4" />
        Sistem memindai otomatis setiap beberapa detik
      </div>
    </div>
  );
}
