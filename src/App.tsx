import { useQuery } from "@tanstack/react-query"
import React, { useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { Route, BrowserRouter as Router, Routes } from "react-router-dom"

import { DashCommand } from "./components/DashCommand"
import ErrorBoundary from "./components/ErrorBoundary"
import Footer from "./components/Footer"
import Header, { RefreshToast } from "./components/Header"
import { useAppConfig } from "./config/hooks"
import { useBackground } from "./hooks/use-background"
import { useTheme } from "./hooks/use-theme"
import { InjectContext } from "./lib/inject"
import { fetchSetting } from "./lib/nezha-api"
import { cn } from "./lib/utils"
import ErrorPage from "./pages/ErrorPage"
import NotFound from "./pages/NotFound"
import Server from "./pages/Server"
import ServerDetail from "./pages/ServerDetail"

// Route checker component
const RouteChecker: React.FC = () => {
  return <MainApp />
}

const MainApp: React.FC = () => {
  const { data: settingData, error } = useQuery({
    queryKey: ["setting"],
    queryFn: () => fetchSetting(),
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  })
  const { i18n } = useTranslation()
  const { setTheme, theme } = useTheme()
  const [isCustomCodeInjected, setIsCustomCodeInjected] = useState(false)
  const { backgroundImage: customBackgroundImage } = useBackground()
  const { config } = useAppConfig()
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)

  useEffect(() => {
    if (settingData?.data?.config?.custom_code) {
      InjectContext(settingData?.data?.config?.custom_code)
      setIsCustomCodeInjected(true)
    }
  }, [settingData?.data?.config?.custom_code])

  // 监听窗口大小变化
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768)
    }
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  // 根据主题和设备类型获取背景图片URL
  const configBackgroundImage = useMemo(() => {
    const isDark = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches)
    
    // 选择桌面端或移动端背景
    const bgUrl = isMobile && config.backgroundImageMobile ? config.backgroundImageMobile : config.backgroundImage
    
    if (!bgUrl) return ""
    
    // 处理亮色|暗色模式分隔
    const urls = bgUrl.split("|").map((u) => u.trim())
    if (urls.length > 1) {
      return isDark ? urls[1] : urls[0]
    }
    return urls[0]
  }, [theme, isMobile, config.backgroundImage, config.backgroundImageMobile])

  // 检测是否强制指定了主题颜色
  const forceTheme =
    // @ts-expect-error ForceTheme is a global variable
    (window.ForceTheme as string) !== "" ? window.ForceTheme : undefined

  useEffect(() => {
    if (forceTheme === "dark" || forceTheme === "light") {
      setTheme(forceTheme)
    }
  }, [forceTheme, setTheme])

  // 同步配置中的背景图片到 window 对象
  useEffect(() => {
    if (configBackgroundImage && !customBackgroundImage) {
      window.CustomBackgroundImage = configBackgroundImage
    }
  }, [configBackgroundImage, customBackgroundImage])

  if (error) {
    return <ErrorPage code={500} message={error.message} />
  }

  if (!settingData) {
    return null
  }

  if (settingData?.data?.config?.custom_code && !isCustomCodeInjected) {
    return null
  }

  if (settingData?.data?.config?.language && !localStorage.getItem("language")) {
    i18n.changeLanguage(settingData?.data?.config?.language)
  }

  // 合并自定义背景和配置背景，优先使用自定义背景
  const finalBackgroundImage = customBackgroundImage || configBackgroundImage
  
  // 解析背景对齐方式
  const backgroundAlignment = config.backgroundAlignment || "cover,center"
  const [bgSize, bgPosition] = backgroundAlignment.split(",").map((s: string) => s.trim())

  return (
    <ErrorBoundary>
      {/* 固定定位的背景层 */}
      {finalBackgroundImage && (
        <div
          className={cn("fixed inset-0 z-0 min-h-lvh bg-no-repeat dark:brightness-75")}
          style={{ 
            backgroundImage: `url(${finalBackgroundImage})`,
            backgroundSize: bgSize || "cover",
            backgroundPosition: bgPosition || "center"
          }}
        />
      )}
      <div
        className={cn("flex min-h-screen w-full flex-col", {
          "bg-background": !finalBackgroundImage,
        })}
      >
        <main className="flex z-20 min-h-[calc(100vh-calc(var(--spacing)*16))] flex-1 flex-col gap-4 p-4 md:p-10 md:pt-8">
          <RefreshToast />
          <Header />
          <DashCommand />
          <Routes>
            <Route path="/" element={<Server />} />
            <Route path="/server/:id" element={<ServerDetail />} />
            <Route path="/error" element={<ErrorPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          <Footer />
        </main>
      </div>
    </ErrorBoundary>
  )
}

// Main App wrapper with router
const App: React.FC = () => {
  return (
    <Router basename={import.meta.env.BASE_URL}>
      <RouteChecker />
    </Router>
  )
}

export default App
