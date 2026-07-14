export interface PlanExerciseInput {
  key: string;
  exercise_id?: string;
  name: string;
  order: number;
  sets: number;
  reps: number;
  weight_kg?: number | null;
  rest_seconds?: number | null;
  notes?: string | null;
}

export interface ExerciseCatalogItem {
  id: string;
  name: string;
  muscle_group?: string;
  difficulty_level?: string;
}

export interface WorkoutPlanMember {
  id: string;
  name: string;
  email?: string;
  phone?: string;
}

export interface WorkoutPlanExercisePivot {
  order: number;
  sets: number;
  reps: number;
  weight_kg?: number | null;
  rest_seconds?: number | null;
  notes?: string | null;
}

export interface WorkoutPlanExerciseItem {
  id: string;
  name: string;
  pivot?: WorkoutPlanExercisePivot;
}

export interface WorkoutPlanItem {
  id: string;
  name: string;
  description?: string | null;
  goal?: string | null;
  status: string;
  start_date: string;
  end_date?: string | null;
  user?: WorkoutPlanMember;
  exercises?: WorkoutPlanExerciseItem[];
}

export interface TrainerDashboardSummary {
  active_plans: number;
  total_plans: number;
}

export function exercisesFromPlan(plan: WorkoutPlanItem): PlanExerciseInput[] {
  return (plan.exercises ?? []).map((exercise, index) => ({
    key: exercise.id || `ex-${index}`,
    exercise_id: exercise.id,
    name: exercise.name,
    order: exercise.pivot?.order ?? index + 1,
    sets: exercise.pivot?.sets ?? 3,
    reps: exercise.pivot?.reps ?? 10,
    weight_kg: exercise.pivot?.weight_kg ?? null,
    rest_seconds: exercise.pivot?.rest_seconds ?? null,
    notes: exercise.pivot?.notes ?? null,
  }));
}

export function serializeExercises(exercises: PlanExerciseInput[]) {
  return exercises.map((exercise, index) => ({
    exercise_id: exercise.exercise_id || undefined,
    name: exercise.name,
    order: index + 1,
    sets: exercise.sets,
    reps: exercise.reps,
    weight_kg: exercise.weight_kg ?? null,
    rest_seconds: exercise.rest_seconds ?? null,
    notes: exercise.notes ?? null,
  }));
}

export function createEmptyExercise(order: number): PlanExerciseInput {
  return {
    key: `new-${Date.now()}-${order}`,
    name: "",
    order,
    sets: 3,
    reps: 10,
    weight_kg: null,
    rest_seconds: 60,
    notes: null,
  };
}
