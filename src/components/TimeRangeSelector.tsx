import { cn } from "@/lib/utils"
import { m } from "framer-motion"

interface TimeRange {
    label: string
    hours: number
}

interface TimeRangeSelectorProps {
    currentHours: number
    onTimeRangeChange: (hours: number) => void
    timeRanges: TimeRange[]
}

export function TimeRangeSelector({ currentHours, onTimeRangeChange, timeRanges }: TimeRangeSelectorProps) {
    const customBackgroundImage = (window.CustomBackgroundImage as string) !== "" ? window.CustomBackgroundImage : undefined

    return (
        <div
            className={cn("flex items-center gap-1 rounded-[50px] bg-stone-100 p-[3px] dark:bg-stone-800", {
                "bg-stone-100/70 dark:bg-stone-800/70": customBackgroundImage,
            })}
        >
            {timeRanges.map((range) => (
                <div
                    key={range.hours}
                    onClick={() => onTimeRangeChange(range.hours)}
                    className={cn(
                        "relative cursor-pointer rounded-3xl px-2.5 py-[8px] text-[13px] font-[600] transition-all duration-500",
                        currentHours === range.hours ? "text-black dark:text-white" : "text-stone-400 dark:text-stone-500",
                    )}
                >
                    {currentHours === range.hours && (
                        <m.div
                            layoutId="time-range-active"
                            className="absolute inset-0 z-10 h-full w-full content-center bg-white shadow-lg shadow-black/5 dark:bg-stone-700 dark:shadow-white/5"
                            style={{
                                originY: "0px",
                                borderRadius: 46,
                            }}
                        />
                    )}
                    <div className="relative z-20 flex items-center gap-1">
                        <p className="whitespace-nowrap">{range.label}</p>
                    </div>
                </div>
            ))}
        </div>
    )
}
