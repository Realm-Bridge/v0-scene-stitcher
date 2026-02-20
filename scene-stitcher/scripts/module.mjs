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
 * Foundry v13 passes a Record<string, SceneControl> object (not an array).
 * We add our tool to the "tokens" control group which is always present.
 */
Hooks.on("getSceneControlButtons", (controls) => {
  // In v13, controls is a Record keyed by control group name.
  // "tokens" is the default active control group (the token layer).
  const group = controls.tokens;
  if (!group) return;

  group.tools[MODULE_ID] = {
    name: MODULE_ID,
    title: "SCENE_STITCHER.ToolbarHint",
    icon: "fa-solid fa-puzzle-piece",
    button: true,
    visible: game.user.isGM,
    order: 100,
    onChange: () => {
      if (appInstance?.rendered) {
        appInstance.bringToFront();
      } else {
        appInstance = new SceneStitcherApp();
        appInstance.render({ force: true });
      }
    },
  };
});
