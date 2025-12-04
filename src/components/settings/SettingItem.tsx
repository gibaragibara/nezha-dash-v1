import { useEffect, useState } from "react"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import type { ConfigOptions } from "@/config/default"

interface SettingItemProps {
  item: any
  editingConfig: Partial<ConfigOptions>
  onConfigChange: (key: keyof ConfigOptions, value: any) => void
}

const SettingItem = ({ item, editingConfig, onConfigChange }: SettingItemProps) => {
  const defaultValue = item.default
  const currentValue = editingConfig[item.key as keyof ConfigOptions] ?? defaultValue
  const isModified = currentValue !== defaultValue
  const [localValue, setLocalValue] = useState(currentValue)

  useEffect(() => {
    setLocalValue(currentValue)
  }, [currentValue])

  const handleBlur = () => {
    if (item.type === "number") {
      onConfigChange(item.key, Number(localValue))
    } else {
      onConfigChange(item.key, localValue)
    }
  }

  const renderInput = () => {
    switch (item.type) {
      case "number":
        return (
          <Input
            type="number"
            className="mt-2"
            value={localValue as number}
            onChange={(e) => setLocalValue(e.target.value)}
            onBlur={handleBlur}
          />
        )
      case "string":
        return (
          <Input
            type="text"
            className="mt-2"
            value={localValue as string}
            onChange={(e) => setLocalValue(e.target.value)}
            onBlur={handleBlur}
          />
        )
      case "switch":
        return (
          <Switch
            checked={localValue as boolean}
            onCheckedChange={(checked) => {
              setLocalValue(checked)
              onConfigChange(item.key, checked)
            }}
          />
        )
      case "select":
        return (
          <Select
            value={localValue as string}
            onValueChange={(value) => {
              setLocalValue(value)
              onConfigChange(item.key, value)
            }}
          >
            <SelectTrigger className="mt-2">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {item.options.split(",").map((option: string) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )
      default:
        return null
    }
  }

  if (item.type === "title") {
    return <h3 className="text-lg font-semibold mt-6 mb-4">{item.name}</h3>
  }

  if (item.type === "switch" || item.type === "select") {
    return (
      <div className="mb-6 flex items-start justify-between gap-4">
        <div className="flex-1">
          <Label className="text-base font-medium">
            {item.name}
            {isModified && <span className="text-yellow-500 ml-2">*</span>}
          </Label>
          {item.help && <p className="text-sm text-muted-foreground mt-1">{item.help}</p>}
        </div>
        <div className="flex-shrink-0">{renderInput()}</div>
      </div>
    )
  }

  return (
    <div className="mb-6">
      <Label className="text-base font-medium">
        {item.name}
        {isModified && <span className="text-yellow-500 ml-2">*</span>}
      </Label>
      {item.help && <p className="text-sm text-muted-foreground mt-1">{item.help}</p>}
      {renderInput()}
    </div>
  )
}

export default SettingItem
