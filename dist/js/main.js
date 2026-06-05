"use strict";

function _slicedToArray(r, e) { return _arrayWithHoles(r) || _iterableToArrayLimit(r, e) || _unsupportedIterableToArray(r, e) || _nonIterableRest(); }
function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _iterableToArrayLimit(r, l) { var t = null == r ? null : "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (null != t) { var e, n, i, u, a = [], f = !0, o = !1; try { if (i = (t = t.call(r)).next, 0 === l) { if (Object(t) !== t) return; f = !1; } else for (; !(f = (e = i.call(t)).done) && (a.push(e.value), a.length !== l); f = !0); } catch (r) { o = !0, n = r; } finally { try { if (!f && null != t["return"] && (u = t["return"](), Object(u) !== u)) return; } finally { if (o) throw n; } } return a; } }
function _arrayWithHoles(r) { if (Array.isArray(r)) return r; }
function _createForOfIteratorHelper(r, e) { var t = "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (!t) { if (Array.isArray(r) || (t = _unsupportedIterableToArray(r)) || e && r && "number" == typeof r.length) { t && (r = t); var _n = 0, F = function F() {}; return { s: F, n: function n() { return _n >= r.length ? { done: !0 } : { done: !1, value: r[_n++] }; }, e: function e(r) { throw r; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var o, a = !0, u = !1; return { s: function s() { t = t.call(r); }, n: function n() { var r = t.next(); return a = r.done, r; }, e: function e(r) { u = !0, o = r; }, f: function f() { try { a || null == t["return"] || t["return"](); } finally { if (u) throw o; } } }; }
function _unsupportedIterableToArray(r, a) { if (r) { if ("string" == typeof r) return _arrayLikeToArray(r, a); var t = {}.toString.call(r).slice(8, -1); return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0; } }
function _arrayLikeToArray(r, a) { (null == a || a > r.length) && (a = r.length); for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e]; return n; }
function ownKeys(e, r) { var t = Object.keys(e); if (Object.getOwnPropertySymbols) { var o = Object.getOwnPropertySymbols(e); r && (o = o.filter(function (r) { return Object.getOwnPropertyDescriptor(e, r).enumerable; })), t.push.apply(t, o); } return t; }
function _objectSpread(e) { for (var r = 1; r < arguments.length; r++) { var t = null != arguments[r] ? arguments[r] : {}; r % 2 ? ownKeys(Object(t), !0).forEach(function (r) { _defineProperty(e, r, t[r]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) { Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r)); }); } return e; }
function _defineProperty(e, r, t) { return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _classCallCheck(a, n) { if (!(a instanceof n)) throw new TypeError("Cannot call a class as a function"); }
function _defineProperties(e, r) { for (var t = 0; t < r.length; t++) { var o = r[t]; o.enumerable = o.enumerable || !1, o.configurable = !0, "value" in o && (o.writable = !0), Object.defineProperty(e, _toPropertyKey(o.key), o); } }
function _createClass(e, r, t) { return r && _defineProperties(e.prototype, r), t && _defineProperties(e, t), Object.defineProperty(e, "prototype", { writable: !1 }), e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
/**
 * TypeWriter — Sequential typing animation
 * Types text character-by-character into a target element.
 */
var TypeWriter = /*#__PURE__*/function () {
  function TypeWriter(element) {
    var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    _classCallCheck(this, TypeWriter);
    this.element = element;
    this.text = options.text || (element ? element.getAttribute('data-text') : '') || '';
    this.speed = options.speed || 50; // ms per character
    this.onComplete = options.onComplete || function () {};
    this.onStart = options.onStart || function () {};
    this.cursor = options.cursor !== false;
    this.index = 0;
    this.running = false;
  }
  return _createClass(TypeWriter, [{
    key: "start",
    value: function start() {
      var _this = this;
      var delay = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;
      setTimeout(function () {
        _this.running = true;
        _this.index = 0;
        _this.element.textContent = '';
        if (_this.onStart) _this.onStart();
        _this._type();
      }, delay);
    }
  }, {
    key: "_type",
    value: function _type() {
      var _this2 = this;
      if (!this.running || !this.element) return;
      if (this.index < this.text.length) {
        this.element.textContent += this.text.charAt(this.index);
        this.index++;
        // Vary speed slightly for natural feel
        var variance = this.text.charAt(this.index - 1) === ' ' ? 0 : Math.random() * 30;
        setTimeout(function () {
          return _this2._type();
        }, this.speed + variance);
      } else {
        this.running = false;
        if (this.cursor) {
          this.element.classList.add('done');
        }
        if (this.onComplete) this.onComplete();
      }
    }
  }, {
    key: "stop",
    value: function stop() {
      this.running = false;
    }
  }]);
}();
var neuralNetwork = null;
var GridAnimation = /*#__PURE__*/function () {
  function GridAnimation(canvas) {
    var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    _classCallCheck(this, GridAnimation);
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.options = _objectSpread({
      direction: options.direction || "right",
      speed: options.speed || 1,
      borderColor: options.borderColor || "rgba(255, 255, 255, 0.05)",
      squareSize: options.squareSize || 40,
      hoverFillColor: options.hoverFillColor || "rgba(255, 255, 255, 0.6)",
      hoverShadowColor: options.hoverShadowColor || "rgba(255, 255, 255, 0.3)",
      transitionDuration: options.transitionDuration || 200,
      // 过渡时间（毫秒）
      trailDuration: options.trailDuration || 1000,
      // 痕迹持续时间（毫秒）
      specialBlockColor: options.specialBlockColor || "rgba(255, 100, 100, 0.8)",
      specialHoverColor: options.specialHoverColor || "rgba(100, 255, 100, 0.8)",
      // 新增颜色渐变相关选项
      snakeHeadColor: options.snakeHeadColor || "rgba(255, 255, 255, 0.9)",
      snakeTailColor: options.snakeTailColor || "rgba(100, 100, 255, 0.3)",
      snakeGradientStops: options.snakeGradientStops || 5,
      // 渐变过渡的色块数
      snakeColorDecay: options.snakeColorDecay || 0.7,
      // 渐变衰减系数，越小衰减越快
      // 移动端触摸相关选项
      touchSensitivity: options.touchSensitivity || 1.0,
      // 触摸灵敏度
      vibrationEnabled: options.vibrationEnabled || false
    }, options);
    this.gridOffset = {
      x: 0,
      y: 0
    };
    this.hoveredSquare = null;
    this.animationFrame = null;
    this.currentOpacity = 0;
    this.targetOpacity = 0;
    this.lastTimestamp = 0;
    this.hoverRadius = 3;
    this.trailSquares = new Map(); // 存储痕迹格子的信息
    this.specialBlock = null;
    this.specialBlockTimer = null;
    this.isSpecialBlockHovered = false;
    this.snakeBody = []; // 存储蛇身的数组
    this.shouldGrow = false; // 控制蛇身是否增长
  }
  return _createClass(GridAnimation, [{
    key: "init",
    value: function init() {
      var _this3 = this;
      this.resizeCanvas();
      this.setupEventListeners();

      // 移动端性能优化
      if (isPhone) {
        this.optimizeForMobile();
      }
      this.animate();

      // 在移动设备上延迟创建食物，确保画布大小计算正确
      if (isPhone) {
        setTimeout(function () {
          _this3.createSpecialBlock();
        }, 500);
      } else {
        this.createSpecialBlock();
      }

      // 添加页面可见性变化监听，在页面不可见时暂停动画
      document.addEventListener(visibilityChangeEvent, this.handleVisibilityChange.bind(this));
    }
  }, {
    key: "optimizeForMobile",
    value: function optimizeForMobile() {
      // 检测设备性能, 默认高性能模式
      var canvas = this.canvas;
      var ctx = canvas.getContext("2d");

      // 简单的性能测试
      var startTime = performance.now();
      for (var i = 0; i < 1000; i++) {
        ctx.fillRect(0, 0, 1, 1);
      }
      var endTime = performance.now();
      var performanceScore = endTime - startTime;

      // 根据性能调整设置
      if (performanceScore > 10) {
        // 低性能设备
        this.options.squareSize = Math.max(this.options.squareSize * 1.5, 60);
        this.options.speed *= 0.7;
        this.options.trailDuration *= 0.5;
      } else if (performanceScore > 5) {
        // 中等性能设备
        this.options.squareSize = Math.max(this.options.squareSize * 1.2, 50);
        this.options.speed *= 0.8;
      }
    }
  }, {
    key: "resizeCanvas",
    value: function resizeCanvas() {
      // 处理设备像素比，确保在高DPR设备上（如iPhone）清晰渲染
      var dpr = window.devicePixelRatio || 1;
      var displayWidth = this.canvas.offsetWidth;
      var displayHeight = this.canvas.offsetHeight;

      // 设置画布大小为实际像素大小
      this.canvas.width = Math.floor(displayWidth * dpr);
      this.canvas.height = Math.floor(displayHeight * dpr);

      // 设置CSS尺寸为显示尺寸
      this.canvas.style.width = "".concat(displayWidth, "px");
      this.canvas.style.height = "".concat(displayHeight, "px");

      // 缩放上下文以匹配设备像素比
      this.ctx.scale(dpr, dpr);
    }
  }, {
    key: "setupEventListeners",
    value: function setupEventListeners() {
      var _this4 = this;
      window.addEventListener("resize", function () {
        return _this4.resizeCanvas();
      });
      this.canvas.addEventListener("mousemove", function (e) {
        return _this4.handleMouseMove(e);
      });
      this.canvas.addEventListener("mouseleave", function () {
        return _this4.handleMouseLeave();
      });

      // 移动端触摸事件处理
      if (isPhone) {
        this.setupTouchEvents();
      }

      // 监听设备方向变化，重新创建食物
      if (isPhone && window.orientation !== undefined) {
        window.addEventListener("orientationchange", function () {
          setTimeout(function () {
            _this4.resizeCanvas();
            _this4.createSpecialBlock();
          }, 300);
        });
      }
    }
  }, {
    key: "setupTouchEvents",
    value: function setupTouchEvents() {
      var _this5 = this;
      var touchStartPos = null;
      var touchMovePos = null;
      var isTouching = false;
      var lastTouchTime = 0;
      var touchCount = 0;

      // 保存事件处理函数引用以便后续移除
      this.handleTouchStart = function (e) {
        e.preventDefault();
        var now = Date.now();

        // 防止过于频繁的触摸事件
        if (now - lastTouchTime < 16) {
          // 约60fps限制
          return;
        }
        lastTouchTime = now;
        if (e.touches.length === 1) {
          var touch = e.touches[0];
          var rect = _this5.canvas.getBoundingClientRect();
          touchStartPos = {
            x: touch.clientX - rect.left,
            y: touch.clientY - rect.top,
            time: now
          };
          isTouching = true;
          touchCount++;

          // 立即处理触摸开始位置
          _this5.handleTouchMove(touchStartPos.x, touchStartPos.y);

          // 如果之前没有蛇头，设置目标透明度
          if (!_this5.hoveredSquare) {
            _this5.targetOpacity = 0.8 * _this5.options.touchSensitivity;
          }

          // 添加触摸开始时的视觉反馈
          if (_this5.options.vibrationEnabled && navigator.vibrate) {
            navigator.vibrate(10); // 轻微震动反馈
          }
        }
      };
      this.handleTouchMoveEvent = function (e) {
        e.preventDefault();
        if (isTouching && e.touches.length === 1) {
          var touch = e.touches[0];
          var rect = _this5.canvas.getBoundingClientRect();
          touchMovePos = {
            x: touch.clientX - rect.left,
            y: touch.clientY - rect.top
          };

          // 处理触摸移动
          _this5.handleTouchMove(touchMovePos.x, touchMovePos.y);
        }
      };
      this.handleTouchEndEvent = function (e) {
        e.preventDefault();
        var now = Date.now();

        // 检测双击手势
        if (touchStartPos && now - touchStartPos.time < 300) {
          touchCount++;
          if (touchCount === 2) {
            // 双击重置蛇身
            _this5.resetSnake();
            touchCount = 0;

            // 双击震动反馈
            if (_this5.options.vibrationEnabled && navigator.vibrate) {
              navigator.vibrate([50, 50, 50]); // 三次短震动
            }
            return;
          }
        } else {
          touchCount = 0;
        }
        isTouching = false;
        touchStartPos = null;
        touchMovePos = null;

        // 触摸结束时添加痕迹
        _this5.handleTouchEnd();
      };
      this.handleTouchCancel = function (e) {
        e.preventDefault();
        isTouching = false;
        touchStartPos = null;
        touchMovePos = null;
      };

      // 添加事件监听器
      this.canvas.addEventListener("touchstart", this.handleTouchStart, {
        passive: false
      });
      this.canvas.addEventListener("touchmove", this.handleTouchMoveEvent, {
        passive: false
      });
      this.canvas.addEventListener("touchend", this.handleTouchEndEvent, {
        passive: false
      });
      this.canvas.addEventListener("touchcancel", this.handleTouchCancel, {
        passive: false
      });
    }
  }, {
    key: "handleTouchMove",
    value: function handleTouchMove(x, y) {
      var _this$hoveredSquare, _this$hoveredSquare2;
      var startX = Math.floor(this.gridOffset.x / this.options.squareSize) * this.options.squareSize;
      var startY = Math.floor(this.gridOffset.y / this.options.squareSize) * this.options.squareSize;
      var hoveredSquareX = Math.floor((x + this.gridOffset.x - startX) / this.options.squareSize);
      var hoveredSquareY = Math.floor((y + this.gridOffset.y - startY) / this.options.squareSize);
      if (((_this$hoveredSquare = this.hoveredSquare) === null || _this$hoveredSquare === void 0 ? void 0 : _this$hoveredSquare.x) !== hoveredSquareX || ((_this$hoveredSquare2 = this.hoveredSquare) === null || _this$hoveredSquare2 === void 0 ? void 0 : _this$hoveredSquare2.y) !== hoveredSquareY) {
        // 将当前悬停的格子添加到蛇身
        if (this.hoveredSquare) {
          this.snakeBody.unshift({
            x: this.hoveredSquare.x,
            y: this.hoveredSquare.y
          });

          // 如果没有吃到食物，移除蛇尾
          if (!this.shouldGrow && this.snakeBody.length > 0) {
            this.snakeBody.pop();
          }
          this.shouldGrow = false;
        }
        this.hoveredSquare = {
          x: hoveredSquareX,
          y: hoveredSquareY
        };
        // 当用户正在触摸时，设置较高的透明度
        this.targetOpacity = 0.8 * this.options.touchSensitivity;

        // 检查是否吃到食物
        if (this.specialBlock && hoveredSquareX === this.specialBlock.x && hoveredSquareY === this.specialBlock.y) {
          this.shouldGrow = true;
          this.createSpecialBlock();

          // 移动端吃到食物时的触觉反馈
          if (this.options.vibrationEnabled && navigator.vibrate) {
            navigator.vibrate(100);
          }
        }
      }
    }
  }, {
    key: "handleTouchEnd",
    value: function handleTouchEnd() {
      if (this.hoveredSquare) {
        // 将当前悬停的格子添加到蛇身
        this.snakeBody.unshift({
          x: this.hoveredSquare.x,
          y: this.hoveredSquare.y
        });

        // 如果没有吃到食物，移除蛇尾
        if (!this.shouldGrow && this.snakeBody.length > 0) {
          this.snakeBody.pop();
        }
        this.shouldGrow = false;
        var startX = Math.floor(this.gridOffset.x / this.options.squareSize) * this.options.squareSize;
        var startY = Math.floor(this.gridOffset.y / this.options.squareSize) * this.options.squareSize;
        var key = "".concat(this.hoveredSquare.x, ",").concat(this.hoveredSquare.y);
        this.trailSquares.set(key, {
          x: this.hoveredSquare.x * this.options.squareSize + startX,
          y: this.hoveredSquare.y * this.options.squareSize + startY,
          opacity: 0.8
        });
      }

      // 保持蛇身状态，不重置 hoveredSquare
      // 但降低透明度以显示触摸已结束
      if (this.hoveredSquare) {
        this.targetOpacity = 0.4; // 保持较低的透明度显示蛇头位置
      }
    }
  }, {
    key: "resetSnake",
    value: function resetSnake() {
      // 重置蛇身
      this.snakeBody = [];
      this.hoveredSquare = null;
      this.targetOpacity = 0;

      // 清除所有痕迹
      this.trailSquares.clear();

      // 重新创建食物
      this.createSpecialBlock();

      // 添加重置的视觉反馈
      if (this.options.vibrationEnabled && navigator.vibrate) {
        navigator.vibrate(200); // 长震动表示重置
      }
    }
  }, {
    key: "handleMouseMove",
    value: function handleMouseMove(event) {
      var _this$hoveredSquare3, _this$hoveredSquare4;
      var rect = this.canvas.getBoundingClientRect();
      var mouseX = event.clientX - rect.left;
      var mouseY = event.clientY - rect.top;
      var startX = Math.floor(this.gridOffset.x / this.options.squareSize) * this.options.squareSize;
      var startY = Math.floor(this.gridOffset.y / this.options.squareSize) * this.options.squareSize;
      var hoveredSquareX = Math.floor((mouseX + this.gridOffset.x - startX) / this.options.squareSize);
      var hoveredSquareY = Math.floor((mouseY + this.gridOffset.y - startY) / this.options.squareSize);
      if (((_this$hoveredSquare3 = this.hoveredSquare) === null || _this$hoveredSquare3 === void 0 ? void 0 : _this$hoveredSquare3.x) !== hoveredSquareX || ((_this$hoveredSquare4 = this.hoveredSquare) === null || _this$hoveredSquare4 === void 0 ? void 0 : _this$hoveredSquare4.y) !== hoveredSquareY) {
        // 将当前悬停的格子添加到蛇身
        if (this.hoveredSquare) {
          this.snakeBody.unshift({
            x: this.hoveredSquare.x,
            y: this.hoveredSquare.y
          });

          // 如果没有吃到食物，移除蛇尾
          if (!this.shouldGrow && this.snakeBody.length > 0) {
            this.snakeBody.pop();
          }
          this.shouldGrow = false;
        }
        this.hoveredSquare = {
          x: hoveredSquareX,
          y: hoveredSquareY
        };
        this.targetOpacity = 0.6;

        // 检查是否吃到食物
        if (this.specialBlock && hoveredSquareX === this.specialBlock.x && hoveredSquareY === this.specialBlock.y) {
          this.shouldGrow = true; // 标记蛇身需要增长
          this.createSpecialBlock(); // 吃到食物时立即生成新的食物
        }
      }
    }
  }, {
    key: "handleMouseLeave",
    value: function handleMouseLeave() {
      if (this.hoveredSquare) {
        var startX = Math.floor(this.gridOffset.x / this.options.squareSize) * this.options.squareSize;
        var startY = Math.floor(this.gridOffset.y / this.options.squareSize) * this.options.squareSize;
        var key = "".concat(this.hoveredSquare.x, ",").concat(this.hoveredSquare.y);
        this.trailSquares.set(key, {
          x: this.hoveredSquare.x * this.options.squareSize + startX,
          y: this.hoveredSquare.y * this.options.squareSize + startY,
          opacity: 0.6
        });
      }
      this.hoveredSquare = null;
      this.targetOpacity = 0;
    }
  }, {
    key: "createSpecialBlock",
    value: function createSpecialBlock() {
      // 清除之前的定时器
      if (this.specialBlockTimer) {
        clearTimeout(this.specialBlockTimer);
      }

      // 获取设备像素比
      var dpr = window.devicePixelRatio || 1;

      // 随机生成特殊方块的位置
      var numSquaresX = Math.ceil(this.canvas.width / dpr / this.options.squareSize);
      var numSquaresY = Math.ceil(this.canvas.height / dpr / this.options.squareSize);

      // 确保食物不会生成在蛇身上和边缘
      var newX, newY;
      do {
        // 避开边缘，留出1格的空间
        newX = 1 + Math.floor(Math.random() * (numSquaresX - 2));
        newY = 1 + Math.floor(Math.random() * (numSquaresY - 2));
      } while (this.snakeBody.some(function (segment) {
        return segment.x === newX && segment.y === newY;
      }));
      this.specialBlock = {
        x: newX,
        y: newY,
        color: this.options.specialBlockColor,
        initialOffset: _objectSpread({}, this.gridOffset)
      };
    }
  }, {
    key: "drawGrid",
    value: function drawGrid() {
      var _this6 = this;
      var dpr = window.devicePixelRatio || 1;

      // 清除前重置变换
      this.ctx.setTransform(1, 0, 0, 1, 0, 0);
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

      // 应用DPR比例
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var startX = Math.floor(this.gridOffset.x / this.options.squareSize) * this.options.squareSize;
      var startY = Math.floor(this.gridOffset.y / this.options.squareSize) * this.options.squareSize;

      // 增加边框线宽度，特别是在iOS设备上
      this.ctx.lineWidth = isPhone ? 1.0 : 0.5;

      // 为iOS设备优化渲染，避免边框闪烁
      if (isPhone) {
        this.ctx.translate(0.5, 0.5); // 在iOS上对齐像素
      }

      // 绘制蛇身
      this.snakeBody.forEach(function (segment, index) {
        var squareX = Math.round(segment.x * _this6.options.squareSize + startX - _this6.gridOffset.x % _this6.options.squareSize);
        var squareY = Math.round(segment.y * _this6.options.squareSize + startY - _this6.gridOffset.y % _this6.options.squareSize);
        _this6.ctx.shadowColor = _this6.options.hoverShadowColor;
        _this6.ctx.shadowBlur = 15;
        _this6.ctx.shadowOffsetX = 0;
        _this6.ctx.shadowOffsetY = 0;

        // 计算蛇身颜色渐变
        if (index === 0) {
          // 蛇头使用特殊颜色
          _this6.ctx.fillStyle = _this6.options.snakeHeadColor;
        } else {
          // 计算渐变系数
          var gradientFactor = Math.pow(_this6.options.snakeColorDecay, index);

          // 解析头部和尾部颜色
          var headColorMatch = _this6.options.snakeHeadColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([.\d]+))?\)/);
          var tailColorMatch = _this6.options.snakeTailColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([.\d]+))?\)/);
          if (headColorMatch && tailColorMatch) {
            var headR = parseInt(headColorMatch[1]);
            var headG = parseInt(headColorMatch[2]);
            var headB = parseInt(headColorMatch[3]);
            var headA = headColorMatch[4] ? parseFloat(headColorMatch[4]) : 1;
            var tailR = parseInt(tailColorMatch[1]);
            var tailG = parseInt(tailColorMatch[2]);
            var tailB = parseInt(tailColorMatch[3]);
            var tailA = tailColorMatch[4] ? parseFloat(tailColorMatch[4]) : 1;

            // 计算中间渐变色
            var r = Math.round(headR + (tailR - headR) * (1 - gradientFactor));
            var g = Math.round(headG + (tailG - headG) * (1 - gradientFactor));
            var b = Math.round(headB + (tailB - headB) * (1 - gradientFactor));
            var a = headA + (tailA - headA) * (1 - gradientFactor);
            _this6.ctx.fillStyle = "rgba(".concat(r, ", ").concat(g, ", ").concat(b, ", ").concat(a, ")");
          } else {
            // 回退到简单透明度渐变
            var opacity = Math.max(0.2, gradientFactor);
            _this6.ctx.fillStyle = "rgba(255, 255, 255, ".concat(opacity, ")");
          }
        }
        _this6.ctx.fillRect(squareX, squareY, _this6.options.squareSize, _this6.options.squareSize);
        _this6.ctx.shadowColor = "transparent";
        _this6.ctx.shadowBlur = 0;
      });

      // 绘制当前悬停的格子和食物
      for (var x = startX; x < this.canvas.width + this.options.squareSize; x += this.options.squareSize) {
        for (var y = startY; y < this.canvas.height + this.options.squareSize; y += this.options.squareSize) {
          var squareX = Math.round(x - this.gridOffset.x % this.options.squareSize);
          var squareY = Math.round(y - this.gridOffset.y % this.options.squareSize);
          var gridX = Math.floor((x - startX) / this.options.squareSize);
          var gridY = Math.floor((y - startY) / this.options.squareSize);

          // 绘制食物
          if (this.specialBlock && gridX === this.specialBlock.x && gridY === this.specialBlock.y) {
            this.ctx.shadowColor = "rgba(255, 255, 255, 0.5)";
            this.ctx.shadowBlur = 20;
            this.ctx.fillStyle = this.specialBlock.color;
            this.ctx.fillRect(squareX, squareY, this.options.squareSize, this.options.squareSize);
            this.ctx.shadowColor = "transparent";
            this.ctx.shadowBlur = 0;
          }

          // 绘制当前悬停的格子（蛇头）
          if (this.hoveredSquare && gridX === this.hoveredSquare.x && gridY === this.hoveredSquare.y) {
            this.ctx.shadowColor = this.options.hoverShadowColor;
            this.ctx.shadowBlur = 15;
            this.ctx.shadowOffsetX = 0;
            this.ctx.shadowOffsetY = 0;
            var color = this.options.hoverFillColor.replace("0.6", this.currentOpacity.toString());
            this.ctx.fillStyle = color;
            this.ctx.fillRect(squareX, squareY, this.options.squareSize, this.options.squareSize);
            this.ctx.shadowColor = "transparent";
            this.ctx.shadowBlur = 0;
          }
          this.ctx.strokeStyle = this.options.borderColor;
          this.ctx.strokeRect(squareX, squareY, this.options.squareSize, this.options.squareSize);
        }
      }

      // 移动设备上重置坐标变换
      if (isPhone) {
        this.ctx.translate(-0.5, -0.5);
      }

      // 创建径向渐变来实现暗角效果
      var gradient = this.ctx.createRadialGradient(this.canvas.width / dpr / 2, this.canvas.height / dpr / 2, 0, this.canvas.width / dpr / 2, this.canvas.height / dpr / 2, Math.sqrt(Math.pow(this.canvas.width / dpr, 2) + Math.pow(this.canvas.height / dpr, 2)) / 2);
      gradient.addColorStop(0, "rgba(6, 6, 6, 0)");
      gradient.addColorStop(1, "#060606");
      this.ctx.fillStyle = gradient;
      this.ctx.fillRect(0, 0, this.canvas.width / dpr, this.canvas.height / dpr);
    }
  }, {
    key: "updateAnimation",
    value: function updateAnimation(timestamp) {
      var _this7 = this;
      if (!this.lastTimestamp) {
        this.lastTimestamp = timestamp;
      }
      var deltaTime = timestamp - this.lastTimestamp;
      this.lastTimestamp = timestamp;

      // 更新透明度
      if (this.currentOpacity !== this.targetOpacity) {
        var progress = Math.min(deltaTime / this.options.transitionDuration, 1);
        this.currentOpacity = this.currentOpacity + (this.targetOpacity - this.currentOpacity) * progress;
      }

      // 更新痕迹格子的透明度
      var _iterator = _createForOfIteratorHelper(this.trailSquares),
        _step;
      try {
        for (_iterator.s(); !(_step = _iterator.n()).done;) {
          var _step$value = _slicedToArray(_step.value, 2),
            key = _step$value[0],
            square = _step$value[1];
          square.opacity -= deltaTime / this.options.trailDuration;
          if (square.opacity <= 0) {
            this.trailSquares["delete"](key);
          }
        }

        // 获取设备像素比
      } catch (err) {
        _iterator.e(err);
      } finally {
        _iterator.f();
      }
      var dpr = window.devicePixelRatio || 1;

      // 更新网格位置，为移动设备降低速度以减少闪烁
      var effectiveSpeed = Math.max(isPhone ? this.options.speed * 0.8 : this.options.speed, 0);

      // 确保移动位置为整数值来避免子像素渲染导致的闪烁
      var moveAmount = isPhone ? Math.round(effectiveSpeed * 100) / 100 : effectiveSpeed;
      switch (this.options.direction) {
        case "right":
          this.gridOffset.x = (this.gridOffset.x - moveAmount + this.options.squareSize) % this.options.squareSize;
          break;
        case "left":
          this.gridOffset.x = (this.gridOffset.x + moveAmount + this.options.squareSize) % this.options.squareSize;
          break;
        case "up":
          this.gridOffset.y = (this.gridOffset.y + moveAmount + this.options.squareSize) % this.options.squareSize;
          break;
        case "down":
          this.gridOffset.y = (this.gridOffset.y - moveAmount + this.options.squareSize) % this.options.squareSize;
          break;
        case "diagonal":
          this.gridOffset.x = (this.gridOffset.x - moveAmount + this.options.squareSize) % this.options.squareSize;
          this.gridOffset.y = (this.gridOffset.y - moveAmount + this.options.squareSize) % this.options.squareSize;
          break;
      }

      // 检查食物是否移出屏幕
      if (this.specialBlock) {
        var startX = Math.floor(this.gridOffset.x / this.options.squareSize) * this.options.squareSize;
        var startY = Math.floor(this.gridOffset.y / this.options.squareSize) * this.options.squareSize;
        var foodX = Math.round(this.specialBlock.x * this.options.squareSize + startX - this.gridOffset.x % this.options.squareSize);
        var foodY = Math.round(this.specialBlock.y * this.options.squareSize + startY - this.gridOffset.y % this.options.squareSize);

        // 调整适用于设备像素比的边界检查
        if (foodX < -this.options.squareSize || foodX > this.canvas.width / dpr || foodY < -this.options.squareSize || foodY > this.canvas.height / dpr) {
          // 食物移出屏幕时生成新的食物
          this.createSpecialBlock();
        }
      }
      this.drawGrid();
      this.animationFrame = requestAnimationFrame(function (timestamp) {
        return _this7.updateAnimation(timestamp);
      });
    }
  }, {
    key: "animate",
    value: function animate() {
      var _this8 = this;
      this.animationFrame = requestAnimationFrame(function (timestamp) {
        return _this8.updateAnimation(timestamp);
      });
    }
  }, {
    key: "handleVisibilityChange",
    value: function handleVisibilityChange() {
      if (document[hiddenProperty]) {
        // 页面不可见时暂停动画
        if (this.animationFrame) {
          cancelAnimationFrame(this.animationFrame);
          this.animationFrame = null;
        }
      } else {
        // 页面重新可见时恢复动画
        if (!this.animationFrame) {
          this.lastTimestamp = 0; // 重置时间戳以防止大幅度更新
          this.animate();
        }
      }
    }
  }, {
    key: "destroy",
    value: function destroy() {
      var _this9 = this;
      if (this.animationFrame) {
        cancelAnimationFrame(this.animationFrame);
      }
      window.removeEventListener("resize", function () {
        return _this9.resizeCanvas();
      });
      this.canvas.removeEventListener("mousemove", function (e) {
        return _this9.handleMouseMove(e);
      });
      this.canvas.removeEventListener("mouseleave", function () {
        return _this9.handleMouseLeave();
      });

      // 移除触摸事件监听器
      if (isPhone && this.handleTouchStart) {
        this.canvas.removeEventListener("touchstart", this.handleTouchStart);
        this.canvas.removeEventListener("touchmove", this.handleTouchMoveEvent);
        this.canvas.removeEventListener("touchend", this.handleTouchEndEvent);
        this.canvas.removeEventListener("touchcancel", this.handleTouchCancel);
      }
      document.removeEventListener(visibilityChangeEvent, this.handleVisibilityChange.bind(this));

      // 移除方向变化监听
      if (isPhone && window.orientation !== undefined) {
        window.removeEventListener("orientationchange", function () {});
      }
    }
  }]);
}();
window.hiddenProperty = "hidden" in document ? "hidden" : "webkitHidden" in document ? "webkitHidden" : "mozHidden" in document ? "mozHidden" : null;
window.DIRECTIONS = {
  UP: "UP",
  DOWN: "DOWN",
  LEFT: "LEFT",
  RIGHT: "RIGHT",
  UNDIRECTED: "UNDIRECTED"
};
window.isPhone = /Mobile|Android|iOS|iPhone|iPad|iPod|Windows Phone|KFAPWI/i.test(navigator.userAgent);
function getMoveDirection(startx, starty, endx, endy) {
  if (!isPhone) {
    return;
  }
  var angx = endx - startx;
  var angy = endy - starty;
  if (Math.abs(angx) < 2 && Math.abs(angy) < 2) {
    return DIRECTIONS.UNDIRECTED;
  }
  var getAngle = function getAngle(angx, angy) {
    return Math.atan2(angy, angx) * 180 / Math.PI;
  };
  var angle = getAngle(angx, angy);
  if (angle >= -135 && angle <= -45) {
    return DIRECTIONS.UP;
  } else if (angle > 45 && angle < 135) {
    return DIRECTIONS.DOWN;
  } else if (angle >= 135 && angle <= 180 || angle >= -180 && angle < -135) {
    return DIRECTIONS.LEFT;
  } else if (angle >= -45 && angle <= 45) {
    return DIRECTIONS.RIGHT;
  }
  return DIRECTIONS.UNDIRECTED;
}
function loadIntro() {
  if (document[hiddenProperty] || loadIntro.loaded) {
    return;
  }
  loadIntro.loaded = true;

  // Initialize neural network overlay
  var neuralCanvas = document.getElementById('neuralCanvas');
  if (neuralCanvas && !neuralNetwork) {
    neuralNetwork = new NeuralNetwork(neuralCanvas, {
      nodeCount: isPhone ? 30 : 50,
      connectionDistance: isPhone ? 120 : 160,
      packetCount: isPhone ? 15 : 30,
      packetSpeed: 0.6,
      driftSpeed: 0.12
    });
    neuralNetwork.init();
  }

  // Fade in wrap
  setTimeout(function () {
    $(".wrap").classList.add("in");
    startTypingSequence();
  }, 300);
}
function startTypingSequence() {
  var userTextEl = $('.typing-text');
  var thinkingEl = $('.ai-thinking');
  var titleEl = $('.content-title');
  var subtitleEl = $('.content-subtitle');
  var enterEl = $('.enter');

  // Start with enter hidden
  enterEl.style.opacity = '0';
  enterEl.style.pointerEvents = 'none';

  // Step 1: Type user prompt
  var userWriter = new TypeWriter(userTextEl, {
    text: userTextEl.getAttribute('data-text') || '',
    speed: 45,
    onComplete: function onComplete() {
      // Step 2: Show AI thinking dots, then show AI response
      setTimeout(function () {
        // Show AI response elements
        thinkingEl.classList.add('hidden');
        titleEl.style.display = '';
        subtitleEl.style.display = '';

        // Step 3: Type the name
        var nameWriter = new TypeWriter(titleEl, {
          text: titleEl.textContent || '',
          speed: 80,
          cursor: false,
          onComplete: function onComplete() {
            // Step 4: Type the subtitle
            var subtitleText = subtitleEl.getAttribute('original-content') || '';
            subtitleEl.textContent = '';
            var subWriter = new TypeWriter(subtitleEl, {
              text: subtitleText,
              speed: 35,
              cursor: false,
              onComplete: function onComplete() {
                // Step 5: Show enter button
                enterEl.style.opacity = '1';
                enterEl.style.pointerEvents = 'auto';
                enterEl.style.transition = 'opacity 0.6s ease';
              }
            });
            subWriter.start(200);
          }
        });
        nameWriter.start(0);
      }, 600);
    }
  });
  userWriter.start(400);
}
function switchPage() {
  if (switchPage.switched) {
    return;
  }
  var DOM = {
    intro: $(".content-intro"),
    path: $(".shape-wrap path"),
    shape: $("svg.shape")
  };
  DOM.shape.style.transformOrigin = "50% 0%";
  anime({
    targets: DOM.intro,
    duration: 1100,
    easing: "easeInOutSine",
    translateY: "-200vh"
  });
  anime({
    targets: DOM.shape,
    scaleY: [{
      value: [0.8, 1.8],
      duration: 550,
      easing: "easeInQuad"
    }, {
      value: 1,
      duration: 550,
      easing: "easeOutQuad"
    }]
  });
  anime({
    targets: DOM.path,
    duration: 1100,
    easing: "easeOutQuad",
    d: DOM.path.getAttribute("pathdata:id"),
    complete: function complete(anim) {
      if (canvas) {
        cancelAnimationFrame(animationID);
        canvas.parentElement.removeChild(canvas);
        canvas = null;
      }
      if (neuralNetwork) {
        neuralNetwork.destroy();
        var nc = document.getElementById('neuralCanvas');
        if (nc && nc.parentElement) {
          nc.parentElement.removeChild(nc);
        }
        neuralNetwork = null;
      }
    }
  });
  switchPage.switched = true;
}
function loadMain() {
  if (loadMain.loaded) {
    return;
  }
  setTimeout(function () {
    $(".card-inner").classList.add("in");
    setTimeout(function () {
      var canvas = document.getElementById("gridCanvas");
      if (canvas) {
        var gridAnimation = new GridAnimation(canvas, {
          direction: "diagonal",
          speed: isPhone ? 0.03 : 0.05,
          borderColor: isPhone ? "rgba(255, 255, 255, 0.2)" : "rgba(255, 255, 255, 0.1)",
          squareSize: isPhone ? 50 : 40,
          hoverFillColor: "rgba(255, 255, 255, 0.8)",
          hoverShadowColor: "rgba(255, 255, 255, 0.8)",
          transitionDuration: isPhone ? 150 : 200,
          // 移动端更快的过渡
          trailDuration: isPhone ? 2000 : 1500,
          // 移动端更长的痕迹
          specialBlockColor: "rgba(100, 255, 152, 0.8)",
          specialHoverColor: "rgba(29, 202, 29, 0.8)",
          // 蛇身颜色渐变配置
          snakeHeadColor: "rgba(255, 255, 255, 0.95)",
          snakeTailColor: "rgba(218, 231, 255, 0.25)",
          snakeColorDecay: 0.85,
          // 颜色衰减系数
          // 移动端特殊配置
          touchSensitivity: isPhone ? 1.2 : 1.0,
          // 触摸灵敏度
          vibrationEnabled: isPhone // 是否启用震动反馈
        });
        gridAnimation.init();
      }
    }, 1100);
  }, 400);
  loadMain.loaded = true;
}
function loadAll() {
  if (loadAll.loaded) {
    return;
  }
  switchPage();
  loadMain();
  loadAll.loaded = true;
}

// Practice page transition
function switchToPractice() {
  if (switchToPractice.switched) return;
  switchToPractice.switched = true;

  // Close contact page if open
  if (switchToContact.switched) {
    switchFromContact();
  }
  var practiceEl = $('.content-practice');
  var mainEl = $('.content-main');
  anime({
    targets: mainEl,
    duration: 800,
    easing: 'easeInOutSine',
    translateY: '-100vh',
    opacity: [1, 0.3]
  });
  anime({
    targets: practiceEl,
    duration: 800,
    easing: 'easeOutSine',
    translateY: ['100vh', '0vh'],
    complete: function complete() {
      loadPractice();
    }
  });
}
function switchFromPractice() {
  if (!switchToPractice.switched) return;
  switchToPractice.switched = false;
  var practiceEl = $('.content-practice');
  var mainEl = $('.content-main');
  if (loadPractice.loaded) {
    loadPractice.loaded = false;
  }
  anime({
    targets: practiceEl,
    duration: 600,
    easing: 'easeInSine',
    translateY: ['0vh', '100vh'],
    complete: function complete() {
      practiceEl.style.transform = '';
      resetPracticePage();
    }
  });
  anime({
    targets: mainEl,
    duration: 600,
    easing: 'easeInOutSine',
    translateY: ['-100vh', '0vh'],
    opacity: [0.3, 1]
  });
}
function loadPractice() {
  if (loadPractice.loaded) return;
  loadPractice.loaded = true;
  var wrapEl = $('.content-practice .wrap');
  if (wrapEl) wrapEl.classList.add('in');
  var userTextEl = $('.content-practice .typing-text');
  var thinkingEl = $('.content-practice .ai-thinking');
  var detailsEl = $('.content-practice .practice-details');
  var backEl = $('.practice-back');
  backEl.style.opacity = '0';
  backEl.style.pointerEvents = 'none';
  var userWriter = new TypeWriter(userTextEl, {
    text: userTextEl.getAttribute('data-text') || '',
    speed: 40,
    onComplete: function onComplete() {
      setTimeout(function () {
        thinkingEl.classList.add('hidden');
        detailsEl.style.display = '';
        // Animate elements in sequence
        var titleEl = $('.practice-title');
        var descEl = $('.practice-desc');
        var videoEl = $('.video-wrapper');
        titleEl.style.opacity = '0';
        titleEl.style.transform = 'translateY(10px)';
        titleEl.style.transition = 'all 0.5s ease';
        descEl.style.opacity = '0';
        descEl.style.transform = 'translateY(10px)';
        descEl.style.transition = 'all 0.5s ease';
        videoEl.style.opacity = '0';
        videoEl.style.transform = 'translateY(10px)';
        videoEl.style.transition = 'all 0.5s ease';
        setTimeout(function () {
          titleEl.style.opacity = '1';
          titleEl.style.transform = 'translateY(0)';
        }, 100);
        setTimeout(function () {
          descEl.style.opacity = '1';
          descEl.style.transform = 'translateY(0)';
        }, 350);
        setTimeout(function () {
          videoEl.style.opacity = '1';
          videoEl.style.transform = 'translateY(0)';
          backEl.style.opacity = '1';
          backEl.style.pointerEvents = 'auto';
          backEl.style.transition = 'opacity 0.6s ease';
          // Setup video play button
          setupVideoPlayback();
        }, 600);
      }, 500);
    }
  });
  userWriter.start(300);
}
function setupVideoPlayback() {
  var video = document.getElementById('practiceVideo');
  var placeholder = $('.content-practice .video-placeholder');
  var playIcon = $('.content-practice .play-icon');
  var placeholderText = $('.content-practice .placeholder-text');
  if (!video || !placeholder) return;

  // Click placeholder to play
  placeholder.style.cursor = 'pointer';
  var clickHandler = function clickHandler() {
    video.play().then(function () {
      placeholder.style.opacity = '0';
      placeholder.style.pointerEvents = 'none';
      placeholder.style.transition = 'opacity 0.3s ease';
    })["catch"](function () {
      // No video file yet — keep placeholder visible
      if (placeholderText) {
        placeholderText.textContent = '视频文件尚未上传';
      }
    });
  };

  // Remove old handler if re-entering
  placeholder.removeEventListener('click', placeholder._clickHandler);
  placeholder._clickHandler = clickHandler;
  placeholder.addEventListener('click', clickHandler);

  // Hide placeholder once video starts playing
  video.addEventListener('play', function () {
    placeholder.style.opacity = '0';
    placeholder.style.pointerEvents = 'none';
  });

  // Show placeholder when video ends
  video.addEventListener('ended', function () {
    placeholder.style.opacity = '1';
    placeholder.style.pointerEvents = 'auto';
    if (playIcon) playIcon.textContent = '⟳';
    if (placeholderText) placeholderText.textContent = '重新播放';
  });

  // Show placeholder on error
  video.addEventListener('error', function () {
    placeholder.style.opacity = '1';
    placeholder.style.pointerEvents = 'auto';
    if (playIcon) playIcon.textContent = '▶';
    if (placeholderText) placeholderText.textContent = '视频文件尚未上传';
  });
}
function resetPracticePage() {
  var thinkingEl = $('.content-practice .ai-thinking');
  var detailsEl = $('.content-practice .practice-details');
  var userTextEl = $('.content-practice .typing-text');
  var backEl = $('.practice-back');
  var wrapEl = $('.content-practice .wrap');
  var titleEl = $('.practice-title');
  var descEl = $('.practice-desc');
  var videoEl = $('.video-wrapper');
  var placeholderEl = $('.content-practice .video-placeholder');
  var playIcon = $('.content-practice .play-icon');
  var placeholderText = $('.content-practice .placeholder-text');
  var video = document.getElementById('practiceVideo');

  // Pause and reset video
  if (video) {
    video.pause();
    video.currentTime = 0;
  }

  // Reset placeholder
  if (placeholderEl) {
    placeholderEl.style.opacity = '1';
    placeholderEl.style.pointerEvents = 'auto';
    placeholderEl.style.cursor = 'pointer';
  }
  if (playIcon) playIcon.textContent = '▶';
  if (placeholderText) placeholderText.textContent = '点击播放产品动画';
  if (wrapEl) wrapEl.classList.remove('in');
  thinkingEl.classList.remove('hidden');
  detailsEl.style.display = 'none';
  userTextEl.textContent = ' ';
  userTextEl.classList.remove('done');
  backEl.style.opacity = '0';
  backEl.style.pointerEvents = 'none';
  if (titleEl) {
    titleEl.style.opacity = '0';
    titleEl.style.transform = 'translateY(10px)';
  }
  if (descEl) {
    descEl.style.opacity = '0';
    descEl.style.transform = 'translateY(10px)';
  }
  if (videoEl) {
    videoEl.style.opacity = '0';
    videoEl.style.transform = 'translateY(10px)';
  }
}

// About page transition
function switchToAbout() {
  if (switchToAbout.switched) return;
  switchToAbout.switched = true;
  var aboutEl = $('.content-about');
  var mainEl = $('.content-main');
  anime({
    targets: mainEl,
    duration: 800,
    easing: 'easeInOutSine',
    translateY: '-100vh',
    opacity: [1, 0.3]
  });
  anime({
    targets: aboutEl,
    duration: 800,
    easing: 'easeOutSine',
    translateY: ['100vh', '0vh'],
    complete: function complete() {
      loadAbout();
    }
  });
}
function switchFromAbout() {
  if (!switchToAbout.switched) return;
  switchToAbout.switched = false;
  var aboutEl = $('.content-about');
  var mainEl = $('.content-main');
  if (loadAbout.loaded) {
    loadAbout.loaded = false;
  }
  anime({
    targets: aboutEl,
    duration: 600,
    easing: 'easeInSine',
    translateY: ['0vh', '100vh'],
    complete: function complete() {
      aboutEl.style.transform = '';
      resetAboutPage();
    }
  });
  anime({
    targets: mainEl,
    duration: 600,
    easing: 'easeInOutSine',
    translateY: ['-100vh', '0vh'],
    opacity: [0.3, 1]
  });
}
function loadAbout() {
  if (loadAbout.loaded) return;
  loadAbout.loaded = true;
  var wrapEl = $('.content-about .wrap');
  var userTextEl = $('.content-about .typing-text');
  var thinkingEl = $('.content-about .ai-thinking');
  var detailsEl = $('.content-about .placeholder-content');
  var backEl = $('.about-back');
  if (wrapEl) wrapEl.classList.add('in');
  backEl.style.opacity = '0';
  backEl.style.pointerEvents = 'none';
  var userWriter = new TypeWriter(userTextEl, {
    text: userTextEl.getAttribute('data-text') || '',
    speed: 40,
    onComplete: function onComplete() {
      setTimeout(function () {
        thinkingEl.classList.add('hidden');
        detailsEl.style.display = '';
        detailsEl.style.opacity = '0';
        detailsEl.style.transform = 'translateY(10px)';
        detailsEl.style.transition = 'all 0.5s ease';
        setTimeout(function () {
          detailsEl.style.opacity = '1';
          detailsEl.style.transform = 'translateY(0)';
          backEl.style.opacity = '1';
          backEl.style.pointerEvents = 'auto';
          backEl.style.transition = 'opacity 0.6s ease';
        }, 100);
      }, 500);
    }
  });
  userWriter.start(300);
}
function resetAboutPage() {
  var thinkingEl = $('.content-about .ai-thinking');
  var detailsEl = $('.content-about .placeholder-content');
  var userTextEl = $('.content-about .typing-text');
  var backEl = $('.about-back');
  var wrapEl = $('.content-about .wrap');
  if (wrapEl) wrapEl.classList.remove('in');
  thinkingEl.classList.remove('hidden');
  detailsEl.style.display = 'none';
  detailsEl.style.opacity = '0';
  detailsEl.style.transform = 'translateY(10px)';
  userTextEl.textContent = ' ';
  userTextEl.classList.remove('done');
  backEl.style.opacity = '0';
  backEl.style.pointerEvents = 'none';
}

// Projects page transition
function switchToProjects() {
  if (switchToProjects.switched) return;
  switchToProjects.switched = true;
  var projectsEl = $('.content-projects');
  var mainEl = $('.content-main');
  anime({
    targets: mainEl,
    duration: 800,
    easing: 'easeInOutSine',
    translateY: '-100vh',
    opacity: [1, 0.3]
  });
  anime({
    targets: projectsEl,
    duration: 800,
    easing: 'easeOutSine',
    translateY: ['100vh', '0vh'],
    complete: function complete() {
      loadProjects();
    }
  });
}
function switchFromProjects() {
  if (!switchToProjects.switched) return;
  switchToProjects.switched = false;
  var projectsEl = $('.content-projects');
  var mainEl = $('.content-main');
  if (loadProjects.loaded) {
    loadProjects.loaded = false;
  }
  anime({
    targets: projectsEl,
    duration: 600,
    easing: 'easeInSine',
    translateY: ['0vh', '100vh'],
    complete: function complete() {
      projectsEl.style.transform = '';
      resetProjectsPage();
    }
  });
  anime({
    targets: mainEl,
    duration: 600,
    easing: 'easeInOutSine',
    translateY: ['-100vh', '0vh'],
    opacity: [0.3, 1]
  });
}
function loadProjects() {
  if (loadProjects.loaded) return;
  loadProjects.loaded = true;
  var wrapEl = $('.content-projects .wrap');
  if (wrapEl) wrapEl.classList.add('in');
  var userTextEl = $('.content-projects .typing-text');
  var thinkingEl = $('.content-projects .ai-thinking');
  var detailsEl = $('.content-projects .placeholder-content');
  var backEl = $('.projects-back');
  backEl.style.opacity = '0';
  backEl.style.pointerEvents = 'none';
  var userWriter = new TypeWriter(userTextEl, {
    text: userTextEl.getAttribute('data-text') || '',
    speed: 40,
    onComplete: function onComplete() {
      setTimeout(function () {
        thinkingEl.classList.add('hidden');
        detailsEl.style.display = '';
        detailsEl.style.opacity = '0';
        detailsEl.style.transform = 'translateY(10px)';
        detailsEl.style.transition = 'all 0.5s ease';
        setTimeout(function () {
          detailsEl.style.opacity = '1';
          detailsEl.style.transform = 'translateY(0)';
          backEl.style.opacity = '1';
          backEl.style.pointerEvents = 'auto';
          backEl.style.transition = 'opacity 0.6s ease';
        }, 100);
      }, 500);
    }
  });
  userWriter.start(300);
}
function resetProjectsPage() {
  var thinkingEl = $('.content-projects .ai-thinking');
  var detailsEl = $('.content-projects .placeholder-content');
  var userTextEl = $('.content-projects .typing-text');
  var backEl = $('.projects-back');
  var wrapEl = $('.content-projects .wrap');
  if (wrapEl) wrapEl.classList.remove('in');
  thinkingEl.classList.remove('hidden');
  detailsEl.style.display = 'none';
  detailsEl.style.opacity = '0';
  detailsEl.style.transform = 'translateY(10px)';
  userTextEl.textContent = ' ';
  userTextEl.classList.remove('done');
  backEl.style.opacity = '0';
  backEl.style.pointerEvents = 'none';
}

// Contact page transition
function switchToContact() {
  if (switchToContact.switched) return;
  switchToContact.switched = true;

  // Close practice page if open
  if (switchToPractice.switched) {
    switchFromPractice();
  }
  var contactEl = $('.content-contact');
  var mainEl = $('.content-main');
  anime({
    targets: mainEl,
    duration: 800,
    easing: 'easeInOutSine',
    translateY: '-100vh',
    opacity: [1, 0.3]
  });
  anime({
    targets: contactEl,
    duration: 800,
    easing: 'easeOutSine',
    translateY: ['100vh', '0vh'],
    complete: function complete() {
      loadContact();
    }
  });
}
function switchFromContact() {
  if (!switchToContact.switched) return;
  switchToContact.switched = false;
  var contactEl = $('.content-contact');
  var mainEl = $('.content-main');

  // Reset contact typing state
  if (loadContact.loaded) {
    loadContact.loaded = false;
  }
  anime({
    targets: contactEl,
    duration: 600,
    easing: 'easeInSine',
    translateY: ['0vh', '100vh'],
    complete: function complete() {
      contactEl.style.transform = '';
      resetContactPage();
    }
  });
  anime({
    targets: mainEl,
    duration: 600,
    easing: 'easeInOutSine',
    translateY: ['-100vh', '0vh'],
    opacity: [0.3, 1]
  });
}
function loadContact() {
  if (loadContact.loaded) return;
  loadContact.loaded = true;

  // Fade in the wrap
  var wrapEl = $('.content-contact .wrap');
  if (wrapEl) wrapEl.classList.add('in');
  var userTextEl = $('.content-contact .typing-text');
  var thinkingEl = $('.content-contact .ai-thinking');
  var detailsEl = $('.content-contact .contact-details');
  var backEl = $('.contact-back');
  backEl.style.opacity = '0';
  backEl.style.pointerEvents = 'none';
  var userWriter = new TypeWriter(userTextEl, {
    text: userTextEl.getAttribute('data-text') || '',
    speed: 40,
    onComplete: function onComplete() {
      setTimeout(function () {
        thinkingEl.classList.add('hidden');
        detailsEl.style.display = '';
        animateContactItems(function () {
          backEl.style.opacity = '1';
          backEl.style.pointerEvents = 'auto';
          backEl.style.transition = 'opacity 0.6s ease';
        });
      }, 500);
    }
  });
  userWriter.start(300);
}
function animateContactItems(callback) {
  var items = document.querySelectorAll('.contact-item');
  if (!items.length) {
    if (callback) callback();
    return;
  }
  items.forEach(function (item, index) {
    item.style.opacity = '0';
    item.style.transform = 'translateX(-20px)';
    item.style.transition = 'all 0.4s ease';
    setTimeout(function () {
      item.style.opacity = '1';
      item.style.transform = 'translateX(0)';
      if (index === items.length - 1 && callback) {
        setTimeout(callback, 400);
      }
    }, 200 + index * 150);
  });
}
function resetContactPage() {
  var thinkingEl = $('.content-contact .ai-thinking');
  var detailsEl = $('.content-contact .contact-details');
  var userTextEl = $('.content-contact .typing-text');
  var backEl = $('.contact-back');
  var wrapEl = $('.content-contact .wrap');
  var items = document.querySelectorAll('.contact-item');
  if (wrapEl) wrapEl.classList.remove('in');
  thinkingEl.classList.remove('hidden');
  detailsEl.style.display = 'none';
  userTextEl.textContent = ' ';
  userTextEl.classList.remove('done');
  backEl.style.opacity = '0';
  backEl.style.pointerEvents = 'none';
  items.forEach(function (item) {
    item.style.opacity = '0';
    item.style.transform = 'translateX(-20px)';
  });
}
window.visibilityChangeEvent = hiddenProperty.replace(/hidden/i, "visibilitychange");
window.addEventListener(visibilityChangeEvent, loadIntro);
window.addEventListener("DOMContentLoaded", loadIntro);
var enterEl = $(".enter");
enterEl.addEventListener("click", loadAll);
enterEl.addEventListener("touchenter", loadAll);
function handleScrollEvent(e) {
  var deltaY = e.deltaY || e.wheelDelta * -1 || e.detail;
  if (deltaY > 0) {
    loadAll();
  }
}
document.body.addEventListener("wheel", handleScrollEvent, {
  passive: true
});
document.body.addEventListener("mousewheel", handleScrollEvent, {
  passive: true
});
document.body.addEventListener("DOMMouseScroll", handleScrollEvent, {
  passive: true
}); // Firefox兼容
$(".arrow").addEventListener("mouseenter", loadAll);
if (isPhone) {
  document.addEventListener("touchstart", function (e) {
    window.startx = e.touches[0].pageX;
    window.starty = e.touches[0].pageY;
  }, {
    passive: true
  });
  document.addEventListener("touchend", function (e) {
    var endx, endy;
    endx = e.changedTouches[0].pageX;
    endy = e.changedTouches[0].pageY;
    var direction = getMoveDirection(startx, starty, endx, endy);
    if (direction !== DIRECTIONS.UP) {
      return;
    }
    loadAll();
  }, {
    passive: true
  });
}

// Contact page event listeners
var contactLink = document.querySelector('.content-main a[href="#contact"]');
if (contactLink) {
  contactLink.addEventListener('click', function (e) {
    e.preventDefault();
    switchToContact();
  });
}
var contactBack = $('.contact-back');
if (contactBack) {
  contactBack.addEventListener('click', switchFromContact);
}

// Practice page event listeners
var practiceLink = document.querySelector('.content-main a[href="#ai-practice"]');
if (practiceLink) {
  practiceLink.addEventListener('click', function (e) {
    e.preventDefault();
    switchToPractice();
  });
}
var practiceBack = $('.practice-back');
if (practiceBack) {
  practiceBack.addEventListener('click', switchFromPractice);
}

// About page event listeners
var aboutLink = document.querySelector('.content-main a[href="#about"]');
if (aboutLink) {
  aboutLink.addEventListener('click', function (e) {
    e.preventDefault();
    switchToAbout();
  });
}
var aboutBack = $('.about-back');
if (aboutBack) {
  aboutBack.addEventListener('click', switchFromAbout);
}

// Projects page event listeners
var projectsLink = document.querySelector('.content-main a[href="#projects"]');
if (projectsLink) {
  projectsLink.addEventListener('click', function (e) {
    e.preventDefault();
    switchToProjects();
  });
}
var projectsBack = $('.projects-back');
if (projectsBack) {
  projectsBack.addEventListener('click', switchFromProjects);
}