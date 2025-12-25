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
  // 性能优化：使用默认配置立即渲染，不阻塞首屏
  const [config, setConfig] = useState<ConfigOptions>(DEFAULT_CONFIG)

  // 从 Komari API 异步加载主题配置（不阻塞渲染）
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const km_public = await SharedClient().call("common:getPublicInfo")
        if (!km_public.error && km_public.theme_settings) {
          const themeSettings = km_public.theme_settings as Partial<ConfigOptions>
          setConfig((prev) => ({ ...prev, ...themeSettings }))
        }
      } catch (error) {
        console.error("Failed to load theme config from Komari:", error)
        // 加载失败时保持默认配置，不影响用户体验
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

  // 性能优化：移除 loading 阻塞，直接渲染子组件
  return <ConfigContext.Provider value={{ config, updateConfig, resetConfig }}>{children}</ConfigContext.Provider>
}

export { ConfigContext }

