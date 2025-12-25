import { SharedClient } from "@/hooks/use-rpc2"
import { getKomariNodes, komariToNezhaWebsocketResponse } from "@/lib/utils"
import React, { useEffect, useState, useRef, useCallback } from "react"

import { WebSocketContext, WebSocketContextType } from "./websocket-context"

interface WebSocketProviderProps {
  url: string
  children: React.ReactNode
}

/**
 * WebSocket Provider - 性能优化版
 * 参考 purcarte 的 LiveDataProvider 实现
 * 使用 HTTP 轮询获取实时数据，更稳定更快
 */
export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({ children }) => {
  const [lastMessage, setLastMessage] = useState<{ data: string } | null>(null)
  const [messageHistory, setMessageHistory] = useState<{ data: string }[]>([])
  const [connected, setConnected] = useState(false)
  const [needReconnect, setNeedReconnect] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const isInitialLoad = useRef(true)

  // 获取节点最新状态
  const getData = useCallback(async () => {
    try {
      const rpc2 = SharedClient()
      const res = await rpc2.call("common:getNodesLatestStatus")
      const nzwsres = komariToNezhaWebsocketResponse(res)
      const message = { data: JSON.stringify(nzwsres) }

      setLastMessage(message)
      setMessageHistory((prev) => {
        const updated = [message, ...prev]
        return updated.slice(0, 30)
      })

      if (isInitialLoad.current) {
        isInitialLoad.current = false
        setConnected(true)
      }
    } catch (error) {
      console.error("[WebSocketProvider] Failed to get data:", error)
    }
  }, [])

  // 初始化和轮询
  useEffect(() => {
    // 预加载节点数据（缓存）
    getKomariNodes()

    // 首次获取数据
    getData()

    // 每 2 秒轮询一次（参考 purcarte）
    intervalRef.current = setInterval(getData, 2000)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [getData])

  const reconnect = useCallback(() => {
    // 重新开始轮询
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }
    getData()
    intervalRef.current = setInterval(getData, 2000)
  }, [getData])

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

