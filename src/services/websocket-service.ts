/**
 * WebSocket 服务类 - 用于获取节点实时状态数据
 * 参考 purcarte 主题的实现，使用专用 WebSocket 连接
 */

type DataListener = (data: any) => void

export class WebSocketService {
    private ws: WebSocket | null = null
    private reconnectAttempts = 0
    private maxReconnectAttempts = 5
    private reconnectInterval = 5000
    private listeners: Set<DataListener> = new Set()
    private statusInterval: ReturnType<typeof setInterval> | null = null
    private rpcCallId = 1

    /**
     * 建立 WebSocket 连接
     */
    connect(): void {
        // 如果已经连接或正在连接，不重复创建
        if (this.ws && this.ws.readyState < 2) {
            return
        }

        const protocol = window.location.protocol === "https:" ? "wss:" : "ws:"
        const wsUrl = `${protocol}//${window.location.host}/api/rpc2`

        try {
            console.log("[WebSocketService] 正在连接...", wsUrl)
            this.ws = new WebSocket(wsUrl)

            this.ws.onopen = () => {
                console.log("[WebSocketService] 连接成功!")
                this.reconnectAttempts = 0
                // 连接成功后立即发送一次请求
                this.sendUpdateRequest()
                // 启动定时轮询
                this.startStatusUpdates()
            }

            this.ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data)
                    // RPC 响应格式：{ jsonrpc: "2.0", id: X, result: {...} }
                    if (data.result) {
                        console.log("[WebSocketService] 收到数据")
                        this.listeners.forEach((listener) => listener(data.result))
                    }
                } catch (error) {
                    console.error("[WebSocketService] 解析消息失败:", error)
                }
            }

            this.ws.onclose = (event) => {
                console.log(`[WebSocketService] 连接关闭: code=${event.code}`)
                this.stopStatusUpdates()
                this.reconnect()
            }

            this.ws.onerror = (error) => {
                console.error("[WebSocketService] 连接错误:", error)
            }
        } catch (error) {
            console.error("[WebSocketService] 创建连接失败:", error)
            this.reconnect()
        }
    }

    /**
     * 重连逻辑
     */
    private reconnect(): void {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++
            console.log(
                `[WebSocketService] 尝试重连... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`
            )
            setTimeout(() => this.connect(), this.reconnectInterval)
        } else {
            console.error("[WebSocketService] 达到最大重连次数，停止重连")
        }
    }

    /**
     * 发送消息
     */
    private send(data: string): void {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(data)
        }
    }

    /**
     * 发送获取节点状态的 RPC 请求
     */
    private sendUpdateRequest(): void {
        const rpcRequest = {
            jsonrpc: "2.0",
            method: "common:getNodesLatestStatus",
            id: this.rpcCallId++,
        }
        this.send(JSON.stringify(rpcRequest))
    }

    /**
     * 订阅数据更新
     * @param listener 数据监听回调
     * @returns 取消订阅函数
     */
    subscribe(listener: DataListener): () => void {
        this.listeners.add(listener)
        return () => this.listeners.delete(listener)
    }

    /**
     * 断开连接
     */
    disconnect(): void {
        if (this.ws) {
            this.ws.close()
            this.ws = null
            this.stopStatusUpdates()
        }
    }

    /**
     * 启动定时状态更新
     */
    private startStatusUpdates(): void {
        if (this.statusInterval) {
            clearInterval(this.statusInterval)
        }
        // 每 2 秒获取一次最新状态
        this.statusInterval = setInterval(() => {
            this.sendUpdateRequest()
        }, 2000)
    }

    /**
     * 停止定时状态更新
     */
    private stopStatusUpdates(): void {
        if (this.statusInterval) {
            clearInterval(this.statusInterval)
            this.statusInterval = null
        }
    }
}

// 单例实例
let wsServiceInstance: WebSocketService | null = null

/**
 * 获取 WebSocket 服务实例（单例）
 */
export function getWsService(): WebSocketService {
    if (!wsServiceInstance) {
        wsServiceInstance = new WebSocketService()
    }
    return wsServiceInstance
}
