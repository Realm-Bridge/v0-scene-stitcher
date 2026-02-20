/**
 * Scene Stitcher — ApplicationV2 UI
 *
 * Two-step wizard:
 *   1. Scene Selection — pick 2+ scenes to merge
 *   2. Layout Canvas — drag-and-drop arrangement + merge trigger
 */

import { LayoutCanvas } from "./canvas-layout.mjs";
import { mergeScenes, getSceneInfo } from "./merge-engine.mjs";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

export class SceneStitcherApp extends HandlebarsApplicationMixin(ApplicationV2) {
  /** @override */
  static DEFAULT_OPTIONS = {
    id: "scene-stitcher",
    tag: "div",
    window: {
      title: "SCENE_STITCHER.Title",
      icon: "fas fa-puzzle-piece",
      resizable: true,
    },
    position: {
      width: 800,
      height: 640,
    },
    actions: {
      search: SceneStitcherApp.#onSearch,
      selectAll: SceneStitcherApp.#onSelectAll,
      deselectAll: SceneStitcherApp.#onDeselectAll,
      toggleScene: SceneStitcherApp.#onToggleScene,
      goToLayout: SceneStitcherApp.#onGoToLayout,
      goToSelect: SceneStitcherApp.#onGoToSelect,
      toggleSnapX: SceneStitcherApp.#onToggleSnapX,
      toggleSnapY: SceneStitcherApp.#onToggleSnapY,
      toggleSnapBoth: SceneStitcherApp.#onToggleSnapBoth,
      zoomIn: SceneStitcherApp.#onZoomIn,
      zoomOut: SceneStitcherApp.#onZoomOut,
      fitAll: SceneStitcherApp.#onFitAll,
      merge: SceneStitcherApp.#onMerge,
    },
  };

  /** @override */
  static PARTS = {
    main: {
      template: "modules/scene-stitcher/templates/scene-stitcher.hbs",
    },
  };

  constructor(options = {}) {
    super(options);

    /** @type {'select'|'layout'} */
    this._step = "select";

    /** @type {Set<string>} Selected scene IDs */
    this._selectedSceneIds = new Set();

    /** @type {string} Search query for filtering */
    this._searchQuery = "";

    /** @type {LayoutCanvas|null} */
    this._layoutCanvas = null;

    /** Snap state */
    this._snapX = true;
    this._snapY = true;

    /** Zoom display */
    this._zoomPercent = 100;
  }

  // ---------------------------------------------------------------------------
  // Data preparation
  // ---------------------------------------------------------------------------

  /** @override */
  async _prepareContext(options) {
    const allScenes = game.scenes.contents.map((scene) => {
      const info = getSceneInfo(scene);
      const isVideo = /\.(mp4|webm|ogg)$/i.test(info.backgroundSrc ?? "");
      return {
        ...info,
        selected: this._selectedSceneIds.has(scene.id),
        isVideo,
      };
    });

    // Filter by search query
    const query = this._searchQuery.toLowerCase().trim();
    const scenes = query
      ? allScenes.filter((s) => s.name.toLowerCase().includes(query))
      : allScenes;

    // Sort: selected first, then alphabetically
    scenes.sort((a, b) => {
      if (a.selected !== b.selected) return a.selected ? -1 : 1;
      return a.name.localeCompare(b.name);
    });

    return {
      step: this._step,
      scenes,
      searchQuery: this._searchQuery,
      selectedCount: this._selectedSceneIds.size,
      snapX: this._snapX,
      snapY: this._snapY,
      snapBoth: this._snapX && this._snapY,
      zoomPercent: this._zoomPercent,
    };
  }

  // ---------------------------------------------------------------------------
  // Rendering hooks
  // ---------------------------------------------------------------------------

  /** @override */
  _onRender(context, options) {
    super._onRender(context, options);

    // Set up search input live filtering
    const searchInput = this.element.querySelector('[data-action="search"]');
    if (searchInput) {
      searchInput.addEventListener("input", (e) => {
        this._searchQuery = e.target.value;
        this.render();
      });
      // Focus the search input
      searchInput.focus();
    }

    // Initialize the layout canvas if on the layout step
    if (this._step === "layout") {
      this._initLayoutCanvas();
    }
  }

  /** @override */
  _onClose(options) {
    if (this._layoutCanvas) {
      this._layoutCanvas.destroy();
      this._layoutCanvas = null;
    }
    super._onClose(options);
  }

  // ---------------------------------------------------------------------------
  // Layout canvas initialization
  // ---------------------------------------------------------------------------

  _initLayoutCanvas() {
    const wrapper = this.element.querySelector(".scene-stitcher-canvas-wrapper");
    const canvasEl = this.element.querySelector(".scene-stitcher-canvas");
    if (!wrapper || !canvasEl) return;

    // Size canvas to wrapper
    const rect = wrapper.getBoundingClientRect();
    canvasEl.width = rect.width;
    canvasEl.height = rect.height;

    // Create layout canvas instance
    this._layoutCanvas = new LayoutCanvas(canvasEl, {
      onLayoutChange: () => {
        if (this._layoutCanvas) {
          this._zoomPercent = Math.round(this._layoutCanvas.zoom * 100);
        }
      },
    });

    // Load selected scenes
    const selectedScenes = game.scenes.contents
      .filter((s) => this._selectedSceneIds.has(s.id))
      .map((s) => getSceneInfo(s));

    this._layoutCanvas.setScenes(selectedScenes);
    this._layoutCanvas.snapX = this._snapX;
    this._layoutCanvas.snapY = this._snapY;

    // Handle resize
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (this._layoutCanvas && width > 0 && height > 0) {
          this._layoutCanvas.resize(width, height);
        }
      }
    });
    resizeObserver.observe(wrapper);

    // Store for cleanup
    this._resizeObserver = resizeObserver;
  }

  // ---------------------------------------------------------------------------
  // Action handlers
  // ---------------------------------------------------------------------------

  static #onSearch(event, target) {
    // Handled by the input event listener in _onRender
  }

  static #onSelectAll(event, target) {
    for (const scene of game.scenes.contents) {
      this._selectedSceneIds.add(scene.id);
    }
    this.render();
  }

  static #onDeselectAll(event, target) {
    this._selectedSceneIds.clear();
    this.render();
  }

  static #onToggleScene(event, target) {
    const sceneId = target.closest("[data-scene-id]")?.dataset.sceneId;
    if (!sceneId) return;

    if (this._selectedSceneIds.has(sceneId)) {
      this._selectedSceneIds.delete(sceneId);
    } else {
      this._selectedSceneIds.add(sceneId);
    }
    this.render();
  }

  static #onGoToLayout(event, target) {
    if (this._selectedSceneIds.size < 2) {
      ui.notifications.warn(game.i18n.localize("SCENE_STITCHER.MinScenesWarning"));
      return;
    }
    this._step = "layout";
    this.render();
  }

  static #onGoToSelect(event, target) {
    if (this._layoutCanvas) {
      this._layoutCanvas.destroy();
      this._layoutCanvas = null;
    }
    if (this._resizeObserver) {
      this._resizeObserver.disconnect();
      this._resizeObserver = null;
    }
    this._step = "select";
    this.render();
  }

  static #onToggleSnapX(event, target) {
    this._snapX = !this._snapX;
    if (this._layoutCanvas) {
      this._layoutCanvas.snapX = this._snapX;
      this._layoutCanvas.render();
    }
    this.render();
  }

  static #onToggleSnapY(event, target) {
    this._snapY = !this._snapY;
    if (this._layoutCanvas) {
      this._layoutCanvas.snapY = this._snapY;
      this._layoutCanvas.render();
    }
    this.render();
  }

  static #onToggleSnapBoth(event, target) {
    if (this._snapX && this._snapY) {
      this._snapX = false;
      this._snapY = false;
    } else {
      this._snapX = true;
      this._snapY = true;
    }
    if (this._layoutCanvas) {
      this._layoutCanvas.snapX = this._snapX;
      this._layoutCanvas.snapY = this._snapY;
      this._layoutCanvas.render();
    }
    this.render();
  }

  static #onZoomIn(event, target) {
    if (this._layoutCanvas) {
      this._layoutCanvas.zoomIn();
      this._zoomPercent = Math.round(this._layoutCanvas.zoom * 100);
      this.render();
    }
  }

  static #onZoomOut(event, target) {
    if (this._layoutCanvas) {
      this._layoutCanvas.zoomOut();
      this._zoomPercent = Math.round(this._layoutCanvas.zoom * 100);
      this.render();
    }
  }

  static #onFitAll(event, target) {
    if (this._layoutCanvas) {
      this._layoutCanvas.fitAll();
      this._zoomPercent = Math.round(this._layoutCanvas.zoom * 100);
      this.render();
    }
  }

  static async #onMerge(event, target) {
    if (!this._layoutCanvas) return;

    const layout = this._layoutCanvas.getLayout();
    if (layout.length < 2) {
      ui.notifications.warn(game.i18n.localize("SCENE_STITCHER.MinScenesWarning"));
      return;
    }

    // Confirmation dialog
    const count = layout.length;
    const confirmContent = game.i18n
      .localize("SCENE_STITCHER.MergeConfirmContent")
      .replace("{count}", count);

    const confirmed = await foundry.applications.api.DialogV2.confirm({
      window: {
        title: game.i18n.localize("SCENE_STITCHER.MergeConfirmTitle"),
        icon: "fas fa-object-group",
      },
      content: `<p>${confirmContent}</p>`,
      yes: {
        label: game.i18n.localize("SCENE_STITCHER.MergeButton"),
        icon: "fas fa-check",
      },
      no: {
        label: game.i18n.localize("Cancel"),
        icon: "fas fa-times",
      },
    });

    if (!confirmed) return;

    // Show progress notification
    ui.notifications.info(game.i18n.localize("SCENE_STITCHER.MergeInProgress"));

    try {
      const { mergedScene, warnings } = await mergeScenes(layout);

      // Show grid warnings if any
      for (const warning of warnings) {
        ui.notifications.warn(`Scene Stitcher: ${warning}`);
      }

      // Success
      const successMsg = game.i18n
        .localize("SCENE_STITCHER.MergeSuccess")
        .replace("{name}", mergedScene.name);
      ui.notifications.info(successMsg);

      // Navigate to the new scene
      await mergedScene.view();

      // Close the app
      this.close();
    } catch (err) {
      console.error("Scene Stitcher: Merge failed", err);
      const errorMsg = game.i18n
        .localize("SCENE_STITCHER.MergeError")
        .replace("{error}", err.message);
      ui.notifications.error(errorMsg);
    }
  }
}
