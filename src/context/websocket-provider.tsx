import { SharedClient } from "@/hooks/use-rpc2"
import { getKomariNodes, komariToNezhaWebsocketResponse } from "@/lib/utils"
import React, { useEffect, useState, useRef, useCallback } from "react"

import { WebSocketContext, WebSocketContextType } from "./websocket-context"

interface WebSocketProviderProps {
  url: string
  children: React.ReactNode
}

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({ url, children }) => {
  const [lastMessage, setLastMessage] = useState<{ data: string } | null>(null)
  const [messageHistory, setMessageHistory] = useState<{ data: string }[]>([])
  const [connected, setConnected] = useState(false)
  const [needReconnect, setNeedReconnect] = useState(false)

  // 使用 ref 缓存已序列化的消息，避免重复序列化
  const lastSerializedRef = useRef<string | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const getData = useCallback(() => {
    const rpc2 = SharedClient()
    return rpc2.call("common:getNodesLatestStatus").then((res) => {
      const nzwsres = komariToNezhaWebsocketResponse(res)
      // 只序列化一次
      const serialized = JSON.stringify(nzwsres)
      const messageObj = { data: serialized }

      // 只有数据变化时才更新状态，减少不必要的渲染
      if (serialized !== lastSerializedRef.current) {
        lastSerializedRef.current = serialized
        setLastMessage(messageObj)
        setMessageHistory((prev) => {
          const updated = [messageObj, ...prev]
          return updated.slice(0, 30)
        })
      }
    }).catch((err) => {
      console.error("获取节点状态失败:", err)
    })
  }, [])

  useEffect(() => {
    // 预加载节点缓存
    getKomariNodes()

    // 首次获取数据
    getData().then(() => {
      setConnected(true)
    })

    // 设置定时轮询，并保存引用以便清理
    intervalRef.current = setInterval(() => {
      getData()
    }, 2000)

    // 清理函数：组件卸载时清除定时器
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [getData])

  const cleanup = () => {
    return
    // 使用RPC2自动管理
    // if (ws.current) {
    //   // 移除所有事件监听器
    //   ws.current.onopen = null
    //   ws.current.onclose = null
    //   ws.current.onmessage = null
    //   ws.current.onerror = null

    //   if (ws.current.readyState === WebSocket.OPEN || ws.current.readyState === WebSocket.CONNECTING) {
    //     ws.current.close()
    //   }
    //   ws.current = null
    // }
    // if (reconnectTimeout.current) {
    //   clearTimeout(reconnectTimeout.current)
    //   reconnectTimeout.current = null
    // }
    // setConnected(false)
  }

  const connect = () => {
    return
    // 使用RPC2自动管理
    // if (isConnecting.current) {
    //   console.log("Connection already in progress")
    //   return
    // }

    // cleanup()
    // isConnecting.current = true

    // try {
    //   const wsUrl = new URL(url, window.location.origin)
    //   wsUrl.protocol = wsUrl.protocol.replace("http", "ws")

    //   ws.current = new WebSocket(wsUrl.toString())

    //   ws.current.onopen = () => {
    //     console.log("WebSocket connected")
    //     setConnected(true)
    //     reconnectAttempts.current = 0
    //     isConnecting.current = false
    //   }

    //   ws.current.onclose = () => {
    //     console.log("WebSocket disconnected")
    //     setConnected(false)
    //     ws.current = null
    //     isConnecting.current = false

    //     if (reconnectAttempts.current < maxReconnectAttempts) {
    //       reconnectTimeout.current = setTimeout(() => {
    //         reconnectAttempts.current++
    //         connect()
    //       }, 3000)
    //     }
    //   }

    //   ws.current.onmessage = (event) => {
    //     const newMessage = { data: event.data }
    //     setLastMessage(newMessage)
    //     // 更新历史消息，保持最新的30条记录
    //     setMessageHistory((prev) => {
    //       const updated = [newMessage, ...prev]
    //       return updated.slice(0, 30)
    //     })
    //   }

    //   ws.current.onerror = (error) => {
    //     console.error("WebSocket error:", error)
    //     isConnecting.current = false
    //   }
    // } catch (error) {
    //   console.error("WebSocket connection error:", error)
    //   isConnecting.current = false
    // }
  }

  const reconnect = () => {
    return
    // 使用RPC2自动管理
    // reconnectAttempts.current = 0
    // // 等待一个小延时确保清理完成
    // cleanup()
    // setTimeout(() => {
    //   connect()
    // }, 1000)
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
  }, [url])

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
