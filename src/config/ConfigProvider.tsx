import { ReactNode, createContext, useEffect, useState } from "react"

import type { ConfigOptions } from "./default"
import { DEFAULT_CONFIG } from "./default"
import { SharedClient } from "@/hooks/use-rpc2"

interface ConfigContextType {
  config: ConfigOptions
  updateConfig: (newConfig: Partial<ConfigOptions>) => void
  resetConfig: () => void
}

const ConfigContext = createContext<ConfigContextType | null>(null)

export function ConfigProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<ConfigOptions>(DEFAULT_CONFIG)
  const [loading, setLoading] = useState(true)

  // 从 Komari API 加载主题配置
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const km_public = await SharedClient().call("common:getPublicInfo")
        if (!km_public.error && km_public.theme_settings) {
          const themeSettings = km_public.theme_settings as Partial<ConfigOptions>
          console.log("Loaded theme settings:", themeSettings)
          setConfig({ ...DEFAULT_CONFIG, ...themeSettings })
        } else {
          console.warn("No theme_settings found, using defaults")
          setConfig(DEFAULT_CONFIG)
        }
      } catch (error) {
        console.error("Failed to load theme config from Komari:", error)
        // 即使加载失败，也设置默认配置
        setConfig(DEFAULT_CONFIG)
      } finally {
        setLoading(false)
      }
    }
    loadConfig()
  }, [])

  const updateConfig = (newConfig: Partial<ConfigOptions>) => {
    setConfig((prev) => ({ ...prev, ...newConfig }))
    // 同时保存到 localStorage 作为备份
    localStorage.setItem("theme-config", JSON.stringify({ ...config, ...newConfig }))
  }

  const resetConfig = () => {
    setConfig(DEFAULT_CONFIG)
    localStorage.removeItem("theme-config")
  }

  if (loading) {
    return null // 或者显示加载动画
  }

  return <ConfigContext.Provider value={{ config, updateConfig, resetConfig }}>{children}</ConfigContext.Provider>
}

export { ConfigContext }
