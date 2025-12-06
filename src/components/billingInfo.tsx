import { PublicNoteData, calculateTrafficPercentage, cn, getDaysBetweenDatesWithAutoRenewal } from "@/lib/utils"
import { formatBytes } from "@/lib/format"
import { useTranslation } from "react-i18next"

import RemainPercentBar from "./RemainPercentBar"

interface BillingInfoProps {
  parsedData: PublicNoteData
  netTotalUp?: number
  netTotalDown?: number
}

export default function BillingInfo({ parsedData, netTotalUp = 0, netTotalDown = 0 }: BillingInfoProps) {
  const { t } = useTranslation()
  if (!parsedData || !parsedData.billingDataMod) {
    return null
  }

  let isNeverExpire = false
  let daysLeftObject = {
    days: 0,
    cycleLabel: "",
    remainingPercentage: 0,
  }

  if (parsedData?.billingDataMod?.endDate) {
    if (parsedData.billingDataMod.endDate.startsWith("0000-00-00")) {
      isNeverExpire = true
    } else {
      try {
        daysLeftObject = getDaysBetweenDatesWithAutoRenewal(parsedData.billingDataMod)
      } catch (error) {
        console.error(error)
        return (
          <div className={cn("text-[10px] text-muted-foreground text-red-600")}>
            {t("billingInfo.remaining")}: {t("billingInfo.error")}
          </div>
        )
      }
    }
  }

  // 计算流量使用百分比
  const hasTrafficInfo = parsedData.planDataMod?.trafficVol && parsedData.planDataMod?.trafficVol !== ""
  let trafficPercentage = 0
  let usedTraffic = 0
  let trafficLimit = 0

  if (hasTrafficInfo) {
    // 从 trafficVol 中解析流量限制,支持多种格式
    // 支持格式: "1TB", "2TB", "1.5TB", "550GB", "1000 GB", "1 TB", "2T", "500G" 等
    const trafficVolStr = parsedData.planDataMod?.trafficVol || ""

    // 更灵活的正则表达式:匹配数字(可包含小数点) + 可选空格 + 可选单位
    const match = trafficVolStr.match(/([\d.]+)\s*(TB|GB|MB|KB|T|G|M|K|B)?/i)

    if (match) {
      const value = parseFloat(match[1])
      const unit = (match[2] || "").toUpperCase()

      // 单位倍数映射 (支持简写和完整单位)
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
        "": 1024 ** 3, // 无单位默认为 GB
      }

      trafficLimit = value * (multipliers[unit] || 1024 ** 3)
    }

    const trafficType = parsedData.planDataMod?.trafficType || "max"
    trafficPercentage = calculateTrafficPercentage(trafficLimit, trafficType, netTotalUp, netTotalDown)

    // 计算已使用流量
    switch (trafficType?.toLowerCase()) {
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
  }

  return daysLeftObject.days >= 0 ? (
    <>
      {parsedData.billingDataMod.amount && parsedData.billingDataMod.amount !== "0" && parsedData.billingDataMod.amount !== "-1" ? (
        <p className={cn("text-[10px] text-muted-foreground ")}>
          {t("billingInfo.price")}: {parsedData.billingDataMod.amount}/{parsedData.billingDataMod.cycle}
        </p>
      ) : parsedData.billingDataMod.amount === "0" ? (
        <p className={cn("text-[10px] text-green-600 ")}>{t("billingInfo.free")}</p>
      ) : parsedData.billingDataMod.amount === "-1" ? (
        <p className={cn("text-[10px] text-pink-600 ")}>{t("billingInfo.usage-baseed")}</p>
      ) : null}
      {hasTrafficInfo ? (
        <>
          <div className={cn("text-[10px] text-muted-foreground")}>
            流量: {trafficLimit > 0 ? `${formatBytes(usedTraffic)} / ${parsedData.planDataMod?.trafficVol || ""}` : "无限制"}
          </div>
          {trafficLimit > 0 && <RemainPercentBar className="mt-0.5" value={trafficPercentage} />}
        </>
      ) : (
        <div className={cn("text-[10px] text-muted-foreground")}>
          {t("billingInfo.remaining")}: {isNeverExpire ? t("billingInfo.indefinite") : daysLeftObject.days + " " + t("billingInfo.days")}
        </div>
      )}
    </>
  ) : (
    <>
      {parsedData.billingDataMod.amount && parsedData.billingDataMod.amount !== "0" && parsedData.billingDataMod.amount !== "-1" ? (
        <p className={cn("text-[10px] text-muted-foreground ")}>
          {t("billingInfo.price")}: {parsedData.billingDataMod.amount}/{parsedData.billingDataMod.cycle}
        </p>
      ) : parsedData.billingDataMod.amount === "0" ? (
        <p className={cn("text-[10px] text-green-600 ")}>{t("billingInfo.free")}</p>
      ) : parsedData.billingDataMod.amount === "-1" ? (
        <p className={cn("text-[10px] text-pink-600 ")}>{t("billingInfo.usage-baseed")}</p>
      ) : null}
      <p className={cn("text-[10px] text-muted-foreground text-red-600")}>
        {t("billingInfo.expired")}: {daysLeftObject.days * -1} {t("billingInfo.days")}
      </p>
    </>
  )
}
