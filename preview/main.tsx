/**
 * ModelPicker preview. Renders the production component against a fake catalog
 * so favorites, recents, effort chips, and migration can be exercised without DSH.
 * Storage belongs to this origin, so it never touches the real GUI's shortcuts.
 */
import { useState, useSyncExternalStore, type CSSProperties } from 'react'
import { createRoot } from 'react-dom/client'
import type { ModelCatalog } from '@deepseek-ai/dsh-api-remotes/client'
import type { ModelSelectionConfig } from '../src/shared.ts'
import { ModelPicker, type ModelCatalogAccess } from '../src/client/ModelPicker.tsx'
import { modelPreferences } from '../src/client/model-preferences.ts'
import { en, zh, type LocaleKey } from '../src/client/locales.ts'

const V1 = 'dsh-model-switch/picker-v1'
const V2 = 'dsh-model-switch/picker-v2'
const level = (id: string, name: string) => ({ id, name })
const [low, medium, high, max] = [level('low', 'Low'), level('medium', 'Medium'), level('high', 'High'), level('max', 'Max')]
const catalog: ModelCatalog = {
  default: { provider: 'factory-a', model: 'claude-opus-5' },
  routableProviders: ['factory-a', 'opencode-go', 'deepseek', 'step'],
  groups: [
    { id: 'factory-a', name: 'Factory', models: [
      { id: 'claude-opus-5', name: 'Claude Opus 5', reasoning: { efforts: [low, medium, high, max], defaultEffort: 'high' } },
      { id: 'claude-sonnet-5-5', name: 'Claude Sonnet 5.5', reasoning: { efforts: [low, medium, high], defaultEffort: 'medium' } },
    ] },
    { id: 'opencode-go', name: 'OpenCode Go', models: [
      { id: 'deepseek-v4.1-flash', name: 'DeepSeek V4.1 Flash', reasoning: { efforts: [high, max], defaultEffort: 'high' } },
      { id: 'glm-5.3-flash', name: 'GLM 5.3 Flash', description: '不支持思考强度' },
    ] },
    { id: 'deepseek', name: 'DeepSeek 官方', models: [
      { id: 'deepseek-v4.1-flash', name: 'DeepSeek V4.1 Flash', description: '同名模型，另一提供方；无适配器默认强度', reasoning: { efforts: [high, max] } },
    ] },
    { id: 'step', name: 'Step', models: [
      { id: 'step-5-preview', name: 'Step 5 Preview', reasoning: { efforts: [low, high], defaultEffort: 'low' } },
    ] },
  ],
  failures: [],
}
const access: ModelCatalogAccess = { loadCatalog: async () => catalog, currentSelection: () => undefined }
const tuple = (provider: string, model: string, effort?: string | null) => effort === undefined ? [provider, model] : [provider, model, effort]
const scenarios: { id: string; label: string; detail: string; apply: () => void }[] = [
  { id: 'empty', label: '空白', detail: '没有收藏和最近使用', apply: () => { localStorage.removeItem(V1); localStorage.removeItem(V2) } },
  { id: 'legacy', label: '旧版收藏迁移', detail: 'v1 只存了模型：Opus、GLM 收藏，最近用过 Sonnet', apply: () => {
    localStorage.removeItem(V2)
    localStorage.setItem(V1, JSON.stringify({ favorites: [JSON.stringify(['factory-a', 'claude-opus-5']), JSON.stringify(['opencode-go', 'glm-5.3-flash'])], recent: [JSON.stringify(['factory-a', 'claude-sonnet-5-5'])] }))
  } },
  { id: 'combos', label: '组合收藏', detail: 'Opus 收藏 High 和 Max，另有 Sonnet Low 等', apply: () => {
    localStorage.setItem(V2, JSON.stringify({ version: 2,
      favorites: [tuple('factory-a', 'claude-opus-5', 'high'), tuple('factory-a', 'claude-opus-5', 'max'), tuple('factory-a', 'claude-sonnet-5-5', 'low'), tuple('opencode-go', 'deepseek-v4.1-flash', 'max'), tuple('opencode-go', 'glm-5.3-flash', null)],
      history: [tuple('factory-a', 'claude-sonnet-5-5', 'medium'), tuple('factory-a', 'claude-opus-5', 'max'), tuple('deepseek', 'deepseek-v4.1-flash', 'high'), tuple('step', 'step-5-preview', 'high')] }))
  } },
  { id: 'stale', label: '含失效强度', detail: 'Opus 收藏了已下线的 ultra，Step 收藏了不支持的 medium', apply: () => {
    localStorage.setItem(V2, JSON.stringify({ version: 2,
      favorites: [tuple('factory-a', 'claude-opus-5', 'high'), tuple('factory-a', 'claude-opus-5', 'ultra'), tuple('step', 'step-5-preview', 'medium')],
      history: [] }))
  } },
  { id: 'full', label: '收藏已满', detail: '40 个收藏（多数模型不在目录里，故隐藏）', apply: () => {
    const favorites = [tuple('factory-a', 'claude-opus-5', 'high'), ...Array.from({ length: 39 }, (_, index) => tuple('archived', `model-${index}`, null))]
    localStorage.setItem(V2, JSON.stringify({ version: 2, favorites, history: [] }))
  } },
]
function runScenario(apply: () => void): void { apply(); location.reload() }

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))
const describe = (value: ModelSelectionConfig | undefined): string => value === undefined ? '未设置' : `${value.provider} / ${value.model}${value.reasoningEffort ? ` · ${value.reasoningEffort}` : ' · 提供方默认'}`

function App() {
  const [lang, setLang] = useState<'zh' | 'en'>('zh')
  const t = (key: LocaleKey): string => (lang === 'zh' ? zh : en)[key]
  const [main, setMain] = useState<ModelSelectionConfig | undefined>({ provider: 'factory-a', model: 'claude-opus-5', reasoningEffort: 'high' })
  const [subagent, setSubagent] = useState<ModelSelectionConfig | undefined>()
  const [settingsDefault, setSettingsDefault] = useState<ModelSelectionConfig | undefined>({ provider: 'factory-a', model: 'claude-sonnet-5-5', reasoningEffort: 'medium' })
  const preferences = useSyncExternalStore(modelPreferences.subscribe, modelPreferences.getSnapshot)
  const save = (set: (value: ModelSelectionConfig | undefined) => void) => async (value: ModelSelectionConfig | undefined) => { await delay(350); set(value) }
  // Mirrors SessionSubagentPicker: no session pick → settings default → main model.
  return (
    <div style={page}>
      <header style={bar}>
        <strong style={{ fontSize: 15 }}>模型菜单预览</strong>
        <span style={muted}>正式 ModelPicker 组件 + 假模型目录；数据只存在本预览页面</span>
        <span style={{ flex: 1 }} />
        <button type="button" style={chip(lang === 'zh')} onClick={() => setLang('zh')}>中文</button>
        <button type="button" style={chip(lang === 'en')} onClick={() => setLang('en')}>English</button>
      </header>
      <section style={card}>
        <h2 style={h2}>预置场景（会重新载入页面）</h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {scenarios.map(item => <button key={item.id} type="button" style={chip(false)} title={item.detail} onClick={() => runScenario(item.apply)}>{item.label}</button>)}
        </div>
        <ul style={{ ...muted, margin: '10px 0 0', paddingLeft: 18, lineHeight: 1.7 }}>
          {scenarios.map(item => <li key={item.id}><b>{item.label}</b>：{item.detail}</li>)}
        </ul>
      </section>
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 16 }}>
        <section style={card}>
          <h2 style={h2}>设置页 · 子代理默认模型</h2>
          <ModelPicker stretch sessionId={undefined} access={access} value={settingsDefault} onChange={save(setSettingsDefault)} t={t} controlLabel={t('subagentTitle')} fallbackLabel={t('modeFollow')} onClear={settingsDefault ? () => save(setSettingsDefault)(undefined) : undefined} clearLabel={t('modeFollow')} />
          <p style={{ ...muted, marginTop: 8 }}>{settingsDefault ? describe(settingsDefault) : '跟随主模型'}</p>
        </section>
        <section style={card}>
          <h2 style={h2}>当前状态</h2>
          <dl style={{ margin: 0, fontSize: 12, lineHeight: 1.8 }}>
            <dt style={muted}>主模型（本会话）</dt><dd style={dd}>{describe(main)}</dd>
            <dt style={muted}>子代理（本会话）</dt><dd style={dd}>{subagent ? describe(subagent) : `未选择，跟随${settingsDefault ? '设置默认' : '主模型'}：${describe(settingsDefault ?? main)}`}</dd>
          </dl>
          <details style={{ marginTop: 8 }}>
            <summary style={{ ...muted, cursor: 'pointer' }}>{V2}</summary>
            <pre style={pre}>{JSON.stringify(preferences, null, 2)}</pre>
          </details>
        </section>
      </div>
      <section style={{ ...card, marginTop: 'auto' }}>
        <h2 style={h2}>聊天栏</h2>
        <div style={composer}>
          <span style={{ ...muted, flex: 1 }}>给 Droid 发消息…</span>
          <ModelPicker compact sessionId="preview" access={access} value={subagent ?? settingsDefault ?? main} onChange={save(setSubagent)} t={t} placement="top" roleLabel={t('chatSubagentRole')} sourceLabel={t(subagent ? 'sessionSource' : settingsDefault ? 'defaultSource' : 'followingMain')} scopeHint={t('subagentScope')} />
          <ModelPicker compact sessionId="preview" access={access} value={main} onChange={save(setMain)} t={t} placement="top" roleLabel={t('chatMainRole')} sourceLabel={t('sessionSource')} scopeHint={t('mainScope')} />
        </div>
      </section>
    </div>
  )
}

const page: CSSProperties = { display: 'flex', flexDirection: 'column', gap: 16, minHeight: '100vh', boxSizing: 'border-box', maxWidth: 960, margin: '0 auto', padding: 20, font: '13px/1.5 system-ui, -apple-system, "PingFang SC", sans-serif', color: '#27272f' }
const bar: CSSProperties = { display: 'flex', alignItems: 'center', gap: 10 }
const card: CSSProperties = { padding: 16, border: '1px solid #dedee3', borderRadius: 12, background: '#fff' }
const h2: CSSProperties = { margin: '0 0 10px', fontSize: 12, fontWeight: 600, color: '#555560' }
const muted: CSSProperties = { color: '#777784', fontSize: 12 }
const dd: CSSProperties = { margin: '0 0 4px', fontFamily: 'ui-monospace, SFMono-Regular, monospace' }
const pre: CSSProperties = { maxHeight: 240, overflow: 'auto', margin: '6px 0 0', padding: 8, borderRadius: 8, background: '#f6f6f9', fontSize: 11 }
const composer: CSSProperties = { display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', border: '1px solid #dedee3', borderRadius: 14, background: '#fafafc' }
const chip = (active: boolean): CSSProperties => ({ height: 28, padding: '0 12px', border: `1px solid ${active ? '#5269dc' : '#dedee3'}`, borderRadius: 7, background: active ? '#eef0fb' : '#fff', color: active ? '#5269dc' : '#555560', font: 'inherit', fontSize: 12, cursor: 'pointer' })

document.body.style.margin = '0'
document.body.style.background = '#f3f3f6'
createRoot(document.getElementById('root')!).render(<App />)
