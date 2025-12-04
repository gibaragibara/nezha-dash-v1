import { useEffect } from "react"
import { useAppConfig } from "@/config/hooks"
import type { ColorType } from "@/config/default"

// 主题颜色到HSL值的映射
const themeColors: Record<ColorType, { light: Record<string, string>; dark: Record<string, string> }> = {
  tomato: {
    light: {
      primary: "10 78% 54%",
      "primary-foreground": "0 0% 100%",
    },
    dark: {
      primary: "10 78% 54%",
      "primary-foreground": "0 0% 100%",
    },
  },
  red: {
    light: {
      primary: "0 72% 51%",
      "primary-foreground": "0 0% 100%",
    },
    dark: {
      primary: "0 72% 51%",
      "primary-foreground": "0 0% 100%",
    },
  },
  ruby: {
    light: {
      primary: "348 75% 47%",
      "primary-foreground": "0 0% 100%",
    },
    dark: {
      primary: "348 75% 47%",
      "primary-foreground": "0 0% 100%",
    },
  },
  crimson: {
    light: {
      primary: "336 80% 46%",
      "primary-foreground": "0 0% 100%",
    },
    dark: {
      primary: "336 80% 46%",
      "primary-foreground": "0 0% 100%",
    },
  },
  pink: {
    light: {
      primary: "322 65% 55%",
      "primary-foreground": "0 0% 100%",
    },
    dark: {
      primary: "322 65% 55%",
      "primary-foreground": "0 0% 100%",
    },
  },
  plum: {
    light: {
      primary: "292 45% 51%",
      "primary-foreground": "0 0% 100%",
    },
    dark: {
      primary: "292 45% 51%",
      "primary-foreground": "0 0% 100%",
    },
  },
  purple: {
    light: {
      primary: "272 51% 54%",
      "primary-foreground": "0 0% 100%",
    },
    dark: {
      primary: "272 51% 54%",
      "primary-foreground": "0 0% 100%",
    },
  },
  violet: {
    light: {
      primary: "252 56% 57%",
      "primary-foreground": "0 0% 100%",
    },
    dark: {
      primary: "252 56% 57%",
      "primary-foreground": "0 0% 100%",
    },
  },
  iris: {
    light: {
      primary: "240 56% 58%",
      "primary-foreground": "0 0% 100%",
    },
    dark: {
      primary: "240 56% 58%",
      "primary-foreground": "0 0% 100%",
    },
  },
  indigo: {
    light: {
      primary: "226 70% 55%",
      "primary-foreground": "0 0% 100%",
    },
    dark: {
      primary: "226 70% 55%",
      "primary-foreground": "0 0% 100%",
    },
  },
  blue: {
    light: {
      primary: "206 100% 50%",
      "primary-foreground": "0 0% 100%",
    },
    dark: {
      primary: "206 100% 50%",
      "primary-foreground": "0 0% 100%",
    },
  },
  cyan: {
    light: {
      primary: "192 91% 36%",
      "primary-foreground": "0 0% 100%",
    },
    dark: {
      primary: "192 91% 36%",
      "primary-foreground": "0 0% 100%",
    },
  },
  teal: {
    light: {
      primary: "173 80% 36%",
      "primary-foreground": "0 0% 100%",
    },
    dark: {
      primary: "173 80% 36%",
      "primary-foreground": "0 0% 100%",
    },
  },
  jade: {
    light: {
      primary: "162 73% 34%",
      "primary-foreground": "0 0% 100%",
    },
    dark: {
      primary: "162 73% 34%",
      "primary-foreground": "0 0% 100%",
    },
  },
  green: {
    light: {
      primary: "142 71% 45%",
      "primary-foreground": "0 0% 100%",
    },
    dark: {
      primary: "142 71% 45%",
      "primary-foreground": "0 0% 100%",
    },
  },
  grass: {
    light: {
      primary: "131 41% 46%",
      "primary-foreground": "0 0% 100%",
    },
    dark: {
      primary: "131 41% 46%",
      "primary-foreground": "0 0% 100%",
    },
  },
  orange: {
    light: {
      primary: "24 94% 50%",
      "primary-foreground": "0 0% 100%",
    },
    dark: {
      primary: "24 94% 50%",
      "primary-foreground": "0 0% 100%",
    },
  },
  brown: {
    light: {
      primary: "28 52% 44%",
      "primary-foreground": "0 0% 100%",
    },
    dark: {
      primary: "28 52% 44%",
      "primary-foreground": "0 0% 100%",
    },
  },
  sky: {
    light: {
      primary: "199 89% 48%",
      "primary-foreground": "0 0% 100%",
    },
    dark: {
      primary: "199 89% 48%",
      "primary-foreground": "0 0% 100%",
    },
  },
  mint: {
    light: {
      primary: "165 80% 42%",
      "primary-foreground": "0 0% 100%",
    },
    dark: {
      primary: "165 80% 42%",
      "primary-foreground": "0 0% 100%",
    },
  },
  lime: {
    light: {
      primary: "75 85% 60%",
      "primary-foreground": "0 0% 0%",
    },
    dark: {
      primary: "75 85% 60%",
      "primary-foreground": "0 0% 0%",
    },
  },
  yellow: {
    light: {
      primary: "39 100% 57%",
      "primary-foreground": "0 0% 0%",
    },
    dark: {
      primary: "39 100% 57%",
      "primary-foreground": "0 0% 0%",
    },
  },
  amber: {
    light: {
      primary: "39 100% 50%",
      "primary-foreground": "0 0% 0%",
    },
    dark: {
      primary: "39 100% 50%",
      "primary-foreground": "0 0% 0%",
    },
  },
  gold: {
    light: {
      primary: "36 75% 42%",
      "primary-foreground": "0 0% 100%",
    },
    dark: {
      primary: "36 75% 42%",
      "primary-foreground": "0 0% 100%",
    },
  },
  bronze: {
    light: {
      primary: "17 55% 42%",
      "primary-foreground": "0 0% 100%",
    },
    dark: {
      primary: "17 55% 42%",
      "primary-foreground": "0 0% 100%",
    },
  },
  gray: {
    light: {
      primary: "0 0% 45%",
      "primary-foreground": "0 0% 100%",
    },
    dark: {
      primary: "0 0% 62%",
      "primary-foreground": "0 0% 0%",
    },
  },
}

export function ThemeApplier() {
  const { config } = useAppConfig()

  useEffect(() => {
    const applyTheme = () => {
      const isDark = document.documentElement.classList.contains("dark")
      const themeColor = config.selectThemeColor as ColorType
      const colors = themeColors[themeColor]

      if (!colors) return

      const colorSet = isDark ? colors.dark : colors.light
      const root = document.documentElement

      // 应用主题颜色到CSS变量
      Object.entries(colorSet).forEach(([key, value]) => {
        root.style.setProperty(`--${key}`, value as string)
      })
    }

    // 初始应用
    applyTheme()

    // 监听主题变化
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === "class") {
          applyTheme()
        }
      })
    })

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    })

    return () => observer.disconnect()
  }, [config.selectThemeColor])

  return null
}
