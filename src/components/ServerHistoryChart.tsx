import { Card, CardContent } from "@/components/ui/card"
import { ChartConfig, ChartContainer } from "@/components/ui/chart"
import { useWebSocketContext } from "@/hooks/use-websocket-context"
import { useLoadHistory } from "@/hooks/use-load-history"
import { formatBytes } from "@/lib/format"
import { formatNezhaInfo, formatRelativeTime, formatTime } from "@/lib/utils"
import { NezhaServer, NezhaWebsocketResponse, LoadHistoryRecord } from "@/types/nezha-api"
import { useEffect, useMemo, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { Area, AreaChart, CartesianGrid, Line, LineChart, XAxis, YAxis, Tooltip } from "recharts"
import { useCardOpacity } from "@/hooks/use-card-opacity"

import { ServerDetailChartLoading } from "./loading/ServerDetailLoading"
import AnimatedCircularProgressBar from "./ui/animated-circular-progress-bar"

type ChartDataPoint = {
    timeStamp: number
    cpu?: number
    mem?: number
    swap?: number
    disk?: number
    upload?: number
    download?: number
    tcp?: number
    udp?: number
    process?: number
}

interface ServerHistoryChartProps {
    server_id: string
    hours: number
}

export default function ServerHistoryChart({ server_id, hours }: ServerHistoryChartProps) {
    const { t } = useTranslation()
    const { lastMessage, connected, messageHistory } = useWebSocketContext()
    const isRealtime = hours === 0
    const serverId = Number(server_id)

    // 获取历史数据
    const { data: historyData, isLoading: historyLoading } = useLoadHistory(serverId, hours, !isRealtime)

    // 实时数据处理
    const nezhaWsData = lastMessage ? (JSON.parse(lastMessage.data) as NezhaWebsocketResponse) : null
    const server = nezhaWsData?.servers.find((s) => s.id === serverId)

    // 将历史记录转换为图表数据
    const historicalChartData = useMemo(() => {
        if (!historyData?.records || historyData.records.length === 0) return []

        return historyData.records.map((record: LoadHistoryRecord) => ({
            timeStamp: new Date(record.time).getTime(),
            cpu: record.cpu || 0,
            mem: record.ram_total > 0 ? (record.ram / record.ram_total) * 100 : 0,
            swap: record.swap_total > 0 ? (record.swap / record.swap_total) * 100 : 0,
            disk: record.disk_total > 0 ? (record.disk / record.disk_total) * 100 : record.disk,
            upload: (record.net_out || 0) / 1024 / 1024, // 转换为 MB/s
            download: (record.net_in || 0) / 1024 / 1024,
            tcp: record.connections || 0,
            udp: record.connections_udp || 0,
            process: record.process || 0,
            // 保存原始值用于 tooltip
            raw_mem: record.ram,
            raw_mem_total: record.ram_total,
            raw_swap: record.swap,
            raw_swap_total: record.swap_total,
            raw_disk: record.disk,
            raw_disk_total: record.disk_total,
        }))
    }, [historyData])

    // 显示加载中
    if (!isRealtime && historyLoading) {
        return <ServerDetailChartLoading />
    }

    // 实时模式但未连接
    if (isRealtime && !connected && !lastMessage) {
        return <ServerDetailChartLoading />
    }

    if (isRealtime && !nezhaWsData) {
        return <ServerDetailChartLoading />
    }

    // 历史模式无数据
    if (!isRealtime && (!historyData?.records || historyData.records.length === 0)) {
        return (
            <div className="flex flex-col items-center justify-center py-12">
                <p className="text-sm font-medium opacity-40">{t("timeRange.noData", "暂无历史数据")}</p>
            </div>
        )
    }

    // 实时模式使用 WebSocket 数据
    if (isRealtime && server) {
        return (
            <section className="grid md:grid-cols-2 lg:grid-cols-3 grid-cols-1 gap-3 server-charts">
                <CpuChartRealtime now={nezhaWsData!.now} data={server} messageHistory={messageHistory} />
                <ProcessChartRealtime now={nezhaWsData!.now} data={server} messageHistory={messageHistory} />
                <DiskChartRealtime now={nezhaWsData!.now} data={server} messageHistory={messageHistory} />
                <MemChartRealtime now={nezhaWsData!.now} data={server} messageHistory={messageHistory} />
                <NetworkChartRealtime now={nezhaWsData!.now} data={server} messageHistory={messageHistory} />
                <ConnectChartRealtime now={nezhaWsData!.now} data={server} messageHistory={messageHistory} />
            </section>
        )
    }

    // 历史模式渲染
    return (
        <section className="grid md:grid-cols-2 lg:grid-cols-3 grid-cols-1 gap-3 server-charts">
            <HistoryCpuChart data={historicalChartData} />
            <HistoryProcessChart data={historicalChartData} />
            <HistoryDiskChart data={historicalChartData} />
            <HistoryMemChart data={historicalChartData} />
            <HistoryNetworkChart data={historicalChartData} />
            <HistoryConnectChart data={historicalChartData} />
        </section>
    )
}

// ============= 历史模式图表组件 =============

function HistoryCpuChart({ data }: { data: ChartDataPoint[] }) {
    const cardOpacityStyle = useCardOpacity()
    const latestCpu = data.length > 0 ? data[data.length - 1].cpu || 0 : 0

    const chartConfig = {
        cpu: { label: "CPU" },
    } satisfies ChartConfig

    return (
        <Card style={cardOpacityStyle}>
            <CardContent className="px-6 py-3">
                <section className="flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                        <p className="text-md font-medium">CPU</p>
                        <section className="flex items-center gap-2">
                            <p className="text-xs text-end w-10 font-medium">{latestCpu.toFixed(2)}%</p>
                            <AnimatedCircularProgressBar className="size-3 text-[0px]" max={100} min={0} value={latestCpu} primaryColor="hsl(var(--chart-1))" />
                        </section>
                    </div>
                    <ChartContainer config={chartConfig} className="aspect-auto h-[130px] w-full">
                        <AreaChart data={data} margin={{ top: 12, left: 12, right: 12 }}>
                            <CartesianGrid vertical={false} />
                            <XAxis
                                dataKey="timeStamp"
                                tickLine={false}
                                axisLine={false}
                                tickMargin={8}
                                minTickGap={200}
                                interval="preserveStartEnd"
                                tickFormatter={(value) => formatRelativeTime(value)}
                            />
                            <YAxis tickLine={false} axisLine={false} mirror={true} tickMargin={-15} domain={[0, 100]} tickFormatter={(value) => `${value}%`} />
                            <Tooltip
                                content={({ active, payload }) => {
                                    if (active && payload && payload.length) {
                                        return (
                                            <div className="rounded-lg border bg-background p-2 shadow-sm">
                                                <p className="text-xs text-muted-foreground">{formatTime(payload[0].payload.timeStamp)}</p>
                                                <p className="text-sm font-medium">CPU: {(payload[0].value as number).toFixed(2)}%</p>
                                            </div>
                                        )
                                    }
                                    return null
                                }}
                            />
                            <Area isAnimationActive={false} dataKey="cpu" type="step" fill="hsl(var(--chart-1))" fillOpacity={0.3} stroke="hsl(var(--chart-1))" />
                        </AreaChart>
                    </ChartContainer>
                </section>
            </CardContent>
        </Card>
    )
}

function HistoryProcessChart({ data }: { data: ChartDataPoint[] }) {
    const { t } = useTranslation()
    const cardOpacityStyle = useCardOpacity()
    const latestProcess = data.length > 0 ? data[data.length - 1].process || 0 : 0

    const chartConfig = {
        process: { label: "Process" },
    } satisfies ChartConfig

    return (
        <Card style={cardOpacityStyle}>
            <CardContent className="px-6 py-3">
                <section className="flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                        <p className="text-md font-medium">{t("serverDetailChart.process")}</p>
                        <section className="flex items-center gap-2">
                            <p className="text-xs text-end w-10 font-medium">{latestProcess}</p>
                        </section>
                    </div>
                    <ChartContainer config={chartConfig} className="aspect-auto h-[130px] w-full">
                        <AreaChart data={data} margin={{ top: 12, left: 12, right: 12 }}>
                            <CartesianGrid vertical={false} />
                            <XAxis
                                dataKey="timeStamp"
                                tickLine={false}
                                axisLine={false}
                                tickMargin={8}
                                minTickGap={200}
                                interval="preserveStartEnd"
                                tickFormatter={(value) => formatRelativeTime(value)}
                            />
                            <YAxis tickLine={false} axisLine={false} mirror={true} tickMargin={-15} />
                            <Tooltip
                                content={({ active, payload }) => {
                                    if (active && payload && payload.length) {
                                        return (
                                            <div className="rounded-lg border bg-background p-2 shadow-sm">
                                                <p className="text-xs text-muted-foreground">{formatTime(payload[0].payload.timeStamp)}</p>
                                                <p className="text-sm font-medium">{t("serverDetailChart.process")}: {payload[0].value}</p>
                                            </div>
                                        )
                                    }
                                    return null
                                }}
                            />
                            <Area isAnimationActive={false} dataKey="process" type="step" fill="hsl(var(--chart-2))" fillOpacity={0.3} stroke="hsl(var(--chart-2))" />
                        </AreaChart>
                    </ChartContainer>
                </section>
            </CardContent>
        </Card>
    )
}

function HistoryDiskChart({ data }: { data: any[] }) {
    const { t } = useTranslation()
    const cardOpacityStyle = useCardOpacity()
    const latest = data.length > 0 ? data[data.length - 1] : null
    const latestDisk = latest?.disk || 0

    const chartConfig = {
        disk: { label: "Disk" },
    } satisfies ChartConfig

    return (
        <Card style={cardOpacityStyle}>
            <CardContent className="px-6 py-3">
                <section className="flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                        <p className="text-md font-medium">{t("serverDetailChart.disk")}</p>
                        <section className="flex flex-col items-end gap-0.5">
                            <section className="flex items-center gap-2">
                                <p className="text-xs text-end w-10 font-medium">{latestDisk.toFixed(0)}%</p>
                                <AnimatedCircularProgressBar className="size-3 text-[0px]" max={100} min={0} value={latestDisk} primaryColor="hsl(var(--chart-5))" />
                            </section>
                            {latest && (
                                <div className="flex text-[11px] font-medium items-center gap-2">
                                    {formatBytes(latest.raw_disk || 0)} / {formatBytes(latest.raw_disk_total || 0)}
                                </div>
                            )}
                        </section>
                    </div>
                    <ChartContainer config={chartConfig} className="aspect-auto h-[130px] w-full">
                        <AreaChart data={data} margin={{ top: 12, left: 12, right: 12 }}>
                            <CartesianGrid vertical={false} />
                            <XAxis
                                dataKey="timeStamp"
                                tickLine={false}
                                axisLine={false}
                                tickMargin={8}
                                minTickGap={200}
                                interval="preserveStartEnd"
                                tickFormatter={(value) => formatRelativeTime(value)}
                            />
                            <YAxis tickLine={false} axisLine={false} mirror={true} tickMargin={-15} domain={[0, 100]} tickFormatter={(value) => `${value}%`} />
                            <Tooltip
                                content={({ active, payload }) => {
                                    if (active && payload && payload.length) {
                                        const data = payload[0].payload
                                        return (
                                            <div className="rounded-lg border bg-background p-2 shadow-sm">
                                                <p className="text-xs text-muted-foreground">{formatTime(data.timeStamp)}</p>
                                                <p className="text-sm font-medium">
                                                    {t("serverDetailChart.disk")}: {formatBytes(data.raw_disk || 0)} / {formatBytes(data.raw_disk_total || 0)}
                                                </p>
                                            </div>
                                        )
                                    }
                                    return null
                                }}
                            />
                            <Area isAnimationActive={false} dataKey="disk" type="step" fill="hsl(var(--chart-5))" fillOpacity={0.3} stroke="hsl(var(--chart-5))" />
                        </AreaChart>
                    </ChartContainer>
                </section>
            </CardContent>
        </Card>
    )
}

function HistoryMemChart({ data }: { data: any[] }) {
    const { t } = useTranslation()
    const cardOpacityStyle = useCardOpacity()
    const latest = data.length > 0 ? data[data.length - 1] : null
    const latestMem = latest?.mem || 0
    const latestSwap = latest?.swap || 0

    const chartConfig = {
        mem: { label: "Mem" },
        swap: { label: "Swap" },
    } satisfies ChartConfig

    return (
        <Card style={cardOpacityStyle}>
            <CardContent className="px-6 py-3">
                <section className="flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                        <section className="flex items-center gap-4">
                            <div className="flex flex-col">
                                <p className="text-xs text-muted-foreground">{t("serverDetailChart.mem")}</p>
                                <div className="flex items-center gap-2">
                                    <AnimatedCircularProgressBar className="size-3 text-[0px]" max={100} min={0} value={latestMem} primaryColor="hsl(var(--chart-8))" />
                                    <p className="text-xs font-medium">{latestMem.toFixed(0)}%</p>
                                </div>
                            </div>
                            <div className="flex flex-col">
                                <p className="text-xs text-muted-foreground">{t("serverDetailChart.swap")}</p>
                                <div className="flex items-center gap-2">
                                    <AnimatedCircularProgressBar className="size-3 text-[0px]" max={100} min={0} value={latestSwap} primaryColor="hsl(var(--chart-10))" />
                                    <p className="text-xs font-medium">{latestSwap.toFixed(0)}%</p>
                                </div>
                            </div>
                        </section>
                        {latest && (
                            <section className="flex flex-col items-end gap-0.5">
                                <div className="flex text-[11px] font-medium items-center gap-2">
                                    {formatBytes(latest.raw_mem || 0)} / {formatBytes(latest.raw_mem_total || 0)}
                                </div>
                                <div className="flex text-[11px] font-medium items-center gap-2">
                                    {latest.raw_swap_total ? (
                                        <>swap: {formatBytes(latest.raw_swap || 0)} / {formatBytes(latest.raw_swap_total || 0)}</>
                                    ) : (
                                        <>no swap</>
                                    )}
                                </div>
                            </section>
                        )}
                    </div>
                    <ChartContainer config={chartConfig} className="aspect-auto h-[130px] w-full">
                        <AreaChart data={data} margin={{ top: 12, left: 12, right: 12 }}>
                            <CartesianGrid vertical={false} />
                            <XAxis
                                dataKey="timeStamp"
                                tickLine={false}
                                axisLine={false}
                                tickMargin={8}
                                minTickGap={200}
                                interval="preserveStartEnd"
                                tickFormatter={(value) => formatRelativeTime(value)}
                            />
                            <YAxis tickLine={false} axisLine={false} mirror={true} tickMargin={-15} domain={[0, 100]} tickFormatter={(value) => `${value}%`} />
                            <Tooltip
                                content={({ active, payload }) => {
                                    if (active && payload && payload.length) {
                                        const data = payload[0].payload
                                        return (
                                            <div className="rounded-lg border bg-background p-2 shadow-sm">
                                                <p className="text-xs text-muted-foreground">{formatTime(data.timeStamp)}</p>
                                                <p className="text-sm font-medium">
                                                    {t("serverDetailChart.mem")}: {formatBytes(data.raw_mem || 0)} ({data.mem?.toFixed(0)}%)
                                                </p>
                                                <p className="text-sm font-medium">
                                                    {t("serverDetailChart.swap")}: {formatBytes(data.raw_swap || 0)} ({data.swap?.toFixed(0)}%)
                                                </p>
                                            </div>
                                        )
                                    }
                                    return null
                                }}
                            />
                            <Area isAnimationActive={false} dataKey="mem" type="step" fill="hsl(var(--chart-8))" fillOpacity={0.3} stroke="hsl(var(--chart-8))" />
                            <Area isAnimationActive={false} dataKey="swap" type="step" fill="hsl(var(--chart-10))" fillOpacity={0.3} stroke="hsl(var(--chart-10))" />
                        </AreaChart>
                    </ChartContainer>
                </section>
            </CardContent>
        </Card>
    )
}

function HistoryNetworkChart({ data }: { data: ChartDataPoint[] }) {
    const { t } = useTranslation()
    const cardOpacityStyle = useCardOpacity()
    const latest = data.length > 0 ? data[data.length - 1] : null
    const up = latest?.upload || 0
    const down = latest?.download || 0

    const chartConfig = {
        upload: { label: "Upload" },
        download: { label: "Download" },
    } satisfies ChartConfig

    const formatSpeed = (value: number) => {
        if (value >= 1024) return `${(value / 1024).toFixed(2)}G/s`
        if (value >= 1) return `${value.toFixed(2)}M/s`
        return `${(value * 1024).toFixed(2)}K/s`
    }

    return (
        <Card style={cardOpacityStyle}>
            <CardContent className="px-6 py-3">
                <section className="flex flex-col gap-1">
                    <div className="flex items-center">
                        <section className="flex items-center gap-4">
                            <div className="flex flex-col w-20">
                                <p className="text-xs text-muted-foreground">{t("serverDetailChart.upload")}</p>
                                <div className="flex items-center gap-1">
                                    <span className="relative inline-flex size-1.5 rounded-full bg-[hsl(var(--chart-1))]"></span>
                                    <p className="text-xs font-medium">{formatSpeed(up)}</p>
                                </div>
                            </div>
                            <div className="flex flex-col w-20">
                                <p className="text-xs text-muted-foreground">{t("serverDetailChart.download")}</p>
                                <div className="flex items-center gap-1">
                                    <span className="relative inline-flex size-1.5 rounded-full bg-[hsl(var(--chart-4))]"></span>
                                    <p className="text-xs font-medium">{formatSpeed(down)}</p>
                                </div>
                            </div>
                        </section>
                    </div>
                    <ChartContainer config={chartConfig} className="aspect-auto h-[130px] w-full">
                        <LineChart data={data} margin={{ top: 12, left: 12, right: 12 }}>
                            <CartesianGrid vertical={false} />
                            <XAxis
                                dataKey="timeStamp"
                                tickLine={false}
                                axisLine={false}
                                tickMargin={8}
                                minTickGap={200}
                                interval="preserveStartEnd"
                                tickFormatter={(value) => formatRelativeTime(value)}
                            />
                            <YAxis tickLine={false} axisLine={false} mirror={true} tickMargin={-15} tickFormatter={(value) => formatSpeed(value)} />
                            <Tooltip
                                content={({ active, payload }) => {
                                    if (active && payload && payload.length) {
                                        return (
                                            <div className="rounded-lg border bg-background p-2 shadow-sm">
                                                <p className="text-xs text-muted-foreground">{formatTime(payload[0].payload.timeStamp)}</p>
                                                <p className="text-sm font-medium">{t("serverDetailChart.upload")}: {formatSpeed(payload[0].payload.upload)}</p>
                                                <p className="text-sm font-medium">{t("serverDetailChart.download")}: {formatSpeed(payload[0].payload.download)}</p>
                                            </div>
                                        )
                                    }
                                    return null
                                }}
                            />
                            <Line isAnimationActive={false} strokeWidth={1} type="linear" dot={false} dataKey="upload" stroke="hsl(var(--chart-1))" />
                            <Line isAnimationActive={false} strokeWidth={1} type="linear" dot={false} dataKey="download" stroke="hsl(var(--chart-4))" />
                        </LineChart>
                    </ChartContainer>
                </section>
            </CardContent>
        </Card>
    )
}

function HistoryConnectChart({ data }: { data: ChartDataPoint[] }) {
    const cardOpacityStyle = useCardOpacity()
    const latest = data.length > 0 ? data[data.length - 1] : null
    const tcp = latest?.tcp || 0
    const udp = latest?.udp || 0

    const chartConfig = {
        tcp: { label: "TCP" },
        udp: { label: "UDP" },
    } satisfies ChartConfig

    return (
        <Card style={cardOpacityStyle}>
            <CardContent className="px-6 py-3">
                <section className="flex flex-col gap-1">
                    <div className="flex items-center">
                        <section className="flex items-center gap-4">
                            <div className="flex flex-col">
                                <p className="text-xs text-muted-foreground">TCP</p>
                                <div className="flex items-center gap-1">
                                    <span className="relative inline-flex size-1.5 rounded-full bg-[hsl(var(--chart-1))]"></span>
                                    <p className="text-xs font-medium">{tcp}</p>
                                </div>
                            </div>
                            <div className="flex flex-col">
                                <p className="text-xs text-muted-foreground">UDP</p>
                                <div className="flex items-center gap-1">
                                    <span className="relative inline-flex size-1.5 rounded-full bg-[hsl(var(--chart-4))]"></span>
                                    <p className="text-xs font-medium">{udp}</p>
                                </div>
                            </div>
                        </section>
                    </div>
                    <ChartContainer config={chartConfig} className="aspect-auto h-[130px] w-full">
                        <LineChart data={data} margin={{ top: 12, left: 12, right: 12 }}>
                            <CartesianGrid vertical={false} />
                            <XAxis
                                dataKey="timeStamp"
                                tickLine={false}
                                axisLine={false}
                                tickMargin={8}
                                minTickGap={200}
                                interval="preserveStartEnd"
                                tickFormatter={(value) => formatRelativeTime(value)}
                            />
                            <YAxis tickLine={false} axisLine={false} mirror={true} tickMargin={-15} />
                            <Tooltip
                                content={({ active, payload }) => {
                                    if (active && payload && payload.length) {
                                        return (
                                            <div className="rounded-lg border bg-background p-2 shadow-sm">
                                                <p className="text-xs text-muted-foreground">{formatTime(payload[0].payload.timeStamp)}</p>
                                                <p className="text-sm font-medium">TCP: {payload[0].payload.tcp}</p>
                                                <p className="text-sm font-medium">UDP: {payload[0].payload.udp}</p>
                                            </div>
                                        )
                                    }
                                    return null
                                }}
                            />
                            <Line isAnimationActive={false} strokeWidth={1} type="linear" dot={false} dataKey="tcp" stroke="hsl(var(--chart-1))" />
                            <Line isAnimationActive={false} strokeWidth={1} type="linear" dot={false} dataKey="udp" stroke="hsl(var(--chart-4))" />
                        </LineChart>
                    </ChartContainer>
                </section>
            </CardContent>
        </Card>
    )
}

// ============= 实时模式图表组件（复用原有逻辑） =============
// 从 ServerDetailChart.tsx 复用实时图表逻辑

type cpuChartData = {
    timeStamp: string
    cpu: number
}

function CpuChartRealtime({ now, data, messageHistory }: { now: number; data: NezhaServer; messageHistory: { data: string }[] }) {
    const [cpuChartData, setCpuChartData] = useState<cpuChartData[]>([])
    const hasInitialized = useRef(false)
    const [historyLoaded, setHistoryLoaded] = useState(false)

    const { cpu } = formatNezhaInfo(now, data)
    const cardOpacityStyle = useCardOpacity()

    useEffect(() => {
        if (!hasInitialized.current && messageHistory.length > 0) {
            const historyData = messageHistory
                .map((msg) => {
                    const wsData = JSON.parse(msg.data) as NezhaWebsocketResponse
                    const server = wsData.servers.find((s) => s.id === data.id)
                    if (!server) return null
                    const { cpu } = formatNezhaInfo(wsData.now, server)
                    return { timeStamp: wsData.now.toString(), cpu }
                })
                .filter((item): item is cpuChartData => item !== null)
                .reverse()

            setCpuChartData(historyData)
            hasInitialized.current = true
            setHistoryLoaded(true)
        }
    }, [messageHistory])

    useEffect(() => {
        if (data && historyLoaded) {
            const timestamp = Date.now().toString()
            setCpuChartData((prevData) => {
                let newData = [] as cpuChartData[]
                if (prevData.length === 0) {
                    newData = [
                        { timeStamp: timestamp, cpu: cpu },
                        { timeStamp: timestamp, cpu: cpu },
                    ]
                } else {
                    newData = [...prevData, { timeStamp: timestamp, cpu: cpu }]
                    if (newData.length > 30) {
                        newData.shift()
                    }
                }
                return newData
            })
        }
    }, [data, historyLoaded])

    const chartConfig = { cpu: { label: "CPU" } } satisfies ChartConfig

    return (
        <Card style={cardOpacityStyle}>
            <CardContent className="px-6 py-3">
                <section className="flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                        <p className="text-md font-medium">CPU</p>
                        <section className="flex items-center gap-2">
                            <p className="text-xs text-end w-10 font-medium">{cpu.toFixed(2)}%</p>
                            <AnimatedCircularProgressBar className="size-3 text-[0px]" max={100} min={0} value={cpu} primaryColor="hsl(var(--chart-1))" />
                        </section>
                    </div>
                    <ChartContainer config={chartConfig} className="aspect-auto h-[130px] w-full">
                        <AreaChart data={cpuChartData} margin={{ top: 12, left: 12, right: 12 }}>
                            <CartesianGrid vertical={false} />
                            <XAxis
                                dataKey="timeStamp"
                                tickLine={false}
                                axisLine={false}
                                tickMargin={8}
                                minTickGap={200}
                                interval="preserveStartEnd"
                                tickFormatter={(value) => formatRelativeTime(value)}
                            />
                            <YAxis tickLine={false} axisLine={false} mirror={true} tickMargin={-15} domain={[0, 100]} tickFormatter={(value) => `${value}%`} />
                            <Area isAnimationActive={false} dataKey="cpu" type="step" fill="hsl(var(--chart-1))" fillOpacity={0.3} stroke="hsl(var(--chart-1))" />
                        </AreaChart>
                    </ChartContainer>
                </section>
            </CardContent>
        </Card>
    )
}

// 简化的实时图表组件 - 复用 ServerDetailChart 的逻辑
function ProcessChartRealtime({ now, data, messageHistory }: { now: number; data: NezhaServer; messageHistory: { data: string }[] }) {
    const { t } = useTranslation()
    const [chartData, setChartData] = useState<{ timeStamp: string; process: number }[]>([])
    const hasInitialized = useRef(false)
    const [historyLoaded, setHistoryLoaded] = useState(false)
    const cardOpacityStyle = useCardOpacity()
    const { process } = formatNezhaInfo(now, data)

    useEffect(() => {
        if (!hasInitialized.current && messageHistory.length > 0) {
            const historyData = messageHistory
                .map((msg) => {
                    const wsData = JSON.parse(msg.data) as NezhaWebsocketResponse
                    const server = wsData.servers.find((s) => s.id === data.id)
                    if (!server) return null
                    const { process } = formatNezhaInfo(wsData.now, server)
                    return { timeStamp: wsData.now.toString(), process }
                })
                .filter((item): item is { timeStamp: string; process: number } => item !== null)
                .reverse()
            setChartData(historyData)
            hasInitialized.current = true
            setHistoryLoaded(true)
        }
    }, [messageHistory])

    useEffect(() => {
        if (data && historyLoaded) {
            const timestamp = Date.now().toString()
            setChartData((prevData) => {
                if (prevData.length === 0) {
                    return [{ timeStamp: timestamp, process }, { timeStamp: timestamp, process }]
                }
                const newData = [...prevData, { timeStamp: timestamp, process }]
                return newData.length > 30 ? newData.slice(1) : newData
            })
        }
    }, [data, historyLoaded])

    const chartConfig = { process: { label: "Process" } } satisfies ChartConfig

    return (
        <Card style={cardOpacityStyle}>
            <CardContent className="px-6 py-3">
                <section className="flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                        <p className="text-md font-medium">{t("serverDetailChart.process")}</p>
                        <p className="text-xs font-medium">{process}</p>
                    </div>
                    <ChartContainer config={chartConfig} className="aspect-auto h-[130px] w-full">
                        <AreaChart data={chartData} margin={{ top: 12, left: 12, right: 12 }}>
                            <CartesianGrid vertical={false} />
                            <XAxis dataKey="timeStamp" tickLine={false} axisLine={false} tickMargin={8} minTickGap={200} interval="preserveStartEnd" tickFormatter={(value) => formatRelativeTime(value)} />
                            <YAxis tickLine={false} axisLine={false} mirror={true} tickMargin={-15} />
                            <Area isAnimationActive={false} dataKey="process" type="step" fill="hsl(var(--chart-2))" fillOpacity={0.3} stroke="hsl(var(--chart-2))" />
                        </AreaChart>
                    </ChartContainer>
                </section>
            </CardContent>
        </Card>
    )
}

function DiskChartRealtime({ now, data, messageHistory }: { now: number; data: NezhaServer; messageHistory: { data: string }[] }) {
    const { t } = useTranslation()
    const [chartData, setChartData] = useState<{ timeStamp: string; disk: number }[]>([])
    const hasInitialized = useRef(false)
    const [historyLoaded, setHistoryLoaded] = useState(false)
    const cardOpacityStyle = useCardOpacity()
    const { disk } = formatNezhaInfo(now, data)

    useEffect(() => {
        if (!hasInitialized.current && messageHistory.length > 0) {
            const historyData = messageHistory
                .map((msg) => {
                    const wsData = JSON.parse(msg.data) as NezhaWebsocketResponse
                    const server = wsData.servers.find((s) => s.id === data.id)
                    if (!server) return null
                    const { disk } = formatNezhaInfo(wsData.now, server)
                    return { timeStamp: wsData.now.toString(), disk }
                })
                .filter((item): item is { timeStamp: string; disk: number } => item !== null)
                .reverse()
            setChartData(historyData)
            hasInitialized.current = true
            setHistoryLoaded(true)
        }
    }, [messageHistory])

    useEffect(() => {
        if (data && historyLoaded) {
            const timestamp = Date.now().toString()
            setChartData((prevData) => {
                if (prevData.length === 0) {
                    return [{ timeStamp: timestamp, disk }, { timeStamp: timestamp, disk }]
                }
                const newData = [...prevData, { timeStamp: timestamp, disk }]
                return newData.length > 30 ? newData.slice(1) : newData
            })
        }
    }, [data, historyLoaded])

    const chartConfig = { disk: { label: "Disk" } } satisfies ChartConfig

    return (
        <Card style={cardOpacityStyle}>
            <CardContent className="px-6 py-3">
                <section className="flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                        <p className="text-md font-medium">{t("serverDetailChart.disk")}</p>
                        <section className="flex flex-col items-end gap-0.5">
                            <section className="flex items-center gap-2">
                                <p className="text-xs text-end w-10 font-medium">{disk.toFixed(0)}%</p>
                                <AnimatedCircularProgressBar className="size-3 text-[0px]" max={100} min={0} value={disk} primaryColor="hsl(var(--chart-5))" />
                            </section>
                            <div className="flex text-[11px] font-medium items-center gap-2">
                                {formatBytes(data.state.disk_used)} / {formatBytes(data.host.disk_total)}
                            </div>
                        </section>
                    </div>
                    <ChartContainer config={chartConfig} className="aspect-auto h-[130px] w-full">
                        <AreaChart data={chartData} margin={{ top: 12, left: 12, right: 12 }}>
                            <CartesianGrid vertical={false} />
                            <XAxis dataKey="timeStamp" tickLine={false} axisLine={false} tickMargin={8} minTickGap={200} interval="preserveStartEnd" tickFormatter={(value) => formatRelativeTime(value)} />
                            <YAxis tickLine={false} axisLine={false} mirror={true} tickMargin={-15} domain={[0, 100]} tickFormatter={(value) => `${value}%`} />
                            <Area isAnimationActive={false} dataKey="disk" type="step" fill="hsl(var(--chart-5))" fillOpacity={0.3} stroke="hsl(var(--chart-5))" />
                        </AreaChart>
                    </ChartContainer>
                </section>
            </CardContent>
        </Card>
    )
}

function MemChartRealtime({ now, data, messageHistory }: { now: number; data: NezhaServer; messageHistory: { data: string }[] }) {
    const { t } = useTranslation()
    const [chartData, setChartData] = useState<{ timeStamp: string; mem: number; swap: number }[]>([])
    const hasInitialized = useRef(false)
    const [historyLoaded, setHistoryLoaded] = useState(false)
    const cardOpacityStyle = useCardOpacity()
    const { mem, swap } = formatNezhaInfo(now, data)

    useEffect(() => {
        if (!hasInitialized.current && messageHistory.length > 0) {
            const historyData = messageHistory
                .map((msg) => {
                    const wsData = JSON.parse(msg.data) as NezhaWebsocketResponse
                    const server = wsData.servers.find((s) => s.id === data.id)
                    if (!server) return null
                    const { mem, swap } = formatNezhaInfo(wsData.now, server)
                    return { timeStamp: wsData.now.toString(), mem, swap }
                })
                .filter((item): item is { timeStamp: string; mem: number; swap: number } => item !== null)
                .reverse()
            setChartData(historyData)
            hasInitialized.current = true
            setHistoryLoaded(true)
        }
    }, [messageHistory])

    useEffect(() => {
        if (data && historyLoaded) {
            const timestamp = Date.now().toString()
            setChartData((prevData) => {
                if (prevData.length === 0) {
                    return [{ timeStamp: timestamp, mem, swap }, { timeStamp: timestamp, mem, swap }]
                }
                const newData = [...prevData, { timeStamp: timestamp, mem, swap }]
                return newData.length > 30 ? newData.slice(1) : newData
            })
        }
    }, [data, historyLoaded])

    const chartConfig = { mem: { label: "Mem" }, swap: { label: "Swap" } } satisfies ChartConfig

    return (
        <Card style={cardOpacityStyle}>
            <CardContent className="px-6 py-3">
                <section className="flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                        <section className="flex items-center gap-4">
                            <div className="flex flex-col">
                                <p className="text-xs text-muted-foreground">{t("serverDetailChart.mem")}</p>
                                <div className="flex items-center gap-2">
                                    <AnimatedCircularProgressBar className="size-3 text-[0px]" max={100} min={0} value={mem} primaryColor="hsl(var(--chart-8))" />
                                    <p className="text-xs font-medium">{mem.toFixed(0)}%</p>
                                </div>
                            </div>
                            <div className="flex flex-col">
                                <p className="text-xs text-muted-foreground">{t("serverDetailChart.swap")}</p>
                                <div className="flex items-center gap-2">
                                    <AnimatedCircularProgressBar className="size-3 text-[0px]" max={100} min={0} value={swap} primaryColor="hsl(var(--chart-10))" />
                                    <p className="text-xs font-medium">{swap.toFixed(0)}%</p>
                                </div>
                            </div>
                        </section>
                        <section className="flex flex-col items-end gap-0.5">
                            <div className="flex text-[11px] font-medium items-center gap-2">
                                {formatBytes(data.state.mem_used)} / {formatBytes(data.host.mem_total)}
                            </div>
                            <div className="flex text-[11px] font-medium items-center gap-2">
                                {data.host.swap_total ? <>swap: {formatBytes(data.state.swap_used)} / {formatBytes(data.host.swap_total)}</> : <>no swap</>}
                            </div>
                        </section>
                    </div>
                    <ChartContainer config={chartConfig} className="aspect-auto h-[130px] w-full">
                        <AreaChart data={chartData} margin={{ top: 12, left: 12, right: 12 }}>
                            <CartesianGrid vertical={false} />
                            <XAxis dataKey="timeStamp" tickLine={false} axisLine={false} tickMargin={8} minTickGap={200} interval="preserveStartEnd" tickFormatter={(value) => formatRelativeTime(value)} />
                            <YAxis tickLine={false} axisLine={false} mirror={true} tickMargin={-15} domain={[0, 100]} tickFormatter={(value) => `${value}%`} />
                            <Area isAnimationActive={false} dataKey="mem" type="step" fill="hsl(var(--chart-8))" fillOpacity={0.3} stroke="hsl(var(--chart-8))" />
                            <Area isAnimationActive={false} dataKey="swap" type="step" fill="hsl(var(--chart-10))" fillOpacity={0.3} stroke="hsl(var(--chart-10))" />
                        </AreaChart>
                    </ChartContainer>
                </section>
            </CardContent>
        </Card>
    )
}

function NetworkChartRealtime({ now, data, messageHistory }: { now: number; data: NezhaServer; messageHistory: { data: string }[] }) {
    const { t } = useTranslation()
    const [chartData, setChartData] = useState<{ timeStamp: string; upload: number; download: number }[]>([])
    const hasInitialized = useRef(false)
    const [historyLoaded, setHistoryLoaded] = useState(false)
    const cardOpacityStyle = useCardOpacity()
    const { up, down } = formatNezhaInfo(now, data)

    useEffect(() => {
        if (!hasInitialized.current && messageHistory.length > 0) {
            const historyData = messageHistory
                .map((msg) => {
                    const wsData = JSON.parse(msg.data) as NezhaWebsocketResponse
                    const server = wsData.servers.find((s) => s.id === data.id)
                    if (!server) return null
                    const { up, down } = formatNezhaInfo(wsData.now, server)
                    return { timeStamp: wsData.now.toString(), upload: up, download: down }
                })
                .filter((item): item is { timeStamp: string; upload: number; download: number } => item !== null)
                .reverse()
            setChartData(historyData)
            hasInitialized.current = true
            setHistoryLoaded(true)
        }
    }, [messageHistory])

    useEffect(() => {
        if (data && historyLoaded) {
            const timestamp = Date.now().toString()
            setChartData((prevData) => {
                if (prevData.length === 0) {
                    return [{ timeStamp: timestamp, upload: up, download: down }, { timeStamp: timestamp, upload: up, download: down }]
                }
                const newData = [...prevData, { timeStamp: timestamp, upload: up, download: down }]
                return newData.length > 30 ? newData.slice(1) : newData
            })
        }
    }, [data, historyLoaded])

    const chartConfig = { upload: { label: "Upload" }, download: { label: "Download" } } satisfies ChartConfig

    const formatSpeed = (value: number) => {
        if (value >= 1024) return `${(value / 1024).toFixed(2)}G/s`
        if (value >= 1) return `${value.toFixed(2)}M/s`
        return `${(value * 1024).toFixed(2)}K/s`
    }

    return (
        <Card style={cardOpacityStyle}>
            <CardContent className="px-6 py-3">
                <section className="flex flex-col gap-1">
                    <div className="flex items-center">
                        <section className="flex items-center gap-4">
                            <div className="flex flex-col w-20">
                                <p className="text-xs text-muted-foreground">{t("serverDetailChart.upload")}</p>
                                <div className="flex items-center gap-1">
                                    <span className="relative inline-flex size-1.5 rounded-full bg-[hsl(var(--chart-1))]"></span>
                                    <p className="text-xs font-medium">{formatSpeed(up)}</p>
                                </div>
                            </div>
                            <div className="flex flex-col w-20">
                                <p className="text-xs text-muted-foreground">{t("serverDetailChart.download")}</p>
                                <div className="flex items-center gap-1">
                                    <span className="relative inline-flex size-1.5 rounded-full bg-[hsl(var(--chart-4))]"></span>
                                    <p className="text-xs font-medium">{formatSpeed(down)}</p>
                                </div>
                            </div>
                        </section>
                    </div>
                    <ChartContainer config={chartConfig} className="aspect-auto h-[130px] w-full">
                        <LineChart data={chartData} margin={{ top: 12, left: 12, right: 12 }}>
                            <CartesianGrid vertical={false} />
                            <XAxis dataKey="timeStamp" tickLine={false} axisLine={false} tickMargin={8} minTickGap={200} interval="preserveStartEnd" tickFormatter={(value) => formatRelativeTime(value)} />
                            <YAxis tickLine={false} axisLine={false} mirror={true} tickMargin={-15} tickFormatter={(value) => formatSpeed(value)} />
                            <Line isAnimationActive={false} strokeWidth={1} type="linear" dot={false} dataKey="upload" stroke="hsl(var(--chart-1))" />
                            <Line isAnimationActive={false} strokeWidth={1} type="linear" dot={false} dataKey="download" stroke="hsl(var(--chart-4))" />
                        </LineChart>
                    </ChartContainer>
                </section>
            </CardContent>
        </Card>
    )
}

function ConnectChartRealtime({ now, data, messageHistory }: { now: number; data: NezhaServer; messageHistory: { data: string }[] }) {
    const [chartData, setChartData] = useState<{ timeStamp: string; tcp: number; udp: number }[]>([])
    const hasInitialized = useRef(false)
    const [historyLoaded, setHistoryLoaded] = useState(false)
    const cardOpacityStyle = useCardOpacity()
    const { tcp, udp } = formatNezhaInfo(now, data)

    useEffect(() => {
        if (!hasInitialized.current && messageHistory.length > 0) {
            const historyData = messageHistory
                .map((msg) => {
                    const wsData = JSON.parse(msg.data) as NezhaWebsocketResponse
                    const server = wsData.servers.find((s) => s.id === data.id)
                    if (!server) return null
                    const { tcp, udp } = formatNezhaInfo(wsData.now, server)
                    return { timeStamp: wsData.now.toString(), tcp, udp }
                })
                .filter((item): item is { timeStamp: string; tcp: number; udp: number } => item !== null)
                .reverse()
            setChartData(historyData)
            hasInitialized.current = true
            setHistoryLoaded(true)
        }
    }, [messageHistory])

    useEffect(() => {
        if (data && historyLoaded) {
            const timestamp = Date.now().toString()
            setChartData((prevData) => {
                if (prevData.length === 0) {
                    return [{ timeStamp: timestamp, tcp, udp }, { timeStamp: timestamp, tcp, udp }]
                }
                const newData = [...prevData, { timeStamp: timestamp, tcp, udp }]
                return newData.length > 30 ? newData.slice(1) : newData
            })
        }
    }, [data, historyLoaded])

    const chartConfig = { tcp: { label: "TCP" }, udp: { label: "UDP" } } satisfies ChartConfig

    return (
        <Card style={cardOpacityStyle}>
            <CardContent className="px-6 py-3">
                <section className="flex flex-col gap-1">
                    <div className="flex items-center">
                        <section className="flex items-center gap-4">
                            <div className="flex flex-col">
                                <p className="text-xs text-muted-foreground">TCP</p>
                                <div className="flex items-center gap-1">
                                    <span className="relative inline-flex size-1.5 rounded-full bg-[hsl(var(--chart-1))]"></span>
                                    <p className="text-xs font-medium">{tcp}</p>
                                </div>
                            </div>
                            <div className="flex flex-col">
                                <p className="text-xs text-muted-foreground">UDP</p>
                                <div className="flex items-center gap-1">
                                    <span className="relative inline-flex size-1.5 rounded-full bg-[hsl(var(--chart-4))]"></span>
                                    <p className="text-xs font-medium">{udp}</p>
                                </div>
                            </div>
                        </section>
                    </div>
                    <ChartContainer config={chartConfig} className="aspect-auto h-[130px] w-full">
                        <LineChart data={chartData} margin={{ top: 12, left: 12, right: 12 }}>
                            <CartesianGrid vertical={false} />
                            <XAxis dataKey="timeStamp" tickLine={false} axisLine={false} tickMargin={8} minTickGap={200} interval="preserveStartEnd" tickFormatter={(value) => formatRelativeTime(value)} />
                            <YAxis tickLine={false} axisLine={false} mirror={true} tickMargin={-15} />
                            <Line isAnimationActive={false} strokeWidth={1} type="linear" dot={false} dataKey="tcp" stroke="hsl(var(--chart-1))" />
                            <Line isAnimationActive={false} strokeWidth={1} type="linear" dot={false} dataKey="udp" stroke="hsl(var(--chart-4))" />
                        </LineChart>
                    </ChartContainer>
                </section>
            </CardContent>
        </Card>
    )
}
