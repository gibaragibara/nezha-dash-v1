import { useEffect, useState } from "react"
import { X } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { DEFAULT_CONFIG } from "@/config/default"
import { ConfigOptions, useAppConfig } from "@/contexts/ConfigContext"
import SettingItem from "./SettingItem"
import themeConfig from "../../../komari-theme.json"

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
    if (themeConfig?.configuration?.data) {
      setSettingsConfig(themeConfig.configuration.data)
    }
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
              ; (sanitizedConfig as any)[key] = (importedConfig as any)[key]
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
