import { formatBytes } from "@/lib/format"
import { getDaysBetweenDates, parsePublicNote } from "@/lib/utils"
import { NezhaServer } from "@/types/nezha-api"
import { useTranslation } from "react-i18next"

import { Card } from "./ui/card"

interface TotalBillingCardProps {
    servers: NezhaServer[]
}

export default function TotalBillingCard({ servers }: TotalBillingCardProps) {
    const { t } = useTranslation()

    // 计算全网剩余价值总额
    let totalRemainingValue = 0
    let expiringServersCount = 0
    let totalTrafficRemaining = 0

    servers.forEach((server) => {
        const parsedData = parsePublicNote(server.public_note || "")

        if (!parsedData) return

        // 计算剩余价值：(价格 / 周期天数) × 剩余天数
        if (parsedData.billingDataMod?.amount && parsedData.billingDataMod?.endDate) {
            const amountStr = parsedData.billingDataMod.amount
            const endDate = parsedData.billingDataMod.endDate
            const cycle = parsedData.billingDataMod.cycle || ""

            // 跳过永久订阅和无效数据
            if (endDate.startsWith("0000-00-00")) return

            // 识别货币符号并转换汇率
            let currencyRate = 1 // 默认人民币
            if (amountStr.includes("$") || amountStr.includes("USD")) {
                currencyRate = 7.2 // 美元转人民币
            } else if (amountStr.includes("€") || amountStr.includes("EUR")) {
                currencyRate = 7.8 // 欧元转人民币
            } else if (amountStr.includes("£") || amountStr.includes("GBP")) {
                currencyRate = 9.1 // 英镑转人民币
            }

            // 提取价格数字部分（支持 "¥100" 或 "$100" 或 "100" 格式）
            const amountMatch = amountStr.match(/[\d.]+/)
            if (!amountMatch) return

            const price = parseFloat(amountMatch[0]) * currencyRate
            if (isNaN(price) || price <= 0) return

            try {
                // 计算剩余天数
                const daysLeft = getDaysBetweenDates(endDate, new Date().toISOString())

                // 如果已过期，剩余价值为0
                if (daysLeft < 0) return

                // 根据周期计算总天数
                let cycleDays = 30 // 默认月付
                switch (cycle.toLowerCase()) {
                    case "年":
                    case "y":
                    case "yr":
                    case "year":
                    case "annual":
                        cycleDays = 365
                        break
                    case "季":
                    case "q":
                    case "qr":
                    case "quarterly":
                        cycleDays = 90
                        break
                    case "半":
                    case "半年":
                    case "h":
                    case "half":
                    case "semi-annually":
                        cycleDays = 180
                        break
                    case "月":
                    case "m":
                    case "mo":
                    case "month":
                    case "monthly":
                    default:
                        cycleDays = 30
                        break
                }

                // 计算剩余价值 = (价格 / cycleDays) × daysLeft
                const remainingValue = (price / cycleDays) * daysLeft
                totalRemainingValue += remainingValue

                // 统计 7 天内到期的服务器
                if (daysLeft >= 0 && daysLeft <= 7) {
                    expiringServersCount++
                }
            } catch (error) {
                console.error("Error calculating remaining value:", error)
            }
        }

        // 累加流量剩余
        if (parsedData.planDataMod?.trafficVol) {
            const trafficVolStr = parsedData.planDataMod.trafficVol
            const match = trafficVolStr.match(/([\d.]+)\s*(TB|GB|MB|KB|T|G|M|K|B)?/i)

            if (match) {
                const value = parseFloat(match[1])
                const unit = (match[2] || "").toUpperCase()

                const multipliers: { [key: string]: number } = {
                    TB: 1024 ** 4,
                    T: 1024 ** 4,
                    GB: 1024 ** 3,
                    G: 1024 ** 3,
                    MB: 1024 ** 2,
                    M: 1024 ** 2,
                    KB: 1024,
                    K: 1024,
                    B: 1,
                    "": 1024 ** 3, // 默认 GB
                }

                const trafficLimitBytes = value * (multipliers[unit] || 1024 ** 3)
                const trafficType = parsedData.planDataMod.trafficType || "max"

                // 获取已使用流量
                const netTotalUp = server.state?.net_out_transfer || 0
                const netTotalDown = server.state?.net_in_transfer || 0

                let usedTraffic = 0
                switch (trafficType.toLowerCase()) {
                    case "up":
                        usedTraffic = netTotalUp
                        break
                    case "down":
                        usedTraffic = netTotalDown
                        break
                    case "sum":
                        usedTraffic = netTotalUp + netTotalDown
                        break
                    case "min":
                        usedTraffic = Math.min(netTotalUp, netTotalDown)
                        break
                    case "max":
                    default:
                        usedTraffic = Math.max(netTotalUp, netTotalDown)
                        break
                }

                const remaining = Math.max(0, trafficLimitBytes - usedTraffic)
                totalTrafficRemaining += remaining
            }
        }
    })

    return (
        <Card className="flex items-center gap-4 p-4 bg-card border-border">
            {/* 左侧图标 */}
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-600/20 dark:bg-blue-500/20">
                <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            </div>

            {/* 信息区块 */}
            <div className="flex flex-1 flex-col sm:flex-row gap-3 sm:gap-6">
                {/* 全网剩余价值 */}
                <div className="flex flex-col">
                    <p className="text-xs text-muted-foreground mb-0.5">{t("billingInfo.totalAssets")}</p>
                    <p className="text-xl font-bold text-foreground">
                        ¥{totalRemainingValue.toFixed(2)}
                    </p>
                </div>

                {/* 订阅到期 */}
                <div className="flex flex-col">
                    <p className="text-xs text-muted-foreground mb-0.5">{t("billingInfo.subscriptionExpiry")}</p>
                    <div className="flex items-baseline gap-1">
                        <p className="text-xl font-bold text-foreground">{expiringServersCount}</p>
                        <p className="text-sm text-muted-foreground">{t("billingInfo.servers")}</p>
                    </div>
                </div>

                {/* 流量剩余 */}
                <div className="flex flex-col">
                    <p className="text-xs text-muted-foreground mb-0.5">{t("billingInfo.trafficRemaining")}</p>
                    <p className="text-xl font-bold text-green-600 dark:text-green-400">
                        {formatBytes(totalTrafficRemaining)}
                    </p>
                </div>
            </div>
        </Card>
    )
}
