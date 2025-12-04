import { NetworkChart } from "@/components/NetworkChart"
import ServerHistoryChart from "@/components/ServerHistoryChart"
import ServerDetailOverview from "@/components/ServerDetailOverview"
import TabSwitch from "@/components/TabSwitch"
import { TimeRangeSelector } from "@/components/TimeRangeSelector"
import { Separator } from "@/components/ui/separator"
import { useEffect, useMemo, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { useTranslation } from "react-i18next"

export default function ServerDetail() {
  const navigate = useNavigate()
  const { t } = useTranslation()

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" })
  }, [])

  const tabs = ["Detail", "Network"]
  const [currentTab, setCurrentTab] = useState(tabs[0])
  const [loadHours, setLoadHours] = useState<number>(0) // 默认实时
  const [pingHours, setPingHours] = useState<number>(24) // 网络延迟默认24小时

  const { id: server_id } = useParams()

  // 负载图表时间范围选项
  const loadTimeRanges = useMemo(
    () => [
      { label: t("timeRange.live", "实时"), hours: 0 },
      { label: t("timeRange.1hour", "1小时"), hours: 1 },
      { label: t("timeRange.4hours", "4小时"), hours: 4 },
      { label: t("timeRange.1day", "1天"), hours: 24 },
      { label: t("timeRange.7days", "7天"), hours: 168 },
    ],
    [t],
  )

  // 网络延迟时间范围选项（无实时选项）
  const pingTimeRanges = useMemo(
    () => [
      { label: t("timeRange.1hour", "1小时"), hours: 1 },
      { label: t("timeRange.4hours", "4小时"), hours: 4 },
      { label: t("timeRange.1day", "1天"), hours: 24 },
      { label: t("timeRange.7days", "7天"), hours: 168 },
    ],
    [t],
  )

  if (!server_id) {
    navigate("/404")
    return null
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-0 flex flex-col gap-4 server-info">
      <ServerDetailOverview server_id={server_id} />
      <section className="flex items-center my-2 w-full">
        <Separator className="flex-1" />
        <div className="flex justify-center w-full max-w-[200px]">
          <TabSwitch tabs={tabs} currentTab={currentTab} setCurrentTab={setCurrentTab} />
        </div>
        <Separator className="flex-1" />
      </section>
      <div style={{ display: currentTab === tabs[0] ? "block" : "none" }}>
        {/* 负载图表时间范围选择器 */}
        <div className="flex justify-center mb-4">
          <TimeRangeSelector currentHours={loadHours} onTimeRangeChange={setLoadHours} timeRanges={loadTimeRanges} />
        </div>
        {/* 图表区域 */}
        <ServerHistoryChart server_id={server_id} hours={loadHours} />
      </div>
      <div style={{ display: currentTab === tabs[1] ? "block" : "none" }}>
        {/* 网络延迟时间范围选择器 */}
        <div className="flex justify-center mb-4">
          <TimeRangeSelector currentHours={pingHours} onTimeRangeChange={setPingHours} timeRanges={pingTimeRanges} />
        </div>
        <NetworkChart server_id={Number(server_id)} show={currentTab === tabs[1]} hours={pingHours} />
      </div>
    </div>
  )
}

