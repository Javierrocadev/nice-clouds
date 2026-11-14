import { useEffect, useId, useState } from "react";
import { getToolcraftTimelineLoopProgress } from "@/toolcraft/runtime";
import { useToolcraftEvaluatedValues, useToolcraftPipeline, useToolcraftProductSceneFrame, useToolcraftSelector, useToolcraftViewportInteractionActive } from "@/toolcraft/runtime/react";
import { evaluateClouds, readCloudSettings, type Cloud } from "./clouds-model";
import { cloudArtwork, cloudLayerPath, readCloudShades } from "./clouds-drawing";
import { cloudPipeline } from "./clouds-pipeline";
import styles from "./clouds.module.css";

export function CloudCanvas() {
  const frame = useToolcraftProductSceneFrame();
  const values = useToolcraftEvaluatedValues();
  const time = useToolcraftSelector(state => state.timeline.currentTimeSeconds);
  const duration = useToolcraftSelector(state => state.timeline.durationSeconds);
  const interacting = useToolcraftViewportInteractionActive();
  const pipeline = useToolcraftPipeline();
  const [clouds, setClouds] = useState<readonly Cloud[]>([]);
  const clipId = `${useId().replaceAll(":", "")}-tile`;
  const fill = String(values["clouds.fill"] ?? "#FFFFFF");

  useEffect(() => {
    if (interacting) return;
    if (!pipeline) throw new Error("The cloud renderer pipeline is unavailable.");
    let current = true;
    void pipeline.runPass(cloudPipeline.getPass("geometry"), undefined, () => {
      if (current) setClouds(evaluateClouds(readCloudSettings(values), getToolcraftTimelineLoopProgress({ currentTimeSeconds: time, durationSeconds: duration })));
    });
    return () => { current = false; };
  }, [values, time, duration, interacting, pipeline]);

  if (frame.kind !== "ready") return null;
  const rect = frame.rect;
  return (
    <svg className={styles.output} data-cloud-output data-toolcraft-product-output
      aria-label="Illustrated clouds" width={rect.width} height={rect.height}
      viewBox={`${rect.x} ${rect.y} ${rect.width} ${rect.height}`}>
      <defs>
        <clipPath id={clipId}><rect x={rect.x} y={rect.y} width={rect.width} height={rect.height} /></clipPath>
      </defs>
      <g clipPath={`url(#${clipId})`}>
        {clouds.flatMap((cloud, index) => [-1, 0, 1].map(wrap => (
          <g key={`${index}:${wrap}`} data-cloud-index={index} data-cloud-wrap={wrap} data-timeline-progress={getToolcraftTimelineLoopProgress({ currentTimeSeconds: time, durationSeconds: duration })}
            style={{ transform: `translate(${rect.x + (cloud.x + wrap - cloud.width / 2) * rect.width}px, ${rect.y + (cloud.y - cloud.height / 2) * rect.height}px)` }}>
            {cloudArtwork(cloud, cloud.width * rect.width, cloud.height * rect.height, fill, readCloudShades(values)).map(layer => (
              <path key={layer.id} data-cloud-layer={layer.id} d={cloudLayerPath(layer)} fill={layer.fill} />
            ))}
          </g>
        )))}
      </g>
    </svg>
  );
}
