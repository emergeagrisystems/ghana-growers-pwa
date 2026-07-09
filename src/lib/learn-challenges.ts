export type ChallengeDay = {
  day: number;
  title: string;
  task: string;
  whatYouNeed: string[];
  whyItMatters: string;
  howToDoIt: string[];
  doneWhen: string;
  commonMistake: string;
  actionSteps?: string[];
  farmMatePrompt?: string;
};

export type LearnChallenge = {
  id: string;
  title: string;
  durationDays: number;
  category: string;
  description: string;
  bestFor?: string[];
  days: ChallengeDay[];
};

export const LEARN_CHALLENGE_STORAGE_KEY = "gg-skills-center-current-challenge";

export type LearnChallengeProgress = {
  challengeId: string;
  completedDays: number[];
};

export const learnChallenges: LearnChallenge[] = [
  {
    id: "soil-health",
    title: "7-Day Soil Health Challenge",
    durationDays: 7,
    category: "Soil & Compost",
    description: "Improve your soil this week using materials already on your farm.",
    bestFor: ["Compost", "Soil cover", "Low-cost soil improvement"],
    days: [
      {
        day: 1,
        title: "Collect dry leaves and crop waste",
        task: "Gather dry and green materials for your compost pile.",
        whatYouNeed: ["Dry leaves", "Dry grass", "Crop waste", "Vegetable scraps", "Small amount of manure if available"],
        whyItMatters: "Compost needs both dry and green materials to break down well.",
        howToDoIt: [
          "Walk around the farm and collect dry leaves, dry grass, and crop waste.",
          "Keep plastic, stones, chemical containers, meat, and oil out of the pile.",
          "Put the materials in one shaded place.",
          "Keep dry materials and green materials separate if possible.",
          "Leave the materials ready for building the pile."
        ],
        doneWhen: "You have collected enough clean farm waste in one place and removed plastics or chemical containers.",
        commonMistake: "Do not add plastic, oil, meat, or chemical containers to compost.",
        actionSteps: ["Gather materials", "Remove rubbish", "Keep in shade"],
        farmMatePrompt: "What materials on my farm can I use for compost?"
      },
      {
        day: 2,
        title: "Choose a compost corner",
        task: "Choose a safe place where your compost pile can break down well.",
        whatYouNeed: ["A shaded area", "Good drainage", "Enough space to turn the pile", "A place away from flooding", "A place away from drinking water sources"],
        whyItMatters: "A good compost spot helps the pile stay damp, breathe well, and avoid being washed away by rain.",
        howToDoIt: [
          "Choose a shaded place near the farm but away from flooding.",
          "Avoid places where rainwater collects.",
          "Leave enough space to turn the pile later.",
          "Keep it away from drinking water sources.",
          "Clear stones, plastic, and rubbish from the spot."
        ],
        doneWhen: "You have chosen a shaded, well-drained place where water will not collect.",
        commonMistake: "Do not build the compost pile in a place that floods during rain.",
        actionSteps: ["Choose shade", "Check drainage", "Clear the spot"],
        farmMatePrompt: "Where is the best place to put a compost pile on my farm?"
      },
      {
        day: 3,
        title: "Build your first pile",
        task: "Layer dry and green materials to start the compost pile.",
        whatYouNeed: ["Dry leaves or dry grass", "Crop waste or vegetable scraps", "Small amount of manure or old compost if available", "Water", "Hoe, shovel, or stick"],
        whyItMatters: "Layering dry and green materials helps the compost break down better and reduces bad smell.",
        howToDoIt: [
          "Put dry leaves or dry grass at the bottom.",
          "Add crop waste or vegetable scraps on top.",
          "Add a small layer of manure or old compost if available.",
          "Sprinkle a little water.",
          "Repeat the layers until the pile is knee-high or higher."
        ],
        doneWhen: "Your pile has dry and green materials layered together and feels damp, not soaked.",
        commonMistake: "Do not soak the pile with too much water.",
        actionSteps: ["Add dry layer", "Add green layer", "Sprinkle water"],
        farmMatePrompt: "How should I layer my compost materials?"
      },
      {
        day: 4,
        title: "Cover the pile",
        task: "Cover the compost pile while still allowing air to enter.",
        whatYouNeed: ["Banana leaves, palm fronds, dry grass, or an old sack", "Small stones or sticks to hold the cover if needed"],
        whyItMatters: "Covering protects the pile from strong sun and heavy rain, but compost still needs air to work well.",
        howToDoIt: [
          "Cover the pile with banana leaves, palm fronds, dry grass, or an old sack.",
          "Do not seal it tightly.",
          "Leave small gaps around the sides for air.",
          "Protect the pile from heavy rain washing through it.",
          "Check again after 2 to 3 days."
        ],
        doneWhen: "The pile is covered, protected from strong sun and heavy rain, but still has air around the sides.",
        commonMistake: "Do not cover the pile tightly with plastic. Compost needs some air.",
        actionSteps: ["Add cover", "Leave air gaps", "Protect from rain"],
        farmMatePrompt: "What can I use to cover my compost pile?"
      },
      {
        day: 5,
        title: "Check moisture",
        task: "Check whether the compost pile is too dry, too wet, or just right.",
        whatYouNeed: ["Your hand or a stick", "A little water if the pile is dry", "Dry leaves or grass if the pile is too wet"],
        whyItMatters: "Compost needs moisture to break down, but too much water can make it smell bad and rot.",
        howToDoIt: [
          "Touch the inside of the pile.",
          "It should feel damp like a squeezed sponge.",
          "If it is dry, sprinkle a little water.",
          "If it is soaked or smells rotten, open it for more air and add dry leaves.",
          "Cover it again after checking."
        ],
        doneWhen: "You know whether the pile is damp, dry, or too wet and have adjusted it.",
        commonMistake: "Do not keep adding water every day without checking moisture first.",
        actionSteps: ["Touch pile", "Add water if dry", "Add dry leaves if wet"],
        farmMatePrompt: "How wet should my compost pile be?"
      },
      {
        day: 6,
        title: "Turn the pile",
        task: "Mix the pile so outside materials move into the middle.",
        whatYouNeed: ["Hoe, shovel, stick, or fork", "A little water if the pile is dry", "Cover material"],
        whyItMatters: "Turning helps air enter the pile and helps materials break down more evenly.",
        howToDoIt: [
          "Use a stick, hoe, or shovel.",
          "Move the outside materials into the middle.",
          "Break large pieces into smaller pieces if possible.",
          "Add a little water only if the pile is dry.",
          "Cover the pile again after turning."
        ],
        doneWhen: "The pile has been mixed once and covered again.",
        commonMistake: "Do not leave the same outside materials untouched for many weeks.",
        actionSteps: ["Open pile", "Move outside inside", "Cover again"],
        farmMatePrompt: "How often should I turn my compost pile?"
      },
      {
        day: 7,
        title: "Ask FarmMate what to improve",
        task: "Check your compost pile and decide the next care step.",
        whatYouNeed: ["Your compost pile", "Your phone", "A few notes on smell, moisture, and texture"],
        whyItMatters: "Compost changes over time. Checking it helps you know whether to add water, add dry material, turn it again, or wait.",
        howToDoIt: [
          "Check the smell of the pile.",
          "Check if it is damp or too dry.",
          "Check if it is warming up.",
          "Look at whether large materials are breaking down.",
          "Ask FarmMate what to do next."
        ],
        doneWhen: "You have checked the pile and know your next compost care step.",
        commonMistake: "Do not use the compost before it is dark, crumbly, and smells earthy.",
        actionSteps: ["Check smell", "Check moisture", "Ask FarmMate"],
        farmMatePrompt: "How do I know when my compost is ready?"
      }
    ]
  },
  {
    id: "water-saving",
    title: "5-Day Water Saving Challenge",
    durationDays: 5,
    category: "Crop Care",
    description: "Use simple checks, mulch, and watering timing to reduce water waste.",
    bestFor: ["Vegetables", "Dry periods", "Home gardens"],
    days: [
      challengeDay(1, "Check soil before watering", "Check whether your soil is dry before adding water.", ["Your hand", "A small stick"], "Watering without checking can waste water and stress roots.", ["Push a finger or stick into the soil.", "Check below the surface, not only the top.", "Water only if the root area is dry."], "You know whether the soil is dry, moist, or waterlogged.", "Do not water every day without checking soil first.", ["Check soil", "Decide if water is needed", "Record what you see"], "How can I tell if my crop needs water?"),
      challengeDay(2, "Water early", "Water at a cooler time of day.", ["Water source", "Watering can or hose"], "Cooler watering helps more moisture reach the roots.", ["Water early morning where possible.", "Water at soil level.", "Avoid wetting leaves late in the day."], "You watered at soil level during a cooler time.", "Do not water leaves in the hot sun if you can avoid it.", ["Water early", "Aim at soil", "Avoid leaf wetness"], "What is the best time to water vegetables?"),
      challengeDay(3, "Add mulch", "Cover one bed with clean dry mulch.", ["Dry grass", "Dry leaves", "Crop residue"], "Mulch slows moisture loss and protects soil from heat.", ["Water first if soil is dry.", "Spread clean mulch thinly.", "Keep mulch away from stems."], "One crop bed is covered with clean mulch.", "Do not pile mulch tightly around stems.", ["Water if dry", "Spread mulch", "Leave stem space"], "What mulch can I use to save water?"),
      challengeDay(4, "Find water loss points", "Look for places where water runs away or collects.", ["Notebook or phone", "After-rain observation"], "Knowing where water moves helps you improve drainage and irrigation.", ["Walk the farm after watering or rain.", "Mark where water runs away.", "Mark where water stands too long."], "You know one place to improve drainage or water use.", "Do not ignore standing water around roots.", ["Walk field", "Mark problem spots", "Plan fix"], "How can I improve drainage on my farm?"),
      challengeDay(5, "Plan next watering", "Create a simple watering plan for one crop.", ["Crop name", "Soil check", "Weather observation"], "A simple plan helps avoid under-watering and overwatering.", ["Choose one crop.", "Check soil daily for three days.", "Water only when the root area needs it."], "You have a simple watering plan for one crop.", "Do not use the same watering plan for every crop and soil.", ["Choose crop", "Check soil", "Plan watering"], "How often should I water this crop?")
    ]
  },
  {
    id: "before-you-spray",
    title: "3-Day Before You Spray Challenge",
    durationDays: 3,
    category: "Pests & Diseases",
    description: "Build a safer habit before spraying: check crop signs, rain, wind, and leaf dryness.",
    bestFor: ["Spraying decisions", "Pest checks", "Disease prevention"],
    days: [
      challengeDay(1, "Check the real problem", "Inspect the crop before deciding to spray.", ["Affected plants", "Good light", "Notebook or phone"], "Spraying before you know the problem can waste money and miss the real cause.", ["Check old leaves and new leaves.", "Look under leaves.", "Compare affected plants with healthy plants."], "You know the main visible sign and where it appears.", "Do not spray just because leaves look weak.", ["Check leaves", "Look underneath", "Compare plants"], "What should I check before spraying?"),
      challengeDay(2, "Check weather conditions", "Check rain, wind, and leaf dryness.", ["Rain check", "Wind check", "Crop leaves"], "Rain, wind, and wet leaves can make spraying unsuitable.", ["Check if rain is expected in 4 to 6 hours.", "Check if wind is calm.", "Check if leaves are dry."], "You know whether conditions are suitable or you should wait.", "Do not spray before rain or in strong wind.", ["Check rain", "Check wind", "Check leaves"], "Can I spray today?"),
      challengeDay(3, "Choose the next safe action", "Decide whether to wait, inspect more plants, ask Crop Doctor, or contact an extension officer.", ["Field notes", "Optional crop photo", "Product label if spraying"], "The safest next step depends on what you confirmed.", ["If unsure, inspect more plants.", "If a photo helps, use Crop Doctor.", "If spraying is needed, follow the label and avoid inventing rates."], "You have one clear next action.", "Do not mix products without trusted guidance.", ["Review notes", "Pick one action", "Follow label if needed"], "Should I spray or check more plants first?")
    ]
  },
  {
    id: "harvest-ready",
    title: "5-Day Harvest Ready Challenge",
    durationDays: 5,
    category: "Harvest & Storage",
    description: "Prepare cleaner, better-counted produce before meeting buyers.",
    bestFor: ["Harvest handling", "Selling readiness", "Storage"],
    days: [
      challengeDay(1, "Check harvest maturity", "Identify what is ready and what should wait.", ["Crop field", "Notebook or phone"], "Harvesting too early or too late can reduce quality.", ["Check several plants.", "Separate ready produce from not-ready produce.", "Note the expected harvest day."], "You know what can be harvested first.", "Do not harvest everything just because some produce is ready.", ["Inspect crop", "Separate ready produce", "Note date"], "How do I know this crop is ready to harvest?"),
      challengeDay(2, "Prepare shade and containers", "Set up clean containers and shade before picking.", ["Clean crates or sacks", "Shade", "Sorting area"], "Heat, dirt, and bruising can reduce quality quickly.", ["Clean containers.", "Prepare shade.", "Avoid placing produce directly on hot ground."], "You have a clean shaded place ready.", "Do not leave harvested produce in direct sun.", ["Clean containers", "Prepare shade", "Avoid hot ground"], "How should I handle produce after harvest?"),
      challengeDay(3, "Sort damaged produce", "Separate good produce, damaged produce, and produce to use quickly.", ["Sorting area", "Containers", "Shade"], "Sorting helps buyers see quality clearly and reduces spread of rot.", ["Remove rotten or badly damaged produce.", "Group similar quality together.", "Keep produce shaded."], "Your harvest is sorted into clear groups.", "Do not hide damaged produce inside good produce.", ["Remove damage", "Group quality", "Keep shaded"], "How should I sort produce before selling?"),
      challengeDay(4, "Estimate quantity", "Count or weigh your harvest in a clear unit.", ["Scale if available", "Crates or sacks", "Notebook"], "Clear quantity reduces confusion before connecting with buyers.", ["Count crates, sacks, bunches, or kilograms.", "Write the unit clearly.", "Separate ready quantity from future harvest."], "You can explain your quantity clearly.", "Do not guess quantity when talking to buyers.", ["Count units", "Write quantity", "Separate future harvest"], "How can I estimate produce quantity before selling?"),
      challengeDay(5, "Prepare buyer details", "Write down pickup, delivery, quantity, and harvest timing.", ["Phone or notebook", "Location details", "Quantity notes"], "Good details make buyer conversations easier.", ["Write crop, quantity, location, harvest date, and pickup or delivery option.", "Take clear produce photos if useful.", "Confirm transport before promising delivery."], "You have buyer-ready produce information.", "Do not promise delivery before checking transport.", ["Write details", "Add photo if useful", "Confirm transport"], "What should I prepare before talking to buyers?")
    ]
  },
  {
    id: "crop-check",
    title: "7-Day Crop Check Challenge",
    durationDays: 7,
    category: "Crop Care",
    description: "Build a weekly crop checking habit before small problems spread.",
    bestFor: ["Plant health", "Field scouting", "Pest prevention"],
    days: [
      challengeDay(1, "Check lower leaves", "Inspect the older leaves on several plants.", ["Crop field", "Good light"], "Lower leaves often show early stress first.", ["Check at least five plants.", "Look for yellowing, spots, or drying.", "Compare healthy and weak plants."], "You know whether lower leaves are healthy or stressed.", "Do not judge the field from one plant only.", ["Check five plants", "Look for signs", "Compare plants"], "My crop lower leaves are changing. What should I check?"),
      challengeDay(2, "Check new growth", "Look at the top leaves and new shoots.", ["Crop field", "Good light"], "New growth shows whether the plant is still growing well.", ["Check leaf color.", "Look for curling or distortion.", "Compare with older leaves."], "You know if new growth looks healthy.", "Do not ignore curled or distorted new leaves.", ["Check top leaves", "Look for curling", "Compare growth"], "What does curled new growth mean?"),
      challengeDay(3, "Look under leaves", "Check the underside of leaves for pests.", ["Leaves", "Good light"], "Many pests hide under leaves before damage becomes obvious.", ["Turn leaves gently.", "Look for insects, eggs, or sticky material.", "Check nearby plants too."], "You know whether pests are visible under leaves.", "Do not spray before checking under leaves.", ["Turn leaves", "Look for pests", "Check nearby"], "I found insects under leaves. What should I do?"),
      challengeDay(4, "Check stems and roots", "Look for weak stems, rot, or root stress signs.", ["Crop plants", "Soil near roots"], "Stem and root problems can cause wilting and poor growth.", ["Check stem base.", "Look for rot or damage.", "Check if soil is too dry or waterlogged."], "You know if stems and root area look healthy.", "Do not only inspect leaves when plants are wilting.", ["Check stem", "Check soil", "Look for rot"], "What should I check when crops are wilting?"),
      challengeDay(5, "Check spacing and airflow", "Look for crowded plants and poor airflow.", ["Crop rows", "Measuring step if useful"], "Crowded crops can stay wet longer and disease may spread faster.", ["Check plant distance.", "Look for leaves touching too much.", "Open paths for inspection where possible."], "You know if the crop is crowded.", "Do not plant too close just to increase plant count.", ["Check spacing", "Look for crowding", "Open paths"], "Is my crop spacing too close?"),
      challengeDay(6, "Check soil moisture", "Check whether soil is dry, moist, or waterlogged.", ["Your hand or stick", "Crop root area"], "Moisture stress can look like disease or nutrient problems.", ["Check below the surface.", "Compare weak and healthy spots.", "Note dry or waterlogged areas."], "You know the field moisture condition.", "Do not add fertilizer to very dry or waterlogged soil.", ["Check soil", "Compare areas", "Note moisture"], "Can dry soil make my crop look sick?"),
      challengeDay(7, "Choose one next action", "Use your field notes to decide what to do next.", ["Field notes", "Optional photo", "FarmMate"], "A clear next action is better than guessing.", ["Review the signs.", "Ask FarmMate if needed.", "Use Crop Doctor if a clear photo would help."], "You have one practical next action.", "Do not try many treatments at once.", ["Review notes", "Ask FarmMate", "Choose one action"], "My crop is not growing well. What should I check first?")
    ]
  },
  {
    id: "farm-records",
    title: "3-Day Farm Records Starter",
    durationDays: 3,
    category: "Harvest & Storage",
    description: "Start simple farm records using only a phone or notebook.",
    bestFor: ["Planning", "Selling readiness", "Verification habits"],
    days: [
      challengeDay(1, "Record one crop", "Write down crop, plot, planting date, and field condition.", ["Notebook or phone", "Crop details"], "Simple records help you plan and explain your farm clearly.", ["Choose one crop.", "Write the plot or location.", "Add planting date or estimated date."], "You have one crop record started.", "Do not wait for perfect records before starting.", ["Choose crop", "Write plot", "Add date"], "What farm records should I keep?"),
      challengeDay(2, "Record one farm activity", "Write down one activity such as watering, manure, fertilizer, spraying, or weeding.", ["Notebook or phone", "Activity details"], "Activity records help you remember what happened before crop changes.", ["Write the date.", "Write the activity.", "Add the crop and field area."], "One farm activity is recorded clearly.", "Do not rely only on memory.", ["Write date", "Write activity", "Add crop"], "How should I record farm activities?"),
      challengeDay(3, "Record one harvest or sale detail", "Write quantity, quality, buyer interest, pickup, or delivery note.", ["Notebook or phone", "Harvest details"], "Harvest records help you prepare better for buyers and future seasons.", ["Write crop and quantity.", "Note quality or damage.", "Add pickup or delivery detail if known."], "One harvest or selling record is written.", "Do not mix different harvest days without noting it.", ["Write quantity", "Note quality", "Add pickup"], "What should I record before selling produce?")
    ]
  }
];

function challengeDay(
  day: number,
  title: string,
  task: string,
  whatYouNeed: string[],
  whyItMatters: string,
  howToDoIt: string[],
  doneWhen: string,
  commonMistake: string,
  actionSteps: string[],
  farmMatePrompt: string
): ChallengeDay {
  return { day, title, task, whatYouNeed, whyItMatters, howToDoIt, doneWhen, commonMistake, actionSteps, farmMatePrompt };
}

export function getLearnChallengeById(id: string) {
  return learnChallenges.find((challenge) => challenge.id === id);
}

export function getCurrentLearnChallenge(now = new Date()) {
  const totalRotationDays = learnChallenges.reduce((total, challenge) => total + challenge.durationDays, 0);
  const utcDay = Math.floor(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()) / 86_400_000);
  let dayInCycle = ((utcDay % totalRotationDays) + totalRotationDays) % totalRotationDays;

  for (const challenge of learnChallenges) {
    if (dayInCycle < challenge.durationDays) {
      return challenge;
    }

    dayInCycle -= challenge.durationDays;
  }

  return learnChallenges[0];
}

export function nextOpenChallengeDay(challenge: LearnChallenge, completedDays: number[]) {
  return challenge.days.find((day) => !completedDays.includes(day.day))?.day ?? challenge.durationDays;
}

export function isChallengeComplete(challenge: LearnChallenge, completedDays: number[]) {
  return challenge.days.every((day) => completedDays.includes(day.day));
}
