import { expect, it } from "vitest";
import { assessToolcraftRenderPlan } from "@/toolcraft/runtime";
import { appSchema } from "./app-schema";
import { appPerformance } from "./app-performance";

it("assesses the cloud renderer before implementation", () => {
  expect(assessToolcraftRenderPlan(appSchema, appPerformance).errors).toEqual([]);
});
