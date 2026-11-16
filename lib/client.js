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
		//#region \0dsh-css:D:\dsh\upstream\dsh-model-dispatch\src\client\ModelPicker.module.css.mjs
		const css$4 = ".mF3Wxa_root{min-width:0;position:relative}.mF3Wxa_trigger{border:1px solid var(--dsw-alias-border-l2,#dedee3);background:var(--dsw-alias-bg-layer-1,#fff);min-width:0;max-width:248px;height:30px;color:var(--dsw-alias-label-primary,#27272f);font:inherit;cursor:pointer;border-radius:8px;outline:none;align-items:center;gap:6px;padding:0 8px;font-size:12px;display:inline-flex}.mF3Wxa_trigger:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover,#f3f3f7)}.mF3Wxa_trigger:focus-visible{outline:2px solid var(--dsw-alias-state-business-primary,#5269dc);outline-offset:2px}.mF3Wxa_trigger:disabled{opacity:.6;cursor:default}.mF3Wxa_role{color:var(--dsw-alias-label-tertiary,#777784);flex:none;font-size:10px;font-weight:600}.mF3Wxa_triggerLabel{text-overflow:ellipsis;white-space:nowrap;min-width:0;max-width:168px;font-weight:500;overflow:hidden}.mF3Wxa_triggerEffort{color:var(--dsw-alias-label-tertiary,#777784);flex:none;font-size:10px}.mF3Wxa_chevron{width:12px;height:12px;color:var(--dsw-alias-label-tertiary,#777784);flex:none}.mF3Wxa_menu{z-index:10000;border:1px solid var(--dsw-alias-border-l2,#dedee3);background:var(--dsw-alias-bg-layer-1,#fff);width:min(360px,100vw - 24px);color:var(--dsw-alias-label-primary,#27272f);box-sizing:border-box;border-radius:14px;flex-direction:column;padding:8px;display:flex;position:fixed;overflow:hidden;box-shadow:0 12px 40px #0002,0 2px 8px #0001}.mF3Wxa_menu[data-upwards=true]{transform:translateY(-100%)}.mF3Wxa_menuHeader{justify-content:space-between;align-items:center;gap:12px;padding:3px 4px 9px;font-size:13px;font-weight:600;display:flex}.mF3Wxa_source{color:var(--dsw-alias-state-business-primary,#5269dc);background:color-mix(in srgb, var(--dsw-alias-state-business-primary,#5269dc) 9%, transparent);border-radius:4px;padding:2px 6px;font-size:10px;font-weight:500}.mF3Wxa_search{box-sizing:border-box;border:1px solid var(--dsw-alias-border-l2,#dedee3);background:var(--dsw-alias-interactive-bg-hover,#f3f3f7);width:100%;height:34px;color:inherit;font:inherit;border-radius:8px;outline:none;flex:none;padding:0 10px;font-size:12px}.mF3Wxa_search:focus{border-color:var(--dsw-alias-state-business-primary,#5269dc)}.mF3Wxa_groups{overscroll-behavior:contain;flex:auto;min-height:44px;padding-top:4px;overflow-y:auto}.mF3Wxa_group+.mF3Wxa_group{border-top:1px solid var(--dsw-alias-border-l2,#dedee3);margin-top:5px;padding-top:4px}.mF3Wxa_groupTitle{color:var(--dsw-alias-label-tertiary,#777784);margin:0;padding:6px 5px;font-size:10px;font-weight:600;line-height:14px;display:block}.mF3Wxa_modelRow{align-items:center;gap:2px;display:flex}.mF3Wxa_option{min-width:0;min-height:44px;color:inherit;text-align:left;cursor:pointer;background:0 0;border:0;border-radius:8px;outline:none;flex:1;align-items:center;gap:8px;padding:7px 8px;display:flex}.mF3Wxa_option:hover:not(:disabled),.mF3Wxa_option:focus-visible{background:var(--dsw-alias-interactive-bg-hover,#f3f3f7)}.mF3Wxa_option:disabled{opacity:.6;cursor:default}.mF3Wxa_selected{background:color-mix(in srgb, var(--dsw-alias-state-business-primary,#5269dc) 8%, transparent)}.mF3Wxa_optionCopy{flex-direction:column;flex:1;gap:2px;min-width:0;display:flex}.mF3Wxa_modelName{font-size:12px;font-weight:500;line-height:17px}.mF3Wxa_description{color:var(--dsw-alias-label-tertiary,#777784);font-size:10px;line-height:15px}.mF3Wxa_modelName,.mF3Wxa_description{text-overflow:ellipsis;white-space:nowrap;overflow:hidden}.mF3Wxa_check{width:14px;color:var(--dsw-alias-state-business-primary,#5269dc);flex:none}.mF3Wxa_favorite{width:27px;height:30px;color:var(--dsw-alias-label-tertiary,#888894);cursor:pointer;background:0 0;border:0;border-radius:6px;flex:none;padding:0;font-size:17px}.mF3Wxa_favorite[aria-pressed=true]{color:var(--dsw-alias-state-business-primary,#5269dc)}.mF3Wxa_favorite:hover,.mF3Wxa_favorite:focus-visible{background:var(--dsw-alias-interactive-bg-hover,#f3f3f7)}.mF3Wxa_effortSection{flex:none;padding:4px 0 10px}.mF3Wxa_efforts{flex-wrap:wrap;gap:4px;display:flex}.mF3Wxa_effort{border:1px solid var(--dsw-alias-border-l2,#dedee3);height:25px;color:var(--dsw-alias-label-secondary,#555560);cursor:pointer;font:inherit;background:0 0;border-radius:6px;padding:0 8px;font-size:10px}.mF3Wxa_effort[aria-pressed=true]{border-color:var(--dsw-alias-state-business-primary,#5269dc);color:var(--dsw-alias-state-business-primary,#5269dc);background:color-mix(in srgb, var(--dsw-alias-state-business-primary,#5269dc) 9%, transparent)}.mF3Wxa_clear{border:0;border-top:1px solid var(--dsw-alias-border-l2,#dedee3);width:100%;color:var(--dsw-alias-label-secondary,#555560);text-align:left;font:inherit;cursor:pointer;background:0 0;flex:none;justify-content:space-between;align-items:center;margin-top:5px;padding:9px 8px;font-size:12px;display:flex}.mF3Wxa_scopeHint{color:var(--dsw-alias-label-tertiary,#777784);border-top:1px solid var(--dsw-alias-border-l2,#dedee3);flex:none;padding:8px 4px 3px;font-size:10px;line-height:15px}.mF3Wxa_status,.mF3Wxa_empty,.mF3Wxa_muted{color:var(--dsw-alias-label-tertiary,#777784);padding:14px 7px;font-size:12px}.mF3Wxa_error{background:color-mix(in srgb, var(--dsw-alias-state-error-primary,#c0392b) 8%, transparent);color:var(--dsw-alias-state-error-primary,#c0392b);overflow-wrap:anywhere;border-radius:7px;justify-content:space-between;gap:8px;margin-top:6px;padding:8px;font-size:11px;line-height:16px;display:flex}.mF3Wxa_retry{color:inherit;font:inherit;cursor:pointer;background:0 0;border:0;flex:none;padding:0}.mF3Wxa_warning{color:var(--dsw-alias-label-tertiary,#777784);padding:6px 4px;font-size:10px}@media (width<=640px){.mF3Wxa_trigger{max-width:190px}.mF3Wxa_triggerEffort{display:none}}.mF3Wxa_compact .mF3Wxa_trigger{max-width:180px}.mF3Wxa_compact .mF3Wxa_triggerLabel{max-width:110px;display:var(--dsh-composer-model-text-display,block)}.mF3Wxa_compact .mF3Wxa_triggerEffort{display:none}.mF3Wxa_stretch .mF3Wxa_trigger{width:100%;max-width:none;height:36px;padding:0 11px}.mF3Wxa_stretch .mF3Wxa_triggerLabel{text-align:left;flex:1;max-width:none}.mF3Wxa_stretch .mF3Wxa_triggerEffort{display:inline}.mF3Wxa_clear[aria-pressed=true]{color:var(--dsw-alias-state-business-primary,#5269dc)}.mF3Wxa_selectionEditor{border-top:1px solid var(--dsw-alias-border-l2,#dedee3);flex:none;padding:10px 4px 2px}.mF3Wxa_draftSummary{flex-direction:column;gap:2px;min-width:0;display:flex}.mF3Wxa_effortUnavailable{color:var(--dsw-alias-label-tertiary,#777784);margin:6px 0 10px;font-size:10px}.mF3Wxa_confirmActions{justify-content:flex-end;align-items:center;gap:8px;padding-top:4px;display:flex}.mF3Wxa_cancel,.mF3Wxa_apply{border:1px solid var(--dsw-alias-border-l2,#dedee3);height:30px;font:inherit;cursor:pointer;border-radius:7px;padding:0 13px;font-size:12px}.mF3Wxa_cancel{color:var(--dsw-alias-label-secondary,#555560);background:0 0}.mF3Wxa_apply{background:var(--dsw-alias-state-business-primary,#5269dc);color:#fff;border-color:#0000}.mF3Wxa_cancel:disabled,.mF3Wxa_apply:disabled{opacity:.5;cursor:default}.mF3Wxa_cancel:focus-visible,.mF3Wxa_apply:focus-visible{outline:2px solid var(--dsw-alias-state-business-primary,#5269dc);outline-offset:2px}";
		const tagId$4 = "dsh-model-dispatch/ModelPicker.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId$4) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "dsh-model-dispatch";
			tag.dataset.pluginCss = tagId$4;
			tag.textContent = css$4;
			document.head.appendChild(tag);
		}
		var ModelPicker_module_css_default = {
			"apply": "mF3Wxa_apply",
			"cancel": "mF3Wxa_cancel",
			"check": "mF3Wxa_check",
			"chevron": "mF3Wxa_chevron",
			"clear": "mF3Wxa_clear",
			"compact": "mF3Wxa_compact",
			"confirmActions": "mF3Wxa_confirmActions",
			"description": "mF3Wxa_description",
			"draftSummary": "mF3Wxa_draftSummary",
			"effort": "mF3Wxa_effort",
			"effortSection": "mF3Wxa_effortSection",
			"effortUnavailable": "mF3Wxa_effortUnavailable",
			"efforts": "mF3Wxa_efforts",
			"empty": "mF3Wxa_empty",
			"error": "mF3Wxa_error",
			"favorite": "mF3Wxa_favorite",
			"group": "mF3Wxa_group",
			"groupTitle": "mF3Wxa_groupTitle",
			"groups": "mF3Wxa_groups",
			"menu": "mF3Wxa_menu",
			"menuHeader": "mF3Wxa_menuHeader",
			"modelName": "mF3Wxa_modelName",
			"modelRow": "mF3Wxa_modelRow",
			"muted": "mF3Wxa_muted",
			"option": "mF3Wxa_option",
			"optionCopy": "mF3Wxa_optionCopy",
			"retry": "mF3Wxa_retry",
			"role": "mF3Wxa_role",
			"root": "mF3Wxa_root",
			"scopeHint": "mF3Wxa_scopeHint",
			"search": "mF3Wxa_search",
			"selected": "mF3Wxa_selected",
			"selectionEditor": "mF3Wxa_selectionEditor",
			"source": "mF3Wxa_source",
			"status": "mF3Wxa_status",
			"stretch": "mF3Wxa_stretch",
			"trigger": "mF3Wxa_trigger",
			"triggerEffort": "mF3Wxa_triggerEffort",
			"triggerLabel": "mF3Wxa_triggerLabel",
			"warning": "mF3Wxa_warning"
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
		//#region \0dsh-css:D:\dsh\upstream\dsh-model-dispatch\src\client\styles.module.css.mjs
		const css$3 = ".fdM_xW_section{width:100%;max-width:820px;color:var(--dsw-alias-label-primary,#27272f);flex-direction:column;gap:16px;padding:6px 0 26px;display:flex}.fdM_xW_settingsHeader{justify-content:space-between;align-items:center;gap:16px;padding-bottom:4px;display:flex}.fdM_xW_title{margin:0;font-size:18px;font-weight:600;line-height:26px}.fdM_xW_saveStatus{color:var(--dsw-alias-label-tertiary,#777784);flex:none;font-size:11px}.fdM_xW_settingsList{container-type:inline-size}.fdM_xW_settingRow{border-bottom:1px solid var(--dsw-alias-border-l2,#dedee3);grid-template-columns:minmax(0,1fr) minmax(220px,320px);align-items:center;gap:24px;padding:24px 0;display:grid}.fdM_xW_settingRow:first-child{padding-top:12px}.fdM_xW_settingRow:last-child{border-bottom:0}.fdM_xW_settingCopy,.fdM_xW_settingControl{min-width:0}.fdM_xW_settingTitle{margin:0;font-size:13px;font-weight:600;line-height:20px}.fdM_xW_settingHint{color:var(--dsw-alias-label-tertiary,#777784);margin:6px 0 0;font-size:11px;line-height:18px}@container (width<=580px){.fdM_xW_settingRow{grid-template-columns:minmax(0,1fr);gap:12px;padding:20px 0}}.fdM_xW_error{color:var(--dsw-alias-state-error-primary,#c0392b);margin:0;font-size:11px;line-height:18px}.fdM_xW_frame{width:100%}.fdM_xW_card{border:1px solid var(--dsw-alias-border-l2,#dedee3);background:var(--dsw-alias-bg-layer-1,#fff);border-radius:14px;overflow:hidden}.fdM_xW_strip{color:var(--dsw-alias-label-primary,#27272f);background:color-mix(in srgb, var(--dsw-alias-state-business-primary,#5269dc) 6%, transparent);align-items:center;gap:8px;padding:13px 16px;font-size:12px;font-weight:600;display:flex}.fdM_xW_dot{background:var(--dsw-alias-state-business-primary,#5269dc);border-radius:50%;width:6px;height:6px}.fdM_xW_body{max-height:min(42vh,28rem);padding:15px 18px;overflow:auto}.fdM_xW_footer{border-top:1px solid var(--dsw-alias-border-l2,#dedee3);flex-direction:column;gap:10px;padding:13px 16px;display:flex}.fdM_xW_feedback{color:var(--dsw-alias-state-error-primary,#c0392b);font-size:11px}.fdM_xW_feedback:empty{display:none}.fdM_xW_actions{flex-wrap:wrap;align-items:center;gap:8px;display:flex}.fdM_xW_actions>:last-child{margin-left:auto}.fdM_xW_planPicker{align-items:center;min-width:0;display:flex}";
		const tagId$3 = "dsh-model-dispatch/styles.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId$3) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "dsh-model-dispatch";
			tag.dataset.pluginCss = tagId$3;
			tag.textContent = css$3;
			document.head.appendChild(tag);
		}
		var styles_module_css_default = {
			"actions": "fdM_xW_actions",
			"body": "fdM_xW_body",
			"card": "fdM_xW_card",
			"dot": "fdM_xW_dot",
			"error": "fdM_xW_error",
			"feedback": "fdM_xW_feedback",
			"footer": "fdM_xW_footer",
			"frame": "fdM_xW_frame",
			"planPicker": "fdM_xW_planPicker",
			"saveStatus": "fdM_xW_saveStatus",
			"section": "fdM_xW_section",
			"settingControl": "fdM_xW_settingControl",
			"settingCopy": "fdM_xW_settingCopy",
			"settingHint": "fdM_xW_settingHint",
			"settingRow": "fdM_xW_settingRow",
			"settingTitle": "fdM_xW_settingTitle",
			"settingsHeader": "fdM_xW_settingsHeader",
			"settingsList": "fdM_xW_settingsList",
			"strip": "fdM_xW_strip",
			"title": "fdM_xW_title"
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
		//#region lib/route-contract.js
		const ROUTE_STATUS_PATH = "/_dsh/model-switch/route-status";
		const ROUTE_CONFIRM_PATH = "/_dsh/model-switch/confirm-child-route";
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
		//#region \0dsh-css:D:\dsh\upstream\dsh-model-dispatch\src\client\SessionSubagentPicker.module.css.mjs
		const css$2 = ".oaVGiW_wrap{align-items:center;min-width:0;display:inline-flex;position:relative}.oaVGiW_error{max-width:280px;color:var(--dsw-alias-state-error-primary,#c0392b);background:var(--dsw-specific-menu,#fff);border:1px solid var(--dsw-alias-border-l2,#dedee3);overflow-wrap:anywhere;border-radius:8px;padding:6px 9px;font-size:10px;line-height:15px;position:absolute;bottom:calc(100% + 6px);right:0;box-shadow:0 4px 18px #0002}.oaVGiW_status{color:var(--dsw-alias-state-success-primary,#38845a);padding:0 4px;font-size:11px}";
		const tagId$2 = "dsh-model-dispatch/SessionSubagentPicker.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId$2) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "dsh-model-dispatch";
			tag.dataset.pluginCss = tagId$2;
			tag.textContent = css$2;
			document.head.appendChild(tag);
		}
		var SessionSubagentPicker_module_css_default = {
			"error": "oaVGiW_error",
			"status": "oaVGiW_status",
			"wrap": "oaVGiW_wrap"
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
			const problem = routeSnap.error ?? state?.error ?? snap.error;
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
				children: [(0, react_jsx_runtime.jsx)(ModelPicker, {
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
					seed: false,
					onClear: override ? () => write(void 0) : void 0,
					clearLabel: t("sessionPickerClear")
				}), (0, react_jsx_runtime.jsx)("span", {
					className: problem ? SessionSubagentPicker_module_css_default.error : SessionSubagentPicker_module_css_default.status,
					role: "status",
					"aria-label": statusLabel,
					title: statusLabel,
					children: problem ? `${routeMessage}: ${problem}` : healthy ? "✓" : unverified ? t("routeUnverifiedShort") : "…"
				})]
			});
		}
		//#endregion
		//#region \0dsh-css:D:\dsh\upstream\dsh-model-dispatch\src\client\SessionModelControls.module.css.mjs
		const css$1 = ".VxFI2a_bar{flex-wrap:wrap;justify-content:flex-end;align-items:center;gap:6px;min-width:0;display:flex}";
		const tagId$1 = "dsh-model-dispatch/SessionModelControls.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId$1) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "dsh-model-dispatch";
			tag.dataset.pluginCss = tagId$1;
			tag.textContent = css$1;
			document.head.appendChild(tag);
		}
		var SessionModelControls_module_css_default = { "bar": "VxFI2a_bar" };
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
		//#region \0dsh-css:D:\dsh\upstream\dsh-model-dispatch\src\client\SubagentModelBadge.module.css.mjs
		const css = ".u7E2gW_badge{min-width:0;max-width:220px;color:var(--dsw-alias-label-tertiary);text-overflow:ellipsis;white-space:nowrap;border-radius:12px;align-items:center;padding:2px 8px;font-size:12px;font-weight:500;line-height:18px;display:inline-flex;overflow:hidden}.u7E2gW_details{max-width:340px;font-size:12px;position:relative}.u7E2gW_details summary{cursor:pointer;text-overflow:ellipsis;white-space:nowrap;overflow:hidden}.u7E2gW_panel{z-index:30;border:1px solid var(--dsw-alias-border-l2,#ddd);background:var(--dsw-specific-menu,#fff);width:min(400px,85vw);color:var(--dsw-alias-label-primary,#222);overflow-wrap:anywhere;border-radius:10px;padding:16px;position:absolute;top:100%;right:0;box-shadow:0 6px 24px #0002}.u7E2gW_panel p{margin:6px 0}";
		const tagId = "dsh-model-dispatch/SubagentModelBadge.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "dsh-model-dispatch";
			tag.dataset.pluginCss = tagId;
			tag.textContent = css;
			document.head.appendChild(tag);
		}
		var SubagentModelBadge_module_css_default = {
			"badge": "u7E2gW_badge",
			"details": "u7E2gW_details",
			"panel": "u7E2gW_panel"
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
						(snap.error || status?.error) && (0, react_jsx_runtime.jsx)("p", {
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
			new SessionLabelStore();
			const overrides = new SessionOverrideStore();
			const routes = new RouteStatusStore();
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
					routes,
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