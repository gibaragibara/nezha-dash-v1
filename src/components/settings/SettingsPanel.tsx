import { useEffect, useState } from "react"
import { X } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import type { ConfigOptions } from "@/config/default"
import { DEFAULT_CONFIG } from "@/config/default"
import { useAppConfig } from "@/config/hooks"
import { cn } from "@/lib/utils"

import SettingItem from "./SettingItem"

interface SettingsPanelProps {
  isOpen: boolean
  onClose: () => void
}

const SettingsPanel = ({ isOpen, onClose }: SettingsPanelProps) => {
  const { config, updateConfig, resetConfig } = useAppConfig()
  const [settingsConfig, setSettingsConfig] = useState<any[]>([])
  const [editingConfig, setEditingConfig] = useState<Partial<ConfigOptions>>(config)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  // 加载komari-theme.json配置
  useEffect(() => {
    const fetchSettingsConfig = async () => {
      try {
        const response = await fetch("/komari-theme.json")
        
        // 检查响应是否成功
        if (!response.ok) {
          console.warn("Settings config file not found, using defaults")
          return
        }
        
        // 检查 Content-Type 是否为 JSON
        const contentType = response.headers.get("content-type")
        if (!contentType || !contentType.includes("application/json")) {
          console.warn("Settings config is not JSON, skipping")
          return
        }
        
        const data = await response.json()
        if (data.configuration?.data) {
          setSettingsConfig(data.configuration.data)
        }
      } catch (error) {
        // 静默处理错误，使用默认配置
        console.debug("Settings config not available:", error)
      }
    }

    fetchSettingsConfig()
  }, [])

  useEffect(() => {
    setEditingConfig(config)
  }, [config])

  useEffect(() => {
    const hasChanges = JSON.stringify(editingConfig) !== JSON.stringify(config)
    setHasUnsavedChanges(hasChanges)
  }, [editingConfig, config])

  const handleConfigChange = (key: keyof ConfigOptions, value: any) => {
    setEditingConfig((prev) => ({ ...prev, [key]: value }))
  }

  const handleSave = () => {
    updateConfig(editingConfig)
    toast.success("设置已保存")
    onClose()
  }

  const handleReset = () => {
    toast("确定要重置所有设置吗？", {
      action: {
        label: "确认重置",
        onClick: () => {
          resetConfig()
          setEditingConfig(DEFAULT_CONFIG)
          toast.success("设置已重置")
        },
      },
    })
  }

  const handleExport = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(config))
    const downloadAnchorNode = document.createElement("a")
    downloadAnchorNode.setAttribute("href", dataStr)
    downloadAnchorNode.setAttribute("download", "nezha-theme-config.json")
    document.body.appendChild(downloadAnchorNode)
    downloadAnchorNode.click()
    downloadAnchorNode.remove()
    toast.success("配置已导出")
  }

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const importedConfig = JSON.parse(e.target?.result as string)
          const sanitizedConfig: Partial<ConfigOptions> = {}
          for (const key in DEFAULT_CONFIG) {
            if (Object.prototype.hasOwnProperty.call(importedConfig, key)) {
              ;(sanitizedConfig as any)[key] = (importedConfig as any)[key]
            }
          }
          setEditingConfig(sanitizedConfig)
          toast.success("配置已导入", {
            action: {
              label: "保存",
              onClick: () => setTimeout(() => handleSave(), 300),
            },
          })
        } catch (error) {
          console.error("Failed to import config:", error)
          toast.error("导入配置失败")
        }
      }
      reader.readAsText(file)
    }
  }

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-hidden p-0">
        <SheetHeader className="px-6 pt-6 pb-4 border-b">
          <div className="flex items-center justify-between">
            <SheetTitle>主题设置</SheetTitle>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <SheetDescription>自定义主题颜色和背景图片</SheetDescription>
        </SheetHeader>

        <div className="px-6 py-4 border-b">
          <div className="flex flex-wrap gap-2">
            <Button asChild size="sm">
              <label htmlFor="import-config" className="cursor-pointer">
                导入配置
                <input id="import-config" type="file" accept=".json" className="hidden" onChange={handleImport} />
              </label>
            </Button>
            <Button onClick={handleExport} size="sm" variant="outline">
              导出配置
            </Button>
            <Button onClick={handleReset} size="sm" variant="outline">
              重置
            </Button>
            <Button
              onClick={handleSave}
              size="sm"
              className={cn("ml-auto", {
                "bg-green-600 hover:bg-green-700": hasUnsavedChanges,
              })}
              disabled={!hasUnsavedChanges}
            >
              保存{hasUnsavedChanges && " *"}
            </Button>
          </div>
        </div>

        <ScrollArea className="h-[calc(100vh-200px)]">
          <div className="px-6 py-4 space-y-2">
            {settingsConfig.map((item, index) => (
              <SettingItem key={item.key || `title-${index}`} item={item} editingConfig={editingConfig} onConfigChange={handleConfigChange} />
            ))}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}

export default SettingsPanel
