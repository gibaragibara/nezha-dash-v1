import { useMemo } from "react"
import { useAppConfig } from "@/config/hooks"

/**
 * 根据配置和背景图片状态返回卡片透明度类名
 */
export function useCardOpacity() {
  const { config } = useAppConfig()
  const customBackgroundImage = (window.CustomBackgroundImage as string) !== "" ? window.CustomBackgroundImage : undefined

  const cardOpacityClass = useMemo(() => {
    if (!customBackgroundImage) return ""
    const opacity = Math.max(0, Math.min(100, config.cardOpacity || 70))
    return `bg-card/${opacity}`
  }, [customBackgroundImage, config.cardOpacity])

  return cardOpacityClass
}
