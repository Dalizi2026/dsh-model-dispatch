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
		/** Route identity, including the explicit effort (undefined means provider default). */
		function sameSelection(a, b) {
			return a === b || a != null && b != null && a.provider === b.provider && a.model === b.model && a.reasoningEffort === b.reasoningEffort;
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
			unavailable: "设置暂不可用：DSH 未提供 model-switch 的设置表单。请完全退出并重新打开 DSH；仍不可用时请更新插件或反馈问题。",
			planHeader: "计划待审",
			planDiscuss: "去聊天里说",
			planDecline: "拒绝",
			planApprove: "确认执行",
			planModelLabel: "执行将恢复主模型",
			sessionPickerAria: "选择本会话的子代理模型",
			sessionPickerDefault: "子代理：默认",
			codeCopy: "复制代码",
			codeCopied: "已复制",
			footnotes: "脚注",
			searchPlaceholder: "搜索模型或提供方…",
			searchResults: "搜索结果",
			noResults: "没有匹配的模型，试试其他关键词",
			favorites: "收藏",
			recentModels: "最近使用",
			favoriteChoice: "收藏 {name}",
			unfavoriteChoice: "取消收藏 {name}",
			favoriteAdded: "已收藏 {name}",
			favoriteRemoved: "已取消收藏 {name}",
			favoritesFull: "收藏已满（最多 40 个）",
			effortDefaultShort: "默认",
			staleEffort: "收藏的强度 {effort} 已不可用，已改用默认强度。",
			staleEffortChip: "此强度已不可用",
			catalogPartial: "部分提供方未能加载",
			routeMissing: "当前模型不在此提供方的已加载目录中，请从正确的提供方分组重新选择。",
			chatMainRole: "主模型",
			chatSubagentRole: "子代理",
			sessionSource: "本会话选择",
			defaultSource: "设置默认",
			followingMain: "跟随主模型",
			mainScope: "仅作用于当前会话，新会话继续使用设置页保存的默认模型。",
			subagentScope: "仅影响当前会话之后新启动的子代理，已创建的子代理及其嵌套委派保持锁定模型。",
			cancel: "取消",
			applySelection: "应用",
			routeUnavailable: "无法确认路由保护，请重启 DSH 后重试",
			routeUnverified: "选择已保存；启动子代理时验证并锁定",
			routeUnverifiedShort: "待验证",
			routeSessionMissing: "会话不存在或暂不可用",
			planMainLoadError: "无法读取原主模型",
			routeReady: "新子代理按此选择锁定",
			routeLocked: "已锁定",
			routeBlocked: "请求已阻止",
			routeConfirm: "确认历史子代理模型",
			routeConfirmHint: "确认后保留原上下文继续；此子代理之后始终使用该模型。",
			routeConfirmRequired: "待确认模型，已暂停请求",
			routeExpected: "用户指定",
			routeActual: "最近放行请求",
			routeNoRequest: "尚未放行请求",
			routeSource: "选择来源",
			routeInherited: "继承父子代理锁定",
			routeConfirmed: "用户确认",
			routeConflict: "已忽略工具或预设的冲突选模",
			saved: "已保存",
			statusSaving: "保存中…",
			seamWarning: "功能已降级",
			seamLockPaused: "子代理派发已暂停：DSH 缺少插件需要的接缝，模型锁无法生效。",
			seamLockStrict: "模型锁按保守方式运行：DSH 的事件数据与预期不符，子代理的压缩请求按严格规则检查，可能被拦下。",
			seamPlanOff: "计划自动换模已关闭：DSH 缺少插件需要的接缝。计划模式照常可用，但不再自动切换模型。",
			seamPlanLate: "计划自动换模按保守方式运行：DSH 的事件数据与预期不符，批准计划后主模型可能晚一步恢复。",
			seamChatOff: "聊天栏模型芯片未加载：DSH 缺少插件需要的服务，已改用 DSH 原生模型选择。子代理模型锁仍由宿主执行。",
			seamCatalogOff: "子代理目录未加载：DSH 缺少插件需要的服务，已改用 DSH 原生目录。",
			seamHint: "可能是 DSH 升级改动了接口，请更新插件或反馈问题。",
			seamMissing: "缺少：",
			seamMismatched: "数据格式不符：",
			seamsUnavailable: "无法读取宿主接缝检查结果"
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
			unavailable: "Settings are unavailable: DSH did not provide the model-switch settings form. Quit and reopen DSH; if it persists, update the plugin or report an issue.",
			planHeader: "Plan awaiting review",
			planDiscuss: "Discuss in chat",
			planDecline: "Decline",
			planApprove: "Approve",
			planModelLabel: "Execution restores main model",
			sessionPickerAria: "Pick this session’s subagent model",
			sessionPickerDefault: "Subagents: default",
			codeCopy: "Copy code",
			codeCopied: "Copied",
			footnotes: "Footnotes",
			searchPlaceholder: "Search models or providers…",
			searchResults: "Search results",
			noResults: "No matching models. Try another search.",
			favorites: "Favorites",
			recentModels: "Recently used",
			favoriteChoice: "Add {name} to favorites",
			unfavoriteChoice: "Remove {name} from favorites",
			favoriteAdded: "Added {name} to favorites",
			favoriteRemoved: "Removed {name} from favorites",
			favoritesFull: "Favorites are full (40 max)",
			effortDefaultShort: "Default",
			staleEffort: "The saved effort {effort} is no longer available; using the default.",
			staleEffortChip: "This effort is no longer available",
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
			routeUnavailable: "Routing protection unavailable; restart DSH and retry",
			routeUnverified: "Selection saved; verified and locked when a subagent starts",
			routeUnverifiedShort: "Unverified",
			routeSessionMissing: "Session does not exist or is unavailable",
			planMainLoadError: "Could not load the original main model",
			routeReady: "New subagents will be locked to this selection",
			routeLocked: "Locked",
			routeBlocked: "Requests blocked",
			routeConfirm: "Confirm historical subagent model",
			routeConfirmHint: "Keeps existing context. This subagent will always use the confirmed model.",
			routeConfirmRequired: "Model confirmation required; requests paused",
			routeExpected: "User selection",
			routeActual: "Last admitted request",
			routeNoRequest: "No request admitted yet",
			routeSource: "Selection source",
			routeInherited: "Parent subagent lock",
			routeConfirmed: "User confirmation",
			routeConflict: "Conflicting tool or preset selection ignored",
			saved: "Saved",
			statusSaving: "Saving…",
			seamWarning: "Degraded",
			seamLockPaused: "Subagent dispatch is paused: DSH is missing host seams the model lock needs.",
			seamLockStrict: "The model lock runs conservatively: DSH event data has an unexpected shape, so subagent compaction requests are checked strictly and may be blocked.",
			seamPlanOff: "Plan auto-switch is off: DSH is missing host seams it needs. Plan mode still works but no longer switches models.",
			seamPlanLate: "Plan auto-switch runs conservatively: DSH event data has an unexpected shape, so the main model may be restored one step later after approval.",
			seamChatOff: "The chat model chips did not load: DSH is missing services they need, so the native DSH model picker is shown. The host still enforces the subagent model lock.",
			seamCatalogOff: "The subagent catalog did not load: DSH is missing a service it needs, so the native DSH catalog is shown instead.",
			seamHint: "A DSH update may have changed these interfaces; update the plugin or report an issue.",
			seamMissing: "Missing: ",
			seamMismatched: "Unexpected data: ",
			seamsUnavailable: "Cannot read the host seam check"
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
		const KEY = "dsh-model-switch/picker-v2";
		/** Read only to migrate; never written, so an older plugin keeps its own shortcuts. */
		const LEGACY_KEY = "dsh-model-switch/picker-v1";
		const MAX_HISTORY = 100;
		const RECENT_LIMIT = 6;
		const EMPTY = {
			favorites: [],
			history: []
		};
		const modelKey = (value) => JSON.stringify([value.provider, value.model]);
		const choiceKey = (provider, model, effort) => JSON.stringify([
			provider,
			model,
			effort
		]);
		const effortOf = (value) => value.reasoningEffort ?? null;
		const sameModel = (a, b) => a.provider === b.provider && a.model === b.model;
		function tuple(value) {
			if (!Array.isArray(value) || value.length < 2 || value.length > 3) return void 0;
			const [provider, model, effort] = value;
			if (typeof provider !== "string" || typeof model !== "string" || provider.length === 0 || model.length === 0) return void 0;
			if (value.length === 2) return {
				provider,
				model
			};
			if (effort !== null && (typeof effort !== "string" || effort.length === 0)) return void 0;
			return {
				provider,
				model,
				effort
			};
		}
		function normalize(favorites, history) {
			const combos = /* @__PURE__ */ new Set();
			const savedFavorites = [];
			for (const item of favorites) {
				const choice = tuple(item);
				if (choice?.effort === void 0 || savedFavorites.length === 40) continue;
				const key = choiceKey(choice.provider, choice.model, choice.effort);
				if (combos.has(key)) continue;
				combos.add(key);
				savedFavorites.push({
					provider: choice.provider,
					model: choice.model,
					effort: choice.effort
				});
			}
			const models = /* @__PURE__ */ new Set();
			const savedHistory = [];
			for (const item of history) {
				const choice = tuple(item);
				if (choice === void 0 || models.has(modelKey(choice)) || savedHistory.length === MAX_HISTORY) continue;
				models.add(modelKey(choice));
				savedHistory.push(choice);
			}
			return {
				favorites: savedFavorites,
				history: savedHistory
			};
		}
		const list = (value) => Array.isArray(value) ? value : [];
		/** v1 saved model keys only: favorites keep the provider default, recents keep no effort record. */
		function migrate(raw) {
			if (raw === null) return EMPTY;
			const data = JSON.parse(raw);
			const legacy = (value) => list(value).flatMap((item) => {
				if (typeof item !== "string") return [];
				try {
					const parsed = JSON.parse(item);
					return Array.isArray(parsed) && parsed.length === 2 ? [parsed] : [];
				} catch {
					return [];
				}
			});
			return normalize(legacy(data?.favorites).map((item) => [...item, null]), legacy(data?.recent));
		}
		function read() {
			try {
				const raw = localStorage.getItem(KEY);
				if (raw === null) return migrate(localStorage.getItem(LEGACY_KEY));
				const data = JSON.parse(raw);
				return normalize(list(data?.favorites), list(data?.history));
			} catch {
				return EMPTY;
			}
		}
		function serialize(value) {
			return JSON.stringify({
				version: 2,
				favorites: value.favorites.map((item) => [
					item.provider,
					item.model,
					item.effort
				]),
				history: value.history.map((item) => item.effort === void 0 ? [item.provider, item.model] : [
					item.provider,
					item.model,
					item.effort
				])
			});
		}
		let snapshot = EMPTY;
		let initialized = false;
		const listeners = /* @__PURE__ */ new Set();
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
			snapshot = next;
			try {
				localStorage.setItem(KEY, serialize(next));
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
			/** Adds or removes one exact model + effort; returns false when a new favorite would exceed the limit. */
			toggleFavorite(value) {
				initialize();
				const effort = effortOf(value);
				const key = choiceKey(value.provider, value.model, effort);
				const saved = snapshot.favorites.some((item) => choiceKey(item.provider, item.model, item.effort) === key);
				if (!saved && snapshot.favorites.length >= 40) return false;
				publish({
					...snapshot,
					favorites: saved ? snapshot.favorites.filter((item) => choiceKey(item.provider, item.model, item.effort) !== key) : [...snapshot.favorites, {
						provider: value.provider,
						model: value.model,
						effort
					}]
				});
				return true;
			},
			/** Records an applied selection: it becomes the newest recent and this model's last effort. */
			remember(value) {
				initialize();
				publish({
					...snapshot,
					history: [{
						provider: value.provider,
						model: value.model,
						effort: effortOf(value)
					}, ...snapshot.history.filter((item) => !sameModel(item, value))].slice(0, MAX_HISTORY)
				});
			}
		};
		function hasFavorite(preferences, provider, model, effort) {
			return preferences.favorites.some((item) => item.provider === provider && item.model === model && item.effort === effort);
		}
		const isFavorite = (preferences, value) => hasFavorite(preferences, value.provider, value.model, effortOf(value));
		/**
		* Effort for a model picked by name: the effort last applied with it when the
		* model still supports it, otherwise the adapter default. Undefined means the
		* provider default.
		*/
		function startingEffort(preferences, choice) {
			const last = preferences.history.find((item) => sameModel(item, choice))?.effort;
			if (last === null) return void 0;
			if (last !== void 0 && choice.reasoning?.efforts.some((level) => level.id === last)) return last;
			return choice.reasoning?.defaultEffort;
		}
		/** Saved efforts in the model's own order; provider default first, unsupported ones last. */
		function chips(choice, efforts, defaultName) {
			const supported = choice.reasoning?.efforts ?? [];
			const result = [];
			if (supported.length > 0 && efforts.includes(null)) result.push({
				effort: null,
				name: defaultName,
				stale: false
			});
			for (const level of supported) if (efforts.includes(level.id)) result.push({
				effort: level.id,
				name: level.name,
				stale: false
			});
			for (const effort of efforts) if (effort !== null && !supported.some((level) => level.id === effort)) result.push({
				effort,
				name: effort,
				stale: true
			});
			return result;
		}
		/** One row per favorited model, in catalog order; models absent from the catalog stay hidden but saved. */
		function favoriteRows(preferences, choices, defaultName) {
			return choices.flatMap((choice) => {
				const saved = preferences.favorites.filter((item) => sameModel(item, choice));
				if (saved.length === 0) return [];
				const modelFavorite = (choice.reasoning?.efforts.length ?? 0) === 0 && saved.some((item) => item.effort === null);
				return [{
					choice,
					chips: chips(choice, saved.map((item) => item.effort), defaultName),
					...modelFavorite ? { modelFavorite } : {}
				}];
			});
		}
		/** The last applied models with their efforts, skipping combinations already in favorites. */
		function recentRows(preferences, choices, defaultName) {
			return preferences.history.slice(0, RECENT_LIMIT).flatMap((entry) => {
				if (entry.effort !== void 0 && hasFavorite(preferences, entry.provider, entry.model, entry.effort)) return [];
				const choice = choices.find((item) => sameModel(item, entry));
				if (choice === void 0) return [];
				return [{
					choice,
					chips: entry.effort === void 0 ? [] : chips(choice, [entry.effort], defaultName).filter((chip) => !chip.stale)
				}];
			});
		}
		//#endregion
		//#region \0dsh-css:/Users/Miu/Library/Mobile Documents/com~apple~CloudDocs/Workspace/DSH子代理插件/src/client/ModelPicker.module.css.mjs
		const css$5 = "._6JZS8W_root{min-width:0;position:relative}._6JZS8W_trigger{border:1px solid var(--dsw-alias-border-l2,#dedee3);background:var(--dsw-alias-bg-layer-1,#fff);min-width:0;max-width:248px;height:30px;color:var(--dsw-alias-label-primary,#27272f);font:inherit;cursor:pointer;border-radius:8px;outline:none;align-items:center;gap:6px;padding:0 8px;font-size:13px;line-height:20px;display:inline-flex}._6JZS8W_trigger:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover,#f3f3f7)}._6JZS8W_trigger:focus-visible{outline:2px solid var(--dsw-alias-state-business-primary,#5269dc);outline-offset:2px}._6JZS8W_trigger:disabled{opacity:.6;cursor:default}._6JZS8W_role{color:var(--dsw-alias-label-secondary,#555560);flex:none;font-weight:400}._6JZS8W_triggerLabel{text-overflow:ellipsis;white-space:nowrap;min-width:0;max-width:168px;font-weight:500;overflow:hidden}._6JZS8W_triggerEffort{color:var(--dsw-alias-label-secondary,#555560);flex:none}._6JZS8W_chevron{width:12px;height:12px;color:var(--dsw-alias-label-tertiary,#777784);flex:none;transition:transform .12s ease-out}._6JZS8W_trigger[aria-expanded=true] ._6JZS8W_chevron{transform:rotate(180deg)}._6JZS8W_menu{z-index:10000;border:1px solid var(--dsw-alias-border-l2,#dedee3);background:var(--dsw-alias-bg-layer-1,#fff);width:min(360px,100vw - 24px);color:var(--dsw-alias-label-primary,#27272f);box-sizing:border-box;border-radius:14px;flex-direction:column;padding:8px;display:flex;position:fixed;overflow:hidden;box-shadow:0 12px 40px #0002,0 2px 8px #0001}._6JZS8W_menu[data-upwards=true]{transform:translateY(-100%)}._6JZS8W_menuHeader{justify-content:space-between;align-items:center;gap:12px;padding:3px 4px 9px;font-size:13px;font-weight:600;display:flex}._6JZS8W_source{color:var(--dsw-alias-state-business-primary,#5269dc);background:color-mix(in srgb, var(--dsw-alias-state-business-primary,#5269dc) 9%, transparent);border-radius:4px;padding:2px 6px;font-size:10px;font-weight:500}._6JZS8W_search{box-sizing:border-box;border:1px solid var(--dsw-alias-border-l2,#dedee3);background:var(--dsw-alias-interactive-bg-hover,#f3f3f7);width:100%;height:34px;color:inherit;font:inherit;border-radius:8px;outline:none;flex:none;padding:0 10px;font-size:12px}._6JZS8W_search:focus{border-color:var(--dsw-alias-state-business-primary,#5269dc)}._6JZS8W_groups{overscroll-behavior:contain;flex:auto;min-height:44px;padding-top:4px;overflow-y:auto}._6JZS8W_group+._6JZS8W_group{border-top:1px solid var(--dsw-alias-border-l2,#dedee3);margin-top:5px;padding-top:4px}._6JZS8W_groupTitle{color:var(--dsw-alias-label-tertiary,#777784);margin:0;padding:6px 5px;font-size:10px;font-weight:600;line-height:14px;display:block}._6JZS8W_modelRow{align-items:center;gap:2px;display:flex}._6JZS8W_option{min-width:0;min-height:44px;color:inherit;text-align:left;cursor:pointer;background:0 0;border:0;border-radius:8px;outline:none;flex:1;align-items:center;gap:8px;padding:7px 8px;display:flex}._6JZS8W_option:hover:not(:disabled),._6JZS8W_option:focus-visible{background:var(--dsw-alias-interactive-bg-hover,#f3f3f7)}._6JZS8W_option:disabled{opacity:.6;cursor:default}._6JZS8W_selected{background:color-mix(in srgb, var(--dsw-alias-state-business-primary,#5269dc) 8%, transparent)}._6JZS8W_optionCopy{flex-direction:column;flex:1;gap:2px;min-width:0;display:flex}._6JZS8W_modelName{font-size:12px;font-weight:500;line-height:17px}._6JZS8W_description{color:var(--dsw-alias-label-tertiary,#777784);font-size:10px;line-height:15px}._6JZS8W_modelName,._6JZS8W_description{text-overflow:ellipsis;white-space:nowrap;overflow:hidden}._6JZS8W_check{width:14px;color:var(--dsw-alias-state-business-primary,#5269dc);flex:none}._6JZS8W_effortSection{flex:none;padding:4px 0 10px}._6JZS8W_efforts{flex-wrap:wrap;gap:4px;display:flex}._6JZS8W_effort{border:1px solid var(--dsw-alias-border-l2,#dedee3);height:25px;color:var(--dsw-alias-label-secondary,#555560);cursor:pointer;font:inherit;white-space:nowrap;background:0 0;border-radius:6px;outline:none;padding:0 8px;font-size:10px;transition:transform .1s ease-out}._6JZS8W_effort:hover:not(:disabled):not([aria-pressed=true]){background:var(--dsw-alias-interactive-bg-hover,#f3f3f7)}._6JZS8W_effort:active:not(:disabled){transform:scale(.96)}._6JZS8W_effort:focus-visible{outline:2px solid var(--dsw-alias-state-business-primary,#5269dc);outline-offset:1px}._6JZS8W_effort:disabled{opacity:.6;cursor:default}._6JZS8W_effort[aria-pressed=true]{border-color:var(--dsw-alias-state-business-primary,#5269dc);color:var(--dsw-alias-state-business-primary,#5269dc);background:color-mix(in srgb, var(--dsw-alias-state-business-primary,#5269dc) 9%, transparent)}._6JZS8W_effort[data-stale=true]{color:var(--dsw-alias-label-tertiary,#777784);opacity:.55;text-decoration:line-through}._6JZS8W_rowChips{flex:none;align-items:center;gap:6px;padding:0 6px 0 2px;display:flex}._6JZS8W_rowChip{height:24px;padding:0 7px}._6JZS8W_chipWrap{display:inline-flex;position:relative}._6JZS8W_chipStar,._6JZS8W_rowStar{color:var(--dsw-alias-state-business-primary,#5269dc);cursor:pointer;border:0;outline:none;padding:0;line-height:1;transition:opacity .12s ease-out,transform .12s ease-out}._6JZS8W_chipStar{background:var(--dsw-alias-bg-layer-1,#fff);width:16px;height:16px;box-shadow:0 0 0 1px var(--dsw-alias-border-l2,#dedee3), 0 1px 3px #0002;opacity:0;pointer-events:none;border-radius:50%;justify-content:center;align-items:center;font-size:9px;display:inline-flex;position:absolute;top:-7px;right:-6px;transform:scale(.85)}._6JZS8W_rowStar{opacity:0;pointer-events:none;background:0 0;border-radius:7px;flex:none;width:28px;height:28px;margin-right:4px;font-size:15px}._6JZS8W_chipWrap:hover ._6JZS8W_chipStar,._6JZS8W_chipWrap:focus-within ._6JZS8W_chipStar,._6JZS8W_chipWrap[data-ghost=true] ._6JZS8W_chipStar,._6JZS8W_modelRow:hover ._6JZS8W_rowStar,._6JZS8W_modelRow:focus-within ._6JZS8W_rowStar,._6JZS8W_modelRow[data-ghost=true] ._6JZS8W_rowStar{opacity:1;pointer-events:auto;transform:none}._6JZS8W_chipStar:hover:not(:disabled),._6JZS8W_rowStar:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover,#f3f3f7)}._6JZS8W_chipStar:active:not(:disabled),._6JZS8W_rowStar:active:not(:disabled){transform:scale(.9)}._6JZS8W_chipStar:disabled,._6JZS8W_rowStar:disabled{color:var(--dsw-alias-label-tertiary,#888894);cursor:default}._6JZS8W_chipWrap[data-ghost=true] ._6JZS8W_effort{color:var(--dsw-alias-label-tertiary,#777784);background:0 0;border-style:dashed}._6JZS8W_chipWrap[data-ghost=true] ._6JZS8W_chipStar,._6JZS8W_modelRow[data-ghost=true] ._6JZS8W_rowStar{color:var(--dsw-alias-label-tertiary,#888894)}@media (hover:none){._6JZS8W_chipStar,._6JZS8W_rowStar{opacity:1;pointer-events:auto;transform:none}}._6JZS8W_clear{border:0;border-top:1px solid var(--dsw-alias-border-l2,#dedee3);width:100%;color:var(--dsw-alias-label-secondary,#555560);text-align:left;font:inherit;cursor:pointer;background:0 0;flex:none;justify-content:space-between;align-items:center;margin-top:5px;padding:9px 8px;font-size:12px;display:flex}._6JZS8W_scopeHint{color:var(--dsw-alias-label-tertiary,#777784);border-top:1px solid var(--dsw-alias-border-l2,#dedee3);flex:none;padding:8px 4px 3px;font-size:10px;line-height:15px}._6JZS8W_status,._6JZS8W_empty,._6JZS8W_muted{color:var(--dsw-alias-label-tertiary,#777784);padding:14px 7px;font-size:12px}._6JZS8W_error{background:color-mix(in srgb, var(--dsw-alias-state-error-primary,#c0392b) 8%, transparent);color:var(--dsw-alias-state-error-primary,#c0392b);overflow-wrap:anywhere;border-radius:7px;justify-content:space-between;gap:8px;margin-top:6px;padding:8px;font-size:11px;line-height:16px;display:flex}._6JZS8W_retry{color:inherit;font:inherit;cursor:pointer;background:0 0;border:0;flex:none;padding:0}._6JZS8W_warning{color:var(--dsw-alias-label-tertiary,#777784);padding:6px 4px;font-size:10px}@media (width<=640px){._6JZS8W_trigger{max-width:190px}._6JZS8W_triggerEffort{display:none}}._6JZS8W_compact ._6JZS8W_trigger{border-radius:var(--dsw-radius-sm,6px);background:0 0;border-color:#0000;gap:5px;max-width:260px;height:28px;padding:0 6px 0 8px}._6JZS8W_compact ._6JZS8W_trigger:hover:not(:disabled),._6JZS8W_compact ._6JZS8W_trigger[aria-expanded=true]{background:var(--dsw-alias-interactive-bg-hover,#f3f3f7)}._6JZS8W_compact ._6JZS8W_triggerLabel{max-width:140px;display:var(--dsh-composer-model-text-display,block)}._6JZS8W_compact ._6JZS8W_triggerEffort{display:var(--dsh-composer-model-text-display,inline)}._6JZS8W_stretch ._6JZS8W_trigger{width:100%;max-width:none;height:36px;padding:0 11px}._6JZS8W_stretch ._6JZS8W_triggerLabel{text-align:left;flex:1;max-width:none}._6JZS8W_stretch ._6JZS8W_triggerEffort{display:inline}@media (width<=640px){._6JZS8W_compact ._6JZS8W_triggerEffort{display:none}}._6JZS8W_clear[aria-pressed=true]{color:var(--dsw-alias-state-business-primary,#5269dc)}._6JZS8W_selectionEditor{border-top:1px solid var(--dsw-alias-border-l2,#dedee3);flex:none;padding:10px 4px 2px}._6JZS8W_draftSummary{align-items:center;gap:8px;min-width:0;display:flex}._6JZS8W_draftCopy{flex-direction:column;flex:1;gap:2px;min-width:0;display:flex}._6JZS8W_favoriteToggle{width:30px;height:30px;color:var(--dsw-alias-label-tertiary,#888894);cursor:pointer;background:0 0;border:0;border-radius:7px;outline:none;flex:none;justify-content:center;align-items:center;padding:0;font-size:17px;line-height:1;transition:transform .1s ease-out;display:inline-flex}._6JZS8W_favoriteToggle[aria-pressed=true]{color:var(--dsw-alias-state-business-primary,#5269dc)}._6JZS8W_favoriteToggle:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover,#f3f3f7)}._6JZS8W_favoriteToggle:active:not(:disabled){transform:scale(.96)}._6JZS8W_favoriteToggle:focus-visible{outline:2px solid var(--dsw-alias-state-business-primary,#5269dc);outline-offset:1px}._6JZS8W_favoriteToggle:disabled{opacity:.4;cursor:default}._6JZS8W_star{display:inline-block}._6JZS8W_notice{color:var(--dsw-alias-label-tertiary,#777784);margin:6px 0 0;font-size:10px;line-height:15px}._6JZS8W_visuallyHidden{clip-path:inset(50%);white-space:nowrap;width:1px;height:1px;position:absolute;overflow:hidden}._6JZS8W_effortUnavailable{color:var(--dsw-alias-label-tertiary,#777784);margin:6px 0 10px;font-size:10px}._6JZS8W_confirmActions{justify-content:flex-end;align-items:center;gap:8px;padding-top:4px;display:flex}._6JZS8W_cancel,._6JZS8W_apply{border:1px solid var(--dsw-alias-border-l2,#dedee3);height:30px;font:inherit;cursor:pointer;border-radius:7px;padding:0 13px;font-size:12px}._6JZS8W_cancel{color:var(--dsw-alias-label-secondary,#555560);background:0 0}._6JZS8W_apply{background:var(--dsw-alias-state-business-primary,#5269dc);color:#fff;border-color:#0000}._6JZS8W_cancel:disabled,._6JZS8W_apply:disabled{opacity:.5;cursor:default}._6JZS8W_cancel:focus-visible,._6JZS8W_apply:focus-visible{outline:2px solid var(--dsw-alias-state-business-primary,#5269dc);outline-offset:2px}@media (prefers-reduced-motion:reduce){._6JZS8W_effort,._6JZS8W_favoriteToggle,._6JZS8W_chevron{transition:none}._6JZS8W_chipStar,._6JZS8W_rowStar{transition:opacity .12s ease-out;transform:none}._6JZS8W_effort:active:not(:disabled),._6JZS8W_favoriteToggle:active:not(:disabled),._6JZS8W_chipStar:active:not(:disabled),._6JZS8W_rowStar:active:not(:disabled){transform:none}}";
		const tagId$5 = "dsh-model-dispatch/ModelPicker.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId$5) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "dsh-model-dispatch";
			tag.dataset.pluginCss = tagId$5;
			tag.textContent = css$5;
			document.head.appendChild(tag);
		}
		var ModelPicker_module_css_default = {
			"apply": "_6JZS8W_apply",
			"cancel": "_6JZS8W_cancel",
			"check": "_6JZS8W_check",
			"chevron": "_6JZS8W_chevron",
			"chipStar": "_6JZS8W_chipStar",
			"chipWrap": "_6JZS8W_chipWrap",
			"clear": "_6JZS8W_clear",
			"compact": "_6JZS8W_compact",
			"confirmActions": "_6JZS8W_confirmActions",
			"description": "_6JZS8W_description",
			"draftCopy": "_6JZS8W_draftCopy",
			"draftSummary": "_6JZS8W_draftSummary",
			"effort": "_6JZS8W_effort",
			"effortSection": "_6JZS8W_effortSection",
			"effortUnavailable": "_6JZS8W_effortUnavailable",
			"efforts": "_6JZS8W_efforts",
			"empty": "_6JZS8W_empty",
			"error": "_6JZS8W_error",
			"favoriteToggle": "_6JZS8W_favoriteToggle",
			"group": "_6JZS8W_group",
			"groupTitle": "_6JZS8W_groupTitle",
			"groups": "_6JZS8W_groups",
			"menu": "_6JZS8W_menu",
			"menuHeader": "_6JZS8W_menuHeader",
			"modelName": "_6JZS8W_modelName",
			"modelRow": "_6JZS8W_modelRow",
			"muted": "_6JZS8W_muted",
			"notice": "_6JZS8W_notice",
			"option": "_6JZS8W_option",
			"optionCopy": "_6JZS8W_optionCopy",
			"retry": "_6JZS8W_retry",
			"role": "_6JZS8W_role",
			"root": "_6JZS8W_root",
			"rowChip": "_6JZS8W_rowChip",
			"rowChips": "_6JZS8W_rowChips",
			"rowStar": "_6JZS8W_rowStar",
			"scopeHint": "_6JZS8W_scopeHint",
			"search": "_6JZS8W_search",
			"selected": "_6JZS8W_selected",
			"selectionEditor": "_6JZS8W_selectionEditor",
			"source": "_6JZS8W_source",
			"star": "_6JZS8W_star",
			"status": "_6JZS8W_status",
			"stretch": "_6JZS8W_stretch",
			"trigger": "_6JZS8W_trigger",
			"triggerEffort": "_6JZS8W_triggerEffort",
			"triggerLabel": "_6JZS8W_triggerLabel",
			"visuallyHidden": "_6JZS8W_visuallyHidden",
			"warning": "_6JZS8W_warning"
		};
		//#endregion
		//#region lib/client/ModelPicker.js
		/** One searchable, keyboard-accessible model menu shared by every surface. */
		const withEffort = (provider, model, effort) => ({
			provider,
			model,
			...effort === void 0 ? {} : { reasoningEffort: effort }
		});
		/** Star lighting: a short critically damped settle, skipped under reduced motion. */
		function settle(element) {
			if (element === null || typeof element.animate !== "function") return;
			if (typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
			element.animate([{ transform: "scale(0.85)" }, { transform: "scale(1)" }], {
				duration: 250,
				easing: "cubic-bezier(0.2, 0, 0, 1)"
			});
		}
		function ModelPicker({ sessionId, access, value, onChange, t, disabled, className, placement = "bottom", fallbackLabel, requireSession = false, roleLabel, controlLabel, stretch = false, scopeHint, sourceLabel, onClear, clearLabel, compact = false }) {
			const [catalog, setCatalog] = (0, react.useState)(null);
			const [loading, setLoading] = (0, react.useState)(false);
			const [saving, setSaving] = (0, react.useState)(false);
			const [error, setError] = (0, react.useState)(null);
			const [open, setOpen] = (0, react.useState)(false);
			const [query, setQuery] = (0, react.useState)("");
			const [draft, setDraft] = (0, react.useState)();
			const [inherit, setInherit] = (0, react.useState)(false);
			const [notice, setNotice] = (0, react.useState)(null);
			const [announcement, setAnnouncement] = (0, react.useState)("");
			const [ghosts, setGhosts] = (0, react.useState)([]);
			const savingRef = (0, react.useRef)(false);
			const [position, setPosition] = (0, react.useState)({
				left: 0,
				top: 0,
				height: 480
			});
			const triggerRef = (0, react.useRef)(null);
			const menuRef = (0, react.useRef)(null);
			const searchRef = (0, react.useRef)(null);
			const starRef = (0, react.useRef)(null);
			const loadRevision = (0, react.useRef)(0);
			const preferences = (0, react.useSyncExternalStore)(modelPreferences.subscribe, modelPreferences.getSnapshot);
			const shown = (0, react.useMemo)(() => {
				const kept = ghosts.filter((item) => !hasFavorite(preferences, item.provider, item.model, item.effort));
				return kept.length === 0 ? preferences : {
					...preferences,
					favorites: [...preferences.favorites, ...kept]
				};
			}, [preferences, ghosts]);
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
			const draftEffortName = draft !== void 0 && draftReasoning !== void 0 && draftReasoning.efforts.length > 0 ? draftReasoning.efforts.find((level) => level.id === draft.reasoningEffort)?.name ?? draft.reasoningEffort ?? t("effortDefault") : void 0;
			const draftTitle = [draftModel?.name ?? draft?.model, draftEffortName].filter(Boolean).join(" · ");
			const draftFavorite = draft !== void 0 && isFavorite(preferences, draft);
			const favoritesFull = !draftFavorite && preferences.favorites.length >= 40;
			const unchanged = !inherit && sameSelection(draft, value);
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
			/** A model name: keep the effort already chosen for it here, else its last applied effort, else the default. */
			const pick = (row) => {
				if (blocked) return;
				const current = inherit ? value : draft;
				const next = current?.provider === row.provider && current.model === row.model ? { ...current } : value?.provider === row.provider && value.model === row.model ? { ...value } : withEffort(row.provider, row.model, startingEffort(preferences, row));
				setDraft(next);
				setInherit(false);
				setNotice(null);
			};
			/** An effort chip: exactly that combination, or the default when the saved effort is gone. */
			const pickChip = (row, chip) => {
				if (blocked) return;
				if (chip.stale) {
					setDraft(withEffort(row.provider, row.model, row.reasoning?.defaultEffort));
					setNotice(t("staleEffort").replace("{effort}", chip.name));
				} else {
					setDraft(withEffort(row.provider, row.model, chip.effort ?? void 0));
					setNotice(null);
				}
				setInherit(false);
			};
			/** One star toggle for the editor, chip badges, and model-only rows; a removal leaves a restorable placeholder. */
			const toggleChoice = (provider, model, effort, title, star) => {
				const adding = !hasFavorite(preferences, provider, model, effort);
				if (!modelPreferences.toggleFavorite(withEffort(provider, model, effort ?? void 0))) return;
				const same = (item) => item.provider === provider && item.model === model && item.effort === effort;
				setGhosts((current) => adding ? current.filter((item) => !same(item)) : [...current.filter((item) => !same(item)), {
					provider,
					model,
					effort
				}]);
				setAnnouncement(t(adding ? "favoriteAdded" : "favoriteRemoved").replace("{name}", title));
				if (adding) settle(star);
			};
			const toggleFavorite = () => {
				if (draft === void 0 || draftModel === void 0) return;
				toggleChoice(draft.provider, draft.model, effortOf(draft), draftTitle, starRef.current);
			};
			const apply = () => {
				if (inherit && onClear !== void 0) commit(onClear);
				else if (!unchanged && draft !== void 0 && draftModel !== void 0) commit(() => onChange(draft), draft);
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
				const active = document.activeElement instanceof HTMLElement ? document.activeElement : null;
				const row = active?.closest("[data-model-row]");
				if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
					if (!row) return;
					const items = Array.from(row.querySelectorAll("[data-model-option]:not(:disabled), [data-effort-chip]:not(:disabled)"));
					const at = items.indexOf(active);
					if (at < 0) return;
					event.preventDefault();
					items[event.key === "ArrowRight" ? Math.min(at + 1, items.length - 1) : Math.max(at - 1, 0)]?.focus();
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
				const at = items.indexOf(row?.querySelector("[data-model-option]") ?? active);
				items[event.key === "Home" ? 0 : event.key === "End" ? items.length - 1 : event.key === "ArrowDown" ? (at + 1) % items.length : at <= 0 ? items.length - 1 : at - 1]?.focus();
			};
			const normalized = query.trim().toLocaleLowerCase();
			const visible = choices.filter((row) => `${row.name} ${row.model} ${row.providerName} ${row.provider}`.toLocaleLowerCase().includes(normalized));
			const plain = (rows) => rows.map((choice) => ({
				choice,
				chips: []
			}));
			const sections = normalized ? [{
				id: "search",
				label: t("searchResults"),
				shortcut: true,
				rows: plain(visible)
			}] : [
				{
					id: "favorites",
					label: t("favorites"),
					shortcut: true,
					rows: favoriteRows(shown, choices, t("effortDefaultShort"))
				},
				{
					id: "recent",
					label: t("recentModels"),
					shortcut: true,
					rows: recentRows(shown, choices, t("effortDefaultShort"))
				},
				...catalog?.groups.map((group) => ({
					id: `provider:${group.id}`,
					label: group.name,
					shortcut: false,
					rows: plain(choices.filter((row) => row.provider === group.id))
				})) ?? []
			];
			const draftEffort = draft === void 0 ? void 0 : effortOf(draft);
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
							setNotice(null);
							setAnnouncement("");
							setGhosts([]);
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
								sections.filter((section) => section.rows.length).map((section) => (0, react_jsx_runtime.jsxs)("section", {
									className: ModelPicker_module_css_default.group,
									"aria-label": section.label,
									children: [(0, react_jsx_runtime.jsx)("h4", {
										className: ModelPicker_module_css_default.groupTitle,
										children: section.label
									}), section.rows.map(({ choice: row, chips, modelFavorite }) => {
										const current = !inherit && row.provider === draft?.provider && row.model === draft.model;
										const favorites = section.id === "favorites";
										/** The badge star for one saved combination: filled while saved, hollow once removed in this menu. */
										const star = (effort, title, className) => {
											const saved = hasFavorite(preferences, row.provider, row.model, effort);
											const label = t(saved ? "unfavoriteChoice" : "favoriteChoice").replace("{name}", title);
											const full = !saved && preferences.favorites.length >= 40;
											return (0, react_jsx_runtime.jsx)("button", {
												type: "button",
												tabIndex: -1,
												"data-favorite-star": true,
												className,
												"aria-pressed": saved,
												"aria-label": label,
												title: full ? t("favoritesFull") : label,
												disabled: full,
												onClick: (event) => {
													toggleChoice(row.provider, row.model, effort, title, event.currentTarget.firstElementChild);
												},
												children: (0, react_jsx_runtime.jsx)("span", {
													className: ModelPicker_module_css_default.star,
													"aria-hidden": "true",
													children: saved ? "★" : "☆"
												})
											});
										};
										const removeKey = (effort, title) => (event) => {
											if (!favorites || event.key !== "Delete" && event.key !== "Backspace") return;
											event.preventDefault();
											toggleChoice(row.provider, row.model, effort, title, null);
										};
										const modelGhost = modelFavorite === true && !hasFavorite(preferences, row.provider, row.model, null);
										return (0, react_jsx_runtime.jsxs)("div", {
											className: ModelPicker_module_css_default.modelRow,
											"data-model-row": true,
											"data-ghost": favorites && modelGhost ? "true" : void 0,
											children: [
												(0, react_jsx_runtime.jsxs)("button", {
													type: "button",
													"data-model-option": true,
													className: [ModelPicker_module_css_default.option, current ? ModelPicker_module_css_default.selected : ""].filter(Boolean).join(" "),
													"aria-pressed": current,
													disabled: blocked,
													title: `${row.name} · ${row.providerName}`,
													onClick: () => {
														pick(row);
													},
													onKeyDown: favorites && modelFavorite ? removeKey(null, row.name) : void 0,
													children: [(0, react_jsx_runtime.jsxs)("span", {
														className: ModelPicker_module_css_default.optionCopy,
														children: [(0, react_jsx_runtime.jsx)("span", {
															className: ModelPicker_module_css_default.modelName,
															children: row.name
														}), (0, react_jsx_runtime.jsxs)("span", {
															className: ModelPicker_module_css_default.description,
															children: [section.shortcut ? `${row.providerName} · ` : "", row.description ?? row.model]
														})]
													}), current && (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconCheckOutlineMedium, { className: ModelPicker_module_css_default.check })]
												}),
												favorites && modelFavorite && star(null, row.name, ModelPicker_module_css_default.rowStar),
												chips.length > 0 && (0, react_jsx_runtime.jsx)("div", {
													className: ModelPicker_module_css_default.rowChips,
													children: chips.map((chip) => {
														const label = `${row.name} · ${chip.name}`;
														const ghost = favorites && !hasFavorite(preferences, row.provider, row.model, chip.effort);
														return (0, react_jsx_runtime.jsxs)("span", {
															className: ModelPicker_module_css_default.chipWrap,
															"data-ghost": ghost ? "true" : void 0,
															children: [(0, react_jsx_runtime.jsx)("button", {
																type: "button",
																"data-effort-chip": true,
																"data-stale": chip.stale ? "true" : void 0,
																className: [ModelPicker_module_css_default.effort, ModelPicker_module_css_default.rowChip].join(" "),
																"aria-pressed": current && !chip.stale && draftEffort === chip.effort,
																"aria-label": chip.stale ? `${label} · ${t("staleEffortChip")}` : label,
																"aria-keyshortcuts": favorites ? "Delete" : void 0,
																title: chip.stale ? t("staleEffortChip") : label,
																disabled: blocked,
																onClick: () => {
																	pickChip(row, chip);
																},
																onKeyDown: removeKey(chip.effort, label),
																children: chip.name
															}), favorites && star(chip.effort, label, ModelPicker_module_css_default.chipStar)]
														}, chip.effort ?? "\0default");
													})
												})
											]
										}, modelKey(row));
									})]
								}, section.id)),
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
								setNotice(null);
							},
							children: [clearLabel ?? t("modeFollow"), inherit && (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconCheckOutlineMedium, { className: ModelPicker_module_css_default.check })]
						}),
						(0, react_jsx_runtime.jsxs)("div", {
							className: ModelPicker_module_css_default.selectionEditor,
							children: [
								(0, react_jsx_runtime.jsxs)("div", {
									className: ModelPicker_module_css_default.draftSummary,
									children: [(0, react_jsx_runtime.jsxs)("div", {
										className: ModelPicker_module_css_default.draftCopy,
										children: [(0, react_jsx_runtime.jsx)("span", {
											className: ModelPicker_module_css_default.modelName,
											children: inherit ? clearLabel ?? t("modeFollow") : draft === void 0 ? t("triggerFallback") : draftTitle
										}), !inherit && draftModel && (0, react_jsx_runtime.jsx)("span", {
											className: ModelPicker_module_css_default.description,
											children: draftModel.providerName
										})]
									}), !inherit && draft && draftModel && (0, react_jsx_runtime.jsx)("button", {
										type: "button",
										className: ModelPicker_module_css_default.favoriteToggle,
										"aria-pressed": draftFavorite,
										"aria-label": t(draftFavorite ? "unfavoriteChoice" : "favoriteChoice").replace("{name}", draftTitle),
										title: favoritesFull ? t("favoritesFull") : t(draftFavorite ? "unfavoriteChoice" : "favoriteChoice").replace("{name}", draftTitle),
										disabled: favoritesFull,
										onClick: toggleFavorite,
										children: (0, react_jsx_runtime.jsx)("span", {
											ref: starRef,
											className: ModelPicker_module_css_default.star,
											"aria-hidden": "true",
											children: draftFavorite ? "★" : "☆"
										})
									})]
								}),
								notice && !inherit && (0, react_jsx_runtime.jsx)("p", {
									className: ModelPicker_module_css_default.notice,
									role: "status",
									children: notice
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
												setDraft(withEffort(draft.provider, draft.model, level.id));
												setNotice(null);
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
										disabled: blocked || unchanged || !(inherit ? onClear !== void 0 : draftModel !== void 0),
										onClick: apply,
										children: saving ? t("statusSaving") : t("applySelection")
									})]
								})
							]
						}),
						(0, react_jsx_runtime.jsx)("span", {
							className: ModelPicker_module_css_default.visuallyHidden,
							role: "status",
							"aria-live": "polite",
							children: announcement
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
		//#region lib/client/SeamNotice.js
		/** [missing seams: off or paused, unexpected data only: conservative fallback] */
		const IMPACT = {
			"model-lock": ["seamLockPaused", "seamLockStrict"],
			"plan-switch": ["seamPlanOff", "seamPlanLate"],
			"chat-controls": ["seamChatOff", "seamChatOff"],
			"subagent-catalog": ["seamCatalogOff", "seamCatalogOff"]
		};
		/** Whether the model lock is paused, so a raw host error would repeat this notice. */
		function lockPaused(reports) {
			return reports?.some((report) => report.capability === "model-lock" && report.missing.length > 0) ?? false;
		}
		function Seams({ label, seams }) {
			if (!seams.length) return null;
			return (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [
				(0, react_jsx_runtime.jsx)("br", {}),
				label,
				seams.map((seam, index) => (0, react_jsx_runtime.jsxs)("span", { children: [index > 0 ? ", " : "", (0, react_jsx_runtime.jsx)("code", { children: seam })] }, seam))
			] });
		}
		function SeamNotice({ reports, t, className }) {
			if (!reports.length) return null;
			return (0, react_jsx_runtime.jsxs)("div", {
				className,
				role: "alert",
				"data-model-switch-seams": "",
				children: [reports.map((report) => (0, react_jsx_runtime.jsxs)("p", { children: [
					t(IMPACT[report.capability][report.missing.length ? 0 : 1]),
					(0, react_jsx_runtime.jsx)(Seams, {
						label: t("seamMissing"),
						seams: report.missing
					}),
					(0, react_jsx_runtime.jsx)(Seams, {
						label: t("seamMismatched"),
						seams: report.mismatched
					})
				] }, report.capability)), (0, react_jsx_runtime.jsx)("p", { children: t("seamHint") })]
			});
		}
		//#endregion
		//#region \0dsh-css:/Users/Miu/Library/Mobile Documents/com~apple~CloudDocs/Workspace/DSH子代理插件/src/client/styles.module.css.mjs
		const css$4 = ".WYE9pa_section{width:100%;max-width:820px;color:var(--dsw-alias-label-primary,#27272f);flex-direction:column;gap:16px;padding:6px 0 26px;display:flex}.WYE9pa_settingsHeader{justify-content:space-between;align-items:center;gap:16px;padding-bottom:4px;display:flex}.WYE9pa_title{margin:0;font-size:18px;font-weight:600;line-height:26px}.WYE9pa_saveStatus{color:var(--dsw-alias-label-tertiary,#777784);flex:none;font-size:11px}.WYE9pa_settingsList{container-type:inline-size}.WYE9pa_settingRow{border-bottom:1px solid var(--dsw-alias-border-l2,#dedee3);grid-template-columns:minmax(0,1fr) minmax(220px,320px);align-items:center;gap:24px;padding:24px 0;display:grid}.WYE9pa_settingRow:first-child{padding-top:12px}.WYE9pa_settingRow:last-child{border-bottom:0}.WYE9pa_settingCopy,.WYE9pa_settingControl{min-width:0}.WYE9pa_settingTitle{margin:0;font-size:13px;font-weight:600;line-height:20px}.WYE9pa_settingHint{color:var(--dsw-alias-label-tertiary,#777784);margin:6px 0 0;font-size:11px;line-height:18px}@container (width<=580px){.WYE9pa_settingRow{grid-template-columns:minmax(0,1fr);gap:12px;padding:20px 0}}.WYE9pa_error{color:var(--dsw-alias-state-error-primary,#c0392b);margin:0;font-size:11px;line-height:18px}.WYE9pa_frame{width:100%}.WYE9pa_card{border:1px solid var(--dsw-alias-border-l2,#dedee3);background:var(--dsw-alias-bg-layer-1,#fff);border-radius:14px;overflow:hidden}.WYE9pa_strip{color:var(--dsw-alias-label-primary,#27272f);background:color-mix(in srgb, var(--dsw-alias-state-business-primary,#5269dc) 6%, transparent);align-items:center;gap:8px;padding:13px 16px;font-size:12px;font-weight:600;display:flex}.WYE9pa_dot{background:var(--dsw-alias-state-business-primary,#5269dc);border-radius:50%;width:6px;height:6px}.WYE9pa_body{max-height:min(42vh,28rem);padding:15px 18px;overflow:auto}.WYE9pa_footer{border-top:1px solid var(--dsw-alias-border-l2,#dedee3);flex-direction:column;gap:10px;padding:13px 16px;display:flex}.WYE9pa_feedback{color:var(--dsw-alias-state-error-primary,#c0392b);font-size:11px}.WYE9pa_feedback:empty{display:none}.WYE9pa_actions{flex-wrap:wrap;align-items:center;gap:8px;display:flex}.WYE9pa_actions>:last-child{margin-left:auto}.WYE9pa_planPicker{align-items:center;min-width:0;display:flex}.WYE9pa_seamBanner{border:1px solid color-mix(in srgb, var(--dsw-alias-state-warning-primary,#b7791f) 40%, transparent);background:color-mix(in srgb, var(--dsw-alias-state-warning-primary,#b7791f) 8%, transparent);overflow-wrap:anywhere;border-radius:10px;padding:10px 12px;font-size:12px;line-height:19px}.WYE9pa_seamBanner p{margin:0 0 6px}.WYE9pa_seamBanner p:last-child{color:var(--dsw-alias-label-tertiary,#777784);margin-bottom:0}.WYE9pa_seamBanner code{font-size:11px}";
		const tagId$4 = "dsh-model-dispatch/styles.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId$4) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "dsh-model-dispatch";
			tag.dataset.pluginCss = tagId$4;
			tag.textContent = css$4;
			document.head.appendChild(tag);
		}
		var styles_module_css_default = {
			"actions": "WYE9pa_actions",
			"body": "WYE9pa_body",
			"card": "WYE9pa_card",
			"dot": "WYE9pa_dot",
			"error": "WYE9pa_error",
			"feedback": "WYE9pa_feedback",
			"footer": "WYE9pa_footer",
			"frame": "WYE9pa_frame",
			"planPicker": "WYE9pa_planPicker",
			"saveStatus": "WYE9pa_saveStatus",
			"seamBanner": "WYE9pa_seamBanner",
			"section": "WYE9pa_section",
			"settingControl": "WYE9pa_settingControl",
			"settingCopy": "WYE9pa_settingCopy",
			"settingHint": "WYE9pa_settingHint",
			"settingRow": "WYE9pa_settingRow",
			"settingTitle": "WYE9pa_settingTitle",
			"settingsHeader": "WYE9pa_settingsHeader",
			"settingsList": "WYE9pa_settingsList",
			"strip": "WYE9pa_strip",
			"title": "WYE9pa_title"
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
			if (!props.store || !props.mainStore || !props.access || !props.t || !props.seams) return null;
			return (0, react_jsx_runtime.jsx)(SettingsSectionLoaded, {
				store: props.store,
				mainStore: props.mainStore,
				access: props.access,
				t: props.t,
				seams: props.seams
			});
		}
		function useSeamReport(load) {
			const [result, setResult] = (0, react.useState)({});
			(0, react.useEffect)(() => {
				let live = true;
				load().then((reports) => {
					if (live) setResult({ reports });
				}, (cause) => {
					if (live) setResult({ error: cause instanceof Error ? cause.message : String(cause) });
				});
				return () => {
					live = false;
				};
			}, [load]);
			return result;
		}
		function SettingsSectionLoaded({ store, mainStore, access, t, seams }) {
			const seamReport = useSeamReport(seams);
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
					seamReport.reports && (0, react_jsx_runtime.jsx)(SeamNotice, {
						className: styles_module_css_default.seamBanner,
						reports: seamReport.reports,
						t
					}),
					seamReport.error && (0, react_jsx_runtime.jsxs)("p", {
						className: styles_module_css_default.error,
						role: "alert",
						children: [
							t("seamsUnavailable"),
							": ",
							seamReport.error
						]
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
		//#region lib/route-contract.js
		const ROUTE_STATUS_PATH = "/_dsh/model-switch/route-status";
		const ROUTE_CONFIRM_PATH = "/_dsh/model-switch/confirm-child-route";
		const HOST_SEAMS_PATH = "/_dsh/model-switch/host-seams";
		//#endregion
		//#region lib/client/route-status-store.js
		/** Host acknowledgements, never optimistic lock badges. */
		var RouteStatusStore = class {
			snapshots = /* @__PURE__ */ new Map();
			revisions = /* @__PURE__ */ new Map();
			listeners = /* @__PURE__ */ new Set();
			watched = /* @__PURE__ */ new Map();
			empty = {};
			subscribe = (fn) => {
				this.listeners.add(fn);
				return () => {
					this.listeners.delete(fn);
				};
			};
			get = (id) => this.snapshots.get(id) ?? this.empty;
			watch(id) {
				const current = this.watched.get(id);
				if (current) current.refs++;
				else {
					this.refresh(id).catch(() => {});
					this.watched.set(id, {
						refs: 1,
						timer: setInterval(() => {
							this.refresh(id).catch(() => {});
						}, 4e3)
					});
				}
				return () => {
					const value = this.watched.get(id);
					if (value && --value.refs === 0) {
						clearInterval(value.timer);
						this.watched.delete(id);
					}
				};
			}
			publish(id, value) {
				this.snapshots.set(id, value);
				for (const fn of this.listeners) fn();
			}
			async read(response, id) {
				const body = await response.json();
				const value = body.value;
				if (!response.ok || !body.ok || value?.sessionId !== id || value.policyVersion !== 1) throw new Error(body.error?.message ?? `Routing protection unavailable (HTTP ${response.status})`);
				return value;
			}
			async refresh(id) {
				const revision = (this.revisions.get(id) ?? 0) + 1;
				this.revisions.set(id, revision);
				try {
					const value = await this.read(await fetch(`${ROUTE_STATUS_PATH}?sessionId=${encodeURIComponent(id)}`, {
						credentials: "same-origin",
						cache: "no-store"
					}), id);
					if (this.revisions.get(id) === revision) this.publish(id, { value });
					return value;
				} catch (cause) {
					if (this.revisions.get(id) === revision) this.publish(id, { error: cause instanceof Error ? cause.message : String(cause) });
					throw cause;
				}
			}
			async confirm(parentId, childId, selection) {
				this.revisions.set(childId, (this.revisions.get(childId) ?? 0) + 1);
				const value = await this.read(await fetch(ROUTE_CONFIRM_PATH, {
					method: "POST",
					credentials: "same-origin",
					headers: { "content-type": "application/json" },
					body: JSON.stringify({
						parentId,
						childId,
						selection
					})
				}), childId);
				this.revisions.set(childId, (this.revisions.get(childId) ?? 0) + 1);
				this.publish(childId, { value });
				if (value.health !== "ready" || value.state !== "locked") throw new Error(value.error ?? "The host did not confirm model protection");
			}
		};
		/** Degraded host capabilities, checked by the host on each read; never polled. */
		async function fetchHostSeams() {
			const response = await fetch(HOST_SEAMS_PATH, {
				credentials: "same-origin",
				cache: "no-store"
			});
			const body = await response.json().catch(() => ({}));
			if (!response.ok || !body.ok || !Array.isArray(body.value)) throw new Error(body.error?.message ?? `HTTP ${response.status}`);
			return body.value;
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
		//#region \0dsh-css:/Users/Miu/Library/Mobile Documents/com~apple~CloudDocs/Workspace/DSH子代理插件/src/client/SessionSubagentPicker.module.css.mjs
		const css$3 = ".G4aYja_wrap{align-items:center;min-width:0;display:inline-flex;position:relative}.G4aYja_error{max-width:280px;color:var(--dsw-alias-state-error-primary,#c0392b);background:var(--dsw-specific-menu,#fff);border:1px solid var(--dsw-alias-border-l2,#dedee3);overflow-wrap:anywhere;border-radius:8px;padding:6px 9px;font-size:10px;line-height:15px;position:absolute;bottom:calc(100% + 6px);right:0;box-shadow:0 4px 18px #0002}.G4aYja_status{color:var(--dsw-alias-state-success-primary,#38845a);padding:0 4px;font-size:13px;line-height:20px}.G4aYja_seams{position:relative}.G4aYja_seamFlag{cursor:pointer;color:var(--dsw-alias-state-warning-primary,#b7791f);padding:0 4px;font-size:11px;list-style:none}.G4aYja_seamFlag::-webkit-details-marker{display:none}.G4aYja_seamPanel{z-index:30;width:min(320px,80vw);color:var(--dsw-alias-label-primary,#27272f);background:var(--dsw-specific-menu,#fff);border:1px solid var(--dsw-alias-border-l2,#dedee3);overflow-wrap:anywhere;border-radius:8px;padding:8px 10px;font-size:11px;line-height:17px;position:absolute;bottom:calc(100% + 6px);right:0;box-shadow:0 4px 18px #0002}.G4aYja_seamPanel p{margin:0 0 4px}.G4aYja_seamPanel p:last-child{margin-bottom:0}";
		const tagId$3 = "dsh-model-dispatch/SessionSubagentPicker.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId$3) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "dsh-model-dispatch";
			tag.dataset.pluginCss = tagId$3;
			tag.textContent = css$3;
			document.head.appendChild(tag);
		}
		var SessionSubagentPicker_module_css_default = {
			"error": "G4aYja_error",
			"seamFlag": "G4aYja_seamFlag",
			"seamPanel": "G4aYja_seamPanel",
			"seams": "G4aYja_seams",
			"status": "G4aYja_status",
			"wrap": "G4aYja_wrap"
		};
		//#endregion
		//#region lib/client/SessionSubagentPicker.js
		/** A clearly labelled child route with an explicit inheritance action. */
		function SessionSubagentPicker(props) {
			if (!props.overrides || !props.access || !props.t || !props.store || !props.routes) return null;
			return (0, react_jsx_runtime.jsx)(SessionSubagentPickerLoaded, {
				...props,
				overrides: props.overrides,
				store: props.store,
				routes: props.routes,
				access: props.access,
				t: props.t
			});
		}
		function SessionSubagentPickerLoaded({ sessionId, overrides, store, routes, access, t, useSessions, locked, available }) {
			const routeSnap = (0, react.useSyncExternalStore)(routes.subscribe, () => routes.get(sessionId));
			(0, react.useEffect)(() => routes.watch(sessionId), [routes, sessionId]);
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
			if (subagent || available === false) return null;
			const override = snap.value[sessionId];
			const defaultRoute = resolveCustomSelection(settings.value.subagent);
			const inherited = defaultRoute ?? mainSelection?.next ?? mainSelection?.lastUsed ?? access.currentSelection(sessionId);
			const state = routeSnap.value;
			const seams = state?.seams ?? [];
			const paused = lockPaused(seams);
			const problem = routeSnap.error ?? (paused ? void 0 : state?.error) ?? snap.error;
			const healthy = state?.health === "ready" && state.state === "ready" && !problem;
			const unverified = state?.state === "unverified";
			const statusLabel = healthy ? t("routeReady") : problem ? state?.state === "missing" ? t("routeSessionMissing") : state?.state === "blocked" ? t("routeBlocked") : t("routeUnavailable") : unverified ? t("routeUnverified") : t("statusLoading");
			const routeMessage = statusLabel;
			const write = async (selection) => {
				await overrides.set(sessionId, selection);
				const confirmed = await routes.refresh(sessionId);
				if (confirmed.health !== "ready" || !["ready", "unverified"].includes(confirmed.state)) throw new Error(confirmed.error ?? t("routeBlocked"));
			};
			return (0, react_jsx_runtime.jsxs)("div", {
				className: SessionSubagentPicker_module_css_default.wrap,
				children: [
					(0, react_jsx_runtime.jsx)(ModelPicker, {
						compact: true,
						disabled: locked || !state || state.health !== "ready",
						sessionId,
						access,
						value: state?.expected ?? override ?? inherited,
						onChange: (selection) => write(selection),
						placement: "top",
						roleLabel: t("chatSubagentRole"),
						sourceLabel: t(override ? "sessionSource" : defaultRoute ? "defaultSource" : "followingMain"),
						scopeHint: t("subagentScope"),
						t,
						seed: false
					}),
					!(paused && !problem) && (0, react_jsx_runtime.jsx)("span", {
						className: problem ? SessionSubagentPicker_module_css_default.error : SessionSubagentPicker_module_css_default.status,
						role: "status",
						"aria-label": statusLabel,
						title: statusLabel,
						children: problem ? `${routeMessage}: ${problem}` : healthy ? "✓" : unverified ? t("routeUnverifiedShort") : "…"
					}),
					seams.length > 0 && (0, react_jsx_runtime.jsxs)("details", {
						className: SessionSubagentPicker_module_css_default.seams,
						open: paused,
						children: [(0, react_jsx_runtime.jsx)("summary", {
							className: SessionSubagentPicker_module_css_default.seamFlag,
							title: t("seamWarning"),
							"aria-label": t("seamWarning"),
							children: "⚠"
						}), (0, react_jsx_runtime.jsx)(SeamNotice, {
							className: SessionSubagentPicker_module_css_default.seamPanel,
							reports: seams,
							t
						})]
					})
				]
			});
		}
		//#endregion
		//#region \0dsh-css:/Users/Miu/Library/Mobile Documents/com~apple~CloudDocs/Workspace/DSH子代理插件/src/client/SessionModelControls.module.css.mjs
		const css$2 = ".rQlTvW_bar{flex-wrap:wrap;justify-content:flex-end;align-items:center;gap:10px;min-width:0;display:flex}";
		const tagId$2 = "dsh-model-dispatch/SessionModelControls.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId$2) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "dsh-model-dispatch";
			tag.dataset.pluginCss = tagId$2;
			tag.textContent = css$2;
			document.head.appendChild(tag);
		}
		var SessionModelControls_module_css_default = { "bar": "rQlTvW_bar" };
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
			const [loadError, setLoadError] = (0, react.useState)(null);
			const [attempt, setAttempt] = (0, react.useState)(0);
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
				setMainLabel(void 0);
				setLoadError(null);
				(async () => {
					const response = await fetch(PLAN_MAIN_MODELS_ROUTE, {
						credentials: "same-origin",
						cache: "no-store"
					});
					if (!response.ok) throw new Error(t("planMainLoadError"));
					const result = await response.json();
					if (!result.ok || !result.value) throw new Error(t("planMainLoadError"));
					const main = result.value[pending.sessionId];
					if (main === void 0) throw new Error(t("planMainLoadError"));
					let label = main.model;
					try {
						label = ((await access.loadCatalog()).groups.find((group) => group.id === main.provider)?.models.find((row) => row.id === main.model))?.name ?? label;
					} catch {}
					if (main.reasoningEffort !== void 0) label += ` · ${main.reasoningEffort}`;
					if (!cancelled) setMainLabel(label);
				})().catch((cause) => {
					if (!cancelled) setLoadError(cause instanceof Error ? cause.message : String(cause));
				});
				return () => {
					cancelled = true;
				};
			}, [
				pending.sessionId,
				access,
				t,
				attempt
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
											mainLabel ?? (loadError ? (0, react_jsx_runtime.jsx)("span", {
												role: "alert",
												title: loadError,
												children: t("planMainLoadError")
											}) : t("statusLoading")),
											loadError && (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
												variant: "ghost",
												disabled: busy,
												onClick: () => setAttempt((value) => value + 1),
												children: t("retry")
											})
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
		//#region \0dsh-css:/Users/Miu/Library/Mobile Documents/com~apple~CloudDocs/Workspace/DSH子代理插件/src/client/SubagentModelBadge.module.css.mjs
		const css$1 = ".YcZwsW_badge{min-width:0;max-width:220px;color:var(--dsw-alias-label-tertiary);text-overflow:ellipsis;white-space:nowrap;border-radius:12px;align-items:center;padding:2px 8px;font-size:12px;font-weight:500;line-height:18px;display:inline-flex;overflow:hidden}.YcZwsW_details{max-width:340px;font-size:12px;position:relative}.YcZwsW_details summary{cursor:pointer;text-overflow:ellipsis;white-space:nowrap;overflow:hidden}.YcZwsW_panel{z-index:30;border:1px solid var(--dsw-alias-border-l2,#ddd);background:var(--dsw-specific-menu,#fff);width:min(400px,85vw);color:var(--dsw-alias-label-primary,#222);overflow-wrap:anywhere;border-radius:10px;padding:16px;position:absolute;top:100%;right:0;box-shadow:0 6px 24px #0002}.YcZwsW_panel p{margin:6px 0}";
		const tagId$1 = "dsh-model-dispatch/SubagentModelBadge.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId$1) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "dsh-model-dispatch";
			tag.dataset.pluginCss = tagId$1;
			tag.textContent = css$1;
			document.head.appendChild(tag);
		}
		var SubagentModelBadge_module_css_default = {
			"badge": "YcZwsW_badge",
			"details": "YcZwsW_details",
			"panel": "YcZwsW_panel"
		};
		//#endregion
		//#region lib/client/SubagentModelBadge.js
		/** Only host-acknowledged locks and admitted request facts are shown here. */
		const describe = (value) => value ? `${value.provider}/${value.model}${value.reasoningEffort ? " · " + value.reasoningEffort : ""}` : "—";
		function SubagentModelBadge(props) {
			if (!props.routes || !props.access || !props.t) return null;
			return (0, react_jsx_runtime.jsx)(Loaded, {
				...props,
				routes: props.routes,
				access: props.access,
				t: props.t
			});
		}
		function Loaded({ sessionId, useSessions, routes, access, t }) {
			const origin = useSessions((state) => state.byId[sessionId]?.origin);
			const snap = (0, react.useSyncExternalStore)(routes.subscribe, () => routes.get(sessionId));
			(0, react.useEffect)(() => origin === "subagent" ? routes.watch(sessionId) : void 0, [
				routes,
				sessionId,
				origin
			]);
			if (origin !== "subagent") return null;
			const status = snap.value;
			const source = status?.source;
			const sourceText = source ? t(source === "session" ? "sessionSource" : source === "default" ? "defaultSource" : source === "follow-main" ? "followingMain" : source === "inherited-lock" ? "routeInherited" : "routeConfirmed") : "—";
			return (0, react_jsx_runtime.jsxs)("details", {
				className: SubagentModelBadge_module_css_default.details,
				"data-model-switch-badge": "",
				children: [(0, react_jsx_runtime.jsx)("summary", {
					className: SubagentModelBadge_module_css_default.badge,
					children: snap.error ? t("routeUnavailable") : status?.state === "blocked" ? t("routeBlocked") : status?.state === "confirmation-required" ? t("routeConfirmRequired") : status?.state === "locked" ? `${t("routeLocked")} · ${status.expected?.model}` : t("statusLoading")
				}), (0, react_jsx_runtime.jsxs)("div", {
					className: SubagentModelBadge_module_css_default.panel,
					children: [
						(0, react_jsx_runtime.jsx)(SeamNotice, {
							reports: status?.seams ?? [],
							t
						}),
						(snap.error || status?.error && !lockPaused(status.seams)) && (0, react_jsx_runtime.jsx)("p", {
							role: "alert",
							children: snap.error ?? status?.error
						}),
						status?.state === "confirmation-required" && status.parentId && (0, react_jsx_runtime.jsx)(ModelPicker, {
							sessionId,
							access,
							value: void 0,
							onChange: (selection) => routes.confirm(status.parentId, sessionId, selection),
							roleLabel: t("routeConfirm"),
							scopeHint: t("routeConfirmHint"),
							t
						}),
						status?.expected && (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [
							(0, react_jsx_runtime.jsxs)("p", { children: [
								t("routeExpected"),
								": ",
								describe(status.expected)
							] }),
							(0, react_jsx_runtime.jsxs)("p", { children: [
								t("routeActual"),
								": ",
								status.actual ? describe(status.actual) : t("routeNoRequest")
							] }),
							(0, react_jsx_runtime.jsxs)("p", { children: [
								t("routeSource"),
								": ",
								sourceText
							] })
						] }),
						status?.conflict && (0, react_jsx_runtime.jsxs)("p", { children: [
							t("routeConflict"),
							": ",
							describe(status.conflict)
						] })
					]
				})]
			});
		}
		//#endregion
		//#region \0dsh-css:/Users/Miu/Library/Mobile Documents/com~apple~CloudDocs/Workspace/DSH子代理插件/src/client/SubagentCatalogAction.module.css.mjs
		const css = ".j-2UIG_root{position:relative}.j-2UIG_trigger{min-height:28px;color:var(--dsw-alias-label-tertiary);cursor:pointer;background:0 0;border:0;border-radius:6px;align-items:center;gap:3px;padding:3px 2px;font-size:12px;line-height:18px;display:inline-flex}.j-2UIG_count{margin:0 5px}.j-2UIG_activitySlot{flex:none;width:10px;height:10px;display:inline-flex}.j-2UIG_trigger:hover,.j-2UIG_trigger:focus-visible{color:var(--dsw-alias-label-secondary)}.j-2UIG_trigger svg{transition:transform .12s}.j-2UIG_triggerOpen{transform:rotate(180deg)}.j-2UIG_menu{z-index:100;box-sizing:border-box;background:var(--dsw-specific-menu);--dsh-scrollbar-thumb:var(--dsw-alias-scrollbar-bg-l2);--dsh-scrollbar-thumb-hover:var(--dsw-alias-scrollbar-hover-l2);width:336px;max-width:min(400px,100vw - 32px);max-height:min(560px,100vh - 140px);box-shadow:var(--dsw-shadow-lv3);border-radius:12px;flex-direction:column;padding:4px;display:flex;position:fixed;overflow:auto}.j-2UIG_node{min-width:0;position:relative}.j-2UIG_menu>.j-2UIG_node{margin-left:-3px}.j-2UIG_row{box-sizing:border-box;width:100%;min-height:50px;color:var(--dsw-alias-label-primary);text-align:left;cursor:pointer;background:0 0;border:0;border-radius:8px;outline:none;align-items:flex-start;gap:8px;padding:7px 8px 7px 11px;font-size:13px;line-height:18px;display:flex;position:relative}.j-2UIG_row:hover>.j-2UIG_clickarea,.j-2UIG_row:focus-visible>.j-2UIG_clickarea{background:var(--dsw-alias-interactive-bg-hover)}.j-2UIG_clickarea{box-sizing:border-box;border-radius:8px;flex:1;align-self:stretch;align-items:flex-start;gap:8px;min-width:0;margin:-7px -8px;padding:7px 8px;display:flex}.j-2UIG_row>[data-state],.j-2UIG_clickarea>[data-state]{margin-top:4px}.j-2UIG_disabled{color:var(--dsw-alias-label-dimmed);cursor:not-allowed}.j-2UIG_disabled:hover{background:0 0}.j-2UIG_loadingRow{cursor:default}.j-2UIG_disclosure,.j-2UIG_disclosureSpace{flex:none;width:14px;height:18px}.j-2UIG_disclosure{color:var(--dsw-alias-label-tertiary);cursor:pointer;background:0 0;border:0;justify-content:center;align-items:center;padding:0;transition:transform .12s;display:inline-flex}.j-2UIG_disclosure:hover{color:var(--dsw-alias-label-primary)}.j-2UIG_disclosureOpen{transform:rotate(90deg)}.j-2UIG_content{flex-direction:column;flex:1;min-width:0;display:flex}.j-2UIG_label,.j-2UIG_summary{text-overflow:ellipsis;white-space:nowrap;overflow:hidden}.j-2UIG_label{color:inherit;font-weight:400}.j-2UIG_summary,.j-2UIG_metrics{color:var(--dsw-alias-label-tertiary);font-size:11px;line-height:16px}.j-2UIG_metrics{font-variant-numeric:tabular-nums;text-align:right;white-space:nowrap;flex-direction:column;flex:none;justify-content:center;align-items:flex-end;gap:0;min-width:0;max-width:148px;display:flex}.j-2UIG_metricModel{max-width:100%;color:var(--dsw-alias-label-tertiary);text-overflow:ellipsis;font-size:11px;font-weight:500;line-height:16px;overflow:hidden}.j-2UIG_metricToken{line-height:18px}.j-2UIG_metricDuration{line-height:16px}.j-2UIG_children{margin-left:18px;padding-left:4px;position:relative}.j-2UIG_children:before,.j-2UIG_children>.j-2UIG_node:before{content:\"\";border-left:1px solid var(--dsw-alias-border-l2);position:absolute;left:0}.j-2UIG_children:before{height:26px;top:-26px}.j-2UIG_children[aria-busy=true]:before{content:none}.j-2UIG_children>.j-2UIG_node:before{top:0;bottom:0;left:-4px}.j-2UIG_children>.j-2UIG_node:last-child:before{height:17px;bottom:auto}.j-2UIG_children>.j-2UIG_node>.j-2UIG_row:before{content:\"\";border-top:1px solid var(--dsw-alias-border-l2);width:14px;position:absolute;top:16px;left:-4px}.j-2UIG_notice,.j-2UIG_error{color:var(--dsw-alias-label-tertiary);padding:10px 12px;font-size:12px;line-height:18px}.j-2UIG_error{color:var(--dsw-alias-state-error-primary);justify-content:space-between;align-items:center;gap:12px;display:flex}.j-2UIG_refresh{color:inherit;cursor:pointer;background:0 0;border:0;border-radius:6px;flex:none;align-items:center;gap:4px;padding:4px 6px;display:inline-flex}.j-2UIG_refresh:hover{background:var(--dsw-alias-interactive-bg-hover)}.j-2UIG_row[aria-disabled=true]{cursor:default}";
		const tagId = "dsh-model-dispatch/SubagentCatalogAction.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "dsh-model-dispatch";
			tag.dataset.pluginCss = tagId;
			tag.textContent = css;
			document.head.appendChild(tag);
		}
		var SubagentCatalogAction_module_css_default = {
			"activitySlot": "j-2UIG_activitySlot",
			"children": "j-2UIG_children",
			"clickarea": "j-2UIG_clickarea",
			"content": "j-2UIG_content",
			"count": "j-2UIG_count",
			"disabled": "j-2UIG_disabled",
			"disclosure": "j-2UIG_disclosure",
			"disclosureOpen": "j-2UIG_disclosureOpen",
			"disclosureSpace": "j-2UIG_disclosureSpace",
			"error": "j-2UIG_error",
			"label": "j-2UIG_label",
			"loadingRow": "j-2UIG_loadingRow",
			"menu": "j-2UIG_menu",
			"metricDuration": "j-2UIG_metricDuration",
			"metricModel": "j-2UIG_metricModel",
			"metricToken": "j-2UIG_metricToken",
			"metrics": "j-2UIG_metrics",
			"node": "j-2UIG_node",
			"notice": "j-2UIG_notice",
			"refresh": "j-2UIG_refresh",
			"root": "j-2UIG_root",
			"row": "j-2UIG_row",
			"summary": "j-2UIG_summary",
			"trigger": "j-2UIG_trigger",
			"triggerOpen": "j-2UIG_triggerOpen"
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
		const MENU_VIEWPORT_MARGIN = 16;
		const MENU_WIDTH = 336;
		/** Keep the fixed catalog below its trigger and inside the horizontal viewport. */
		function catalogMenuPosition(rect, viewportWidth) {
			const width = Math.min(MENU_WIDTH, viewportWidth - MENU_VIEWPORT_MARGIN * 2);
			return {
				top: rect.bottom + 5,
				left: Math.min(Math.max(MENU_VIEWPORT_MARGIN, rect.left), viewportWidth - width - MENU_VIEWPORT_MARGIN)
			};
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
			const reserveDisclosure = catalog.entries.some((entry) => entry.mode !== "external" && summaries[entry.id]?.formatStatus !== "migration-required" && catalogs[entry.id]?.state !== "migration-required" && !isKnownLeaf(catalogs[entry.id]));
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
					const external = entry.mode === "external";
					const childCatalog = catalogs[entry.id];
					const requiresOpening = summaries[entry.id]?.formatStatus === "migration-required" || childCatalog?.state === "migration-required";
					const knownLeaf = external || requiresOpening || !reserveDisclosure || isKnownLeaf(childCatalog);
					const isExpanded = !knownLeaf && expanded.has(entry.id);
					const childLoading = childCatalog === void 0 || childCatalog.state === "loading" && childCatalog.entries.length === 0;
					const summary = summaries[entry.id];
					const label = entry.label ?? entry.id;
					const mode = external ? t("mode.external") : entry.mode === "unknown" ? t("mode.unknown") : entry.mode === "one-shot" ? t("mode.oneShot") : t("mode.continuable");
					const activity = entry.activity === "running" ? t("activity.running") : t("activity.inactive");
					const secondary = [
						summary?.title,
						requiresOpening ? t("catalog.migrationRequired") : mode,
						external ? void 0 : activity
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
						if (entry.mode === "external") return;
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
							tabIndex: external ? -1 : 0,
							"aria-disabled": external || void 0,
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
				state: snapshot.state === "idle" ? snapshot.values.subagentCatalog === void 0 ? "loading" : "ready" : snapshot.state === "migration-required" && snapshot.values.subagentCatalog !== void 0 ? "ready" : snapshot.state,
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
			const [menuPosition, setMenuPosition] = (0, react.useState)(null);
			const [now, setNow] = (0, react.useState)(() => Date.now());
			const [expanded, setExpanded] = (0, react.useState)(() => /* @__PURE__ */ new Set());
			const rootRef = (0, react.useRef)(null);
			const menuRef = (0, react.useRef)(null);
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
				if (next) {
					const trigger = triggerRef.current;
					if (trigger === null) return;
					setMenuPosition(catalogMenuPosition(trigger.getBoundingClientRect(), window.innerWidth));
					setNow(Date.now());
				} else {
					setMenuPosition(null);
					closeAllCatalogs();
				}
				setOpen(next);
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
					if (event.target instanceof Node && !rootRef.current?.contains(event.target) && !menuRef.current?.contains(event.target)) changeOpen(false);
				};
				document.addEventListener("pointerdown", closeOutside);
				return () => {
					document.removeEventListener("pointerdown", closeOutside);
				};
			}, [open]);
			(0, react.useEffect)(() => {
				if (!open) return;
				const place = () => {
					const trigger = triggerRef.current;
					if (trigger === null) return;
					setMenuPosition(catalogMenuPosition(trigger.getBoundingClientRect(), window.innerWidth));
				};
				window.addEventListener("resize", place);
				document.addEventListener("scroll", place, true);
				return () => {
					window.removeEventListener("resize", place);
					document.removeEventListener("scroll", place, true);
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
				setMenuPosition(null);
				closeAllCatalogs();
			}, [visible, open]);
			if (!visible) return null;
			const focusAt = (index) => {
				const items = treeItems(menuRef.current);
				if (items.length === 0) return;
				items[(index + items.length) % items.length]?.focus();
			};
			const navigate = (event) => {
				const items = treeItems(menuRef.current);
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
				}), open && menuPosition !== null && (0, react_dom.createPortal)((0, react_jsx_runtime.jsx)("div", {
					ref: menuRef,
					className: SubagentCatalogAction_module_css_default.menu,
					style: menuPosition,
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
				}), document.body)]
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
		/**
		* Base client seams: every entry renders localized text into a slot. Each
		* entry injects any further service it needs, so a missing service removes
		* only that entry and the native DSH entry stays (ADR 0001). The host half
		* enforces the model lock regardless of what the client shows.
		*/
		const inject = ["slots", "locale"];
		/** Native entry id owning the deployment main-model default. */
		const AGENT_DEFAULT_MODEL_NS = "agent-default-model";
		/** Client services each replaceable entry injects; the settings banner reports the same lists. */
		const CHAT_CONTROLS_SEAMS = [
			"configForms",
			"remote",
			"remote.session",
			"sessions"
		];
		const CATALOG_SEAMS = ["sessions", "uiWorkspace"];
		const ENTRY_SEAMS = [["chat-controls", CHAT_CONTROLS_SEAMS], ["subagent-catalog", CATALOG_SEAMS]];
		function apply(ctx) {
			ctx.effect(() => ctx.locale.register(NS, {
				zh,
				en
			}), "model-switch: dictionaries");
			const t = ctx.locale.bind(NS);
			const labels = new SessionLabelStore();
			const overrides = new SessionOverrideStore();
			const routes = new RouteStatusStore();
			const remoteSession = () => ctx.get("remote.session");
			const present = (seam) => ctx.get(seam) !== void 0;
			const clientSeams = () => ENTRY_SEAMS.map(([capability, seams]) => ({
				capability,
				missing: seams.filter((seam) => !present(seam)),
				mismatched: []
			})).filter((report) => report.missing.length > 0);
			const seams = async () => [...await fetchHostSeams(), ...clientSeams()];
			let defaults;
			const currentSelection = (sessionId) => {
				const list = ctx.get("sessions")?.list.getSnapshot();
				const selection = list?.projectionsBySession[sessionId]?.values.modelSelection ?? list?.byId[sessionId]?.projectionValues?.modelSelection;
				return selection?.next ?? selection?.lastUsed ?? defaults?.getSnapshot().value;
			};
			let catalogRequest;
			let catalogExpires = 0;
			const access = {
				loadCatalog() {
					if (catalogRequest && Date.now() < catalogExpires) return catalogRequest;
					const session = remoteSession();
					if (!session) return Promise.reject(/* @__PURE__ */ new Error("DSH is missing the host seam remote.session"));
					catalogExpires = Date.now() + 15e3;
					catalogRequest = session.modelCatalog().then((result) => {
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
			ctx.inject(["configForms"], (scope) => {
				const store = new ConfigStore(scope.configForms.get(MODEL_SWITCH_NS));
				const mainStore = new MainModelStore(scope.configForms.get(AGENT_DEFAULT_MODEL_NS));
				scope.effect(() => {
					defaults = mainStore;
					return () => {
						if (defaults === mainStore) defaults = void 0;
					};
				}, "model-switch: main default fallback");
				const settingsInject = () => ({
					store,
					mainStore,
					access,
					t,
					seams
				});
				scope.slots.inject("settings.section", () => scope.slots.register({
					name: "settings.section",
					id: "model-switch",
					order: 80,
					label: () => t("nav"),
					inject: settingsInject
				}, SettingsSection));
				scope.inject(CHAT_CONTROLS_SEAMS, (seat) => {
					const remote = seat.remote;
					const sessions = seat.sessions;
					seat.slots.inject("conversation.input.model", () => seat.slots.register({
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
							routes,
							available: sessions.subagentAddress(sessionId) === void 0
						})
					}, SessionModelControls));
				});
			});
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
			const badgeInject = () => ({
				routes,
				access,
				t
			});
			ctx.slots.inject("conversation.session.header.actions", () => ctx.slots.register({
				name: "conversation.session.header.actions",
				id: "model-switch-badge",
				order: 5,
				inject: badgeInject
			}, SubagentModelBadge));
			ctx.inject(CATALOG_SEAMS, (scope) => {
				const sessions = scope.sessions;
				const catalogInject = () => ({
					openChild(address) {
						scope.uiWorkspace.openSession(address);
					},
					refresh(parentSessionId) {
						sessions.refreshProjections(parentSessionId);
					},
					labels
				});
				scope.slots.inject("conversation.session.header.actions", () => scope.slots.register({
					name: "conversation.session.header.actions",
					id: "subagent-catalog",
					order: 10,
					priority: -1,
					locale: "subagent",
					inject: catalogInject
				}, SubagentCatalogAction));
			});
		}
		//#endregion
		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	}
});

//# sourceMappingURL=client.js.map