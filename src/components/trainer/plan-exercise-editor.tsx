"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { apiGet } from "@/lib/api-client";
import type { ExerciseCatalogItem, PlanExerciseInput } from "@/lib/types/trainer";
import { createEmptyExercise } from "@/lib/types/trainer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface PlanExerciseEditorProps {
  exercises: PlanExerciseInput[];
  onChange: (exercises: PlanExerciseInput[]) => void;
}

function ExerciseNameInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (next: { name: string; exercise_id?: string }) => void;
}) {
  const [query, setQuery] = useState(value);
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(timer);
  }, [query]);

  const catalogQuery = useQuery({
    queryKey: ["trainer", "exercises", debouncedQuery],
    queryFn: () =>
      apiGet<ExerciseCatalogItem[]>("/trainer/exercises", {
        search: debouncedQuery,
        per_page: 8,
      }),
    enabled: debouncedQuery.length >= 2 && open,
  });

  const items = catalogQuery.data?.data ?? [];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <Input
        value={query}
        placeholder="Nama latihan"
        onChange={(event) => {
          setQuery(event.target.value);
          setOpen(true);
          onChange({ name: event.target.value, exercise_id: undefined });
        }}
        onFocus={() => setOpen(true)}
        autoComplete="off"
      />
      {open && debouncedQuery.length >= 2 && (
        <div className="absolute z-20 mt-1 w-full rounded-md border bg-popover shadow-md">
          {catalogQuery.isLoading ? (
            <p className="p-3 text-sm text-muted-foreground">Mencari...</p>
          ) : items.length === 0 ? (
            <p className="p-3 text-sm text-muted-foreground">
              Tidak ditemukan. Nama akan dibuat sebagai latihan baru.
            </p>
          ) : (
            <ul className="max-h-48 overflow-auto py-1">
              {items.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    className="w-full px-3 py-2 text-left text-sm hover:bg-accent"
                    onClick={() => {
                      setQuery(item.name);
                      onChange({ name: item.name, exercise_id: item.id });
                      setOpen(false);
                    }}
                  >
                    <span className="font-medium">{item.name}</span>
                    {item.muscle_group && (
                      <span className="ml-2 text-muted-foreground">{item.muscle_group}</span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

export function PlanExerciseEditor({ exercises, onChange }: PlanExerciseEditorProps) {
  const updateExercise = (index: number, patch: Partial<PlanExerciseInput>) => {
    onChange(
      exercises.map((exercise, exerciseIndex) =>
        exerciseIndex === index ? { ...exercise, ...patch } : exercise,
      ),
    );
  };

  const moveExercise = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= exercises.length) return;
    const next = [...exercises];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next.map((exercise, exerciseIndex) => ({ ...exercise, order: exerciseIndex + 1 })));
  };

  const removeExercise = (index: number) => {
    onChange(
      exercises
        .filter((_, exerciseIndex) => exerciseIndex !== index)
        .map((exercise, exerciseIndex) => ({ ...exercise, order: exerciseIndex + 1 })),
    );
  };

  const addExercise = () => {
    onChange([...exercises, createEmptyExercise(exercises.length + 1)]);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label>Daftar Latihan</Label>
        <Button type="button" variant="outline" size="sm" onClick={addExercise}>
          <Plus className="size-4" />
          Tambah Latihan
        </Button>
      </div>

      {exercises.length === 0 ? (
        <p className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
          Belum ada latihan. Tambahkan minimal satu latihan.
        </p>
      ) : (
        <div className="space-y-3">
          {exercises.map((exercise, index) => (
            <div
              key={exercise.key}
              className={cn("rounded-lg border p-4", "space-y-3 bg-card")}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 space-y-3">
                  <div>
                    <Label className="text-xs text-muted-foreground">Latihan #{index + 1}</Label>
                    <ExerciseNameInput
                      value={exercise.name}
                      onChange={(next) => updateExercise(index, next)}
                    />
                  </div>
                  <div className="grid gap-3 sm:grid-cols-4">
                    <div>
                      <Label className="text-xs">Sets</Label>
                      <Input
                        type="number"
                        min={1}
                        value={exercise.sets}
                        onChange={(event) =>
                          updateExercise(index, { sets: Number(event.target.value) || 1 })
                        }
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Reps</Label>
                      <Input
                        type="number"
                        min={1}
                        value={exercise.reps}
                        onChange={(event) =>
                          updateExercise(index, { reps: Number(event.target.value) || 1 })
                        }
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Berat (kg)</Label>
                      <Input
                        type="number"
                        min={0}
                        step="0.5"
                        value={exercise.weight_kg ?? ""}
                        onChange={(event) =>
                          updateExercise(index, {
                            weight_kg: event.target.value ? Number(event.target.value) : null,
                          })
                        }
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Istirahat (detik)</Label>
                      <Input
                        type="number"
                        min={0}
                        value={exercise.rest_seconds ?? ""}
                        onChange={(event) =>
                          updateExercise(index, {
                            rest_seconds: event.target.value ? Number(event.target.value) : null,
                          })
                        }
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs">Catatan</Label>
                    <Input
                      value={exercise.notes ?? ""}
                      onChange={(event) =>
                        updateExercise(index, { notes: event.target.value || null })
                      }
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    disabled={index === 0}
                    onClick={() => moveExercise(index, -1)}
                  >
                    <ArrowUp className="size-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    disabled={index === exercises.length - 1}
                    onClick={() => moveExercise(index, 1)}
                  >
                    <ArrowDown className="size-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeExercise(index)}
                  >
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
