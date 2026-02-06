import * as Slider from '@radix-ui/react-slider';
import { Play, Pause, SkipBack, SkipForward } from 'lucide-react';
import { useEffect, useMemo } from 'react';
import { format } from 'date-fns';
import { useTimelineStore } from '@/store/timelineStore';
import { deriveSimTime, MAX_SIM_TICK } from '@/features/timeline/timelineSelectors';

export function TimeController() {
    const { currentTick, isPlaying, setTick, stepBy, setPlaying, maxTick } = useTimelineStore();
    const startTime = useMemo(() => new Date(), []);
    const currentTime = deriveSimTime(startTime, currentTick);

    useEffect(() => {
        if (!isPlaying) return;
        const timer = setInterval(() => {
            stepBy(1);
        }, 1000);
        return () => clearInterval(timer);
    }, [isPlaying, stepBy]);

    return (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-[600px] bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xl p-4 flex flex-col gap-3 z-20">
            <div className="flex justify-between items-end px-1">
                <div className="flex flex-col">
                    <span className="text-[10px] font-bold tracking-wider text-slate-500 uppercase">Simulation Clock</span>
                    <span className="text-xl font-mono font-medium tabular-nums">{format(currentTime, 'HH:mm:ss')}</span>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => stepBy(-1)}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-500 transition-colors"
                        aria-label="Step back"
                    >
                        <SkipBack size={18} />
                    </button>
                    <button
                        onClick={() => setPlaying(!isPlaying)}
                        className="p-3 bg-primary text-primary-foreground rounded-full hover:opacity-90 transition-opacity flex items-center justify-center bg-blue-600 text-white shadow-md"
                        aria-label={isPlaying ? 'Pause simulation' : 'Play simulation'}
                    >
                        {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-0.5" />}
                    </button>
                    <button
                        onClick={() => stepBy(1)}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-500 transition-colors"
                        aria-label="Step forward"
                    >
                        <SkipForward size={18} />
                    </button>
                </div>
            </div>

            <Slider.Root
                className="relative flex items-center select-none touch-none w-full h-5"
                value={[currentTick]}
                onValueChange={(value) => setTick(value[0])}
                max={maxTick ?? MAX_SIM_TICK}
                step={1}
                aria-label="Simulation timeline"
            >
                <Slider.Track className="bg-slate-200 dark:bg-slate-800 relative grow rounded-full h-[3px]">
                    <Slider.Range className="absolute bg-blue-500 rounded-full h-full" />
                </Slider.Track>
                <Slider.Thumb
                    className="block w-4 h-4 bg-white border-2 border-blue-500 shadow-sm rounded-[10px] hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-transform hover:scale-110"
                    aria-label="Time Scrubber"
                />
            </Slider.Root>

            <div className="flex justify-between text-[10px] text-slate-400 font-mono px-1">
                <span>T+00</span>
                <span>T+30</span>
                <span>T+60</span>
            </div>
        </div>
    );
}
