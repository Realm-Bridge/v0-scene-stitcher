/**
 * Scene Stitcher — Layout Canvas
 *
 * A self-contained drag-and-drop canvas for positioning scene thumbnails.
 * Renders to an HTML <canvas> element and manages:
 *   - Scene thumbnail rendering with proportional scaling
 *   - Drag to reposition
 *   - Zoom (scroll wheel + toolbar buttons) centred on cursor, 10%–400%
 *   - Pan (middle-click or Ctrl+drag)
 *   - Independent snap-to-edge on X, Y, or both axes
 *   - Visual snap guides
 *   - Hover tooltip with larger scene preview
 *   - Bounding box overlay
 */

const MIN_ZOOM = 0.1;
const MAX_ZOOM = 4.0;
const ZOOM_STEP = 0.1;
const SNAP_THRESHOLD = 12; // pixels in canvas-space

/**
 * @typedef {Object} SceneEntry
 * @property {string} sceneId
 * @property {string} name
 * @property {number} width      - Scene pixel width
 * @property {number} height     - Scene pixel height
 * @property {string|null} backgroundSrc
 * @property {string|null} thumbnail
 * @property {number} x          - Position x in scene-pixel space
 * @property {number} y          - Position y in scene-pixel space
 */

export class LayoutCanvas {
  /**
   * @param {HTMLCanvasElement} canvas
   * @param {Object} [options]
   * @param {Function} [options.onLayoutChange] - Called when layout changes
   */
  constructor(canvas, options = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.onLayoutChange = options.onLayoutChange ?? (() => {});

    /** @type {SceneEntry[]} */
    this.scenes = [];

    // Viewport state
    this.zoom = 1.0;
    this.panX = 0;
    this.panY = 0;

    // Interaction state
    this._dragging = null; // { index, startX, startY, origX, origY }
    this._panning = false;
    this._panStart = { x: 0, y: 0 };
    this._hoveredIndex = -1;

    // Snap settings
    this.snapX = true;
    this.snapY = true;

    // Snap guide state (for rendering)
    this._snapGuides = []; // { axis: 'x'|'y', value: number }

    // Image cache for thumbnails
    this._imageCache = new Map();

    // Tooltip element
    this._tooltip = null;

    this._bindEvents();
    this._createTooltip();
  }

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  /**
   * Set the scenes to display in the canvas.
   * Lays them out in an initial grid arrangement.
   *
   * @param {Array<{sceneId: string, name: string, width: number, height: number, backgroundSrc: string|null, thumbnail: string|null}>} sceneInfos
   */
  setScenes(sceneInfos) {
    // Arrange in a horizontal row initially, with some gap
    const gap = 20;
    let currentX = gap;

    this.scenes = sceneInfos.map((info) => {
      const entry = {
        sceneId: info.sceneId ?? info.id,
        name: info.name,
        width: info.width,
        height: info.height,
        backgroundSrc: info.backgroundSrc,
        thumbnail: info.thumbnail,
        x: currentX,
        y: gap,
      };
      currentX += info.width + gap;
      return entry;
    });

    // Pre-load images
    for (const scene of this.scenes) {
      this._loadImage(scene);
    }

    this.fitAll();
  }

  /**
   * Get the current layout positions for the merge engine.
   *
   * @returns {Array<{sceneId: string, x: number, y: number, width: number, height: number}>}
   */
  getLayout() {
    return this.scenes.map((s) => ({
      sceneId: s.sceneId,
      x: s.x,
      y: s.y,
      width: s.width,
      height: s.height,
    }));
  }

  /**
   * Fit all scenes into the visible canvas area.
   */
  fitAll() {
    if (this.scenes.length === 0) return;

    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;
    for (const s of this.scenes) {
      minX = Math.min(minX, s.x);
      minY = Math.min(minY, s.y);
      maxX = Math.max(maxX, s.x + s.width);
      maxY = Math.max(maxY, s.y + s.height);
    }

    const contentWidth = maxX - minX;
    const contentHeight = maxY - minY;
    const padding = 40;

    const scaleX = (this.canvas.width - padding * 2) / contentWidth;
    const scaleY = (this.canvas.height - padding * 2) / contentHeight;
    this.zoom = Math.min(scaleX, scaleY, MAX_ZOOM);
    this.zoom = Math.max(this.zoom, MIN_ZOOM);

    // Centre the content
    this.panX = (this.canvas.width / 2) - ((minX + contentWidth / 2) * this.zoom);
    this.panY = (this.canvas.height / 2) - ((minY + contentHeight / 2) * this.zoom);

    this.render();
  }

  /**
   * Set snap mode.
   * @param {'x'|'y'|'both'|'none'} mode
   */
  setSnap(mode) {
    switch (mode) {
      case "x":
        this.snapX = !this.snapX;
        break;
      case "y":
        this.snapY = !this.snapY;
        break;
      case "both":
        if (this.snapX && this.snapY) {
          this.snapX = false;
          this.snapY = false;
        } else {
          this.snapX = true;
          this.snapY = true;
        }
        break;
      case "none":
        this.snapX = false;
        this.snapY = false;
        break;
    }
  }

  /**
   * Zoom in by one step.
   */
  zoomIn() {
    this._setZoom(this.zoom + ZOOM_STEP, this.canvas.width / 2, this.canvas.height / 2);
  }

  /**
   * Zoom out by one step.
   */
  zoomOut() {
    this._setZoom(this.zoom - ZOOM_STEP, this.canvas.width / 2, this.canvas.height / 2);
  }

  /**
   * Destroy the canvas and remove event listeners.
   */
  destroy() {
    this._removeEvents();
    if (this._tooltip?.parentNode) {
      this._tooltip.parentNode.removeChild(this._tooltip);
    }
  }

  // ---------------------------------------------------------------------------
  // Rendering
  // ---------------------------------------------------------------------------

  render() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    // Clear
    ctx.clearRect(0, 0, w, h);

    // Background pattern (subtle grid)
    ctx.fillStyle = "#1a1a2e";
    ctx.fillRect(0, 0, w, h);
    this._drawBackgroundGrid(ctx, w, h);

    ctx.save();
    ctx.translate(this.panX, this.panY);
    ctx.scale(this.zoom, this.zoom);

    // Draw bounding box
    this._drawBoundingBox(ctx);

    // Draw snap guides
    this._drawSnapGuides(ctx);

    // Draw scenes
    for (let i = 0; i < this.scenes.length; i++) {
      this._drawScene(ctx, this.scenes[i], i);
    }

    ctx.restore();
  }

  _drawBackgroundGrid(ctx, w, h) {
    const gridStep = 40 * this.zoom;
    if (gridStep < 8) return; // Too small to draw

    ctx.strokeStyle = "rgba(255, 255, 255, 0.04)";
    ctx.lineWidth = 1;

    const offsetX = this.panX % gridStep;
    const offsetY = this.panY % gridStep;

    ctx.beginPath();
    for (let x = offsetX; x < w; x += gridStep) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
    }
    for (let y = offsetY; y < h; y += gridStep) {
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
    }
    ctx.stroke();
  }

  _drawBoundingBox(ctx) {
    if (this.scenes.length < 2) return;

    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;
    for (const s of this.scenes) {
      minX = Math.min(minX, s.x);
      minY = Math.min(minY, s.y);
      maxX = Math.max(maxX, s.x + s.width);
      maxY = Math.max(maxY, s.y + s.height);
    }

    ctx.strokeStyle = "rgba(79, 209, 197, 0.5)";
    ctx.lineWidth = 2 / this.zoom;
    ctx.setLineDash([8 / this.zoom, 4 / this.zoom]);
    ctx.strokeRect(minX, minY, maxX - minX, maxY - minY);
    ctx.setLineDash([]);
  }

  _drawSnapGuides(ctx) {
    if (this._snapGuides.length === 0) return;

    ctx.strokeStyle = "rgba(255, 193, 7, 0.7)";
    ctx.lineWidth = 1 / this.zoom;
    ctx.setLineDash([4 / this.zoom, 4 / this.zoom]);

    for (const guide of this._snapGuides) {
      ctx.beginPath();
      if (guide.axis === "x") {
        ctx.moveTo(guide.value, -100000);
        ctx.lineTo(guide.value, 100000);
      } else {
        ctx.moveTo(-100000, guide.value);
        ctx.lineTo(100000, guide.value);
      }
      ctx.stroke();
    }

    ctx.setLineDash([]);
  }

  _drawScene(ctx, scene, index) {
    const isHovered = index === this._hoveredIndex;
    const isDragging = this._dragging?.index === index;

    // Background fill
    ctx.fillStyle = isDragging
      ? "rgba(79, 209, 197, 0.15)"
      : isHovered
        ? "rgba(79, 209, 197, 0.08)"
        : "rgba(255, 255, 255, 0.05)";
    ctx.fillRect(scene.x, scene.y, scene.width, scene.height);

    // Draw the thumbnail / background image if loaded
    const img = this._imageCache.get(scene.sceneId);
    if (img?.complete && img.naturalWidth > 0) {
      ctx.drawImage(img, scene.x, scene.y, scene.width, scene.height);
    }

    // Border
    ctx.strokeStyle = isDragging
      ? "#4fd1c5"
      : isHovered
        ? "#63b3ed"
        : "rgba(255, 255, 255, 0.3)";
    ctx.lineWidth = (isDragging ? 3 : isHovered ? 2 : 1) / this.zoom;
    ctx.strokeRect(scene.x, scene.y, scene.width, scene.height);

    // Label
    const fontSize = Math.max(14, 16 / this.zoom);
    ctx.font = `${fontSize}px sans-serif`;
    ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
    ctx.textBaseline = "top";

    // Label background
    const text = scene.name;
    const metrics = ctx.measureText(text);
    const labelPad = 4 / this.zoom;
    const labelH = fontSize + labelPad * 2;
    const labelW = metrics.width + labelPad * 2;

    ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
    ctx.fillRect(scene.x, scene.y, labelW, labelH);

    ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
    ctx.fillText(text, scene.x + labelPad, scene.y + labelPad);
  }

  // ---------------------------------------------------------------------------
  // Image loading
  // ---------------------------------------------------------------------------

  _loadImage(scene) {
    const src = scene.thumbnail || scene.backgroundSrc;
    if (!src || this._imageCache.has(scene.sceneId)) return;

    // For video backgrounds, we only use the thumbnail (which Foundry generates as a static image)
    // We do NOT try to load the video itself into the layout canvas
    const isVideo = /\.(mp4|webm|ogg)$/i.test(src);
    const loadSrc = isVideo ? scene.thumbnail : src;
    if (!loadSrc) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => this.render();
    img.onerror = () => {
      // Silent fail — scene will show as a coloured rectangle
    };
    img.src = loadSrc;
    this._imageCache.set(scene.sceneId, img);
  }

  // ---------------------------------------------------------------------------
  // Tooltip
  // ---------------------------------------------------------------------------

  _createTooltip() {
    this._tooltip = document.createElement("div");
    this._tooltip.classList.add("scene-stitcher-tooltip");
    this._tooltip.style.display = "none";
    document.body.appendChild(this._tooltip);
  }

  _showTooltip(scene, canvasX, canvasY) {
    if (!this._tooltip) return;

    const src = scene.thumbnail || scene.backgroundSrc;
    const isVideo = /\.(mp4|webm|ogg)$/i.test(scene.backgroundSrc ?? "");

    this._tooltip.innerHTML = `
      <div class="scene-stitcher-tooltip-content">
        ${src && !isVideo ? `<img src="${src}" alt="${scene.name}" />` : ""}
        ${isVideo && scene.thumbnail ? `<img src="${scene.thumbnail}" alt="${scene.name}" />` : ""}
        ${!src && !scene.thumbnail ? `<div class="scene-stitcher-tooltip-noimg">No preview</div>` : ""}
        <div class="scene-stitcher-tooltip-info">
          <strong>${scene.name}</strong>
          <span>${scene.width} x ${scene.height} px</span>
          ${isVideo ? "<span>Video background</span>" : ""}
        </div>
      </div>
    `;

    const rect = this.canvas.getBoundingClientRect();
    const tipX = rect.left + canvasX + 16;
    const tipY = rect.top + canvasY + 16;

    this._tooltip.style.display = "block";
    this._tooltip.style.left = `${tipX}px`;
    this._tooltip.style.top = `${tipY}px`;

    // Keep tooltip on screen
    requestAnimationFrame(() => {
      if (!this._tooltip) return;
      const tipRect = this._tooltip.getBoundingClientRect();
      if (tipRect.right > window.innerWidth) {
        this._tooltip.style.left = `${rect.left + canvasX - tipRect.width - 8}px`;
      }
      if (tipRect.bottom > window.innerHeight) {
        this._tooltip.style.top = `${rect.top + canvasY - tipRect.height - 8}px`;
      }
    });
  }

  _hideTooltip() {
    if (this._tooltip) {
      this._tooltip.style.display = "none";
    }
  }

  // ---------------------------------------------------------------------------
  // Coordinate transforms
  // ---------------------------------------------------------------------------

  /** Canvas pixel -> scene-pixel space */
  _canvasToScene(cx, cy) {
    return {
      x: (cx - this.panX) / this.zoom,
      y: (cy - this.panY) / this.zoom,
    };
  }

  /** Scene-pixel -> canvas pixel space */
  _sceneToCanvas(sx, sy) {
    return {
      x: sx * this.zoom + this.panX,
      y: sy * this.zoom + this.panY,
    };
  }

  // ---------------------------------------------------------------------------
  // Hit testing
  // ---------------------------------------------------------------------------

  _hitTest(canvasX, canvasY) {
    const { x, y } = this._canvasToScene(canvasX, canvasY);
    // Check in reverse order so top-rendered scenes are hit first
    for (let i = this.scenes.length - 1; i >= 0; i--) {
      const s = this.scenes[i];
      if (x >= s.x && x <= s.x + s.width && y >= s.y && y <= s.y + s.height) {
        return i;
      }
    }
    return -1;
  }

  // ---------------------------------------------------------------------------
  // Snapping
  // ---------------------------------------------------------------------------

  _computeSnap(dragIndex, newX, newY, shiftHeld) {
    const guides = [];

    // If shift is held or both snaps are off, no snapping
    if (shiftHeld || (!this.snapX && !this.snapY)) {
      this._snapGuides = [];
      return { x: newX, y: newY };
    }

    const dragged = this.scenes[dragIndex];
    const dw = dragged.width;
    const dh = dragged.height;

    // Edges of the dragged scene at the proposed position
    const dLeft = newX;
    const dRight = newX + dw;
    const dTop = newY;
    const dBottom = newY + dh;

    let snappedX = newX;
    let snappedY = newY;
    const threshold = SNAP_THRESHOLD / this.zoom;

    for (let i = 0; i < this.scenes.length; i++) {
      if (i === dragIndex) continue;
      const other = this.scenes[i];
      const oLeft = other.x;
      const oRight = other.x + other.width;
      const oTop = other.y;
      const oBottom = other.y + other.height;

      // X-axis snapping
      if (this.snapX) {
        // Left edge -> right edge of other
        if (Math.abs(dLeft - oRight) < threshold) {
          snappedX = oRight;
          guides.push({ axis: "x", value: oRight });
        }
        // Right edge -> left edge of other
        if (Math.abs(dRight - oLeft) < threshold) {
          snappedX = oLeft - dw;
          guides.push({ axis: "x", value: oLeft });
        }
        // Left -> left
        if (Math.abs(dLeft - oLeft) < threshold) {
          snappedX = oLeft;
          guides.push({ axis: "x", value: oLeft });
        }
        // Right -> right
        if (Math.abs(dRight - oRight) < threshold) {
          snappedX = oRight - dw;
          guides.push({ axis: "x", value: oRight });
        }
      }

      // Y-axis snapping
      if (this.snapY) {
        // Top edge -> bottom edge of other
        if (Math.abs(dTop - oBottom) < threshold) {
          snappedY = oBottom;
          guides.push({ axis: "y", value: oBottom });
        }
        // Bottom edge -> top edge of other
        if (Math.abs(dBottom - oTop) < threshold) {
          snappedY = oTop - dh;
          guides.push({ axis: "y", value: oTop });
        }
        // Top -> top
        if (Math.abs(dTop - oTop) < threshold) {
          snappedY = oTop;
          guides.push({ axis: "y", value: oTop });
        }
        // Bottom -> bottom
        if (Math.abs(dBottom - oBottom) < threshold) {
          snappedY = oBottom - dh;
          guides.push({ axis: "y", value: oBottom });
        }
      }
    }

    this._snapGuides = guides;
    return { x: snappedX, y: snappedY };
  }

  // ---------------------------------------------------------------------------
  // Zoom helpers
  // ---------------------------------------------------------------------------

  _setZoom(newZoom, canvasX, canvasY) {
    const clampedZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, newZoom));
    const ratio = clampedZoom / this.zoom;

    // Zoom centred on the given canvas point
    this.panX = canvasX - (canvasX - this.panX) * ratio;
    this.panY = canvasY - (canvasY - this.panY) * ratio;
    this.zoom = clampedZoom;

    this.render();
    this.onLayoutChange();
  }

  // ---------------------------------------------------------------------------
  // Event handling
  // ---------------------------------------------------------------------------

  _bindEvents() {
    this._onPointerDown = this._handlePointerDown.bind(this);
    this._onPointerMove = this._handlePointerMove.bind(this);
    this._onPointerUp = this._handlePointerUp.bind(this);
    this._onWheel = this._handleWheel.bind(this);
    this._onContextMenu = (e) => e.preventDefault();

    this.canvas.addEventListener("pointerdown", this._onPointerDown);
    this.canvas.addEventListener("pointermove", this._onPointerMove);
    this.canvas.addEventListener("pointerup", this._onPointerUp);
    this.canvas.addEventListener("pointerleave", this._onPointerUp);
    this.canvas.addEventListener("wheel", this._onWheel, { passive: false });
    this.canvas.addEventListener("contextmenu", this._onContextMenu);
  }

  _removeEvents() {
    this.canvas.removeEventListener("pointerdown", this._onPointerDown);
    this.canvas.removeEventListener("pointermove", this._onPointerMove);
    this.canvas.removeEventListener("pointerup", this._onPointerUp);
    this.canvas.removeEventListener("pointerleave", this._onPointerUp);
    this.canvas.removeEventListener("wheel", this._onWheel);
    this.canvas.removeEventListener("contextmenu", this._onContextMenu);
  }

  _handlePointerDown(e) {
    const rect = this.canvas.getBoundingClientRect();
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;

    // Middle-click or Ctrl+left-click to pan
    if (e.button === 1 || (e.button === 0 && e.ctrlKey)) {
      this._panning = true;
      this._panStart = { x: cx, y: cy };
      this.canvas.setPointerCapture(e.pointerId);
      return;
    }

    // Left-click to drag a scene
    if (e.button === 0) {
      const index = this._hitTest(cx, cy);
      if (index >= 0) {
        const scene = this.scenes[index];
        const scenePos = this._canvasToScene(cx, cy);
        this._dragging = {
          index,
          startX: scenePos.x,
          startY: scenePos.y,
          origX: scene.x,
          origY: scene.y,
        };
        this.canvas.setPointerCapture(e.pointerId);
        this._hideTooltip();
      }
    }
  }

  _handlePointerMove(e) {
    const rect = this.canvas.getBoundingClientRect();
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;

    // Panning
    if (this._panning) {
      this.panX += cx - this._panStart.x;
      this.panY += cy - this._panStart.y;
      this._panStart = { x: cx, y: cy };
      this.render();
      return;
    }

    // Dragging a scene
    if (this._dragging) {
      const scenePos = this._canvasToScene(cx, cy);
      const dx = scenePos.x - this._dragging.startX;
      const dy = scenePos.y - this._dragging.startY;

      let newX = this._dragging.origX + dx;
      let newY = this._dragging.origY + dy;

      // Apply snapping
      const snapped = this._computeSnap(
        this._dragging.index,
        newX,
        newY,
        e.shiftKey
      );
      newX = snapped.x;
      newY = snapped.y;

      this.scenes[this._dragging.index].x = newX;
      this.scenes[this._dragging.index].y = newY;

      this.render();
      return;
    }

    // Hovering — update hovered index and show tooltip
    const index = this._hitTest(cx, cy);
    if (index !== this._hoveredIndex) {
      this._hoveredIndex = index;
      this.canvas.style.cursor = index >= 0 ? "grab" : "default";

      if (index >= 0) {
        this._showTooltip(this.scenes[index], cx, cy);
      } else {
        this._hideTooltip();
      }

      this.render();
    } else if (index >= 0) {
      // Update tooltip position as mouse moves
      this._showTooltip(this.scenes[index], cx, cy);
    }
  }

  _handlePointerUp(e) {
    if (this._dragging) {
      this._snapGuides = [];
      this._dragging = null;
      this.render();
      this.onLayoutChange();
    }
    if (this._panning) {
      this._panning = false;
    }
  }

  _handleWheel(e) {
    e.preventDefault();
    const rect = this.canvas.getBoundingClientRect();
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;

    const delta = -Math.sign(e.deltaY) * ZOOM_STEP;
    this._setZoom(this.zoom + delta, cx, cy);
  }

  // ---------------------------------------------------------------------------
  // Resize handling
  // ---------------------------------------------------------------------------

  /**
   * Call when the containing element resizes.
   * @param {number} width
   * @param {number} height
   */
  resize(width, height) {
    this.canvas.width = width;
    this.canvas.height = height;
    this.render();
  }
}
