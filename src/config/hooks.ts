import { useContext } from "react"

import { ConfigContext } from "./ConfigProvider"

export const useAppConfig = () => {
  const context = useContext(ConfigContext)
  if (!context) {
    throw new Error("useAppConfig must be used within ConfigProvider")
  }
  return context
}
