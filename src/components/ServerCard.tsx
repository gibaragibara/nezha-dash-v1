import ServerFlag from "@/components/ServerFlag"
import ServerUsageBar from "@/components/ServerUsageBar"
import { GetFontLogoClass, GetOsName, MageMicrosoftWindows } from "@/lib/logo-class"
import { cn, formatNezhaInfo, parsePublicNote } from "@/lib/utils"
import { NezhaServer } from "@/types/nezha-api"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import { useCardOpacity } from "@/hooks/use-card-opacity"

import BillingInfo from "./billingInfo"
import { Card } from "./ui/card"

export default function ServerCard({ now, serverInfo }: { now: number; serverInfo: NezhaServer }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { name, country_code, online, cpu, up, down, mem, stg, public_note, platform, tcp, udp, tag } = formatNezhaInfo(
    now,
    serverInfo,
  )

  const cardClick = () => {
    sessionStorage.setItem("fromMainPage", "true")
    navigate(`/server/${serverInfo.id}`)
  }

  const showFlag = true
  const cardOpacityStyle = useCardOpacity()

  // @ts-expect-error FixedTopServerName is a global variable
  const fixedTopServerName = window.FixedTopServerName as boolean

  const parsedData = parsePublicNote(public_note)

  return online ? (
    <Card
      className={cn(
        "flex flex-col items-center justify-start gap-3 p-3 md:px-5 cursor-pointer hover:bg-accent/50 transition-colors",
        {
          "flex-col": fixedTopServerName,
          "lg:flex-row": !fixedTopServerName,
        },
      )}
      style={cardOpacityStyle}
      onClick={cardClick}
    >
      <section
        className={cn("grid items-center gap-2", {
          "lg:w-40": !fixedTopServerName,
        })}
        style={{ gridTemplateColumns: "auto auto 1fr" }}
      >
        <span className="h-2 w-2 shrink-0 rounded-full bg-green-500 self-center"></span>
        <div className={cn("flex items-center justify-center", showFlag ? "min-w-[17px]" : "min-w-0")}>
          {showFlag ? <ServerFlag country_code={country_code} /> : null}
        </div>
        <div className="relative flex flex-col">
          <p className={cn("break-normal font-bold tracking-tight", showFlag ? "text-xs " : "text-sm")}>{name}</p>
          <div
            className={cn("hidden lg:block", {
              "lg:hidden": fixedTopServerName,
            })}
          >
            {parsedData?.billingDataMod && <BillingInfo parsedData={parsedData} />}
          </div>
        </div>
      </section>
      <div
        className={cn("flex items-center gap-2 -mt-2 lg:hidden", {
          "lg:flex": fixedTopServerName,
        })}
      >
        {parsedData?.billingDataMod && <BillingInfo parsedData={parsedData} />}
      </div>
      <div className="flex flex-col lg:items-start items-center gap-2">
        <section className={cn("flex items-center gap-1")}>
          {fixedTopServerName && (
            <div className={"hidden col-span-1 items-center lg:flex lg:flex-row gap-2"}>
              <div className="text-xs font-semibold">
                {platform.includes("Windows") ? (
                  <MageMicrosoftWindows className="size-[10px]" />
                ) : (
                  <p className={`fl-${GetFontLogoClass(platform)}`} />
                )}
              </div>
              <div className={"flex w-14 flex-col"}>
                <p className="text-xs text-muted-foreground">{t("serverCard.system")}</p>
                <div className="flex items-center text-[10.5px] font-semibold">{platform.includes("Windows") ? "Windows" : GetOsName(platform)}</div>
              </div>
            </div>
          )}
          <div className={"flex w-[2.8rem] flex-col flex-shrink-0"}>
            <p className="text-xs text-muted-foreground">{"CPU"}</p>
            <div className="flex items-center text-xs font-semibold">{cpu.toFixed(2)}%</div>
            <ServerUsageBar value={cpu} />
          </div>
          <div className={"flex w-[2.8rem] flex-col flex-shrink-0"}>
            <p className="text-xs text-muted-foreground">{t("serverCard.mem")}</p>
            <div className="flex items-center text-xs font-semibold">{mem.toFixed(2)}%</div>
            <ServerUsageBar value={mem} />
          </div>
          <div className={"flex w-[2.8rem] flex-col flex-shrink-0"}>
            <p className="text-xs text-muted-foreground">{t("serverCard.stg")}</p>
            <div className="flex items-center text-xs font-semibold">{stg.toFixed(2)}%</div>
            <ServerUsageBar value={stg} />
          </div>
          <div className={"flex w-[3.8rem] flex-col flex-shrink-0"}>
            <p className="text-xs text-muted-foreground">{t("serverCard.upload")}</p>
            <div className="flex items-center text-xs font-semibold whitespace-nowrap">
              {up >= 1024 ? `${(up / 1024).toFixed(2)}G/s` : up >= 1 ? `${up.toFixed(2)}M/s` : `${(up * 1024).toFixed(2)}K/s`}
            </div>
          </div>
          <div className={"flex w-[3.8rem] flex-col flex-shrink-0"}>
            <p className="text-xs text-muted-foreground">{t("serverCard.download")}</p>
            <div className="flex items-center text-xs font-semibold whitespace-nowrap">
              {down >= 1024 ? `${(down / 1024).toFixed(2)}G/s` : down >= 1 ? `${down.toFixed(2)}M/s` : `${(down * 1024).toFixed(2)}K/s`}
            </div>
          </div>
          <div className={"flex w-[1.8rem] flex-col flex-shrink-0"}>
            <p className="text-xs text-muted-foreground text-center">TCP</p>
            <div className="flex items-center justify-center text-xs font-semibold">{tcp}</div>
          </div>
          <div className={"flex w-[1.8rem] flex-col flex-shrink-0"}>
            <p className="text-xs text-muted-foreground text-center">UDP</p>
            <div className="flex items-center justify-center text-xs font-semibold">{udp}</div>
          </div>
        </section>
        <section className="flex gap-1 items-center flex-wrap mt-0.5">
          {parsedData?.planDataMod && (
            <>
              {parsedData.planDataMod.bandwidth !== "" && (
                <p className="text-[9px] bg-blue-600 dark:bg-blue-800 text-blue-200 dark:text-blue-300 w-fit rounded-[5px] px-[3px] py-[1.5px]">
                  {parsedData.planDataMod.bandwidth}
                </p>
              )}
              {parsedData.planDataMod.trafficVol !== "" && (
                <p className="text-[9px] bg-green-600 text-green-200 dark:bg-green-800 dark:text-green-300 w-fit rounded-[5px] px-[3px] py-[1.5px]">
                  {parsedData.planDataMod.trafficVol}
                </p>
              )}
              {parsedData.planDataMod.IPv4 === "1" && (
                <p className="text-[9px] bg-purple-600 text-purple-200 dark:bg-purple-800 dark:text-purple-300 w-fit rounded-[5px] px-[3px] py-[1.5px]">
                  IPv4
                </p>
              )}
              {parsedData.planDataMod.IPv6 === "1" && (
                <p className="text-[9px] bg-pink-600 text-pink-200 dark:bg-pink-800 dark:text-pink-300 w-fit rounded-[5px] px-[3px] py-[1.5px]">
                  IPv6
                </p>
              )}
            </>
          )}
          {tag && tag.split(' ').map((t, i) => (
            <p key={i} className="text-[9px] bg-amber-600 text-amber-200 dark:bg-amber-800 dark:text-amber-300 w-fit rounded-[5px] px-[3px] py-[1.5px]">
              {t}
            </p>
          ))}
          {parsedData?.planDataMod && (
            <>
              {parsedData.planDataMod.networkRoute && (
                <p className="text-[9px] bg-blue-600 text-blue-200 dark:bg-blue-800 dark:text-blue-300 w-fit rounded-[5px] px-[3px] py-[1.5px]">
                  {parsedData.planDataMod.networkRoute.split(",").map((route, index) => {
                    return route + (index === parsedData.planDataMod!.networkRoute.split(",").length - 1 ? "" : "｜")
                  })}
                </p>
              )}
              {parsedData.planDataMod.extra && parsedData.planDataMod.extra.split(",").filter(Boolean).map((extra, index) => (
                <p key={index} className="text-[9px] bg-stone-600 text-stone-200 dark:bg-stone-800 dark:text-stone-300 w-fit rounded-[5px] px-[3px] py-[1.5px]">
                  {extra}
                </p>
              ))}
            </>
          )}
        </section>
      </div>
    </Card>
  ) : (
    <Card
      className={cn(
        "flex flex-col items-center justify-start gap-3 sm:gap-0 p-3 md:px-5 cursor-pointer hover:bg-accent/50 transition-colors",
        "lg:min-h-[61px] min-h-[93px]",
        {
          "flex-col": fixedTopServerName,
          "lg:flex-row": !fixedTopServerName,
        },
      )}
      style={cardOpacityStyle}
      onClick={cardClick}
    >
      <section
        className={cn("grid items-center gap-2", {
          "lg:w-40": !fixedTopServerName,
        })}
        style={{ gridTemplateColumns: "auto auto 1fr" }}
      >
        <span className="h-2 w-2 shrink-0 rounded-full bg-red-500 self-center"></span>
        <div className={cn("flex items-center justify-center", showFlag ? "min-w-[17px]" : "min-w-0")}>
          {showFlag ? <ServerFlag country_code={country_code} /> : null}
        </div>
        <div className="relative flex flex-col">
          <p className={cn("break-normal font-bold tracking-tight max-w-[108px]", showFlag ? "text-xs" : "text-sm")}>{name}</p>
          <div
            className={cn("hidden lg:block", {
              "lg:hidden": fixedTopServerName,
            })}
          >
            {parsedData?.billingDataMod && <BillingInfo parsedData={parsedData} />}
          </div>
        </div>
      </section>
      <div
        className={cn("flex items-center gap-2 lg:hidden", {
          "lg:flex": fixedTopServerName,
        })}
      >
        {parsedData?.billingDataMod && <BillingInfo parsedData={parsedData} />}
      </div>
      <section className="flex gap-1 items-center flex-wrap mt-0.5">
        {parsedData?.planDataMod && (
          <>
            {parsedData.planDataMod.bandwidth !== "" && (
              <p className="text-[9px] bg-blue-600 dark:bg-blue-800 text-blue-200 dark:text-blue-300 w-fit rounded-[5px] px-[3px] py-[1.5px]">
                {parsedData.planDataMod.bandwidth}
              </p>
            )}
            {parsedData.planDataMod.trafficVol !== "" && (
              <p className="text-[9px] bg-green-600 text-green-200 dark:bg-green-800 dark:text-green-300 w-fit rounded-[5px] px-[3px] py-[1.5px]">
                {parsedData.planDataMod.trafficVol}
              </p>
            )}
            {parsedData.planDataMod.IPv4 === "1" && (
              <p className="text-[9px] bg-purple-600 text-purple-200 dark:bg-purple-800 dark:text-purple-300 w-fit rounded-[5px] px-[3px] py-[1.5px]">
                IPv4
              </p>
            )}
            {parsedData.planDataMod.IPv6 === "1" && (
              <p className="text-[9px] bg-pink-600 text-pink-200 dark:bg-pink-800 dark:text-pink-300 w-fit rounded-[5px] px-[3px] py-[1.5px]">
                IPv6
              </p>
            )}
          </>
        )}
        {tag && tag.split(' ').map((t, i) => (
          <p key={i} className="text-[9px] bg-red-600 text-red-200 dark:bg-red-800 dark:text-red-300 w-fit rounded-[5px] px-[3px] py-[1.5px]">
            {t}
          </p>
        ))}
        {parsedData?.planDataMod && (
          <>
            {parsedData.planDataMod.networkRoute && (
              <p className="text-[9px] bg-blue-600 text-blue-200 dark:bg-blue-800 dark:text-blue-300 w-fit rounded-[5px] px-[3px] py-[1.5px]">
                {parsedData.planDataMod.networkRoute.split(",").map((route, index) => {
                  return route + (index === parsedData.planDataMod!.networkRoute.split(",").length - 1 ? "" : "｜")
                })}
              </p>
            )}
            {parsedData.planDataMod.extra && parsedData.planDataMod.extra.split(",").filter(Boolean).map((extra, index) => (
              <p key={index} className="text-[9px] bg-stone-600 text-stone-200 dark:bg-stone-800 dark:text-stone-300 w-fit rounded-[5px] px-[3px] py-[1.5px]">
                {extra}
              </p>
            ))}
          </>
        )}
      </section>
    </Card>
  )
}
