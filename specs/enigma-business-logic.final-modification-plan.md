# Enigma Business Logic — Final Modification Plan (Optimized)

## 0. 文档目的

本文件是基于 `specs/enigma-business-logic.results.md`（36 项测试，6 PASS / 30 FAIL）以及对 `services/enigma-api/` 与 `apps/enigma-frontend/` 全量代码审阅后，对 `specs/enigma-business-logic.modification-plan.md` 的**重写与增强**。

它在以下方面优于原方案：

1. 修复原方案漏掉的真实代码缺陷（dict key 覆盖、stale closure、`onClick` 与拖拽冲突、回调类型错误、`renderLines` 缺过滤等）。
2. 给出每个 FAIL 测试到具体代码改动的**双向追溯表**，确保 30 个 FAIL 全部有对应修复。
3. 给出**可勾选 TODO List**，按从根因到表象的顺序排列，避免重复返工。
4. 明确 ring setting 与 `at_notch` 的精确数学定义、明确双步进的时序。
5. 显式列出对 Playwright 断言的可控调整范围，避免"为了过测试而过测试"。

---

## 1. 目标行为锚定（不可变事实）

- 机型：Enigma I / M3，三转子。
- UI 槽位顺序：`rotors[0]=left/slow`、`rotors[1]=middle`、`rotors[2]=right/fast`。
- 转子推进发生在**字符加密之前**。
- 信号路径：plugboard → 右→中→左 → reflector → 左→中→右 → plugboard。
- 双步进：在按键推进时，如果 middle 处于 notch，则 left 与 middle 同时推进；right 始终推进。
- Plugboard：物理电缆，配对在引擎内是对称的，UI/前端状态只存一份。
- Ring setting (Ringstellung)：与可见 position 解耦的独立设置，参与字符位移与 notch 检测。

## 2. Phase2 结果分组（结合代码实证）

| 组 | FAIL 用例 | 表象 | 根因（精确） |
|---|---|---|---|
| G1 前端配置校验缺失 | 1.3 | 按键前未选齐 rotor，输入仍被写入，弹出"加密过程出错" | `EnigmaSimulator.handleKeyPress` 先 `setInputText` 再调 API；API 因解析 `ROTOR_NOTCH[""]` 抛 KeyError 被通用 except 转 500 |
| G2 加密结果反向 | 2.1, 2.2, 2.3, 4.1–4.5, 6.1, 6.3, 6.4, 7.1, 8.1, 8.2, 9.3 | 选 I-II-III 得到的实际上是 III-II-I 的结果 | `EnigmaMachine.encrypt_letter` 前向用 `for rotor in self.rotors`（左→右）、反向用 `reversed`，正好反了；且 `step_rotors` 始终 `left.rotate()` 同时检测错位的 notch |
| G3 步进/双步进错 | 3.1–3.4 | 最右 rotor 不步进；middle/left 步进条件错 | 同上 `step_rotors` 实现错误 |
| G4 Plugboard UI/状态错 | 5.1–5.6, 6.2, 7.2 | 空板已 1 条线；A-M 配对未生效；连点冲突 | 初始 `plugPairs=[{from:'',to:''}]` 渲染零长度 line；`onClick=removePair` 与 `onPointerUp` 同时触发；`usedLetters` 独立 state 与 `plugPairs` 失同步；前端额外塞入反向对，与后端 `Plugboard` 双向写入语义重复 |
| G5 Ring setting 缺失 | 10.1, 10.2 | 没有 ring setting 控件 | schema/模型/路由/UI 均未实现 |
| G6 显示错误 | 8.2（次要） | rotor 窗口显示 `EKMF...:B` | `EnigmaSimulator.tsx:161` 渲染 `rotor.wiring`，应为 `rotor.index` |

> 注：6.1/6.3/6.4 的失败"看似"是 reset/连点问题，但 Observed output 与 Phase1 oracle 的对应是 `selectedRotors` 顺序颠倒后的结果——一旦 G2/G3 修复，这三项自然过。但 6.4 还需要**额外**修复 stale closure。

## 3. 原方案的盲点（必须补救）

原 `modification-plan.md` 已经定位到 6 个修复点，但以下问题未提及或描述不准确，本方案显式纳入：

| # | 原方案缺失 | 实际代码位置 | 影响 |
|---|---|---|---|
| B1 | `forward_result` / `backward_result` 是 `dict[str,str]`，以**输入字符**作 key 经 3 个 rotor 会发生 key 覆盖，丢失中间步 | `services/enigma-api/app/core/machine.py:83,90` 与 `schemas.py:23-24` | 可视化数据失真；应改为 `List[{from,to}]` 或按 stage 标号 |
| B2 | `EnigmaSimulator.handleKeyPress` 通过 `selectedRotors` 闭包访问的是渲染时的快照；连续点击多次时，第二次仍发出与第一次相同的 position | `EnigmaSimulator.tsx:60-95` | 6.4 即使核心修复后也会偶发；必须改成 `isEncrypting` 锁 **或** 用 ref 同步最新 positions |
| B3 | `RotorSelector` 回调签名 `onRotorChange: (index: number, wiring: string)` 名实不符，传入的是 `index` 字符串而非 `wiring` | `RotorSelector.tsx:21` | 类型欺骗，重构 ring setting 时易出 bug |
| B4 | `PlugboardConfig` 每个格子同时绑定 `onPointerUp` 和 `onClick={removePair(ch)}`，拖拽落点会同时触发删除 | `PlugboardConfig.tsx:165-168` | 5.5 移除语义混乱；正确解法：仅在 `pointerDown→pointerUp` 同字母且未发生 move 时视为 click |
| B5 | `PlugboardConfig.renderLines` 未先过滤 `from`/`to` 为空的 pair，导致初始 1 条线 | `PlugboardConfig.tsx:114-128` | 5.1/5.4 等基础线计数全错 |
| B6 | `usedLetters` 是独立 state，未由 `plugPairs` 派生；父组件 reset 时不更新 | `PlugboardConfig.tsx:24` | 反向重置时残留 used，新增 pair 失败 |
| B7 | `api.ts` 中 `EncryptRequest.rotors: Rotor[]` 与实际发送的 `RotorSelection[]` 不一致；`EncryptResponse.forwardResult` 用 tuple 数组与后端 dict 不符 | `services/api.ts:26-39` | 类型谎言，掩盖 B1 |
| B8 | API 路由用 `except Exception` 把 KeyError、IndexError 等域错误统一变 500 | `routes/enigma.py:47-49` | 1.3 看到的通用错误正是这条；应用 Pydantic 校验 + HTTPException(422) |
| B9 | API 信任前端传入的 `wiring` 字符串，前端可传任意 26 字串绕开 constants | `routes/enigma.py:27` + `schemas.py:8` | 安全/正确性问题；改为只接受 `index`，wiring 由后端查 `ROTOR_WIRINGS` |
| B10 | 原方案给出的 `step_rotors` 替代代码未明确"先读后写"以避免 mutate-then-check 错误 | `machine.py:61-70` | 实现时易写错；本方案给出确定可运行的实现 |
| B11 | ring setting 下 `at_notch()` 应基于**未减去 ring 的物理位置**，而 substitute 时位移用 `position − ring`；原方案未明示 | 待实现 | 10.2 与历史参考输出一致性 |
| B12 | `handleReset` 仅重置 position，不重置 input/output 中的 active state；plugboard 与 rotor 选择保留，但当前实现把 plugPairs 留为 `[{from:'',to:''}]` 这种"哨兵"导致渲染线问题 | `EnigmaSimulator.tsx:19,118-126` | 与 G4 联动 |

## 4. 加密核心的精确实现（替换 `machine.py`）

```python
ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"

def _idx(c: str) -> int:
    return ord(c) - ord("A")

def _chr(i: int) -> str:
    return chr((i % 26) + ord("A"))


class Rotor:
    def __init__(self, wiring: str, notch: str, position: str = "A", ring_setting: str = "A"):
        self.wiring = wiring
        self.reverse_wiring = self._build_reverse(wiring)
        self.notch = notch
        self.position = position           # 可见窗口字符
        self.ring_setting = ring_setting   # Ringstellung
    # ...
    def _offset(self) -> int:
        return (_idx(self.position) - _idx(self.ring_setting)) % 26

    def forward(self, c: str) -> str:
        i = (_idx(c) + self._offset()) % 26
        sub = self.wiring[i]
        return _chr(_idx(sub) - self._offset())

    def backward(self, c: str) -> str:
        i = (_idx(c) + self._offset()) % 26
        sub = self.reverse_wiring[i]
        return _chr(_idx(sub) - self._offset())

    def at_notch(self) -> bool:
        # 标准 M3：notch 基于物理位置 self.position
        return self.position == self.notch

    def rotate(self):
        self.position = _chr(_idx(self.position) + 1)


class EnigmaMachine:
    def step_rotors(self):
        left, middle, right = self.rotors  # 槽位 0/1/2 = 左/中/右
        # 关键：先快照 notch 再 rotate，避免顺序错配
        right_at_notch = right.at_notch()
        middle_at_notch = middle.at_notch()
        if middle_at_notch:          # double step：middle 在 notch -> left 和 middle 同时进
            left.rotate()
            middle.rotate()
        elif right_at_notch:         # 右 rotor 在 notch -> 推 middle
            middle.rotate()
        right.rotate()               # 右 rotor 每次必进

    def encrypt_letter(self, c: str):
        if not c.isalpha():
            return c, [], [], []
        c = c.upper()
        self.step_rotors()

        plug_trace = []
        c = self.plugboard.substitute(c); plug_trace.append(c)

        forward_trace = []
        for rotor in reversed(self.rotors):       # 右 → 中 → 左
            after = rotor.forward(c)
            forward_trace.append({"from": c, "to": after})
            c = after

        c = self.reflector.reflect(c)

        backward_trace = []
        for rotor in self.rotors:                 # 左 → 中 → 右
            after = rotor.backward(c)
            backward_trace.append({"from": c, "to": after})
            c = after

        c = self.plugboard.substitute(c); plug_trace.append(c)
        return c, plug_trace, forward_trace, backward_trace
```

注意：把 `forwardResult`/`backwardResult` 从 dict 改为 list-of-step，可视化层可一一对应 3 个 rotor 阶段。

## 5. Schema / API 修改

```python
class RotorConfig(BaseModel):
    index: Literal["I","II","III","IV","V"]
    position: constr(regex=r"^[A-Z]$")
    ring_setting: constr(regex=r"^[A-Z]$") = "A"

class EncryptRequest(BaseModel):
    plaintext: constr(min_length=1, max_length=1, regex=r"^[A-Za-z]$")
    rotors: conlist(RotorConfig, min_items=3, max_items=3)
    reflector: Literal["A","B","C"]
    plugboard: conlist(Tuple[constr(regex=r"^[A-Z]$"), constr(regex=r"^[A-Z]$")], max_items=10)

    @validator("plugboard")
    def _no_self_or_dup(cls, v):
        seen = set()
        for a, b in v:
            if a == b: raise ValueError("self-pair")
            if a in seen or b in seen: raise ValueError("letter reused")
            seen |= {a, b}
        return v
```

路由：

- 去掉 `wiring` 入参；用 `ROTOR_WIRINGS[index]` 与 `ROTOR_NOTCH[index]` 构建 `Rotor`。
- 改 `except Exception` → 让 Pydantic 自动返回 422；对剩余意外错误使用 `HTTPException(500, "internal")`，不暴露 stack。
- 删除所有 `print(...)` 调试语句。

## 6. 前端修改

### 6.1 `EnigmaSimulator.tsx`

- `plugPairs` 初始 `[]`，不再放空哨兵 pair。
- `handleKeyPress`：
  ```ts
  if (isEncrypting) return;
  const cfg = validateConfig(selectedRotors, selectedReflector, plugPairs);
  if (cfg.error) { setError(cfg.error); return; }
  setIsEncrypting(true);
  try {
    const response = await api.encrypt({ ... });
    setInputText(p => p + letter);
    setOutputText(p => p + response.ciphertext);
    setSelectedRotors(prev => prev.map((r,i)=>({...r, position: response.rotor_positions[i]})));
    setActiveLetter(response.ciphertext);
    setError('');
    setTimeout(()=>setActiveLetter(null), 500);
  } catch (e) {
    setError(parseApiError(e));     // 422 → 显示具体校验信息
  } finally {
    setIsEncrypting(false);
  }
  ```
- rotor 窗口 `{rotor.index || '—'}: {rotor.position}`，可附加 `(ring {rotor.ringSetting})`。
- `handleReset`：position → A，input/output 清空，error 清空，**保留** rotor/reflector/plugboard 选择（与 Phase1 一致）。

### 6.2 `RotorSelector.tsx`

- 修正回调签名：`onRotorChange: (slot: number, rotorIndex: string) => void`。
- 增加第三个 `<select>`：`ring-setting-select`，options A–Z。
- 父组件回传 `onRingSettingChange(slot, ring)`。

### 6.3 `PlugboardConfig.tsx`

- 删除 `usedLetters` 独立 state，改为 `useMemo(() => new Set(plugPairs.flatMap(p => [p.from, p.to])), [plugPairs])`。
- `renderLines` 起首：`plugPairs.filter(p => p.from && p.to && p.from !== p.to)`。
- 物理电缆只存一份：`onPointerUp` 仅追加 `{from: dragStart, to: letter}`，不再额外塞反向对。
- 10 对上限：超出则 `setError('最多 10 对')`。
- 删除每格的 `onClick={removePair(ch)}`；改为：
  - 在 SVG `<line>` 上点击触发该 pair 移除；或
  - 增加双击格子触发移除；
  - 用 `pointerdown` 时记录起点坐标，`pointerup` 时若位移 < 5px 且为同字母且该字母已在 pair 中，再执行移除。
- 校验文案统一通过 `error` state 展示。

### 6.4 `services/api.ts`

```ts
export interface RotorSelection {
  index: string;
  position: string;
  ringSetting: string;
}
export interface EncryptRequest {
  plaintext: string;
  rotors: RotorSelection[];
  reflector: string;
  plugboard: [string, string][];
}
export interface PathStep { from: string; to: string; }
export interface EncryptResponse {
  ciphertext: string;
  rotor_positions: string[];
  plugResult: string[];
  forwardResult: PathStep[];
  backwardResult: PathStep[];
}
```

去掉发出的 `wiring` 字段（后端从 index 派生）。

## 7. 双向追溯：测试用例 → 修复点

| 用例 | Failure Feature | 关联修复 |
|---|---|---|
| 1.3 | 通用 500 错误，输入提前写入 | G1(前端校验) + B8(422) |
| 2.1/2.3/8.1/9.3 | A→F 而非 B | G2 信号路径 + step_rotors 单字符断言 |
| 2.2/4.1/7.1 | HELLOWORLD→MFNCZBBFZM | G2 = III-II-I 实际结果，方向翻转 |
| 2.4 PASS | — | 不动 |
| 3.1 | 右 rotor 不进 | step_rotors 重写：right 始终 rotate |
| 3.2 | AAU 起步 middle/right 不正确 | step_rotors：right_at_notch → middle.rotate |
| 3.3 | ADU 双步进 | middle_at_notch → left & middle 同步 rotate |
| 3.4 | ADV 起步 | step_rotors 同上 + position-after-step 截图核对 |
| 4.2 | 非默认 wiring 错 | 后端按 index 取 wiring（B9）+ G2 |
| 4.3 | BCD 起始位置错 | G2 + RotorSelector 起始位置传递 |
| 4.4/4.5 | 反射器 A/C 错 | G2 |
| 5.1 | 空板已有 1 条线 | B5 renderLines 过滤 + plugPairs 初始 [] |
| 5.2 | 双 pair 不显示 | B5 + 单条物理线渲染（更新 Playwright 断言为可见 endpoint） |
| 5.3 | 重用字母 | B6 usedLetters 派生 + 校验提示 |
| 5.4 | 自连 | 已有 `dragStart !== letter` 守卫；表象由 5.1 空线导致，B5 修复 |
| 5.5 | 移除现存 pair | B4 click 与拖拽冲突修复 |
| 5.6 | 10 对上限 | 6.3 中新增 10 对校验 |
| 6.1 | 输出错 | G2 |
| 6.2 | reset 后仍错 | G2 + plugboard 状态修复（B6） |
| 6.3 | reset 后 BCD→FTZMG | G2 + reset 行为不变 |
| 6.4 | 连点丢失 | G2 + B2 isEncrypting 锁 |
| 7.1/7.2 | 解密错 | G2（同对称密钥） |
| 8.2 | 窗口显示 wiring 字符串 | G6 rotor 窗口改 `{index}:{position}` |
| 9.3 | API 单字符错 | G2 |
| 10.1/10.2 | 缺 ring 控件 | G5 全栈 ring 实现 |

PASS 项保持不动：1.1, 1.2, 2.4, 9.1, 9.2, 9.4。

## 8. 实施 TODO List（按依赖顺序勾选）

### 阶段 A — 后端核心（无前端依赖，可独立单测）

- [ ] A1. 新建 `services/enigma-api/tests/test_machine_reference.py`，写入 Phase1 reference oracle 中的 13 行所有用例，作为**回归红线**。
- [ ] A2. 新建 `services/enigma-api/tests/test_api_validation.py`：缺 rotor / 非法字母 / 自连 plugboard / 重复字母 / >10 对 / 非法 reflector → 422。
- [ ] A3. 重写 `Rotor`：增加 `ring_setting`；substitute 用 `position − ring` offset；保留 `at_notch`（基于物理 position）。
- [ ] A4. 重写 `EnigmaMachine.step_rotors`（按 §4 实现，先快照后 rotate）。
- [ ] A5. 重写 `encrypt_letter`：forward 用 `reversed(self.rotors)`，backward 用 `self.rotors`；trace 改 list-of-step。
- [ ] A6. 删除 `machine.py` 中所有 `print(...)`。
- [ ] A7. 更新 `schemas.py`：`RotorConfig` 增 `ring_setting`、去 `wiring`；`EncryptRequest` 加 Pydantic 校验器；`EncryptResponse.forwardResult/backwardResult` → `List[PathStep]`。
- [ ] A8. 更新 `routes/enigma.py`：按 `index` 查 `ROTOR_WIRINGS`/`ROTOR_NOTCH`；移除 `wiring` 入参；移除 `except Exception → 500`，让 422 自然抛出；删除 `print`。
- [ ] A9. 运行 A1/A2 全绿后再进入阶段 B。

### 阶段 B — 前端契约对齐

- [ ] B1. 更新 `services/api.ts`：`RotorSelection { index, position, ringSetting }`；`EncryptRequest` 不再带 `wiring`；`EncryptResponse.forwardResult/backwardResult: PathStep[]`。
- [ ] B2. `EnigmaSimulator` state：`selectedRotors` 增 `ringSetting: 'A'`；`plugPairs` 初始 `[]`；增加 `isEncrypting`。

### 阶段 C — 前端配置校验 & 异步流

- [ ] C1. 提取 `validateConfig(rotors, reflector, plugPairs)` 纯函数，返回 `{ok:true} | {ok:false, message}`。
- [ ] C2. 重写 `handleKeyPress`：先校验、再发送、成功后才 append input/output；失败时显示 422 detail，不污染输入。
- [ ] C3. 引入 `isEncrypting`：键盘按钮 `disabled={isEncrypting}` 且禁止重入。
- [ ] C4. `handleReset` 同时清 input/output/error/activeLetter，保留 rotor/reflector/plugboard 选择。

### 阶段 D — 转子 UI 与显示

- [ ] D1. `RotorSelector` 修正回调签名 `onRotorChange(slot, rotorIndex)`。
- [ ] D2. 新增 `ring-setting-select`（A–Z），父组件回传 `onRingSettingChange`。
- [ ] D3. `EnigmaSimulator` rotor 窗口渲染 `{index||'—'}: {position}`（可选附 ring）。
- [ ] D4. 修正 `RotorVisualizer` 计算（仅当当前测试用例可见 SVG 时；不影响 oracle）。

### 阶段 E — 插线板

- [ ] E1. 删除 `usedLetters` 独立 state，改 `useMemo` 派生。
- [ ] E2. `renderLines` 起首过滤无效 pair；初始空板渲染 0 条线。
- [ ] E3. `onPointerUp` 只追加单条物理 pair，不再添加反向对。
- [ ] E4. 加入 10 对上限、自连、重用校验与 `error` 文案。
- [ ] E5. 解决 click vs drag 冲突（推荐：移除每格 `onClick`，改为 SVG `<line>` 点击删除该对；保留 `setError('')` 清错）。
- [ ] E6. 父组件 reset 不清除 plugboard（与 Phase1 一致）。

### 阶段 F — 测试与回归

- [ ] F1. 调整 Playwright 用例 5.1/5.2/5.6 的断言：从"统计 `.solid` 线数 ≥ 2/4/20"改为"对应 pair 的两端 box 处于 `connected` 状态"或"SVG `<line>` 数等于物理对数"。
- [ ] F2. 调整 8.2 的 rotor 窗口断言：匹配 `^([IVX]+): [A-Z]$`。
- [ ] F3. 运行：
  ```powershell
  cd apps\enigma-frontend
  npx playwright test enigma-business-logic.spec.ts
  ```
- [ ] F4. 期望：36/36 PASS。
- [ ] F5. 同步更新 `specs/enigma-business-logic.results.md`。

## 9. 风险与权衡

- **API breaking change**：去掉 `wiring` 入参属于不兼容修改。本仓库无外部消费者，可直接切换；若未来开放外部 API，应保留 `wiring` 字段但**忽略**它（warning 日志）。
- **Plugboard 渲染断言**：Phase2 原断言基于"双向 line 各算一条"，与正确的物理模型矛盾。本方案选择修改断言而不是为了过测试再保留双向冗余 state。该决定需要在结果文件里明确记录。
- **Ring setting 与 notch**：M3/M4 实现细节略有差异（Heimsoeth & Rinke 历史实现中 notch 跟随 ring 移动）。本方案锁定为"notch 基于物理位置 position"，与 Phase1 oracle 一致；如未来 oracle 改为"notch 跟随 ring"，仅需修改 `at_notch()` 一处。
- **rapid clicks 顺序保证**：采用 `isEncrypting` 锁的"丢弃"策略；若产品希望"全部入队"，把锁换成 `Promise` 链即可，逻辑变更点单一。
- **decryption 语义**：当前 UI 没有"解密模式"按钮，依赖用户手动重置位置后输入密文。7.1/7.2 PASS 等价于"Enigma 对合性 + 正确加密"，无需新增模式。

## 10. 验收清单

完成所有 TODO 后，逐项确认：

- [ ] `pytest services/enigma-api/tests` 全绿。
- [ ] 后端单字符 API `POST /encrypt` 在 I-II-III/AAA/Reflector B/无 plugboard 下 `A→B`。
- [ ] `HELLOWORLD → ILBDAAMTAZ`、`AAAAA → BDZGO`、`I-II-III BCD → RNOOV`。
- [ ] 双步进：ADU 起 → 第二字符时 left & middle 同步进位。
- [ ] 空插线板 SVG `<line>` 数为 0；A-M 配对后正好 1 条；最多 10 条。
- [ ] 未选齐 rotor 时按键不写 input、不发请求、提示具体校验信息。
- [ ] rotor 窗口显示 `I: B` 而非 wiring 字符串。
- [ ] ring setting 控件在三个 rotor 各有一个；改 ring 后输出与 Phase1 oracle 一致。
- [ ] Playwright 36/36 PASS，`results.md` 更新。
