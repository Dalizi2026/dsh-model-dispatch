window.__ModuleLoader__.load({
	id: "dsh-model-dispatch",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		let react_jsx_runtime = require("react/jsx-runtime");
		let react = require("react");
		let react_dom = require("react-dom");
		let _deepseek_ai_dsh_client_ui_primitives = require("@deepseek-ai/dsh-client-ui-primitives");
		//#region lib/shared.js
		/**
		* Shared types and pure helpers (host + client safe).
		*/
		/** Settings namespace string (must match host registration). */
		const MODEL_SWITCH_NS = "model-switch";
		/** Resolve a route to an explicit selection, or undefined when following main. */
		function resolveCustomSelection(route) {
			if (route?.mode !== "custom") return void 0;
			const selection = route.selection;
			if (selection === void 0) return void 0;
			const provider = selection.provider.trim();
			const model = selection.model.trim();
			if (provider.length === 0 || model.length === 0) return void 0;
			const effort = selection.reasoningEffort?.trim();
			return {
				provider,
				model,
				...effort !== void 0 && effort.length > 0 ? { reasoningEffort: effort } : {}
			};
		}
		//#endregion
		//#region lib/client/locales.js
		/** Locale copy for dsh-model-dispatch. */
		const zh = {
			nav: "模型切换",
			title: "模型切换",
			mainTitle: "新会话默认模型",
			mainHint: "聊天中切换模型不会改动此设置。",
			mainUnavailable: "主模型默认设置暂不可用。仍可在聊天栏为当前会话选模。",
			subagentTitle: "子代理默认模型",
			subagentHint: "会话内的子代理选择优先于此设置。",
			planPlanningTitle: "制定计划模型",
			planPlanningHint: "计划模式下使用；批准或退出计划后，恢复原主模型和推理档位。",
			modeFollow: "跟随主模型",
			effortLabel: "思考强度",
			effortDefault: "提供方默认",
			triggerFallback: "选择模型",
			triggerSelectAria: "选择模型",
			menuAria: "模型与推理档位",
			statusLoading: "加载中…",
			emptyModels: "暂无可用模型",
			emptyEfforts: "此模型不支持调整思考强度",
			retry: "重试",
			noSession: "请先打开一个普通会话以加载模型列表。",
			loadError: "无法加载模型列表",
			saveError: "保存失败",
			unavailable: "设置暂不可用。请使用 DSH 0.2.0-rc.2 或更高版本。",
			planHeader: "计划待审",
			planDiscuss: "去聊天里说",
			planDecline: "拒绝",
			planApprove: "确认执行",
			planModelLabel: "执行将恢复主模型",
			sessionPickerAria: "选择本会话的子代理模型",
			sessionPickerDefault: "子代理：默认",
			sessionPickerClear: "恢复为设置默认",
			codeCopy: "复制代码",
			codeCopied: "已复制",
			footnotes: "脚注",
			searchPlaceholder: "搜索模型或提供方…",
			searchResults: "搜索结果",
			noResults: "没有匹配的模型，试试其他关键词",
			favorites: "收藏",
			recentModels: "最近使用",
			favoriteModel: "收藏模型",
			unfavoriteModel: "取消收藏",
			catalogPartial: "部分提供方未能加载",
			routeMissing: "当前模型不在此提供方的已加载目录中，请从正确的提供方分组重新选择。",
			chatMainRole: "主模型",
			chatSubagentRole: "子代理",
			sessionSource: "本会话选择",
			defaultSource: "设置默认",
			followingMain: "跟随主模型",
			mainScope: "仅作用于当前会话，新会话继续使用设置页保存的默认模型。",
			subagentScope: "仅影响当前会话之后新启动的子代理，已运行的子代理保持原模型。",
			cancel: "取消",
			applySelection: "应用",
			saved: "已保存",
			statusSaving: "保存中…"
		};
		const en = {
			nav: "Model switch",
			title: "Model switch",
			mainTitle: "New session default",
			mainHint: "Model changes in a chat leave this default unchanged.",
			mainUnavailable: "The main model default is unavailable. You can still select a model in the current chat.",
			subagentTitle: "Subagent default",
			subagentHint: "A chat’s subagent selection overrides this default.",
			planPlanningTitle: "Planning model",
			planPlanningHint: "Used in plan mode. Approval or exit restores the original main model and effort.",
			modeFollow: "Follow main model",
			effortLabel: "Reasoning effort",
			effortDefault: "Provider default",
			triggerFallback: "Select model",
			triggerSelectAria: "Select model",
			menuAria: "Model and reasoning effort",
			statusLoading: "Loading…",
			emptyModels: "No models available",
			emptyEfforts: "No reasoning efforts for this model",
			retry: "Retry",
			noSession: "Open an ordinary session to load the model catalog.",
			loadError: "Failed to load models",
			saveError: "Failed to save",
			unavailable: "Settings are unavailable. Requires DSH 0.2.0-rc.2 or later.",
			planHeader: "Plan awaiting review",
			planDiscuss: "Discuss in chat",
			planDecline: "Decline",
			planApprove: "Approve",
			planModelLabel: "Execution restores main model",
			sessionPickerAria: "Pick this session’s subagent model",
			sessionPickerDefault: "Subagents: default",
			sessionPickerClear: "Use settings default",
			codeCopy: "Copy code",
			codeCopied: "Copied",
			footnotes: "Footnotes",
			searchPlaceholder: "Search models or providers…",
			searchResults: "Search results",
			noResults: "No matching models. Try another search.",
			favorites: "Favorites",
			recentModels: "Recently used",
			favoriteModel: "Favorite model",
			unfavoriteModel: "Remove favorite",
			catalogPartial: "Some providers could not load",
			routeMissing: "This model is not in the loaded catalog for its provider. Select it from the correct provider group.",
			chatMainRole: "Main",
			chatSubagentRole: "Subagent",
			sessionSource: "This session",
			defaultSource: "Settings default",
			followingMain: "Follows main",
			mainScope: "Applies only to this session. New conversations keep the default saved in settings.",
			subagentScope: "Applies only to subagents started later in this conversation. Running subagents keep their model.",
			cancel: "Cancel",
			applySelection: "Apply",
			saved: "Saved",
			statusSaving: "Saving…"
		};
		//#endregion
		//#region lib/client/config-store.js
		/**
		* Browser mirror of the host `model-switch` settings namespace.
		*
		* DSH 0.2.x serves plugin namespaces through the `configForms` service
		* (dsh-client-ui-settings); this store is a stable snapshot wrapper over the
		* namespace's `ConfigForm` controller.
		*/
		const EMPTY$1 = {};
		/**
		* Strip own-properties whose value is `undefined`.
		*
		* The `settings/mutate` strict JSON codec rejects ops whose `value` contains
		* explicit `undefined` members (e.g. `{ mode: 'follow-main', selection:
		* undefined }` produced by the settings UI), failing with
		* `client api:settings/mutate rejected "ops"`. A JSON round-trip drops them.
		*/
		function toJsonValue(value) {
			return JSON.parse(JSON.stringify(value));
		}
		/** Reactive config store over the client `configForms` namespace controller. */
		var ConfigStore = class {
			form;
			lastRaw;
			lastView = {
				status: "loading",
				value: EMPTY$1,
				error: null
			};
			constructor(form) {
				this.form = form;
			}
			getSnapshot() {
				const raw = this.form.getSnapshot();
				if (raw === this.lastRaw) return this.lastView;
				this.lastRaw = raw;
				if (raw.status === "unavailable") this.lastView = {
					status: "error",
					value: raw.value ?? EMPTY$1,
					error: "unavailable"
				};
				else this.lastView = {
					status: raw.status,
					value: raw.value ?? EMPTY$1,
					error: null
				};
				return this.lastView;
			}
			subscribe(listener) {
				return this.form.subscribe(listener);
			}
			/**
			* Persist one route field. `ConfigForm.set` is one field per call and
			* fences the write with the latest known namespace revision.
			*/
			async saveRoute(field, next) {
				if (!await this.form.set(field, toJsonValue(next))) throw new Error("settings write rejected");
			}
		};
		/** Reactive store over the native `agent-default-model` entry config. */
		var MainModelStore = class {
			form;
			lastRaw;
			lastView = {
				status: "loading",
				value: void 0,
				error: null
			};
			constructor(form) {
				this.form = form;
			}
			getSnapshot() {
				const raw = this.form.getSnapshot();
				if (raw === this.lastRaw) return this.lastView;
				this.lastRaw = raw;
				if (raw.status === "unavailable") this.lastView = {
					status: "error",
					value: raw.value,
					error: "unavailable"
				};
				else this.lastView = {
					status: raw.status,
					value: raw.value,
					error: null
				};
				return this.lastView;
			}
			subscribe(listener) {
				return this.form.subscribe(listener);
			}
			/**
			* Persist the whole default selection. The entry's volatile fields are flat
			* (`provider` / `model` / `reasoningEffort`), so one atomic mutate carries
			* all three; clearing the effort re-inherits the composition layer.
			*/
			async save(next) {
				const ops = [
					{
						op: "set",
						path: ["provider"],
						value: next.provider
					},
					{
						op: "set",
						path: ["model"],
						value: next.model
					},
					next.reasoningEffort === void 0 ? {
						op: "unset",
						path: ["reasoningEffort"]
					} : {
						op: "set",
						path: ["reasoningEffort"],
						value: next.reasoningEffort
					}
				];
				if (!await this.form.mutate(ops)) throw new Error("settings write rejected");
			}
		};
		//#endregion
		//#region lib/client/model-preferences.js
		const KEY = "dsh-model-switch/picker-v1";
		const EMPTY = {
			favorites: [],
			recent: []
		};
		const modelKey = (value) => JSON.stringify([value.provider, value.model]);
		let snapshot = EMPTY;
		let initialized = false;
		const listeners = /* @__PURE__ */ new Set();
		function read() {
			try {
				const data = JSON.parse(localStorage.getItem(KEY) ?? "{}");
				const strings = (value) => Array.isArray(value) ? [...new Set(value.filter((item) => typeof item === "string"))] : [];
				return {
					favorites: strings(data?.favorites).slice(0, 40),
					recent: strings(data?.recent).slice(0, 6)
				};
			} catch {
				return EMPTY;
			}
		}
		function initialize() {
			if (initialized || typeof window === "undefined") return;
			initialized = true;
			snapshot = read();
			window.addEventListener("storage", (event) => {
				if (event.key !== KEY && event.key !== null) return;
				snapshot = read();
				for (const notify of listeners) notify();
			});
		}
		function publish(next) {
			initialize();
			snapshot = next;
			try {
				localStorage.setItem(KEY, JSON.stringify(next));
			} catch {}
			for (const notify of listeners) notify();
		}
		const modelPreferences = {
			getSnapshot: () => {
				initialize();
				return snapshot;
			},
			subscribe: (notify) => {
				initialize();
				listeners.add(notify);
				return () => {
					listeners.delete(notify);
				};
			},
			toggleFavorite(value) {
				const key = modelKey(value);
				publish({
					...snapshot,
					favorites: snapshot.favorites.includes(key) ? snapshot.favorites.filter((item) => item !== key) : [...snapshot.favorites, key]
				});
			},
			remember(value) {
				const key = modelKey(value);
				publish({
					...snapshot,
					recent: [key, ...snapshot.recent.filter((item) => item !== key)].slice(0, 6)
				});
			}
		};
		//#endregion
		//#region \0dsh-css:/Users/lizi/Documents/dsh/dsh-model-dispatch/src/client/ModelPicker.module.css.mjs
		const css$5 = ".EEexFW_root{min-width:0;position:relative}.EEexFW_trigger{border:1px solid var(--dsw-alias-border-l2,#dedee3);background:var(--dsw-alias-bg-layer-1,#fff);min-width:0;max-width:248px;height:30px;color:var(--dsw-alias-label-primary,#27272f);font:inherit;cursor:pointer;border-radius:8px;outline:none;align-items:center;gap:6px;padding:0 8px;font-size:12px;display:inline-flex}.EEexFW_trigger:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover,#f3f3f7)}.EEexFW_trigger:focus-visible{outline:2px solid var(--dsw-alias-state-business-primary,#5269dc);outline-offset:2px}.EEexFW_trigger:disabled{opacity:.6;cursor:default}.EEexFW_role{color:var(--dsw-alias-label-tertiary,#777784);flex:none;font-size:10px;font-weight:600}.EEexFW_triggerLabel{text-overflow:ellipsis;white-space:nowrap;min-width:0;max-width:168px;font-weight:500;overflow:hidden}.EEexFW_triggerEffort{color:var(--dsw-alias-label-tertiary,#777784);flex:none;font-size:10px}.EEexFW_chevron{width:12px;height:12px;color:var(--dsw-alias-label-tertiary,#777784);flex:none}.EEexFW_menu{z-index:10000;border:1px solid var(--dsw-alias-border-l2,#dedee3);background:var(--dsw-alias-bg-layer-1,#fff);width:min(360px,100vw - 24px);color:var(--dsw-alias-label-primary,#27272f);box-sizing:border-box;border-radius:14px;flex-direction:column;padding:8px;display:flex;position:fixed;overflow:hidden;box-shadow:0 12px 40px #0002,0 2px 8px #0001}.EEexFW_menu[data-upwards=true]{transform:translateY(-100%)}.EEexFW_menuHeader{justify-content:space-between;align-items:center;gap:12px;padding:3px 4px 9px;font-size:13px;font-weight:600;display:flex}.EEexFW_source{color:var(--dsw-alias-state-business-primary,#5269dc);background:color-mix(in srgb, var(--dsw-alias-state-business-primary,#5269dc) 9%, transparent);border-radius:4px;padding:2px 6px;font-size:10px;font-weight:500}.EEexFW_search{box-sizing:border-box;border:1px solid var(--dsw-alias-border-l2,#dedee3);background:var(--dsw-alias-interactive-bg-hover,#f3f3f7);width:100%;height:34px;color:inherit;font:inherit;border-radius:8px;outline:none;flex:none;padding:0 10px;font-size:12px}.EEexFW_search:focus{border-color:var(--dsw-alias-state-business-primary,#5269dc)}.EEexFW_groups{overscroll-behavior:contain;flex:auto;min-height:44px;padding-top:4px;overflow-y:auto}.EEexFW_group+.EEexFW_group{border-top:1px solid var(--dsw-alias-border-l2,#dedee3);margin-top:5px;padding-top:4px}.EEexFW_groupTitle{color:var(--dsw-alias-label-tertiary,#777784);margin:0;padding:6px 5px;font-size:10px;font-weight:600;line-height:14px;display:block}.EEexFW_modelRow{align-items:center;gap:2px;display:flex}.EEexFW_option{min-width:0;min-height:44px;color:inherit;text-align:left;cursor:pointer;background:0 0;border:0;border-radius:8px;outline:none;flex:1;align-items:center;gap:8px;padding:7px 8px;display:flex}.EEexFW_option:hover:not(:disabled),.EEexFW_option:focus-visible{background:var(--dsw-alias-interactive-bg-hover,#f3f3f7)}.EEexFW_option:disabled{opacity:.6;cursor:default}.EEexFW_selected{background:color-mix(in srgb, var(--dsw-alias-state-business-primary,#5269dc) 8%, transparent)}.EEexFW_optionCopy{flex-direction:column;flex:1;gap:2px;min-width:0;display:flex}.EEexFW_modelName{font-size:12px;font-weight:500;line-height:17px}.EEexFW_description{color:var(--dsw-alias-label-tertiary,#777784);font-size:10px;line-height:15px}.EEexFW_modelName,.EEexFW_description{text-overflow:ellipsis;white-space:nowrap;overflow:hidden}.EEexFW_check{width:14px;color:var(--dsw-alias-state-business-primary,#5269dc);flex:none}.EEexFW_favorite{width:27px;height:30px;color:var(--dsw-alias-label-tertiary,#888894);cursor:pointer;background:0 0;border:0;border-radius:6px;flex:none;padding:0;font-size:17px}.EEexFW_favorite[aria-pressed=true]{color:var(--dsw-alias-state-business-primary,#5269dc)}.EEexFW_favorite:hover,.EEexFW_favorite:focus-visible{background:var(--dsw-alias-interactive-bg-hover,#f3f3f7)}.EEexFW_effortSection{flex:none;padding:4px 0 10px}.EEexFW_efforts{flex-wrap:wrap;gap:4px;display:flex}.EEexFW_effort{border:1px solid var(--dsw-alias-border-l2,#dedee3);height:25px;color:var(--dsw-alias-label-secondary,#555560);cursor:pointer;font:inherit;background:0 0;border-radius:6px;padding:0 8px;font-size:10px}.EEexFW_effort[aria-pressed=true]{border-color:var(--dsw-alias-state-business-primary,#5269dc);color:var(--dsw-alias-state-business-primary,#5269dc);background:color-mix(in srgb, var(--dsw-alias-state-business-primary,#5269dc) 9%, transparent)}.EEexFW_clear{border:0;border-top:1px solid var(--dsw-alias-border-l2,#dedee3);width:100%;color:var(--dsw-alias-label-secondary,#555560);text-align:left;font:inherit;cursor:pointer;background:0 0;flex:none;justify-content:space-between;align-items:center;margin-top:5px;padding:9px 8px;font-size:12px;display:flex}.EEexFW_scopeHint{color:var(--dsw-alias-label-tertiary,#777784);border-top:1px solid var(--dsw-alias-border-l2,#dedee3);flex:none;padding:8px 4px 3px;font-size:10px;line-height:15px}.EEexFW_status,.EEexFW_empty,.EEexFW_muted{color:var(--dsw-alias-label-tertiary,#777784);padding:14px 7px;font-size:12px}.EEexFW_error{background:color-mix(in srgb, var(--dsw-alias-state-error-primary,#c0392b) 8%, transparent);color:var(--dsw-alias-state-error-primary,#c0392b);overflow-wrap:anywhere;border-radius:7px;justify-content:space-between;gap:8px;margin-top:6px;padding:8px;font-size:11px;line-height:16px;display:flex}.EEexFW_retry{color:inherit;font:inherit;cursor:pointer;background:0 0;border:0;flex:none;padding:0}.EEexFW_warning{color:var(--dsw-alias-label-tertiary,#777784);padding:6px 4px;font-size:10px}@media (width<=640px){.EEexFW_trigger{max-width:190px}.EEexFW_triggerEffort{display:none}}.EEexFW_compact .EEexFW_trigger{max-width:180px}.EEexFW_compact .EEexFW_triggerLabel{max-width:110px;display:var(--dsh-composer-model-text-display,block)}.EEexFW_compact .EEexFW_triggerEffort{display:none}.EEexFW_stretch .EEexFW_trigger{width:100%;max-width:none;height:36px;padding:0 11px}.EEexFW_stretch .EEexFW_triggerLabel{text-align:left;flex:1;max-width:none}.EEexFW_stretch .EEexFW_triggerEffort{display:inline}.EEexFW_clear[aria-pressed=true]{color:var(--dsw-alias-state-business-primary,#5269dc)}.EEexFW_selectionEditor{border-top:1px solid var(--dsw-alias-border-l2,#dedee3);flex:none;padding:10px 4px 2px}.EEexFW_draftSummary{flex-direction:column;gap:2px;min-width:0;display:flex}.EEexFW_effortUnavailable{color:var(--dsw-alias-label-tertiary,#777784);margin:6px 0 10px;font-size:10px}.EEexFW_confirmActions{justify-content:flex-end;align-items:center;gap:8px;padding-top:4px;display:flex}.EEexFW_cancel,.EEexFW_apply{border:1px solid var(--dsw-alias-border-l2,#dedee3);height:30px;font:inherit;cursor:pointer;border-radius:7px;padding:0 13px;font-size:12px}.EEexFW_cancel{color:var(--dsw-alias-label-secondary,#555560);background:0 0}.EEexFW_apply{background:var(--dsw-alias-state-business-primary,#5269dc);color:#fff;border-color:#0000}.EEexFW_cancel:disabled,.EEexFW_apply:disabled{opacity:.5;cursor:default}.EEexFW_cancel:focus-visible,.EEexFW_apply:focus-visible{outline:2px solid var(--dsw-alias-state-business-primary,#5269dc);outline-offset:2px}";
		const tagId$5 = "dsh-model-dispatch/ModelPicker.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId$5) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "dsh-model-dispatch";
			tag.dataset.pluginCss = tagId$5;
			tag.textContent = css$5;
			document.head.appendChild(tag);
		}
		var ModelPicker_module_css_default = {
			"apply": "EEexFW_apply",
			"cancel": "EEexFW_cancel",
			"check": "EEexFW_check",
			"chevron": "EEexFW_chevron",
			"clear": "EEexFW_clear",
			"compact": "EEexFW_compact",
			"confirmActions": "EEexFW_confirmActions",
			"description": "EEexFW_description",
			"draftSummary": "EEexFW_draftSummary",
			"effort": "EEexFW_effort",
			"effortSection": "EEexFW_effortSection",
			"effortUnavailable": "EEexFW_effortUnavailable",
			"efforts": "EEexFW_efforts",
			"empty": "EEexFW_empty",
			"error": "EEexFW_error",
			"favorite": "EEexFW_favorite",
			"group": "EEexFW_group",
			"groupTitle": "EEexFW_groupTitle",
			"groups": "EEexFW_groups",
			"menu": "EEexFW_menu",
			"menuHeader": "EEexFW_menuHeader",
			"modelName": "EEexFW_modelName",
			"modelRow": "EEexFW_modelRow",
			"muted": "EEexFW_muted",
			"option": "EEexFW_option",
			"optionCopy": "EEexFW_optionCopy",
			"retry": "EEexFW_retry",
			"role": "EEexFW_role",
			"root": "EEexFW_root",
			"scopeHint": "EEexFW_scopeHint",
			"search": "EEexFW_search",
			"selected": "EEexFW_selected",
			"selectionEditor": "EEexFW_selectionEditor",
			"source": "EEexFW_source",
			"status": "EEexFW_status",
			"stretch": "EEexFW_stretch",
			"trigger": "EEexFW_trigger",
			"triggerEffort": "EEexFW_triggerEffort",
			"triggerLabel": "EEexFW_triggerLabel",
			"warning": "EEexFW_warning"
		};
		//#endregion
		//#region lib/client/ModelPicker.js
		/** One searchable, keyboard-accessible model menu shared by every surface. */
		function ModelPicker({ sessionId, access, value, onChange, t, disabled, className, placement = "bottom", fallbackLabel, requireSession = false, roleLabel, controlLabel, stretch = false, scopeHint, sourceLabel, onClear, clearLabel, compact = false }) {
			const [catalog, setCatalog] = (0, react.useState)(null);
			const [loading, setLoading] = (0, react.useState)(false);
			const [saving, setSaving] = (0, react.useState)(false);
			const [error, setError] = (0, react.useState)(null);
			const [open, setOpen] = (0, react.useState)(false);
			const [query, setQuery] = (0, react.useState)("");
			const [draft, setDraft] = (0, react.useState)();
			const [inherit, setInherit] = (0, react.useState)(false);
			const savingRef = (0, react.useRef)(false);
			const [position, setPosition] = (0, react.useState)({
				left: 0,
				top: 0,
				height: 480
			});
			const triggerRef = (0, react.useRef)(null);
			const menuRef = (0, react.useRef)(null);
			const searchRef = (0, react.useRef)(null);
			const loadRevision = (0, react.useRef)(0);
			const preferences = (0, react.useSyncExternalStore)(modelPreferences.subscribe, modelPreferences.getSnapshot);
			const id = (0, react.useId)();
			const blocked = disabled || saving;
			const load = () => {
				const revision = ++loadRevision.current;
				setLoading(true);
				setError(null);
				access.loadCatalog().then((next) => {
					if (revision === loadRevision.current) {
						setCatalog(next);
						setLoading(false);
					}
				}).catch((cause) => {
					if (revision === loadRevision.current) {
						setError(cause instanceof Error ? cause.message : String(cause));
						setLoading(false);
					}
				});
			};
			(0, react.useEffect)(() => {
				load();
				return () => {
					loadRevision.current += 1;
				};
			}, [access]);
			const choices = (0, react.useMemo)(() => catalog?.groups.flatMap((group) => group.models.map((model) => ({
				...model,
				provider: group.id,
				providerName: group.name,
				model: model.id
			}))) ?? [], [catalog]);
			const selected = choices.find((row) => row.provider === value?.provider && row.model === value.model);
			const reasoning = selected?.reasoning;
			const effectiveEffort = value?.reasoningEffort ?? reasoning?.defaultEffort;
			const effortLabel = reasoning?.efforts.find((row) => row.id === effectiveEffort)?.name ?? (effectiveEffort || void 0);
			const modelLabel = selected?.name ?? value?.model ?? fallbackLabel ?? t("triggerFallback");
			const fullLabel = [
				controlLabel ?? roleLabel,
				modelLabel,
				effortLabel
			].filter(Boolean).join(" · ");
			const draftModel = choices.find((row) => row.provider === draft?.provider && row.model === draft.model);
			const draftReasoning = draftModel?.reasoning;
			const close = (focus = false) => {
				if (savingRef.current) return;
				setOpen(false);
				if (focus) triggerRef.current?.focus();
			};
			(0, react.useLayoutEffect)(() => {
				if (!open) return;
				const place = () => {
					const trigger = triggerRef.current?.getBoundingClientRect();
					if (trigger === void 0) return;
					const width = Math.min(360, window.innerWidth - 24);
					const above = trigger.top - 12;
					const below = window.innerHeight - trigger.bottom - 12;
					const upwards = placement === "top" ? above >= 240 || above > below : below < 240 && above > below;
					const height = Math.min(520, upwards ? above : below);
					const left = Math.max(12, Math.min(placement === "top" ? trigger.right - width : trigger.left, window.innerWidth - width - 12));
					setPosition({
						left,
						top: upwards ? trigger.top - 8 : trigger.bottom + 8,
						height: Math.max(160, height)
					});
					if (menuRef.current) menuRef.current.dataset.upwards = String(upwards);
				};
				place();
				searchRef.current?.focus();
				const outside = (event) => {
					if (event.target instanceof Node && !menuRef.current?.contains(event.target) && !triggerRef.current?.contains(event.target)) close();
				};
				const dismissOnScroll = (event) => {
					if (!(event.target instanceof Node) || !menuRef.current?.contains(event.target)) close();
				};
				document.addEventListener("pointerdown", outside);
				document.addEventListener("scroll", dismissOnScroll, true);
				window.addEventListener("resize", place);
				return () => {
					document.removeEventListener("pointerdown", outside);
					document.removeEventListener("scroll", dismissOnScroll, true);
					window.removeEventListener("resize", place);
				};
			}, [open, placement]);
			(0, react.useEffect)(() => {
				if (disabled && !saving) close();
			}, [disabled, saving]);
			const commit = (action, next) => {
				if (blocked || savingRef.current) return;
				savingRef.current = true;
				setSaving(true);
				setError(null);
				Promise.resolve().then(action).then(() => {
					if (next) modelPreferences.remember(next);
					savingRef.current = false;
					setSaving(false);
					close(true);
				}).catch((cause) => {
					savingRef.current = false;
					setSaving(false);
					setError(cause instanceof Error ? cause.message : String(cause));
				});
			};
			const pick = (provider, model) => {
				if (blocked) return;
				const row = choices.find((item) => item.provider === provider && item.model === model);
				const current = inherit ? value : draft;
				const next = current?.provider === provider && current.model === model ? { ...current } : value?.provider === provider && value.model === model ? { ...value } : {
					provider,
					model,
					...row?.reasoning?.defaultEffort === void 0 ? {} : { reasoningEffort: row.reasoning.defaultEffort }
				};
				setDraft(next);
				setInherit(false);
			};
			const apply = () => {
				if (inherit && onClear !== void 0) commit(onClear);
				else if (draft !== void 0 && draftModel !== void 0) commit(() => onChange(draft), draft);
			};
			const onKeyDown = (event) => {
				if (event.key === "Escape") {
					event.preventDefault();
					close(true);
					return;
				}
				if (event.key === "Tab") {
					const items = Array.from(menuRef.current?.querySelectorAll("input, button:not(:disabled)") ?? []);
					const at = items.indexOf(document.activeElement);
					if (!event.shiftKey && at === items.length - 1 || event.shiftKey && at === 0) {
						event.preventDefault();
						items[event.shiftKey ? items.length - 1 : 0]?.focus();
					}
					return;
				}
				if (![
					"ArrowDown",
					"ArrowUp",
					"Home",
					"End"
				].includes(event.key)) return;
				if (event.target === searchRef.current && ["Home", "End"].includes(event.key)) return;
				event.preventDefault();
				const items = Array.from(menuRef.current?.querySelectorAll("[data-model-option]:not(:disabled)") ?? []);
				const at = items.indexOf(document.activeElement);
				items[event.key === "Home" ? 0 : event.key === "End" ? items.length - 1 : event.key === "ArrowDown" ? (at + 1) % items.length : at <= 0 ? items.length - 1 : at - 1]?.focus();
			};
			const normalized = query.trim().toLocaleLowerCase();
			const visible = choices.filter((row) => `${row.name} ${row.model} ${row.providerName} ${row.provider}`.toLocaleLowerCase().includes(normalized));
			const groups = normalized ? [{
				label: t("searchResults"),
				rows: visible
			}] : [
				{
					label: t("favorites"),
					rows: choices.filter((row) => preferences.favorites.includes(modelKey(row)))
				},
				{
					label: t("recentModels"),
					rows: preferences.recent.flatMap((key) => choices.filter((row) => modelKey(row) === key))
				},
				...catalog?.groups.map((group) => ({
					label: group.name,
					rows: choices.filter((row) => row.provider === group.id)
				})) ?? []
			];
			if (requireSession && sessionId === void 0) return (0, react_jsx_runtime.jsx)("p", {
				className: ModelPicker_module_css_default.muted,
				children: t("noSession")
			});
			return (0, react_jsx_runtime.jsxs)("div", {
				className: [
					ModelPicker_module_css_default.root,
					compact ? ModelPicker_module_css_default.compact : void 0,
					stretch ? ModelPicker_module_css_default.stretch : void 0,
					className
				].filter(Boolean).join(" "),
				children: [(0, react_jsx_runtime.jsxs)("button", {
					ref: triggerRef,
					type: "button",
					className: ModelPicker_module_css_default.trigger,
					"aria-label": fullLabel,
					"aria-haspopup": "dialog",
					"aria-expanded": open,
					"aria-controls": open ? id : void 0,
					title: fullLabel,
					disabled: blocked,
					onClick: () => {
						if (open) close();
						else {
							setQuery("");
							setDraft(value === void 0 ? void 0 : { ...value });
							setInherit(false);
							setError(null);
							setOpen(true);
							load();
						}
					},
					children: [
						roleLabel && (0, react_jsx_runtime.jsx)("span", {
							className: ModelPicker_module_css_default.role,
							children: roleLabel
						}),
						(0, react_jsx_runtime.jsx)("span", {
							className: ModelPicker_module_css_default.triggerLabel,
							children: modelLabel
						}),
						effortLabel && (0, react_jsx_runtime.jsx)("span", {
							className: ModelPicker_module_css_default.triggerEffort,
							children: effortLabel
						}),
						(0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconChevronDownOutlineMedium, { className: ModelPicker_module_css_default.chevron })
					]
				}), open && (0, react_dom.createPortal)((0, react_jsx_runtime.jsxs)("div", {
					ref: menuRef,
					id,
					role: "dialog",
					"aria-modal": "true",
					"aria-label": controlLabel ?? roleLabel ?? t("menuAria"),
					className: ModelPicker_module_css_default.menu,
					style: {
						left: position.left,
						top: position.top,
						maxHeight: position.height
					},
					onKeyDown,
					children: [
						(0, react_jsx_runtime.jsxs)("header", {
							className: ModelPicker_module_css_default.menuHeader,
							children: [(0, react_jsx_runtime.jsx)("span", { children: controlLabel ?? roleLabel ?? t("menuAria") }), sourceLabel && (0, react_jsx_runtime.jsx)("span", {
								className: ModelPicker_module_css_default.source,
								children: sourceLabel
							})]
						}),
						(0, react_jsx_runtime.jsx)("input", {
							ref: searchRef,
							className: ModelPicker_module_css_default.search,
							value: query,
							onChange: (event) => {
								setQuery(event.target.value);
							},
							placeholder: t("searchPlaceholder"),
							"aria-label": t("searchPlaceholder")
						}),
						error && (0, react_jsx_runtime.jsxs)("div", {
							className: ModelPicker_module_css_default.error,
							role: "alert",
							children: [(0, react_jsx_runtime.jsx)("span", { children: error }), (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: ModelPicker_module_css_default.retry,
								onClick: load,
								children: t("retry")
							})]
						}),
						catalog && value && !selected && !loading && (0, react_jsx_runtime.jsxs)("div", {
							className: ModelPicker_module_css_default.warning,
							role: "alert",
							children: [
								t("routeMissing"),
								" (",
								value.provider,
								"/",
								value.model,
								")"
							]
						}),
						catalog?.failures.length ? (0, react_jsx_runtime.jsxs)("div", {
							className: ModelPicker_module_css_default.warning,
							children: [
								t("catalogPartial"),
								": ",
								catalog.failures.map((row) => row.name).join(", ")
							]
						}) : null,
						(0, react_jsx_runtime.jsxs)("div", {
							className: ModelPicker_module_css_default.groups,
							"aria-busy": loading || saving,
							children: [
								loading && !catalog && (0, react_jsx_runtime.jsx)("div", {
									className: ModelPicker_module_css_default.status,
									children: t("statusLoading")
								}),
								groups.filter((group) => group.rows.length).map((group) => (0, react_jsx_runtime.jsxs)("section", {
									className: ModelPicker_module_css_default.group,
									"aria-label": group.label,
									children: [(0, react_jsx_runtime.jsx)("h4", {
										className: ModelPicker_module_css_default.groupTitle,
										children: group.label
									}), group.rows.map((row) => {
										const key = modelKey(row);
										const favorite = preferences.favorites.includes(key);
										const current = !inherit && row.provider === draft?.provider && row.model === draft.model;
										return (0, react_jsx_runtime.jsxs)("div", {
											className: ModelPicker_module_css_default.modelRow,
											children: [(0, react_jsx_runtime.jsxs)("button", {
												type: "button",
												"data-model-option": true,
												className: [ModelPicker_module_css_default.option, current ? ModelPicker_module_css_default.selected : ""].filter(Boolean).join(" "),
												"aria-pressed": current,
												disabled: blocked,
												title: `${row.name} · ${row.providerName}`,
												onClick: () => {
													pick(row.provider, row.model);
												},
												children: [(0, react_jsx_runtime.jsxs)("span", {
													className: ModelPicker_module_css_default.optionCopy,
													children: [(0, react_jsx_runtime.jsx)("span", {
														className: ModelPicker_module_css_default.modelName,
														children: row.name
													}), (0, react_jsx_runtime.jsxs)("span", {
														className: ModelPicker_module_css_default.description,
														children: [normalized || group.label === t("favorites") || group.label === t("recentModels") ? `${row.providerName} · ` : "", row.description ?? row.model]
													})]
												}), current && (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconCheckOutlineMedium, { className: ModelPicker_module_css_default.check })]
											}), (0, react_jsx_runtime.jsx)("button", {
												type: "button",
												className: ModelPicker_module_css_default.favorite,
												"aria-label": `${t(favorite ? "unfavoriteModel" : "favoriteModel")}: ${row.name}`,
												"aria-pressed": favorite,
												onClick: () => {
													modelPreferences.toggleFavorite(row);
												},
												children: favorite ? "★" : "☆"
											})]
										}, key);
									})]
								}, group.label)),
								!loading && visible.length === 0 && (0, react_jsx_runtime.jsx)("div", {
									className: ModelPicker_module_css_default.empty,
									children: t(normalized ? "noResults" : "emptyModels")
								})
							]
						}),
						onClear && (0, react_jsx_runtime.jsxs)("button", {
							className: ModelPicker_module_css_default.clear,
							type: "button",
							"aria-pressed": inherit,
							disabled: blocked,
							onClick: () => {
								setInherit(true);
							},
							children: [clearLabel ?? t("sessionPickerClear"), inherit && (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconCheckOutlineMedium, { className: ModelPicker_module_css_default.check })]
						}),
						(0, react_jsx_runtime.jsxs)("div", {
							className: ModelPicker_module_css_default.selectionEditor,
							children: [
								(0, react_jsx_runtime.jsxs)("div", {
									className: ModelPicker_module_css_default.draftSummary,
									children: [(0, react_jsx_runtime.jsx)("span", {
										className: ModelPicker_module_css_default.modelName,
										children: inherit ? clearLabel ?? t("sessionPickerClear") : draftModel?.name ?? draft?.model ?? t("triggerFallback")
									}), !inherit && draftModel && (0, react_jsx_runtime.jsx)("span", {
										className: ModelPicker_module_css_default.description,
										children: draftModel.providerName
									})]
								}),
								!inherit && draftModel && (draftReasoning && draftReasoning.efforts.length > 0 ? (0, react_jsx_runtime.jsxs)("section", {
									className: ModelPicker_module_css_default.effortSection,
									"aria-label": t("effortLabel"),
									children: [(0, react_jsx_runtime.jsx)("span", {
										className: ModelPicker_module_css_default.groupTitle,
										children: t("effortLabel")
									}), (0, react_jsx_runtime.jsx)("div", {
										className: ModelPicker_module_css_default.efforts,
										children: [{
											id: void 0,
											name: t("effortDefault"),
											description: void 0
										}, ...draftReasoning.efforts].map((level) => (0, react_jsx_runtime.jsx)("button", {
											type: "button",
											className: ModelPicker_module_css_default.effort,
											"aria-pressed": draft?.reasoningEffort === level.id,
											disabled: blocked,
											title: level.description,
											onClick: () => {
												if (draft === void 0) return;
												setDraft({
													provider: draft.provider,
													model: draft.model,
													...level.id === void 0 ? {} : { reasoningEffort: level.id }
												});
											},
											children: level.name
										}, level.id ?? "default"))
									})]
								}) : (0, react_jsx_runtime.jsx)("p", {
									className: ModelPicker_module_css_default.effortUnavailable,
									children: t("emptyEfforts")
								})),
								(0, react_jsx_runtime.jsxs)("div", {
									className: ModelPicker_module_css_default.confirmActions,
									children: [(0, react_jsx_runtime.jsx)("button", {
										type: "button",
										className: ModelPicker_module_css_default.cancel,
										disabled: saving,
										onClick: () => {
											close(true);
										},
										children: t("cancel")
									}), (0, react_jsx_runtime.jsx)("button", {
										type: "button",
										className: ModelPicker_module_css_default.apply,
										disabled: blocked || !(inherit ? onClear !== void 0 : draftModel !== void 0),
										onClick: apply,
										children: saving ? t("statusSaving") : t("applySelection")
									})]
								})
							]
						}),
						scopeHint && (0, react_jsx_runtime.jsx)("footer", {
							className: ModelPicker_module_css_default.scopeHint,
							children: scopeHint
						})
					]
				}), document.body)]
			});
		}
		//#endregion
		//#region \0dsh-css:/Users/lizi/Documents/dsh/dsh-model-dispatch/src/client/styles.module.css.mjs
		const css$4 = "._2RmTCa_section{width:100%;max-width:820px;color:var(--dsw-alias-label-primary,#27272f);flex-direction:column;gap:16px;padding:6px 0 26px;display:flex}._2RmTCa_settingsHeader{justify-content:space-between;align-items:center;gap:16px;padding-bottom:4px;display:flex}._2RmTCa_title{margin:0;font-size:18px;font-weight:600;line-height:26px}._2RmTCa_saveStatus{color:var(--dsw-alias-label-tertiary,#777784);flex:none;font-size:11px}._2RmTCa_settingsList{container-type:inline-size}._2RmTCa_settingRow{border-bottom:1px solid var(--dsw-alias-border-l2,#dedee3);grid-template-columns:minmax(0,1fr) minmax(220px,320px);align-items:center;gap:24px;padding:24px 0;display:grid}._2RmTCa_settingRow:first-child{padding-top:12px}._2RmTCa_settingRow:last-child{border-bottom:0}._2RmTCa_settingCopy,._2RmTCa_settingControl{min-width:0}._2RmTCa_settingTitle{margin:0;font-size:13px;font-weight:600;line-height:20px}._2RmTCa_settingHint{color:var(--dsw-alias-label-tertiary,#777784);margin:6px 0 0;font-size:11px;line-height:18px}@container (width<=580px){._2RmTCa_settingRow{grid-template-columns:minmax(0,1fr);gap:12px;padding:20px 0}}._2RmTCa_error{color:var(--dsw-alias-state-error-primary,#c0392b);margin:0;font-size:11px;line-height:18px}._2RmTCa_frame{width:100%}._2RmTCa_card{border:1px solid var(--dsw-alias-border-l2,#dedee3);background:var(--dsw-alias-bg-layer-1,#fff);border-radius:14px;overflow:hidden}._2RmTCa_strip{color:var(--dsw-alias-label-primary,#27272f);background:color-mix(in srgb, var(--dsw-alias-state-business-primary,#5269dc) 6%, transparent);align-items:center;gap:8px;padding:13px 16px;font-size:12px;font-weight:600;display:flex}._2RmTCa_dot{background:var(--dsw-alias-state-business-primary,#5269dc);border-radius:50%;width:6px;height:6px}._2RmTCa_body{max-height:min(42vh,28rem);padding:15px 18px;overflow:auto}._2RmTCa_footer{border-top:1px solid var(--dsw-alias-border-l2,#dedee3);flex-direction:column;gap:10px;padding:13px 16px;display:flex}._2RmTCa_feedback{color:var(--dsw-alias-state-error-primary,#c0392b);font-size:11px}._2RmTCa_feedback:empty{display:none}._2RmTCa_actions{flex-wrap:wrap;align-items:center;gap:8px;display:flex}._2RmTCa_actions>:last-child{margin-left:auto}._2RmTCa_planPicker{align-items:center;min-width:0;display:flex}";
		const tagId$4 = "dsh-model-dispatch/styles.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId$4) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "dsh-model-dispatch";
			tag.dataset.pluginCss = tagId$4;
			tag.textContent = css$4;
			document.head.appendChild(tag);
		}
		var styles_module_css_default = {
			"actions": "_2RmTCa_actions",
			"body": "_2RmTCa_body",
			"card": "_2RmTCa_card",
			"dot": "_2RmTCa_dot",
			"error": "_2RmTCa_error",
			"feedback": "_2RmTCa_feedback",
			"footer": "_2RmTCa_footer",
			"frame": "_2RmTCa_frame",
			"planPicker": "_2RmTCa_planPicker",
			"saveStatus": "_2RmTCa_saveStatus",
			"section": "_2RmTCa_section",
			"settingControl": "_2RmTCa_settingControl",
			"settingCopy": "_2RmTCa_settingCopy",
			"settingHint": "_2RmTCa_settingHint",
			"settingRow": "_2RmTCa_settingRow",
			"settingTitle": "_2RmTCa_settingTitle",
			"settingsHeader": "_2RmTCa_settingsHeader",
			"settingsList": "_2RmTCa_settingsList",
			"strip": "_2RmTCa_strip",
			"title": "_2RmTCa_title"
		};
		//#endregion
		//#region lib/client/SettingsSection.js
		/** Three settings rows, with only the scope needed to choose a model. */
		function SettingRow({ title, hint, children }) {
			const id = (0, react.useId)();
			return (0, react_jsx_runtime.jsxs)("section", {
				className: styles_module_css_default.settingRow,
				"aria-labelledby": id,
				children: [(0, react_jsx_runtime.jsxs)("div", {
					className: styles_module_css_default.settingCopy,
					children: [(0, react_jsx_runtime.jsx)("h3", {
						id,
						className: styles_module_css_default.settingTitle,
						children: title
					}), (0, react_jsx_runtime.jsx)("p", {
						className: styles_module_css_default.settingHint,
						children: hint
					})]
				}), (0, react_jsx_runtime.jsx)("div", {
					className: styles_module_css_default.settingControl,
					children
				})]
			});
		}
		function RouteRow({ title, hint, route, save, access, t, busy }) {
			return (0, react_jsx_runtime.jsx)(SettingRow, {
				title,
				hint,
				children: (0, react_jsx_runtime.jsx)(ModelPicker, {
					stretch: true,
					sessionId: void 0,
					access,
					value: resolveCustomSelection(route),
					disabled: busy,
					t,
					controlLabel: title,
					fallbackLabel: route.mode === "custom" ? t("triggerFallback") : t("modeFollow"),
					onChange: (selection) => save({
						mode: "custom",
						selection
					}),
					onClear: route.mode === "custom" ? () => save({
						mode: "follow-main",
						selection: route.selection
					}) : void 0,
					clearLabel: t("modeFollow")
				})
			});
		}
		function SettingsSection(props) {
			if (!props.store || !props.mainStore || !props.access || !props.t) return null;
			return (0, react_jsx_runtime.jsx)(SettingsSectionLoaded, {
				store: props.store,
				mainStore: props.mainStore,
				access: props.access,
				t: props.t
			});
		}
		function SettingsSectionLoaded({ store, mainStore, access, t }) {
			const snap = (0, react.useSyncExternalStore)((listener) => store.subscribe(listener), () => store.getSnapshot());
			const main = (0, react.useSyncExternalStore)((listener) => mainStore.subscribe(listener), () => mainStore.getSnapshot());
			const [saving, setSaving] = (0, react.useState)(false);
			const [message, setMessage] = (0, react.useState)(null);
			const [error, setError] = (0, react.useState)(null);
			const save = async (write) => {
				setSaving(true);
				setMessage(null);
				setError(null);
				try {
					await write();
					setMessage(t("saved"));
				} catch (cause) {
					setError(cause instanceof Error ? cause.message : String(cause));
					throw cause;
				} finally {
					setSaving(false);
				}
			};
			const saveRoute = (field) => (next) => save(() => store.saveRoute(field, next));
			const busy = saving || snap.status !== "ready";
			return (0, react_jsx_runtime.jsxs)("div", {
				className: styles_module_css_default.section,
				"data-model-switch-settings": "",
				children: [
					(0, react_jsx_runtime.jsxs)("header", {
						className: styles_module_css_default.settingsHeader,
						children: [(0, react_jsx_runtime.jsx)("h2", {
							className: styles_module_css_default.title,
							children: t("title")
						}), (0, react_jsx_runtime.jsx)("span", {
							className: styles_module_css_default.saveStatus,
							role: "status",
							children: saving ? t("statusSaving") : message
						})]
					}),
					(error || snap.error) && (0, react_jsx_runtime.jsxs)("p", {
						className: styles_module_css_default.error,
						role: "alert",
						children: [
							t("saveError"),
							": ",
							error ?? t("unavailable")
						]
					}),
					(0, react_jsx_runtime.jsxs)("div", {
						className: styles_module_css_default.settingsList,
						children: [
							(0, react_jsx_runtime.jsx)(SettingRow, {
								title: t("mainTitle"),
								hint: t("mainHint"),
								children: main.status === "error" ? (0, react_jsx_runtime.jsx)("p", {
									className: styles_module_css_default.error,
									children: t("mainUnavailable")
								}) : (0, react_jsx_runtime.jsx)(ModelPicker, {
									stretch: true,
									sessionId: void 0,
									access,
									value: main.value,
									disabled: saving || main.status !== "ready",
									t,
									controlLabel: t("mainTitle"),
									fallbackLabel: main.status === "loading" ? t("statusLoading") : void 0,
									onChange: (next) => save(() => mainStore.save(next))
								})
							}),
							(0, react_jsx_runtime.jsx)(RouteRow, {
								title: t("subagentTitle"),
								hint: t("subagentHint"),
								route: snap.value.subagent ?? { mode: "follow-main" },
								save: saveRoute("subagent"),
								access,
								t,
								busy
							}),
							(0, react_jsx_runtime.jsx)(RouteRow, {
								title: t("planPlanningTitle"),
								hint: t("planPlanningHint"),
								route: snap.value.planPlanning ?? { mode: "follow-main" },
								save: saveRoute("planPlanning"),
								access,
								t,
								busy
							})
						]
					})
				]
			});
		}
		//#endregion
		//#region lib/label.js
		/**
		* Format subagent model readout: `ModelName Context Effort` e.g. `GPT-5.6 Sol 1M Max`.
		*/
		/** Browser-facing map of sessionId → formatted label. */
		const SESSION_LABELS_ROUTE = "/_dsh/model-switch/session-labels";
		/** Browser-facing per-session subagent-model override map. */
		const SESSION_OVERRIDES_ROUTE = "/_dsh/model-switch/session-overrides";
		//#endregion
		//#region lib/client/session-overrides-store.js
		/**
		* Client mirror of the host per-session subagent-model override map.
		*
		* Reads and writes ride the plugin's loopback HTTP routes; the map is small
		* (one entry per overridden session) so a refresh-on-open + poll store keeps
		* the composer picker honest.
		*/
		const INITIAL = {
			value: {},
			error: null,
			unavailable: false,
			version: 0
		};
		/** Poll-backed store keyed by session id. */
		var SessionOverrideStore = class {
			snap = INITIAL;
			listeners = /* @__PURE__ */ new Set();
			timer;
			refs = 0;
			refreshing;
			writeRevision = 0;
			writing = Promise.resolve();
			subscribe = (listener) => {
				this.listeners.add(listener);
				return () => {
					this.listeners.delete(listener);
				};
			};
			getSnapshot = () => this.snap;
			start(intervalMs = 4e3) {
				this.refs += 1;
				if (this.refs > 1) return;
				this.refresh();
				this.timer = window.setInterval(() => {
					this.refresh();
				}, intervalMs);
			}
			stop() {
				this.refs = Math.max(0, this.refs - 1);
				if (this.refs > 0 || this.timer === void 0) return;
				window.clearInterval(this.timer);
				this.timer = void 0;
			}
			/** Override for one session, from the latest snapshot. */
			get(sessionId) {
				return this.snap.value[sessionId];
			}
			/** Whether the host route is missing (host half predates the client). */
			get unavailable() {
				return this.snap.unavailable;
			}
			/** Write one session's override; `undefined` clears it. */
			async set(sessionId, selection) {
				const operation = this.writing.then(() => this.write(sessionId, selection));
				this.writing = operation.catch(() => {});
				await operation;
			}
			async write(sessionId, selection) {
				this.writeRevision += 1;
				try {
					const response = await fetch(SESSION_OVERRIDES_ROUTE, {
						method: "POST",
						credentials: "same-origin",
						headers: { "content-type": "application/json" },
						body: JSON.stringify({
							sessionId,
							selection: selection ?? null
						})
					});
					const body = await response.json().catch(() => void 0);
					if (!response.ok) throw new Error(body?.error?.message ?? `HTTP ${response.status}`);
					if (body?.ok !== true || body.value === void 0) throw new Error("bad session-overrides payload");
					this.snap = {
						value: body.value,
						error: null,
						unavailable: false,
						version: this.snap.version + 1
					};
					this.emit();
				} finally {
					this.writeRevision += 1;
				}
			}
			refresh() {
				return this.refreshing ??= this.fetchSnapshot().finally(() => {
					this.refreshing = void 0;
				});
			}
			async fetchSnapshot() {
				const revision = this.writeRevision;
				try {
					const response = await fetch(SESSION_OVERRIDES_ROUTE, { credentials: "same-origin" });
					if (!response.ok) throw new Error(`HTTP ${response.status}`);
					const body = await response.json();
					if (body.ok !== true || body.value === void 0) throw new Error("bad session-overrides payload");
					if (revision !== this.writeRevision) return;
					this.snap = {
						value: body.value,
						error: null,
						unavailable: false,
						version: this.snap.version + 1
					};
					this.emit();
				} catch (cause) {
					if (revision !== this.writeRevision) return;
					const message = cause instanceof Error ? cause.message : String(cause);
					const missing = message === "HTTP 404" || message === "HTTP 405";
					this.snap = {
						value: this.snap.value,
						error: missing ? null : message,
						unavailable: missing || this.snap.unavailable,
						version: this.snap.version + 1
					};
					this.emit();
				}
			}
			emit() {
				for (const listener of this.listeners) listener();
			}
		};
		//#endregion
		//#region lib/client/SessionModelPicker.js
		/** The main-session chip uses native admission and live projection state. */
		function SessionModelPicker(props) {
			if (!props.access || !props.remote || !props.mainStore || !props.t) return null;
			return (0, react_jsx_runtime.jsx)(SessionModelPickerLoaded, {
				...props,
				access: props.access,
				remote: props.remote,
				mainStore: props.mainStore,
				t: props.t,
				available: props.available === true
			});
		}
		function SessionModelPickerLoaded({ sessionId, useSessions, access, remote, mainStore, t, locked, available }) {
			const projection = useSessions((state) => state.projectionsBySession[sessionId]?.values.modelSelection ?? state.byId[sessionId]?.projectionValues?.modelSelection);
			const main = (0, react.useSyncExternalStore)((listener) => mainStore.subscribe(listener), () => mainStore.getSnapshot());
			const value = projection?.next ?? projection?.lastUsed ?? main.value;
			const save = async (selection) => {
				const result = await remote.session.selectModel({
					sessionId,
					...selection
				});
				if (!result.ok) throw new Error(result.error.message);
			};
			return (0, react_jsx_runtime.jsx)(ModelPicker, {
				compact: true,
				sessionId,
				access,
				value,
				onChange: save,
				t,
				placement: "top",
				roleLabel: t("chatMainRole"),
				disabled: locked || !available,
				scopeHint: t("mainScope"),
				sourceLabel: t(projection?.next || projection?.lastUsed ? "sessionSource" : "defaultSource"),
				seed: false
			});
		}
		//#endregion
		//#region \0dsh-css:/Users/lizi/Documents/dsh/dsh-model-dispatch/src/client/SessionSubagentPicker.module.css.mjs
		const css$3 = "._0_ooPa_wrap{align-items:center;min-width:0;display:inline-flex;position:relative}._0_ooPa_error{max-width:280px;color:var(--dsw-alias-state-error-primary,#c0392b);background:var(--dsw-specific-menu,#fff);border:1px solid var(--dsw-alias-border-l2,#dedee3);overflow-wrap:anywhere;border-radius:8px;padding:6px 9px;font-size:10px;line-height:15px;position:absolute;bottom:calc(100% + 6px);right:0;box-shadow:0 4px 18px #0002}";
		const tagId$3 = "dsh-model-dispatch/SessionSubagentPicker.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId$3) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "dsh-model-dispatch";
			tag.dataset.pluginCss = tagId$3;
			tag.textContent = css$3;
			document.head.appendChild(tag);
		}
		var SessionSubagentPicker_module_css_default = {
			"error": "_0_ooPa_error",
			"wrap": "_0_ooPa_wrap"
		};
		//#endregion
		//#region lib/client/SessionSubagentPicker.js
		/** A clearly labelled child route with an explicit inheritance action. */
		function SessionSubagentPicker(props) {
			if (!props.overrides || !props.access || !props.t || !props.store) return null;
			return (0, react_jsx_runtime.jsx)(SessionSubagentPickerLoaded, {
				...props,
				overrides: props.overrides,
				store: props.store,
				access: props.access,
				t: props.t
			});
		}
		function SessionSubagentPickerLoaded({ sessionId, overrides, store, access, t, useSessions, locked, available }) {
			const snap = (0, react.useSyncExternalStore)(overrides.subscribe, overrides.getSnapshot);
			const settings = (0, react.useSyncExternalStore)((listener) => store.subscribe(listener), () => store.getSnapshot());
			const subagent = useSessions((state) => state.byId[sessionId]?.origin === "subagent");
			const mainSelection = useSessions((state) => state.projectionsBySession[sessionId]?.values.modelSelection ?? state.byId[sessionId]?.projectionValues?.modelSelection);
			(0, react.useEffect)(() => {
				if (subagent) return;
				overrides.start();
				return () => {
					overrides.stop();
				};
			}, [overrides, subagent]);
			if (subagent || available === false || snap.unavailable) return null;
			const override = snap.value[sessionId];
			const defaultRoute = resolveCustomSelection(settings.value.subagent);
			const inherited = defaultRoute ?? mainSelection?.next ?? mainSelection?.lastUsed ?? access.currentSelection(sessionId);
			const write = (selection) => overrides.set(sessionId, selection);
			return (0, react_jsx_runtime.jsxs)("div", {
				className: SessionSubagentPicker_module_css_default.wrap,
				children: [(0, react_jsx_runtime.jsx)(ModelPicker, {
					compact: true,
					disabled: locked,
					sessionId,
					access,
					value: override ?? inherited,
					onChange: write,
					placement: "top",
					roleLabel: t("chatSubagentRole"),
					sourceLabel: t(override ? "sessionSource" : defaultRoute ? "defaultSource" : "followingMain"),
					scopeHint: t("subagentScope"),
					t,
					seed: false,
					onClear: override ? () => overrides.set(sessionId, void 0) : void 0,
					clearLabel: t("sessionPickerClear")
				}), snap.error && (0, react_jsx_runtime.jsxs)("span", {
					className: SessionSubagentPicker_module_css_default.error,
					role: "status",
					children: [
						t("loadError"),
						": ",
						snap.error
					]
				})]
			});
		}
		//#endregion
		//#region \0dsh-css:/Users/lizi/Documents/dsh/dsh-model-dispatch/src/client/SessionModelControls.module.css.mjs
		const css$2 = "._6Jyt5W_bar{flex-wrap:wrap;justify-content:flex-end;align-items:center;gap:6px;min-width:0;display:flex}";
		const tagId$2 = "dsh-model-dispatch/SessionModelControls.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId$2) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "dsh-model-dispatch";
			tag.dataset.pluginCss = tagId$2;
			tag.textContent = css$2;
			document.head.appendChild(tag);
		}
		var SessionModelControls_module_css_default = { "bar": "_6Jyt5W_bar" };
		//#endregion
		//#region lib/client/SessionModelControls.js
		function SessionModelControls(props) {
			return (0, react_jsx_runtime.jsxs)("div", {
				className: SessionModelControls_module_css_default.bar,
				children: [(0, react_jsx_runtime.jsx)(SessionModelPicker, { ...props }), (0, react_jsx_runtime.jsx)(SessionSubagentPicker, { ...props })]
			});
		}
		//#endregion
		//#region lib/client/plan-review.js
		/**
		* Local plan-review narrowing over the official question carrier.
		* The carrier (PendingQuestion/answer protocol) is owned by ui-user-questions;
		* only this pure narrowing lives here.
		*/
		/** The carrier kind is `question` or `plan-review`; both arrive as QuestionWait. */
		function isQuestionCarrier(pendingInteraction) {
			if (typeof pendingInteraction !== "object" || pendingInteraction === null) return false;
			const kind = pendingInteraction.kind;
			return kind === "question" || kind === "plan-review";
		}
		function planReviewOf(questions) {
			if (questions.length !== 1) return void 0;
			const question = questions[0];
			const intent = question.intent;
			if (intent?.kind !== "plan-review" || question.detail === void 0) return void 0;
			if (question.multiSelect === true) return void 0;
			const options = question.options ?? [];
			if (options.length > 2) return void 0;
			const approve = options.find((option) => option.label === intent.approve);
			if (approve === void 0) return void 0;
			const decline = options.find((option) => option.label !== intent.approve);
			return {
				id: question.id,
				question: question.question,
				plan: question.detail,
				approve,
				...decline === void 0 ? {} : { decline }
			};
		}
		//#endregion
		//#region lib/plan-routes.js
		/** Shared read-only route; safe for the client bundle. */
		const PLAN_MAIN_MODELS_ROUTE = "/_dsh/model-switch/plan-main-models";
		//#endregion
		//#region lib/client/PlanReviewPanel.js
		/**
		* Plan review shows the original main model that execution will restore.
		*/
		function tooltip(description) {
			return description === void 0 ? {} : { title: description };
		}
		function PlanReviewPanel({ pending, review, access, t }) {
			const [mainLabel, setMainLabel] = (0, react.useState)();
			const [busy, setBusy] = (0, react.useState)(false);
			const [error, setError] = (0, react.useState)(null);
			const markdownLabels = (0, react.useMemo)(() => ({
				code: {
					copyLabel: t("codeCopy"),
					copiedLabel: t("codeCopied")
				},
				footnotes: t("footnotes")
			}), [t]);
			(0, react.useEffect)(() => {
				let cancelled = false;
				(async () => {
					const response = await fetch(PLAN_MAIN_MODELS_ROUTE);
					if (!response.ok) throw new Error(t("loadError"));
					const main = (await response.json()).value[pending.sessionId];
					if (main === void 0) throw new Error(t("mainUnavailable"));
					let label = main.model;
					try {
						label = ((await access.loadCatalog()).groups.find((group) => group.id === main.provider)?.models.find((row) => row.id === main.model))?.name ?? label;
					} catch {}
					if (main.reasoningEffort !== void 0) label += ` · ${main.reasoningEffort}`;
					if (!cancelled) setMainLabel(label);
				})().catch((cause) => {
					if (!cancelled) setError(cause instanceof Error ? cause.message : String(cause));
				});
				return () => {
					cancelled = true;
				};
			}, [
				pending.sessionId,
				access,
				t
			]);
			const settle = (send) => {
				setBusy(true);
				setError(null);
				send().catch((cause) => {
					setBusy(false);
					setError(cause instanceof Error ? cause.message : String(cause));
				});
			};
			const decide = (label) => {
				settle(() => pending.answer({ answers: [{
					id: review.id,
					selected: [label]
				}] }));
			};
			const decline = review.decline;
			return (0, react_jsx_runtime.jsx)("div", {
				className: styles_module_css_default.frame,
				"data-plan-review-key": pending.key,
				"data-model-switch-plan": "",
				children: (0, react_jsx_runtime.jsxs)("section", {
					className: styles_module_css_default.card,
					"aria-label": review.question,
					children: [
						(0, react_jsx_runtime.jsxs)("div", {
							className: styles_module_css_default.strip,
							children: [(0, react_jsx_runtime.jsx)("span", { className: styles_module_css_default.dot }), t("planHeader")]
						}),
						(0, react_jsx_runtime.jsx)("div", {
							className: styles_module_css_default.body,
							"data-plan-review-scroll": true,
							children: (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.MarkdownText, {
								text: review.plan,
								labels: markdownLabels
							})
						}),
						(0, react_jsx_runtime.jsxs)("div", {
							className: styles_module_css_default.footer,
							children: [(0, react_jsx_runtime.jsx)("div", {
								className: styles_module_css_default.feedback,
								role: "status",
								children: error
							}), (0, react_jsx_runtime.jsxs)("div", {
								className: styles_module_css_default.actions,
								children: [
									(0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
										variant: "ghost",
										icon: (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconEditOutlineMedium, { size: 14 }),
										disabled: busy,
										onClick: () => {
											settle(() => pending.dismiss());
										},
										children: t("planDiscuss")
									}),
									decline !== void 0 && (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
										variant: "outline",
										...tooltip(decline.description),
										disabled: busy,
										onClick: () => {
											decide(decline.label);
										},
										children: t("planDecline")
									}),
									(0, react_jsx_runtime.jsxs)("div", {
										className: styles_module_css_default.planPicker,
										"aria-label": t("planModelLabel"),
										children: [
											t("planModelLabel"),
											"：",
											mainLabel ?? t("statusLoading")
										]
									}),
									(0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
										variant: "primary",
										...tooltip(review.approve.description),
										disabled: busy,
										onClick: () => {
											decide(review.approve.label);
										},
										children: t("planApprove")
									})
								]
							})]
						})
					]
				})
			});
		}
		//#endregion
		//#region lib/client/PlanReviewComposer.js
		/**
		* Composer-chain entry that claims plan-review waits (higher priority than stock).
		* The question carrier is the official ui-user-questions value; the plan-review
		* narrowing is local (plan-review.ts).
		*/
		/** Select only plan-review question waits. */
		function selectPlanReview({ pendingInteraction }) {
			if (!isQuestionCarrier(pendingInteraction)) return null;
			return planReviewOf(pendingInteraction.questions) !== void 0 ? pendingInteraction : null;
		}
		function PlanReviewComposer(props) {
			const { matched, access, t } = props;
			const review = (0, react.useMemo)(() => planReviewOf(matched.questions), [matched]);
			if (access === void 0 || t === void 0 || review === void 0) return null;
			return (0, react_jsx_runtime.jsx)(PlanReviewPanel, {
				pending: matched,
				review,
				access,
				t
			}, matched.key);
		}
		//#endregion
		//#region \0dsh-css:/Users/lizi/Documents/dsh/dsh-model-dispatch/src/client/SubagentModelBadge.module.css.mjs
		const css$1 = "._7gB-bG_badge{min-width:0;max-width:220px;color:var(--dsw-alias-label-tertiary);text-overflow:ellipsis;white-space:nowrap;border-radius:12px;align-items:center;padding:2px 8px;font-size:12px;font-weight:500;line-height:18px;display:inline-flex;overflow:hidden}";
		const tagId$1 = "dsh-model-dispatch/SubagentModelBadge.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId$1) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "dsh-model-dispatch";
			tag.dataset.pluginCss = tagId$1;
			tag.textContent = css$1;
			document.head.appendChild(tag);
		}
		var SubagentModelBadge_module_css_default = { "badge": "_7gB-bG_badge" };
		//#endregion
		//#region lib/client/SubagentModelBadge.js
		/**
		* Session-hierarchy neighbour: show the active subagent's model label.
		*/
		function SubagentModelBadge(props) {
			const { sessionId, useSessions, labels } = props;
			if (labels === void 0) return null;
			const origin = useSessions((state) => state.byId[sessionId]?.origin);
			const snap = (0, react.useSyncExternalStore)(labels.subscribe, labels.getSnapshot);
			(0, react.useEffect)(() => {
				labels.start();
				return () => {
					labels.stop();
				};
			}, [labels]);
			if (origin !== "subagent") return null;
			const text = snap.value[sessionId];
			if (text === void 0 || text.length === 0) return null;
			return (0, react_jsx_runtime.jsx)("span", {
				className: SubagentModelBadge_module_css_default.badge,
				title: text,
				"data-model-switch-badge": "",
				children: text
			});
		}
		//#endregion
		//#region \0dsh-css:/Users/lizi/Documents/dsh/dsh-model-dispatch/src/client/SubagentCatalogAction.module.css.mjs
		const css = ".ZtSlbq_root{position:relative}.ZtSlbq_trigger{min-height:28px;color:var(--dsw-alias-label-tertiary);cursor:pointer;background:0 0;border:0;border-radius:6px;align-items:center;gap:3px;padding:3px 2px;font-size:12px;line-height:18px;display:inline-flex}.ZtSlbq_count{margin:0 5px}.ZtSlbq_activitySlot{flex:none;width:10px;height:10px;display:inline-flex}.ZtSlbq_trigger:hover,.ZtSlbq_trigger:focus-visible{color:var(--dsw-alias-label-secondary)}.ZtSlbq_trigger svg{transition:transform .12s}.ZtSlbq_triggerOpen{transform:rotate(180deg)}.ZtSlbq_menu{z-index:100;box-sizing:border-box;background:var(--dsw-specific-menu);--dsh-scrollbar-thumb:var(--dsw-alias-scrollbar-bg-l2);--dsh-scrollbar-thumb-hover:var(--dsw-alias-scrollbar-hover-l2);width:336px;max-width:min(400px,100vw - 32px);max-height:min(560px,100vh - 140px);box-shadow:var(--dsw-shadow-lv3);border-radius:12px;flex-direction:column;padding:4px;display:flex;position:absolute;top:calc(100% + 5px);left:0;overflow:auto}.ZtSlbq_node{min-width:0;position:relative}.ZtSlbq_menu>.ZtSlbq_node{margin-left:-3px}.ZtSlbq_row{box-sizing:border-box;width:100%;min-height:50px;color:var(--dsw-alias-label-primary);text-align:left;cursor:pointer;background:0 0;border:0;border-radius:8px;outline:none;align-items:flex-start;gap:8px;padding:7px 8px 7px 11px;font-size:13px;line-height:18px;display:flex;position:relative}.ZtSlbq_row:hover>.ZtSlbq_clickarea,.ZtSlbq_row:focus-visible>.ZtSlbq_clickarea{background:var(--dsw-alias-interactive-bg-hover)}.ZtSlbq_clickarea{box-sizing:border-box;border-radius:8px;flex:1;align-self:stretch;align-items:flex-start;gap:8px;min-width:0;margin:-7px -8px;padding:7px 8px;display:flex}.ZtSlbq_row>[data-state],.ZtSlbq_clickarea>[data-state]{margin-top:4px}.ZtSlbq_disabled{color:var(--dsw-alias-label-dimmed);cursor:not-allowed}.ZtSlbq_disabled:hover{background:0 0}.ZtSlbq_loadingRow{cursor:default}.ZtSlbq_disclosure,.ZtSlbq_disclosureSpace{flex:none;width:14px;height:18px}.ZtSlbq_disclosure{color:var(--dsw-alias-label-tertiary);cursor:pointer;background:0 0;border:0;justify-content:center;align-items:center;padding:0;transition:transform .12s;display:inline-flex}.ZtSlbq_disclosure:hover{color:var(--dsw-alias-label-primary)}.ZtSlbq_disclosureOpen{transform:rotate(90deg)}.ZtSlbq_content{flex-direction:column;flex:1;min-width:0;display:flex}.ZtSlbq_label,.ZtSlbq_summary{text-overflow:ellipsis;white-space:nowrap;overflow:hidden}.ZtSlbq_label{color:inherit;font-weight:400}.ZtSlbq_summary,.ZtSlbq_metrics{color:var(--dsw-alias-label-tertiary);font-size:11px;line-height:16px}.ZtSlbq_metrics{font-variant-numeric:tabular-nums;text-align:right;white-space:nowrap;flex-direction:column;flex:none;justify-content:center;align-items:flex-end;gap:0;min-width:0;max-width:148px;display:flex}.ZtSlbq_metricModel{max-width:100%;color:var(--dsw-alias-label-tertiary);text-overflow:ellipsis;font-size:11px;font-weight:500;line-height:16px;overflow:hidden}.ZtSlbq_metricToken{line-height:18px}.ZtSlbq_metricDuration{line-height:16px}.ZtSlbq_children{margin-left:18px;padding-left:4px;position:relative}.ZtSlbq_children:before,.ZtSlbq_children>.ZtSlbq_node:before{content:\"\";border-left:1px solid var(--dsw-alias-border-l2);position:absolute;left:0}.ZtSlbq_children:before{height:26px;top:-26px}.ZtSlbq_children[aria-busy=true]:before{content:none}.ZtSlbq_children>.ZtSlbq_node:before{top:0;bottom:0;left:-4px}.ZtSlbq_children>.ZtSlbq_node:last-child:before{height:17px;bottom:auto}.ZtSlbq_children>.ZtSlbq_node>.ZtSlbq_row:before{content:\"\";border-top:1px solid var(--dsw-alias-border-l2);width:14px;position:absolute;top:16px;left:-4px}.ZtSlbq_notice,.ZtSlbq_error{color:var(--dsw-alias-label-tertiary);padding:10px 12px;font-size:12px;line-height:18px}.ZtSlbq_error{color:var(--dsw-alias-state-error-primary);justify-content:space-between;align-items:center;gap:12px;display:flex}.ZtSlbq_refresh{color:inherit;cursor:pointer;background:0 0;border:0;border-radius:6px;flex:none;align-items:center;gap:4px;padding:4px 6px;display:inline-flex}.ZtSlbq_refresh:hover{background:var(--dsw-alias-interactive-bg-hover)}";
		const tagId = "dsh-model-dispatch/SubagentCatalogAction.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "dsh-model-dispatch";
			tag.dataset.pluginCss = tagId;
			tag.textContent = css;
			document.head.appendChild(tag);
		}
		var SubagentCatalogAction_module_css_default = {
			"activitySlot": "ZtSlbq_activitySlot",
			"children": "ZtSlbq_children",
			"clickarea": "ZtSlbq_clickarea",
			"content": "ZtSlbq_content",
			"count": "ZtSlbq_count",
			"disabled": "ZtSlbq_disabled",
			"disclosure": "ZtSlbq_disclosure",
			"disclosureOpen": "ZtSlbq_disclosureOpen",
			"disclosureSpace": "ZtSlbq_disclosureSpace",
			"error": "ZtSlbq_error",
			"label": "ZtSlbq_label",
			"loadingRow": "ZtSlbq_loadingRow",
			"menu": "ZtSlbq_menu",
			"metricDuration": "ZtSlbq_metricDuration",
			"metricModel": "ZtSlbq_metricModel",
			"metricToken": "ZtSlbq_metricToken",
			"metrics": "ZtSlbq_metrics",
			"node": "ZtSlbq_node",
			"notice": "ZtSlbq_notice",
			"refresh": "ZtSlbq_refresh",
			"root": "ZtSlbq_root",
			"row": "ZtSlbq_row",
			"summary": "ZtSlbq_summary",
			"trigger": "ZtSlbq_trigger",
			"triggerOpen": "ZtSlbq_triggerOpen"
		};
		//#endregion
		//#region lib/client/SubagentCatalogAction.js
		/** Tally subagent-origin descendants (all depths) per parent session id. */
		function indexSubagentDescendants(summaries) {
			const children = /* @__PURE__ */ new Map();
			for (const summary of Object.values(summaries)) {
				if (summary.origin !== "subagent" || summary.parentId === void 0) continue;
				const siblings = children.get(summary.parentId);
				if (siblings === void 0) children.set(summary.parentId, [summary]);
				else siblings.push(summary);
			}
			const index = /* @__PURE__ */ new Map();
			for (const [rootId, roots] of children) {
				let count = 0;
				let runningCount = 0;
				const queue = [...roots];
				while (queue.length > 0) {
					const node = queue.pop();
					count += 1;
					if (node.running) runningCount += 1;
					const grandChildren = children.get(node.id);
					if (grandChildren !== void 0) queue.push(...grandChildren);
				}
				index.set(rootId, {
					count,
					runningCount
				});
			}
			return index;
		}
		function treeItems(root) {
			return root === null ? [] : Array.from(root.querySelectorAll("[role=\"treeitem\"]:not([aria-disabled=\"true\"])"));
		}
		/** Compact token count shared in shape with the conversation stats strip. */
		function formatTokens(value) {
			const scaled = (next) => next >= 100 ? String(Math.round(next)) : String(Math.round(next * 10) / 10);
			if (value < 1e3) return String(value);
			if (value < 1e6) return `${scaled(value / 1e3)}K`;
			return `${scaled(value / 1e6)}M`;
		}
		/** Sum the four disjoint durable provider-usage buckets. */
		function tokenTotal(usage) {
			return usage === void 0 ? void 0 : usage.uncachedInputTokens + usage.outputTokens + usage.cacheReadTokens + usage.cacheWriteTokens;
		}
		/** Exact whole-second active-turn duration for one catalog row. */
		function activityDuration(summary, activity, now) {
			if (summary === void 0) return void 0;
			const timing = summary.projectionValues?.subagentTiming;
			if (timing === void 0) return void 0;
			if (timing.active === void 0) return timing.settledMs;
			const end = activity === "running" ? now : timing.active.through;
			return timing.settledMs + Math.max(0, end - timing.active.since);
		}
		function splitDuration(ms) {
			const totalSeconds = Math.floor(Math.max(0, ms) / 1e3);
			const totalMinutes = Math.floor(totalSeconds / 60);
			const totalHours = Math.floor(totalMinutes / 60);
			return {
				seconds: totalSeconds % 60,
				minutes: totalMinutes % 60,
				hours: totalHours % 24,
				days: Math.floor(totalHours / 24),
				totalMinutes,
				totalHours
			};
		}
		/** Format a duration with decreasing visual precision at larger scales. */
		function formatDuration(ms, t) {
			const { seconds, minutes, hours, days, totalMinutes, totalHours } = splitDuration(ms);
			if (days >= 365) {
				const years = Math.floor(days / 365);
				const months = Math.floor(days % 365 / 30);
				return months === 0 ? t("duration.years", { years }) : t("duration.yearsMonths", {
					years,
					months
				});
			}
			if (days >= 30) {
				const months = Math.floor(days / 30);
				const remainingDays = days % 30;
				return remainingDays === 0 ? t("duration.months", { months }) : t("duration.monthsDays", {
					months,
					days: remainingDays
				});
			}
			if (days > 0) return hours === 0 ? t("duration.days", { days }) : t("duration.daysHours", {
				days,
				hours
			});
			if (totalHours > 0) return t("duration.hours", {
				hours: totalHours,
				minutes: String(minutes).padStart(2, "0"),
				seconds: String(seconds).padStart(2, "0")
			});
			if (totalMinutes > 0) return t("duration.minutes", {
				minutes: totalMinutes,
				seconds: String(seconds).padStart(2, "0")
			});
			return t("duration.seconds", { seconds });
		}
		/** Preserve exact whole seconds for hover and accessible naming. */
		function formatExactDuration(ms, t) {
			const { seconds, minutes, hours, days } = splitDuration(ms);
			return days === 0 ? formatDuration(ms, t) : t("duration.exactDays", {
				days,
				hours: String(hours).padStart(2, "0"),
				minutes: String(minutes).padStart(2, "0"),
				seconds: String(seconds).padStart(2, "0")
			});
		}
		const NO_DESCENDANTS = {
			count: 0,
			runningCount: 0
		};
		/** A child becomes a known leaf only after its own catalog readies empty. */
		function isKnownLeaf(catalog) {
			return catalog?.state === "ready" && catalog.entries.length === 0;
		}
		/** Render one catalog level and recurse only through explicitly expanded rows. */
		function CatalogRows({ parentSessionId, catalog, catalogs, summaries, expanded, level, now, openChild, refresh, toggleBranch, closeCatalog, modelLabels, t }) {
			const emptyLoading = catalog.state === "loading" && catalog.entries.length === 0;
			const reserveDisclosure = catalog.entries.some((entry) => !isKnownLeaf(catalogs[entry.id]));
			return (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [
				emptyLoading && (0, react_jsx_runtime.jsx)("div", {
					className: SubagentCatalogAction_module_css_default.notice,
					children: t("loading.label")
				}),
				catalog.state === "error" && (0, react_jsx_runtime.jsxs)("div", {
					className: SubagentCatalogAction_module_css_default.error,
					children: [(0, react_jsx_runtime.jsx)("span", { children: catalog.error?.message ?? t("load.error") }), (0, react_jsx_runtime.jsxs)("button", {
						type: "button",
						className: SubagentCatalogAction_module_css_default.refresh,
						onClick: () => {
							refresh(parentSessionId);
						},
						children: [(0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconRefreshOutlineMedium, {}), t("retry")]
					})]
				}),
				catalog.entries.map((entry) => {
					const childCatalog = catalogs[entry.id];
					const isExpanded = expanded.has(entry.id);
					const knownLeaf = !reserveDisclosure || isKnownLeaf(childCatalog);
					const childLoading = childCatalog === void 0 || childCatalog.state === "loading" && childCatalog.entries.length === 0;
					const summary = summaries[entry.id];
					const label = entry.label ?? entry.id;
					const mode = entry.mode === "unknown" ? t("mode.unknown") : entry.mode === "one-shot" ? t("mode.oneShot") : t("mode.continuable");
					const activity = entry.activity === "running" ? t("activity.running") : t("activity.inactive");
					const secondary = [
						summary?.title,
						mode,
						activity
					].filter((value) => value !== void 0).join(" · ");
					const projectionValues = summary?.projectionValues;
					const totalTokens = tokenTotal(projectionValues?.tokenUsage);
					const durationMs = activityDuration(summary, entry.activity, now);
					const modelMetric = modelLabels[entry.id];
					const tokenMetric = totalTokens === void 0 ? void 0 : `${formatTokens(totalTokens)} tok`;
					const durationMetric = durationMs === void 0 ? void 0 : {
						compact: formatDuration(durationMs, t),
						exact: formatExactDuration(durationMs, t)
					};
					const metrics = [
						modelMetric,
						tokenMetric,
						durationMetric?.exact
					].filter((value) => value !== void 0).join(" · ");
					const open = () => {
						openChild({
							parentSessionId,
							childSessionId: entry.id,
							mode: entry.mode
						});
						closeCatalog();
					};
					const handleKey = (event) => {
						if (event.key === "Enter" || event.key === " ") {
							event.preventDefault();
							event.stopPropagation();
							open();
						} else if (event.key === "ArrowRight" && !knownLeaf && !isExpanded || event.key === "ArrowLeft" && isExpanded) {
							event.preventDefault();
							event.stopPropagation();
							toggleBranch(entry.id);
						}
					};
					const toggle = (event) => {
						event.preventDefault();
						event.stopPropagation();
						toggleBranch(entry.id);
					};
					return (0, react_jsx_runtime.jsxs)("div", {
						className: SubagentCatalogAction_module_css_default.node,
						children: [(0, react_jsx_runtime.jsxs)("div", {
							role: "treeitem",
							tabIndex: 0,
							"aria-level": level,
							"aria-label": [
								label,
								secondary,
								metrics
							].filter((value) => value !== "").join(" "),
							...knownLeaf ? {} : { "aria-expanded": isExpanded },
							className: SubagentCatalogAction_module_css_default.row,
							onClick: open,
							onKeyDown: handleKey,
							children: [knownLeaf ? reserveDisclosure && (0, react_jsx_runtime.jsx)("span", { className: SubagentCatalogAction_module_css_default.disclosureSpace }) : (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								tabIndex: -1,
								className: `${SubagentCatalogAction_module_css_default.disclosure} ${isExpanded ? SubagentCatalogAction_module_css_default.disclosureOpen : ""}`,
								"aria-label": t(isExpanded ? "branch.collapse" : "branch.expand", { label }),
								onClick: toggle,
								children: (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconChevronRightOutlineMedium, {})
							}), (0, react_jsx_runtime.jsxs)("div", {
								className: SubagentCatalogAction_module_css_default.clickarea,
								children: [
									(0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.StateDot, { state: entry.activity === "running" ? "ongoing" : "done" }),
									(0, react_jsx_runtime.jsxs)("span", {
										className: SubagentCatalogAction_module_css_default.content,
										children: [(0, react_jsx_runtime.jsx)("span", {
											className: SubagentCatalogAction_module_css_default.label,
											children: label
										}), (0, react_jsx_runtime.jsx)("span", {
											className: SubagentCatalogAction_module_css_default.summary,
											children: secondary
										})]
									}),
									(modelMetric !== void 0 || metrics !== "") && (0, react_jsx_runtime.jsxs)("span", {
										className: SubagentCatalogAction_module_css_default.metrics,
										children: [
											modelMetric !== void 0 && (0, react_jsx_runtime.jsx)("span", {
												className: SubagentCatalogAction_module_css_default.metricModel,
												title: modelMetric,
												children: modelMetric
											}),
											tokenMetric !== void 0 && (0, react_jsx_runtime.jsx)("span", {
												className: SubagentCatalogAction_module_css_default.metricToken,
												children: tokenMetric
											}),
											durationMetric !== void 0 && (0, react_jsx_runtime.jsx)("span", {
												className: SubagentCatalogAction_module_css_default.metricDuration,
												title: t("duration.exactTitle", { duration: durationMetric.exact }),
												children: durationMetric.compact
											})
										]
									})
								]
							})]
						}), isExpanded && !knownLeaf && (0, react_jsx_runtime.jsx)("div", {
							role: "group",
							className: SubagentCatalogAction_module_css_default.children,
							"aria-busy": childLoading || void 0,
							children: childCatalog === void 0 ? (0, react_jsx_runtime.jsx)("div", {
								className: SubagentCatalogAction_module_css_default.notice,
								children: t("loading.label")
							}) : (0, react_jsx_runtime.jsx)(CatalogRows, {
								parentSessionId: entry.id,
								catalog: childCatalog,
								catalogs,
								summaries,
								expanded,
								level: level + 1,
								now,
								openChild,
								refresh,
								toggleBranch,
								closeCatalog,
								modelLabels,
								t
							})
						})]
					}, entry.id);
				})
			] });
		}
		/**
		* Render the current session's direct catalog and lazily expanded descendants.
		* @param props - session standard props plus catalog navigation actions.
		* @returns The action while the catalog is pending or summaries establish descendants.
		*/
		function SubagentCatalogAction(props) {
			const { labels, openChild, refresh, t } = props;
			if (labels === void 0 || openChild === void 0 || refresh === void 0 || t === void 0) return null;
			return (0, react_jsx_runtime.jsx)(SubagentCatalogActionLoaded, {
				...props,
				labels,
				openChild,
				refresh,
				t
			});
		}
		function SubagentCatalogActionLoaded({ sessionId, useSessions, useSessionStatus, openChild, refresh, labels, t }) {
			const summaries = useSessions((state) => state.byId);
			const projections = useSessions((state) => state.projectionsBySession);
			const statuses = useSessionStatus((value) => value);
			const modelLabels = (0, react.useSyncExternalStore)(labels.subscribe, labels.getSnapshot).value;
			(0, react.useEffect)(() => {
				labels.start();
				return () => {
					labels.stop();
				};
			}, [labels]);
			const catalogs = (0, react.useMemo)(() => Object.fromEntries(Object.entries(projections).map(([id, snapshot]) => [id, {
				state: snapshot.state === "idle" ? snapshot.values.subagentCatalog === void 0 ? "loading" : "ready" : snapshot.state,
				error: snapshot.error,
				entries: (snapshot.values.subagentCatalog ?? []).map((entry) => ({
					...entry,
					activity: (statuses.get(entry.id)?.running ?? summaries[entry.id]?.running) === true ? "running" : "inactive"
				}))
			}])), [
				projections,
				summaries,
				statuses
			]);
			const catalog = catalogs[sessionId];
			const [open, setOpen] = (0, react.useState)(false);
			const [now, setNow] = (0, react.useState)(() => Date.now());
			const [expanded, setExpanded] = (0, react.useState)(() => /* @__PURE__ */ new Set());
			const rootRef = (0, react.useRef)(null);
			const triggerRef = (0, react.useRef)(null);
			const descendants = (0, react.useMemo)(() => indexSubagentDescendants(summaries).get(sessionId) ?? NO_DESCENDANTS, [sessionId, summaries]);
			const healthy = catalog?.entries ?? [];
			const descendantCount = Math.max(healthy.length, descendants.count);
			const totalCountKey = descendantCount === 1 ? "count.total.one" : "count.total.other";
			const runningCountKey = descendants.runningCount === 1 ? "count.running.one" : "count.running.other";
			const closeAllCatalogs = () => {
				setExpanded(/* @__PURE__ */ new Set());
			};
			const changeOpen = (next, restoreFocus = false) => {
				setOpen(next);
				if (next) setNow(Date.now());
				else closeAllCatalogs();
				if (restoreFocus) queueMicrotask(() => {
					triggerRef.current?.focus();
				});
			};
			const closeBranch = (root) => {
				const closing = /* @__PURE__ */ new Set();
				const visit = (parentSessionId) => {
					if (closing.has(parentSessionId) || !expanded.has(parentSessionId)) return;
					closing.add(parentSessionId);
					for (const entry of catalogs[parentSessionId]?.entries ?? []) visit(entry.id);
				};
				visit(root);
				setExpanded((current) => new Set([...current].filter((id) => !closing.has(id))));
			};
			const toggleBranch = (childSessionId) => {
				if (expanded.has(childSessionId)) {
					closeBranch(childSessionId);
					return;
				}
				setExpanded((current) => new Set(current).add(childSessionId));
			};
			(0, react.useEffect)(() => {
				if (!open) return;
				const closeOutside = (event) => {
					if (event.target instanceof Node && !rootRef.current?.contains(event.target)) changeOpen(false);
				};
				document.addEventListener("pointerdown", closeOutside);
				return () => {
					document.removeEventListener("pointerdown", closeOutside);
				};
			}, [open]);
			(0, react.useEffect)(() => {
				if (!open || descendants.runningCount === 0) return;
				const timer = setInterval(() => {
					setNow(Date.now());
				}, 1e3);
				return () => {
					clearInterval(timer);
				};
			}, [open, descendants.runningCount]);
			const visible = catalog !== void 0 && (catalog.state === "error" || catalog.entries.length > 0 || descendantCount > 0);
			(0, react.useEffect)(() => {
				if (visible || !open) return;
				setOpen(false);
				closeAllCatalogs();
			}, [visible, open]);
			if (!visible) return null;
			const focusAt = (index) => {
				const items = treeItems(rootRef.current);
				if (items.length === 0) return;
				items[(index + items.length) % items.length]?.focus();
			};
			const navigate = (event) => {
				const items = treeItems(rootRef.current);
				const index = items.indexOf(document.activeElement);
				if (event.key === "Escape") {
					event.preventDefault();
					changeOpen(false, true);
				} else if (event.key === "Home") {
					event.preventDefault();
					focusAt(0);
				} else if (event.key === "End") {
					event.preventDefault();
					focusAt(items.length - 1);
				} else if (event.key === "ArrowDown") {
					event.preventDefault();
					focusAt(index + 1);
				} else if (event.key === "ArrowUp") {
					event.preventDefault();
					focusAt(index < 0 ? items.length - 1 : index - 1);
				}
			};
			return (0, react_jsx_runtime.jsxs)("div", {
				className: SubagentCatalogAction_module_css_default.root,
				ref: rootRef,
				onKeyDown: navigate,
				children: [(0, react_jsx_runtime.jsxs)("button", {
					ref: triggerRef,
					type: "button",
					className: SubagentCatalogAction_module_css_default.trigger,
					"aria-haspopup": "tree",
					"aria-expanded": open,
					"aria-label": t(descendants.runningCount > 0 ? runningCountKey : totalCountKey, { count: descendants.runningCount > 0 ? descendants.runningCount : descendantCount }),
					onClick: () => {
						changeOpen(!open);
					},
					onKeyDown: (event) => {
						if (event.key !== "ArrowDown") return;
						event.preventDefault();
						if (!open) changeOpen(true);
						queueMicrotask(() => {
							focusAt(0);
						});
					},
					children: [
						(0, react_jsx_runtime.jsx)("span", {
							className: SubagentCatalogAction_module_css_default.activitySlot,
							children: descendants.runningCount > 0 && (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.StateDot, { state: "ongoing" })
						}),
						(0, react_jsx_runtime.jsx)("span", {
							className: SubagentCatalogAction_module_css_default.count,
							children: t(totalCountKey, { count: descendantCount })
						}),
						(0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconChevronDownOutlineMedium, { className: open ? SubagentCatalogAction_module_css_default.triggerOpen : void 0 })
					]
				}), open && (0, react_jsx_runtime.jsx)("div", {
					className: SubagentCatalogAction_module_css_default.menu,
					role: "tree",
					"aria-label": t("tree.aria"),
					children: (0, react_jsx_runtime.jsx)(CatalogRows, {
						parentSessionId: sessionId,
						catalog,
						catalogs,
						summaries,
						expanded,
						level: 1,
						now,
						openChild,
						refresh,
						toggleBranch,
						closeCatalog: () => {
							changeOpen(false);
						},
						modelLabels,
						t
					})
				})]
			});
		}
		//#endregion
		//#region lib/client/session-label-store.js
		/**
		* Client poll of host session-label map.
		*/
		/**
		* Poll `/_dsh/model-switch/session-labels` for catalog + header badges.
		*/
		var SessionLabelStore = class {
			snap = {
				value: {},
				error: null,
				version: 0
			};
			listeners = /* @__PURE__ */ new Set();
			timer;
			refs = 0;
			subscribe = (listener) => {
				this.listeners.add(listener);
				return () => {
					this.listeners.delete(listener);
				};
			};
			getSnapshot = () => this.snap;
			start(intervalMs = 2e3) {
				this.refs += 1;
				if (this.refs > 1) return;
				this.refresh();
				this.timer = window.setInterval(() => {
					this.refresh();
				}, intervalMs);
			}
			stop() {
				this.refs = Math.max(0, this.refs - 1);
				if (this.refs > 0 || this.timer === void 0) return;
				window.clearInterval(this.timer);
				this.timer = void 0;
			}
			async refresh() {
				try {
					const response = await fetch(SESSION_LABELS_ROUTE, { credentials: "same-origin" });
					if (!response.ok) throw new Error(`HTTP ${response.status}`);
					const body = await response.json();
					if (body.ok !== true || body.value === void 0) throw new Error("bad session-labels payload");
					this.snap = {
						value: body.value,
						error: null,
						version: this.snap.version + 1
					};
					this.emit();
				} catch (cause) {
					this.snap = {
						value: this.snap.value,
						error: cause instanceof Error ? cause.message : String(cause),
						version: this.snap.version + 1
					};
					this.emit();
				}
			}
			emit() {
				for (const listener of this.listeners) listener();
			}
		};
		//#endregion
		//#region lib/client/index.js
		/**
		* Browser half of dsh-model-dispatch: settings, plan-review, subagent model badges.
		*/
		const NS = "model-switch";
		const inject = [
			"slots",
			"locale",
			"sessions",
			"remote",
			"remote.session",
			"uiWorkspace",
			"configForms"
		];
		/** Native entry id owning the deployment main-model default. */
		const AGENT_DEFAULT_MODEL_NS = "agent-default-model";
		function apply(ctx) {
			ctx.effect(() => ctx.locale.register(NS, {
				zh,
				en
			}), "model-switch: dictionaries");
			const t = ctx.locale.bind(NS);
			const sessions = ctx.sessions;
			const store = new ConfigStore(ctx.configForms.get(MODEL_SWITCH_NS));
			const mainStore = new MainModelStore(ctx.configForms.get(AGENT_DEFAULT_MODEL_NS));
			const labels = new SessionLabelStore();
			const overrides = new SessionOverrideStore();
			const remote = ctx.remote;
			const currentSelection = (sessionId) => {
				const row = sessions.list.getSnapshot().byId[sessionId];
				const selection = sessions.list.getSnapshot().projectionsBySession[sessionId]?.values.modelSelection ?? row?.projectionValues?.modelSelection;
				return selection?.next ?? selection?.lastUsed ?? mainStore.getSnapshot().value;
			};
			let catalogRequest;
			let catalogExpires = 0;
			const access = {
				loadCatalog() {
					if (catalogRequest && Date.now() < catalogExpires) return catalogRequest;
					catalogExpires = Date.now() + 15e3;
					catalogRequest = remote.session.modelCatalog().then((result) => {
						if (!result.ok) throw new Error(result.error.message);
						return result.value;
					}).catch((cause) => {
						catalogRequest = void 0;
						throw cause;
					});
					return catalogRequest;
				},
				currentSelection
			};
			const settingsInject = () => ({
				store,
				mainStore,
				access,
				t
			});
			ctx.slots.inject("settings.section", () => ctx.slots.register({
				name: "settings.section",
				id: "model-switch",
				order: 80,
				label: () => t("nav"),
				inject: settingsInject
			}, SettingsSection));
			const planInject = () => ({
				access,
				t
			});
			ctx.slots.inject("conversation.composer", () => ctx.slots.register({
				name: "conversation.composer",
				select: selectPlanReview,
				priority: -10,
				locale: NS,
				inject: planInject
			}, PlanReviewComposer));
			const badgeInject = () => ({ labels });
			ctx.slots.inject("conversation.session.header.actions", () => ctx.slots.register({
				name: "conversation.session.header.actions",
				id: "model-switch-badge",
				order: 5,
				inject: badgeInject
			}, SubagentModelBadge));
			const catalogInject = () => ({
				openChild(address) {
					ctx.uiWorkspace.openSession(address);
				},
				refresh(parentSessionId) {
					sessions.refreshProjections(parentSessionId);
				},
				labels
			});
			ctx.slots.inject("conversation.session.header.actions", () => ctx.slots.register({
				name: "conversation.session.header.actions",
				id: "subagent-catalog",
				order: 10,
				priority: -1,
				locale: "subagent",
				inject: catalogInject
			}, SubagentCatalogAction));
			ctx.slots.inject("conversation.input.model", () => ctx.slots.register({
				name: "conversation.input.model",
				priority: -1,
				locale: NS,
				inject: (sessionId) => ({
					access,
					remote,
					mainStore,
					t,
					overrides,
					store,
					available: sessions.subagentAddress(sessionId) === void 0
				})
			}, SessionModelControls));
		}
		//#endregion
		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	}
});

//# sourceMappingURL=client.js.map