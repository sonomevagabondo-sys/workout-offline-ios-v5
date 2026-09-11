import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  addDays,
  createDefaultProgram,
  CycleHistory,
  dayVolume,
  daysBetween,
  getCycleDayIndex,
  getTodayDay,
  isDayReadyToFinish,
  Program,
  archiveCycleSets,
  todayIso,
  WorkoutDay,
  WorkoutLog,
  WorkoutState,
  WorkoutSet,
} from '@/domain/workout';

type WorkoutContextValue = WorkoutState & {
  hydrated: boolean;
  today: string;
  todayDay: WorkoutDay;
  cycleDay: number;
  updateSet: (dayId: string, exerciseId: string, setId: string, field: keyof Pick<WorkoutSet, 'weight' | 'reps'>, value: string) => void;
  finishToday: () => { streak: number; epic: boolean; newRecord: boolean } | null;
  createNewProgram: (program: Program) => void;
  clearProfile: () => void;
  setProfileName: (name: string) => void;
  setUnit: (unit: 'kg' | 'lb') => void;
  setTheme: (theme: 'dark' | 'light' | 'system') => void;
  dismissStreakLost: () => void;
  switchProgram: (programId: string) => void;
  deleteProgram: (programId: string) => void;
};

const STORAGE_KEY = 'workout-offline-state-v1';
const WorkoutContext = createContext<WorkoutContextValue | null>(null);

const initialState = (): WorkoutState => {
  const program = createDefaultProgram();
  return {
    program,
    programs: [program],
    activeProgramId: program.id,
    streak: 0,
    record: 0,
    logs: [],
    history: [],
    profileName: '',
    unit: 'kg',
    theme: 'dark',
    streakLostNotice: false,
  };
};

type StoredWorkoutState = WorkoutState & {
  programs?: Program[];
  activeProgramId?: string;
};

const replaceProgram = (programs: Program[], program: Program) => {
  const exists = programs.some((item) => item.id === program.id);
  return exists ? programs.map((item) => (item.id === program.id ? program : item)) : [...programs, program];
};

const withActiveProgram = (state: WorkoutState, program: Program): WorkoutState => ({
  ...state,
  program,
  programs: replaceProgram(state.programs, program),
  activeProgramId: program.id,
});

const normalizeState = (storedState: StoredWorkoutState, date: string): WorkoutState => {
  const savedPrograms = storedState.programs?.length ? storedState.programs : [storedState.program];
  const activeProgram =
    savedPrograms.find((program) => program.id === storedState.activeProgramId) ??
    savedPrograms.find((program) => program.id === storedState.program.id) ??
    storedState.program;
  let next: WorkoutState = {
    ...storedState,
    program: activeProgram,
    programs: replaceProgram(savedPrograms, activeProgram),
    activeProgramId: activeProgram.id,
  };
  let elapsed = daysBetween(next.program.cycleStart, date);
  let resetCount = 0;
  let history = [...next.history];

  while (elapsed >= 7) {
    const completedDays = next.program.days.filter((day) => day.completed).length;
    history = [
      ...history,
      {
        programId: next.program.id,
        cycleNumber: next.program.cycleNumber,
        volume: next.program.days.reduce((total, day) => total + dayVolume(day), 0),
        completedDays,
        totalTrainingDays: next.program.days.filter((day) => day.type !== 'Rest').length,
        completedOn: addDays(next.program.cycleStart, 6),
        sets: archiveCycleSets(next.program),
      },
    ];
    next = withActiveProgram(next, {
      ...next.program,
      cycleStart: addDays(next.program.cycleStart, 7),
      cycleNumber: next.program.cycleNumber + 1,
      days: next.program.days.map((day) => ({
        ...day,
        completed: false,
        skipped: false,
        completedOn: undefined,
        exercises: day.exercises.map((exercise) => ({
          ...exercise,
          sets: exercise.sets.map((set) => ({ ...set, weight: '', reps: '' })),
        })),
      })),
    });
    elapsed = daysBetween(next.program.cycleStart, date);
    resetCount += 1;
  }

  const dayIndex = Math.min(Math.max(elapsed, 0), 6);
  const days = next.program.days.map((day, index) => {
    const past = index < dayIndex;
    if (past && day.type !== 'Rest' && !day.completed) {
      return { ...day, skipped: true };
    }
    return day;
  });
  const hasNewSkip = days.some((day) => day.skipped && !next.program.days.find((old) => old.id === day.id)?.skipped);
  return {
    ...withActiveProgram(next, { ...next.program, days }),
    history: history.map((cycle) => ({ ...cycle, programId: cycle.programId ?? next.program.id })),
    streakLostNotice: next.streakLostNotice || hasNewSkip,
  };
};

export function WorkoutProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<WorkoutState>(initialState);
  const [hydrated, setHydrated] = useState(false);
  const [today, setToday] = useState(todayIso());

  useEffect(() => {
    const load = async () => {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      const parsed = saved ? (JSON.parse(saved) as StoredWorkoutState) : initialState();
      setState(normalizeState(parsed, todayIso()));
      setToday(todayIso());
      setHydrated(true);
    };
    void load();
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [hydrated, state]);

  useEffect(() => {
    const timer = setInterval(() => {
      const nextToday = todayIso();
      if (nextToday !== today) {
        setToday(nextToday);
        setState((current) => normalizeState(current, nextToday));
      }
    }, 60000);
    return () => clearInterval(timer);
  }, [today]);

  const updateSet = (
    dayId: string,
    exerciseId: string,
    setId: string,
    field: keyof Pick<WorkoutSet, 'weight' | 'reps'>,
    value: string,
  ) => {
    setState((current) => withActiveProgram(current, {
        ...current.program,
        days: current.program.days.map((day) =>
          day.id !== dayId
            ? day
            : {
                ...day,
                exercises: day.exercises.map((exercise) =>
                  exercise.id !== exerciseId
                    ? exercise
                    : {
                        ...exercise,
                        sets: exercise.sets.map((set) => (set.id === setId ? { ...set, [field]: value.replace(',', '.') } : set)),
                      },
                ),
              },
        ),
      }));
  };

  const finishToday = () => {
    const day = getTodayDay(state.program, today);
    if (!day || !isDayReadyToFinish(day)) return null;
    const alreadyLogged = state.logs.some((log) => log.dayId === day.id && log.completedOn === today);
    const newStreak = alreadyLogged ? state.streak : state.streak + 1;
    const newRecord = Math.max(state.record, newStreak);
    const log: WorkoutLog = {
      id: `${day.id}-${today}`,
      dayId: day.id,
      programId: state.program.id,
      completedOn: today,
      streakAfter: newStreak,
      volume: dayVolume(day),
    };
    setState((current) => withActiveProgram({
      ...current,
      streak: newStreak,
      record: newRecord,
      streakLostNotice: false,
      logs: alreadyLogged ? current.logs : [...current.logs, log],
    }, {
        ...current.program,
        days: current.program.days.map((item) => (item.id === day.id ? { ...item, completed: true, completedOn: today } : item)),
      }));
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    return { streak: newStreak, epic: !alreadyLogged && (newStreak > state.record || [3, 7, 14, 30, 50, 75, 100, 150, 200, 365].includes(newStreak)), newRecord: newStreak > state.record && state.record > 0 };
  };

  const createNewProgram = (program: Program) => {
    setState((current) => {
      const nextProgram = { ...program, cycleStart: today, cycleNumber: 1 };
      return {
        ...current,
        program: nextProgram,
        programs: [...current.programs, nextProgram],
        activeProgramId: nextProgram.id,
      };
    });
  };

  const switchProgram = (programId: string) => {
    setState((current) => {
      const nextProgram = current.programs.find((program) => program.id === programId);
      return nextProgram ? normalizeState(withActiveProgram(current, nextProgram), today) : current;
    });
  };

  const deleteProgram = (programId: string) => {
    setState((current) => {
      if (current.programs.length <= 1) return current;
      const remaining = current.programs.filter((program) => program.id !== programId);
      const deletedActive = current.activeProgramId === programId;
      if (!deletedActive) {
        return {
          ...current,
          programs: remaining,
          logs: current.logs.filter((log) => log.programId !== programId),
          history: current.history.filter((cycle) => cycle.programId !== programId),
        };
      }
      const nextProgram = remaining[0];
      return normalizeState({
        ...current,
        program: nextProgram,
        programs: remaining,
        activeProgramId: nextProgram.id,
        logs: current.logs.filter((log) => log.programId !== programId),
        history: current.history.filter((cycle) => cycle.programId !== programId),
      }, today);
    });
  };

  const clearProfile = () => setState((current) => ({ ...current, profileName: '' }));
  const setProfileName = (profileName: string) => setState((current) => ({ ...current, profileName }));
  const setUnit = (unit: 'kg' | 'lb') => setState((current) => ({ ...current, unit }));
  const setTheme = (theme: 'dark' | 'light' | 'system') => setState((current) => ({ ...current, theme }));
  const dismissStreakLost = () => setState((current) => ({ ...current, streakLostNotice: false }));

  const value = useMemo(
    () => ({
      ...state,
      history: state.history.filter((cycle) => cycle.programId === state.program.id),
      hydrated,
      today,
      todayDay: getTodayDay(state.program, today),
      cycleDay: getCycleDayIndex(state.program, today),
      updateSet,
      finishToday,
      createNewProgram,
      clearProfile,
      setProfileName,
      setUnit,
      setTheme,
      dismissStreakLost,
      switchProgram,
      deleteProgram,
    }),
    [hydrated, state, today],
  );

  return <WorkoutContext.Provider value={value}>{children}</WorkoutContext.Provider>;
}

export const useWorkout = () => {
  const context = useContext(WorkoutContext);
  if (!context) throw new Error('useWorkout must be used within WorkoutProvider');
  return context;
};