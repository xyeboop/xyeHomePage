/**
 * Neural Network Visualization Overlay
 * Renders AI-themed nodes, connections, and data-flow particles
 * on a Canvas 2D layer above the WebGL fluid simulation.
 */
'use strict';

function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _createForOfIteratorHelper(r, e) { var t = "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (!t) { if (Array.isArray(r) || (t = _unsupportedIterableToArray(r)) || e && r && "number" == typeof r.length) { t && (r = t); var _n = 0, F = function F() {}; return { s: F, n: function n() { return _n >= r.length ? { done: !0 } : { done: !1, value: r[_n++] }; }, e: function e(r) { throw r; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var o, a = !0, u = !1; return { s: function s() { t = t.call(r); }, n: function n() { var r = t.next(); return a = r.done, r; }, e: function e(r) { u = !0, o = r; }, f: function f() { try { a || null == t["return"] || t["return"](); } finally { if (u) throw o; } } }; }
function _unsupportedIterableToArray(r, a) { if (r) { if ("string" == typeof r) return _arrayLikeToArray(r, a); var t = {}.toString.call(r).slice(8, -1); return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0; } }
function _arrayLikeToArray(r, a) { (null == a || a > r.length) && (a = r.length); for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e]; return n; }
function _classCallCheck(a, n) { if (!(a instanceof n)) throw new TypeError("Cannot call a class as a function"); }
function _defineProperties(e, r) { for (var t = 0; t < r.length; t++) { var o = r[t]; o.enumerable = o.enumerable || !1, o.configurable = !0, "value" in o && (o.writable = !0), Object.defineProperty(e, _toPropertyKey(o.key), o); } }
function _createClass(e, r, t) { return r && _defineProperties(e.prototype, r), t && _defineProperties(e, t), Object.defineProperty(e, "prototype", { writable: !1 }), e; }
function _defineProperty(e, r, t) { return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
var NeuralNetwork = /*#__PURE__*/function () {
  function NeuralNetwork(canvas) {
    var _this = this;
    var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    _classCallCheck(this, NeuralNetwork);
    _defineProperty(this, "_handleResize", function () {
      _this.resize();
    });
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.options = {
      nodeCount: options.nodeCount || 60,
      connectionDistance: options.connectionDistance || 180,
      nodeRadius: options.nodeRadius || 3.5,
      nodeGlowRadius: options.nodeGlowRadius || 15,
      packetCount: options.packetCount || 40,
      packetSpeed: options.packetSpeed || 0.6,
      packetRadius: options.packetRadius || 1.8,
      driftSpeed: options.driftSpeed || 0.15,
      driftAmplitude: options.driftAmplitude || 30,
      fps: options.fps || 60,
      // Colors
      colors: options.colors || [{
        r: 0,
        g: 240,
        b: 255
      },
      // Cyan
      {
        r: 0,
        g: 128,
        b: 255
      },
      // Electric Blue
      {
        r: 123,
        g: 47,
        b: 255
      },
      // Purple
      {
        r: 100,
        g: 200,
        b: 255
      } // Light Blue
      ],
      backgroundColor: options.backgroundColor || 'rgba(0, 0, 0, 0)'
    };
    this.nodes = [];
    this.packets = [];
    this.edges = [];
    this.animationFrame = null;
    this.lastTimestamp = 0;
    this.time = 0;
    this.running = false;
  }
  return _createClass(NeuralNetwork, [{
    key: "init",
    value: function init() {
      this.resize();
      this.createNodes();
      this.createPackets();
      this.running = true;
      this.animate();
      window.addEventListener('resize', this._handleResize);
    }
  }, {
    key: "resize",
    value: function resize() {
      var dpr = window.devicePixelRatio || 1;
      var displayWidth = this.canvas.offsetWidth;
      var displayHeight = this.canvas.offsetHeight;
      this.canvas.width = Math.floor(displayWidth * dpr);
      this.canvas.height = Math.floor(displayHeight * dpr);
      this.canvas.style.width = displayWidth + 'px';
      this.canvas.style.height = displayHeight + 'px';
      this.ctx.setTransform(1, 0, 0, 1, 0, 0);
      this.ctx.scale(dpr, dpr);
      this.width = displayWidth;
      this.height = displayHeight;
      this.centerX = displayWidth / 2;
      this.centerY = displayHeight / 2;
    }
  }, {
    key: "createNodes",
    value: function createNodes() {
      this.nodes = [];
      for (var i = 0; i < this.options.nodeCount; i++) {
        this.nodes.push({
          id: i,
          x: Math.random() * this.width,
          y: Math.random() * this.height,
          // Each node has its own drift phase for organic motion
          phaseX: Math.random() * Math.PI * 2,
          phaseY: Math.random() * Math.PI * 2,
          speedX: 0.5 + Math.random() * 1.5,
          speedY: 0.5 + Math.random() * 1.5,
          color: this.options.colors[Math.floor(Math.random() * this.options.colors.length)],
          radius: this.options.nodeRadius * (0.6 + Math.random() * 0.8),
          glowRadius: this.options.nodeGlowRadius * (0.5 + Math.random() * 1.0)
        });
      }
    }
  }, {
    key: "createPackets",
    value: function createPackets() {
      this.packets = [];
      for (var i = 0; i < this.options.packetCount; i++) {
        this.packets.push(this._spawnPacket());
      }
    }
  }, {
    key: "_spawnPacket",
    value: function _spawnPacket() {
      // Pick a random edge
      if (this.edges.length === 0) {
        return {
          from: {
            x: Math.random() * this.width,
            y: Math.random() * this.height
          },
          to: {
            x: Math.random() * this.width,
            y: Math.random() * this.height
          },
          t: Math.random(),
          speed: this.options.packetSpeed * (0.5 + Math.random()),
          color: this.options.colors[Math.floor(Math.random() * this.options.colors.length)]
        };
      }
      var edge = this.edges[Math.floor(Math.random() * this.edges.length)];
      return {
        fromNode: edge.from,
        toNode: edge.to,
        t: Math.random(),
        speed: this.options.packetSpeed * (0.5 + Math.random()),
        color: edge.color
      };
    }
  }, {
    key: "_updateNodes",
    value: function _updateNodes(dt) {
      var t = this.time;
      var amp = this.options.driftAmplitude;
      var speed = this.options.driftSpeed;
      var _iterator = _createForOfIteratorHelper(this.nodes),
        _step;
      try {
        for (_iterator.s(); !(_step = _iterator.n()).done;) {
          var node = _step.value;
          // Smooth drifting motion using sine waves
          var dx = Math.sin(t * speed * node.speedX + node.phaseX) * amp * 0.02;
          var dy = Math.cos(t * speed * node.speedY + node.phaseY) * amp * 0.02;
          node.x += dx;
          node.y += dy;

          // Wrap around edges with margin
          var margin = 50;
          if (node.x < -margin) node.x = this.width + margin;
          if (node.x > this.width + margin) node.x = -margin;
          if (node.y < -margin) node.y = this.height + margin;
          if (node.y > this.height + margin) node.y = -margin;

          // Clamp to visible area with some margin
          node.x = Math.max(-margin, Math.min(this.width + margin, node.x));
          node.y = Math.max(-margin, Math.min(this.height + margin, node.y));
        }
      } catch (err) {
        _iterator.e(err);
      } finally {
        _iterator.f();
      }
    }
  }, {
    key: "_computeEdges",
    value: function _computeEdges() {
      this.edges = [];
      var maxDist = this.options.connectionDistance;
      for (var i = 0; i < this.nodes.length; i++) {
        for (var j = i + 1; j < this.nodes.length; j++) {
          var a = this.nodes[i];
          var b = this.nodes[j];
          var dx = a.x - b.x;
          var dy = a.y - b.y;
          var dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < maxDist) {
            this.edges.push({
              from: a,
              to: b,
              distance: dist,
              maxDistance: maxDist,
              color: a.color // Use the first node's color
            });
          }
        }
      }
    }
  }, {
    key: "_updatePackets",
    value: function _updatePackets() {
      for (var i = 0; i < this.packets.length; i++) {
        var p = this.packets[i];
        p.t += p.speed * 0.003;
        if (p.t >= 1.0) {
          // Respawn this packet
          this.packets[i] = this._spawnPacket();
          this.packets[i].t = 0;
        }
      }
    }
  }, {
    key: "_getPacketPosition",
    value: function _getPacketPosition(packet) {
      var fx, fy, tx, ty;
      if (packet.fromNode && packet.toNode) {
        fx = packet.fromNode.x;
        fy = packet.fromNode.y;
        tx = packet.toNode.x;
        ty = packet.toNode.y;
      } else {
        fx = packet.from.x;
        fy = packet.from.y;
        tx = packet.to.x;
        ty = packet.to.y;
      }
      return {
        x: fx + (tx - fx) * packet.t,
        y: fy + (ty - fy) * packet.t
      };
    }
  }, {
    key: "_drawNodes",
    value: function _drawNodes() {
      var ctx = this.ctx;
      var _iterator2 = _createForOfIteratorHelper(this.nodes),
        _step2;
      try {
        for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {
          var node = _step2.value;
          var _node$color = node.color,
            r = _node$color.r,
            g = _node$color.g,
            b = _node$color.b;

          // Outer glow
          var glowGradient = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, node.glowRadius);
          glowGradient.addColorStop(0, "rgba(".concat(r, ", ").concat(g, ", ").concat(b, ", 0.7)"));
          glowGradient.addColorStop(0.5, "rgba(".concat(r, ", ").concat(g, ", ").concat(b, ", 0.2)"));
          glowGradient.addColorStop(1, "rgba(".concat(r, ", ").concat(g, ", ").concat(b, ", 0)"));
          ctx.beginPath();
          ctx.arc(node.x, node.y, node.glowRadius, 0, Math.PI * 2);
          ctx.fillStyle = glowGradient;
          ctx.fill();

          // Core node
          ctx.beginPath();
          ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
          ctx.fillStyle = "rgba(".concat(r, ", ").concat(g, ", ").concat(b, ", 0.95)");
          ctx.fill();

          // Bright center
          ctx.beginPath();
          ctx.arc(node.x, node.y, node.radius * 0.5, 0, Math.PI * 2);
          ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
          ctx.fill();
        }
      } catch (err) {
        _iterator2.e(err);
      } finally {
        _iterator2.f();
      }
    }
  }, {
    key: "_drawEdges",
    value: function _drawEdges() {
      var ctx = this.ctx;
      var pulseIntensity = 0.5 + 0.5 * Math.sin(this.time * 0.5);
      var _iterator3 = _createForOfIteratorHelper(this.edges),
        _step3;
      try {
        for (_iterator3.s(); !(_step3 = _iterator3.n()).done;) {
          var edge = _step3.value;
          var _edge$color = edge.color,
            r = _edge$color.r,
            g = _edge$color.g,
            b = _edge$color.b;
          var alpha = (1 - edge.distance / edge.maxDistance) * 0.55 * pulseIntensity;
          ctx.beginPath();
          ctx.moveTo(edge.from.x, edge.from.y);
          ctx.lineTo(edge.to.x, edge.to.y);
          ctx.strokeStyle = "rgba(".concat(r, ", ").concat(g, ", ").concat(b, ", ").concat(alpha, ")");
          ctx.lineWidth = 0.8;
          ctx.stroke();
        }
      } catch (err) {
        _iterator3.e(err);
      } finally {
        _iterator3.f();
      }
    }
  }, {
    key: "_drawPackets",
    value: function _drawPackets() {
      var ctx = this.ctx;
      var _iterator4 = _createForOfIteratorHelper(this.packets),
        _step4;
      try {
        for (_iterator4.s(); !(_step4 = _iterator4.n()).done;) {
          var packet = _step4.value;
          var pos = this._getPacketPosition(packet);
          var _packet$color = packet.color,
            r = _packet$color.r,
            g = _packet$color.g,
            b = _packet$color.b;

          // Glow
          var glowGradient = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, this.options.packetRadius * 5);
          glowGradient.addColorStop(0, "rgba(".concat(r, ", ").concat(g, ", ").concat(b, ", 0.9)"));
          glowGradient.addColorStop(1, "rgba(".concat(r, ", ").concat(g, ", ").concat(b, ", 0)"));
          ctx.beginPath();
          ctx.arc(pos.x, pos.y, this.options.packetRadius * 5, 0, Math.PI * 2);
          ctx.fillStyle = glowGradient;
          ctx.fill();

          // Core
          ctx.beginPath();
          ctx.arc(pos.x, pos.y, this.options.packetRadius, 0, Math.PI * 2);
          ctx.fillStyle = "rgba(255, 255, 255, 1)";
          ctx.fill();
        }
      } catch (err) {
        _iterator4.e(err);
      } finally {
        _iterator4.f();
      }
    }
  }, {
    key: "_drawVignette",
    value: function _drawVignette() {
      var ctx = this.ctx;
      var gradient = ctx.createRadialGradient(this.centerX, this.centerY, 0, this.centerX, this.centerY, Math.max(this.width, this.height) * 0.55);
      gradient.addColorStop(0, 'rgba(6, 6, 6, 0)');
      gradient.addColorStop(1, 'rgba(6, 6, 6, 0.15)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, this.width, this.height);
    }
  }, {
    key: "_draw",
    value: function _draw(timestamp) {
      if (!this.running) return;
      var ctx = this.ctx;
      var dt = Math.min((timestamp - this.lastTimestamp) / 1000, 0.05);
      this.lastTimestamp = timestamp;
      this.time += dt;

      // Clear
      ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

      // Update
      this._updateNodes(dt);
      this._computeEdges();
      this._updatePackets();

      // Draw
      this._drawEdges();
      this._drawNodes();
      this._drawPackets();
      this._drawVignette();
    }
  }, {
    key: "animate",
    value: function animate() {
      var _this2 = this;
      if (!this.running) return;
      this.animationFrame = requestAnimationFrame(function (ts) {
        _this2._draw(ts);
        _this2.animate();
      });
    }
  }, {
    key: "destroy",
    value: function destroy() {
      this.running = false;
      if (this.animationFrame) {
        cancelAnimationFrame(this.animationFrame);
        this.animationFrame = null;
      }
      window.removeEventListener('resize', this._handleResize);
      // Clear canvas
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
  }]);
}(); // Export to window
window.NeuralNetwork = NeuralNetwork;