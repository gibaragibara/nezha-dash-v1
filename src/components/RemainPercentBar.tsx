import { cn } from "@/lib/utils"

import { Progress } from "./ui/progress"

export default function RemainPercentBar({ value, className }: { value: number; className?: string }) {
  // 根据使用率显示不同颜色
  // 0-60%: 绿色 (安全)
  // 60-85%: 黄色 (警告)
  // 85%+: 红色 (危险)
  const getColorClass = (val: number) => {
    if (val < 60) return "bg-green-500"
    if (val < 85) return "bg-yellow-500"
    return "bg-red-500"
  }

  return (
    <Progress
      aria-label={"Server Usage Bar"}
      aria-labelledby={"Server Usage Bar"}
      value={value}
      indicatorClassName={getColorClass(value)}
      className={cn("h-[3px] rounded-sm w-[70px]", className)}
    />
  )
}
