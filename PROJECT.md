# 📁 项目档案（永久记忆库）— 我的财库 · 攒钱理财管家

> ⚠️ **任何新会话开始前，先读本文件**，一句话命令：
> 「主人，查阅 `理财工具/PROJECT.md` 后继续推进记账应用」
>
> 读完即恢复全部项目记忆，无需重新摸底。

---

## 📍 项目位置
- **目录**：`/Users/lvxin/.openclaw/workspace/理财工具/`
- **文件**：`index.html`（界面 + CSS + 粒子动画）、`app.js`（全部业务逻辑）
- **运行地址**：`http://localhost:8899`
- **技术**：纯静态 HTML + JS，零依赖，数据存 `localStorage`
- **数据库 key**：`wealth_tool_v1`（自动备份 `_backup`，历史快照 `_hist`）

## 🏷️ 版本
- 当前版本：**v1.0**「我的财库 · 攒钱理财管家」
- 深色金色主题 · 玻璃拟态卡片 · 底部 Tab 导航（攒钱/记账/资产/数据）
- 数据字段：goal, tx, incomes, budget, fx(汇率), assets, debts, social

---

## ✅ 已实现功能（对照用户 17 项清单）

| # | 模块 | 关键函数 / 实现 |
|---|------|----------------|
| 1 | 攒钱目标 | `setGoal` / `goalPaid`，进度用**净资产**算，达标显示已攒够 |
| 2 | 月度统计 | `monthIncome`/`monthExpense`，收入/支出/结余/储蓄率 |
| 3 | 预算提醒 | `setBudget`，超80%黄警告、超100%红超支 |
| 4 | 随手记账 | `addTx`/`editTx`/`delTx`，支出/收入+分类+日期+备注，**支持弹窗编辑** |
| 5 | 搜索筛选 | `renderListFilters` + `fQ`搜索 + 类型/分类筛选 |
| 6 | 固定收入 | `addIncome`/`delIncome`，工资/奖金列表 |
| 7 | 资产账户 | `addAsset`/`delAsset`/`totalAssets`，多币种CNY/USD/HKD/EUR/JPY |
| 8 | 负债管理 | `addDebt`/`delDebt`/`totalDebts` |
| 9 | 社保/保险 | `addSI`/`delSI`，名称+月缴+已缴年份 |
| 10 | 近6月趋势 | `renderChart`，收入绿/支出红柱状图 |
| 11 | 分类占比 | `renderDonut`，SVG 环形饼图+图例 |
| 12 | 分类排行 | `renderCatRanking`，进度条可视化 |
| 13 | Top消费 | `renderTopSpending`，🥇🥈🥉金银铜 |
| 14 | 导出/导入 | `exportData`/`importData`，JSON 备份 |
| 15 | 自动备份 | `save()` 内，20版历史快照+`restoreBackup` |
| 16 | 月份浏览 | `switchMonth`/`shiftMonth`/`monthTags` 标签+箭头 |

## ✅ 第四阶段增强（已完成，原6处缺口全部补齐）

| 优先级 | 模块 | 实现 | 完成 |
|--------|------|------|------|
| 🎯高 | **攒钱目标烟花** | `celebrateGoal`/`_fwBurst`，`#fireworks` canvas 覆盖层，达标≥100%时在目标卡上方放烟花（DPR 坐标缩放已修正） | ✅ |
| 🎯高 | **Emoji 选择器 100+** | `EMOJI_SET` 208个；`openEmojiPicker`/`pickEmoji`/`emojiGrid`，记账新增/编辑均可选图标并持久化到 `db.catIcons` | ✅ |
| 🎯高 | **负债管理增强** | 负债加 `rate`(年利率%)/`monthPay`(月还款)；`debtPayoffMonths`/`debtPayoffText` 自动估算还清月数（含月供低于利息边界）；`totalMonthPay` 汇总月供 | ✅ |
| 🎯高 | **年度汇总12月表** | `renderYearSummary` + `sumYear` 年份选择器，12个月收入/支出/结余/储蓄率表 + 年度合计 | ✅ |
| 🔧中 | **固定收入开关** | 收入加 `enabled`/`start`/`end`(生效/失效年月)；`toggleIncome` 开关；`monthIncome()` 按生效月过滤停发月 | ✅ |
| 🔧中 | **分类 emoji 自定义** | 历史硬编码映射抽为 `getCatIcon()`，`__DEFAULT_CAT_EMOJI` 仅作回退；`db.catIcons` 持久化自定义 | ✅ |

## ✅ 第五阶段增强（进行中，第一批已完成）

| 优先级 | 模块 | 实现 | 完成 |
|--------|------|------|------|
| 🔧高 | **数据版本化迁移** | `db.version` 字段(现v5)；`migrateData()` 兜底旧数据——缺 version 标1、保证 tx/incomes/assets/debts/social 为数组、fx/catIcons 为对象、补 tx 缺 id | ✅ |
| 🔧高 | **月度对比报表** | `monthStat(ym)`/`prevMonthYM(ym)`/`vsBadge()`/`renderMonthCompare()`，本月vs上月收入/消费/结余/储蓄率，箭头+涨跌%上色(消费反向)，`#monthCompare` | ✅ |
| 🔧高 | **累计净流入趋势** | `renderNetTrend()`，近8个月固定收入(按生效月)+记账收入-记账消费逐月累计，正负柱状图，`#netTrend` | ✅ |
| 🐛修复 | **escapeHtml 缺失 bug** | 新增 `escapeHtml()`（renderTopSpending 较早已引用却未定义，导致 Top消费卡片有数据时崩），已全局暴露 | ✅ |

## ✅ 第五阶段增强（第一批已完成）

| 优先级 | 模块 | 实现 | 完成 |
|--------|------|------|------|
| 🔧高 | **数据版本化迁移** | `db.version` 字段(现v5)；`migrateData()` 兜底旧数据——缺 version 标1、保证 tx/incomes/assets/debts/social 为数组、fx/catIcons 为对象、补 tx 缺 id | ✅ |
| 🔧高 | **月度对比报表** | `monthStat(ym)`/`prevMonthYM(ym)`/`vsBadge()`/`renderMonthCompare()`，本月vs上月收入/消费/结余/储蓄率，箭头+涨跌%上色(消费反向)，`#monthCompare` | ✅ |
| 🔧高 | **累计净流入趋势** | `renderNetTrend()`，近8个月固定收入(按生效月)+记账收入-记账消费逐月累计，正负柱状图，`#netTrend` | ✅ |
| 🐛修复 | **escapeHtml 缺失 bug** | 新增 `escapeHtml()`（renderTopSpending 较早已引用却未定义，导致 Top消费卡片有数据时崩），已全局暴露 | ✅ |

## ✅ 第五阶段第二批（已完成）

| 优先级 | 模块 | 实现 | 完成 |
|--------|------|------|------|
| 🎯高 | **达标日期精算到日** | `renderAll` 内 goalDate 由月初改精算：`ceil(months*30.4375)` 加到今天 → `YYYY-MM-DD`；无收入时显示「先记收入」提示 | ✅ |
| 🎯高 | **复利/72法则计算器** | `calcCompound()`/`calcRule72()`，新增🧮卡片（攒钱Tab）：本金+年利率+年数+每月定投 → 复利终值(含期末年金定投累加)；72法则=72/利率 预估翻倍年限+精确 ln2/ln(1+r) 对比；`btn-outline` 样式补充 | ✅ |

## ✅ 第六阶段新增（本轮完成）

| 优先级 | 模块 | 实现 | 完成 |
|--------|------|------|------|
| 🔧高 | **多格式导出 CSV/Excel** | 新增 `exportDataCSV()`(账本CSV) / `exportDataExcel()`(双Sheet.xls：账本明细+资产账户) / `_triggerDownload()`(加BOM防中文乱码) / `_csvEsc()`(CSV转义) / `_txTable()`(账本表格)；保留原 `exportData()` JSON完整备份；区别：JSON可回导，CSV/Excel仅供办公查看编辑 | ✅ |

---
*最后更新：2026-08-08 · 第六阶段（多格式导出CSV/Excel）完成，node check + playwright e2e 9项全部通过*

## ✅ 第七阶段新增（本轮完成）

| 优先级 | 模块 | 实现 | 完成 |
|--------|------|------|------|
| 🎯高 | **PIN 隐私锁** | 独立 IIFE 模块：锁屏全屏浮层(z-index:2000，覆盖粒子动画) + 专属数字键盘(0-9/+⌫/+✔)；`pinKey()/pinKeyClear()/pinKeyOk()`编辑缓冲；PIN 用**加盐 FNV-1a hash** 存独立 key `wealth_pin`(s/h) 非明文；锁状态 `wealth_pin_on`；`openPinSetup()`设/改PIN(验原PIN、4~6位、二次确认)、`togglePinLock()`开关+未设PIN先提示、`renderPinPanel()`状态面板；DOMContentLoaded 时若已开启锁先 `showLock()` 挡住内容，输对 hash 匹配才 `hideLock()` | ✅ |

---
*最后更新：2026-08-08 · 第七阶段（PIN 隐私锁）完成，node check + playwright e2e 15项全部通过，无JS运行时错误*

## ✅ 第八阶段新增（本轮完成）

| 优先级 | 模块 | 实现 | 完成 |
|--------|------|------|------|
| 🎯高 | **数据仪表盘（首页聚合总览）** | 攒钱Tab目标卡后新增 `#dashCard` 卡片 + `renderDash()`；本月财务三联(收入/支出/结余+储蓄率) `monthStat`/`monthIncome`/`monthExpense`；预算进度条(0-100%彩条：正常绿/≥80%黄/超支红，剩/超支提示)；资产三联(总资产/总负债/净资产)；本月消费分类排行Top5(Emoji+进度条，`getCatIcon`)；最近5笔流水速览(全局最新，不限月)；CSS：`.dash-card/.dash-3/.dash-bar-fill(.warn/.over)/.cat-item/.r-item`，复用 `--gold/*green/*red` 变量 | ✅ |

---
*最后更新：2026-08-08 · 第八阶段（数据仪表盘）完成，node check + playwright e2e 17项全部通过，无JS运行时错误*

## ✅ 第九阶段新增（本轮完成）

| 优先级 | 模块 | 实现 | 完成 |
|--------|------|------|------|
| 🎯高 | **⚡ 快捷模板** | 记账Tab「随手记账」前新增「⚡快捷记账」卡 `#quickTpl` + `renderQuickTpl()`；内置6默认模板(早餐¥8/地铁4/午餐25/咖啡15/打车20/零食10) `defaultQuickTpl()`；内置与自定义合并 `quickTplList()`(内置id以`q-`开头、自定义`c`+uid区分，删除内置可用同名覆盖)；`quickTx(id)` 一键记支出(可传内置或自定义id)；`quickAdd(o)` 写一条支出(供快捷/周期复用)；「＋」按钮 `openQuickTplSetup()` 用 prompt 增删自定义模板；CSS `.quick-grid/.quick-btn(.quick-add)` | ✅ |
| 🎯高 | **🔄 周期性支出** | 记账Tab「收入」后新增「周期性支出」卡；数据 `db.recurring[]`{id,name,amt,cat,day,icon,enabled,lastGen}+防重标记 `db._recurGenYm`；`addRecurring()`(验证1-31日；新增时今日≥扣款日立即补生成当月账单)；`toggleRecurring()/delRecurring()` 开关删除；`processRecurring()` 在 `renderAll()` 开头调用——若 `_recurGenYm!==本月` 则遍历启用项、今日≥day且`lastGen!==本月` 用 `quickAddRecurring()` 生成账单，最后标记 `_recurGenYm=本月` 防重复；`renderRecurring()` 渲染列表 | ✅ |
| 🧮中 | **🔢 负债还清周期估算器** | 负债录入表单下新增实时计算器(欠款`calcDebtAmt`/年利率`calcDebtRate`/月还款`calcDebtPay`→`calcDebtOut`)；`calcDebtPayoff()` 复用 `debtPayoffMonths()` 构造临时对象算/显示「约X年X个月(共N期)还清+累计利息」；月供<利息提示「永远还不清」；空值友好提示；纯交互不新增数据源 | ✅ |

## ✅ 第十阶段新增（本轮完成）

| 优先级 | 模块 | 实现 | 完成 |
|--------|------|------|------|
| 🎯高 | **🌓 明/暗主题切换** | 默认深色；顶部新增 `#themeToggle` 按钮(图标 `#themeIcon`)；`body[data-theme='light']{...}` 定义整套浅色 CSS 变量(背景双层径向+线性渐变、白卡/暗字等，覆盖 `:root` 深色默认)；`applyTheme(theme)` 浅色设 `data-theme='light'`、深色移除属性(默认态)，按主题切图标；`resolveTheme()`=手动偏好>系统 `prefers-color-scheme`(matchMedia)；`toggleTheme()` 取当前态翻转并写 `localStorage.wealth_theme` 固化为显式偏好；未手动偏好时监听 matchMedia `change` 自动跟随系统明暗；DOM 就绪后 init 应用；e2e 10项全部通过(按钮切换/图标变化/localStorage持久化/浅色背景生效/无JS运行时错误) | ✅ |

---
*最后更新：2026-08-08 · 第十阶段（明/暗主题切换）完成，node check + playwright e2e 10项全部通过，无JS运行时错误*

---
*最后更新：2026-08-08 · 第九阶段（快捷模板+周期性支出+负债计算器）完成，node check + playwright e2e 16项全部通过，无JS运行时错误*

---

## ✅ 第十一阶段新增（本轮完成）

| 优先级 | 模块 | 实现 | 完成 |
|--------|------|------|------|
| 🎯高 | **🎨 导航滑动指示器 + Logo 流光** | `#tabSlider` 金块(绝对定位在 tabbar 内，线性渐变+内高光+过渡)随激活 Tab 平滑滑动；`moveTabSlider()` 读 `.tab-btn.active` 的 getBoundingClientRect 相对 tabbar 定位，`switchTab` 内调用+ init 后 rAF 首帧+ resize 监听；`.brand span` 加 `background-size:200%` + `brandFlow` 无限流动 | ✅ |
| 🎯高 | **✨ 鼠标跟随柔光** | `#mouseGlow` 300×300 径向渐变 div(纯 CSS 圆)，仅 `(pointer:fine)` 设备启用(matchMedia)；`mousemove` 采集 clientX/Y + rAF 设置 left/top(配合 CSS transition .12s 平滑)、`mouseleave` 归零；悬浮可交互元素(button/a/input/.item/.quick-btn)时透明度增强(.5→.9)，`closest` 判断 | ✅ |
| 🎯高 | **💫 统计卡顶部呼吸光条** | `.stat` 加 `position:relative;overflow:hidden` + `::before`(顶部 3px 渐变条) `statBreathe` 呼吸动画；绿(收入)/红(消费)/金(结余) 分别用 `--stat-accent` CSS 变量 + nth-child 不同 delay 错峰 | ✅ |
| 🎯高 | **📊 账本 Stagger + hover 位移 + Emoji 弹跳** | `.item` 加 `itemIn` 入场动画 + stagger(每项 `animation-delay:min(idx*30,240)ms` 注入 tx/income/debt/social 列表) + `:hover` translateX(4px)/边框金色/阴影 + `.emoji` 悬停 `emojiBounce`(上跳+scale+旋转) | ✅ |
| 🎯高 | **🪟 模态框 3D 透视 + 顶部金线** | `.overlay` 加 `perspective:900px`；`.modal` 改 `modalIn3d`(translateY+rotateX(10deg)+scale 3D 入场动画，`transform-origin:center 0%`) + `::before` 顶部金色渐变线 | ✅ |
| 🎯高 | **🎯 目标尖端闪烁 + 背景脉冲** | `.progress .bar::before` 尖端亮点(径向发光点) `tipPulse` 呼吸；`.hero` 加 `heroPulse`(box-shadow 温柔脉动) + `position:relative;overflow:hidden` | ✅ |
| 🔧中 | **💭 空状态图标浮动** | `.empty::before` 放大 🪄 图标 + `emptyFloat` 上下浮动；`.dash-cats/.dash-recent .empty::before` 设 `content:none` 保持仪表盘小空态紧凑 | ✅ |
| 🔧中 | **🌌 背景粒子升级 40 颗** | 内联粒子脚本 `N` 由 30 改 40 | ✅ |

---
*最后更新：2026-08-08 · 第十一阶段（动效精修）完成，node check 语法通过 + playwright e2e 16项全部通过(含 tab 切换/指示器跟随/主题/粒子数/零JS错误)*

---

## ✅ 第十二阶段新增（本轮完成）

| 优先级 | 模块 | 实现 | 完成 |
|--------|------|------|------|
| 🎯高 | **💧 按钮涟漪水波纹（Material Design）** | `.ripple-js` 类标记可涟漪元素；全局 `pointerdown` 委托捕获点击坐标，在按钮内生成 `.ripple-ink` 圆（CSS 动画缩放扩散淡出 0.6s 后自删）；无 pointerdown 的旧浏览器用 mousedown 兼容；改 `.theme-toggle`/`.tab-btn`/`.btn-gold`/`.btn-ghost`/`.btn-outline` 等已加 ripple-js | ✅ |
| 🎯高 | **🔢 数字跳动（滚动计数 + 弹跳缩放）** | 数字元素加 `.num-count`；`setInterval(500ms)` 轮询比对 `parseNum()` 旧值，明显变化(>0.15)走 `rollCount()` 有界滚数（16 步×26ms≈416ms，`raw.replace(EXP_NUM, 计数值)`保留 ¥/% 前后缀，完成后 `.num-bounce` 上下弹跳缩放）；小变化直接弹跳；**无重入**设计（不用 MutationObserver + rAF，避免写入回环导致渲染器崩溃） | ✅ |
| 🎯高 | **👈 左滑删除（手机端）** | 记账 `#txList` 每条包 `.swipe-wrap`(overflow:hidden) > `.swipe-zone` + `.swipe-delete`；触屏设备(`isTouch`)启用：`touchstart/move` 采集 dx，左滑(<0) `open` 露红色删除背景，点删除走 `delTx(id)`；手机宽显示 `#swipeHint` 提示 | ✅ |
| 🎯高 | **⬇️ 下拉刷新（记账页）** | `#tab-book` 顶部 `.ptr-indicator`；触屏 `touchstart/move/end` 在顶部下拉 >10px 展开指示器、>60px 提示「释放刷新」、松手显示 spinner → `renderAll()` 重渲染 → `.ptr-toast`(fixed 底部 Toast)「✅ 已刷新」1.4s 淡出 | ✅ |
| 🎯高 | **🩻 图表骨架屏（400ms 后淡出）** | `skeletonInto(container, renderFn)` 往 `#monthChart` 注入 `.chart-skeleton`（12 根脉冲柱 6 组），400ms 后 `.fade-out` 淡出，再 `renderChart()` 渲染真实图；接管 `window.switchTab` 首次进 data Tab 触发一次；挂 `window._skeletonInto/_rollNum/_animateNum` 供 e2e | ✅ |

---
*最后更新：2026-08-08 · 第十二阶段（交互动效）完成，node check 语法通过 + playwright e2e 13项全部通过(含涟漪/数字弹跳/左滑结构/下拉指示&Toast/骨架屏/零JS错误)*

---

## ✅ 第十三阶段新增（本轮完成）

| 优先级 | 模块 | 实现 | 完成 |
|--------|------|------|------|
| 🎯高 | **🎴 卡片 3D 倾斜 + 动态高光** | 攒钱Tab目标卡 `.hero` 外包 `.tilt-wrap`(perspective:900px)，自身加 `.tilt-card`(transform-style:preserve-3d)；`mousemove` 按光标相对卡片坐标算 `rotateX/rotateY`(±8°，rAF)，`mouseleave` 归零；`pointer:fine`(matchMedia) 仅鼠标设备启用，触屏不干扰；`mousemove` 稳定触发 `.tilting` 类 → `tiltShine` 高光 `::after` 径向光从左下扫到右上（260ms 防抖避免闪烁） | ✅ |
| 🎯高 | **📅 月份 3D 翻页动画** | 包装全局 `switchMonth`(shiftMonth 箭头最终都走它，故左右切换均触发)：切换前给 `#monthLabel` 加 `.flip` → `monthFlip` keyframes(`rotateX(0→90deg)` 半透明中间转逆→`-90→0`，0.45s)，完成后移除类；`#monthLabel` 加 `perspective`/`transform-style:preserve-3d` 保证 Y 轴立体感 | ✅ |
| 🎯高 | **📊 统计卡立体悬浮** | `.stat-grid{perspective:700px}` + `.stat{transform-style:preserve-3d;transition:transform .25s}`；`.stat:hover{transform:translateZ(20px)}` + 金色描边 + 阴影提升，视觉层级高于其他卡片；纯 CSS 实现无需 JS | ✅ |

---
*最后更新：2026-08-08 · 第十三阶段（3D 交互动效）完成，node check 语法通过 + 内联 3D 脚本语法通过 + 服务 200(含卡片倾斜/月份翻页/统计悬浮/零JS错误)；已备份 `*.bak_3d` 可回滚*

---

## ✅ 第十四阶段新增（本轮完成）

| 优先级 | 模块 | 实现 | 完成 |
|--------|------|------|------|
| 🎯高 | **🎆 达标烟花特效（升级）** | 既有 `celebrateGoal()` 达标触发保留（`renderAll` 中 `total>0 && paid>=total && __fwLast<total` 峰值触发一次，`__fwLast` 存于 window）。本轮升级：`_fwBurst` 单发粒子数由固定 46 提升至 **70-120/发**（`70 + rand*51`），连发轮数由 4 轮提升至 **10 发连放**（260ms→220ms 间隔） | ✅ |
| 🎯高 | **🎉 达标祝贺浮层** | 新增 `#congratsToast`（.congrats-badge「🎉 目标达成！」+ .congrats-sub「净资产已达标，继续加油 🚀」）。新 `showCongrats()`：先 `remove('show')` + `void el.offsetWidth` 强制回流重启动画，再 `add('show')`，4.2s 后自动隐藏；由 `celebrateGoal()` 末尾调用。浮层 fixed 居中（top 18%），金色脉冲动画 `congratsPulse`，`visibility`+`opacity` 过渡；CSS 用 `visibility:hidden` 初始隐藏（**不用内联 hidden 属性**，避免与 class 控制冲突） | ✅ |
| 🎯高 | **🔒 达标判定用净资产** | 沿用 `goalPaid()=netAssets()=总资产-总负债`，且 `totalAssets()` 仅统计 `db.assets` 资产表（**不统计 `tx` 收入记录**），测试预置资产需放 `db.assets`（含 `cur` 币种字段）才能触发达标 | ✅ |

---
*最后更新：2026-08-08 · 第十四阶段（达标庆祝特效）完成，node check 语法通过 + playwright e2e 10项全部通过(含达标触发/祝贺浮层/粒子70-120/连发调度/自动隐藏/零JS错误)；已备份 `*.bak_14` 可回滚*

## ✅ 第十五阶段新增（本轮完成）

| 优先级 | 模块 | 实现 | 完成 |
|--------|------|------|------|
| 🎯高 | **🔔 Toast 通知系统** | 右上角滑入弹窗：`#toastStack` 容器 + `.toast`(`.success`绿/`.error`红/`.info`蓝)，2.5s 自动消失、多 Toast 堆叠、超5条移除最旧；`toastShow(text,type,dur)`/`toastSuccess/Error/Info` 全局挂 window，老浏览器无容器时 `alert` 兑底；**将全项目 30 处原生 `alert()` 全部升级为 Toast**（校验错误→红、成功→绿、中性→蓝） | ✅ |
| 🎯高 | **🚨 预算警报 Banner（主动化）** | 消费预算卡内新增 `#budgetBanner`(.warn黄/`.over`红双态 + `bannerPop`动画+关闭✕+「查看账单」`goBudget`跳data Tab)；`__budgetState()` 由 db.budget 与 monthExpense 精算：超支over红/≥80%warn黄/正常不显示；`syncBudgetAlert()` 在 `save()` 内 renderAll 后主动刷新 banner，预警**新出现/复发时自动弹 Toast 提醒一次并存 `seen` 标记**（手动关闭后不反复轰炸）；`closeBudgetBanner()` 关闭 | ✅ |

---
*最后更新：2026-08-08 · 第十五阶段（Toast 通知 + 预算警报 Banner）完成，node check 语法通过 + playwright e2e 19项全部通过（含Toast渲染/自动消失/堆叠/错误类/banner warn/over双态/主动提醒/关闭seen/无预算不显示/零JS错误）；已备份 `*.bak_15_done` 可回滚*

## ✅ 第十六阶段新增（本轮完成）

| 优先级 | 模块 | 实现 | 完成 |
|--------|------|------|------|
| 🎯高 | **📱 manifest.json（应用配置）** | 新建 `manifest.json`：`name/short_name/start_url(./index.html)/scope/display(standalone)/theme_color(#d4af37)/bg(深色)/orientation(portrait)/lang(zh-CN)/categories`；内嵌 data-URI **SVG 图标**（任意/maskable 两个 purpose，512/192 尺寸）零二进制文件依赖；`shortcuts` 快捷方式（记账户/数据页 `?tab=book|data`）。`index.html` `<head>` 加 `<link rel="manifest">` + `mobile-web-app-capable`/`apple-mobile-web-app-*`/`theme-color` 各 meta 兼容 iOS | ✅ |
| 🎯高 | **💾 sw.js（Service Worker 离线缓存）** | 新建 `sw.js`：预缓存静态壳（`./ index.html app.js manifest.json`，Promise.allSettled 单文件失败不阻塞安装）+ `skipWaiting`/`clients.claim`（激活立即接管）；清理旧 CACHE 版本；fetch 策略——**仅同源**、导航 navigate 用 **Network-first→cache 兜底→index**（离线可开壳）、静态资源(.html/js/css/json/svg...) Network-first 带 cache 落盘 | ✅ |
| 🎯高 | **🔌 注册 Service Worker + 离线状态提示** | `app.js` 末尾 PWA IIFE：仅 HTTPS/localhost 注册 `./sw.js`，成功置 `window.__pwaSWReady`；`load` 后注册；**离线浮标** `#netBadge`（左上角红dot胶囊，默认 hidden，`online`/`offline` 事件切 `.show` + Toast「📴已进入离线/📶已恢复联网」）；初始即离线也显示；`window.__setOnline(true/false)` 供 e2e/手动 | ✅ |
| 🎯高 | **🔔 系统通知（预算超支/目标达成）** | `notify()` 优先 `sw.controller.postMessage({type:'NOTIFY'})`（sw 内 `showNotification` 处理，点击 `notificationclick` 聚焦/打开并携 `?tab=` 直达），无 SW 退化为页内 Toast；`ensureNotifPerm()` 惰性请求权限；**预算超支** `_notifyBudgetTransient` 用 `db.budget|pct` 去重（同预算同比例只提醒一次）；**目标达成** `_notifyGoalIfPaid` 达标瞬间 `__goalNotified` 同会话只提一次（暴露 `__goalNotifiedState()/__resetGoalNotified()` 供重置）；以上经 `syncBudgetAlert`/`renderAll` 包装挂接保存流程 | ✅ |
| 🎯高 | **📲 安装引导（添加到桌面提示）** | 监听 `beforeinstallprompt` 阻止默认并缓存 `deferredPrompt`，显示 `#installBar` 顶部毛玻璃横幅（「📲将我的财库添加到桌面？」+ `添加/暂不`）；`__installNow()` 调 `deferredPrompt.prompt()` 用浏览器原生 A2HS，成败 Toast；`__installDismiss()` 隐藏并 `localStorage.wealth_inst_dismiss` 记忽略（2天不打扰）；已独立窗口(`display-mode:standalone`/`navigator.standalone`)不打扰；新 `install-bar` CSS（顶栏滑入动画） | ✅ |

---
*最后更新：2026-08-08 · 第十六阶段（PWA 应用化）完成，node check 语法通过 + playwright e2e16 14项 14/14 全通过(manifest字段/SW注册active/pwaReady/离线浮标/安装引导/预算&目标通知钩子与节流/零JS错误)；回归 e2e15 19/19 不受影响；sw.js 实际注册为 active*；已备份 `*.bak_16` 可回滚*

## ✅ 第十七阶段新增（本轮完成）

| 优先级 | 模块 | 实现 | 完成 |
|--------|------|------|------|
| 🎯高 | **🎯 目标名称去硬编码 + 按年/按月双维度** | ①目标名不再预填「Mac Mini M4」：`db.goal.name` 默认空、输入框空+占位符「目标名称 (可选)」；展示区空名时显示占位「🎯 未设置目标」；②meta 由 3 项扩为 **4 项**：还差 / **按年**(`#goalYears`，months/12 拆成年+月) / **按月**(`#goalMonths`，保留 N.N 个月) / 预计日期；`renderAll` 中 months>0 时按 `Math.floor(months/12)`+`Math.round(months%12)` 拆分，无收入/未达标/无数据统一友好文案 | ✅ |

---
*最后更新：2026-08-08 · 第十七阶段（目标去硬编码+按月按年双维度）完成，node check 语法通过 + playwright e2e 13项全部通过（含占位显示/去硬编码/输入框空/设置目标/4项meta/年-月拆分/零JS错误）；已备份 `*.bak_17` 可回滚*

## （技术要点备忘补充）第十七阶段注意事项
- 目标 meta 现为 4 项，`.hero .meta` 有 `flex-wrap:wrap` 已兼容移动端换行；`goalYears`/`goalMonths`/`goalDate` 均为**文本型**（含中文「年/个月」骨架），**不要**加入第十二阶段 `_numEls` 数字滚动清单（`parseNum`/`rollCount` 只处理纯数字，会把「4个月」的 `4` 误滚成乱码）——`goalYears` 仅作普通 textContent 写入即可。
- 目标名空时 `renderAll` 顶部写 `'🎯 未设置目标'` 占位（用 `(db.goal.name||'').trim()` 判空），不影响 `setGoal`（`if(name)` 才写库，留空则沿用旧值/空名）。
- 按年拆分逻辑：`months>0` 时 `yrs=floor(months/12)`、`remMonths=round(months%12)`，`yrs>0` 输出「N年」+「M个月」、`yrs==0` 输出「M个月」、`yrs>0&&rem==0` 输出「N年」；无收入/未达标/无数据时 `goalYears` 与 `goalMonths` 同显「先记收入」/「—」/「已达标」。

## 近一轮开发记录

### 第十七阶段 · 目标去硬编码 + 按月按年双维度（2026-08-08，1 项任务结束）
- **改动**：① `index.html` 两处 `value="Mac Mini M4"`(展示名 & 输入框) → 展示名占位「🎯 未设置目标」、输入框空+「目标名称 (可选)」；② `app.js` `db.goal.name` 默认 `''`；③ 目标卡 meta 增「按年」`#goalYears`(months/12 拆年+月)、「按月」`#goalMonths`(保留)；④ `renderAll` 拆分/兜底文案。
- **验证**：`node --check app.js` OK；playwright e2e 13 项全过（占位、无硬编码、输入框空、设置目标名、4 项 meta、年/月拆分「4个月 vs 4.0 个月」、预置资产回归），零 JS 错误。
- 注意：`goalYears` 未加入 `_numEls` 数字滚动（中文文本不被数字滚动处理，避免误滚）。


- **Service Worker 注册条件**：SW 仅在 `https:` 或 `localhost/127.` 可用（浏览安全策略）；纯 http 局域网 IP 下 `navigator.serviceWorker` 存在但 `register` 会 reject，必须 `try/catch` 静默兜底——PWA IIFE 开头已按协议+hostname 提前 return，避免非 localhost 环境报错。
- **manifest 图标**：用 data-URI SVG（`data:image/svg+xml;utf8,<编码>`）零二进制依赖，但 **SVG 内 `#` 和 emoji 必须 URL-encode**（`%23` 替代 `#`、emoji 直接 UTF-8）；`purpose` 分两份（any）+`maskable` 保证手机自适应圆角/安全区裁切；`start_url` 用 `./index.html` + `scope:"./"` 限定应用范围。
- **sw.js fetch 策略**：只处理 `method==='GET'` 且 `origin===self.location.origin`（跨域一律不缓存、不拦截，避免污染外部抓取）；导航请求（`req.mode==='navigate'`）Network-first → cache 兜底 → `./index.html` 三连兜底保证离线能开壳；静态资源路径须匹配扩展名正则才走缓存落盘。
- **系统通知**：`notify()` 依赖 `sw.controller` 才 postMessage（SW 激活前降级 Toast）；需先 `Notification.requestPermission()` 得 granted；`notificationclick` 里用 `clients.matchAll({type:'window'})` 聚焦已有窗或 `openWindow(url)` 新建并带 `?tab=` 直达对应页。
- **安装引导**：`beforeinstallprompt` 需 `e.preventDefault()` + 缓存放 `deferredPrompt`；`deferredPrompt.prompt()` 只能调一次（调后置 null）；已安装态用 `matchMedia('(display-mode: standalone)')` 或 iOS `navigator.standalone` 判定，不打扰。
- **节流标记**：预算 `__budgetNotifLast`（`db.budget|pct` 键对同预算同比例去重）与目标 `__goalNotified`（同会话只提醒一次）都是**闭包私有 var**，外部访问需经 `window.__goalNotifiedState()/__resetGoalNotified()` 暴露工具（e2e 可重置复验）。

## （技术要点备忘补充）第十五阶段注意事项
- **Toast 引擎**：`toastShow` 内 `void el.offsetWidth` 强制回流后 `add('show')` 触发滑入动画；`__toastTimer` 在 dur 后 `remove('show')`+`add('hide')` 再 380ms 后 `removeChild` 自清理；`#toastStack` 最多保留 5 条（超出移除最旧）。所有 onXxx/toastXxx 挂 window。**老浏览器无 `#toastStack` 时用 `try{alert()}catch{}` 兑底**避免空白提示。
- **预算 Banner**：`__budgetState()` **直接读内存 db.budget 与 monthExpense() 精算**，不要解析 `#budgetWarn` 的 DOM 文本（它有绿色“预算内✅”状态，误判会导致不该提醒时触发）；banner 默认 `display:none`、`.show` 才 `display:flex`；预警新出现/复发（未 seen）才弹 Toast 并置 `seen`，`closeBudgetBanner` 或「查看账单」后不再反复弹；`syncBudgetAlert` 挂到 `save()` 末尾（renderAll 之后）保证每次改数据都主动刷新。

## 🔧 技术要点备忘
- **第十四阶段（达标庆祝特效）注意事项**：达标烟花/浮层触发在 `renderAll()` 顶部——`netAssets()=totalAssets()-totalDebts()`，且 **`totalAssets()` 只统计 `db.assets` 资产表、不统计 `tx` 收入记录**（e2e 预置达标数据必须把资产放 `db.assets` 数组并带 `cur` 币种字段 `{cur:'CNY',amt}`，光是往 tx 加收入 wont 触发——净资产仍为 0）。达标峰值判断用 `window.__fwLast`：`__fwLast<total` 时触发一次再置为 total，避免每次都重复庆祝（达标后再次增长不会重触发，需重设目标才重置）。烟花引擎全局私有变量 `__fw*`（Cv/Ctx/Ps/Raf/Running/Timer）是 `var` 声明会挂到 window，`_fwBurst`/`celebrateGoal` e2e 可直接调用；测单发粒子数**必须先清空 `__fwPs=[]` 再测**，否则会被此前自动触发的 10 连发累积粒子污染读数。祝贺浮层 `#congratsToast` **不可用内联 `hidden` 属性初始隐藏**（会永久禁用 class 控制，show 也显示不出来），应纯 CSS `.congrats-toast{opacity:0;visibility:hidden}` 初始态 + `.show{opacity:1;visibility:visible}`；`showCongrats()` 需 `remove('show')` + `void el.offsetWidth` 强制回流重启动画，再做 `add('show')`，否则连续达标时第二次不复播；4.2s `setTimeout` 自动隐藏（记 `__congratsTimer` 防止叠堆）。`congratsPulse` 新 keyframes 与其他动效命名不冲突。测试在桌面宽(900+)+鼠标 `pointer:fine` 环境验证卡片倾斜回归，手机宽不影响烟花/浮层（fixed 相对视口居中）。
- **第十三阶段（3D 交互动效）注意事项**：卡片倾斜必须外包 `.tilt-wrap`(perspective)——不设 perspective 则 `rotateX/rotateY` 无立体感；`.tilt-card` 需 `transform-style:preserve-3d` 保立体、`overflow` 留给内部（`.hero` 本有 `overflow:hidden`，高光 `::after` 可留在 hero 内）；倾斜仅用 `matchMedia('(pointer:fine)')` 启用，触屏不干扰，mousemove 用 rAF 节流 + 260ms 防抖避免高光闪烁。月份翻页包装的是全局 `switchMonth`（`shiftMonth` 箭头最终都走 `switchMonth`）所以左右都触发；`#monthLabel` 做翻转需自身 `perspective`+`preserve-3d`，`.flip` 类在动画结束 `remove` 以便下次重触发。统计悬浮纯 CSS——`.stat-grid` 设 `perspective`、`.stat` 设 `transform-style:preserve-3d` + `transition:transform`，hover 改 `translateZ(20px)` 即可，无 overflow 约束（不会裁掉浮现）。**新 keyframes 命名(tiltShine/monthFlip)需与既有动效不冲突**，两处 CSS 3D 均用 inline style 由 JS 写入，脚本要独立 IIFE 不被既有逻辑污染。
- 渲染统一走 `renderAll()`，改数据后调 `save()`（内部自动调 renderAll）
- 分类 emoji 映射在多处重复硬编码（`renderCatRanking`/`renderTopSpending`/`renderDonut`），增强自定义时应**抽成共享 map**
- 目标进度用**净资产**（`netAssets() = 总资产-总负债`）衡量
- 固定收入计入 `monthIncome()` 时直接全量 `reduce`，做开关需过滤生效月份
- 所有 onXxx 函数需挂到 `window` 上（index.html 用 onclick 引用）
- CSS 变量在 `:root`（--gold/--green/--red 等），新增组件沿用统一风格
- 移动端适配：`max-width:600px` 有专属媒体查询，注意保持兼容

- **多格式导出注意事项**：`_triggerDownload` 需加 `\ufeff`(BOM) 否则 Excel/WPS 打开中文乱码；`.xls` 实际是 HTML 表格伪装的 Excel 格式（OpenXML 需结合库更复杂，纯静态零依赖下此为兼容方案）；CSV 用 `\r\n` 换行 + 逗号/引号/换行转义应走 `_csvEsc()`

- **PIN 隐私锁注意事项**：锁屏浮层 `#pinLock` **不可用内联 `display:none`** 初始隐藏（内联样式优先级高于外部 `#pinLock.show{display:flex}`，会导致 `.show` 类失效锁屏显示不出来），应改为纯 CSS 类控制隐藏/显示；PIN 用加盐 FNV-1a hash 存独立 key `wealth_pin`（非明文、不混入 db 主数据避免迁移问题），锁开关状态存 `wealth_pin_on`；openPinSetup 里改 PIN 需先验原 PIN；锁屏 z-index 需高于粒子动画(90)与所有 overlay(999)，用 2000 最稳妥

- **数据仪表盘注意事项**：`monthLabel()` 是**直接操作 `#monthLabel` DOM 不返回值**的函数，别把它当返回值用（否则拿到 undefined）；仪表盘月份标签应直接从 `curMonth` 解析叠加；分类排行/最近流水复用 `getCatIcon()`/`escapeHtml()`；预算进度条 fill 的 class 动态切成 `warn`(≥80%)/`over`(超支) 上色；最近流水排序用 `b.date.localeCompare(a.date)` 加 `ts` 兜底（同日内按时间戳）；仪表盘仅只读展示，复用 `monthStat`/`totalAssets`/`netAssets` 等现有统计，不新增数据源

- **第九阶段（快捷模板/周期支出/负债估算器）注意事项**：快捷模板内置默认用 `q-` 前缀 id、用户自定义用 `c`+uid，`quickTplList()` 合并时若用户自定义了与内置相同 id 的项会用自定义覆盖内置（删除内置模板也可用同名覆盖实现）；`quickAdd()` 统一写账（note 默认取 name，cat 缺省 '其他'，ic 用 getCatIcon 兜底）；周期支出**防重复生成是核心**——用 `db._recurGenYm` 记录已生成年月，`processRecurring()` 必须在 `renderAll` 最开头调用（在统计/达标判断前，否则当月消费/储蓄率会漏算周期账单），且只有 `todayDay>=r.day` 才补生成（未到扣款日的不做），已生成的项置 `lastGen=本月` 双重防重；迁移时 `migrateData()` 需把 `quickTpl`/`recurring` 纳入数组兜底、补 `_recurGenYm` 空串；负债估算器完全复用 `debtPayoffMonths()`（传 `{amt,rate,monthPay}` 构造临时对象）不新写算法，只在 `Infinity`/空值时加文案；所有新 onXxx 函数需挂 window（onclick 引用）——本版本函数均已设为顶层可全局访问

- **第十阶段（明/暗主题切换）注意事项**：默认深色，`body` **无 `data-theme` 属性即深色**（深色是默认态），浅色才设 `body[data-theme='light']`——判断/调试时别以为必须有属性才深色；`applyTheme(theme)` 只设/移除 `data-theme` 属性，图标逻辑是「浅色主题显示 🌙、深色显示 ☀️」（图标表达*将切往*或*当前色标*需按此约定，别写反）；主题偏好存 **`localStorage` key `wealth_theme`**（`'light'`|`'dark'`|空串=跟随系统），与 PIN 的 `wealth_pin` 并列独立 key、不混入 db 主数据；`resolveTheme()` 优先级=手动偏好>系统 `prefers-color-scheme`（matchMedia，未设置时跟随系统）；顶部按钮 `#themeToggle` onclick 走 `window.toggleTheme`，循环逻辑取 `resolveTheme()` 当前值再翻转，翻转后立即写 localStorage 固化为显式偏好；`matchMedia` 监听 `change` 仅在用户**未手动指定**偏好时自动跟随系统；DOM 就绪后 init 调 `applyTheme(resolveTheme())`；浅色变量在 `:root` 深色之后用 `body[data-theme='light']{...}` 覆盖（背景 `--bg-body` 为多层 radial+linear 渐变，`getComputedStyle` 会把颜色标准化成 `rgb()` 形式、不会保留 `#f7f9fd` 十六进制字面量，e2e 断言背景色**务必用 rgb() 形式匹配**而不要匹配十六进制串）；`applyTheme`/`resolveTheme`/`toggleTheme` 均已挂 window 供调用；所有 onXxx 函数需挂 window（onclick 引用）

- **第十一阶段（动效精修）注意事项**：导航指示器 `#tabSlider` 绝对定位于 `.tabbar`（fixed 即为其定位上下文），位置用 `getBoundingClientRect` 相对 tabbar 算 left/width，加 `transition:left/width` 平滑，`switchTab` 后调用 + init 后 `requestAnimationFrame` 首帧 + `resize` 监听（否则首次加载/布局后滑块错位）；鼠标柔光 `#mouseGlow` 用 `matchMedia('(pointer:fine)')` 只启用鼠标设备（触屏不显示），`mousemove`+rAF 设 left/top 配合 CSS `.12s` transition 形成丝滑跟随，悬浮可交互元素用 `t.closest('button,a,input,select,.item,.quick-btn')` 决定透明度(0.5↔0.9)；统计卡呼吸光条 `.stat::before` 用 `--stat-accent` 变量 + `.stat:nth-child(n)` 错峰 delay（绿红金三色）；账本 stagger 通过渲染时给每个 `.item` 内联 `animation-delay:min(idx*30,240)ms`（`.item` 已有 `itemIn` 入场动画），但注意 income 列表 `.item` 已有内联 style 表达停用 opacity，需在同个 style 里拼接 delay 用 `;` 分隔，**别覆盖原 style**；模态框 3D 入场依赖 `.overlay` 设 `perspective:900px`（不设则 rotateX 无立体感），`.modal` 的 `animation` 用 `... 3D 变换 ... both` 保留末态；目标尖端闪烁 `.progress .bar::before` 与既有 shimmer `::after` 不冲突（一个伪元素一个）；空状态 `.empty::before` 放大图标会让仪表盘小空态(`.dash-cats/.dash-recent .empty`)过大，需单独 `content:none` 压掉；所有新增 CSS keyframes(heroPulse/tipPulse/statBreathe/itemIn/emojiBounce/modalIn3d/emptyFloat/brandFlow)与既有命名不冲突者随意复用

- **第十二阶段（交互动效）注意事项**：按钮涟漪 `spawnRipple()` 用全局 `pointerdown` 委托（`closest('.ripple-js')`）而不是逐个绑定，`.ripple-ink` 尺寸取 `max(rect.w,rect.h)` 圆形、CSS `rippleOut` 0.6s 后 JS `removeChild` 自清理（`position` 需非 static 否则圆定位错乱，`.tab-btn`/`.btn-gold` 等已是 relative）。**数字跳动是坑最多的模块**：滚动计数**绝不能**用 `MutationObserver` + rAF 逐帧写 `textContent`——写入会再次触发 observer → 重入 countUp → 多个数字元素并发互相重触发 → 主线程饱和 → 无头浏览器 evaluate 时渲染器崩溃(报「Target page, context or browser has been closed」)；必须改成「无重入轮询」：`setInterval(500ms)` 读各数字 `parseNum()` 比对旧值（存 `_lastNumVal`），变化走 `rollCount()` 有界 16 步定时间隔(26ms)滚数、完成后 `applyBounce()` 加 `.num-bounce`，且不 observe 自己写入故无回环；`parseNum()` 用正则只留数字去 `¥,` 等前后缀，`rollCount` 用 `raw.replace(EXP_NUM=/[\d.,]+/, 计数值)` 保留前后缀/百分号。左滑删除 `initSwipeDelete()` 仅 `isTouch()`(matchMedia pointer:coarse 或 ontouchstart) 启用（桌面不生效），结构 `.swipe-wrap(overflow:hidden)`>`.swipe-zone`(+`transition:transform`，open 时 `translateX(-64px)` 露红底)+`.swipe-delete(data-id)`，`touchmove` 算 dx<0 设 open、`.swipe-delete` 点击 `closest` 取 data-id 调 `delTx`；`#swipeHint` 默认 `display:none`，须 `@media(max-width:600px)` 内 `.show{display:block}` 才显（e2e 断言提示显示检查 class `show` + `getComputedStyle.display==='block'`，**别用 `offsetWidth>0`​**——该元素 getBoundingClientRect/offsetWidth 可能为 0）。下拉刷新 `initPullRefresh()` 也仅触屏（`tab-book` 上 touch 系列 + `passive:false` 才可 preventDefault），页面顶部(`scrollY<=0` && `book.scrollTop<=0`)才触发，>60px 释放执行 `renderAll()`+`#ptrToast`(fixed bottom Toast 显示/1.4s 隐藏)；`.ptr-toast` z-index 需高(9999)且 pointer-events:none。骨架屏 `skeletonInto()` 往 `#monthChart` 注入 `.chart-skeleton` 12 根 `.sk-bar`(6组双柱)，`data-skeleton='1'` 防重复包裹，400ms 后 `.fade-out`+420ms 后 `container.innerHTML=origHTML` 再 `renderChart()`；接管 `window.switchTab` 首次进 data Tab 触发一次（保留 `origSwitch` 调用避免破坏 tab 逻辑）；所有辅助函数 `_skeletonInto/_rollNum/_animateNum/_ptrToast` 挂 window 供 e2e。

---
*最后更新：2026-08-08 · 第十二阶段（交互动效）完成，node check + playwright e2e 13项全部通过，无JS运行时错误；由 AI 助手维护，作为项目永久记忆锚点*
