webpackJsonp([1],[
/* 0 */
/***/ (function(module, exports) {

module.exports = jQuery;

/***/ }),
/* 1 */
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_FACTORY__, __WEBPACK_AMD_DEFINE_RESULT__;var _extends = Object.assign || function (e) {for (var t = 1; t < arguments.length; t++) {var n = arguments[t];for (var r in n) Object.prototype.hasOwnProperty.call(n, r) && (e[r] = n[r]);}return e;},_typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (e) {return typeof e;} : function (e) {return e && "function" == typeof Symbol && e.constructor === Symbol && e !== Symbol.prototype ? "symbol" : typeof e;};!function (e, t) {"object" === ( false ? "undefined" : _typeof(exports)) && "undefined" != typeof module ? module.exports = t() :  true ? !(__WEBPACK_AMD_DEFINE_FACTORY__ = (t),
				__WEBPACK_AMD_DEFINE_RESULT__ = (typeof __WEBPACK_AMD_DEFINE_FACTORY__ === 'function' ?
				(__WEBPACK_AMD_DEFINE_FACTORY__.call(exports, __webpack_require__, exports, module)) :
				__WEBPACK_AMD_DEFINE_FACTORY__),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__)) : e.LazyLoad = t();}(this, function () {"use strict";var e = { elements_selector: "img", container: document, threshold: 300, data_src: "src", data_srcset: "srcset", class_loading: "loading", class_loaded: "loaded", class_error: "error", callback_load: null, callback_error: null, callback_set: null, callback_enter: null },t = function (e, t) {return e.getAttribute("data-" + t);},n = function (e, t, n) {return e.setAttribute("data-" + t, n);},r = function (e) {return e.filter(function (e) {return !t(e, "was-processed");});},s = function (e, t) {var n,r = new e(t);try {n = new CustomEvent("LazyLoad::Initialized", { detail: { instance: r } });} catch (e) {(n = document.createEvent("CustomEvent")).initCustomEvent("LazyLoad::Initialized", !1, !1, { instance: r });}window.dispatchEvent(n);},o = function (e, n) {var r = n.data_srcset,s = e.parentNode;if ("PICTURE" === s.tagName) for (var o, a = 0; o = s.children[a]; a += 1) if ("SOURCE" === o.tagName) {var i = t(o, r);i && o.setAttribute("srcset", i);}},a = function (e, n) {var r = n.data_src,s = n.data_srcset,a = e.tagName,i = t(e, r);if ("IMG" === a) {o(e, n);var c = t(e, s);return c && e.setAttribute("srcset", c), void (i && e.setAttribute("src", i));}"IFRAME" !== a ? i && (e.style.backgroundImage = 'url("' + i + '")') : i && e.setAttribute("src", i);},i = "classList" in document.createElement("p"),c = function (e, t) {i ? e.classList.add(t) : e.className += (e.className ? " " : "") + t;},l = function (e, t) {i ? e.classList.remove(t) : e.className = e.className.replace(new RegExp("(^|\\s+)" + t + "(\\s+|$)"), " ").replace(/^\s+/, "").replace(/\s+$/, "");},u = function (e, t) {e && e(t);},d = function (e, t, n) {e.removeEventListener("load", t), e.removeEventListener("error", n);},f = function (e, t) {var n = function n(s) {_(s, !0, t), d(e, n, r);},r = function r(s) {_(s, !1, t), d(e, n, r);};e.addEventListener("load", n), e.addEventListener("error", r);},_ = function (e, t, n) {var r = e.target;l(r, n.class_loading), c(r, t ? n.class_loaded : n.class_error), u(t ? n.callback_load : n.callback_error, r);},v = function (e, t) {u(t.callback_enter, e), ["IMG", "IFRAME"].indexOf(e.tagName) > -1 && (f(e, t), c(e, t.class_loading)), a(e, t), n(e, "was-processed", !0), u(t.callback_set, e);},m = function (t, n) {this._settings = _extends({}, e, t), this._setObserver(), this.update(n);};m.prototype = { _setObserver: function () {var e = this;if ("IntersectionObserver" in window) {var t = this._settings;this._observer = new IntersectionObserver(function (n) {n.forEach(function (n) {if (n.isIntersecting || n.intersectionRatio > 0) {var r = n.target;v(r, t), e._observer.unobserve(r);}}), e._elements = r(e._elements);}, { root: t.container === document ? null : t.container, rootMargin: t.threshold + "px" });}}, update: function (e) {var t = this,n = this._settings,s = e || n.container.querySelectorAll(n.elements_selector);this._elements = r(Array.prototype.slice.call(s)), this._observer ? this._elements.forEach(function (e) {t._observer.observe(e);}) : (this._elements.forEach(function (e) {v(e, n);}), this._elements = r(this._elements));}, destroy: function () {var e = this;this._observer && (r(this._elements).forEach(function (t) {e._observer.unobserve(t);}), this._observer = null), this._elements = null, this._settings = null;} };var b = window.lazyLoadOptions;return b && function (e, t) {if (t.length) for (var n, r = 0; n = t[r]; r += 1) s(e, n);else s(e, t);}(m, b), m;});

/***/ }),
/* 2 */,
/* 3 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function($) {var _app = _interopRequireDefault(__webpack_require__(4));

var _SocialSharing = _interopRequireDefault(__webpack_require__(5));
var _vanillaLazyload = _interopRequireDefault(__webpack_require__(1));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };} /* eslint no-unused-vars: 0 */

var wysiwygContent = document.querySelector('[data-wysiwyg]');
if (wysiwygContent) {
  __webpack_require__.e/* import() */(0).then(__webpack_require__.bind(null, 2)).then(function (wysiwyg) {
    new wysiwyg.default(wysiwygContent);
  });
}

$(function () {
  new _vanillaLazyload.default({
    elements_selector: '[data-lazy-load]' });


  new _SocialSharing.default();
});
/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(0)))

/***/ }),
/* 4 */
/***/ (function(module, exports) {

// removed by extract-text-webpack-plugin

/***/ }),
/* 5 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function($) {Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;function _classCallCheck(instance, Constructor) {if (!(instance instanceof Constructor)) {throw new TypeError("Cannot call a class as a function");}}var SELECTOR = '[data-social-sharing]';

var openNewWindow = function openNewWindow(event) {
  event.preventDefault();

  var target = event.currentTarget;
  var targetHref = target.getAttribute('href');

  window.open(targetHref, 'sharer', 'width=600,height=400,menubar=no,location=yes,resizable=yes,scrollbars=yes,status=no');
};var

SocialShare =
function SocialShare() {_classCallCheck(this, SocialShare);
  if (!document.querySelectorAll(SELECTOR)) {
    return false;
  }

  $(SELECTOR).on('click', openNewWindow);
};var _default =


SocialShare;exports.default = _default;
/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(0)))

/***/ })
],[3]);