// 主题颜色类型
export type ColorType =
  | "gray"
  | "gold"
  | "bronze"
  | "brown"
  | "yellow"
  | "amber"
  | "orange"
  | "tomato"
  | "red"
  | "ruby"
  | "crimson"
  | "pink"
  | "plum"
  | "purple"
  | "violet"
  | "iris"
  | "indigo"
  | "blue"
  | "cyan"
  | "teal"
  | "jade"
  | "green"
  | "grass"
  | "lime"
  | "mint"
  | "sky"

// 配置选项接口
export interface ConfigOptions {
  selectThemeColor: ColorType // 主题颜色
  backgroundImage: string // 桌面端背景图片URL
  backgroundImageMobile: string // 移动端背景图片URL
  backgroundAlignment: string // 背景对齐方式
  cardOpacity: number // 卡片透明度 (0-100)
  illustrationUrl: string // 右上角插图链接
}

// 默认配置
export const DEFAULT_CONFIG: ConfigOptions = {
  selectThemeColor: "violet",
  backgroundImage: "",
  backgroundImageMobile: "",
  backgroundAlignment: "cover,center",
  cardOpacity: 70,
  illustrationUrl: "/animated-man.webp",
}
