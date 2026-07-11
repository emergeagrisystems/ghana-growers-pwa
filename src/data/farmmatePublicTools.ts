import { Bot, CloudSun, LineChart, ScanSearch, type LucideIcon } from "lucide-react";
import { publicFeatureAvailability } from "../lib/publicFeatureAvailability";

type PublicFarmMateTool = {
  title: string;
  description: string;
  icon: LucideIcon;
  isPubliclyAvailable: boolean;
};

export const homepageFarmMateDescription =
  "Check weather, diagnose crop problems, and get practical farming advice in one place.";

const allHomepageFarmMateTools: PublicFarmMateTool[] = [
  {
    title: "Crop Doctor",
    description: "Upload a crop photo and receive practical next steps.",
    icon: ScanSearch,
    isPubliclyAvailable: true
  },
  {
    title: "Live Weather",
    description: "Check today's farming conditions before heading to the field.",
    icon: CloudSun,
    isPubliclyAvailable: true
  },
  {
    title: "Market Price Check",
    description: "Compare crop prices before you negotiate.",
    icon: LineChart,
    isPubliclyAvailable: publicFeatureAvailability.marketPriceCheck
  },
  {
    title: "Ask FarmMate",
    description: "Ask practical farming questions anytime.",
    icon: Bot,
    isPubliclyAvailable: true
  }
];

export const homepageFarmMateTools = allHomepageFarmMateTools.filter((tool) => tool.isPubliclyAvailable);
