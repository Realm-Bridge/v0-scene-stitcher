/**
 * Scene Stitcher — Merge Engine
 *
 * Takes an array of scene layouts (scene references + positions from the layout canvas)
 * and produces a single merged Scene document with:
 *   - Background Tiles referencing each source scene's original background file
 *   - All embedded documents (walls, lights, sounds, tokens, tiles, drawings, notes, regions)
 *     with coordinates offset to their correct position in the merged scene
 */

/**
 * Embedded document types and their coordinate fields that need offsetting.
 * Each entry maps to a Foundry embedded document collection name and
 * describes which fields contain coordinates.
 */
const EMBEDDED_TYPES = [
  {
    collection: "walls",
    documentName: "Wall",
    offsetFn: (data, dx, dy) => {
      // Wall coordinates are stored as c: [x1, y1, x2, y2]
      if (data.c) {
        data.c = [data.c[0] + dx, data.c[1] + dy, data.c[2] + dx, data.c[3] + dy];
      }
      return data;
    },
  },
  {
    collection: "lights",
    documentName: "AmbientLight",
    offsetFn: (data, dx, dy) => {
      data.x = (data.x ?? 0) + dx;
      data.y = (data.y ?? 0) + dy;
      return data;
    },
  },
  {
    collection: "sounds",
    documentName: "AmbientSound",
    offsetFn: (data, dx, dy) => {
      data.x = (data.x ?? 0) + dx;
      data.y = (data.y ?? 0) + dy;
      return data;
    },
  },
  {
    collection: "tokens",
    documentName: "Token",
    offsetFn: (data, dx, dy) => {
      data.x = (data.x ?? 0) + dx;
      data.y = (data.y ?? 0) + dy;
      return data;
    },
  },
  {
    collection: "tiles",
    documentName: "Tile",
    offsetFn: (data, dx, dy) => {
      data.x = (data.x ?? 0) + dx;
      data.y = (data.y ?? 0) + dy;
      return data;
    },
  },
  {
    collection: "drawings",
    documentName: "Drawing",
    offsetFn: (data, dx, dy) => {
      data.x = (data.x ?? 0) + dx;
      data.y = (data.y ?? 0) + dy;
      // Drawing shapes may have absolute points that also need offsetting
      if (data.shape?.points?.length) {
        data.shape.points = data.shape.points.map((pt, i) =>
          i % 2 === 0 ? pt : pt
        );
        // Points in drawings are relative to (x, y), so no additional offset needed
      }
      return data;
    },
  },
  {
    collection: "notes",
    documentName: "Note",
    offsetFn: (data, dx, dy) => {
      data.x = (data.x ?? 0) + dx;
      data.y = (data.y ?? 0) + dy;
      return data;
    },
  },
  {
    collection: "templates",
    documentName: "MeasuredTemplate",
    offsetFn: (data, dx, dy) => {
      data.x = (data.x ?? 0) + dx;
      data.y = (data.y ?? 0) + dy;
      return data;
    },
  },
  {
    collection: "regions",
    documentName: "Region",
    offsetFn: (data, dx, dy) => {
      // Regions contain an array of shapes, each with point-based geometry
      if (data.shapes?.length) {
        data.shapes = data.shapes.map((shape) => {
          const s = foundry.utils.deepClone(shape);
          if (s.points?.length) {
            s.points = s.points.map((val, i) => (i % 2 === 0 ? val + dx : val + dy));
          }
          if (s.x !== undefined) s.x += dx;
          if (s.y !== undefined) s.y += dy;
          return s;
        });
      }
      return data;
    },
  },
];

/**
 * Compute the normalised bounding box from scene layouts.
 * Shifts all positions so the top-left corner is at (0, 0).
 *
 * @param {Array<{sceneId: string, x: number, y: number, width: number, height: number}>} layouts
 * @returns {{ normalisedLayouts: Array, totalWidth: number, totalHeight: number }}
 */
function computeBoundingBox(layouts) {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const layout of layouts) {
    minX = Math.min(minX, layout.x);
    minY = Math.min(minY, layout.y);
    maxX = Math.max(maxX, layout.x + layout.width);
    maxY = Math.max(maxY, layout.y + layout.height);
  }

  const normalisedLayouts = layouts.map((l) => ({
    ...l,
    x: l.x - minX,
    y: l.y - minY,
  }));

  return {
    normalisedLayouts,
    totalWidth: maxX - minX,
    totalHeight: maxY - minY,
  };
}

/**
 * Get the actual scene pixel dimensions for a scene.
 * Foundry scenes store width/height in grid units; we need pixel dimensions.
 *
 * @param {Scene} scene - The Foundry Scene document
 * @returns {{ sceneWidth: number, sceneHeight: number }}
 */
function getScenePixelDimensions(scene) {
  // In Foundry v13, scene.dimensions provides computed pixel values
  if (scene.dimensions) {
    return {
      sceneWidth: scene.dimensions.sceneWidth,
      sceneHeight: scene.dimensions.sceneHeight,
    };
  }
  // Fallback: compute from grid
  const gridSize = scene.grid?.size ?? 100;
  return {
    sceneWidth: scene.width * gridSize,
    sceneHeight: scene.height * gridSize,
  };
}

/**
 * Validate that all source scenes have compatible grid configurations.
 * Returns warnings but does not block the merge.
 *
 * @param {Scene[]} scenes
 * @returns {string[]} Array of warning messages
 */
function validateGridCompatibility(scenes) {
  const warnings = [];
  if (scenes.length < 2) return warnings;

  const first = scenes[0];
  const refSize = first.grid?.size;
  const refType = first.grid?.type;

  for (let i = 1; i < scenes.length; i++) {
    const s = scenes[i];
    if (s.grid?.size !== refSize) {
      warnings.push(
        `Grid size mismatch: "${first.name}" uses ${refSize}px, "${s.name}" uses ${s.grid?.size}px.`
      );
    }
    if (s.grid?.type !== refType) {
      warnings.push(
        `Grid type mismatch: "${first.name}" uses type ${refType}, "${s.name}" uses type ${s.grid?.type}.`
      );
    }
  }

  return warnings;
}

/**
 * Collect all embedded documents from a source scene, strip IDs,
 * and apply coordinate offsets.
 *
 * @param {Scene} scene - Source scene document
 * @param {number} offsetX - Pixel offset on the X axis
 * @param {number} offsetY - Pixel offset on the Y axis
 * @returns {Object} Map of documentName -> array of document data objects
 */
function collectEmbeddedDocuments(scene, offsetX, offsetY) {
  const result = {};

  for (const type of EMBEDDED_TYPES) {
    const collection = scene[type.collection];
    if (!collection?.size) continue;

    const docs = [];
    for (const doc of collection) {
      // Convert to plain object and strip the ID so Foundry generates a new one
      const data = doc.toObject();
      delete data._id;

      // Apply coordinate offsets
      type.offsetFn(data, offsetX, offsetY);

      // Tag with source scene info for traceability
      data.flags = data.flags ?? {};
      data.flags["scene-stitcher"] = {
        ...(data.flags["scene-stitcher"] ?? {}),
        sourceSceneId: scene.id,
        sourceSceneName: scene.name,
      };

      docs.push(data);
    }

    if (docs.length > 0) {
      result[type.documentName] = result[type.documentName] ?? [];
      result[type.documentName].push(...docs);
    }
  }

  return result;
}

/**
 * Create background tile data for a source scene.
 * References the original background.src (image or video) at the correct offset.
 *
 * @param {Scene} scene - Source scene
 * @param {number} offsetX - X offset in the merged scene
 * @param {number} offsetY - Y offset in the merged scene
 * @returns {Object|null} Tile data object, or null if no background
 */
function createBackgroundTileData(scene, offsetX, offsetY) {
  const bgSrc = scene.background?.src;
  if (!bgSrc) return null;

  const dims = getScenePixelDimensions(scene);

  return {
    texture: { src: bgSrc },
    x: offsetX,
    y: offsetY,
    width: dims.sceneWidth,
    height: dims.sceneHeight,
    overhead: false,
    sort: -1000, // Lowest z-index — beneath all other content
    hidden: false,
    locked: true, // Lock so GMs don't accidentally move the background
    flags: {
      "scene-stitcher": {
        isBackground: true,
        sourceSceneId: scene.id,
        sourceSceneName: scene.name,
      },
    },
  };
}

/**
 * Main merge function.
 *
 * @param {Array<{sceneId: string, x: number, y: number, width: number, height: number}>} sceneLayouts
 *   Array of layout entries from the drag-and-drop canvas. x/y are in scene-pixel space.
 *   width/height are the source scene's pixel dimensions.
 * @param {Object} [options]
 * @param {string} [options.name] - Name for the merged scene
 * @returns {Promise<Scene>} The newly created merged Scene document
 */
export async function mergeScenes(sceneLayouts, options = {}) {
  // Resolve scene documents
  const scenes = sceneLayouts.map((l) => game.scenes.get(l.sceneId));
  const missing = sceneLayouts.filter((l, i) => !scenes[i]);
  if (missing.length) {
    throw new Error(`Could not find scenes: ${missing.map((l) => l.sceneId).join(", ")}`);
  }

  // Compute normalised bounding box
  const { normalisedLayouts, totalWidth, totalHeight } = computeBoundingBox(sceneLayouts);

  // Validate grids
  const warnings = validateGridCompatibility(scenes);

  // Use the first scene's grid configuration for the merged scene
  const firstScene = scenes[0];
  const gridConfig = foundry.utils.deepClone(firstScene.grid ?? { size: 100, type: 1 });

  // Determine scene name
  const sceneName =
    options.name ||
    game.i18n.localize("SCENE_STITCHER.MergeSceneName") ||
    "Merged Scene";

  // Compute width/height in grid units for the scene document
  const gridSize = gridConfig.size || 100;
  const sceneWidthUnits = Math.ceil(totalWidth / gridSize);
  const sceneHeightUnits = Math.ceil(totalHeight / gridSize);

  // Create the new scene (no background — tiles will serve as backgrounds)
  const mergedScene = await Scene.create({
    name: sceneName,
    width: sceneWidthUnits,
    height: sceneHeightUnits,
    padding: 0,
    grid: gridConfig,
    tokenVision: firstScene.tokenVision ?? true,
    fogExploration: firstScene.fogExploration ?? true,
    globalLight: firstScene.globalLight ?? false,
    globalLightThreshold: firstScene.globalLightThreshold ?? null,
    flags: {
      "scene-stitcher": {
        merged: true,
        sourceScenes: sceneLayouts.map((l) => l.sceneId),
        mergedAt: Date.now(),
      },
    },
  });

  // Collect all background tiles and embedded documents
  const allBackgroundTiles = [];
  const allEmbedded = {}; // documentName -> data[]

  for (let i = 0; i < normalisedLayouts.length; i++) {
    const layout = normalisedLayouts[i];
    const scene = scenes[i];
    const offsetX = layout.x;
    const offsetY = layout.y;

    // Background tile
    const bgTile = createBackgroundTileData(scene, offsetX, offsetY);
    if (bgTile) {
      allBackgroundTiles.push(bgTile);
    }

    // All other embedded documents
    const embedded = collectEmbeddedDocuments(scene, offsetX, offsetY);
    for (const [docName, docs] of Object.entries(embedded)) {
      allEmbedded[docName] = allEmbedded[docName] ?? [];
      allEmbedded[docName].push(...docs);
    }
  }

  // Create background tiles first (they go underneath everything)
  if (allBackgroundTiles.length > 0) {
    await mergedScene.createEmbeddedDocuments("Tile", allBackgroundTiles);
  }

  // Create all other embedded documents in batches by type
  for (const [docName, docs] of Object.entries(allEmbedded)) {
    if (docs.length > 0) {
      try {
        await mergedScene.createEmbeddedDocuments(docName, docs);
      } catch (err) {
        console.error(`Scene Stitcher: Error creating ${docName} documents:`, err);
        ui.notifications.warn(
          `Scene Stitcher: Some ${docName} documents could not be created. Check the console for details.`
        );
      }
    }
  }

  return { mergedScene, warnings };
}

/**
 * Utility: Get summary info about a scene for the UI.
 *
 * @param {Scene} scene
 * @returns {Object}
 */
export function getSceneInfo(scene) {
  const dims = getScenePixelDimensions(scene);
  return {
    id: scene.id,
    name: scene.name,
    thumbnail: scene.thumb,
    backgroundSrc: scene.background?.src ?? null,
    width: dims.sceneWidth,
    height: dims.sceneHeight,
    gridSize: scene.grid?.size ?? 100,
    gridType: scene.grid?.type ?? 1,
  };
}

export { computeBoundingBox, validateGridCompatibility, getScenePixelDimensions };
