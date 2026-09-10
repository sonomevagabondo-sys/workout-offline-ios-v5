export type DayType = 'Upper' | 'Lower' | 'Rest';

export type WorkoutSet = {
  id: string;
  weight: string;
  reps: string;
};

export type Exercise = {
  id: string;
  name: string;
  group: string;
  targetSets: number;
  targetReps: number;
  sets: WorkoutSet[];
};

export type WorkoutDay = {
  id: string;
  order: number;
  name: string;
  type: DayType;
  exercises: Exercise[];
  completed: boolean;
  skipped: boolean;
  completedOn?: string;
};

export type Program = {
  id: string;
  name: string;
  cycleStart: string;
  cycleNumber: number;
  days: WorkoutDay[];
};

export type WorkoutLog = {
  id: string;
  dayId: string;
  programId: string;
  completedOn: string;
  streakAfter: number;
  volume: number;
};

export type CycleHistory = {
  cycleNumber: number;
  volume: number;
  completedDays: number;
  totalTrainingDays: number;
  completedOn: string;
};

export type WorkoutState = {
  program: Program;
  streak: number;
  record: number;
  logs: WorkoutLog[];
  history: CycleHistory[];
  profileName: string;
  unit: 'kg' | 'lb';
  theme: 'dark' | 'light' | 'system';
  streakLostNotice: boolean;
};

const catalog: Array<[string, string, number, number]> = [
  ['Panca piana', 'Petto', 3, 8],
  ['Distensioni inclinate', 'Petto', 3, 10],
  ['Croci ai cavi', 'Petto', 3, 12],
  ['Push-up', 'Petto', 3, 12],
  ['Lat machine', 'Schiena', 3, 10],
  ['Rematore', 'Schiena', 3, 8],
  ['Pulley basso', 'Schiena', 3, 10],
  ['Face pull', 'Spalle', 3, 12],
  ['Military press', 'Spalle', 3, 8],
  ['Alzate laterali', 'Spalle', 3, 12],
  ['Curl con bilanciere', 'Bicipiti', 3, 10],
  ['Curl a martello', 'Bicipiti', 3, 10],
  ['Pushdown cavo', 'Tricipiti', 3, 12],
  ['French press', 'Tricipiti', 3, 10],
  ['Squat', 'Gambe', 4, 8],
  ['Stacco rumeno', 'Gambe', 3, 10],
  ['Leg press', 'Gambe', 3, 12],
  ['Calf raise', 'Gambe', 4, 12],
  ['Plank', 'Addome', 3, 30],
];

const uid = (prefix: string) =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export const toIsoDate = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

export const todayIso = () => toIsoDate(new Date());

export const fromIsoDate = (value: string) => {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
};

export const addDays = (value: string, amount: number) => {
  const date = fromIsoDate(value);
  date.setDate(date.getDate() + amount);
  return toIsoDate(date);
};

export const daysBetween = (from: string, to: string) =>
  Math.round((fromIsoDate(to).getTime() - fromIsoDate(from).getTime()) / 86400000);

export const formatItalianDate = (value: string) =>
  fromIsoDate(value).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' });

const makeExercise = (name: string, group: string, sets: number, reps: number): Exercise => ({
  id: uid('exercise'),
  name,
  group,
  targetSets: sets,
  targetReps: reps,
  sets: Array.from({ length: sets }, () => ({ id: uid('set'), weight: '', reps: '' })),
});

const dayExercises = (groups: string[]): Exercise[] =>
  catalog
    .filter((item) => groups.includes(item[1]))
    .slice(0, 4)
    .map(([name, group, sets, reps]) => makeExercise(name, group, sets, reps));

export const createDefaultProgram = (startDate = todayIso()): Program => ({
  id: uid('program'),
  name: 'default',
  cycleStart: startDate,
  cycleNumber: 1,
  days: ['Upper', 'Lower', 'Rest', 'Upper', 'Lower', 'Rest', 'Rest'].map((type, index) => ({
    id: uid('day'),
    order: index + 1,
    name: type === 'Rest' ? 'Riposo' : type === 'Upper' ? 'Parte superiore' : 'Parte inferiore',
    type: type as DayType,
    exercises:
      type === 'Upper'
        ? dayExercises(index === 0 ? ['Petto', 'Spalle', 'Tricipiti'] : ['Schiena', 'Spalle', 'Bicipiti'])
        : type === 'Lower'
          ? dayExercises(['Gambe', 'Addome'])
          : [],
    completed: false,
    skipped: false,
  })),
});

export const getCycleDayIndex = (program: Program, date: string) =>
  Math.max(0, daysBetween(program.cycleStart, date));

export const getTodayDay = (program: Program, date: string) =>
  program.days[Math.min(getCycleDayIndex(program, date), 6)];

export const isSetComplete = (set: WorkoutSet) =>
  Number(set.weight) > 0 && Number(set.reps) > 0;

export const isDayReadyToFinish = (day: WorkoutDay) =>
  day.type !== 'Rest' &&
  !day.skipped &&
  day.exercises.length > 0 &&
  day.exercises.every((exercise) => exercise.sets.every(isSetComplete));

export const dayVolume = (day: WorkoutDay) =>
  day.exercises.reduce(
    (total, exercise) =>
      total +
      exercise.sets.reduce((exerciseTotal, set) => exerciseTotal + Number(set.weight || 0) * Number(set.reps || 0), 0),
    0,
  );

export const isMilestone = (streak: number) =>
  [3, 7, 14, 30, 50, 75, 100, 150, 200, 365].includes(streak);

export const estimatedOneRepMax = (weight: number, reps: number) => weight * (1 + reps / 30);

export const exerciseCatalog = catalog.map(([name, group, sets, reps]) => ({
  name,
  group,
  sets,
  reps,
}));

export const createProgram = (name: string, days: Array<{ type: DayType; exercises: Exercise[] }>, startDate: string): Program => ({
  id: uid('program'),
  name,
  cycleStart: startDate,
  cycleNumber: 1,
  days: days.map((day, index) => ({
    id: uid('day'),
    order: index + 1,
    name: day.type === 'Rest' ? 'Riposo' : day.type === 'Upper' ? 'Parte superiore' : 'Parte inferiore',
    type: day.type,
    exercises: day.exercises,
    completed: false,
    skipped: false,
  })),
});