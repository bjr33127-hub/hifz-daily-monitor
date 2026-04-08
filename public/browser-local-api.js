(() => {
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
    get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
  }) : x)(function(x) {
    if (typeof require !== "undefined") return require.apply(this, arguments);
    throw Error('Dynamic require of "' + x + '" is not supported');
  });
  var __commonJS = (cb, mod) => function __require2() {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  };

  // node_modules/@capacitor/core/dist/index.cjs.js
  var require_index_cjs = __commonJS({
    "node_modules/@capacitor/core/dist/index.cjs.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.ExceptionCode = void 0;
      (function(ExceptionCode) {
        ExceptionCode["Unimplemented"] = "UNIMPLEMENTED";
        ExceptionCode["Unavailable"] = "UNAVAILABLE";
      })(exports.ExceptionCode || (exports.ExceptionCode = {}));
      var CapacitorException = class extends Error {
        constructor(message, code, data) {
          super(message);
          this.message = message;
          this.code = code;
          this.data = data;
        }
      };
      var getPlatformId = (win) => {
        var _a, _b;
        if (win === null || win === void 0 ? void 0 : win.androidBridge) {
          return "android";
        } else if ((_b = (_a = win === null || win === void 0 ? void 0 : win.webkit) === null || _a === void 0 ? void 0 : _a.messageHandlers) === null || _b === void 0 ? void 0 : _b.bridge) {
          return "ios";
        } else {
          return "web";
        }
      };
      var createCapacitor = (win) => {
        const capCustomPlatform = win.CapacitorCustomPlatform || null;
        const cap = win.Capacitor || {};
        const Plugins = cap.Plugins = cap.Plugins || {};
        const getPlatform = () => {
          return capCustomPlatform !== null ? capCustomPlatform.name : getPlatformId(win);
        };
        const isNativePlatform = () => getPlatform() !== "web";
        const isPluginAvailable = (pluginName) => {
          const plugin = registeredPlugins.get(pluginName);
          if (plugin === null || plugin === void 0 ? void 0 : plugin.platforms.has(getPlatform())) {
            return true;
          }
          if (getPluginHeader(pluginName)) {
            return true;
          }
          return false;
        };
        const getPluginHeader = (pluginName) => {
          var _a;
          return (_a = cap.PluginHeaders) === null || _a === void 0 ? void 0 : _a.find((h) => h.name === pluginName);
        };
        const handleError = (err) => win.console.error(err);
        const registeredPlugins = /* @__PURE__ */ new Map();
        const registerPlugin2 = (pluginName, jsImplementations = {}) => {
          const registeredPlugin = registeredPlugins.get(pluginName);
          if (registeredPlugin) {
            console.warn(`Capacitor plugin "${pluginName}" already registered. Cannot register plugins twice.`);
            return registeredPlugin.proxy;
          }
          const platform = getPlatform();
          const pluginHeader = getPluginHeader(pluginName);
          let jsImplementation;
          const loadPluginImplementation = async () => {
            if (!jsImplementation && platform in jsImplementations) {
              jsImplementation = typeof jsImplementations[platform] === "function" ? jsImplementation = await jsImplementations[platform]() : jsImplementation = jsImplementations[platform];
            } else if (capCustomPlatform !== null && !jsImplementation && "web" in jsImplementations) {
              jsImplementation = typeof jsImplementations["web"] === "function" ? jsImplementation = await jsImplementations["web"]() : jsImplementation = jsImplementations["web"];
            }
            return jsImplementation;
          };
          const createPluginMethod = (impl, prop) => {
            var _a, _b;
            if (pluginHeader) {
              const methodHeader = pluginHeader === null || pluginHeader === void 0 ? void 0 : pluginHeader.methods.find((m) => prop === m.name);
              if (methodHeader) {
                if (methodHeader.rtype === "promise") {
                  return (options) => cap.nativePromise(pluginName, prop.toString(), options);
                } else {
                  return (options, callback) => cap.nativeCallback(pluginName, prop.toString(), options, callback);
                }
              } else if (impl) {
                return (_a = impl[prop]) === null || _a === void 0 ? void 0 : _a.bind(impl);
              }
            } else if (impl) {
              return (_b = impl[prop]) === null || _b === void 0 ? void 0 : _b.bind(impl);
            } else {
              throw new CapacitorException(`"${pluginName}" plugin is not implemented on ${platform}`, exports.ExceptionCode.Unimplemented);
            }
          };
          const createPluginMethodWrapper = (prop) => {
            let remove;
            const wrapper = (...args) => {
              const p = loadPluginImplementation().then((impl) => {
                const fn = createPluginMethod(impl, prop);
                if (fn) {
                  const p2 = fn(...args);
                  remove = p2 === null || p2 === void 0 ? void 0 : p2.remove;
                  return p2;
                } else {
                  throw new CapacitorException(`"${pluginName}.${prop}()" is not implemented on ${platform}`, exports.ExceptionCode.Unimplemented);
                }
              });
              if (prop === "addListener") {
                p.remove = async () => remove();
              }
              return p;
            };
            wrapper.toString = () => `${prop.toString()}() { [capacitor code] }`;
            Object.defineProperty(wrapper, "name", {
              value: prop,
              writable: false,
              configurable: false
            });
            return wrapper;
          };
          const addListener = createPluginMethodWrapper("addListener");
          const removeListener = createPluginMethodWrapper("removeListener");
          const addListenerNative = (eventName, callback) => {
            const call = addListener({ eventName }, callback);
            const remove = async () => {
              const callbackId = await call;
              removeListener({
                eventName,
                callbackId
              }, callback);
            };
            const p = new Promise((resolve) => call.then(() => resolve({ remove })));
            p.remove = async () => {
              console.warn(`Using addListener() without 'await' is deprecated.`);
              await remove();
            };
            return p;
          };
          const proxy = new Proxy({}, {
            get(_, prop) {
              switch (prop) {
                // https://github.com/facebook/react/issues/20030
                case "$$typeof":
                  return void 0;
                case "toJSON":
                  return () => ({});
                case "addListener":
                  return pluginHeader ? addListenerNative : addListener;
                case "removeListener":
                  return removeListener;
                default:
                  return createPluginMethodWrapper(prop);
              }
            }
          });
          Plugins[pluginName] = proxy;
          registeredPlugins.set(pluginName, {
            name: pluginName,
            proxy,
            platforms: /* @__PURE__ */ new Set([...Object.keys(jsImplementations), ...pluginHeader ? [platform] : []])
          });
          return proxy;
        };
        if (!cap.convertFileSrc) {
          cap.convertFileSrc = (filePath) => filePath;
        }
        cap.getPlatform = getPlatform;
        cap.handleError = handleError;
        cap.isNativePlatform = isNativePlatform;
        cap.isPluginAvailable = isPluginAvailable;
        cap.registerPlugin = registerPlugin2;
        cap.Exception = CapacitorException;
        cap.DEBUG = !!cap.DEBUG;
        cap.isLoggingEnabled = !!cap.isLoggingEnabled;
        return cap;
      };
      var initCapacitorGlobal = (win) => win.Capacitor = createCapacitor(win);
      var Capacitor = /* @__PURE__ */ initCapacitorGlobal(typeof globalThis !== "undefined" ? globalThis : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : typeof global !== "undefined" ? global : {});
      var registerPlugin = Capacitor.registerPlugin;
      var WebPlugin = class {
        constructor() {
          this.listeners = {};
          this.retainedEventArguments = {};
          this.windowListeners = {};
        }
        addListener(eventName, listenerFunc) {
          let firstListener = false;
          const listeners = this.listeners[eventName];
          if (!listeners) {
            this.listeners[eventName] = [];
            firstListener = true;
          }
          this.listeners[eventName].push(listenerFunc);
          const windowListener = this.windowListeners[eventName];
          if (windowListener && !windowListener.registered) {
            this.addWindowListener(windowListener);
          }
          if (firstListener) {
            this.sendRetainedArgumentsForEvent(eventName);
          }
          const remove = async () => this.removeListener(eventName, listenerFunc);
          const p = Promise.resolve({ remove });
          return p;
        }
        async removeAllListeners() {
          this.listeners = {};
          for (const listener in this.windowListeners) {
            this.removeWindowListener(this.windowListeners[listener]);
          }
          this.windowListeners = {};
        }
        notifyListeners(eventName, data, retainUntilConsumed) {
          const listeners = this.listeners[eventName];
          if (!listeners) {
            if (retainUntilConsumed) {
              let args = this.retainedEventArguments[eventName];
              if (!args) {
                args = [];
              }
              args.push(data);
              this.retainedEventArguments[eventName] = args;
            }
            return;
          }
          listeners.forEach((listener) => listener(data));
        }
        hasListeners(eventName) {
          var _a;
          return !!((_a = this.listeners[eventName]) === null || _a === void 0 ? void 0 : _a.length);
        }
        registerWindowListener(windowEventName, pluginEventName) {
          this.windowListeners[pluginEventName] = {
            registered: false,
            windowEventName,
            pluginEventName,
            handler: (event) => {
              this.notifyListeners(pluginEventName, event);
            }
          };
        }
        unimplemented(msg = "not implemented") {
          return new Capacitor.Exception(msg, exports.ExceptionCode.Unimplemented);
        }
        unavailable(msg = "not available") {
          return new Capacitor.Exception(msg, exports.ExceptionCode.Unavailable);
        }
        async removeListener(eventName, listenerFunc) {
          const listeners = this.listeners[eventName];
          if (!listeners) {
            return;
          }
          const index = listeners.indexOf(listenerFunc);
          this.listeners[eventName].splice(index, 1);
          if (!this.listeners[eventName].length) {
            this.removeWindowListener(this.windowListeners[eventName]);
          }
        }
        addWindowListener(handle) {
          window.addEventListener(handle.windowEventName, handle.handler);
          handle.registered = true;
        }
        removeWindowListener(handle) {
          if (!handle) {
            return;
          }
          window.removeEventListener(handle.windowEventName, handle.handler);
          handle.registered = false;
        }
        sendRetainedArgumentsForEvent(eventName) {
          const args = this.retainedEventArguments[eventName];
          if (!args) {
            return;
          }
          delete this.retainedEventArguments[eventName];
          args.forEach((arg) => {
            this.notifyListeners(eventName, arg);
          });
        }
      };
      var WebView = /* @__PURE__ */ registerPlugin("WebView");
      var encode = (str) => encodeURIComponent(str).replace(/%(2[346B]|5E|60|7C)/g, decodeURIComponent).replace(/[()]/g, escape);
      var decode = (str) => str.replace(/(%[\dA-F]{2})+/gi, decodeURIComponent);
      var CapacitorCookiesPluginWeb = class extends WebPlugin {
        async getCookies() {
          const cookies = document.cookie;
          const cookieMap = {};
          cookies.split(";").forEach((cookie) => {
            if (cookie.length <= 0)
              return;
            let [key, value] = cookie.replace(/=/, "CAP_COOKIE").split("CAP_COOKIE");
            key = decode(key).trim();
            value = decode(value).trim();
            cookieMap[key] = value;
          });
          return cookieMap;
        }
        async setCookie(options) {
          try {
            const encodedKey = encode(options.key);
            const encodedValue = encode(options.value);
            const expires = options.expires ? `; expires=${options.expires.replace("expires=", "")}` : "";
            const path = (options.path || "/").replace("path=", "");
            const domain = options.url != null && options.url.length > 0 ? `domain=${options.url}` : "";
            document.cookie = `${encodedKey}=${encodedValue || ""}${expires}; path=${path}; ${domain};`;
          } catch (error) {
            return Promise.reject(error);
          }
        }
        async deleteCookie(options) {
          try {
            document.cookie = `${options.key}=; Max-Age=0`;
          } catch (error) {
            return Promise.reject(error);
          }
        }
        async clearCookies() {
          try {
            const cookies = document.cookie.split(";") || [];
            for (const cookie of cookies) {
              document.cookie = cookie.replace(/^ +/, "").replace(/=.*/, `=;expires=${(/* @__PURE__ */ new Date()).toUTCString()};path=/`);
            }
          } catch (error) {
            return Promise.reject(error);
          }
        }
        async clearAllCookies() {
          try {
            await this.clearCookies();
          } catch (error) {
            return Promise.reject(error);
          }
        }
      };
      var CapacitorCookies = registerPlugin("CapacitorCookies", {
        web: () => new CapacitorCookiesPluginWeb()
      });
      var readBlobAsBase64 = async (blob) => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const base64String = reader.result;
          resolve(base64String.indexOf(",") >= 0 ? base64String.split(",")[1] : base64String);
        };
        reader.onerror = (error) => reject(error);
        reader.readAsDataURL(blob);
      });
      var normalizeHttpHeaders = (headers = {}) => {
        const originalKeys = Object.keys(headers);
        const loweredKeys = Object.keys(headers).map((k) => k.toLocaleLowerCase());
        const normalized = loweredKeys.reduce((acc, key, index) => {
          acc[key] = headers[originalKeys[index]];
          return acc;
        }, {});
        return normalized;
      };
      var buildUrlParams = (params, shouldEncode = true) => {
        if (!params)
          return null;
        const output = Object.entries(params).reduce((accumulator, entry) => {
          const [key, value] = entry;
          let encodedValue;
          let item;
          if (Array.isArray(value)) {
            item = "";
            value.forEach((str) => {
              encodedValue = shouldEncode ? encodeURIComponent(str) : str;
              item += `${key}=${encodedValue}&`;
            });
            item.slice(0, -1);
          } else {
            encodedValue = shouldEncode ? encodeURIComponent(value) : value;
            item = `${key}=${encodedValue}`;
          }
          return `${accumulator}&${item}`;
        }, "");
        return output.substr(1);
      };
      var buildRequestInit = (options, extra = {}) => {
        const output = Object.assign({ method: options.method || "GET", headers: options.headers }, extra);
        const headers = normalizeHttpHeaders(options.headers);
        const type = headers["content-type"] || "";
        if (typeof options.data === "string") {
          output.body = options.data;
        } else if (type.includes("application/x-www-form-urlencoded")) {
          const params = new URLSearchParams();
          for (const [key, value] of Object.entries(options.data || {})) {
            params.set(key, value);
          }
          output.body = params.toString();
        } else if (type.includes("multipart/form-data") || options.data instanceof FormData) {
          const form = new FormData();
          if (options.data instanceof FormData) {
            options.data.forEach((value, key) => {
              form.append(key, value);
            });
          } else {
            for (const key of Object.keys(options.data)) {
              form.append(key, options.data[key]);
            }
          }
          output.body = form;
          const headers2 = new Headers(output.headers);
          headers2.delete("content-type");
          output.headers = headers2;
        } else if (type.includes("application/json") || typeof options.data === "object") {
          output.body = JSON.stringify(options.data);
        }
        return output;
      };
      var CapacitorHttpPluginWeb = class extends WebPlugin {
        /**
         * Perform an Http request given a set of options
         * @param options Options to build the HTTP request
         */
        async request(options) {
          const requestInit = buildRequestInit(options, options.webFetchExtra);
          const urlParams = buildUrlParams(options.params, options.shouldEncodeUrlParams);
          const url = urlParams ? `${options.url}?${urlParams}` : options.url;
          const response = await fetch(url, requestInit);
          const contentType = response.headers.get("content-type") || "";
          let { responseType = "text" } = response.ok ? options : {};
          if (contentType.includes("application/json")) {
            responseType = "json";
          }
          let data;
          let blob;
          switch (responseType) {
            case "arraybuffer":
            case "blob":
              blob = await response.blob();
              data = await readBlobAsBase64(blob);
              break;
            case "json":
              data = await response.json();
              break;
            case "document":
            case "text":
            default:
              data = await response.text();
          }
          const headers = {};
          response.headers.forEach((value, key) => {
            headers[key] = value;
          });
          return {
            data,
            headers,
            status: response.status,
            url: response.url
          };
        }
        /**
         * Perform an Http GET request given a set of options
         * @param options Options to build the HTTP request
         */
        async get(options) {
          return this.request(Object.assign(Object.assign({}, options), { method: "GET" }));
        }
        /**
         * Perform an Http POST request given a set of options
         * @param options Options to build the HTTP request
         */
        async post(options) {
          return this.request(Object.assign(Object.assign({}, options), { method: "POST" }));
        }
        /**
         * Perform an Http PUT request given a set of options
         * @param options Options to build the HTTP request
         */
        async put(options) {
          return this.request(Object.assign(Object.assign({}, options), { method: "PUT" }));
        }
        /**
         * Perform an Http PATCH request given a set of options
         * @param options Options to build the HTTP request
         */
        async patch(options) {
          return this.request(Object.assign(Object.assign({}, options), { method: "PATCH" }));
        }
        /**
         * Perform an Http DELETE request given a set of options
         * @param options Options to build the HTTP request
         */
        async delete(options) {
          return this.request(Object.assign(Object.assign({}, options), { method: "DELETE" }));
        }
      };
      var CapacitorHttp = registerPlugin("CapacitorHttp", {
        web: () => new CapacitorHttpPluginWeb()
      });
      exports.SystemBarsStyle = void 0;
      (function(SystemBarsStyle) {
        SystemBarsStyle["Dark"] = "DARK";
        SystemBarsStyle["Light"] = "LIGHT";
        SystemBarsStyle["Default"] = "DEFAULT";
      })(exports.SystemBarsStyle || (exports.SystemBarsStyle = {}));
      exports.SystemBarType = void 0;
      (function(SystemBarType) {
        SystemBarType["StatusBar"] = "StatusBar";
        SystemBarType["NavigationBar"] = "NavigationBar";
      })(exports.SystemBarType || (exports.SystemBarType = {}));
      var SystemBarsPluginWeb = class extends WebPlugin {
        async setStyle() {
          this.unavailable("not available for web");
        }
        async setAnimation() {
          this.unavailable("not available for web");
        }
        async show() {
          this.unavailable("not available for web");
        }
        async hide() {
          this.unavailable("not available for web");
        }
      };
      var SystemBars = registerPlugin("SystemBars", {
        web: () => new SystemBarsPluginWeb()
      });
      exports.Capacitor = Capacitor;
      exports.CapacitorCookies = CapacitorCookies;
      exports.CapacitorException = CapacitorException;
      exports.CapacitorHttp = CapacitorHttp;
      exports.SystemBars = SystemBars;
      exports.WebPlugin = WebPlugin;
      exports.WebView = WebView;
      exports.buildRequestInit = buildRequestInit;
      exports.registerPlugin = registerPlugin;
    }
  });

  // node_modules/@capacitor/local-notifications/dist/plugin.cjs.js
  var require_plugin_cjs = __commonJS({
    "node_modules/@capacitor/local-notifications/dist/plugin.cjs.js"(exports) {
      "use strict";
      var core = require_index_cjs();
      exports.Weekday = void 0;
      (function(Weekday) {
        Weekday[Weekday["Sunday"] = 1] = "Sunday";
        Weekday[Weekday["Monday"] = 2] = "Monday";
        Weekday[Weekday["Tuesday"] = 3] = "Tuesday";
        Weekday[Weekday["Wednesday"] = 4] = "Wednesday";
        Weekday[Weekday["Thursday"] = 5] = "Thursday";
        Weekday[Weekday["Friday"] = 6] = "Friday";
        Weekday[Weekday["Saturday"] = 7] = "Saturday";
      })(exports.Weekday || (exports.Weekday = {}));
      var LocalNotifications2 = core.registerPlugin("LocalNotifications", {
        web: () => Promise.resolve().then(function() {
          return web;
        }).then((m) => new m.LocalNotificationsWeb())
      });
      var LocalNotificationsWeb = class extends core.WebPlugin {
        constructor() {
          super(...arguments);
          this.pending = [];
          this.deliveredNotifications = [];
          this.hasNotificationSupport = () => {
            if (!("Notification" in window) || !Notification.requestPermission) {
              return false;
            }
            if (Notification.permission !== "granted") {
              try {
                new Notification("");
              } catch (e) {
                if (e instanceof Error && e.name === "TypeError") {
                  return false;
                }
              }
            }
            return true;
          };
        }
        async getDeliveredNotifications() {
          const deliveredSchemas = [];
          for (const notification of this.deliveredNotifications) {
            const deliveredSchema = {
              title: notification.title,
              id: parseInt(notification.tag),
              body: notification.body
            };
            deliveredSchemas.push(deliveredSchema);
          }
          return {
            notifications: deliveredSchemas
          };
        }
        async removeDeliveredNotifications(delivered) {
          for (const toRemove of delivered.notifications) {
            const found = this.deliveredNotifications.find((n) => n.tag === String(toRemove.id));
            found === null || found === void 0 ? void 0 : found.close();
            this.deliveredNotifications = this.deliveredNotifications.filter(() => !found);
          }
        }
        async removeAllDeliveredNotifications() {
          for (const notification of this.deliveredNotifications) {
            notification.close();
          }
          this.deliveredNotifications = [];
        }
        async createChannel() {
          throw this.unimplemented("Not implemented on web.");
        }
        async deleteChannel() {
          throw this.unimplemented("Not implemented on web.");
        }
        async listChannels() {
          throw this.unimplemented("Not implemented on web.");
        }
        async schedule(options) {
          if (!this.hasNotificationSupport()) {
            throw this.unavailable("Notifications not supported in this browser.");
          }
          for (const notification of options.notifications) {
            this.sendNotification(notification);
          }
          return {
            notifications: options.notifications.map((notification) => ({
              id: notification.id
            }))
          };
        }
        async getPending() {
          return {
            notifications: this.pending
          };
        }
        async registerActionTypes() {
          throw this.unimplemented("Not implemented on web.");
        }
        async cancel(pending) {
          this.pending = this.pending.filter((notification) => !pending.notifications.find((n) => n.id === notification.id));
        }
        async areEnabled() {
          const { display } = await this.checkPermissions();
          return {
            value: display === "granted"
          };
        }
        async changeExactNotificationSetting() {
          throw this.unimplemented("Not implemented on web.");
        }
        async checkExactNotificationSetting() {
          throw this.unimplemented("Not implemented on web.");
        }
        async requestPermissions() {
          if (!this.hasNotificationSupport()) {
            throw this.unavailable("Notifications not supported in this browser.");
          }
          const display = this.transformNotificationPermission(await Notification.requestPermission());
          return { display };
        }
        async checkPermissions() {
          if (!this.hasNotificationSupport()) {
            throw this.unavailable("Notifications not supported in this browser.");
          }
          const display = this.transformNotificationPermission(Notification.permission);
          return { display };
        }
        transformNotificationPermission(permission) {
          switch (permission) {
            case "granted":
              return "granted";
            case "denied":
              return "denied";
            default:
              return "prompt";
          }
        }
        sendPending() {
          var _a;
          const toRemove = [];
          const now = (/* @__PURE__ */ new Date()).getTime();
          for (const notification of this.pending) {
            if (((_a = notification.schedule) === null || _a === void 0 ? void 0 : _a.at) && notification.schedule.at.getTime() <= now) {
              this.buildNotification(notification);
              toRemove.push(notification);
            }
          }
          this.pending = this.pending.filter((notification) => !toRemove.find((n) => n === notification));
        }
        sendNotification(notification) {
          var _a;
          if ((_a = notification.schedule) === null || _a === void 0 ? void 0 : _a.at) {
            const diff = notification.schedule.at.getTime() - (/* @__PURE__ */ new Date()).getTime();
            this.pending.push(notification);
            setTimeout(() => {
              this.sendPending();
            }, diff);
            return;
          }
          this.buildNotification(notification);
        }
        buildNotification(notification) {
          const localNotification = new Notification(notification.title, {
            body: notification.body,
            tag: String(notification.id)
          });
          localNotification.addEventListener("click", this.onClick.bind(this, notification), false);
          localNotification.addEventListener("show", this.onShow.bind(this, notification), false);
          localNotification.addEventListener("close", () => {
            this.deliveredNotifications = this.deliveredNotifications.filter(() => !this);
          }, false);
          this.deliveredNotifications.push(localNotification);
          return localNotification;
        }
        onClick(notification) {
          const data = {
            actionId: "tap",
            notification
          };
          this.notifyListeners("localNotificationActionPerformed", data);
        }
        onShow(notification) {
          this.notifyListeners("localNotificationReceived", notification);
        }
      };
      var web = /* @__PURE__ */ Object.freeze({
        __proto__: null,
        LocalNotificationsWeb
      });
      exports.LocalNotifications = LocalNotifications2;
    }
  });

  // node_modules/ts-fsrs/dist/index.cjs
  var require_dist = __commonJS({
    "node_modules/ts-fsrs/dist/index.cjs"(exports, module) {
      "use strict";
      var State = /* @__PURE__ */ ((State2) => {
        State2[State2["New"] = 0] = "New";
        State2[State2["Learning"] = 1] = "Learning";
        State2[State2["Review"] = 2] = "Review";
        State2[State2["Relearning"] = 3] = "Relearning";
        return State2;
      })(State || {});
      var Rating = /* @__PURE__ */ ((Rating2) => {
        Rating2[Rating2["Manual"] = 0] = "Manual";
        Rating2[Rating2["Again"] = 1] = "Again";
        Rating2[Rating2["Hard"] = 2] = "Hard";
        Rating2[Rating2["Good"] = 3] = "Good";
        Rating2[Rating2["Easy"] = 4] = "Easy";
        return Rating2;
      })(Rating || {});
      var TypeConvert = class _TypeConvert {
        static card(card) {
          return {
            ...card,
            state: _TypeConvert.state(card.state),
            due: _TypeConvert.time(card.due),
            last_review: card.last_review ? _TypeConvert.time(card.last_review) : void 0
          };
        }
        static rating(value) {
          if (typeof value === "string") {
            const firstLetter = value.charAt(0).toUpperCase();
            const restOfString = value.slice(1).toLowerCase();
            const ret = Rating[`${firstLetter}${restOfString}`];
            if (ret === void 0) {
              throw new Error(`Invalid rating:[${value}]`);
            }
            return ret;
          } else if (typeof value === "number") {
            return value;
          }
          throw new Error(`Invalid rating:[${value}]`);
        }
        static state(value) {
          if (typeof value === "string") {
            const firstLetter = value.charAt(0).toUpperCase();
            const restOfString = value.slice(1).toLowerCase();
            const ret = State[`${firstLetter}${restOfString}`];
            if (ret === void 0) {
              throw new Error(`Invalid state:[${value}]`);
            }
            return ret;
          } else if (typeof value === "number") {
            return value;
          }
          throw new Error(`Invalid state:[${value}]`);
        }
        static time(value) {
          if (value instanceof Date) {
            return value;
          }
          const date = new Date(value);
          if (typeof value === "object" && value !== null && !Number.isNaN(Date.parse(value) || +date)) {
            return date;
          } else if (typeof value === "string") {
            const timestamp = Date.parse(value);
            if (!Number.isNaN(timestamp)) {
              return new Date(timestamp);
            } else {
              throw new Error(`Invalid date:[${value}]`);
            }
          } else if (typeof value === "number") {
            return new Date(value);
          }
          throw new Error(`Invalid date:[${value}]`);
        }
        static review_log(log) {
          return {
            ...log,
            due: _TypeConvert.time(log.due),
            rating: _TypeConvert.rating(log.rating),
            state: _TypeConvert.state(log.state),
            review: _TypeConvert.time(log.review)
          };
        }
      };
      Date.prototype.scheduler = function(t, isDay) {
        return date_scheduler(this, t, isDay);
      };
      Date.prototype.diff = function(pre, unit) {
        return date_diff(this, pre, unit);
      };
      Date.prototype.format = function() {
        return formatDate(this);
      };
      Date.prototype.dueFormat = function(last_review, unit, timeUnit) {
        return show_diff_message(this, last_review, unit, timeUnit);
      };
      function date_scheduler(now, t, isDay) {
        return new Date(
          isDay ? TypeConvert.time(now).getTime() + t * 24 * 60 * 60 * 1e3 : TypeConvert.time(now).getTime() + t * 60 * 1e3
        );
      }
      function date_diff(now, pre, unit) {
        if (!now || !pre) {
          throw new Error("Invalid date");
        }
        const diff = TypeConvert.time(now).getTime() - TypeConvert.time(pre).getTime();
        let r = 0;
        switch (unit) {
          case "days":
            r = Math.floor(diff / (24 * 60 * 60 * 1e3));
            break;
          case "minutes":
            r = Math.floor(diff / (60 * 1e3));
            break;
        }
        return r;
      }
      function formatDate(dateInput) {
        const date = TypeConvert.time(dateInput);
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const day = date.getDate();
        const hours = date.getHours();
        const minutes = date.getMinutes();
        const seconds = date.getSeconds();
        return `${year}-${padZero(month)}-${padZero(day)} ${padZero(hours)}:${padZero(
          minutes
        )}:${padZero(seconds)}`;
      }
      function padZero(num) {
        return num < 10 ? `0${num}` : `${num}`;
      }
      var TIMEUNIT = [60, 60, 24, 31, 12];
      var TIMEUNITFORMAT = ["second", "min", "hour", "day", "month", "year"];
      function show_diff_message(due, last_review, unit, timeUnit = TIMEUNITFORMAT) {
        due = TypeConvert.time(due);
        last_review = TypeConvert.time(last_review);
        if (timeUnit.length !== TIMEUNITFORMAT.length) {
          timeUnit = TIMEUNITFORMAT;
        }
        let diff = due.getTime() - last_review.getTime();
        let i = 0;
        diff /= 1e3;
        for (i = 0; i < TIMEUNIT.length; i++) {
          if (diff < TIMEUNIT[i]) {
            break;
          } else {
            diff /= TIMEUNIT[i];
          }
        }
        return `${Math.floor(diff)}${unit ? timeUnit[i] : ""}`;
      }
      function fixDate(value) {
        return TypeConvert.time(value);
      }
      function fixState(value) {
        return TypeConvert.state(value);
      }
      function fixRating(value) {
        return TypeConvert.rating(value);
      }
      var Grades = Object.freeze([
        Rating.Again,
        Rating.Hard,
        Rating.Good,
        Rating.Easy
      ]);
      var FUZZ_RANGES = [
        {
          start: 2.5,
          end: 7,
          factor: 0.15
        },
        {
          start: 7,
          end: 20,
          factor: 0.1
        },
        {
          start: 20,
          end: Infinity,
          factor: 0.05
        }
      ];
      function get_fuzz_range(interval, elapsed_days, maximum_interval) {
        let delta = 1;
        for (const range of FUZZ_RANGES) {
          delta += range.factor * Math.max(Math.min(interval, range.end) - range.start, 0);
        }
        interval = Math.min(interval, maximum_interval);
        let min_ivl = Math.max(2, Math.round(interval - delta));
        const max_ivl = Math.min(Math.round(interval + delta), maximum_interval);
        if (interval > elapsed_days) {
          min_ivl = Math.max(min_ivl, elapsed_days + 1);
        }
        min_ivl = Math.min(min_ivl, max_ivl);
        return { min_ivl, max_ivl };
      }
      function clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
      }
      function roundTo(num, decimals) {
        const factor = 10 ** decimals;
        return Math.round(num * factor) / factor;
      }
      function dateDiffInDays(last, cur) {
        const utc1 = Date.UTC(
          last.getUTCFullYear(),
          last.getUTCMonth(),
          last.getUTCDate()
        );
        const utc2 = Date.UTC(
          cur.getUTCFullYear(),
          cur.getUTCMonth(),
          cur.getUTCDate()
        );
        return Math.floor(
          (utc2 - utc1) / 864e5
          /** 1000 * 60 * 60 * 24*/
        );
      }
      var ConvertStepUnitToMinutes = (step) => {
        const unit = step.slice(-1);
        const value = parseInt(step.slice(0, -1), 10);
        if (Number.isNaN(value) || !Number.isFinite(value) || value < 0) {
          throw new Error(`Invalid step value: ${step}`);
        }
        switch (unit) {
          case "m":
            return value;
          case "h":
            return value * 60;
          case "d":
            return value * 1440;
          default:
            throw new Error(`Invalid step unit: ${step}, expected m/h/d`);
        }
      };
      var BasicLearningStepsStrategy = (params, state, cur_step) => {
        const learning_steps = state === State.Relearning || state === State.Review ? params.relearning_steps : params.learning_steps;
        const steps_length = learning_steps.length;
        if (steps_length === 0 || cur_step >= steps_length) return {};
        const firstStep = learning_steps[0];
        const toMinutes = ConvertStepUnitToMinutes;
        const getAgainInterval = () => {
          return toMinutes(firstStep);
        };
        const getHardInterval = () => {
          if (steps_length === 1) return Math.round(toMinutes(firstStep) * 1.5);
          const nextStep = learning_steps[1];
          return Math.round((toMinutes(firstStep) + toMinutes(nextStep)) / 2);
        };
        const getStepInfo = (index) => {
          if (index < 0 || index >= steps_length) {
            return null;
          } else {
            return learning_steps[index];
          }
        };
        const getGoodMinutes = (step) => {
          return toMinutes(step);
        };
        const result = {};
        const step_info = getStepInfo(Math.max(0, cur_step));
        if (state === State.Review) {
          result[Rating.Again] = {
            scheduled_minutes: toMinutes(step_info),
            next_step: 0
          };
          return result;
        } else {
          result[Rating.Again] = {
            scheduled_minutes: getAgainInterval(),
            next_step: 0
          };
          result[Rating.Hard] = {
            scheduled_minutes: getHardInterval(),
            next_step: cur_step
          };
          const next_info = getStepInfo(cur_step + 1);
          if (next_info) {
            const nextMin = getGoodMinutes(next_info);
            if (nextMin) {
              result[Rating.Good] = {
                scheduled_minutes: Math.round(nextMin),
                next_step: cur_step + 1
              };
            }
          }
        }
        return result;
      };
      function DefaultInitSeedStrategy() {
        const time = this.review_time.getTime();
        const reps = this.current.reps;
        const mul = this.current.difficulty * this.current.stability;
        return `${time}_${reps}_${mul}`;
      }
      function GenSeedStrategyWithCardId(card_id_field) {
        return function() {
          const card_id = Reflect.get(this.current, card_id_field) ?? 0;
          const reps = this.current.reps;
          return String(card_id + reps || 0);
        };
      }
      var StrategyMode = /* @__PURE__ */ ((StrategyMode2) => {
        StrategyMode2["SCHEDULER"] = "Scheduler";
        StrategyMode2["LEARNING_STEPS"] = "LearningSteps";
        StrategyMode2["SEED"] = "Seed";
        return StrategyMode2;
      })(StrategyMode || {});
      var AbstractScheduler = class {
        last;
        current;
        review_time;
        next = /* @__PURE__ */ new Map();
        algorithm;
        strategies;
        elapsed_days = 0;
        // init
        constructor(card, now, algorithm, strategies) {
          this.algorithm = algorithm;
          this.last = TypeConvert.card(card);
          this.current = TypeConvert.card(card);
          this.review_time = TypeConvert.time(now);
          this.strategies = strategies;
          this.init();
        }
        checkGrade(grade) {
          if (!Number.isFinite(grade) || grade < 0 || grade > 4) {
            throw new Error(`Invalid grade "${grade}",expected 1-4`);
          }
        }
        init() {
          const { state, last_review } = this.current;
          let interval = 0;
          if (state !== State.New && last_review) {
            interval = dateDiffInDays(last_review, this.review_time);
          }
          this.current.last_review = this.review_time;
          this.elapsed_days = interval;
          this.current.elapsed_days = interval;
          this.current.reps += 1;
          let seed_strategy = DefaultInitSeedStrategy;
          if (this.strategies) {
            const custom_strategy = this.strategies.get(StrategyMode.SEED);
            if (custom_strategy) {
              seed_strategy = custom_strategy;
            }
          }
          this.algorithm.seed = seed_strategy.call(this);
        }
        preview() {
          return {
            [Rating.Again]: this.review(Rating.Again),
            [Rating.Hard]: this.review(Rating.Hard),
            [Rating.Good]: this.review(Rating.Good),
            [Rating.Easy]: this.review(Rating.Easy),
            [Symbol.iterator]: this.previewIterator.bind(this)
          };
        }
        *previewIterator() {
          for (const grade of Grades) {
            yield this.review(grade);
          }
        }
        review(grade) {
          const { state } = this.last;
          let item;
          this.checkGrade(grade);
          switch (state) {
            case State.New:
              item = this.newState(grade);
              break;
            case State.Learning:
            case State.Relearning:
              item = this.learningState(grade);
              break;
            case State.Review:
              item = this.reviewState(grade);
              break;
          }
          return item;
        }
        buildLog(rating) {
          const { last_review, due, elapsed_days } = this.last;
          return {
            rating,
            state: this.current.state,
            due: last_review || due,
            stability: this.current.stability,
            difficulty: this.current.difficulty,
            elapsed_days: this.elapsed_days,
            last_elapsed_days: elapsed_days,
            scheduled_days: this.current.scheduled_days,
            learning_steps: this.current.learning_steps,
            review: this.review_time
          };
        }
      };
      var Alea = class {
        c;
        s0;
        s1;
        s2;
        constructor(seed) {
          const mash = Mash();
          this.c = 1;
          this.s0 = mash(" ");
          this.s1 = mash(" ");
          this.s2 = mash(" ");
          if (seed == null) seed = Date.now();
          this.s0 -= mash(seed);
          if (this.s0 < 0) this.s0 += 1;
          this.s1 -= mash(seed);
          if (this.s1 < 0) this.s1 += 1;
          this.s2 -= mash(seed);
          if (this.s2 < 0) this.s2 += 1;
        }
        next() {
          const t = 2091639 * this.s0 + this.c * 23283064365386963e-26;
          this.s0 = this.s1;
          this.s1 = this.s2;
          this.c = t | 0;
          this.s2 = t - this.c;
          return this.s2;
        }
        set state(state) {
          this.c = state.c;
          this.s0 = state.s0;
          this.s1 = state.s1;
          this.s2 = state.s2;
        }
        get state() {
          return {
            c: this.c,
            s0: this.s0,
            s1: this.s1,
            s2: this.s2
          };
        }
      };
      function Mash() {
        let n = 4022871197;
        return function mash(data) {
          data = String(data);
          for (let i = 0; i < data.length; i++) {
            n += data.charCodeAt(i);
            let h = 0.02519603282416938 * n;
            n = h >>> 0;
            h -= n;
            h *= n;
            n = h >>> 0;
            h -= n;
            n += h * 4294967296;
          }
          return (n >>> 0) * 23283064365386963e-26;
        };
      }
      function alea(seed) {
        const xg = new Alea(seed);
        const prng = () => xg.next();
        prng.int32 = () => xg.next() * 4294967296 | 0;
        prng.double = () => prng() + (prng() * 2097152 | 0) * 11102230246251565e-32;
        prng.state = () => xg.state;
        prng.importState = (state) => {
          xg.state = state;
          return prng;
        };
        return prng;
      }
      var version = "5.3.2";
      var default_request_retention = 0.9;
      var default_maximum_interval = 36500;
      var default_enable_fuzz = false;
      var default_enable_short_term = true;
      var default_learning_steps = Object.freeze([
        "1m",
        "10m"
      ]);
      var default_relearning_steps = Object.freeze([
        "10m"
      ]);
      var FSRSVersion = `v${version} using FSRS-6.0`;
      var S_MIN = 1e-3;
      var S_MAX = 36500;
      var INIT_S_MAX = 100;
      var FSRS5_DEFAULT_DECAY = 0.5;
      var FSRS6_DEFAULT_DECAY = 0.1542;
      var default_w = Object.freeze([
        0.212,
        1.2931,
        2.3065,
        8.2956,
        6.4133,
        0.8334,
        3.0194,
        1e-3,
        1.8722,
        0.1666,
        0.796,
        1.4835,
        0.0614,
        0.2629,
        1.6483,
        0.6014,
        1.8729,
        0.5425,
        0.0912,
        0.0658,
        FSRS6_DEFAULT_DECAY
      ]);
      var W17_W18_Ceiling = 2;
      var CLAMP_PARAMETERS = (w17_w18_ceiling, enable_short_term = default_enable_short_term) => [
        [S_MIN, INIT_S_MAX],
        [S_MIN, INIT_S_MAX],
        [S_MIN, INIT_S_MAX],
        [S_MIN, INIT_S_MAX],
        [1, 10],
        [1e-3, 4],
        [1e-3, 4],
        [1e-3, 0.75],
        [0, 4.5],
        [0, 0.8],
        [1e-3, 3.5],
        [1e-3, 5],
        [1e-3, 0.25],
        [1e-3, 0.9],
        [0, 4],
        [0, 1],
        [1, 6],
        [0, w17_w18_ceiling],
        [0, w17_w18_ceiling],
        [
          enable_short_term ? 0.01 : 0,
          0.8
        ],
        [0.1, 0.8]
      ];
      var clipParameters = (parameters, numRelearningSteps, enableShortTerm = default_enable_short_term) => {
        let w17_w18_ceiling = W17_W18_Ceiling;
        if (Math.max(0, numRelearningSteps) > 1) {
          const value = -(Math.log(parameters[11]) + Math.log(Math.pow(2, parameters[13]) - 1) + parameters[14] * 0.3) / numRelearningSteps;
          w17_w18_ceiling = clamp(+value.toFixed(8), 0.01, 2);
        }
        const clip = CLAMP_PARAMETERS(w17_w18_ceiling, enableShortTerm).slice(
          0,
          parameters.length
        );
        return clip.map(
          ([min, max], index) => clamp(parameters[index] || 0, min, max)
        );
      };
      var checkParameters = (parameters) => {
        const invalid = parameters.find(
          (param) => !Number.isFinite(param) && !Number.isNaN(param)
        );
        if (invalid !== void 0) {
          throw Error(`Non-finite or NaN value in parameters ${parameters}`);
        } else if (![17, 19, 21].includes(parameters.length)) {
          throw Error(
            `Invalid parameter length: ${parameters.length}. Must be 17, 19 or 21 for FSRSv4, 5 and 6 respectively.`
          );
        }
        return parameters;
      };
      var migrateParameters = (parameters, numRelearningSteps = 0, enableShortTerm = default_enable_short_term) => {
        if (parameters === void 0) {
          return [...default_w];
        }
        switch (parameters.length) {
          case 21:
            return clipParameters(
              Array.from(parameters),
              numRelearningSteps,
              enableShortTerm
            );
          case 19:
            console.debug("[FSRS-6]auto fill w from 19 to 21 length");
            return clipParameters(
              Array.from(parameters),
              numRelearningSteps,
              enableShortTerm
            ).concat([0, FSRS5_DEFAULT_DECAY]);
          case 17: {
            const w = clipParameters(
              Array.from(parameters),
              numRelearningSteps,
              enableShortTerm
            );
            w[4] = +(w[5] * 2 + w[4]).toFixed(8);
            w[5] = +(Math.log(w[5] * 3 + 1) / 3).toFixed(8);
            w[6] = +(w[6] + 0.5).toFixed(8);
            console.debug("[FSRS-6]auto fill w from 17 to 21 length");
            return w.concat([0, 0, 0, FSRS5_DEFAULT_DECAY]);
          }
          default:
            console.warn("[FSRS]Invalid parameters length, using default parameters");
            return [...default_w];
        }
      };
      var generatorParameters = (props) => {
        const learning_steps = Array.isArray(props?.learning_steps) ? props.learning_steps : default_learning_steps;
        const relearning_steps = Array.isArray(props?.relearning_steps) ? props.relearning_steps : default_relearning_steps;
        const enable_short_term = props?.enable_short_term ?? default_enable_short_term;
        const w = migrateParameters(
          props?.w,
          relearning_steps.length,
          enable_short_term
        );
        return {
          request_retention: props?.request_retention || default_request_retention,
          maximum_interval: props?.maximum_interval || default_maximum_interval,
          w,
          enable_fuzz: props?.enable_fuzz ?? default_enable_fuzz,
          enable_short_term,
          learning_steps,
          relearning_steps
        };
      };
      function createEmptyCard(now, afterHandler) {
        const emptyCard = {
          due: now ? TypeConvert.time(now) : /* @__PURE__ */ new Date(),
          stability: 0,
          difficulty: 0,
          elapsed_days: 0,
          scheduled_days: 0,
          reps: 0,
          lapses: 0,
          learning_steps: 0,
          state: State.New,
          last_review: void 0
        };
        if (afterHandler && typeof afterHandler === "function") {
          return afterHandler(emptyCard);
        } else {
          return emptyCard;
        }
      }
      var computeDecayFactor = (decayOrParams) => {
        const decay = typeof decayOrParams === "number" ? -decayOrParams : -decayOrParams[20];
        const factor = Math.exp(Math.pow(decay, -1) * Math.log(0.9)) - 1;
        return { decay, factor: roundTo(factor, 8) };
      };
      function forgetting_curve(decayOrParams, elapsed_days, stability) {
        const { decay, factor } = computeDecayFactor(decayOrParams);
        return roundTo(Math.pow(1 + factor * elapsed_days / stability, decay), 8);
      }
      var FSRSAlgorithm = class {
        param;
        intervalModifier;
        _seed;
        constructor(params) {
          this.param = new Proxy(
            generatorParameters(params),
            this.params_handler_proxy()
          );
          this.intervalModifier = this.calculate_interval_modifier(
            this.param.request_retention
          );
          this.forgetting_curve = forgetting_curve.bind(this, this.param.w);
        }
        get interval_modifier() {
          return this.intervalModifier;
        }
        set seed(seed) {
          this._seed = seed;
        }
        /**
         * @see https://github.com/open-spaced-repetition/fsrs4anki/wiki/The-Algorithm#fsrs-5
         *
         * The formula used is: $$I(r,s) = (r^{\frac{1}{DECAY}} - 1) / FACTOR \times s$$
         * @param request_retention 0<request_retention<=1,Requested retention rate
         * @throws {Error} Requested retention rate should be in the range (0,1]
         */
        calculate_interval_modifier(request_retention) {
          if (request_retention <= 0 || request_retention > 1) {
            throw new Error("Requested retention rate should be in the range (0,1]");
          }
          const { decay, factor } = computeDecayFactor(this.param.w);
          return roundTo((Math.pow(request_retention, 1 / decay) - 1) / factor, 8);
        }
        /**
         * Get the parameters of the algorithm.
         */
        get parameters() {
          return this.param;
        }
        /**
         * Set the parameters of the algorithm.
         * @param params Partial<FSRSParameters>
         */
        set parameters(params) {
          this.update_parameters(params);
        }
        params_handler_proxy() {
          const _this = this;
          return {
            set: function(target, prop, value) {
              if (prop === "request_retention" && Number.isFinite(value)) {
                _this.intervalModifier = _this.calculate_interval_modifier(
                  Number(value)
                );
              } else if (prop === "w") {
                value = migrateParameters(
                  value,
                  target.relearning_steps.length,
                  target.enable_short_term
                );
                _this.forgetting_curve = forgetting_curve.bind(this, value);
                _this.intervalModifier = _this.calculate_interval_modifier(
                  Number(target.request_retention)
                );
              }
              Reflect.set(target, prop, value);
              return true;
            }
          };
        }
        update_parameters(params) {
          const _params = generatorParameters(params);
          for (const key in _params) {
            const paramKey = key;
            this.param[paramKey] = _params[paramKey];
          }
        }
        /**
           * The formula used is :
           * $$ S_0(G) = w_{G-1}$$
           * $$S_0 = \max \lbrace S_0,0.1\rbrace $$
        
           * @param g Grade (rating at Anki) [1.again,2.hard,3.good,4.easy]
           * @return Stability (interval when R=90%)
           */
        init_stability(g) {
          return Math.max(this.param.w[g - 1], 0.1);
        }
        /**
         * The formula used is :
         * $$D_0(G) = w_4 - e^{(G-1) \cdot w_5} + 1 $$
         * $$D_0 = \min \lbrace \max \lbrace D_0(G),1 \rbrace,10 \rbrace$$
         * where the $$D_0(1)=w_4$$ when the first rating is good.
         *
         * @param {Grade} g Grade (rating at Anki) [1.again,2.hard,3.good,4.easy]
         * @return {number} Difficulty $$D \in [1,10]$$
         */
        init_difficulty(g) {
          const w = this.param.w;
          const d = w[4] - Math.exp((g - 1) * w[5]) + 1;
          return roundTo(d, 8);
        }
        /**
         * If fuzzing is disabled or ivl is less than 2.5, it returns the original interval.
         * @param {number} ivl - The interval to be fuzzed.
         * @param {number} elapsed_days t days since the last review
         * @return {number} - The fuzzed interval.
         **/
        apply_fuzz(ivl, elapsed_days) {
          if (!this.param.enable_fuzz || ivl < 2.5) return Math.round(ivl);
          const generator = alea(this._seed);
          const fuzz_factor = generator();
          const { min_ivl, max_ivl } = get_fuzz_range(
            ivl,
            elapsed_days,
            this.param.maximum_interval
          );
          return Math.floor(fuzz_factor * (max_ivl - min_ivl + 1) + min_ivl);
        }
        /**
         *   @see The formula used is : {@link FSRSAlgorithm.calculate_interval_modifier}
         *   @param {number} s - Stability (interval when R=90%)
         *   @param {number} elapsed_days t days since the last review
         */
        next_interval(s, elapsed_days) {
          const newInterval = Math.min(
            Math.max(1, Math.round(s * this.intervalModifier)),
            this.param.maximum_interval
          );
          return this.apply_fuzz(newInterval, elapsed_days);
        }
        /**
         * @see https://github.com/open-spaced-repetition/fsrs4anki/issues/697
         */
        linear_damping(delta_d, old_d) {
          return roundTo(delta_d * (10 - old_d) / 9, 8);
        }
        /**
         * The formula used is :
         * $$\text{delta}_d = -w_6 \cdot (g - 3)$$
         * $$\text{next}_d = D + \text{linear damping}(\text{delta}_d , D)$$
         * $$D^\prime(D,R) = w_7 \cdot D_0(4) +(1 - w_7) \cdot \text{next}_d$$
         * @param {number} d Difficulty $$D \in [1,10]$$
         * @param {Grade} g Grade (rating at Anki) [1.again,2.hard,3.good,4.easy]
         * @return {number} $$\text{next}_D$$
         */
        next_difficulty(d, g) {
          const delta_d = -this.param.w[6] * (g - 3);
          const next_d = d + this.linear_damping(delta_d, d);
          return clamp(
            this.mean_reversion(this.init_difficulty(Rating.Easy), next_d),
            1,
            10
          );
        }
        /**
         * The formula used is :
         * $$w_7 \cdot \text{init} +(1 - w_7) \cdot \text{current}$$
         * @param {number} init $$w_2 : D_0(3) = w_2 + (R-2) \cdot w_3= w_2$$
         * @param {number} current $$D - w_6 \cdot (R - 2)$$
         * @return {number} difficulty
         */
        mean_reversion(init, current) {
          const w = this.param.w;
          return roundTo(w[7] * init + (1 - w[7]) * current, 8);
        }
        /**
         * The formula used is :
         * $$S^\prime_r(D,S,R,G) = S\cdot(e^{w_8}\cdot (11-D)\cdot S^{-w_9}\cdot(e^{w_{10}\cdot(1-R)}-1)\cdot w_{15}(\text{if} G=2) \cdot w_{16}(\text{if} G=4)+1)$$
         * @param {number} d Difficulty D \in [1,10]
         * @param {number} s Stability (interval when R=90%)
         * @param {number} r Retrievability (probability of recall)
         * @param {Grade} g Grade (Rating[0.again,1.hard,2.good,3.easy])
         * @return {number} S^\prime_r new stability after recall
         */
        next_recall_stability(d, s, r, g) {
          const w = this.param.w;
          const hard_penalty = Rating.Hard === g ? w[15] : 1;
          const easy_bound = Rating.Easy === g ? w[16] : 1;
          return roundTo(
            clamp(
              s * (1 + Math.exp(w[8]) * (11 - d) * Math.pow(s, -w[9]) * (Math.exp((1 - r) * w[10]) - 1) * hard_penalty * easy_bound),
              S_MIN,
              36500
            ),
            8
          );
        }
        /**
         * The formula used is :
         * $$S^\prime_f(D,S,R) = w_{11}\cdot D^{-w_{12}}\cdot ((S+1)^{w_{13}}-1) \cdot e^{w_{14}\cdot(1-R)}$$
         * enable_short_term = true : $$S^\prime_f \in \min \lbrace \max \lbrace S^\prime_f,0.01\rbrace, \frac{S}{e^{w_{17} \cdot w_{18}}} \rbrace$$
         * enable_short_term = false : $$S^\prime_f \in \min \lbrace \max \lbrace S^\prime_f,0.01\rbrace, S \rbrace$$
         * @param {number} d Difficulty D \in [1,10]
         * @param {number} s Stability (interval when R=90%)
         * @param {number} r Retrievability (probability of recall)
         * @return {number} S^\prime_f new stability after forgetting
         */
        next_forget_stability(d, s, r) {
          const w = this.param.w;
          return roundTo(
            clamp(
              w[11] * Math.pow(d, -w[12]) * (Math.pow(s + 1, w[13]) - 1) * Math.exp((1 - r) * w[14]),
              S_MIN,
              36500
            ),
            8
          );
        }
        /**
         * The formula used is :
         * $$S^\prime_s(S,G) = S \cdot e^{w_{17} \cdot (G-3+w_{18})}$$
         * @param {number} s Stability (interval when R=90%)
         * @param {Grade} g Grade (Rating[0.again,1.hard,2.good,3.easy])
         */
        next_short_term_stability(s, g) {
          const w = this.param.w;
          const sinc = Math.pow(s, -w[19]) * Math.exp(w[17] * (g - 3 + w[18]));
          const maskedSinc = g >= Rating.Hard ? Math.max(sinc, 1) : sinc;
          return roundTo(clamp(s * maskedSinc, S_MIN, 36500), 8);
        }
        /**
         * The formula used is :
         * $$R(t,S) = (1 + \text{FACTOR} \times \frac{t}{9 \cdot S})^{\text{DECAY}}$$
         * @param {number} elapsed_days t days since the last review
         * @param {number} stability Stability (interval when R=90%)
         * @return {number} r Retrievability (probability of recall)
         */
        forgetting_curve;
        /**
         * Calculates the next state of memory based on the current state, time elapsed, and grade.
         *
         * @param memory_state - The current state of memory, which can be null.
         * @param t - The time elapsed since the last review.
         * @param {Rating} g Grade (Rating[0.Manual,1.Again,2.Hard,3.Good,4.Easy])
         * @param r - Optional retrievability value. If not provided, it will be calculated.
         * @returns The next state of memory with updated difficulty and stability.
         */
        next_state(memory_state, t, g, r) {
          const { difficulty: d, stability: s } = memory_state ?? {
            difficulty: 0,
            stability: 0
          };
          if (t < 0) {
            throw new Error(`Invalid delta_t "${t}"`);
          }
          if (g < 0 || g > 4) {
            throw new Error(`Invalid grade "${g}"`);
          }
          if (d === 0 && s === 0) {
            return {
              difficulty: clamp(this.init_difficulty(g), 1, 10),
              stability: this.init_stability(g)
            };
          }
          if (g === 0) {
            return {
              difficulty: d,
              stability: s
            };
          }
          if (d < 1 || s < S_MIN) {
            throw new Error(
              `Invalid memory state { difficulty: ${d}, stability: ${s} }`
            );
          }
          const w = this.param.w;
          r = typeof r === "number" ? r : this.forgetting_curve(t, s);
          let new_s;
          if (t === 0 && this.param.enable_short_term) {
            new_s = this.next_short_term_stability(s, g);
          } else if (g === 1) {
            const s_after_fail = this.next_forget_stability(d, s, r);
            let [w_17, w_18] = [0, 0];
            if (this.param.enable_short_term) {
              w_17 = w[17];
              w_18 = w[18];
            }
            const next_s_min = s / Math.exp(w_17 * w_18);
            new_s = clamp(roundTo(next_s_min, 8), S_MIN, s_after_fail);
          } else {
            new_s = this.next_recall_stability(d, s, r, g);
          }
          const new_d = this.next_difficulty(d, g);
          return { difficulty: new_d, stability: new_s };
        }
      };
      var BasicScheduler = class extends AbstractScheduler {
        learningStepsStrategy;
        constructor(card, now, algorithm, strategies) {
          super(card, now, algorithm, strategies);
          let learningStepStrategy = BasicLearningStepsStrategy;
          if (this.strategies) {
            const custom_strategy = this.strategies.get(StrategyMode.LEARNING_STEPS);
            if (custom_strategy) {
              learningStepStrategy = custom_strategy;
            }
          }
          this.learningStepsStrategy = learningStepStrategy;
        }
        getLearningInfo(card, grade) {
          const parameters = this.algorithm.parameters;
          card.learning_steps = card.learning_steps || 0;
          const steps_strategy = this.learningStepsStrategy(
            parameters,
            card.state,
            card.learning_steps
          );
          const scheduled_minutes = Math.max(
            0,
            steps_strategy[grade]?.scheduled_minutes ?? 0
          );
          const next_steps = Math.max(0, steps_strategy[grade]?.next_step ?? 0);
          return {
            scheduled_minutes,
            next_steps
          };
        }
        /**
         * @description This function applies the learning steps based on the current card's state and grade.
         */
        applyLearningSteps(nextCard, grade, to_state) {
          const { scheduled_minutes, next_steps } = this.getLearningInfo(
            this.current,
            grade
          );
          if (scheduled_minutes > 0 && scheduled_minutes < 1440) {
            nextCard.learning_steps = next_steps;
            nextCard.scheduled_days = 0;
            nextCard.state = to_state;
            nextCard.due = date_scheduler(
              this.review_time,
              Math.round(scheduled_minutes),
              false
              /** true:days false: minute */
            );
          } else {
            nextCard.state = State.Review;
            if (scheduled_minutes >= 1440) {
              nextCard.learning_steps = next_steps;
              nextCard.due = date_scheduler(
                this.review_time,
                Math.round(scheduled_minutes),
                false
                /** true:days false: minute */
              );
              nextCard.scheduled_days = Math.floor(scheduled_minutes / 1440);
            } else {
              nextCard.learning_steps = 0;
              const interval = this.algorithm.next_interval(
                nextCard.stability,
                this.elapsed_days
              );
              nextCard.scheduled_days = interval;
              nextCard.due = date_scheduler(this.review_time, interval, true);
            }
          }
        }
        newState(grade) {
          const exist = this.next.get(grade);
          if (exist) {
            return exist;
          }
          const next = this.next_ds(this.elapsed_days, grade);
          this.applyLearningSteps(next, grade, State.Learning);
          const item = {
            card: next,
            log: this.buildLog(grade)
          };
          this.next.set(grade, item);
          return item;
        }
        learningState(grade) {
          const exist = this.next.get(grade);
          if (exist) {
            return exist;
          }
          const next = this.next_ds(this.elapsed_days, grade);
          this.applyLearningSteps(
            next,
            grade,
            this.last.state
            /** Learning or Relearning */
          );
          const item = {
            card: next,
            log: this.buildLog(grade)
          };
          this.next.set(grade, item);
          return item;
        }
        reviewState(grade) {
          const exist = this.next.get(grade);
          if (exist) {
            return exist;
          }
          const interval = this.elapsed_days;
          const retrievability = this.algorithm.forgetting_curve(
            interval,
            this.current.stability
          );
          const next_again = this.next_ds(interval, Rating.Again, retrievability);
          const next_hard = this.next_ds(interval, Rating.Hard, retrievability);
          const next_good = this.next_ds(interval, Rating.Good, retrievability);
          const next_easy = this.next_ds(interval, Rating.Easy, retrievability);
          this.next_interval(next_hard, next_good, next_easy, interval);
          this.next_state(next_hard, next_good, next_easy);
          this.applyLearningSteps(next_again, Rating.Again, State.Relearning);
          next_again.lapses += 1;
          const item_again = {
            card: next_again,
            log: this.buildLog(Rating.Again)
          };
          const item_hard = {
            card: next_hard,
            log: super.buildLog(Rating.Hard)
          };
          const item_good = {
            card: next_good,
            log: super.buildLog(Rating.Good)
          };
          const item_easy = {
            card: next_easy,
            log: super.buildLog(Rating.Easy)
          };
          this.next.set(Rating.Again, item_again);
          this.next.set(Rating.Hard, item_hard);
          this.next.set(Rating.Good, item_good);
          this.next.set(Rating.Easy, item_easy);
          return this.next.get(grade);
        }
        /**
         * Review next_ds
         */
        next_ds(t, g, r) {
          const next_state = this.algorithm.next_state(
            {
              difficulty: this.current.difficulty,
              stability: this.current.stability
            },
            t,
            g,
            r
          );
          const card = TypeConvert.card(this.current);
          card.difficulty = next_state.difficulty;
          card.stability = next_state.stability;
          return card;
        }
        /**
         * Review next_interval
         */
        next_interval(next_hard, next_good, next_easy, interval) {
          let hard_interval, good_interval;
          hard_interval = this.algorithm.next_interval(next_hard.stability, interval);
          good_interval = this.algorithm.next_interval(next_good.stability, interval);
          hard_interval = Math.min(hard_interval, good_interval);
          good_interval = Math.max(good_interval, hard_interval + 1);
          const easy_interval = Math.max(
            this.algorithm.next_interval(next_easy.stability, interval),
            good_interval + 1
          );
          next_hard.scheduled_days = hard_interval;
          next_hard.due = date_scheduler(this.review_time, hard_interval, true);
          next_good.scheduled_days = good_interval;
          next_good.due = date_scheduler(this.review_time, good_interval, true);
          next_easy.scheduled_days = easy_interval;
          next_easy.due = date_scheduler(this.review_time, easy_interval, true);
        }
        /**
         * Review next_state
         */
        next_state(next_hard, next_good, next_easy) {
          next_hard.state = State.Review;
          next_hard.learning_steps = 0;
          next_good.state = State.Review;
          next_good.learning_steps = 0;
          next_easy.state = State.Review;
          next_easy.learning_steps = 0;
        }
      };
      var LongTermScheduler = class extends AbstractScheduler {
        newState(grade) {
          const exist = this.next.get(grade);
          if (exist) {
            return exist;
          }
          this.current.scheduled_days = 0;
          this.current.elapsed_days = 0;
          const first_interval = 0;
          const next_again = this.next_ds(first_interval, Rating.Again);
          const next_hard = this.next_ds(first_interval, Rating.Hard);
          const next_good = this.next_ds(first_interval, Rating.Good);
          const next_easy = this.next_ds(first_interval, Rating.Easy);
          this.next_interval(
            next_again,
            next_hard,
            next_good,
            next_easy,
            first_interval
          );
          this.next_state(next_again, next_hard, next_good, next_easy);
          this.update_next(next_again, next_hard, next_good, next_easy);
          return this.next.get(grade);
        }
        next_ds(t, g, r) {
          const next_state = this.algorithm.next_state(
            {
              difficulty: this.current.difficulty,
              stability: this.current.stability
            },
            t,
            g,
            r
          );
          const card = TypeConvert.card(this.current);
          card.difficulty = next_state.difficulty;
          card.stability = next_state.stability;
          return card;
        }
        /**
         * @see https://github.com/open-spaced-repetition/ts-fsrs/issues/98#issuecomment-2241923194
         */
        learningState(grade) {
          return this.reviewState(grade);
        }
        reviewState(grade) {
          const exist = this.next.get(grade);
          if (exist) {
            return exist;
          }
          const interval = this.elapsed_days;
          const retrievability = this.algorithm.forgetting_curve(
            interval,
            this.current.stability
          );
          const next_again = this.next_ds(interval, Rating.Again, retrievability);
          const next_hard = this.next_ds(interval, Rating.Hard, retrievability);
          const next_good = this.next_ds(interval, Rating.Good, retrievability);
          const next_easy = this.next_ds(interval, Rating.Easy, retrievability);
          this.next_interval(next_again, next_hard, next_good, next_easy, interval);
          this.next_state(next_again, next_hard, next_good, next_easy);
          next_again.lapses += 1;
          this.update_next(next_again, next_hard, next_good, next_easy);
          return this.next.get(grade);
        }
        /**
         * Review/New next_interval
         */
        next_interval(next_again, next_hard, next_good, next_easy, interval) {
          let again_interval, hard_interval, good_interval, easy_interval;
          again_interval = this.algorithm.next_interval(
            next_again.stability,
            interval
          );
          hard_interval = this.algorithm.next_interval(next_hard.stability, interval);
          good_interval = this.algorithm.next_interval(next_good.stability, interval);
          easy_interval = this.algorithm.next_interval(next_easy.stability, interval);
          again_interval = Math.min(again_interval, hard_interval);
          hard_interval = Math.max(hard_interval, again_interval + 1);
          good_interval = Math.max(good_interval, hard_interval + 1);
          easy_interval = Math.max(easy_interval, good_interval + 1);
          next_again.scheduled_days = again_interval;
          next_again.due = date_scheduler(this.review_time, again_interval, true);
          next_hard.scheduled_days = hard_interval;
          next_hard.due = date_scheduler(this.review_time, hard_interval, true);
          next_good.scheduled_days = good_interval;
          next_good.due = date_scheduler(this.review_time, good_interval, true);
          next_easy.scheduled_days = easy_interval;
          next_easy.due = date_scheduler(this.review_time, easy_interval, true);
        }
        /**
         * Review/New next_state
         */
        next_state(next_again, next_hard, next_good, next_easy) {
          next_again.state = State.Review;
          next_again.learning_steps = 0;
          next_hard.state = State.Review;
          next_hard.learning_steps = 0;
          next_good.state = State.Review;
          next_good.learning_steps = 0;
          next_easy.state = State.Review;
          next_easy.learning_steps = 0;
        }
        update_next(next_again, next_hard, next_good, next_easy) {
          const item_again = {
            card: next_again,
            log: this.buildLog(Rating.Again)
          };
          const item_hard = {
            card: next_hard,
            log: super.buildLog(Rating.Hard)
          };
          const item_good = {
            card: next_good,
            log: super.buildLog(Rating.Good)
          };
          const item_easy = {
            card: next_easy,
            log: super.buildLog(Rating.Easy)
          };
          this.next.set(Rating.Again, item_again);
          this.next.set(Rating.Hard, item_hard);
          this.next.set(Rating.Good, item_good);
          this.next.set(Rating.Easy, item_easy);
        }
      };
      var Reschedule = class {
        fsrs;
        /**
         * Creates an instance of the `Reschedule` class.
         * @param fsrs - An instance of the FSRS class used for scheduling.
         */
        constructor(fsrs2) {
          this.fsrs = fsrs2;
        }
        /**
         * Replays a review for a card and determines the next review date based on the given rating.
         * @param card - The card being reviewed.
         * @param reviewed - The date the card was reviewed.
         * @param rating - The grade given to the card during the review.
         * @returns A `RecordLogItem` containing the updated card and review log.
         */
        replay(card, reviewed, rating) {
          return this.fsrs.next(card, reviewed, rating);
        }
        /**
         * Processes a manual review for a card, allowing for custom state, stability, difficulty, and due date.
         * @param card - The card being reviewed.
         * @param state - The state of the card after the review.
         * @param reviewed - The date the card was reviewed.
         * @param elapsed_days - The number of days since the last review.
         * @param stability - (Optional) The stability of the card.
         * @param difficulty - (Optional) The difficulty of the card.
         * @param due - (Optional) The due date for the next review.
         * @returns A `RecordLogItem` containing the updated card and review log.
         * @throws Will throw an error if the state or due date is not provided when required.
         */
        handleManualRating(card, state, reviewed, elapsed_days, stability, difficulty, due) {
          if (typeof state === "undefined") {
            throw new Error("reschedule: state is required for manual rating");
          }
          let log;
          let next_card;
          if (state === State.New) {
            log = {
              rating: Rating.Manual,
              state,
              due: due ?? reviewed,
              stability: card.stability,
              difficulty: card.difficulty,
              elapsed_days,
              last_elapsed_days: card.elapsed_days,
              scheduled_days: card.scheduled_days,
              learning_steps: card.learning_steps,
              review: reviewed
            };
            next_card = createEmptyCard(reviewed);
            next_card.last_review = reviewed;
          } else {
            if (typeof due === "undefined") {
              throw new Error("reschedule: due is required for manual rating");
            }
            const scheduled_days = date_diff(due, reviewed, "days");
            log = {
              rating: Rating.Manual,
              state: card.state,
              due: card.last_review || card.due,
              stability: card.stability,
              difficulty: card.difficulty,
              elapsed_days,
              last_elapsed_days: card.elapsed_days,
              scheduled_days: card.scheduled_days,
              learning_steps: card.learning_steps,
              review: reviewed
            };
            next_card = {
              ...card,
              state,
              due,
              last_review: reviewed,
              stability: stability || card.stability,
              difficulty: difficulty || card.difficulty,
              elapsed_days,
              scheduled_days,
              reps: card.reps + 1
            };
          }
          return { card: next_card, log };
        }
        /**
         * Reschedules a card based on its review history.
         *
         * @param current_card - The card to be rescheduled.
         * @param reviews - An array of review history objects.
         * @returns An array of record log items representing the rescheduling process.
         */
        reschedule(current_card, reviews) {
          const collections = [];
          let cur_card = createEmptyCard(current_card.due);
          for (const review of reviews) {
            let item;
            review.review = TypeConvert.time(review.review);
            if (review.rating === Rating.Manual) {
              let interval = 0;
              if (cur_card.state !== State.New && cur_card.last_review) {
                interval = date_diff(review.review, cur_card.last_review, "days");
              }
              item = this.handleManualRating(
                cur_card,
                review.state,
                review.review,
                interval,
                review.stability,
                review.difficulty,
                review.due ? TypeConvert.time(review.due) : void 0
              );
            } else {
              item = this.replay(cur_card, review.review, review.rating);
            }
            collections.push(item);
            cur_card = item.card;
          }
          return collections;
        }
        calculateManualRecord(current_card, now, record_log_item, update_memory) {
          if (!record_log_item) {
            return null;
          }
          const { card: reschedule_card, log } = record_log_item;
          const cur_card = TypeConvert.card(current_card);
          if (cur_card.due.getTime() === reschedule_card.due.getTime()) {
            return null;
          }
          cur_card.scheduled_days = date_diff(
            reschedule_card.due,
            cur_card.due,
            "days"
          );
          return this.handleManualRating(
            cur_card,
            reschedule_card.state,
            TypeConvert.time(now),
            log.elapsed_days,
            update_memory ? reschedule_card.stability : void 0,
            update_memory ? reschedule_card.difficulty : void 0,
            reschedule_card.due
          );
        }
      };
      var FSRS = class extends FSRSAlgorithm {
        strategyHandler = /* @__PURE__ */ new Map();
        Scheduler;
        constructor(param) {
          super(param);
          const { enable_short_term } = this.parameters;
          this.Scheduler = enable_short_term ? BasicScheduler : LongTermScheduler;
        }
        params_handler_proxy() {
          const _this = this;
          return {
            set: function(target, prop, value) {
              if (prop === "request_retention" && Number.isFinite(value)) {
                _this.intervalModifier = _this.calculate_interval_modifier(
                  Number(value)
                );
              } else if (prop === "enable_short_term") {
                _this.Scheduler = value === true ? BasicScheduler : LongTermScheduler;
              } else if (prop === "w") {
                value = migrateParameters(
                  value,
                  target.relearning_steps.length,
                  target.enable_short_term
                );
                _this.forgetting_curve = forgetting_curve.bind(this, value);
                _this.intervalModifier = _this.calculate_interval_modifier(
                  Number(target.request_retention)
                );
              }
              Reflect.set(target, prop, value);
              return true;
            }
          };
        }
        useStrategy(mode, handler) {
          this.strategyHandler.set(mode, handler);
          return this;
        }
        clearStrategy(mode) {
          if (mode) {
            this.strategyHandler.delete(mode);
          } else {
            this.strategyHandler.clear();
          }
          return this;
        }
        getScheduler(card, now) {
          const schedulerStrategy = this.strategyHandler.get(
            StrategyMode.SCHEDULER
          );
          const Scheduler = schedulerStrategy || this.Scheduler;
          const instance = new Scheduler(card, now, this, this.strategyHandler);
          return instance;
        }
        /**
         * Display the collection of cards and logs for the four scenarios after scheduling the card at the current time.
         * @param card Card to be processed
         * @param now Current time or scheduled time
         * @param afterHandler Convert the result to another type. (Optional)
         * @example
         * ```typescript
         * const card: Card = createEmptyCard(new Date());
         * const f = fsrs();
         * const recordLog = f.repeat(card, new Date());
         * ```
         * @example
         * ```typescript
         * interface RevLogUnchecked
         *   extends Omit<ReviewLog, "due" | "review" | "state" | "rating"> {
         *   cid: string;
         *   due: Date | number;
         *   state: StateType;
         *   review: Date | number;
         *   rating: RatingType;
         * }
         *
         * interface RepeatRecordLog {
         *   card: CardUnChecked; //see method: createEmptyCard
         *   log: RevLogUnchecked;
         * }
         *
         * function repeatAfterHandler(recordLog: RecordLog) {
         *     const record: { [key in Grade]: RepeatRecordLog } = {} as {
         *       [key in Grade]: RepeatRecordLog;
         *     };
         *     for (const grade of Grades) {
         *       record[grade] = {
         *         card: {
         *           ...(recordLog[grade].card as Card & { cid: string }),
         *           due: recordLog[grade].card.due.getTime(),
         *           state: State[recordLog[grade].card.state] as StateType,
         *           last_review: recordLog[grade].card.last_review
         *             ? recordLog[grade].card.last_review!.getTime()
         *             : null,
         *         },
         *         log: {
         *           ...recordLog[grade].log,
         *           cid: (recordLog[grade].card as Card & { cid: string }).cid,
         *           due: recordLog[grade].log.due.getTime(),
         *           review: recordLog[grade].log.review.getTime(),
         *           state: State[recordLog[grade].log.state] as StateType,
         *           rating: Rating[recordLog[grade].log.rating] as RatingType,
         *         },
         *       };
         *     }
         *     return record;
         * }
         * const card: Card = createEmptyCard(new Date(), cardAfterHandler); //see method:  createEmptyCard
         * const f = fsrs();
         * const recordLog = f.repeat(card, new Date(), repeatAfterHandler);
         * ```
         */
        repeat(card, now, afterHandler) {
          const instance = this.getScheduler(card, now);
          const recordLog = instance.preview();
          if (afterHandler && typeof afterHandler === "function") {
            return afterHandler(recordLog);
          } else {
            return recordLog;
          }
        }
        /**
         * Display the collection of cards and logs for the card scheduled at the current time, after applying a specific grade rating.
         * @param card Card to be processed
         * @param now Current time or scheduled time
         * @param grade Rating of the review (Again, Hard, Good, Easy)
         * @param afterHandler Convert the result to another type. (Optional)
         * @example
         * ```typescript
         * const card: Card = createEmptyCard(new Date());
         * const f = fsrs();
         * const recordLogItem = f.next(card, new Date(), Rating.Again);
         * ```
         * @example
         * ```typescript
         * interface RevLogUnchecked
         *   extends Omit<ReviewLog, "due" | "review" | "state" | "rating"> {
         *   cid: string;
         *   due: Date | number;
         *   state: StateType;
         *   review: Date | number;
         *   rating: RatingType;
         * }
         *
         * interface NextRecordLog {
         *   card: CardUnChecked; //see method: createEmptyCard
         *   log: RevLogUnchecked;
         * }
         *
        function nextAfterHandler(recordLogItem: RecordLogItem) {
          const recordItem = {
            card: {
              ...(recordLogItem.card as Card & { cid: string }),
              due: recordLogItem.card.due.getTime(),
              state: State[recordLogItem.card.state] as StateType,
              last_review: recordLogItem.card.last_review
                ? recordLogItem.card.last_review!.getTime()
                : null,
            },
            log: {
              ...recordLogItem.log,
              cid: (recordLogItem.card as Card & { cid: string }).cid,
              due: recordLogItem.log.due.getTime(),
              review: recordLogItem.log.review.getTime(),
              state: State[recordLogItem.log.state] as StateType,
              rating: Rating[recordLogItem.log.rating] as RatingType,
            },
          };
          return recordItem
        }
         * const card: Card = createEmptyCard(new Date(), cardAfterHandler); //see method:  createEmptyCard
         * const f = fsrs();
         * const recordLogItem = f.repeat(card, new Date(), Rating.Again, nextAfterHandler);
         * ```
         */
        next(card, now, grade, afterHandler) {
          const instance = this.getScheduler(card, now);
          const g = TypeConvert.rating(grade);
          if (g === Rating.Manual) {
            throw new Error("Cannot review a manual rating");
          }
          const recordLogItem = instance.review(g);
          if (afterHandler && typeof afterHandler === "function") {
            return afterHandler(recordLogItem);
          } else {
            return recordLogItem;
          }
        }
        /**
         * Get the retrievability of the card
         * @param card  Card to be processed
         * @param now  Current time or scheduled time
         * @param format  default:true , Convert the result to another type. (Optional)
         * @returns  The retrievability of the card,if format is true, the result is a string, otherwise it is a number
         */
        get_retrievability(card, now, format = true) {
          const processedCard = TypeConvert.card(card);
          now = now ? TypeConvert.time(now) : /* @__PURE__ */ new Date();
          const t = processedCard.state !== State.New ? Math.max(date_diff(now, processedCard.last_review, "days"), 0) : 0;
          const r = processedCard.state !== State.New ? this.forgetting_curve(t, +processedCard.stability.toFixed(8)) : 0;
          return format ? `${(r * 100).toFixed(2)}%` : r;
        }
        /**
         *
         * @param card Card to be processed
         * @param log last review log
         * @param afterHandler Convert the result to another type. (Optional)
         * @example
         * ```typescript
         * const now = new Date();
         * const f = fsrs();
         * const emptyCardFormAfterHandler = createEmptyCard(now);
         * const repeatFormAfterHandler = f.repeat(emptyCardFormAfterHandler, now);
         * const { card, log } = repeatFormAfterHandler[Rating.Hard];
         * const rollbackFromAfterHandler = f.rollback(card, log);
         * ```
         *
         * @example
         * ```typescript
         * const now = new Date();
         * const f = fsrs();
         * const emptyCardFormAfterHandler = createEmptyCard(now, cardAfterHandler);  //see method: createEmptyCard
         * const repeatFormAfterHandler = f.repeat(emptyCardFormAfterHandler, now, repeatAfterHandler); //see method: fsrs.repeat()
         * const { card, log } = repeatFormAfterHandler[Rating.Hard];
         * const rollbackFromAfterHandler = f.rollback(card, log, cardAfterHandler);
         * ```
         */
        rollback(card, log, afterHandler) {
          const processedCard = TypeConvert.card(card);
          const processedLog = TypeConvert.review_log(log);
          if (processedLog.rating === Rating.Manual) {
            throw new Error("Cannot rollback a manual rating");
          }
          let last_due;
          let last_review;
          let last_lapses;
          switch (processedLog.state) {
            case State.New:
              last_due = processedLog.due;
              last_review = void 0;
              last_lapses = 0;
              break;
            case State.Learning:
            case State.Relearning:
            case State.Review:
              last_due = processedLog.review;
              last_review = processedLog.due;
              last_lapses = processedCard.lapses - (processedLog.rating === Rating.Again && processedLog.state === State.Review ? 1 : 0);
              break;
          }
          const prevCard = {
            ...processedCard,
            due: last_due,
            stability: processedLog.stability,
            difficulty: processedLog.difficulty,
            elapsed_days: processedLog.last_elapsed_days,
            scheduled_days: processedLog.scheduled_days,
            reps: Math.max(0, processedCard.reps - 1),
            lapses: Math.max(0, last_lapses),
            learning_steps: processedLog.learning_steps,
            state: processedLog.state,
            last_review
          };
          if (afterHandler && typeof afterHandler === "function") {
            return afterHandler(prevCard);
          } else {
            return prevCard;
          }
        }
        /**
         *
         * @param card Card to be processed
         * @param now Current time or scheduled time
         * @param reset_count Should the review count information(reps,lapses) be reset. (Optional)
         * @param afterHandler Convert the result to another type. (Optional)
         * @example
         * ```typescript
         * const now = new Date();
         * const f = fsrs();
         * const emptyCard = createEmptyCard(now);
         * const scheduling_cards = f.repeat(emptyCard, now);
         * const { card, log } = scheduling_cards[Rating.Hard];
         * const forgetCard = f.forget(card, new Date(), true);
         * ```
         *
         * @example
         * ```typescript
         * interface RepeatRecordLog {
         *   card: CardUnChecked; //see method: createEmptyCard
         *   log: RevLogUnchecked; //see method: fsrs.repeat()
         * }
         *
         * function forgetAfterHandler(recordLogItem: RecordLogItem): RepeatRecordLog {
         *     return {
         *       card: {
         *         ...(recordLogItem.card as Card & { cid: string }),
         *         due: recordLogItem.card.due.getTime(),
         *         state: State[recordLogItem.card.state] as StateType,
         *         last_review: recordLogItem.card.last_review
         *           ? recordLogItem.card.last_review!.getTime()
         *           : null,
         *       },
         *       log: {
         *         ...recordLogItem.log,
         *         cid: (recordLogItem.card as Card & { cid: string }).cid,
         *         due: recordLogItem.log.due.getTime(),
         *         review: recordLogItem.log.review.getTime(),
         *         state: State[recordLogItem.log.state] as StateType,
         *         rating: Rating[recordLogItem.log.rating] as RatingType,
         *       },
         *     };
         * }
         * const now = new Date();
         * const f = fsrs();
         * const emptyCardFormAfterHandler = createEmptyCard(now, cardAfterHandler); //see method:  createEmptyCard
         * const repeatFormAfterHandler = f.repeat(emptyCardFormAfterHandler, now, repeatAfterHandler); //see method: fsrs.repeat()
         * const { card } = repeatFormAfterHandler[Rating.Hard];
         * const forgetFromAfterHandler = f.forget(card, date_scheduler(now, 1, true), false, forgetAfterHandler);
         * ```
         */
        forget(card, now, reset_count = false, afterHandler) {
          const processedCard = TypeConvert.card(card);
          now = TypeConvert.time(now);
          const scheduled_days = processedCard.state === State.New ? 0 : date_diff(now, processedCard.due, "days");
          const forget_log = {
            rating: Rating.Manual,
            state: processedCard.state,
            due: processedCard.due,
            stability: processedCard.stability,
            difficulty: processedCard.difficulty,
            elapsed_days: 0,
            last_elapsed_days: processedCard.elapsed_days,
            scheduled_days,
            learning_steps: processedCard.learning_steps,
            review: now
          };
          const forget_card = {
            ...processedCard,
            due: now,
            stability: 0,
            difficulty: 0,
            elapsed_days: 0,
            scheduled_days: 0,
            reps: reset_count ? 0 : processedCard.reps,
            lapses: reset_count ? 0 : processedCard.lapses,
            learning_steps: 0,
            state: State.New,
            last_review: processedCard.last_review
          };
          const recordLogItem = { card: forget_card, log: forget_log };
          if (afterHandler && typeof afterHandler === "function") {
            return afterHandler(recordLogItem);
          } else {
            return recordLogItem;
          }
        }
        /**
         * Reschedules the current card and returns the rescheduled collections and reschedule item.
         *
         * @template T - The type of the record log item.
         * @param {CardInput | Card} current_card - The current card to be rescheduled.
         * @param {Array<FSRSHistory>} reviews - The array of FSRSHistory objects representing the reviews.
         * @param {Partial<RescheduleOptions<T>>} options - The optional reschedule options.
         * @returns {IReschedule<T>} - The rescheduled collections and reschedule item.
         *
         * @example
         * ```typescript
         * const f = fsrs()
         * const grades: Grade[] = [Rating.Good, Rating.Good, Rating.Good, Rating.Good]
         * const reviews_at = [
         *   new Date(2024, 8, 13),
         *   new Date(2024, 8, 13),
         *   new Date(2024, 8, 17),
         *   new Date(2024, 8, 28),
         * ]
         *
         * const reviews: FSRSHistory[] = []
         * for (let i = 0; i < grades.length; i++) {
         *   reviews.push({
         *     rating: grades[i],
         *     review: reviews_at[i],
         *   })
         * }
         *
         * const results_short = scheduler.reschedule(
         *   createEmptyCard(),
         *   reviews,
         *   {
         *     skipManual: false,
         *   }
         * )
         * console.log(results_short)
         * ```
         */
        reschedule(current_card, reviews = [], options = {}) {
          const {
            recordLogHandler,
            reviewsOrderBy,
            skipManual = true,
            now = /* @__PURE__ */ new Date(),
            update_memory_state: updateMemoryState = false
          } = options;
          if (reviewsOrderBy && typeof reviewsOrderBy === "function") {
            reviews.sort(reviewsOrderBy);
          }
          if (skipManual) {
            reviews = reviews.filter((review) => review.rating !== Rating.Manual);
          }
          const rescheduleSvc = new Reschedule(this);
          const collections = rescheduleSvc.reschedule(
            options.first_card || createEmptyCard(),
            reviews
          );
          const len = collections.length;
          const cur_card = TypeConvert.card(current_card);
          const manual_item = rescheduleSvc.calculateManualRecord(
            cur_card,
            now,
            len ? collections[len - 1] : void 0,
            updateMemoryState
          );
          if (recordLogHandler && typeof recordLogHandler === "function") {
            return {
              collections: collections.map(recordLogHandler),
              reschedule_item: manual_item ? recordLogHandler(manual_item) : null
            };
          }
          return {
            collections,
            reschedule_item: manual_item
          };
        }
      };
      var fsrs = (params) => {
        return new FSRS(params || {});
      };
      exports.AbstractScheduler = AbstractScheduler;
      exports.BasicLearningStepsStrategy = BasicLearningStepsStrategy;
      exports.CLAMP_PARAMETERS = CLAMP_PARAMETERS;
      exports.ConvertStepUnitToMinutes = ConvertStepUnitToMinutes;
      exports.DefaultInitSeedStrategy = DefaultInitSeedStrategy;
      exports.FSRS = FSRS;
      exports.FSRS5_DEFAULT_DECAY = FSRS5_DEFAULT_DECAY;
      exports.FSRS6_DEFAULT_DECAY = FSRS6_DEFAULT_DECAY;
      exports.FSRSAlgorithm = FSRSAlgorithm;
      exports.FSRSVersion = FSRSVersion;
      exports.GenSeedStrategyWithCardId = GenSeedStrategyWithCardId;
      exports.Grades = Grades;
      exports.INIT_S_MAX = INIT_S_MAX;
      exports.Rating = Rating;
      exports.S_MAX = S_MAX;
      exports.S_MIN = S_MIN;
      exports.State = State;
      exports.StrategyMode = StrategyMode;
      exports.TypeConvert = TypeConvert;
      exports.W17_W18_Ceiling = W17_W18_Ceiling;
      exports.checkParameters = checkParameters;
      exports.clamp = clamp;
      exports.clipParameters = clipParameters;
      exports.computeDecayFactor = computeDecayFactor;
      exports.createEmptyCard = createEmptyCard;
      exports.dateDiffInDays = dateDiffInDays;
      exports.date_diff = date_diff;
      exports.date_scheduler = date_scheduler;
      exports.default_enable_fuzz = default_enable_fuzz;
      exports.default_enable_short_term = default_enable_short_term;
      exports.default_learning_steps = default_learning_steps;
      exports.default_maximum_interval = default_maximum_interval;
      exports.default_relearning_steps = default_relearning_steps;
      exports.default_request_retention = default_request_retention;
      exports.default_w = default_w;
      exports.fixDate = fixDate;
      exports.fixRating = fixRating;
      exports.fixState = fixState;
      exports.forgetting_curve = forgetting_curve;
      exports.formatDate = formatDate;
      exports.fsrs = fsrs;
      exports.generatorParameters = generatorParameters;
      exports.get_fuzz_range = get_fuzz_range;
      exports.migrateParameters = migrateParameters;
      exports.roundTo = roundTo;
      exports.show_diff_message = show_diff_message;
      module.exports = Object.assign(exports.default || {}, exports);
    }
  });

  // src/storage/state-repository.js
  var require_state_repository = __commonJS({
    "src/storage/state-repository.js"(exports, module) {
      function cloneState(value) {
        if (value === null || value === void 0) {
          return value;
        }
        return JSON.parse(JSON.stringify(value));
      }
      function loadNodeBuiltin(moduleName) {
        const isNodeRuntime = typeof process !== "undefined" && Boolean(process.versions && process.versions.node);
        if (!isNodeRuntime) {
          throw new Error(`Node builtin unavailable: ${moduleName}`);
        }
        const nodeRequire = typeof __require === "function" ? __require : typeof module !== "undefined" && module && typeof module.require === "function" ? module.require.bind(module) : null;
        if (!nodeRequire) {
          throw new Error(`Node builtin unavailable: ${moduleName}`);
        }
        return nodeRequire(moduleName);
      }
      function canUseLocalStorage() {
        try {
          return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
        } catch (_error) {
          return false;
        }
      }
      function createLocalStorageStateRepository(options = {}) {
        const storageKey = String(options.storageKey || "dabt:store-state:v1");
        return {
          kind: "local-storage",
          location: `local-storage://${storageKey}`,
          read() {
            if (!canUseLocalStorage()) {
              return null;
            }
            try {
              const raw = window.localStorage.getItem(storageKey);
              return raw ? JSON.parse(raw) : null;
            } catch (_error) {
              return null;
            }
          },
          write(state) {
            if (!canUseLocalStorage()) {
              return;
            }
            try {
              window.localStorage.setItem(storageKey, JSON.stringify(state));
            } catch (_error) {
            }
          }
        };
      }
      function createFileStateRepository(options = {}) {
        const fs = loadNodeBuiltin("node:fs");
        const path = loadNodeBuiltin("node:path");
        const defaultDataDir = path.join(__dirname, "..", "..", "data");
        const dataDir = path.resolve(options.dataDir || process.env.HIFZ_DATA_DIR || defaultDataDir);
        const fileName = options.fileName || "state.json";
        const stateFile = path.join(dataDir, fileName);
        function ensureDirectory() {
          fs.mkdirSync(dataDir, { recursive: true });
        }
        return {
          kind: "file",
          location: stateFile,
          read() {
            ensureDirectory();
            if (!fs.existsSync(stateFile)) {
              return null;
            }
            try {
              return JSON.parse(fs.readFileSync(stateFile, "utf8"));
            } catch (_error) {
              return null;
            }
          },
          write(state) {
            ensureDirectory();
            fs.writeFileSync(stateFile, `${JSON.stringify(state, null, 2)}
`, "utf8");
          }
        };
      }
      function createMemoryStateRepository(initialState = null) {
        let snapshot = cloneState(initialState);
        return {
          kind: "memory",
          location: "memory://state",
          read() {
            return cloneState(snapshot);
          },
          write(state) {
            snapshot = cloneState(state);
          }
        };
      }
      function resolveDefaultStateRepository() {
        if (canUseLocalStorage()) {
          return createLocalStorageStateRepository();
        }
        return createFileStateRepository();
      }
      module.exports = {
        createFileStateRepository,
        createLocalStorageStateRepository,
        createMemoryStateRepository,
        resolveDefaultStateRepository
      };
    }
  });

  // src/lib/activity.js
  var require_activity = __commonJS({
    "src/lib/activity.js"(exports, module) {
      var DAY_MS = 24 * 60 * 60 * 1e3;
      var MAX_ACTIVITY_HISTORY = 400;
      var REMINDER_KEYS = ["review", "newMorning", "newNoon", "newEvening"];
      var DEFAULT_NOTIFICATION_PREFERENCES = Object.freeze({
        enabled: false,
        reminders: {
          review: {
            enabled: true,
            time: "07:30"
          },
          newMorning: {
            enabled: true,
            time: "09:00"
          },
          newNoon: {
            enabled: true,
            time: "13:00"
          },
          newEvening: {
            enabled: true,
            time: "20:00"
          }
        }
      });
      function toDate(value, fallback = /* @__PURE__ */ new Date()) {
        if (value instanceof Date && !Number.isNaN(value.getTime())) {
          return new Date(value.getTime());
        }
        const parsed = new Date(value || "");
        if (!Number.isNaN(parsed.getTime())) {
          return parsed;
        }
        return fallback instanceof Date && !Number.isNaN(fallback.getTime()) ? new Date(fallback.getTime()) : /* @__PURE__ */ new Date();
      }
      function padNumber(value) {
        return String(value).padStart(2, "0");
      }
      function getLocalDateKey(input = /* @__PURE__ */ new Date()) {
        const date = toDate(input);
        return `${date.getFullYear()}-${padNumber(date.getMonth() + 1)}-${padNumber(date.getDate())}`;
      }
      function normalizeTimeString(value, fallback = "09:00") {
        const raw = String(value || "").trim().match(/^(\d{1,2}):(\d{2})$/);
        if (!raw) {
          return fallback;
        }
        const hours = Number.parseInt(raw[1], 10);
        const minutes = Number.parseInt(raw[2], 10);
        if (!Number.isInteger(hours) || !Number.isInteger(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
          return fallback;
        }
        return `${padNumber(hours)}:${padNumber(minutes)}`;
      }
      function normalizeReminderPreference(input = {}, fallback = {}) {
        return {
          enabled: typeof input.enabled === "boolean" ? input.enabled : Boolean(fallback.enabled),
          time: normalizeTimeString(input.time, normalizeTimeString(fallback.time, "09:00"))
        };
      }
      function mergeNotificationPreferences(current = DEFAULT_NOTIFICATION_PREFERENCES, patch = {}) {
        const safeCurrent = normalizeNotificationPreferences(current);
        const safePatch = patch && typeof patch === "object" ? patch : {};
        const patchReminders = safePatch.reminders && typeof safePatch.reminders === "object" ? safePatch.reminders : {};
        return normalizeNotificationPreferences({
          enabled: typeof safePatch.enabled === "boolean" ? safePatch.enabled : safeCurrent.enabled,
          reminders: REMINDER_KEYS.reduce((accumulator, reminderKey) => {
            accumulator[reminderKey] = {
              ...safeCurrent.reminders[reminderKey],
              ...patchReminders[reminderKey] && typeof patchReminders[reminderKey] === "object" ? patchReminders[reminderKey] : {}
            };
            return accumulator;
          }, {})
        });
      }
      function normalizeNotificationPreferences(input = {}) {
        const reminders = input.reminders && typeof input.reminders === "object" ? input.reminders : {};
        return {
          enabled: Boolean(input.enabled),
          reminders: {
            review: normalizeReminderPreference(reminders.review, DEFAULT_NOTIFICATION_PREFERENCES.reminders.review),
            newMorning: normalizeReminderPreference(reminders.newMorning, DEFAULT_NOTIFICATION_PREFERENCES.reminders.newMorning),
            newNoon: normalizeReminderPreference(reminders.newNoon, DEFAULT_NOTIFICATION_PREFERENCES.reminders.newNoon),
            newEvening: normalizeReminderPreference(reminders.newEvening, DEFAULT_NOTIFICATION_PREFERENCES.reminders.newEvening)
          }
        };
      }
      function normalizeActivityEntry(input = {}) {
        if (!input || typeof input !== "object") {
          return null;
        }
        const date = /^\d{4}-\d{2}-\d{2}$/.test(String(input.date || "").trim()) ? String(input.date).trim() : getLocalDateKey(input.completedAt || /* @__PURE__ */ new Date());
        const completedAt = toDate(input.completedAt || `${date}T00:00:00`).toISOString();
        return {
          date,
          completedAt,
          skippedNew: Boolean(input.skippedNew),
          programDayIndex: Math.max(1, Number.parseInt(input.programDayIndex, 10) || 1),
          phaseIndex: Math.max(1, Number.parseInt(input.phaseIndex, 10) || 1)
        };
      }
      function compareActivityEntries(left, right) {
        return String(left.date || "").localeCompare(String(right.date || ""));
      }
      function normalizeActivityHistory(input = []) {
        const values = Array.isArray(input) ? input : [];
        const deduped = /* @__PURE__ */ new Map();
        values.forEach((entry) => {
          const normalized = normalizeActivityEntry(entry);
          if (!normalized) {
            return;
          }
          const existing = deduped.get(normalized.date);
          if (!existing || String(existing.completedAt || "") <= normalized.completedAt) {
            deduped.set(normalized.date, normalized);
          }
        });
        return Array.from(deduped.values()).sort(compareActivityEntries).slice(-MAX_ACTIVITY_HISTORY);
      }
      function upsertActivityEntry(history = [], entry = {}) {
        return normalizeActivityHistory([...normalizeActivityHistory(history), entry]);
      }
      function recordDayCompletion(history = [], details = {}) {
        const now = toDate(details.completedAt || /* @__PURE__ */ new Date());
        return upsertActivityEntry(history, {
          date: getLocalDateKey(now),
          completedAt: now.toISOString(),
          skippedNew: Boolean(details.skippedNew),
          programDayIndex: Math.max(1, Number.parseInt(details.programDayIndex, 10) || 1),
          phaseIndex: Math.max(1, Number.parseInt(details.phaseIndex, 10) || 1)
        });
      }
      function startOfDateKey(dateKey) {
        const parsed = toDate(`${dateKey}T00:00:00`);
        parsed.setHours(0, 0, 0, 0);
        return parsed;
      }
      function resolveDateKey(value) {
        return /^\d{4}-\d{2}-\d{2}$/.test(String(value || "").trim()) ? String(value).trim() : getLocalDateKey(value);
      }
      function addDays(date, count) {
        const next = toDate(date);
        next.setDate(next.getDate() + Number(count || 0));
        return next;
      }
      function diffInCalendarDays(leftDate, rightDate) {
        const left = startOfDateKey(resolveDateKey(leftDate));
        const right = startOfDateKey(resolveDateKey(rightDate));
        return Math.round((left.getTime() - right.getTime()) / DAY_MS);
      }
      function computeStreak(history = [], referenceDate = /* @__PURE__ */ new Date()) {
        const normalizedHistory = normalizeActivityHistory(history);
        if (!normalizedHistory.length) {
          return {
            current: 0,
            best: 0,
            lastCompletedOn: "",
            activeToday: false,
            activeYesterday: false
          };
        }
        let currentRun = 0;
        let bestRun = 0;
        let previousDate = null;
        normalizedHistory.forEach((entry) => {
          const entryDate = startOfDateKey(entry.date);
          if (!previousDate) {
            currentRun = 1;
          } else {
            const gap = diffInCalendarDays(entryDate, previousDate);
            currentRun = gap === 1 ? currentRun + 1 : 1;
          }
          previousDate = entryDate;
          bestRun = Math.max(bestRun, currentRun);
        });
        const lastEntry = normalizedHistory[normalizedHistory.length - 1];
        const referenceKey = getLocalDateKey(referenceDate);
        const lastKey = String(lastEntry.date || "");
        const gapFromReference = diffInCalendarDays(referenceKey, lastKey);
        const activeToday = gapFromReference === 0;
        const activeYesterday = gapFromReference === 1;
        if (gapFromReference > 1) {
          currentRun = 0;
        }
        return {
          current: currentRun,
          best: bestRun,
          lastCompletedOn: lastKey,
          activeToday,
          activeYesterday
        };
      }
      function buildTimeline(history = [], days = 30, referenceDate = /* @__PURE__ */ new Date()) {
        const normalizedHistory = normalizeActivityHistory(history);
        const historyByDate = new Map(normalizedHistory.map((entry) => [entry.date, entry]));
        const today = startOfDateKey(referenceDate);
        const items = [];
        for (let offset = days - 1; offset >= 0; offset -= 1) {
          const date = addDays(today, -offset);
          const dateKey = getLocalDateKey(date);
          const entry = historyByDate.get(dateKey);
          items.push({
            date: dateKey,
            closed: Boolean(entry),
            skippedNew: Boolean(entry?.skippedNew),
            isToday: offset === 0,
            dayOfMonth: date.getDate(),
            weekdayIndex: date.getDay(),
            programDayIndex: entry?.programDayIndex || null,
            phaseIndex: entry?.phaseIndex || null,
            completedAt: entry?.completedAt || ""
          });
        }
        return items;
      }
      function buildStatistics(history = [], referenceDate = /* @__PURE__ */ new Date()) {
        const normalizedHistory = normalizeActivityHistory(history);
        const streak = computeStreak(normalizedHistory, referenceDate);
        const timeline30 = buildTimeline(normalizedHistory, 30, referenceDate);
        const timeline7 = timeline30.slice(-7);
        const closedDaysLast30 = timeline30.filter((entry) => entry.closed).length;
        const closedDaysLast7 = timeline7.filter((entry) => entry.closed).length;
        const skippedNewLast30 = timeline30.filter((entry) => entry.closed && entry.skippedNew).length;
        const recentClosures = normalizedHistory.slice(-8).reverse().map((entry) => ({
          date: entry.date,
          skippedNew: Boolean(entry.skippedNew),
          programDayIndex: entry.programDayIndex,
          phaseIndex: entry.phaseIndex,
          completedAt: entry.completedAt
        }));
        return {
          streak,
          overview: {
            closedDaysLast7,
            closedDaysLast30,
            completionRateLast30: Math.round(closedDaysLast30 / Math.max(1, timeline30.length) * 100),
            skippedNewLast30,
            totalClosedDays: normalizedHistory.length
          },
          timeline: timeline30,
          recentClosures
        };
      }
      module.exports = {
        DEFAULT_NOTIFICATION_PREFERENCES,
        REMINDER_KEYS,
        buildStatistics,
        computeStreak,
        getLocalDateKey,
        mergeNotificationPreferences,
        normalizeActivityHistory,
        normalizeNotificationPreferences,
        normalizeTimeString,
        recordDayCompletion
      };
    }
  });

  // src/lib/plan.js
  var require_plan = __commonJS({
    "src/lib/plan.js"(exports, module) {
      var MUSHAF_TOTAL_PAGES = 604;
      var LEGACY_UNITS_PER_PAGE = 2;
      var PROGRESS_UNITS_PER_PAGE = 30;
      var LINES_PER_PAGE = 15;
      var PROGRESS_UNITS_PER_LINE = PROGRESS_UNITS_PER_PAGE / LINES_PER_PAGE;
      var MAX_DAILY_NEW_PAGES = 10;
      var MUSHAF_TOTAL_PROGRESS_UNITS = MUSHAF_TOTAL_PAGES * PROGRESS_UNITS_PER_PAGE;
      var DEFAULT_SETTINGS = {
        dailyNewHalfPages: PROGRESS_UNITS_PER_PAGE / 2,
        totalHalfPages: MUSHAF_TOTAL_PROGRESS_UNITS,
        firstName: "",
        language: "fr",
        programMode: "forward"
      };
      var OLD_WINDOW_TARGET = 7;
      var PROGRAM_MODES = {
        forward: ["forward"],
        reverse: ["reverse"],
        "reverse-forward": ["reverse", "forward"]
      };
      var DEFAULT_PROGRESS = {
        currentHalfPage: 1,
        programDayIndex: 1,
        phaseIndex: 1,
        phaseProgressHalfPages: [0]
      };
      var PLAN_TEXT = {
        fr: {
          halfPageSingular: "demi-page",
          halfPagePlural: "demi-pages",
          lineSingular: "ligne",
          linePlural: "lignes",
          pageSingular: "page",
          pagePlural: "pages",
          upperHalf: "haute",
          lowerHalf: "basse",
          pageLabel: "Page {{page}}",
          halfPageLabel: "Page {{page}} moiti\xE9 {{half}}",
          lineLabel: "Page {{page}} ligne {{line}}",
          pageRangeLabel: "Page {{start}} -> Page {{end}}",
          partLabel: "Partie {{number}}",
          waveLabel: "Vague {{number}}",
          validationLabel: "Validation {{number}}",
          phaseLabel: "Phase {{current}} / {{total}}",
          titleOld: "Ancien",
          titleConsolidation: "Consolidation",
          titleRecent: "R\xE9cent",
          titleYesterday: "Veille",
          titleNew: "Nouveau",
          directionForward: "d\xE9but -> fin",
          directionReverse: "fin -> d\xE9but",
          oldHelper: "Rotation automatique en 7 parties [[\xE9quilibr\xE9es]] sur tout l'ancien situ\xE9 avant [[J-30]].",
          oldEmpty: "Pas encore d'ancien disponible.",
          consolidationHelper: "R\xE9vision de la partie des 30 derniers jours : la consolidation couvre [[J-8 \xE0 J-30]], avec une seule partie active \xE0 valider aujourd'hui.",
          consolidationEmpty: "Pas encore de partie de r\xE9vision sur les 30 derniers jours (J-8 \xE0 J-30).",
          recentHelper: "Bloc continu [[J-1 \xE0 J-7]].",
          recentEmpty: "Pas encore de r\xE9cent disponible.",
          yesterdayHelper: "Bloc de [[nouveau d'hier]] uniquement.",
          yesterdayEmpty: "Pas encore de veille disponible.",
          newHelper: "[[3 vagues]], [[3 validations]] par vague.",
          newEmpty: "Plus de nouveau a attribuer.",
          newFinished: "Nouveau termin\xE9",
          programFinished: "Parcours termin\xE9",
          activePartLabel: "1 partie active",
          balancedPartsLabel: "Parties \xE9quilibr\xE9es"
        },
        en: {
          halfPageSingular: "half-page",
          halfPagePlural: "half-pages",
          lineSingular: "line",
          linePlural: "lines",
          pageSingular: "page",
          pagePlural: "pages",
          upperHalf: "upper",
          lowerHalf: "lower",
          pageLabel: "Page {{page}}",
          halfPageLabel: "Page {{page}} {{half}} half",
          lineLabel: "Page {{page}} line {{line}}",
          pageRangeLabel: "Page {{start}} -> Page {{end}}",
          partLabel: "Part {{number}}",
          waveLabel: "Wave {{number}}",
          validationLabel: "Check {{number}}",
          phaseLabel: "Phase {{current}} / {{total}}",
          titleOld: "Old",
          titleConsolidation: "Consolidation",
          titleRecent: "Recent",
          titleYesterday: "Yesterday",
          titleNew: "New",
          directionForward: "start -> end",
          directionReverse: "end -> start",
          oldHelper: "Automatic rotation across 7 balanced parts over everything before J-30.",
          oldEmpty: "No old section is available yet.",
          consolidationHelper: "Review part of the last 30 days: consolidation covers J-8 to J-30, with one active part to validate today.",
          consolidationEmpty: "No review part is available yet for the last 30 days (J-8 to J-30).",
          recentHelper: "Continuous block from J-1 to J-7.",
          recentEmpty: "No recent block is available yet.",
          yesterdayHelper: "Yesterday's new block only.",
          yesterdayEmpty: "No yesterday block is available yet.",
          newHelper: "3 waves, 3 checks per wave.",
          newEmpty: "No new block remains to assign.",
          newFinished: "New work completed",
          programFinished: "Program completed",
          activePartLabel: "1 active part",
          balancedPartsLabel: "Balanced parts"
        },
        ar: {
          halfPageSingular: "\u0646\u0635\u0641 \u0635\u0641\u062D\u0629",
          halfPagePlural: "\u0623\u0646\u0635\u0627\u0641 \u0635\u0641\u062D\u0627\u062A",
          lineSingular: "\u0633\u0637\u0631",
          linePlural: "\u0623\u0633\u0637\u0631",
          pageSingular: "\u0635\u0641\u062D\u0629",
          pagePlural: "\u0635\u0641\u062D\u0627\u062A",
          upperHalf: "\u0639\u0644\u0648\u064A\u0629",
          lowerHalf: "\u0633\u0641\u0644\u064A\u0629",
          pageLabel: "\u0627\u0644\u0635\u0641\u062D\u0629 {{page}}",
          halfPageLabel: "\u0627\u0644\u0635\u0641\u062D\u0629 {{page}} \u0627\u0644\u0646\u0635\u0641 {{half}}",
          lineLabel: "\u0627\u0644\u0635\u0641\u062D\u0629 {{page}} \u0627\u0644\u0633\u0637\u0631 {{line}}",
          pageRangeLabel: "\u0627\u0644\u0635\u0641\u062D\u0629 {{start}} -> \u0627\u0644\u0635\u0641\u062D\u0629 {{end}}",
          partLabel: "\u0627\u0644\u062C\u0632\u0621 {{number}}",
          waveLabel: "\u0627\u0644\u0645\u0648\u062C\u0629 {{number}}",
          validationLabel: "\u0627\u0644\u062A\u062D\u0642\u0642 {{number}}",
          phaseLabel: "\u0627\u0644\u0645\u0631\u062D\u0644\u0629 {{current}} / {{total}}",
          titleOld: "\u0627\u0644\u0642\u062F\u064A\u0645",
          titleConsolidation: "\u0627\u0644\u062A\u062B\u0628\u064A\u062A",
          titleRecent: "\u0627\u0644\u0642\u0631\u064A\u0628",
          titleYesterday: "\u0627\u0644\u0623\u0645\u0633",
          titleNew: "\u0627\u0644\u062C\u062F\u064A\u062F",
          directionForward: "\u0645\u0646 \u0627\u0644\u0628\u062F\u0627\u064A\u0629 \u0625\u0644\u0649 \u0627\u0644\u0646\u0647\u0627\u064A\u0629",
          directionReverse: "\u0645\u0646 \u0627\u0644\u0646\u0647\u0627\u064A\u0629 \u0625\u0644\u0649 \u0627\u0644\u0628\u062F\u0627\u064A\u0629",
          oldHelper: "\u062F\u0648\u0631\u0629 \u062A\u0644\u0642\u0627\u0626\u064A\u0629 \u0639\u0644\u0649 7 \u0623\u062C\u0632\u0627\u0621 \u0645\u062A\u0648\u0627\u0632\u0646\u0629 \u0641\u064A \u0643\u0644 \u0627\u0644\u0645\u062D\u0641\u0648\u0638 \u0627\u0644\u0623\u0642\u062F\u0645 \u0645\u0646 30 \u064A\u0648\u0645\u0627.",
          oldEmpty: "\u0644\u0627 \u064A\u0648\u062C\u062F \u0642\u062F\u064A\u0645 \u0645\u062A\u0627\u062D \u0628\u0639\u062F.",
          consolidationHelper: "\u0645\u0631\u0627\u062C\u0639\u0629 \u0627\u0644\u062C\u0632\u0621 \u0627\u0644\u0648\u0627\u0642\u0639 \u0636\u0645\u0646 \u0622\u062E\u0631 30 \u064A\u0648\u0645\u0627: \u0627\u0644\u062A\u062B\u0628\u064A\u062A \u064A\u063A\u0637\u064A J-8 \u0625\u0644\u0649 J-30 \u0645\u0639 \u062C\u0632\u0621 \u0648\u0627\u062D\u062F \u0646\u0634\u0637 \u0644\u0644\u062A\u062D\u0642\u0642 \u0627\u0644\u064A\u0648\u0645.",
          consolidationEmpty: "\u0644\u0627 \u064A\u0648\u062C\u062F \u062C\u0632\u0621 \u0645\u0631\u0627\u062C\u0639\u0629 \u0645\u062A\u0627\u062D \u0628\u0639\u062F \u0644\u0622\u062E\u0631 30 \u064A\u0648\u0645\u0627 (\u0645\u0646 J-8 \u0625\u0644\u0649 J-30).",
          recentHelper: "\u0643\u062A\u0644\u0629 \u0645\u062A\u0635\u0644\u0629 \u0645\u0646 J-1 \u0625\u0644\u0649 J-7.",
          recentEmpty: "\u0644\u0627 \u064A\u0648\u062C\u062F \u0642\u0631\u064A\u0628 \u0645\u062A\u0627\u062D \u0628\u0639\u062F.",
          yesterdayHelper: "\u0643\u062A\u0644\u0629 \u062C\u062F\u064A\u062F \u0627\u0644\u0623\u0645\u0633 \u0641\u0642\u0637.",
          yesterdayEmpty: "\u0644\u0627 \u064A\u0648\u062C\u062F \u0628\u0644\u0648\u0643 \u0644\u0644\u0623\u0645\u0633 \u0628\u0639\u062F.",
          newHelper: "3 \u0645\u0648\u062C\u0627\u062A\u060C 3 \u062A\u062D\u0642\u0642\u0640\u0627\u062A \u0641\u064A \u0643\u0644 \u0645\u0648\u062C\u0629.",
          newEmpty: "\u0644\u0627 \u064A\u0648\u062C\u062F \u062C\u062F\u064A\u062F \u0622\u062E\u0631 \u0644\u0625\u0633\u0646\u0627\u062F\u0647.",
          newFinished: "\u0627\u0643\u062A\u0645\u0644 \u0627\u0644\u062C\u062F\u064A\u062F",
          programFinished: "\u0627\u0643\u062A\u0645\u0644 \u0627\u0644\u0645\u0633\u0627\u0631",
          activePartLabel: "\u062C\u0632\u0621 \u0646\u0634\u0637 \u0648\u0627\u062D\u062F",
          balancedPartsLabel: "\u0623\u062C\u0632\u0627\u0621 \u0645\u062A\u0648\u0627\u0632\u0646\u0629"
        }
      };
      function clampInteger(value, min, max, fallback) {
        const normalized = Number.parseInt(value, 10);
        if (Number.isNaN(normalized)) {
          return fallback;
        }
        return Math.min(Math.max(normalized, min), max);
      }
      function formatDecimal(value, maxDecimals = 2) {
        return Number(value || 0).toFixed(maxDecimals).replace(/\.?0+$/, "");
      }
      function isLegacyProgressScale(input = {}) {
        const rawTotal = Number(input.totalHalfPages);
        if (Number.isFinite(rawTotal) && rawTotal > 0) {
          return rawTotal <= MUSHAF_TOTAL_PAGES * LEGACY_UNITS_PER_PAGE;
        }
        return false;
      }
      function convertLegacyCountToProgressUnits(value) {
        return Math.max(0, Math.round(Number(value || 0) * (PROGRESS_UNITS_PER_PAGE / LEGACY_UNITS_PER_PAGE)));
      }
      function convertLegacyPointToProgressUnits(value) {
        const normalized = Math.max(1, Number(value || DEFAULT_PROGRESS.currentHalfPage));
        return convertLegacyCountToProgressUnits(normalized - 1) + 1;
      }
      function normalizeLanguage(value) {
        if (value === "en") {
          return "en";
        }
        if (value === "ar") {
          return "ar";
        }
        return "fr";
      }
      function normalizeProgramMode(value) {
        return Object.prototype.hasOwnProperty.call(PROGRAM_MODES, value) ? value : DEFAULT_SETTINGS.programMode;
      }
      function interpolate(template, variables = {}) {
        return String(template).replace(/\{\{(\w+)\}\}/g, (_match, key) => String(variables[key] ?? ""));
      }
      function getPlanText(language, key, variables = {}) {
        const locale = normalizeLanguage(language);
        const dictionary = PLAN_TEXT[locale] || PLAN_TEXT.fr;
        const fallback = PLAN_TEXT.fr[key] || key;
        return interpolate(dictionary[key] || fallback, variables);
      }
      function formatHalfPageCount(value, language = "fr") {
        const normalized = Number(value || 0);
        const unit = normalized === 1 ? getPlanText(language, "halfPageSingular") : getPlanText(language, "halfPagePlural");
        return `${normalized} ${unit}`;
      }
      function formatLineCount(value, language = "fr") {
        const normalized = Number(value || 0);
        const formatted = Number.isInteger(normalized) ? String(normalized) : formatDecimal(normalized, 1);
        const numeric = Number(formatted);
        const unit = numeric === 1 ? getPlanText(language, "lineSingular") : getPlanText(language, "linePlural");
        return `${formatted} ${unit}`;
      }
      function formatPageCountFromHalfPages(halfPageCount, language = "fr") {
        const units = Math.max(0, Number(halfPageCount || 0));
        if (units > 0 && units < PROGRESS_UNITS_PER_PAGE) {
          if (units === PROGRESS_UNITS_PER_PAGE / 2) {
            return formatHalfPageCount(1, language);
          }
          if (units > PROGRESS_UNITS_PER_PAGE / 2) {
            const remainingUnits = units - PROGRESS_UNITS_PER_PAGE / 2;
            if (remainingUnits > 0 && remainingUnits % PROGRESS_UNITS_PER_LINE === 0) {
              return `${formatHalfPageCount(1, language)} + ${formatLineCount(remainingUnits / PROGRESS_UNITS_PER_LINE, language)}`;
            }
          }
          if (units % PROGRESS_UNITS_PER_LINE === 0) {
            return formatLineCount(units / PROGRESS_UNITS_PER_LINE, language);
          }
        }
        const normalized = units / PROGRESS_UNITS_PER_PAGE;
        const formatted = Number.isInteger(normalized) ? String(normalized) : formatDecimal(normalized);
        const numeric = Number(formatted);
        const unit = numeric > 0 && numeric < 1 || numeric === 1 ? getPlanText(language, "pageSingular") : getPlanText(language, "pagePlural");
        return `${formatted} ${unit}`;
      }
      function formatWholePageCount(pageCount, language = "fr") {
        const normalized = Number(pageCount || 0);
        const unit = normalized === 1 ? getPlanText(language, "pageSingular") : getPlanText(language, "pagePlural");
        return `${normalized} ${unit}`;
      }
      function computeOldWindowCount() {
        return OLD_WINDOW_TARGET;
      }
      function normalizeShortText(value, fallback = "", maxLength = 40) {
        const normalized = String(value || "").replace(/\s+/g, " ").trim().slice(0, maxLength);
        return normalized || fallback;
      }
      function normalizeSettings(input = {}) {
        const legacyScale = isLegacyProgressScale(input);
        const normalizedDailyNewUnits = legacyScale ? convertLegacyCountToProgressUnits(input.dailyNewHalfPages) : input.dailyNewHalfPages;
        return {
          dailyNewHalfPages: clampInteger(
            normalizedDailyNewUnits,
            1,
            MAX_DAILY_NEW_PAGES * PROGRESS_UNITS_PER_PAGE,
            DEFAULT_SETTINGS.dailyNewHalfPages
          ),
          totalHalfPages: DEFAULT_SETTINGS.totalHalfPages,
          firstName: normalizeShortText(input.firstName, DEFAULT_SETTINGS.firstName),
          language: normalizeLanguage(input.language || DEFAULT_SETTINGS.language),
          programMode: normalizeProgramMode(input.programMode || DEFAULT_SETTINGS.programMode)
        };
      }
      function getProgramPhases(settings = DEFAULT_SETTINGS) {
        return PROGRAM_MODES[normalizeProgramMode(settings.programMode)] || PROGRAM_MODES.forward;
      }
      function getCurrentPhaseDirection(settings = DEFAULT_SETTINGS, progress = DEFAULT_PROGRESS) {
        const phases = getProgramPhases(settings);
        const phaseIndex = clampInteger(progress.phaseIndex, 1, phases.length, DEFAULT_PROGRESS.phaseIndex);
        return phases[phaseIndex - 1] || phases[0];
      }
      function sequenceIndexToPhysicalHalfPage(index, totalHalfPages, direction = "forward") {
        if (direction === "reverse") {
          return totalHalfPages - index + 1;
        }
        return index;
      }
      function physicalHalfPageToSequenceIndex(index, totalHalfPages, direction = "forward") {
        if (direction === "reverse") {
          return totalHalfPages - index + 1;
        }
        return index;
      }
      function normalizeProgress(input = {}, settings = DEFAULT_SETTINGS, options = {}) {
        const normalizedInput = options.legacyScale ? {
          ...input,
          currentHalfPage: convertLegacyPointToProgressUnits(input.currentHalfPage),
          phaseProgressHalfPages: Array.isArray(input.phaseProgressHalfPages) ? input.phaseProgressHalfPages.map(convertLegacyCountToProgressUnits) : input.phaseProgressHalfPages
        } : input;
        const phases = getProgramPhases(settings);
        const fallbackPhaseIndex = clampInteger(normalizedInput.phaseIndex, 1, phases.length, DEFAULT_PROGRESS.phaseIndex);
        const fallbackCurrentHalfPage = clampInteger(
          normalizedInput.currentHalfPage,
          1,
          settings.totalHalfPages + 1,
          DEFAULT_PROGRESS.currentHalfPage
        );
        const derivedPhaseProgress = phases.map((_phase, index) => {
          if (index + 1 < fallbackPhaseIndex) {
            return settings.totalHalfPages;
          }
          if (index + 1 === fallbackPhaseIndex) {
            return Math.max(0, Math.min(fallbackCurrentHalfPage - 1, settings.totalHalfPages));
          }
          return 0;
        });
        const rawPhaseProgress = Array.isArray(normalizedInput.phaseProgressHalfPages) ? normalizedInput.phaseProgressHalfPages : derivedPhaseProgress;
        const phaseProgressHalfPages = phases.map(
          (_phase, index) => clampInteger(rawPhaseProgress[index], 0, settings.totalHalfPages, derivedPhaseProgress[index] || 0)
        );
        const activePhaseIndex = clampInteger(normalizedInput.phaseIndex, 1, phases.length, fallbackPhaseIndex);
        const activePhaseCount = phaseProgressHalfPages[activePhaseIndex - 1] || 0;
        return {
          currentHalfPage: activePhaseCount >= settings.totalHalfPages ? settings.totalHalfPages + 1 : activePhaseCount + 1,
          programDayIndex: clampInteger(normalizedInput.programDayIndex, 1, 5e4, DEFAULT_PROGRESS.programDayIndex),
          phaseIndex: activePhaseIndex,
          phaseProgressHalfPages
        };
      }
      function createEmptyDailyStatus(signature = "") {
        return {
          signature,
          blocks: {
            old: false,
            consolidation: false,
            recent: false,
            yesterday: false
          },
          skipNew: false,
          waves: [
            [false, false, false],
            [false, false, false],
            [false, false, false]
          ]
        };
      }
      function normalizeDailyStatus(input = {}, signature = "") {
        const fallback = createEmptyDailyStatus(signature);
        const blocks = input.blocks || {};
        const rawWaves = Array.isArray(input.waves) ? input.waves : fallback.waves;
        return {
          signature: String(input.signature || signature),
          blocks: {
            old: Boolean(blocks.old),
            consolidation: Boolean(blocks.consolidation),
            recent: Boolean(blocks.recent),
            yesterday: Boolean(blocks.yesterday)
          },
          skipNew: Boolean(input.skipNew),
          waves: [0, 1, 2].map((waveIndex) => {
            const rawSlots = Array.isArray(rawWaves[waveIndex]) ? rawWaves[waveIndex] : fallback.waves[waveIndex];
            return [0, 1, 2].map((slotIndex) => Boolean(rawSlots[slotIndex]));
          })
        };
      }
      function getDaySignature(settings, progress) {
        return [
          settings.dailyNewHalfPages,
          settings.totalHalfPages,
          settings.programMode,
          progress.currentHalfPage,
          progress.programDayIndex,
          progress.phaseIndex
        ].join(":");
      }
      function progressUnitToParts(index) {
        const normalizedIndex = Math.max(1, Math.round(Number(index) || 1));
        const zeroBased = normalizedIndex - 1;
        const page = Math.floor(zeroBased / PROGRESS_UNITS_PER_PAGE) + 1;
        const unitInPage = zeroBased % PROGRESS_UNITS_PER_PAGE + 1;
        const line = Math.max(1, Math.min(LINES_PER_PAGE, Math.ceil(unitInPage / PROGRESS_UNITS_PER_LINE)));
        return {
          index: normalizedIndex,
          page,
          unitInPage,
          line,
          half: unitInPage <= PROGRESS_UNITS_PER_PAGE / 2 ? "haute" : "basse"
        };
      }
      function formatHalfPage(index, language = "fr") {
        const parts = progressUnitToParts(index);
        if (parts.unitInPage === 1) {
          return getPlanText(language, "pageLabel", { page: parts.page });
        }
        if (parts.unitInPage === PROGRESS_UNITS_PER_PAGE / 2 + 1) {
          return getPlanText(language, "halfPageLabel", {
            page: parts.page,
            half: getPlanText(language, "lowerHalf")
          });
        }
        return getPlanText(language, "lineLabel", {
          page: parts.page,
          line: parts.line
        });
      }
      function formatRangeLabel(physicalStart, physicalEnd, language = "fr") {
        const startParts = progressUnitToParts(physicalStart);
        const endParts = progressUnitToParts(physicalEnd);
        const isForwardWholePage = physicalStart <= physicalEnd && startParts.unitInPage === 1 && endParts.unitInPage === PROGRESS_UNITS_PER_PAGE;
        const isReverseWholePage = physicalStart >= physicalEnd && startParts.unitInPage === PROGRESS_UNITS_PER_PAGE && endParts.unitInPage === 1;
        if (isForwardWholePage || isReverseWholePage) {
          if (startParts.page === endParts.page) {
            return getPlanText(language, "pageLabel", { page: startParts.page });
          }
          return getPlanText(language, "pageRangeLabel", { start: startParts.page, end: endParts.page });
        }
        const isUpperHalfRange = startParts.page === endParts.page && startParts.unitInPage === 1 && endParts.unitInPage === PROGRESS_UNITS_PER_PAGE / 2;
        const isLowerHalfRange = startParts.page === endParts.page && startParts.unitInPage === PROGRESS_UNITS_PER_PAGE / 2 + 1 && endParts.unitInPage === PROGRESS_UNITS_PER_PAGE;
        const isUpperHalfReverseRange = startParts.page === endParts.page && startParts.unitInPage === PROGRESS_UNITS_PER_PAGE / 2 && endParts.unitInPage === 1;
        const isLowerHalfReverseRange = startParts.page === endParts.page && startParts.unitInPage === PROGRESS_UNITS_PER_PAGE && endParts.unitInPage === PROGRESS_UNITS_PER_PAGE / 2 + 1;
        if (isUpperHalfRange || isLowerHalfRange || isUpperHalfReverseRange || isLowerHalfReverseRange) {
          return getPlanText(language, "halfPageLabel", {
            page: startParts.page,
            half: getPlanText(language, isUpperHalfRange || isUpperHalfReverseRange ? "upperHalf" : "lowerHalf")
          });
        }
        if (startParts.page === endParts.page) {
          const startLineLabel = getPlanText(language, "lineLabel", {
            page: startParts.page,
            line: startParts.line
          });
          const endLineLabel = getPlanText(language, "lineLabel", {
            page: endParts.page,
            line: endParts.line
          });
          return startLineLabel === endLineLabel ? startLineLabel : `${startLineLabel} -> ${endLineLabel}`;
        }
        const startLabel = formatHalfPage(physicalStart, language);
        const endLabel = formatHalfPage(physicalEnd, language);
        return physicalStart === physicalEnd ? startLabel : `${startLabel} -> ${endLabel}`;
      }
      function createRange(start, end, totalHalfPages, language = "fr", direction = "forward") {
        if (!Number.isFinite(start) || !Number.isFinite(end)) {
          return null;
        }
        if (end < 1 || start > totalHalfPages || start > end) {
          return null;
        }
        const safeStart = Math.max(1, Math.min(start, totalHalfPages));
        const safeEnd = Math.max(1, Math.min(end, totalHalfPages));
        if (safeStart > safeEnd) {
          return null;
        }
        const physicalStart = sequenceIndexToPhysicalHalfPage(safeStart, totalHalfPages, direction);
        const physicalEnd = sequenceIndexToPhysicalHalfPage(safeEnd, totalHalfPages, direction);
        const coverageStart = Math.min(physicalStart, physicalEnd);
        const coverageEnd = Math.max(physicalStart, physicalEnd);
        const startLabel = formatHalfPage(physicalStart, language);
        const endLabel = formatHalfPage(physicalEnd, language);
        const pageCount = (safeEnd - safeStart + 1) / PROGRESS_UNITS_PER_PAGE;
        return {
          start: safeStart,
          end: safeEnd,
          count: safeEnd - safeStart + 1,
          pageCount,
          direction,
          physicalStart,
          physicalEnd,
          coverageStart,
          coverageEnd,
          startLabel,
          endLabel,
          label: formatRangeLabel(physicalStart, physicalEnd, language),
          countLabel: formatPageCountFromHalfPages(safeEnd - safeStart + 1, language)
        };
      }
      function createPageWindowRange(startPage, endPage, poolRange, totalHalfPages, language = "fr", direction = "forward") {
        if (!poolRange || !Number.isFinite(startPage) || !Number.isFinite(endPage) || startPage > endPage) {
          return null;
        }
        const poolPageStart = Math.ceil(poolRange.start / PROGRESS_UNITS_PER_PAGE);
        const poolPageEnd = Math.ceil(poolRange.end / PROGRESS_UNITS_PER_PAGE);
        const safeStartPage = Math.max(poolPageStart, startPage);
        const safeEndPage = Math.min(poolPageEnd, endPage);
        if (safeStartPage > safeEndPage) {
          return null;
        }
        const startHalfPage = safeStartPage === poolPageStart ? poolRange.start : (safeStartPage - 1) * PROGRESS_UNITS_PER_PAGE + 1;
        const endHalfPage = safeEndPage === poolPageEnd ? poolRange.end : safeEndPage * PROGRESS_UNITS_PER_PAGE;
        const baseRange = createRange(startHalfPage, endHalfPage, totalHalfPages, language, direction);
        if (!baseRange) {
          return null;
        }
        const pageCount = safeEndPage - safeStartPage + 1;
        return {
          ...baseRange,
          pageStart: safeStartPage,
          pageEnd: safeEndPage,
          pageCount,
          countLabel: formatWholePageCount(pageCount, language)
        };
      }
      function splitConsolidationBands(range, programDayIndex, totalHalfPages, language = "fr", direction = "forward") {
        const emptyResult = {
          fullRange: null,
          count: 0,
          activeBand: null,
          activeRange: null,
          bands: {
            A: null,
            B: null,
            C: null
          }
        };
        if (!range) {
          return emptyResult;
        }
        const count = range.count;
        const base = Math.floor(count / 3);
        const remainder = count % 3;
        const lengths = [
          base + (remainder > 0 ? 1 : 0),
          base + (remainder > 1 ? 1 : 0),
          base
        ];
        const bandKeys = ["A", "B", "C"];
        const bands = {};
        let cursor = range.start;
        for (let index = 0; index < bandKeys.length; index += 1) {
          const bandLength = lengths[index];
          bands[bandKeys[index]] = bandLength > 0 ? createRange(cursor, cursor + bandLength - 1, totalHalfPages, language, direction) : null;
          cursor += bandLength;
        }
        const activeBand = bandKeys[(programDayIndex - 1) % 3];
        return {
          fullRange: range,
          count,
          activeBand,
          activeRange: bands[activeBand],
          bands
        };
      }
      function buildOldBlock(oldPoolRange, programDayIndex, totalHalfPages, language = "fr", direction = "forward") {
        if (!oldPoolRange) {
          return {
            poolRange: oldPoolRange,
            range: null,
            nextRange: null,
            windows: [],
            windowCount: 0,
            currentWindowNumber: 0,
            nextWindowNumber: 0
          };
        }
        const poolPageStart = Math.ceil(oldPoolRange.start / PROGRESS_UNITS_PER_PAGE);
        const poolPageEnd = Math.ceil(oldPoolRange.end / PROGRESS_UNITS_PER_PAGE);
        const poolPageCount = poolPageEnd - poolPageStart + 1;
        const windowCount = Math.max(1, Math.min(computeOldWindowCount(), poolPageCount));
        const baseSize = Math.floor(poolPageCount / windowCount);
        const remainder = poolPageCount % windowCount;
        const lengths = Array.from({ length: windowCount }, (_unused, index) => baseSize + (index < remainder ? 1 : 0));
        const windowIndex = (programDayIndex - 1) % windowCount;
        const currentWindowNumber = windowIndex + 1;
        const nextWindowNumber = currentWindowNumber === windowCount ? 1 : currentWindowNumber + 1;
        let pageCursor = poolPageStart;
        const windows = lengths.map((length, index) => {
          const windowStartPage = pageCursor;
          const windowEndPage = pageCursor + length - 1;
          const windowRange = createPageWindowRange(windowStartPage, windowEndPage, oldPoolRange, totalHalfPages, language, direction);
          pageCursor += length;
          return {
            number: index + 1,
            label: getPlanText(language, "partLabel", { number: index + 1 }),
            active: index === windowIndex,
            range: windowRange
          };
        });
        const range = windows[windowIndex]?.range || null;
        const nextBlock = windows[nextWindowNumber - 1]?.range || null;
        const displayPoolRange = createPageWindowRange(poolPageStart, poolPageEnd, oldPoolRange, totalHalfPages, language, direction);
        return {
          poolRange: displayPoolRange,
          range,
          nextRange: nextBlock,
          windows,
          windowCount,
          currentWindowNumber,
          nextWindowNumber,
          currentWindowLabel: `${getPlanText(language, "partLabel", { number: currentWindowNumber })} / ${windowCount}`,
          nextWindowLabel: `${getPlanText(language, "partLabel", { number: nextWindowNumber })} / ${windowCount}`,
          windowSizeLabel: getPlanText(language, "balancedPartsLabel"),
          startsAt: range ? range.start : null,
          nextStart: nextBlock ? nextBlock.start : null
        };
      }
      function buildWaves(dailyStatus, language = "fr") {
        const waves = dailyStatus.waves.map((slots, waveIndex) => ({
          id: waveIndex + 1,
          label: getPlanText(language, "waveLabel", { number: waveIndex + 1 }),
          slots: slots.map((checked, slotIndex) => ({
            index: slotIndex,
            checked,
            label: getPlanText(language, "validationLabel", { number: slotIndex + 1 })
          })),
          complete: slots.every(Boolean)
        }));
        return {
          items: waves,
          checkedCount: waves.flatMap((wave) => wave.slots).filter((slot) => slot.checked).length,
          isComplete: waves.every((wave) => wave.complete)
        };
      }
      function buildTodayPlan({ settings, progress, dailyStatus }) {
        const language = normalizeLanguage(settings.language);
        const q = settings.dailyNewHalfPages;
        const h = progress.currentHalfPage;
        const totalHalfPages = settings.totalHalfPages;
        const phases = getProgramPhases(settings);
        const phaseCount = phases.length;
        const direction = getCurrentPhaseDirection(settings, progress);
        const phaseProgressHalfPages = Array.isArray(progress.phaseProgressHalfPages) ? phases.map((_phase, index) => Math.max(0, Math.min(progress.phaseProgressHalfPages[index] || 0, totalHalfPages))) : [];
        const learnedInCurrentPhase = phaseProgressHalfPages[progress.phaseIndex - 1] ?? Math.max(0, Math.min(progress.currentHalfPage - 1, totalHalfPages));
        const learnedOverallHalfPages = phaseProgressHalfPages.reduce((sum, count) => sum + count, 0);
        const totalProgramHalfPages = totalHalfPages * phaseCount;
        const learnedRange = createRange(1, learnedInCurrentPhase, totalHalfPages, language, direction);
        const learnedRanges = phases.map((phaseDirection, index) => createRange(1, phaseProgressHalfPages[index] || 0, totalHalfPages, language, phaseDirection)).filter(Boolean);
        const newRange = createRange(h, h + q - 1, totalHalfPages, language, direction);
        const yesterdayRange = createRange(h - q, h - 1, totalHalfPages, language, direction);
        const recentRange = createRange(h - 7 * q, h - 1, totalHalfPages, language, direction);
        const consolidationRange = createRange(h - 30 * q, h - 8 * q + (q - 1), totalHalfPages, language, direction);
        const oldPoolRange = consolidationRange ? createRange(1, consolidationRange.start - 1, totalHalfPages, language, direction) : null;
        const oldBlock = buildOldBlock(oldPoolRange, progress.programDayIndex, totalHalfPages, language, direction);
        const consolidation = splitConsolidationBands(consolidationRange, progress.programDayIndex, totalHalfPages, language, direction);
        const waves = buildWaves(dailyStatus, language);
        const blocks = {
          old: {
            key: "old",
            title: getPlanText(language, "titleOld"),
            order: 1,
            present: Boolean(oldBlock.range),
            done: oldBlock.range ? Boolean(dailyStatus.blocks.old) : true,
            range: oldBlock.range,
            poolRange: oldBlock.poolRange,
            windows: oldBlock.windows,
            windowCount: oldBlock.windowCount,
            currentWindowNumber: oldBlock.currentWindowNumber,
            nextWindowNumber: oldBlock.nextWindowNumber,
            currentWindowLabel: oldBlock.currentWindowLabel,
            nextWindowLabel: oldBlock.nextWindowLabel,
            windowSizeLabel: oldBlock.windowSizeLabel,
            startsAt: oldBlock.startsAt,
            nextStart: oldBlock.nextStart,
            nextRange: oldBlock.nextRange,
            helper: oldBlock.range ? getPlanText(language, "oldHelper") : getPlanText(language, "oldEmpty")
          },
          consolidation: {
            key: "consolidation",
            title: getPlanText(language, "titleConsolidation"),
            order: 2,
            present: Boolean(consolidation.fullRange && consolidation.activeRange),
            done: consolidation.fullRange && consolidation.activeRange ? Boolean(dailyStatus.blocks.consolidation) : true,
            fullRange: consolidation.fullRange,
            activeBand: consolidation.activeBand,
            activeRange: consolidation.activeRange,
            bands: consolidation.bands,
            helper: consolidation.fullRange ? getPlanText(language, "consolidationHelper") : getPlanText(language, "consolidationEmpty")
          },
          recent: {
            key: "recent",
            title: getPlanText(language, "titleRecent"),
            order: 3,
            present: Boolean(recentRange),
            done: recentRange ? Boolean(dailyStatus.blocks.recent) : true,
            range: recentRange,
            helper: recentRange ? getPlanText(language, "recentHelper") : getPlanText(language, "recentEmpty")
          },
          yesterday: {
            key: "yesterday",
            title: getPlanText(language, "titleYesterday"),
            order: 4,
            present: Boolean(yesterdayRange),
            done: yesterdayRange ? Boolean(dailyStatus.blocks.yesterday) : true,
            range: yesterdayRange,
            helper: yesterdayRange ? getPlanText(language, "yesterdayHelper") : getPlanText(language, "yesterdayEmpty")
          },
          new: {
            key: "new",
            title: getPlanText(language, "titleNew"),
            order: 5,
            present: Boolean(newRange),
            done: newRange ? waves.isComplete : true,
            dayComplete: newRange ? waves.isComplete || Boolean(dailyStatus.skipNew) : true,
            skipped: Boolean(newRange && dailyStatus.skipNew),
            range: newRange,
            waves: waves.items,
            checkedCount: waves.checkedCount,
            helper: newRange ? getPlanText(language, "newHelper") : getPlanText(language, "newEmpty")
          }
        };
        const order = ["old", "consolidation", "recent", "yesterday", "new"];
        for (const [index, blockKey] of order.entries()) {
          const previousKeys = order.slice(0, index).filter((key) => blocks[key].present);
          const blockedByKeys = previousKeys.filter((key) => !blocks[key].dayComplete);
          blocks[blockKey].blockedByKeys = blockedByKeys;
          blocks[blockKey].blockedByLabels = blockedByKeys.map((key) => blocks[key].title);
          blocks[blockKey].locked = blocks[blockKey].present && blockedByKeys.length > 0;
          blocks[blockKey].dayComplete = typeof blocks[blockKey].dayComplete === "boolean" ? blocks[blockKey].dayComplete : blocks[blockKey].done;
        }
        const canAdvanceDay = blocks.old.done && blocks.consolidation.done && blocks.recent.done && blocks.yesterday.done && blocks.new.done;
        const dayClosed = blocks.old.dayComplete && blocks.consolidation.dayComplete && blocks.recent.dayComplete && blocks.yesterday.dayComplete && blocks.new.dayComplete;
        const canSkipMemorizationDay = blocks.old.dayComplete && blocks.consolidation.dayComplete && blocks.recent.dayComplete && blocks.yesterday.dayComplete && blocks.new.present && !blocks.new.dayComplete;
        const nextPhaseProgressHalfPages = phaseProgressHalfPages.length ? [...phaseProgressHalfPages] : phases.map((_phase, index) => index + 1 < progress.phaseIndex ? totalHalfPages : 0);
        const activePhaseOffset = Math.max(0, Math.min(progress.phaseIndex - 1, phaseCount - 1));
        nextPhaseProgressHalfPages[activePhaseOffset] = Math.min(
          totalHalfPages,
          (nextPhaseProgressHalfPages[activePhaseOffset] || 0) + settings.dailyNewHalfPages
        );
        const nextProgress = normalizeProgress(
          {
            programDayIndex: progress.programDayIndex + 1,
            phaseIndex: progress.phaseIndex,
            phaseProgressHalfPages: nextPhaseProgressHalfPages
          },
          settings
        );
        return {
          signature: getDaySignature(settings, progress),
          learnedRange,
          learnedRanges,
          summary: {
            currentHalfPage: progress.currentHalfPage,
            currentHalfPageLabel: progress.currentHalfPage <= totalHalfPages ? formatHalfPage(sequenceIndexToPhysicalHalfPage(progress.currentHalfPage, totalHalfPages, direction), language) : progress.phaseIndex < phaseCount ? getPlanText(language, "newFinished") : getPlanText(language, "programFinished"),
            dailyNewHalfPages: settings.dailyNewHalfPages,
            dailyNewLabel: formatPageCountFromHalfPages(settings.dailyNewHalfPages, language),
            oldWindowCount: computeOldWindowCount(),
            oldDailyLabel: getPlanText(language, "activePartLabel"),
            programDayIndex: progress.programDayIndex,
            phaseIndex: progress.phaseIndex,
            phaseCount,
            phaseLabel: getPlanText(language, "phaseLabel", { current: progress.phaseIndex, total: phaseCount }),
            phaseDirection: direction,
            phaseDirectionLabel: getPlanText(language, direction === "reverse" ? "directionReverse" : "directionForward"),
            learnedHalfPages: learnedRange ? learnedRange.count : 0,
            learnedHalfPagesOverall: learnedOverallHalfPages,
            phaseProgressHalfPages,
            totalProgramHalfPages,
            totalHalfPages,
            totalPages: totalHalfPages / PROGRESS_UNITS_PER_PAGE
          },
          blocks,
          order,
          canAdvanceDay,
          dayClosed,
          skippedMemorizationDay: Boolean(blocks.new.skipped),
          canSkipMemorizationDay,
          nextProgress
        };
      }
      module.exports = {
        DEFAULT_PROGRESS,
        DEFAULT_SETTINGS,
        buildTodayPlan,
        createEmptyDailyStatus,
        getCurrentPhaseDirection,
        formatHalfPage,
        formatHalfPageCount,
        formatPageCountFromHalfPages,
        formatWholePageCount,
        computeOldWindowCount,
        getDaySignature,
        getProgramPhases,
        isLegacyProgressScale,
        normalizeDailyStatus,
        normalizeProgress,
        physicalHalfPageToSequenceIndex,
        normalizeSettings,
        sequenceIndexToPhysicalHalfPage
      };
    }
  });

  // src/storage/store.js
  var require_store = __commonJS({
    "src/storage/store.js"(exports, module) {
      var { createEmptyCard, fsrs, Rating, State } = require_dist();
      var { createMemoryStateRepository, resolveDefaultStateRepository } = require_state_repository();
      var {
        DEFAULT_NOTIFICATION_PREFERENCES,
        buildStatistics,
        mergeNotificationPreferences,
        normalizeActivityHistory,
        normalizeNotificationPreferences,
        recordDayCompletion
      } = require_activity();
      var {
        DEFAULT_PROGRESS,
        DEFAULT_SETTINGS,
        buildTodayPlan,
        createEmptyDailyStatus,
        getDaySignature,
        isLegacyProgressScale,
        normalizeDailyStatus,
        normalizeProgress,
        normalizeSettings
      } = require_plan();
      var PAGE_ERROR_LEVELS = /* @__PURE__ */ new Set(["minor", "medium", "grave"]);
      var ERROR_LEVEL_KEYS = ["minor", "medium", "grave"];
      var ERROR_SCOPE_KEYS = ["harakah", "word", "line", "next-page-link"];
      var ERROR_SCOPE_TO_SEVERITY = {
        harakah: "minor",
        word: "medium",
        line: "grave",
        "next-page-link": "grave"
      };
      var MAX_PAGE_EVENTS = 24;
      var HOUR_MS = 60 * 60 * 1e3;
      var DAY_MS = 24 * HOUR_MS;
      var ERROR_REVIEW_SCHEDULER = fsrs({
        enable_fuzz: false
      });
      var STORE_TEXT = {
        fr: {
          noValidPages: "Aucune page valide n'a ete fournie.",
          invalidPageNumber: "Numero de page invalide.",
          invalidBlock: "Bloc invalide.",
          blockUnavailable: "Ce bloc n'est pas disponible aujourd'hui.",
          validateFirst: "Valide d'abord : {{items}}.",
          invalidWave: "Validation de vague invalide.",
          newUnavailable: "Le nouveau n'est pas disponible aujourd'hui.",
          dayNotComplete: "La journee n'est pas encore completement validee.",
          skipMemorizationUnavailable: "Ce bouton n'est disponible que quand tout est valide sauf le nouveau.",
          invalidErrorType: "Type d'erreur invalide.",
          invalidErrorScope: "Type de zone invalide.",
          invalidSelectionRect: "Zone selectionnee invalide.",
          invalidErrorItem: "Erreur introuvable.",
          nextPageLinkAlreadyExists: "Cette page a deja une erreur de liaison avec la page suivante.",
          invalidReviewItem: "Carte d'erreur introuvable.",
          invalidReviewResult: "Resultat de revision invalide."
        },
        en: {
          noValidPages: "No valid page was provided.",
          invalidPageNumber: "Invalid page number.",
          invalidBlock: "Invalid block.",
          blockUnavailable: "This block is not available today.",
          validateFirst: "Validate first: {{items}}.",
          invalidWave: "Invalid wave check.",
          newUnavailable: "New work is not available today.",
          dayNotComplete: "The day is not fully validated yet.",
          skipMemorizationUnavailable: "This button is only available when everything is validated except the new block.",
          invalidErrorType: "Invalid error type.",
          invalidErrorScope: "Invalid error scope.",
          invalidSelectionRect: "Invalid selected area.",
          invalidErrorItem: "Error not found.",
          nextPageLinkAlreadyExists: "This page already has a next-page link error.",
          invalidReviewItem: "Error card not found.",
          invalidReviewResult: "Invalid review result."
        },
        ar: {
          noValidPages: "\u0644\u0645 \u064A\u062A\u0645 \u062A\u0642\u062F\u064A\u0645 \u0635\u0641\u062D\u0629 \u0635\u0627\u0644\u062D\u0629.",
          invalidPageNumber: "\u0631\u0642\u0645 \u0627\u0644\u0635\u0641\u062D\u0629 \u063A\u064A\u0631 \u0635\u0627\u0644\u062D.",
          invalidBlock: "\u0627\u0644\u0643\u062A\u0644\u0629 \u063A\u064A\u0631 \u0635\u0627\u0644\u062D\u0629.",
          blockUnavailable: "\u0647\u0630\u0647 \u0627\u0644\u0643\u062A\u0644\u0629 \u063A\u064A\u0631 \u0645\u062A\u0627\u062D\u0629 \u0627\u0644\u064A\u0648\u0645.",
          validateFirst: "\u062A\u062D\u0642\u0642 \u0623\u0648\u0644\u0627 \u0645\u0646: {{items}}.",
          invalidWave: "\u062A\u062D\u0642\u0642 \u0627\u0644\u0645\u0648\u062C\u0629 \u063A\u064A\u0631 \u0635\u0627\u0644\u062D.",
          newUnavailable: "\u0627\u0644\u062C\u062F\u064A\u062F \u063A\u064A\u0631 \u0645\u062A\u0627\u062D \u0627\u0644\u064A\u0648\u0645.",
          dayNotComplete: "\u0627\u0644\u064A\u0648\u0645 \u0644\u0645 \u064A\u0643\u062A\u0645\u0644 \u0627\u0644\u062A\u062D\u0642\u0642 \u0645\u0646\u0647 \u0628\u0639\u062F.",
          skipMemorizationUnavailable: "\u0647\u0630\u0627 \u0627\u0644\u0632\u0631 \u0645\u062A\u0627\u062D \u0641\u0642\u0637 \u0639\u0646\u062F\u0645\u0627 \u064A\u0643\u0648\u0646 \u0643\u0644 \u0634\u064A\u0621 \u0645\u062A\u062D\u0642\u0642\u0627 \u0645\u0627 \u0639\u062F\u0627 \u0627\u0644\u062C\u062F\u064A\u062F.",
          invalidErrorType: "\u0646\u0648\u0639 \u0627\u0644\u062E\u0637\u0623 \u063A\u064A\u0631 \u0635\u0627\u0644\u062D.",
          invalidErrorScope: "\u0646\u0648\u0639 \u0627\u0644\u0645\u0646\u0637\u0642\u0629 \u063A\u064A\u0631 \u0635\u0627\u0644\u062D.",
          invalidSelectionRect: "\u0627\u0644\u0645\u0646\u0637\u0642\u0629 \u0627\u0644\u0645\u062D\u062F\u062F\u0629 \u063A\u064A\u0631 \u0635\u0627\u0644\u062D\u0629.",
          invalidErrorItem: "\u0627\u0644\u062E\u0637\u0623 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F.",
          nextPageLinkAlreadyExists: "\u0647\u0630\u0647 \u0627\u0644\u0635\u0641\u062D\u0629 \u0641\u064A\u0647\u0627 \u0628\u0627\u0644\u0641\u0639\u0644 \u062E\u0637\u0623 \u0631\u0628\u0637 \u0645\u0639 \u0627\u0644\u0635\u0641\u062D\u0629 \u0627\u0644\u062A\u0627\u0644\u064A\u0629.",
          invalidReviewItem: "\u0628\u0637\u0627\u0642\u0629 \u0627\u0644\u062E\u0637\u0623 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F\u0629.",
          invalidReviewResult: "\u0646\u062A\u064A\u062C\u0629 \u0627\u0644\u0645\u0631\u0627\u062C\u0639\u0629 \u063A\u064A\u0631 \u0635\u0627\u0644\u062D\u0629."
        }
      };
      var stateRepository = resolveDefaultStateRepository();
      function generateRandomId() {
        if (typeof globalThis !== "undefined" && globalThis.crypto && typeof globalThis.crypto.randomUUID === "function") {
          return globalThis.crypto.randomUUID();
        }
        return `dabt-${Date.now()}-${Math.random().toString(16).slice(2)}`;
      }
      function getLanguage(settings = DEFAULT_SETTINGS) {
        if (settings?.language === "en") {
          return "en";
        }
        if (settings?.language === "ar") {
          return "ar";
        }
        return "fr";
      }
      function translate(settings, key, variables = {}) {
        const language = getLanguage(settings);
        const template = STORE_TEXT[language] && STORE_TEXT[language][key] || STORE_TEXT.fr[key] || key;
        return String(template).replace(/\{\{(\w+)\}\}/g, (_match, token) => String(variables[token] ?? ""));
      }
      function createDefaultState() {
        const settings = { ...DEFAULT_SETTINGS };
        const progress = normalizeProgress(DEFAULT_PROGRESS, settings);
        const signature = getDaySignature(settings, progress);
        return {
          settings,
          progress,
          dailyStatus: createEmptyDailyStatus(signature),
          notificationPreferences: normalizeNotificationPreferences(DEFAULT_NOTIFICATION_PREFERENCES),
          activityHistory: normalizeActivityHistory([]),
          pageErrors: {}
        };
      }
      function getStateRepository() {
        return stateRepository;
      }
      function setStateRepository(repository) {
        if (!repository || typeof repository.read !== "function" || typeof repository.write !== "function") {
          throw new Error("State repository invalide.");
        }
        stateRepository = repository;
      }
      function resetStateRepository() {
        stateRepository = resolveDefaultStateRepository();
      }
      function writeRawState(state) {
        getStateRepository().write(state);
      }
      function readRawState() {
        const rawState = getStateRepository().read();
        if (!rawState || typeof rawState !== "object") {
          const initial = createDefaultState();
          writeRawState(initial);
          return initial;
        }
        return rawState;
      }
      function normalizeState(rawState = {}) {
        const rawSettings = rawState.settings || DEFAULT_SETTINGS;
        const settings = normalizeSettings(rawSettings);
        const progress = normalizeProgress(rawState.progress || DEFAULT_PROGRESS, settings, {
          legacyScale: isLegacyProgressScale(rawSettings)
        });
        const signature = getDaySignature(settings, progress);
        const dailyStatus = normalizeDailyStatus(rawState.dailyStatus || {}, signature);
        const notificationPreferences = normalizeNotificationPreferences(rawState.notificationPreferences || DEFAULT_NOTIFICATION_PREFERENCES);
        const activityHistory = normalizeActivityHistory(rawState.activityHistory || []);
        const pageErrors = normalizePageErrors(rawState.pageErrors || {}, settings);
        if (dailyStatus.signature !== signature) {
          return {
            settings,
            progress,
            dailyStatus: createEmptyDailyStatus(signature),
            notificationPreferences,
            activityHistory,
            pageErrors
          };
        }
        return {
          settings,
          progress,
          dailyStatus,
          notificationPreferences,
          activityHistory,
          pageErrors
        };
      }
      function readState() {
        const state = normalizeState(readRawState());
        writeRawState(state);
        return state;
      }
      function buildResponse(state) {
        const errorTracking = buildErrorTracking(state.settings, state.pageErrors);
        const errorReview = buildErrorReview(state.pageErrors);
        return {
          settings: state.settings,
          progress: state.progress,
          dailyStatus: state.dailyStatus,
          preferences: {
            notifications: state.notificationPreferences
          },
          statistics: buildStatistics(state.activityHistory),
          pageErrors: state.pageErrors,
          errorTracking,
          errorReview,
          plan: buildTodayPlan(state)
        };
      }
      function getState() {
        return buildResponse(readState());
      }
      function saveConfig(input = {}) {
        const current = readState();
        const settings = normalizeSettings({
          ...current.settings,
          ...input.settings || {}
        });
        const progress = normalizeProgress(
          {
            ...current.progress,
            ...input.progress || {}
          },
          settings
        );
        const notificationPreferences = mergeNotificationPreferences(
          current.notificationPreferences,
          input.preferences?.notifications || {}
        );
        const signature = getDaySignature(settings, progress);
        const state = {
          settings,
          progress,
          dailyStatus: signature === current.dailyStatus.signature ? normalizeDailyStatus(current.dailyStatus || {}, signature) : createEmptyDailyStatus(signature),
          notificationPreferences,
          activityHistory: normalizeActivityHistory(current.activityHistory),
          pageErrors: normalizePageErrors(current.pageErrors, settings)
        };
        writeRawState(state);
        return buildResponse(state);
      }
      function updateState(mutator) {
        const current = readState();
        const next = mutator({
          settings: { ...current.settings },
          progress: {
            ...current.progress,
            phaseProgressHalfPages: Array.isArray(current.progress.phaseProgressHalfPages) ? [...current.progress.phaseProgressHalfPages] : []
          },
          dailyStatus: {
            signature: current.dailyStatus.signature,
            blocks: { ...current.dailyStatus.blocks },
            skipNew: Boolean(current.dailyStatus.skipNew),
            waves: current.dailyStatus.waves.map((wave) => [...wave])
          },
          notificationPreferences: normalizeNotificationPreferences(current.notificationPreferences),
          activityHistory: normalizeActivityHistory(current.activityHistory),
          pageErrors: JSON.parse(JSON.stringify(current.pageErrors))
        });
        const normalized = normalizeState(next);
        writeRawState(normalized);
        return buildResponse(normalized);
      }
      function normalizePageErrors(input = {}, settings = DEFAULT_SETTINGS) {
        const totalPages = Math.ceil(settings.totalHalfPages / 2);
        const normalized = {};
        if (!input || typeof input !== "object") {
          return normalized;
        }
        for (const [rawPage, rawSeverity] of Object.entries(input)) {
          const page = Number.parseInt(rawPage, 10);
          if (!Number.isInteger(page) || page < 1 || page > totalPages) {
            continue;
          }
          const entry = normalizePageEntry(rawSeverity, page);
          if (entry) {
            normalized[String(page)] = entry;
          }
        }
        return normalized;
      }
      function buildErrorTracking(settings, pageErrors = {}) {
        const summary = {
          minor: 0,
          medium: 0,
          grave: 0,
          pagesWithErrors: 0,
          learnedPages: 0
        };
        for (const entry of Object.values(pageErrors)) {
          if (!entry || typeof entry !== "object") {
            continue;
          }
          const totalErrors = ERROR_LEVEL_KEYS.reduce((count, key) => count + Number(entry.errors?.[key] || 0), 0);
          if (entry.learned) {
            summary.learnedPages += 1;
          }
          if (totalErrors > 0) {
            summary.pagesWithErrors += 1;
          }
          for (const key of ERROR_LEVEL_KEYS) {
            summary[key] += Number(entry.errors?.[key] || 0);
          }
        }
        return {
          totalPages: Math.ceil(settings.totalHalfPages / 2),
          summary
        };
      }
      function severityToScope(severity) {
        if (severity === "grave") {
          return "line";
        }
        if (severity === "medium") {
          return "word";
        }
        return "harakah";
      }
      function normalizeSelectionRect(rawRect) {
        if (!rawRect || typeof rawRect !== "object") {
          return null;
        }
        const x = Math.max(0, Math.min(1, Number(rawRect.x)));
        const y = Math.max(0, Math.min(1, Number(rawRect.y)));
        const width = Math.max(0, Math.min(1 - x, Number(rawRect.width)));
        const height = Math.max(0, Math.min(1 - y, Number(rawRect.height)));
        if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(width) || !Number.isFinite(height)) {
          return null;
        }
        if (width < 0.01 || height < 0.01) {
          return null;
        }
        return {
          x: Number(x.toFixed(4)),
          y: Number(y.toFixed(4)),
          width: Number(width.toFixed(4)),
          height: Number(height.toFixed(4))
        };
      }
      function normalizeSelectionAnchor(rawAnchor, scope = "") {
        if (!rawAnchor || typeof rawAnchor !== "object") {
          return null;
        }
        const kind = rawAnchor.kind === "line" ? "line" : rawAnchor.kind === "word" ? "word" : "";
        if (!kind) {
          return null;
        }
        if ((scope === "line" || scope === "next-page-link") && kind !== "line") {
          return null;
        }
        if (scope && scope !== "line" && scope !== "next-page-link" && kind !== "word") {
          return null;
        }
        const lineNumber = Number.parseInt(rawAnchor.lineNumber, 10);
        if (!Number.isInteger(lineNumber) || lineNumber < 1) {
          return null;
        }
        if (kind === "line") {
          return {
            kind,
            lineNumber
          };
        }
        const wordId = Number.parseInt(rawAnchor.wordId, 10);
        if (!Number.isInteger(wordId) || wordId < 1) {
          return null;
        }
        return {
          kind,
          lineNumber,
          wordId
        };
      }
      function toDate(value, fallback = /* @__PURE__ */ new Date()) {
        if (value instanceof Date && !Number.isNaN(value.getTime())) {
          return new Date(value.getTime());
        }
        const parsed = new Date(value || "");
        if (!Number.isNaN(parsed.getTime())) {
          return parsed;
        }
        return fallback instanceof Date && !Number.isNaN(fallback.getTime()) ? new Date(fallback.getTime()) : /* @__PURE__ */ new Date();
      }
      function toOptionalDate(value) {
        if (!value) {
          return void 0;
        }
        const parsed = new Date(value);
        return Number.isNaN(parsed.getTime()) ? void 0 : parsed;
      }
      function clampFsrsState(value) {
        const numeric = Number.parseInt(value, 10);
        if (numeric === State.Learning || numeric === State.Review || numeric === State.Relearning) {
          return numeric;
        }
        return State.New;
      }
      function clampDifficulty(value, fallback = 5) {
        const numeric = Number(value);
        if (!Number.isFinite(numeric)) {
          return fallback;
        }
        return Math.max(1, Math.min(10, numeric));
      }
      function normalizeFsrsDifficulty(value, stateValue, fallback = 5) {
        const safeState = clampFsrsState(stateValue);
        if (safeState === State.New) {
          return 0;
        }
        return clampDifficulty(value, Math.max(1, fallback));
      }
      function clampStability(value, fallback = 0) {
        const numeric = Number(value);
        if (!Number.isFinite(numeric)) {
          return fallback;
        }
        return Math.max(0, numeric);
      }
      function readStabilityOrFallback(value, fallback = 0) {
        const numeric = Number(value);
        if (!Number.isFinite(numeric) || numeric <= 0) {
          return clampStability(fallback, 0);
        }
        return clampStability(numeric, 0);
      }
      function toRoundedHours(fromDate, toDateValue) {
        const safeFrom = toDate(fromDate);
        const safeTo = toDate(toDateValue, safeFrom);
        return Math.max(0, Number(((safeTo.getTime() - safeFrom.getTime()) / HOUR_MS).toFixed(2)));
      }
      function difficultyToEaseFactor(difficulty) {
        const safeDifficulty = clampDifficulty(difficulty, 5);
        return Number(Math.max(1.3, Math.min(3.2, 3.25 - safeDifficulty * 0.17)).toFixed(2));
      }
      function getSchedulableStability(stateValue, dueDate, referenceDate, fallback = 0.2) {
        const safeState = clampFsrsState(stateValue);
        if (safeState === State.New) {
          return 0;
        }
        const safeDue = toDate(dueDate);
        const safeReference = toDate(referenceDate, safeDue);
        const dueGapDays = Math.max(0, (safeDue.getTime() - safeReference.getTime()) / DAY_MS);
        return Number(Math.max(0.1, dueGapDays || fallback).toFixed(4));
      }
      function serializeFsrsCard(card, fallbackDate = /* @__PURE__ */ new Date()) {
        const due = toDate(card?.due, fallbackDate);
        const lastReview = toOptionalDate(card?.last_review);
        const state = clampFsrsState(card?.state);
        return {
          due: due.toISOString(),
          stability: Number(clampStability(card?.stability).toFixed(4)),
          difficulty: Number(normalizeFsrsDifficulty(card?.difficulty, state).toFixed(4)),
          elapsed_days: Math.max(0, Number.parseInt(card?.elapsed_days, 10) || 0),
          scheduled_days: Math.max(0, Number.parseInt(card?.scheduled_days, 10) || 0),
          learning_steps: Math.max(0, Number.parseInt(card?.learning_steps, 10) || 0),
          reps: Math.max(0, Number.parseInt(card?.reps, 10) || 0),
          lapses: Math.max(0, Number.parseInt(card?.lapses, 10) || 0),
          state,
          last_review: lastReview ? lastReview.toISOString() : ""
        };
      }
      function buildLegacyFsrsCard(review, createdAt = (/* @__PURE__ */ new Date()).toISOString()) {
        const createdDate = toDate(createdAt);
        const dueDate = toDate(review?.dueAt, createdDate);
        const lastReviewDate = toOptionalDate(review?.lastReviewedAt);
        const successCount = Math.max(0, Number.parseInt(review?.successCount, 10) || 0);
        const failureCount = Math.max(0, Number.parseInt(review?.failureCount, 10) || 0);
        const totalReviews = Math.max(0, Number.parseInt(review?.repetitions, 10) || successCount + failureCount);
        const intervalHours = Math.max(
          0,
          Number(review?.intervalHours) || (lastReviewDate ? (dueDate.getTime() - lastReviewDate.getTime()) / HOUR_MS : 0)
        );
        const scheduledDays = Math.max(
          0,
          Number.parseInt(review?.fsrsCard?.scheduled_days, 10) || (intervalHours >= 24 ? Math.round(intervalHours / 24) : 0)
        );
        const totalAttempts = Math.max(1, successCount + failureCount);
        const failureRatio = failureCount / totalAttempts;
        let state = State.New;
        if (review?.lastResult === "failure") {
          state = State.Relearning;
        } else if (successCount > 0 || totalReviews > 0) {
          state = scheduledDays >= 1 || intervalHours >= 24 ? State.Review : State.Learning;
        }
        const baseCard = createEmptyCard(createdDate);
        return {
          ...baseCard,
          due: dueDate,
          stability: readStabilityOrFallback(
            review?.fsrsCard?.stability,
            scheduledDays > 0 ? scheduledDays : successCount > 0 ? Math.max(0.4, intervalHours / 24 || 0.5) : getSchedulableStability(state, dueDate, lastReviewDate || createdDate, 0.2)
          ),
          difficulty: normalizeFsrsDifficulty(review?.fsrsCard?.difficulty, state, 4.6 + failureRatio * 3.4),
          elapsed_days: Math.max(0, lastReviewDate ? Math.round((createdDate.getTime() - lastReviewDate.getTime()) / DAY_MS) : 0),
          scheduled_days: scheduledDays,
          learning_steps: Math.max(0, Number.parseInt(review?.fsrsCard?.learning_steps, 10) || 0),
          reps: totalReviews,
          lapses: failureCount,
          state,
          last_review: lastReviewDate
        };
      }
      function deserializeFsrsCard(rawCard, createdAt = (/* @__PURE__ */ new Date()).toISOString(), legacyReview = null) {
        if (!rawCard || typeof rawCard !== "object") {
          return buildLegacyFsrsCard(legacyReview, createdAt);
        }
        const createdDate = toDate(createdAt);
        const dueDate = toDate(rawCard.due, createdDate);
        const lastReviewDate = toOptionalDate(rawCard.last_review);
        const referenceDate = lastReviewDate || createdDate;
        const dueGapHours = Math.max(0, (dueDate.getTime() - referenceDate.getTime()) / HOUR_MS);
        const explicitScheduledDays = Math.max(0, Number.parseInt(rawCard.scheduled_days, 10) || 0);
        const normalizedScheduledDays = dueGapHours >= 24 ? explicitScheduledDays || Math.round(dueGapHours / 24) : 0;
        const explicitState = clampFsrsState(rawCard.state);
        const normalizedState = dueGapHours < 24 && explicitState === State.Review ? State.Learning : explicitState;
        const baseCard = createEmptyCard(createdDate);
        const normalizedStability = clampStability(
          readStabilityOrFallback(
            rawCard.stability,
            getSchedulableStability(normalizedState, dueDate, referenceDate, dueGapHours >= 24 ? normalizedScheduledDays || 1 : 0.2)
          ),
          0
        );
        return {
          ...baseCard,
          due: dueDate,
          stability: normalizedStability,
          difficulty: normalizeFsrsDifficulty(rawCard.difficulty, normalizedState, 5),
          elapsed_days: Math.max(0, Number.parseInt(rawCard.elapsed_days, 10) || 0),
          scheduled_days: normalizedScheduledDays,
          learning_steps: Math.max(0, Number.parseInt(rawCard.learning_steps, 10) || 0),
          reps: Math.max(0, Number.parseInt(rawCard.reps, 10) || 0),
          lapses: Math.max(0, Number.parseInt(rawCard.lapses, 10) || 0),
          state: normalizedState,
          last_review: lastReviewDate
        };
      }
      function buildPersistedReviewStateFromCard(card, meta = {}) {
        const createdDate = toDate(meta.createdAt || (/* @__PURE__ */ new Date()).toISOString());
        const serializedCard = serializeFsrsCard(card, createdDate);
        const lastReviewedAt = serializedCard.last_review || "";
        const referenceDate = lastReviewedAt ? toDate(lastReviewedAt, createdDate) : createdDate;
        const dueAt = serializedCard.due;
        const intervalHours = toRoundedHours(referenceDate, dueAt);
        const successCount = Math.max(0, Number.parseInt(meta.successCount, 10) || 0);
        const failureCount = Math.max(0, Number.parseInt(meta.failureCount, 10) || 0);
        const lastResult = ["new", "success", "failure"].includes(meta.lastResult) ? meta.lastResult : "new";
        return {
          repetitions: serializedCard.reps,
          easeFactor: difficultyToEaseFactor(serializedCard.difficulty),
          intervalHours,
          dueAt,
          lastReviewedAt,
          lastResult,
          successCount,
          failureCount,
          fsrsCard: serializedCard
        };
      }
      function createInitialReviewState(createdAt = (/* @__PURE__ */ new Date()).toISOString()) {
        return buildPersistedReviewStateFromCard(createEmptyCard(toDate(createdAt)), {
          createdAt,
          lastResult: "new",
          successCount: 0,
          failureCount: 0
        });
      }
      function normalizeReviewState(rawReview, createdAt = (/* @__PURE__ */ new Date()).toISOString()) {
        const review = rawReview && typeof rawReview === "object" ? rawReview : {};
        const successCount = Math.max(0, Number.parseInt(review.successCount, 10) || 0);
        const failureCount = Math.max(0, Number.parseInt(review.failureCount, 10) || 0);
        const lastResult = ["new", "success", "failure"].includes(review.lastResult) ? review.lastResult : "new";
        const fsrsCard = deserializeFsrsCard(review.fsrsCard, createdAt, review);
        return buildPersistedReviewStateFromCard(fsrsCard, {
          createdAt,
          lastResult,
          successCount,
          failureCount
        });
      }
      function buildNextReviewState(review, isCorrect, createdAt = (/* @__PURE__ */ new Date()).toISOString()) {
        const now = /* @__PURE__ */ new Date();
        const current = normalizeReviewState(review, createdAt);
        const currentCard = deserializeFsrsCard(current.fsrsCard, createdAt, current);
        const rating = isCorrect ? Rating.Good : Rating.Again;
        const result = ERROR_REVIEW_SCHEDULER.next(currentCard, now, rating);
        return buildPersistedReviewStateFromCard(result.card, {
          createdAt,
          lastResult: isCorrect ? "success" : "failure",
          successCount: current.successCount + (isCorrect ? 1 : 0),
          failureCount: current.failureCount + (isCorrect ? 0 : 1)
        });
      }
      function compareReviewItems(left, right) {
        const leftDue = Date.parse(left.review?.dueAt || left.createdAt || 0) || 0;
        const rightDue = Date.parse(right.review?.dueAt || right.createdAt || 0) || 0;
        if (leftDue !== rightDue) {
          return leftDue - rightDue;
        }
        const leftUpdated = Date.parse(left.review?.lastReviewedAt || left.createdAt || 0) || 0;
        const rightUpdated = Date.parse(right.review?.lastReviewedAt || right.createdAt || 0) || 0;
        if (leftUpdated !== rightUpdated) {
          return leftUpdated - rightUpdated;
        }
        return Number(left.page || 0) - Number(right.page || 0);
      }
      function buildErrorReview(pageErrors = {}) {
        const now = Date.now();
        const items = Object.entries(pageErrors).flatMap(([pageNumber, rawEntry]) => {
          const entry = normalizePageEntry(rawEntry, Number(pageNumber));
          return entry.events.filter((event) => event.rect || event.scope === "next-page-link").map((event) => ({
            id: event.id,
            page: Number(pageNumber),
            severity: event.severity,
            scope: event.scope,
            note: event.note,
            rect: event.rect,
            anchor: event.anchor,
            createdAt: event.createdAt,
            review: event.review
          }));
        });
        const sortedItems = items.sort(compareReviewItems);
        const dueItems = sortedItems.filter((item) => (Date.parse(item.review?.dueAt || item.createdAt || 0) || 0) <= now);
        const upcomingItems = sortedItems.filter((item) => !dueItems.some((dueItem) => dueItem.id === item.id));
        const nextDueAt = upcomingItems[0]?.review?.dueAt || "";
        const masteredCount = sortedItems.filter((item) => {
          const review = normalizeReviewState(item.review, item.createdAt);
          return review.successCount >= 3 && review.intervalHours >= 72;
        }).length;
        return {
          dueItems,
          upcomingItems,
          summary: {
            totalItems: sortedItems.length,
            dueCount: dueItems.length,
            upcomingCount: upcomingItems.length,
            masteredCount,
            nextDueAt
          }
        };
      }
      function createEmptyPageEntry() {
        return {
          learned: false,
          errors: {
            minor: 0,
            medium: 0,
            grave: 0
          },
          events: []
        };
      }
      function normalizePageNote(value) {
        return String(value || "").replace(/\s+/g, " ").trim().slice(0, 280);
      }
      function normalizePageEvent(rawEvent, pageNumber, index = 0) {
        if (!rawEvent || typeof rawEvent !== "object") {
          return null;
        }
        const severity = PAGE_ERROR_LEVELS.has(rawEvent.severity) ? rawEvent.severity : null;
        if (!severity) {
          return null;
        }
        const createdAt = typeof rawEvent.createdAt === "string" && rawEvent.createdAt.trim() ? rawEvent.createdAt.trim() : (/* @__PURE__ */ new Date()).toISOString();
        const scope = ERROR_SCOPE_KEYS.includes(rawEvent.scope) ? rawEvent.scope : severityToScope(severity);
        const rect = normalizeSelectionRect(rawEvent.rect);
        const anchor = normalizeSelectionAnchor(rawEvent.anchor, scope);
        const legacyToken = String(rawEvent.note || "").slice(0, 24).replace(/[^a-z0-9]+/gi, "-").toLowerCase() || "event";
        const id = typeof rawEvent.id === "string" && rawEvent.id.trim() ? rawEvent.id.trim() : `legacy-${pageNumber}-${severity}-${createdAt}-${index}-${legacyToken}`;
        return {
          id,
          severity,
          scope,
          rect,
          anchor,
          note: normalizePageNote(rawEvent.note),
          createdAt,
          review: normalizeReviewState(rawEvent.review, createdAt)
        };
      }
      function normalizePageEntry(rawEntry, pageNumber = 0) {
        const entry = createEmptyPageEntry();
        if (typeof rawEntry === "string") {
          if (!PAGE_ERROR_LEVELS.has(rawEntry)) {
            return null;
          }
          entry.errors[rawEntry] = 1;
          return entry;
        }
        if (!rawEntry || typeof rawEntry !== "object") {
          return null;
        }
        entry.learned = false;
        if (typeof rawEntry.severity === "string" && PAGE_ERROR_LEVELS.has(rawEntry.severity)) {
          entry.errors[rawEntry.severity] = Math.max(1, Number.parseInt(rawEntry.count, 10) || 1);
        }
        if (rawEntry.errors && typeof rawEntry.errors === "object") {
          for (const key of ERROR_LEVEL_KEYS) {
            const count = Number.parseInt(rawEntry.errors[key], 10);
            entry.errors[key] = Number.isInteger(count) && count > 0 ? count : 0;
          }
        }
        if (Array.isArray(rawEntry.events)) {
          entry.events = rawEntry.events.map((event, index) => normalizePageEvent(event, pageNumber, index)).filter(Boolean).slice(0, MAX_PAGE_EVENTS);
        }
        return hasPageEntryContent(entry) ? entry : null;
      }
      function hasPageEntryContent(entry) {
        if (!entry || typeof entry !== "object") {
          return false;
        }
        if (ERROR_LEVEL_KEYS.some((key) => Number(entry.errors?.[key] || 0) > 0)) {
          return true;
        }
        return Array.isArray(entry.events) && entry.events.length > 0;
      }
      function ensurePageEntry(state, pageNumber) {
        const key = String(pageNumber);
        const existing = normalizePageEntry(state.pageErrors[key], pageNumber);
        if (existing) {
          state.pageErrors[key] = existing;
          return existing;
        }
        const created = createEmptyPageEntry();
        state.pageErrors[key] = created;
        return created;
      }
      function prunePageEntry(state, pageNumber) {
        const key = String(pageNumber);
        const entry = normalizePageEntry(state.pageErrors[key], pageNumber);
        if (!entry) {
          delete state.pageErrors[key];
          return;
        }
        if (hasPageEntryContent(entry)) {
          state.pageErrors[key] = entry;
          return;
        }
        delete state.pageErrors[key];
      }
      function normalizePageList(rawPages, settings = DEFAULT_SETTINGS) {
        const totalPages = Math.ceil(settings.totalHalfPages / 2);
        const values = Array.isArray(rawPages) ? rawPages : [rawPages];
        const pages = values.map((value) => Number.parseInt(value, 10)).filter((value) => Number.isInteger(value));
        if (!pages.length) {
          throw new Error(translate(settings, "noValidPages"));
        }
        const uniquePages = [...new Set(pages)].sort((left, right) => left - right);
        for (const pageNumber of uniquePages) {
          if (pageNumber < 1 || pageNumber > totalPages) {
            throw new Error(translate(settings, "invalidPageNumber"));
          }
        }
        return uniquePages;
      }
      function markDayCompletion(state, plan = buildTodayPlan(state)) {
        if (!plan?.dayClosed) {
          return;
        }
        state.activityHistory = recordDayCompletion(state.activityHistory, {
          completedAt: (/* @__PURE__ */ new Date()).toISOString(),
          skippedNew: Boolean(plan.skippedMemorizationDay),
          programDayIndex: state.progress.programDayIndex,
          phaseIndex: state.progress.phaseIndex
        });
      }
      function toggleBlock(blockKey) {
        return updateState((state) => {
          if (!Object.prototype.hasOwnProperty.call(state.dailyStatus.blocks, blockKey)) {
            throw new Error(translate(state.settings, "invalidBlock"));
          }
          const plan = buildTodayPlan(state);
          const order = plan.order || ["old", "consolidation", "recent", "yesterday", "new"];
          const block = plan.blocks[blockKey];
          if (!block || !block.present) {
            throw new Error(translate(state.settings, "blockUnavailable"));
          }
          const isMarkingDone = !state.dailyStatus.blocks[blockKey];
          if (isMarkingDone) {
            if (block.blockedByLabels && block.blockedByLabels.length) {
              throw new Error(translate(state.settings, "validateFirst", { items: block.blockedByLabels.join(", ") }));
            }
            state.dailyStatus.blocks[blockKey] = true;
            markDayCompletion(state);
            return state;
          }
          state.dailyStatus.blocks[blockKey] = false;
          const blockIndex = order.indexOf(blockKey);
          for (const laterKey of order.slice(blockIndex + 1)) {
            if (Object.prototype.hasOwnProperty.call(state.dailyStatus.blocks, laterKey)) {
              state.dailyStatus.blocks[laterKey] = false;
            }
          }
          state.dailyStatus.waves = state.dailyStatus.waves.map((wave) => wave.map(() => false));
          return state;
        });
      }
      function toggleWaveSlot(waveIndex, slotIndex) {
        return updateState((state) => {
          if (!state.dailyStatus.waves[waveIndex] || typeof state.dailyStatus.waves[waveIndex][slotIndex] !== "boolean") {
            throw new Error(translate(state.settings, "invalidWave"));
          }
          const isMarkingDone = !state.dailyStatus.waves[waveIndex][slotIndex];
          if (isMarkingDone) {
            const plan = buildTodayPlan(state);
            const newBlock = plan.blocks.new;
            if (!newBlock.present) {
              throw new Error(translate(state.settings, "newUnavailable"));
            }
            if (newBlock.blockedByLabels && newBlock.blockedByLabels.length) {
              throw new Error(translate(state.settings, "validateFirst", { items: newBlock.blockedByLabels.join(", ") }));
            }
          }
          state.dailyStatus.skipNew = false;
          state.dailyStatus.waves[waveIndex][slotIndex] = !state.dailyStatus.waves[waveIndex][slotIndex];
          markDayCompletion(state);
          return state;
        });
      }
      function resetToday() {
        return updateState((state) => {
          state.dailyStatus = createEmptyDailyStatus(getDaySignature(state.settings, state.progress));
          return state;
        });
      }
      function advanceDay() {
        return updateState((state) => {
          const plan = buildTodayPlan(state);
          if (!plan.canAdvanceDay) {
            throw new Error(translate(state.settings, "dayNotComplete"));
          }
          markDayCompletion(state, plan);
          state.progress.currentHalfPage = plan.nextProgress.currentHalfPage;
          state.progress.programDayIndex = plan.nextProgress.programDayIndex;
          state.progress.phaseIndex = plan.nextProgress.phaseIndex;
          state.progress.phaseProgressHalfPages = Array.isArray(plan.nextProgress.phaseProgressHalfPages) ? [...plan.nextProgress.phaseProgressHalfPages] : [];
          state.dailyStatus = createEmptyDailyStatus(getDaySignature(state.settings, state.progress));
          return state;
        });
      }
      function skipMemorizationDay() {
        return updateState((state) => {
          const plan = buildTodayPlan(state);
          if (!plan.canSkipMemorizationDay) {
            throw new Error(translate(state.settings, "skipMemorizationUnavailable"));
          }
          state.dailyStatus.skipNew = true;
          markDayCompletion(state);
          return state;
        });
      }
      function setPageError(pages, severityOrOptions, note = "") {
        return updateState((state) => {
          const options = severityOrOptions && typeof severityOrOptions === "object" ? {
            severity: typeof severityOrOptions.severity === "string" ? severityOrOptions.severity : "",
            scope: typeof severityOrOptions.scope === "string" ? severityOrOptions.scope : "",
            rect: severityOrOptions.rect,
            anchor: severityOrOptions.anchor,
            note: severityOrOptions.note
          } : {
            severity: String(severityOrOptions || ""),
            scope: "",
            rect: null,
            anchor: null,
            note
          };
          const scope = ERROR_SCOPE_KEYS.includes(options.scope) ? options.scope : "";
          const severity = PAGE_ERROR_LEVELS.has(options.severity) ? options.severity : scope ? ERROR_SCOPE_TO_SEVERITY[scope] : "";
          if (scope && !severity) {
            throw new Error(translate(state.settings, "invalidErrorScope"));
          }
          if (!severity) {
            throw new Error(translate(state.settings, "invalidErrorType"));
          }
          const requiresSelection = scope !== "next-page-link";
          const rect = requiresSelection && options.rect !== null && typeof options.rect !== "undefined" ? normalizeSelectionRect(options.rect) : null;
          const anchor = requiresSelection && options.anchor !== null && typeof options.anchor !== "undefined" ? normalizeSelectionAnchor(options.anchor, scope) : null;
          if ((scope || options.rect) && requiresSelection && !rect) {
            throw new Error(translate(state.settings, "invalidSelectionRect"));
          }
          const normalizedNote = normalizePageNote(typeof options.note === "string" ? options.note : note);
          for (const pageNumber of normalizePageList(pages, state.settings)) {
            const entry = ensurePageEntry(state, pageNumber);
            if (scope === "next-page-link" && Array.isArray(entry.events) && entry.events.some((event) => event.scope === "next-page-link")) {
              throw new Error(translate(state.settings, "nextPageLinkAlreadyExists"));
            }
            const createdAt = (/* @__PURE__ */ new Date()).toISOString();
            entry.errors[severity] += 1;
            entry.events = [
              {
                id: generateRandomId(),
                severity,
                scope: scope || severityToScope(severity),
                rect,
                anchor,
                note: normalizedNote,
                createdAt,
                review: createInitialReviewState(createdAt)
              },
              ...Array.isArray(entry.events) ? entry.events : []
            ].slice(0, MAX_PAGE_EVENTS);
          }
          return state;
        });
      }
      function answerErrorReview(itemId, result) {
        return updateState((state) => {
          const safeItemId = String(itemId || "").trim();
          const normalizedResult = result === "success" || result === "failure" ? result : "";
          if (!safeItemId) {
            throw new Error(translate(state.settings, "invalidReviewItem"));
          }
          if (!normalizedResult) {
            throw new Error(translate(state.settings, "invalidReviewResult"));
          }
          let found = false;
          for (const [pageKey, rawEntry] of Object.entries(state.pageErrors)) {
            const pageNumber = Number.parseInt(pageKey, 10);
            const entry = normalizePageEntry(rawEntry, pageNumber);
            const nextEvents = entry.events.map((event) => {
              if (event.id !== safeItemId) {
                return event;
              }
              found = true;
              return {
                ...event,
                review: buildNextReviewState(event.review, normalizedResult === "success", event.createdAt)
              };
            });
            if (found) {
              state.pageErrors[pageKey] = {
                ...entry,
                events: nextEvents
              };
              break;
            }
          }
          if (!found) {
            throw new Error(translate(state.settings, "invalidReviewItem"));
          }
          return state;
        });
      }
      function clearPageError(pages) {
        return updateState((state) => {
          for (const pageNumber of normalizePageList(pages, state.settings)) {
            const entry = ensurePageEntry(state, pageNumber);
            for (const key of ERROR_LEVEL_KEYS) {
              entry.errors[key] = 0;
            }
            entry.events = [];
            prunePageEntry(state, pageNumber);
          }
          return state;
        });
      }
      function removePageErrorItem(pages, itemId) {
        return updateState((state) => {
          const safeItemId = String(itemId || "").trim();
          if (!safeItemId) {
            throw new Error(translate(state.settings, "invalidErrorItem"));
          }
          let removed = false;
          for (const pageNumber of normalizePageList(pages, state.settings)) {
            const key = String(pageNumber);
            const entry = normalizePageEntry(state.pageErrors[key], pageNumber);
            if (!entry) {
              continue;
            }
            const eventToRemove = entry.events.find((event) => event.id === safeItemId);
            if (!eventToRemove) {
              continue;
            }
            entry.events = entry.events.filter((event) => event.id !== safeItemId);
            if (PAGE_ERROR_LEVELS.has(eventToRemove.severity)) {
              entry.errors[eventToRemove.severity] = Math.max(0, Number(entry.errors[eventToRemove.severity] || 0) - 1);
            }
            state.pageErrors[key] = entry;
            prunePageEntry(state, pageNumber);
            removed = true;
            break;
          }
          if (!removed) {
            throw new Error(translate(state.settings, "invalidErrorItem"));
          }
          return state;
        });
      }
      function setPageLearned(pages, learned) {
        return updateState((state) => {
          for (const pageNumber of normalizePageList(pages, state.settings)) {
            const entry = ensurePageEntry(state, pageNumber);
            entry.learned = Boolean(learned);
            prunePageEntry(state, pageNumber);
          }
          return state;
        });
      }
      module.exports = {
        answerErrorReview,
        advanceDay,
        clearPageError,
        createMemoryStateRepository,
        getState,
        getStateRepository,
        removePageErrorItem,
        resetStateRepository,
        resetToday,
        saveConfig,
        setPageError,
        setPageLearned,
        setStateRepository,
        skipMemorizationDay,
        toggleBlock,
        toggleWaveSlot
      };
    }
  });

  // src/platform/api-dispatcher.js
  var require_api_dispatcher = __commonJS({
    "src/platform/api-dispatcher.js"(exports, module) {
      var store = require_store();
      async function dispatchApiRequest2(request = {}) {
        const method = String(request.method || "GET").toUpperCase();
        const pathname = String(request.pathname || request.path || "").trim();
        const body = request.body && typeof request.body === "object" ? request.body : {};
        if (!pathname.startsWith("/api/")) {
          return { handled: false };
        }
        if (method === "GET" && pathname === "/api/state") {
          return { handled: true, payload: store.getState() };
        }
        if (method === "POST" && pathname === "/api/config") {
          return { handled: true, payload: store.saveConfig(body) };
        }
        if (method === "POST" && pathname === "/api/toggle-block") {
          return { handled: true, payload: store.toggleBlock(String(body.blockKey || "")) };
        }
        if (method === "POST" && pathname === "/api/toggle-wave-slot") {
          return {
            handled: true,
            payload: store.toggleWaveSlot(Number(body.waveIndex), Number(body.slotIndex))
          };
        }
        if (method === "POST" && pathname === "/api/page-errors") {
          return {
            handled: true,
            payload: store.setPageError(body.pages || body.page, {
              severity: String(body.severity || ""),
              scope: String(body.scope || ""),
              rect: body.rect || null,
              anchor: body.anchor || null,
              note: body.note || ""
            })
          };
        }
        if (method === "POST" && pathname === "/api/page-errors/clear") {
          return {
            handled: true,
            payload: store.clearPageError(body.pages || body.page)
          };
        }
        if (method === "POST" && pathname === "/api/page-errors/delete") {
          return {
            handled: true,
            payload: store.removePageErrorItem(body.pages || body.page, body.id)
          };
        }
        if (method === "POST" && pathname === "/api/page-learning") {
          return {
            handled: true,
            payload: store.setPageLearned(body.pages || body.page, Boolean(body.learned))
          };
        }
        if (method === "POST" && pathname === "/api/reset-today") {
          return { handled: true, payload: store.resetToday() };
        }
        if (method === "POST" && pathname === "/api/advance-day") {
          return { handled: true, payload: store.advanceDay() };
        }
        if (method === "POST" && pathname === "/api/skip-memorization-day") {
          return { handled: true, payload: store.skipMemorizationDay() };
        }
        if (method === "POST" && pathname === "/api/error-review/answer") {
          return {
            handled: true,
            payload: store.answerErrorReview(body.id, String(body.result || ""))
          };
        }
        return { handled: false };
      }
      module.exports = {
        dispatchApiRequest: dispatchApiRequest2
      };
    }
  });

  // src/platform/browser-local-api-entry.js
  var { LocalNotifications } = require_plugin_cjs();
  var { dispatchApiRequest } = require_api_dispatcher();
  var NOTIFICATION_CHANNEL_ID = "dabt-daily-reminders";
  var NOTIFICATION_IDS = Object.freeze({
    review: 41001,
    newMorning: 41002,
    newNoon: 41003,
    newEvening: 41004
  });
  function isNativeCapacitorRuntime() {
    try {
      return Boolean(window.Capacitor?.isNativePlatform?.());
    } catch (_error) {
      return false;
    }
  }
  function canUseNativeNotifications() {
    return isNativeCapacitorRuntime() && LocalNotifications && typeof LocalNotifications.schedule === "function";
  }
  function parseTimeString(value, fallback = "09:00") {
    const match = String(value || fallback).trim().match(/^(\d{1,2}):(\d{2})$/);
    if (!match) {
      return parseTimeString(fallback, "09:00");
    }
    const hour = Number.parseInt(match[1], 10);
    const minute = Number.parseInt(match[2], 10);
    if (!Number.isInteger(hour) || !Number.isInteger(minute) || hour < 0 || hour > 23 || minute < 0 || minute > 59) {
      return parseTimeString(fallback, "09:00");
    }
    return {
      hour,
      minute
    };
  }
  function normalizeReminder(input = {}) {
    if (!input || typeof input !== "object") {
      return null;
    }
    const key = typeof input.key === "string" ? input.key.trim() : "";
    const id = NOTIFICATION_IDS[key];
    if (!id) {
      return null;
    }
    const title = String(input.title || "").trim();
    const body = String(input.body || "").trim();
    if (!title || !body) {
      return null;
    }
    const { hour, minute } = parseTimeString(input.time, "09:00");
    return {
      id,
      key,
      title,
      body,
      hour,
      minute,
      enabled: Boolean(input.enabled)
    };
  }
  async function ensureNotificationChannel() {
    if (!canUseNativeNotifications()) {
      return;
    }
    try {
      await LocalNotifications.createChannel({
        id: NOTIFICATION_CHANNEL_ID,
        name: "Rappels Dabt",
        description: "Rappels quotidiens pour la revision et le nouveau",
        importance: 5,
        visibility: 1
      });
    } catch (_error) {
    }
  }
  async function cancelManagedNotifications() {
    if (!canUseNativeNotifications()) {
      return;
    }
    await LocalNotifications.cancel({
      notifications: Object.values(NOTIFICATION_IDS).map((id) => ({ id }))
    }).catch(() => void 0);
  }
  async function getNotificationStatus() {
    if (!canUseNativeNotifications()) {
      return {
        supported: false,
        native: false,
        display: "prompt",
        exactAlarm: "prompt",
        pendingCount: 0
      };
    }
    let display = "prompt";
    let exactAlarm = "prompt";
    let pendingCount = 0;
    try {
      display = (await LocalNotifications.checkPermissions()).display || "prompt";
    } catch (_error) {
      display = "prompt";
    }
    try {
      exactAlarm = (await LocalNotifications.checkExactNotificationSetting()).exact_alarm || "prompt";
    } catch (_error) {
      exactAlarm = "prompt";
    }
    try {
      const pending = await LocalNotifications.getPending();
      pendingCount = (pending.notifications || []).filter(
        (notification) => Object.values(NOTIFICATION_IDS).includes(Number(notification.id))
      ).length;
    } catch (_error) {
      pendingCount = 0;
    }
    return {
      supported: true,
      native: true,
      display,
      exactAlarm,
      pendingCount
    };
  }
  async function syncNotifications(config = {}) {
    const baseStatus = await getNotificationStatus();
    if (!baseStatus.native) {
      return {
        ...baseStatus,
        synced: false,
        scheduledCount: 0,
        reason: "unsupported"
      };
    }
    const reminders = Array.isArray(config.reminders) ? config.reminders.map(normalizeReminder).filter(Boolean) : [];
    let display = baseStatus.display;
    if (config.requestPermission !== false && display !== "granted" && Boolean(config.enabled)) {
      try {
        display = (await LocalNotifications.requestPermissions()).display || display;
      } catch (_error) {
        display = "denied";
      }
    }
    await cancelManagedNotifications();
    if (!config.enabled) {
      return {
        ...await getNotificationStatus(),
        synced: false,
        scheduledCount: 0,
        reason: "disabled"
      };
    }
    if (display !== "granted") {
      return {
        ...await getNotificationStatus(),
        display,
        synced: false,
        scheduledCount: 0,
        reason: "permission-denied"
      };
    }
    const activeReminders = reminders.filter((reminder) => reminder.enabled);
    if (!activeReminders.length) {
      return {
        ...await getNotificationStatus(),
        display,
        synced: false,
        scheduledCount: 0,
        reason: "empty"
      };
    }
    await ensureNotificationChannel();
    await LocalNotifications.schedule({
      notifications: activeReminders.map((reminder) => ({
        id: reminder.id,
        title: reminder.title,
        body: reminder.body,
        channelId: NOTIFICATION_CHANNEL_ID,
        schedule: {
          on: {
            hour: reminder.hour,
            minute: reminder.minute
          },
          repeats: true,
          allowWhileIdle: true
        },
        extra: {
          reminderKey: reminder.key
        }
      }))
    });
    return {
      ...await getNotificationStatus(),
      display,
      synced: true,
      scheduledCount: activeReminders.length,
      reason: "scheduled"
    };
  }
  window.dabtBrowserLocalApi = {
    platform: "browser-local",
    async request(path, options = {}) {
      const result = await dispatchApiRequest({
        pathname: path,
        method: options.method || "GET",
        body: options.body || {}
      });
      if (!result.handled) {
        throw new Error("Route API introuvable.");
      }
      return result.payload;
    },
    notifications: {
      getStatus: getNotificationStatus,
      sync: syncNotifications
    }
  };
})();
/*! Bundled license information:

@capacitor/core/dist/index.cjs.js:
  (*! Capacitor: https://capacitorjs.com/ - MIT License *)

ts-fsrs/dist/index.cjs:
  (* istanbul ignore next -- @preserve *)
*/
