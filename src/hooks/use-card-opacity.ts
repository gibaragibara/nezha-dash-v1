import { useMemo } from "react"
import { useAppConfig } from "@/config/hooks"

/**
 * 根据配置和背景图片状态返回卡片透明度样式
 */
export function useCardOpacity() {
  const { config } = useAppConfig()
  const customBackgroundImage = (window.CustomBackgroundImage as string) !== "" ? window.CustomBackgroundImage : undefined

  const cardOpacityStyle = useMemo(() => {
    if (!customBackgroundImage) {
      console.log("No background image detected, opacity will not be applied")
      return {}
    }
    const opacity = Math.max(0, Math.min(100, config.cardOpacity || 70))
    console.log(`Applying card opacity: ${opacity}%`, { backgroundImage: customBackgroundImage })
    // 返回内联样式对象
    return {
      backgroundColor: `hsl(var(--card) / ${opacity}%)`,
    }
  }, [customBackgroundImage, config.cardOpacity])

  return cardOpacityStyle
}
