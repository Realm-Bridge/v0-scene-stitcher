/**
 * Scene Stitcher — Module Entry Point
 *
 * Registers the module with Foundry VTT v13:
 *   - Adds a toolbar button to the Scene controls
 *   - Opens the SceneStitcherApp when clicked
 */

import { SceneStitcherApp } from "./SceneStitcherApp.mjs";

const MODULE_ID = "scene-stitcher";

/** @type {SceneStitcherApp|null} */
let appInstance = null;

/* -------------------------------------------------------------------------- */
/*  Hooks                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * Module initialisation — register settings.
 */
Hooks.once("init", () => {
  console.log(`${MODULE_ID} | Initialising Scene Stitcher`);
});

/**
 * Module ready — everything is loaded.
 */
Hooks.once("ready", () => {
  console.log(`${MODULE_ID} | Scene Stitcher ready`);
});

/**
 * Add the Scene Stitcher button to the Scene controls toolbar.
 *
 * Foundry v13 uses getSceneControlButtons which receives the controls array.
 */
Hooks.on("getSceneControlButtons", (controls) => {
  // Only GMs should be able to merge scenes
  if (!game.user.isGM) return;

  // Find the scenes control group (the "token" group is the default scene control)
  const sceneTools = controls.find((c) => c.name === "scenes");
  if (!sceneTools) {
    // Fallback: try to find the token controls or any control group
    const tokenTools = controls.find((c) => c.name === "token");
    if (tokenTools) {
      tokenTools.tools.push(_createToolButton());
    }
    return;
  }

  sceneTools.tools.push(_createToolButton());
});

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * Create the tool button configuration.
 */
function _createToolButton() {
  return {
    name: MODULE_ID,
    title: game.i18n.localize("SCENE_STITCHER.ToolbarHint"),
    icon: "fas fa-puzzle-piece",
    button: true,
    onClick: () => {
      if (appInstance?.rendered) {
        appInstance.bringToFront();
      } else {
        appInstance = new SceneStitcherApp();
        appInstance.render(true);
      }
    },
  };
}
