import { ReactNode, createContext, useEffect, useState } from "react"

import type { ConfigOptions } from "./default"
import { DEFAULT_CONFIG } from "./default"

interface ConfigContextType {
  config: ConfigOptions
  updateConfig: (newConfig: Partial<ConfigOptions>) => void
  resetConfig: () => void
}

const ConfigContext = createContext<ConfigContextType | null>(null)

export function ConfigProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<ConfigOptions>(() => {
    // 尝试从localStorage加载配置
    const savedConfig = localStorage.getItem("theme-config")
    if (savedConfig) {
      try {
        return { ...DEFAULT_CONFIG, ...JSON.parse(savedConfig) }
      } catch (error) {
        console.error("Failed to parse saved config:", error)
        return DEFAULT_CONFIG
      }
    }
    return DEFAULT_CONFIG
  })

  // 当配置更新时，保存到localStorage
  useEffect(() => {
    localStorage.setItem("theme-config", JSON.stringify(config))
  }, [config])

  const updateConfig = (newConfig: Partial<ConfigOptions>) => {
    setConfig((prev) => ({ ...prev, ...newConfig }))
  }

  const resetConfig = () => {
    setConfig(DEFAULT_CONFIG)
    localStorage.removeItem("theme-config")
  }

  return <ConfigContext.Provider value={{ config, updateConfig, resetConfig }}>{children}</ConfigContext.Provider>
}

export { ConfigContext }
