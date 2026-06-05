/**
 * TypeWriter — Sequential typing animation
 * Types text character-by-character into a target element.
 */
class TypeWriter {
	constructor(element, options = {}) {
		this.element = element;
		this.text = options.text || (element ? element.getAttribute('data-text') : '') || '';
		this.speed = options.speed || 50;          // ms per character
		this.onComplete = options.onComplete || (() => {});
		this.onStart = options.onStart || (() => {});
		this.cursor = options.cursor !== false;
		this.index = 0;
		this.running = false;
	}

	start(delay = 0) {
		setTimeout(() => {
			this.running = true;
			this.index = 0;
			this.element.textContent = '';
			if (this.onStart) this.onStart();
			this._type();
		}, delay);
	}

	_type() {
		if (!this.running || !this.element) return;
		if (this.index < this.text.length) {
			this.element.textContent += this.text.charAt(this.index);
			this.index++;
			// Vary speed slightly for natural feel
			const variance = this.text.charAt(this.index - 1) === ' ' ? 0 : Math.random() * 30;
			setTimeout(() => this._type(), this.speed + variance);
		} else {
			this.running = false;
			if (this.cursor) {
				this.element.classList.add('done');
			}
			if (this.onComplete) this.onComplete();
		}
	}

	stop() {
		this.running = false;
	}
}

let neuralNetwork = null;

class GridAnimation {
	constructor(canvas, options = {}) {
		this.canvas = canvas;
		this.ctx = canvas.getContext("2d");
		this.options = {
			direction: options.direction || "right",
			speed: options.speed || 1,
			borderColor: options.borderColor || "rgba(255, 255, 255, 0.05)",
			squareSize: options.squareSize || 40,
			hoverFillColor: options.hoverFillColor || "rgba(255, 255, 255, 0.6)",
			hoverShadowColor: options.hoverShadowColor || "rgba(255, 255, 255, 0.3)",
			transitionDuration: options.transitionDuration || 200, // 过渡时间（毫秒）
			trailDuration: options.trailDuration || 1000, // 痕迹持续时间（毫秒）
			specialBlockColor:
				options.specialBlockColor || "rgba(255, 100, 100, 0.8)",
			specialHoverColor:
				options.specialHoverColor || "rgba(100, 255, 100, 0.8)",
			// 新增颜色渐变相关选项
			snakeHeadColor: options.snakeHeadColor || "rgba(255, 255, 255, 0.9)",
			snakeTailColor: options.snakeTailColor || "rgba(100, 100, 255, 0.3)",
			snakeGradientStops: options.snakeGradientStops || 5, // 渐变过渡的色块数
			snakeColorDecay: options.snakeColorDecay || 0.7, // 渐变衰减系数，越小衰减越快
			// 移动端触摸相关选项
			touchSensitivity: options.touchSensitivity || 1.0, // 触摸灵敏度
			vibrationEnabled: options.vibrationEnabled || false, // 是否启用震动反馈
			...options,
		};

		this.gridOffset = { x: 0, y: 0 };
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

	init() {
		this.resizeCanvas();
		this.setupEventListeners();

		// 移动端性能优化
		if (isPhone) {
			this.optimizeForMobile();
		}

		this.animate();

		// 在移动设备上延迟创建食物，确保画布大小计算正确
		if (isPhone) {
			setTimeout(() => {
				this.createSpecialBlock();
			}, 500);
		} else {
			this.createSpecialBlock();
		}

		// 添加页面可见性变化监听，在页面不可见时暂停动画
		document.addEventListener(
			visibilityChangeEvent,
			this.handleVisibilityChange.bind(this)
		);
	}

	optimizeForMobile() {
		// 检测设备性能, 默认高性能模式
		const canvas = this.canvas;
		const ctx = canvas.getContext("2d");

		// 简单的性能测试
		const startTime = performance.now();
		for (let i = 0; i < 1000; i++) {
			ctx.fillRect(0, 0, 1, 1);
		}
		const endTime = performance.now();
		const performanceScore = endTime - startTime;

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

	resizeCanvas() {
		// 处理设备像素比，确保在高DPR设备上（如iPhone）清晰渲染
		const dpr = window.devicePixelRatio || 1;
		const displayWidth = this.canvas.offsetWidth;
		const displayHeight = this.canvas.offsetHeight;

		// 设置画布大小为实际像素大小
		this.canvas.width = Math.floor(displayWidth * dpr);
		this.canvas.height = Math.floor(displayHeight * dpr);

		// 设置CSS尺寸为显示尺寸
		this.canvas.style.width = `${displayWidth}px`;
		this.canvas.style.height = `${displayHeight}px`;

		// 缩放上下文以匹配设备像素比
		this.ctx.scale(dpr, dpr);
	}

	setupEventListeners() {
		window.addEventListener("resize", () => this.resizeCanvas());
		this.canvas.addEventListener("mousemove", (e) => this.handleMouseMove(e));
		this.canvas.addEventListener("mouseleave", () => this.handleMouseLeave());

		// 移动端触摸事件处理
		if (isPhone) {
			this.setupTouchEvents();
		}

		// 监听设备方向变化，重新创建食物
		if (isPhone && window.orientation !== undefined) {
			window.addEventListener("orientationchange", () => {
				setTimeout(() => {
					this.resizeCanvas();
					this.createSpecialBlock();
				}, 300);
			});
		}
	}

	setupTouchEvents() {
		let touchStartPos = null;
		let touchMovePos = null;
		let isTouching = false;
		let lastTouchTime = 0;
		let touchCount = 0;

		// 保存事件处理函数引用以便后续移除
		this.handleTouchStart = (e) => {
			e.preventDefault();
			const now = Date.now();

			// 防止过于频繁的触摸事件
			if (now - lastTouchTime < 16) {
				// 约60fps限制
				return;
			}
			lastTouchTime = now;

			if (e.touches.length === 1) {
				const touch = e.touches[0];
				const rect = this.canvas.getBoundingClientRect();
				touchStartPos = {
					x: touch.clientX - rect.left,
					y: touch.clientY - rect.top,
					time: now,
				};
				isTouching = true;
				touchCount++;

				// 立即处理触摸开始位置
				this.handleTouchMove(touchStartPos.x, touchStartPos.y);

				// 如果之前没有蛇头，设置目标透明度
				if (!this.hoveredSquare) {
					this.targetOpacity = 0.8 * this.options.touchSensitivity;
				}

				// 添加触摸开始时的视觉反馈
				if (this.options.vibrationEnabled && navigator.vibrate) {
					navigator.vibrate(10); // 轻微震动反馈
				}
			}
		};

		this.handleTouchMoveEvent = (e) => {
			e.preventDefault();
			if (isTouching && e.touches.length === 1) {
				const touch = e.touches[0];
				const rect = this.canvas.getBoundingClientRect();
				touchMovePos = {
					x: touch.clientX - rect.left,
					y: touch.clientY - rect.top,
				};

				// 处理触摸移动
				this.handleTouchMove(touchMovePos.x, touchMovePos.y);
			}
		};

		this.handleTouchEndEvent = (e) => {
			e.preventDefault();
			const now = Date.now();

			// 检测双击手势
			if (touchStartPos && now - touchStartPos.time < 300) {
				touchCount++;
				if (touchCount === 2) {
					// 双击重置蛇身
					this.resetSnake();
					touchCount = 0;

					// 双击震动反馈
					if (this.options.vibrationEnabled && navigator.vibrate) {
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
			this.handleTouchEnd();
		};

		this.handleTouchCancel = (e) => {
			e.preventDefault();
			isTouching = false;
			touchStartPos = null;
			touchMovePos = null;
		};

		// 添加事件监听器
		this.canvas.addEventListener("touchstart", this.handleTouchStart, {
			passive: false,
		});
		this.canvas.addEventListener("touchmove", this.handleTouchMoveEvent, {
			passive: false,
		});
		this.canvas.addEventListener("touchend", this.handleTouchEndEvent, {
			passive: false,
		});
		this.canvas.addEventListener("touchcancel", this.handleTouchCancel, {
			passive: false,
		});
	}

	handleTouchMove(x, y) {
		const startX =
			Math.floor(this.gridOffset.x / this.options.squareSize) *
			this.options.squareSize;
		const startY =
			Math.floor(this.gridOffset.y / this.options.squareSize) *
			this.options.squareSize;

		const hoveredSquareX = Math.floor(
			(x + this.gridOffset.x - startX) / this.options.squareSize
		);
		const hoveredSquareY = Math.floor(
			(y + this.gridOffset.y - startY) / this.options.squareSize
		);

		if (
			this.hoveredSquare?.x !== hoveredSquareX ||
			this.hoveredSquare?.y !== hoveredSquareY
		) {
			// 将当前悬停的格子添加到蛇身
			if (this.hoveredSquare) {
				this.snakeBody.unshift({
					x: this.hoveredSquare.x,
					y: this.hoveredSquare.y,
				});

				// 如果没有吃到食物，移除蛇尾
				if (!this.shouldGrow && this.snakeBody.length > 0) {
					this.snakeBody.pop();
				}
				this.shouldGrow = false;
			}

			this.hoveredSquare = { x: hoveredSquareX, y: hoveredSquareY };
			// 当用户正在触摸时，设置较高的透明度
			this.targetOpacity = 0.8 * this.options.touchSensitivity;

			// 检查是否吃到食物
			if (
				this.specialBlock &&
				hoveredSquareX === this.specialBlock.x &&
				hoveredSquareY === this.specialBlock.y
			) {
				this.shouldGrow = true;
				this.createSpecialBlock();

				// 移动端吃到食物时的触觉反馈
				if (this.options.vibrationEnabled && navigator.vibrate) {
					navigator.vibrate(100);
				}
			}
		}
	}

	handleTouchEnd() {
		if (this.hoveredSquare) {
			// 将当前悬停的格子添加到蛇身
			this.snakeBody.unshift({
				x: this.hoveredSquare.x,
				y: this.hoveredSquare.y,
			});

			// 如果没有吃到食物，移除蛇尾
			if (!this.shouldGrow && this.snakeBody.length > 0) {
				this.snakeBody.pop();
			}
			this.shouldGrow = false;

			const startX =
				Math.floor(this.gridOffset.x / this.options.squareSize) *
				this.options.squareSize;
			const startY =
				Math.floor(this.gridOffset.y / this.options.squareSize) *
				this.options.squareSize;
			const key = `${this.hoveredSquare.x},${this.hoveredSquare.y}`;
			this.trailSquares.set(key, {
				x: this.hoveredSquare.x * this.options.squareSize + startX,
				y: this.hoveredSquare.y * this.options.squareSize + startY,
				opacity: 0.8,
			});
		}

		// 保持蛇身状态，不重置 hoveredSquare
		// 但降低透明度以显示触摸已结束
		if (this.hoveredSquare) {
			this.targetOpacity = 0.4; // 保持较低的透明度显示蛇头位置
		}
	}

	resetSnake() {
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

	handleMouseMove(event) {
		const rect = this.canvas.getBoundingClientRect();
		const mouseX = event.clientX - rect.left;
		const mouseY = event.clientY - rect.top;

		const startX =
			Math.floor(this.gridOffset.x / this.options.squareSize) *
			this.options.squareSize;
		const startY =
			Math.floor(this.gridOffset.y / this.options.squareSize) *
			this.options.squareSize;

		const hoveredSquareX = Math.floor(
			(mouseX + this.gridOffset.x - startX) / this.options.squareSize
		);
		const hoveredSquareY = Math.floor(
			(mouseY + this.gridOffset.y - startY) / this.options.squareSize
		);

		if (
			this.hoveredSquare?.x !== hoveredSquareX ||
			this.hoveredSquare?.y !== hoveredSquareY
		) {
			// 将当前悬停的格子添加到蛇身
			if (this.hoveredSquare) {
				this.snakeBody.unshift({
					x: this.hoveredSquare.x,
					y: this.hoveredSquare.y,
				});

				// 如果没有吃到食物，移除蛇尾
				if (!this.shouldGrow && this.snakeBody.length > 0) {
					this.snakeBody.pop();
				}
				this.shouldGrow = false;
			}

			this.hoveredSquare = { x: hoveredSquareX, y: hoveredSquareY };
			this.targetOpacity = 0.6;

			// 检查是否吃到食物
			if (
				this.specialBlock &&
				hoveredSquareX === this.specialBlock.x &&
				hoveredSquareY === this.specialBlock.y
			) {
				this.shouldGrow = true; // 标记蛇身需要增长
				this.createSpecialBlock(); // 吃到食物时立即生成新的食物
			}
		}
	}

	handleMouseLeave() {
		if (this.hoveredSquare) {
			const startX =
				Math.floor(this.gridOffset.x / this.options.squareSize) *
				this.options.squareSize;
			const startY =
				Math.floor(this.gridOffset.y / this.options.squareSize) *
				this.options.squareSize;
			const key = `${this.hoveredSquare.x},${this.hoveredSquare.y}`;
			this.trailSquares.set(key, {
				x: this.hoveredSquare.x * this.options.squareSize + startX,
				y: this.hoveredSquare.y * this.options.squareSize + startY,
				opacity: 0.6,
			});
		}
		this.hoveredSquare = null;
		this.targetOpacity = 0;
	}

	createSpecialBlock() {
		// 清除之前的定时器
		if (this.specialBlockTimer) {
			clearTimeout(this.specialBlockTimer);
		}

		// 获取设备像素比
		const dpr = window.devicePixelRatio || 1;

		// 随机生成特殊方块的位置
		const numSquaresX = Math.ceil(
			this.canvas.width / dpr / this.options.squareSize
		);
		const numSquaresY = Math.ceil(
			this.canvas.height / dpr / this.options.squareSize
		);

		// 确保食物不会生成在蛇身上和边缘
		let newX, newY;
		do {
			// 避开边缘，留出1格的空间
			newX = 1 + Math.floor(Math.random() * (numSquaresX - 2));
			newY = 1 + Math.floor(Math.random() * (numSquaresY - 2));
		} while (
			this.snakeBody.some((segment) => segment.x === newX && segment.y === newY)
		);

		this.specialBlock = {
			x: newX,
			y: newY,
			color: this.options.specialBlockColor,
			initialOffset: { ...this.gridOffset },
		};
	}

	drawGrid() {
		const dpr = window.devicePixelRatio || 1;

		// 清除前重置变换
		this.ctx.setTransform(1, 0, 0, 1, 0, 0);
		this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

		// 应用DPR比例
		this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

		const startX =
			Math.floor(this.gridOffset.x / this.options.squareSize) *
			this.options.squareSize;
		const startY =
			Math.floor(this.gridOffset.y / this.options.squareSize) *
			this.options.squareSize;

		// 增加边框线宽度，特别是在iOS设备上
		this.ctx.lineWidth = isPhone ? 1.0 : 0.5;

		// 为iOS设备优化渲染，避免边框闪烁
		if (isPhone) {
			this.ctx.translate(0.5, 0.5); // 在iOS上对齐像素
		}

		// 绘制蛇身
		this.snakeBody.forEach((segment, index) => {
			const squareX = Math.round(
				segment.x * this.options.squareSize +
					startX -
					(this.gridOffset.x % this.options.squareSize)
			);
			const squareY = Math.round(
				segment.y * this.options.squareSize +
					startY -
					(this.gridOffset.y % this.options.squareSize)
			);

			this.ctx.shadowColor = this.options.hoverShadowColor;
			this.ctx.shadowBlur = 15;
			this.ctx.shadowOffsetX = 0;
			this.ctx.shadowOffsetY = 0;

			// 计算蛇身颜色渐变
			if (index === 0) {
				// 蛇头使用特殊颜色
				this.ctx.fillStyle = this.options.snakeHeadColor;
			} else {
				// 计算渐变系数
				const gradientFactor = Math.pow(this.options.snakeColorDecay, index);

				// 解析头部和尾部颜色
				const headColorMatch = this.options.snakeHeadColor.match(
					/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([.\d]+))?\)/
				);
				const tailColorMatch = this.options.snakeTailColor.match(
					/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([.\d]+))?\)/
				);

				if (headColorMatch && tailColorMatch) {
					const headR = parseInt(headColorMatch[1]);
					const headG = parseInt(headColorMatch[2]);
					const headB = parseInt(headColorMatch[3]);
					const headA = headColorMatch[4] ? parseFloat(headColorMatch[4]) : 1;

					const tailR = parseInt(tailColorMatch[1]);
					const tailG = parseInt(tailColorMatch[2]);
					const tailB = parseInt(tailColorMatch[3]);
					const tailA = tailColorMatch[4] ? parseFloat(tailColorMatch[4]) : 1;

					// 计算中间渐变色
					const r = Math.round(headR + (tailR - headR) * (1 - gradientFactor));
					const g = Math.round(headG + (tailG - headG) * (1 - gradientFactor));
					const b = Math.round(headB + (tailB - headB) * (1 - gradientFactor));
					const a = headA + (tailA - headA) * (1 - gradientFactor);

					this.ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${a})`;
				} else {
					// 回退到简单透明度渐变
					const opacity = Math.max(0.2, gradientFactor);
					this.ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
				}
			}

			this.ctx.fillRect(
				squareX,
				squareY,
				this.options.squareSize,
				this.options.squareSize
			);

			this.ctx.shadowColor = "transparent";
			this.ctx.shadowBlur = 0;
		});

		// 绘制当前悬停的格子和食物
		for (
			let x = startX;
			x < this.canvas.width + this.options.squareSize;
			x += this.options.squareSize
		) {
			for (
				let y = startY;
				y < this.canvas.height + this.options.squareSize;
				y += this.options.squareSize
			) {
				const squareX = Math.round(
					x - (this.gridOffset.x % this.options.squareSize)
				);
				const squareY = Math.round(
					y - (this.gridOffset.y % this.options.squareSize)
				);
				const gridX = Math.floor((x - startX) / this.options.squareSize);
				const gridY = Math.floor((y - startY) / this.options.squareSize);

				// 绘制食物
				if (
					this.specialBlock &&
					gridX === this.specialBlock.x &&
					gridY === this.specialBlock.y
				) {
					this.ctx.shadowColor = "rgba(255, 255, 255, 0.5)";
					this.ctx.shadowBlur = 20;
					this.ctx.fillStyle = this.specialBlock.color;
					this.ctx.fillRect(
						squareX,
						squareY,
						this.options.squareSize,
						this.options.squareSize
					);
					this.ctx.shadowColor = "transparent";
					this.ctx.shadowBlur = 0;
				}

				// 绘制当前悬停的格子（蛇头）
				if (
					this.hoveredSquare &&
					gridX === this.hoveredSquare.x &&
					gridY === this.hoveredSquare.y
				) {
					this.ctx.shadowColor = this.options.hoverShadowColor;
					this.ctx.shadowBlur = 15;
					this.ctx.shadowOffsetX = 0;
					this.ctx.shadowOffsetY = 0;

					const color = this.options.hoverFillColor.replace(
						"0.6",
						this.currentOpacity.toString()
					);
					this.ctx.fillStyle = color;
					this.ctx.fillRect(
						squareX,
						squareY,
						this.options.squareSize,
						this.options.squareSize
					);

					this.ctx.shadowColor = "transparent";
					this.ctx.shadowBlur = 0;
				}

				this.ctx.strokeStyle = this.options.borderColor;
				this.ctx.strokeRect(
					squareX,
					squareY,
					this.options.squareSize,
					this.options.squareSize
				);
			}
		}

		// 移动设备上重置坐标变换
		if (isPhone) {
			this.ctx.translate(-0.5, -0.5);
		}

		// 创建径向渐变来实现暗角效果
		const gradient = this.ctx.createRadialGradient(
			this.canvas.width / dpr / 2,
			this.canvas.height / dpr / 2,
			0,
			this.canvas.width / dpr / 2,
			this.canvas.height / dpr / 2,
			Math.sqrt(
				Math.pow(this.canvas.width / dpr, 2) +
					Math.pow(this.canvas.height / dpr, 2)
			) / 2
		);
		gradient.addColorStop(0, "rgba(6, 6, 6, 0)");
		gradient.addColorStop(1, "#060606");

		this.ctx.fillStyle = gradient;
		this.ctx.fillRect(0, 0, this.canvas.width / dpr, this.canvas.height / dpr);
	}

	updateAnimation(timestamp) {
		if (!this.lastTimestamp) {
			this.lastTimestamp = timestamp;
		}

		const deltaTime = timestamp - this.lastTimestamp;
		this.lastTimestamp = timestamp;

		// 更新透明度
		if (this.currentOpacity !== this.targetOpacity) {
			const progress = Math.min(deltaTime / this.options.transitionDuration, 1);
			this.currentOpacity =
				this.currentOpacity +
				(this.targetOpacity - this.currentOpacity) * progress;
		}

		// 更新痕迹格子的透明度
		for (const [key, square] of this.trailSquares) {
			square.opacity -= deltaTime / this.options.trailDuration;
			if (square.opacity <= 0) {
				this.trailSquares.delete(key);
			}
		}

		// 获取设备像素比
		const dpr = window.devicePixelRatio || 1;

		// 更新网格位置，为移动设备降低速度以减少闪烁
		const effectiveSpeed = Math.max(
			isPhone ? this.options.speed * 0.8 : this.options.speed,
			0
		);

		// 确保移动位置为整数值来避免子像素渲染导致的闪烁
		const moveAmount = isPhone
			? Math.round(effectiveSpeed * 100) / 100
			: effectiveSpeed;

		switch (this.options.direction) {
			case "right":
				this.gridOffset.x =
					(this.gridOffset.x - moveAmount + this.options.squareSize) %
					this.options.squareSize;
				break;
			case "left":
				this.gridOffset.x =
					(this.gridOffset.x + moveAmount + this.options.squareSize) %
					this.options.squareSize;
				break;
			case "up":
				this.gridOffset.y =
					(this.gridOffset.y + moveAmount + this.options.squareSize) %
					this.options.squareSize;
				break;
			case "down":
				this.gridOffset.y =
					(this.gridOffset.y - moveAmount + this.options.squareSize) %
					this.options.squareSize;
				break;
			case "diagonal":
				this.gridOffset.x =
					(this.gridOffset.x - moveAmount + this.options.squareSize) %
					this.options.squareSize;
				this.gridOffset.y =
					(this.gridOffset.y - moveAmount + this.options.squareSize) %
					this.options.squareSize;
				break;
		}

		// 检查食物是否移出屏幕
		if (this.specialBlock) {
			const startX =
				Math.floor(this.gridOffset.x / this.options.squareSize) *
				this.options.squareSize;
			const startY =
				Math.floor(this.gridOffset.y / this.options.squareSize) *
				this.options.squareSize;
			const foodX = Math.round(
				this.specialBlock.x * this.options.squareSize +
					startX -
					(this.gridOffset.x % this.options.squareSize)
			);
			const foodY = Math.round(
				this.specialBlock.y * this.options.squareSize +
					startY -
					(this.gridOffset.y % this.options.squareSize)
			);

			// 调整适用于设备像素比的边界检查
			if (
				foodX < -this.options.squareSize ||
				foodX > this.canvas.width / dpr ||
				foodY < -this.options.squareSize ||
				foodY > this.canvas.height / dpr
			) {
				// 食物移出屏幕时生成新的食物
				this.createSpecialBlock();
			}
		}

		this.drawGrid();
		this.animationFrame = requestAnimationFrame((timestamp) =>
			this.updateAnimation(timestamp)
		);
	}

	animate() {
		this.animationFrame = requestAnimationFrame((timestamp) =>
			this.updateAnimation(timestamp)
		);
	}

	handleVisibilityChange() {
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

	destroy() {
		if (this.animationFrame) {
			cancelAnimationFrame(this.animationFrame);
		}
		window.removeEventListener("resize", () => this.resizeCanvas());
		this.canvas.removeEventListener("mousemove", (e) =>
			this.handleMouseMove(e)
		);
		this.canvas.removeEventListener("mouseleave", () =>
			this.handleMouseLeave()
		);

		// 移除触摸事件监听器
		if (isPhone && this.handleTouchStart) {
			this.canvas.removeEventListener("touchstart", this.handleTouchStart);
			this.canvas.removeEventListener("touchmove", this.handleTouchMoveEvent);
			this.canvas.removeEventListener("touchend", this.handleTouchEndEvent);
			this.canvas.removeEventListener("touchcancel", this.handleTouchCancel);
		}

		document.removeEventListener(
			visibilityChangeEvent,
			this.handleVisibilityChange.bind(this)
		);

		// 移除方向变化监听
		if (isPhone && window.orientation !== undefined) {
			window.removeEventListener("orientationchange", () => {});
		}
	}
}

window.hiddenProperty =
	"hidden" in document
		? "hidden"
		: "webkitHidden" in document
		? "webkitHidden"
		: "mozHidden" in document
		? "mozHidden"
		: null;

window.DIRECTIONS = {
	UP: "UP",
	DOWN: "DOWN",
	LEFT: "LEFT",
	RIGHT: "RIGHT",
	UNDIRECTED: "UNDIRECTED",
};
window.isPhone =
	/Mobile|Android|iOS|iPhone|iPad|iPod|Windows Phone|KFAPWI/i.test(
		navigator.userAgent
	);

function getMoveDirection(startx, starty, endx, endy) {
	if (!isPhone) {
		return;
	}

	const angx = endx - startx;
	const angy = endy - starty;

	if (Math.abs(angx) < 2 && Math.abs(angy) < 2) {
		return DIRECTIONS.UNDIRECTED;
	}

	const getAngle = (angx, angy) => (Math.atan2(angy, angx) * 180) / Math.PI;

	const angle = getAngle(angx, angy);
	if (angle >= -135 && angle <= -45) {
		return DIRECTIONS.UP;
	} else if (angle > 45 && angle < 135) {
		return DIRECTIONS.DOWN;
	} else if (
		(angle >= 135 && angle <= 180) ||
		(angle >= -180 && angle < -135)
	) {
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
	const neuralCanvas = document.getElementById('neuralCanvas');
	if (neuralCanvas && !neuralNetwork) {
		neuralNetwork = new NeuralNetwork(neuralCanvas, {
			nodeCount: isPhone ? 30 : 50,
			connectionDistance: isPhone ? 120 : 160,
			packetCount: isPhone ? 15 : 30,
			packetSpeed: 0.6,
			driftSpeed: 0.12,
		});
		neuralNetwork.init();
	}

	// Fade in wrap
	setTimeout(() => {
		$(".wrap").classList.add("in");
		startTypingSequence();
	}, 300);
}

function startTypingSequence() {
	const userTextEl = $('.typing-text');
	const thinkingEl = $('.ai-thinking');
	const titleEl = $('.content-title');
	const subtitleEl = $('.content-subtitle');
	const enterEl = $('.enter');

	// Start with enter hidden
	enterEl.style.opacity = '0';
	enterEl.style.pointerEvents = 'none';

	// Step 1: Type user prompt
	const userWriter = new TypeWriter(userTextEl, {
		text: userTextEl.getAttribute('data-text') || '',
		speed: 45,
		onComplete: () => {
			// Step 2: Show AI thinking dots, then show AI response
			setTimeout(() => {
				// Show AI response elements
				thinkingEl.classList.add('hidden');
				titleEl.style.display = '';
				subtitleEl.style.display = '';

				// Step 3: Type the name
				const nameWriter = new TypeWriter(titleEl, {
					text: titleEl.textContent || '',
					speed: 80,
					cursor: false,
					onComplete: () => {
						// Step 4: Type the subtitle
						const subtitleText = subtitleEl.getAttribute('original-content') || '';
						subtitleEl.textContent = '';
						const subWriter = new TypeWriter(subtitleEl, {
							text: subtitleText,
							speed: 35,
							cursor: false,
							onComplete: () => {
								// Step 5: Show enter button
								enterEl.style.opacity = '1';
								enterEl.style.pointerEvents = 'auto';
								enterEl.style.transition = 'opacity 0.6s ease';
							},
						});
						subWriter.start(200);
					},
				});
				nameWriter.start(0);
			}, 600);
		},
	});

	userWriter.start(400);
}

function switchPage() {
	if (switchPage.switched) {
		return;
	}
	const DOM = {
		intro: $(".content-intro"),
		path: $(".shape-wrap path"),
		shape: $("svg.shape"),
	};
	DOM.shape.style.transformOrigin = "50% 0%";

	anime({
		targets: DOM.intro,
		duration: 1100,
		easing: "easeInOutSine",
		translateY: "-200vh",
	});

	anime({
		targets: DOM.shape,
		scaleY: [
			{
				value: [0.8, 1.8],
				duration: 550,
				easing: "easeInQuad",
			},
			{
				value: 1,
				duration: 550,
				easing: "easeOutQuad",
			},
		],
	});
	anime({
		targets: DOM.path,
		duration: 1100,
		easing: "easeOutQuad",
		d: DOM.path.getAttribute("pathdata:id"),
		complete: function (anim) {
			if (canvas) {
				cancelAnimationFrame(animationID);
				canvas.parentElement.removeChild(canvas);
				canvas = null;
			}
			if (neuralNetwork) {
				neuralNetwork.destroy();
				const nc = document.getElementById('neuralCanvas');
				if (nc && nc.parentElement) {
					nc.parentElement.removeChild(nc);
				}
				neuralNetwork = null;
			}
		},
	});

	switchPage.switched = true;
}

function loadMain() {
	if (loadMain.loaded) {
		return;
	}
	setTimeout(() => {
		$(".card-inner").classList.add("in");
		setTimeout(() => {
			const canvas = document.getElementById("gridCanvas");
			if (canvas) {
				const gridAnimation = new GridAnimation(canvas, {
					direction: "diagonal",
					speed: isPhone ? 0.03 : 0.05,
					borderColor: isPhone
						? "rgba(255, 255, 255, 0.2)"
						: "rgba(255, 255, 255, 0.1)",
					squareSize: isPhone ? 50 : 40,
					hoverFillColor: "rgba(255, 255, 255, 0.8)",
					hoverShadowColor: "rgba(255, 255, 255, 0.8)",
					transitionDuration: isPhone ? 150 : 200, // 移动端更快的过渡
					trailDuration: isPhone ? 2000 : 1500, // 移动端更长的痕迹
					specialBlockColor: "rgba(100, 255, 152, 0.8)",
					specialHoverColor: "rgba(29, 202, 29, 0.8)",
					// 蛇身颜色渐变配置
					snakeHeadColor: "rgba(255, 255, 255, 0.95)",
					snakeTailColor: "rgba(218, 231, 255, 0.25)",
					snakeColorDecay: 0.85, // 颜色衰减系数
					// 移动端特殊配置
					touchSensitivity: isPhone ? 1.2 : 1.0, // 触摸灵敏度
					vibrationEnabled: isPhone, // 是否启用震动反馈
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

	const practiceEl = $('.content-practice');
	const mainEl = $('.content-main');

	anime({
		targets: mainEl,
		duration: 800,
		easing: 'easeInOutSine',
		translateY: '-100vh',
		opacity: [1, 0.3],
	});

	anime({
		targets: practiceEl,
		duration: 800,
		easing: 'easeOutSine',
		translateY: ['100vh', '0vh'],
		complete: function () {
			loadPractice();
		},
	});
}

function switchFromPractice() {
	if (!switchToPractice.switched) return;
	switchToPractice.switched = false;

	const practiceEl = $('.content-practice');
	const mainEl = $('.content-main');

	if (loadPractice.loaded) {
		loadPractice.loaded = false;
	}

	anime({
		targets: practiceEl,
		duration: 600,
		easing: 'easeInSine',
		translateY: ['0vh', '100vh'],
		complete: function () {
			practiceEl.style.transform = '';
			resetPracticePage();
		},
	});

	anime({
		targets: mainEl,
		duration: 600,
		easing: 'easeInOutSine',
		translateY: ['-100vh', '0vh'],
		opacity: [0.3, 1],
	});
}

function loadPractice() {
	if (loadPractice.loaded) return;
	loadPractice.loaded = true;

	const wrapEl = $('.content-practice .wrap');
	if (wrapEl) wrapEl.classList.add('in');

	const userTextEl = $('.content-practice .typing-text');
	const thinkingEl = $('.content-practice .ai-thinking');
	const detailsEl = $('.content-practice .practice-details');
	const backEl = $('.practice-back');

	backEl.style.opacity = '0';
	backEl.style.pointerEvents = 'none';

	const userWriter = new TypeWriter(userTextEl, {
		text: userTextEl.getAttribute('data-text') || '',
		speed: 40,
		onComplete: () => {
			setTimeout(() => {
				thinkingEl.classList.add('hidden');
				detailsEl.style.display = '';
				// Animate elements in sequence
				const titleEl = $('.practice-title');
				const descEl = $('.practice-desc');
				const videoEl = $('.video-wrapper');

				titleEl.style.opacity = '0';
				titleEl.style.transform = 'translateY(10px)';
				titleEl.style.transition = 'all 0.5s ease';
				descEl.style.opacity = '0';
				descEl.style.transform = 'translateY(10px)';
				descEl.style.transition = 'all 0.5s ease';
				videoEl.style.opacity = '0';
				videoEl.style.transform = 'translateY(10px)';
				videoEl.style.transition = 'all 0.5s ease';

				setTimeout(() => {
					titleEl.style.opacity = '1';
					titleEl.style.transform = 'translateY(0)';
				}, 100);

				setTimeout(() => {
					descEl.style.opacity = '1';
					descEl.style.transform = 'translateY(0)';
				}, 350);

				setTimeout(() => {
					videoEl.style.opacity = '1';
					videoEl.style.transform = 'translateY(0)';
					backEl.style.opacity = '1';
					backEl.style.pointerEvents = 'auto';
					backEl.style.transition = 'opacity 0.6s ease';
					// Setup video play button
					setupVideoPlayback();
				}, 600);
			}, 500);
		},
	});
	userWriter.start(300);
}

function setupVideoPlayback() {
	const video = document.getElementById('practiceVideo');
	const placeholder = $('.content-practice .video-placeholder');
	const playIcon = $('.content-practice .play-icon');
	const placeholderText = $('.content-practice .placeholder-text');

	if (!video || !placeholder) return;

	// Click placeholder to play
	placeholder.style.cursor = 'pointer';
	const clickHandler = function () {
		video.play().then(() => {
			placeholder.style.opacity = '0';
			placeholder.style.pointerEvents = 'none';
			placeholder.style.transition = 'opacity 0.3s ease';
		}).catch(() => {
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
	const thinkingEl = $('.content-practice .ai-thinking');
	const detailsEl = $('.content-practice .practice-details');
	const userTextEl = $('.content-practice .typing-text');
	const backEl = $('.practice-back');
	const wrapEl = $('.content-practice .wrap');
	const titleEl = $('.practice-title');
	const descEl = $('.practice-desc');
	const videoEl = $('.video-wrapper');
	const placeholderEl = $('.content-practice .video-placeholder');
	const playIcon = $('.content-practice .play-icon');
	const placeholderText = $('.content-practice .placeholder-text');
	const video = document.getElementById('practiceVideo');

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
	if (titleEl) { titleEl.style.opacity = '0'; titleEl.style.transform = 'translateY(10px)'; }
	if (descEl) { descEl.style.opacity = '0'; descEl.style.transform = 'translateY(10px)'; }
	if (videoEl) { videoEl.style.opacity = '0'; videoEl.style.transform = 'translateY(10px)'; }
}

// About page transition
function switchToAbout() {
	if (switchToAbout.switched) return;
	switchToAbout.switched = true;

	const aboutEl = $('.content-about');
	const mainEl = $('.content-main');

	anime({
		targets: mainEl,
		duration: 800,
		easing: 'easeInOutSine',
		translateY: '-100vh',
		opacity: [1, 0.3],
	});

	anime({
		targets: aboutEl,
		duration: 800,
		easing: 'easeOutSine',
		translateY: ['100vh', '0vh'],
		complete: function () {
			loadAbout();
		},
	});
}

function switchFromAbout() {
	if (!switchToAbout.switched) return;
	switchToAbout.switched = false;

	const aboutEl = $('.content-about');
	const mainEl = $('.content-main');

	if (loadAbout.loaded) {
		loadAbout.loaded = false;
	}

	anime({
		targets: aboutEl,
		duration: 600,
		easing: 'easeInSine',
		translateY: ['0vh', '100vh'],
		complete: function () {
			aboutEl.style.transform = '';
			resetAboutPage();
		},
	});

	anime({
		targets: mainEl,
		duration: 600,
		easing: 'easeInOutSine',
		translateY: ['-100vh', '0vh'],
		opacity: [0.3, 1],
	});
}

function loadAbout() {
	if (loadAbout.loaded) return;
	loadAbout.loaded = true;

	const wrapEl = $('.content-about .wrap');
	const userTextEl = $('.content-about .typing-text');
	const thinkingEl = $('.content-about .ai-thinking');
	const detailsEl = $('.content-about .placeholder-content');
	const backEl = $('.about-back');

	if (wrapEl) wrapEl.classList.add('in');

	backEl.style.opacity = '0';
	backEl.style.pointerEvents = 'none';


	const userWriter = new TypeWriter(userTextEl, {
		text: userTextEl.getAttribute('data-text') || '',
		speed: 40,
		onComplete: () => {
			setTimeout(() => {
				thinkingEl.classList.add('hidden');
				detailsEl.style.display = '';
				detailsEl.style.opacity = '0';
				detailsEl.style.transform = 'translateY(10px)';
				detailsEl.style.transition = 'all 0.5s ease';
				setTimeout(() => {
					detailsEl.style.opacity = '1';
					detailsEl.style.transform = 'translateY(0)';
					backEl.style.opacity = '1';
					backEl.style.pointerEvents = 'auto';
					backEl.style.transition = 'opacity 0.6s ease';
				}, 100);
			}, 500);
		},
	});
	userWriter.start(300);
}

function resetAboutPage() {
	const thinkingEl = $('.content-about .ai-thinking');
	const detailsEl = $('.content-about .placeholder-content');
	const userTextEl = $('.content-about .typing-text');
	const backEl = $('.about-back');
	const wrapEl = $('.content-about .wrap');

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

	const projectsEl = $('.content-projects');
	const mainEl = $('.content-main');

	anime({
		targets: mainEl,
		duration: 800,
		easing: 'easeInOutSine',
		translateY: '-100vh',
		opacity: [1, 0.3],
	});

	anime({
		targets: projectsEl,
		duration: 800,
		easing: 'easeOutSine',
		translateY: ['100vh', '0vh'],
		complete: function () {
			loadProjects();
		},
	});
}

function switchFromProjects() {
	if (!switchToProjects.switched) return;
	switchToProjects.switched = false;

	const projectsEl = $('.content-projects');
	const mainEl = $('.content-main');

	if (loadProjects.loaded) {
		loadProjects.loaded = false;
	}

	anime({
		targets: projectsEl,
		duration: 600,
		easing: 'easeInSine',
		translateY: ['0vh', '100vh'],
		complete: function () {
			projectsEl.style.transform = '';
			resetProjectsPage();
		},
	});

	anime({
		targets: mainEl,
		duration: 600,
		easing: 'easeInOutSine',
		translateY: ['-100vh', '0vh'],
		opacity: [0.3, 1],
	});
}

function loadProjects() {
	if (loadProjects.loaded) return;
	loadProjects.loaded = true;

	const wrapEl = $('.content-projects .wrap');
	if (wrapEl) wrapEl.classList.add('in');

	const userTextEl = $('.content-projects .typing-text');
	const thinkingEl = $('.content-projects .ai-thinking');
	const detailsEl = $('.content-projects .placeholder-content');
	const backEl = $('.projects-back');

	backEl.style.opacity = '0';
	backEl.style.pointerEvents = 'none';

	const userWriter = new TypeWriter(userTextEl, {
		text: userTextEl.getAttribute('data-text') || '',
		speed: 40,
		onComplete: () => {
			setTimeout(() => {
				thinkingEl.classList.add('hidden');
				detailsEl.style.display = '';
				detailsEl.style.opacity = '0';
				detailsEl.style.transform = 'translateY(10px)';
				detailsEl.style.transition = 'all 0.5s ease';
				setTimeout(() => {
					detailsEl.style.opacity = '1';
					detailsEl.style.transform = 'translateY(0)';
					backEl.style.opacity = '1';
					backEl.style.pointerEvents = 'auto';
					backEl.style.transition = 'opacity 0.6s ease';
				}, 100);
			}, 500);
		},
	});
	userWriter.start(300);
}

function resetProjectsPage() {
	const thinkingEl = $('.content-projects .ai-thinking');
	const detailsEl = $('.content-projects .placeholder-content');
	const userTextEl = $('.content-projects .typing-text');
	const backEl = $('.projects-back');
	const wrapEl = $('.content-projects .wrap');

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

	const contactEl = $('.content-contact');
	const mainEl = $('.content-main');

	anime({
		targets: mainEl,
		duration: 800,
		easing: 'easeInOutSine',
		translateY: '-100vh',
		opacity: [1, 0.3],
	});

	anime({
		targets: contactEl,
		duration: 800,
		easing: 'easeOutSine',
		translateY: ['100vh', '0vh'],
		complete: function () {
			loadContact();
		},
	});
}

function switchFromContact() {
	if (!switchToContact.switched) return;
	switchToContact.switched = false;

	const contactEl = $('.content-contact');
	const mainEl = $('.content-main');

	// Reset contact typing state
	if (loadContact.loaded) {
		loadContact.loaded = false;
	}

	anime({
		targets: contactEl,
		duration: 600,
		easing: 'easeInSine',
		translateY: ['0vh', '100vh'],
		complete: function () {
			contactEl.style.transform = '';
			resetContactPage();
		},
	});

	anime({
		targets: mainEl,
		duration: 600,
		easing: 'easeInOutSine',
		translateY: ['-100vh', '0vh'],
		opacity: [0.3, 1],
	});
}

function loadContact() {
	if (loadContact.loaded) return;
	loadContact.loaded = true;

	// Fade in the wrap
	const wrapEl = $('.content-contact .wrap');
	if (wrapEl) wrapEl.classList.add('in');

	const userTextEl = $('.content-contact .typing-text');
	const thinkingEl = $('.content-contact .ai-thinking');
	const detailsEl = $('.content-contact .contact-details');
	const backEl = $('.contact-back');

	backEl.style.opacity = '0';
	backEl.style.pointerEvents = 'none';

	const userWriter = new TypeWriter(userTextEl, {
		text: userTextEl.getAttribute('data-text') || '',
		speed: 40,
		onComplete: () => {
			setTimeout(() => {
				thinkingEl.classList.add('hidden');
				detailsEl.style.display = '';
				animateContactItems(() => {
					backEl.style.opacity = '1';
					backEl.style.pointerEvents = 'auto';
					backEl.style.transition = 'opacity 0.6s ease';
				});
			}, 500);
		},
	});
	userWriter.start(300);
}

function animateContactItems(callback) {
	const items = document.querySelectorAll('.contact-item');
	if (!items.length) {
		if (callback) callback();
		return;
	}

	items.forEach((item, index) => {
		item.style.opacity = '0';
		item.style.transform = 'translateX(-20px)';
		item.style.transition = 'all 0.4s ease';

		setTimeout(() => {
			item.style.opacity = '1';
			item.style.transform = 'translateX(0)';
			if (index === items.length - 1 && callback) {
				setTimeout(callback, 400);
			}
		}, 200 + index * 150);
	});
}

function resetContactPage() {
	const thinkingEl = $('.content-contact .ai-thinking');
	const detailsEl = $('.content-contact .contact-details');
	const userTextEl = $('.content-contact .typing-text');
	const backEl = $('.contact-back');
	const wrapEl = $('.content-contact .wrap');
	const items = document.querySelectorAll('.contact-item');

	if (wrapEl) wrapEl.classList.remove('in');
	thinkingEl.classList.remove('hidden');
	detailsEl.style.display = 'none';
	userTextEl.textContent = ' ';
	userTextEl.classList.remove('done');
	backEl.style.opacity = '0';
	backEl.style.pointerEvents = 'none';
	items.forEach(item => {
		item.style.opacity = '0';
		item.style.transform = 'translateX(-20px)';
	});
}

window.visibilityChangeEvent = hiddenProperty.replace(
	/hidden/i,
	"visibilitychange"
);
window.addEventListener(visibilityChangeEvent, loadIntro);
window.addEventListener("DOMContentLoaded", loadIntro);

const enterEl = $(".enter");
enterEl.addEventListener("click", loadAll);
enterEl.addEventListener("touchenter", loadAll);

function handleScrollEvent(e) {
	const deltaY = e.deltaY || e.wheelDelta * -1 || e.detail;
	if (deltaY > 0) {
		loadAll();
	}
}

document.body.addEventListener("wheel", handleScrollEvent, { passive: true });
document.body.addEventListener("mousewheel", handleScrollEvent, {
	passive: true,
});
document.body.addEventListener("DOMMouseScroll", handleScrollEvent, {
	passive: true,
}); // Firefox兼容
$(".arrow").addEventListener("mouseenter", loadAll);

if (isPhone) {
	document.addEventListener(
		"touchstart",
		function (e) {
			window.startx = e.touches[0].pageX;
			window.starty = e.touches[0].pageY;
		},
		{ passive: true }
	);
	document.addEventListener(
		"touchend",
		function (e) {
			let endx, endy;
			endx = e.changedTouches[0].pageX;
			endy = e.changedTouches[0].pageY;

			const direction = getMoveDirection(startx, starty, endx, endy);
			if (direction !== DIRECTIONS.UP) {
				return;
			}
			loadAll();
		},
		{ passive: true }
	);
}

// Contact page event listeners
const contactLink = document.querySelector('.content-main a[href="#contact"]');
if (contactLink) {
	contactLink.addEventListener('click', function (e) {
		e.preventDefault();
		switchToContact();
	});
}

const contactBack = $('.contact-back');
if (contactBack) {
	contactBack.addEventListener('click', switchFromContact);
}

// Practice page event listeners
const practiceLink = document.querySelector('.content-main a[href="#ai-practice"]');
if (practiceLink) {
	practiceLink.addEventListener('click', function (e) {
		e.preventDefault();
		switchToPractice();
	});
}

const practiceBack = $('.practice-back');
if (practiceBack) {
	practiceBack.addEventListener('click', switchFromPractice);
}

// About page event listeners
const aboutLink = document.querySelector('.content-main a[href="#about"]');
if (aboutLink) {
	aboutLink.addEventListener('click', function (e) {
		e.preventDefault();
		switchToAbout();
	});
}

const aboutBack = $('.about-back');
if (aboutBack) {
	aboutBack.addEventListener('click', switchFromAbout);
}

// Projects page event listeners
const projectsLink = document.querySelector('.content-main a[href="#projects"]');
if (projectsLink) {
	projectsLink.addEventListener('click', function (e) {
		e.preventDefault();
		switchToProjects();
	});
}

const projectsBack = $('.projects-back');
if (projectsBack) {
	projectsBack.addEventListener('click', switchFromProjects);
}
