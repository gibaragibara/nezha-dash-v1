// API 服务 - 统一的 API 调用封装
// 参考 purcarte 的 ApiService 实现，使用 HTTP 调用 RPC 接口

interface RpcResponse<T> {
    jsonrpc: string
    id: number
    result?: T
    error?: {
        code: number
        message: string
    }
}

class ApiService {
    private baseUrl: string
    private rpcCallId = 1

    constructor() {
        this.baseUrl = ""
    }

    /**
     * 通过 HTTP 发起 RPC 调用（比 WebSocket 更快更稳定）
     */
    async rpcCall<T>(method: string, params: any = {}): Promise<T> {
        try {
            const response = await fetch(`${this.baseUrl}/api/rpc2`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    jsonrpc: "2.0",
                    method,
                    params,
                    id: this.rpcCallId++,
                }),
            })

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`)
            }

            const rpcResponse: RpcResponse<T> = await response.json()

            if (rpcResponse.error) {
                throw new Error(`RPC Error: ${rpcResponse.error.message} (Code: ${rpcResponse.error.code})`)
            }

            return rpcResponse.result as T
        } catch (error) {
            console.error(`RPC call to '${method}' failed:`, error)
            throw error
        }
    }

    /**
     * 获取公开信息
     */
    async getPublicInfo(): Promise<any> {
        return this.rpcCall("common:getPublicInfo")
    }

    /**
     * 获取所有节点信息
     */
    async getNodes(): Promise<Record<string, any>> {
        return this.rpcCall("common:getNodes")
    }

    /**
     * 获取节点最新状态
     */
    async getNodesLatestStatus(): Promise<any> {
        return this.rpcCall("common:getNodesLatestStatus")
    }

    /**
     * 获取版本信息
     */
    async getVersion(): Promise<{ version: string; hash: string }> {
        return this.rpcCall("common:getVersion")
    }

    /**
     * 获取用户信息
     */
    async getMe(): Promise<any> {
        return this.rpcCall("common:getMe")
    }

    /**
     * 获取记录（负载/ping历史）
     */
    async getRecords(params: { type: string; uuid: string; hours?: number; maxCount?: number }): Promise<any> {
        return this.rpcCall("common:getRecords", params)
    }
}

// 创建单例实例
export const apiService = new ApiService()

/**
 * WebSocket 服务 - 仅用于实时状态更新
 * 参考 purcarte 的 WebSocketService 实现
 */
export class WebSocketService {
    private ws: WebSocket | null = null
    private reconnectAttempts = 0
    private maxReconnectAttempts = 5
    private reconnectInterval = 5000
    private listeners: Set<(data: any) => void> = new Set()
    private statusInterval: ReturnType<typeof setInterval> | null = null
    private rpcCallId = 1

    connect() {
        if (this.ws && this.ws.readyState < 2) {
            return
        }

        const wsUrl = `${window.location.protocol === "https:" ? "wss:" : "ws:"}//${window.location.host}/api/rpc2`

        try {
            this.ws = new WebSocket(wsUrl)

            this.ws.onopen = () => {
                console.log("[WebSocket] Connected")
                this.reconnectAttempts = 0
                this.sendUpdateRequest()
                this.startStatusUpdates()
            }

            this.ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data)
                    if (data.result) {
                        this.listeners.forEach((listener) => listener(data.result))
                    }
                } catch (error) {
                    console.error("[WebSocket] Failed to parse message:", error)
                }
            }

            this.ws.onclose = () => {
                console.log("[WebSocket] Disconnected")
                this.stopStatusUpdates()
                this.reconnect()
            }

            this.ws.onerror = (error) => {
                console.error("[WebSocket] Error:", error)
            }
        } catch (error) {
            console.error("[WebSocket] Failed to connect:", error)
            this.reconnect()
        }
    }

    private reconnect() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++
            console.log(`[WebSocket] Reconnecting... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`)
            setTimeout(() => this.connect(), this.reconnectInterval)
        } else {
            console.error("[WebSocket] Max reconnection attempts reached")
        }
    }

    private send(data: string) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(data)
        }
    }

    private sendUpdateRequest() {
        const rpcRequest = {
            jsonrpc: "2.0",
            method: "common:getNodesLatestStatus",
            id: this.rpcCallId++,
        }
        this.send(JSON.stringify(rpcRequest))
    }

    subscribe(listener: (data: any) => void) {
        this.listeners.add(listener)
        return () => this.listeners.delete(listener)
    }

    disconnect() {
        if (this.ws) {
            this.ws.close()
            this.ws = null
            this.stopStatusUpdates()
        }
    }

    private startStatusUpdates() {
        if (this.statusInterval) {
            clearInterval(this.statusInterval)
        }
        // 每 2 秒更新一次状态
        this.statusInterval = setInterval(() => {
            this.sendUpdateRequest()
        }, 2000)
    }

    private stopStatusUpdates() {
        if (this.statusInterval) {
            clearInterval(this.statusInterval)
            this.statusInterval = null
        }
    }
}

// WebSocket 单例
let wsServiceInstance: WebSocketService | null = null

export function getWsService(): WebSocketService {
    if (!wsServiceInstance) {
        wsServiceInstance = new WebSocketService()
    }
    return wsServiceInstance
}
