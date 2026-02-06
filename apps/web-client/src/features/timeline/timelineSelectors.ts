export const MAX_SIM_TICK = 60;
export const MIN_SIM_TICK = 0;
export const MINUTES_PER_TICK = 10;

export function clampTick(tick: number, maxTick: number = MAX_SIM_TICK) {
    return Math.min(Math.max(tick, MIN_SIM_TICK), maxTick);
}

export function tickToMillis(tick: number, minutesPerTick: number = MINUTES_PER_TICK) {
    return tick * minutesPerTick * 60 * 1000;
}

export function deriveSimTime(startTime: Date, tick: number, minutesPerTick: number = MINUTES_PER_TICK) {
    return new Date(startTime.getTime() + tickToMillis(tick, minutesPerTick));
}
