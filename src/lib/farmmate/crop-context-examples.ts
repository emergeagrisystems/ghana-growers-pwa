import { routeFarmMateQuestion } from "./router";
import { buildFarmMateResponse } from "./decision-engine";

const tomatoRouterResult = routeFarmMateQuestion("My tomato leaves are yellow");
const maizeAfterTomatoRouterResult = routeFarmMateQuestion("My maize is not growing well");
const tomatoAfterMaizeRouterResult = routeFarmMateQuestion("My tomato leaves are yellow");
const cassavaAfterTomatoRouterResult = routeFarmMateQuestion("My cassava leaves look strange");

export const farmMateCropContextExamples = [
  {
    question: "My maize is not growing well",
    expectedCrop: "Maize",
    response: buildFarmMateResponse("My maize is not growing well", maizeAfterTomatoRouterResult)
  },
  {
    question: "My tomato leaves are yellow",
    expectedCrop: "Tomato",
    response: buildFarmMateResponse("My tomato leaves are yellow", tomatoRouterResult)
  },
  {
    question: "Asking maize after tomato",
    expectedCrop: "Maize",
    response: buildFarmMateResponse("My maize is not growing well", maizeAfterTomatoRouterResult, { previousCropName: "Tomato" })
  },
  {
    question: "Asking tomato after maize",
    expectedCrop: "Tomato",
    response: buildFarmMateResponse("My tomato leaves are yellow", tomatoAfterMaizeRouterResult, { previousCropName: "Maize" })
  },
  {
    question: "Asking cassava after tomato",
    expectedCrop: "Cassava",
    response: buildFarmMateResponse("My cassava leaves look strange", cassavaAfterTomatoRouterResult, { previousCropName: "Tomato" })
  }
];

export const farmMateCropContextExamplesPass = farmMateCropContextExamples.every(
  (example) => example.response.resolvedCrop === example.expectedCrop
);
