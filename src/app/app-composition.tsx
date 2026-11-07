import { composeToolcraftApp } from "@/toolcraft/runtime/react";

import { appSchema } from "./app-schema";
import { CloudCanvas } from "./clouds-renderer";
import { cloudPipeline } from "./clouds-pipeline";
import { readCloudSettings } from "./clouds-model";
import { drawCloudFrame } from "./clouds-drawing";

export const appComposition = composeToolcraftApp(appSchema, {
  renderer: { pipelineRegistration: cloudPipeline },
  scene: {
    canvasContent: <CloudCanvas />,
    renderDefaultCanvasMedia: false,
    sceneBoundsProvider: ({ state }) => [{ x: -state.canvas.size.width / 2, y: -state.canvas.size.height / 2, width: state.canvas.size.width, height: state.canvas.size.height }],
    rasterFrameRenderer: {
      baseFileName: "nice-clouds",
      renderFrame: async ({ context, frame, state, timelineProgress, rendererPipeline, signal }) => {
        signal.throwIfAborted();
        if (!rendererPipeline) throw new Error("The cloud export pipeline is unavailable.");
        await rendererPipeline.runPass(cloudPipeline.getPass("export"), undefined, () => {
          drawCloudFrame(context, frame, readCloudSettings(state.values), timelineProgress, String(state.values["clouds.fill"] ?? "#FFFFFF"));
        });
      },
    },
  },
});
