import { getKomariNodes, komariToNezhaWebsocketResponse } from "@/lib/utils"
import { getWsService } from "@/services/websocket-service"
import React, { useEffect, useState, useRef } from "react"

import { WebSocketContext, WebSocketContextType } from "./websocket-context"

interface WebSocketProviderProps {
  url: string
  children: React.ReactNode
}

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({ children }) => {
  const [lastMessage, setLastMessage] = useState<{ data: string } | null>(null)
  const [messageHistory, setMessageHistory] = useState<{ data: string }[]>([])
  const [connected, setConnected] = useState(false)
  const [needReconnect, setNeedReconnect] = useState(false)

  // 使用 ref 避免重复初始化
  const isInitializedRef = useRef(false)
  const lastSerializedRef = useRef<string | null>(null)

  useEffect(() => {
    // 避免 React StrictMode 重复初始化
    if (isInitializedRef.current) return
    isInitializedRef.current = true

    console.log("[WebSocketProvider] 初始化开始")

    // 先获取节点列表（缓存），以便后续转换数据时使用
    getKomariNodes().then(() => {
      console.log("[WebSocketProvider] 节点列表已缓存")
    })

    // 获取 WebSocket 服务实例
    const wsService = getWsService()

    // 订阅数据更新
    const handleData = (data: any) => {
      // 将 Komari 格式转换为 Nezha 格式
      const nzwsres = komariToNezhaWebsocketResponse(data)
      const serialized = JSON.stringify(nzwsres)
      const messageObj = { data: serialized }

      // 只有数据变化时才更新状态
      if (serialized !== lastSerializedRef.current) {
        lastSerializedRef.current = serialized
        setLastMessage(messageObj)
        setMessageHistory((prev) => {
          const updated = [messageObj, ...prev]
          return updated.slice(0, 30)
        })
      }

      // 收到第一条消息时标记为已连接
      if (!connected) {
        setConnected(true)
        console.log(`[WebSocketProvider] 数据加载完成，服务器数量: ${nzwsres.servers?.length || 0}`)
      }
    }

    const unsubscribe = wsService.subscribe(handleData)

    // 建立连接
    wsService.connect()

    // 清理函数
    return () => {
      unsubscribe()
      wsService.disconnect()
    }
  }, [])

  const cleanup = () => {
    return
    // 使用 WebSocketService 自动管理
  }

  const connect = () => {
    return
    // 使用 WebSocketService 自动管理
  }

  const reconnect = () => {
    // 手动重连
    const wsService = getWsService()
    wsService.disconnect()
    wsService.connect()
  }

  useEffect(() => {
    connect()

    // 添加页面卸载事件监听
    const handleBeforeUnload = () => {
      cleanup()
    }

    window.addEventListener("beforeunload", handleBeforeUnload)

    return () => {
      cleanup()
      window.removeEventListener("beforeunload", handleBeforeUnload)
    }
  }, [])

  const contextValue: WebSocketContextType = {
    lastMessage,
    connected,
    messageHistory,
    reconnect,
    needReconnect,
    setNeedReconnect,
  }

  return <WebSocketContext.Provider value={contextValue}>{children}</WebSocketContext.Provider>
}
