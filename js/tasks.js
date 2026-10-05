/**
 * Offline safe outdoor task bank (40+).
 * Used when the model fails, or to replace unsafe / screen-bound suggestions.
 */
const TASK_BANK = [
  { id: "t01", title: "Neighborhood leaf walk", minutes: 10, energy: "low", company: "either", weather: "any", text: "Walk one quiet block and notice five different leaf shapes or colors. No camera needed—just look." },
  { id: "t02", title: "Park bench breath", minutes: 10, energy: "low", company: "either", weather: "any", text: "Sit on a park bench or stoop for five minutes. Count ten slow breaths while watching the sky." },
  { id: "t03", title: "Front-step stretch", minutes: 10, energy: "low", company: "either", weather: "any", text: "On your doorstep or balcony, do gentle neck and shoulder rolls for three minutes, then look at the farthest tree you can see." },
  { id: "t04", title: "Cloud naming", minutes: 10, energy: "low", company: "either", weather: "clear", text: "Lie or sit outside and invent silly names for three clouds. Stay off screens the whole time." },
  { id: "t05", title: "Bird count windowsill", minutes: 10, energy: "low", company: "either", weather: "any", text: "From a safe outdoor spot near home, count how many birds you hear or see in five minutes." },
  { id: "t06", title: "Sidewalk chalk doodle", minutes: 10, energy: "low", company: "either", weather: "clear", text: "If you have chalk, draw a small leave-a-smile mark on your own driveway or shared chalk board. Otherwise sketch a leaf with a stick in dirt." },
  { id: "t07", title: "Herb sniff tour", minutes: 10, energy: "low", company: "either", weather: "any", text: "Visit a balcony planter, community garden edge, or kitchen herb pot outdoors and smell two edible herbs you already own or grow." },
  { id: "t08", title: "Shadow stretch", minutes: 10, energy: "medium", company: "either", weather: "clear", text: "Stand in sunlight and stretch so your shadow looks taller. Hold three poses for 20 seconds each." },
  { id: "t09", title: "Gratitude walk loop", minutes: 20, energy: "low", company: "either", weather: "any", text: "Walk a familiar loop near home. Silently name three things outdoors you are glad exist." },
  { id: "t10", title: "Local tree greeting", minutes: 20, energy: "low", company: "either", weather: "any", text: "Pick one tree on your block. Notice bark texture, height, and any nests. Return the same way without checking a map app." },
  { id: "t11", title: "Park loop stroll", minutes: 20, energy: "medium", company: "either", weather: "any", text: "Walk one full loop of your nearest park path at an easy pace. Leave headphones at home if you can." },
  { id: "t12", title: "Picnic square meal", minutes: 20, energy: "low", company: "either", weather: "clear", text: "Eat a simple snack outdoors on a blanket or bench. Chew slowly and watch people or birds go by." },
  { id: "t13", title: "Flower or weed ID game", minutes: 20, energy: "low", company: "companion", weather: "any", text: "With a companion, take turns pointing at a plant and guessing its name. No plant-ID apps—just guesses and laughter." },
  { id: "t14", title: "Companion quiet sit", minutes: 20, energy: "low", company: "companion", weather: "any", text: "Sit outside with someone for ten minutes without talking about screens, work, or news. Just share the view." },
  { id: "t15", title: "Solo porch journal", minutes: 20, energy: "low", company: "solo", weather: "any", text: "On paper, jot three outdoor sounds you hear and one smell. Stay outside until you finish." },
  { id: "t16", title: "Easy bike neighborhood", minutes: 20, energy: "medium", company: "either", weather: "clear", text: "If you already own a bike and know safe local paths, ride a short familiar route. Stay on known streets; no racing." },
  { id: "t17", title: "Playground swing reset", minutes: 20, energy: "medium", company: "either", weather: "clear", text: "Use a public swing or see-saw gently for a few minutes if the area is open and age-appropriate. Otherwise walk the playground edge." },
  { id: "t18", title: "Market stroll", minutes: 20, energy: "medium", company: "either", weather: "any", text: "Walk to a nearby open-air market or produce stall you already know. Buy nothing if you prefer—just look at colors and textures." },
  { id: "t19", title: "Water-edge sit (shallow)", minutes: 20, energy: "low", company: "either", weather: "clear", text: "Sit on a safe public pier, fountain rim, or dry riverbank path where water is shallow and fenced or clearly public. Do not enter water." },
  { id: "t20", title: "Sunset color watch", minutes: 20, energy: "low", company: "either", weather: "clear", text: "Find a familiar outdoor spot with a view of the sky. Watch colors change for ten minutes before dusk. Be home before dark if alone." },
  { id: "t21", title: "Gentle neighborhood jog", minutes: 40, energy: "high", company: "either", weather: "clear", text: "Jog or power-walk a route you already know. Stick to sidewalks and parks. Carry water; skip headphones if traffic is present." },
  { id: "t22", title: "Community garden help", minutes: 40, energy: "medium", company: "either", weather: "any", text: "If you have access to a community or home garden, weed, water, or harvest for 30 minutes. Stay on plots you are allowed to touch." },
  { id: "t23", title: "Long park explore", minutes: 40, energy: "medium", company: "either", weather: "any", text: "Explore two different paths in a park you already visit. Sit once for five minutes midway. No new remote trails." },
  { id: "t24", title: "Outdoor sketch session", minutes: 40, energy: "low", company: "solo", weather: "clear", text: "Bring paper and pencil. Sketch one building, one tree, and one person-shaped silhouette from a public bench." },
  { id: "t25", title: "Friend walk-and-talk", minutes: 40, energy: "medium", company: "companion", weather: "any", text: "Invite a friend for a walk with a simple rule: devices stay put away except for a true emergency." },
  { id: "t26", title: "Kids outdoor games", minutes: 40, energy: "medium", company: "companion", weather: "clear", text: "Play catch, hopscotch, or hide-and-seek in a familiar yard or park with people you know. Keep it light and local." },
  { id: "t27", title: "Stair climb outdoors", minutes: 20, energy: "high", company: "either", weather: "clear", text: "Use public outdoor stairs you already know (stadium steps, park hills). Go up and down at a comfortable pace for 15 minutes." },
  { id: "t28", title: "Rain puddle walk", minutes: 20, energy: "low", company: "either", weather: "rain", text: "With a coat and waterproof shoes, walk a short block and notice rain sounds. Avoid flooded streets and deep water." },
  { id: "t29", title: "Indoor-outdoor plant check", minutes: 10, energy: "low", company: "either", weather: "any", text: "Move one houseplant to a safe outdoor ledge for fresh air (if weather allows), then water outdoor pots you already tend." },
  { id: "t30", title: "Library lawn read", minutes: 40, energy: "low", company: "solo", weather: "clear", text: "Take a physical book or magazine to a library lawn or quiet park bench. Read for 25 minutes outdoors." },
  { id: "t31", title: "Stretch + walk combo", minutes: 20, energy: "medium", company: "either", weather: "any", text: "Five minutes of outdoor stretches, then a ten-minute walk, then two minutes of standing stillness facing greenery." },
  { id: "t32", title: "Dog or pet outdoor time", minutes: 20, energy: "medium", company: "either", weather: "any", text: "If you have a pet, take them on their usual outdoor route. Focus on their pace, not a podcast." },
  { id: "t33", title: "Courtyard mindfulness", minutes: 10, energy: "low", company: "solo", weather: "any", text: "Stand in a courtyard, balcony, or backyard. Name five colors, four sounds, three textures without touching your phone." },
  { id: "t34", title: "Farmer stall chat", minutes: 20, energy: "low", company: "either", weather: "any", text: "At a familiar outdoor stall, ask one question about produce in season. Stay in public spaces you know." },
  { id: "t35", title: "Leaf rake or tidy", minutes: 40, energy: "medium", company: "either", weather: "clear", text: "Rake leaves or tidy a yard/patio you are responsible for. Donate bagged leaves to compost if available." },
  { id: "t36", title: "Sunrise or early light", minutes: 20, energy: "low", company: "either", weather: "clear", text: "Step outside early and watch light change for ten minutes. Stay on your own property or a nearby public sidewalk." },
  { id: "t37", title: "Partner device-free stroll", minutes: 40, energy: "low", company: "companion", weather: "any", text: "Walk with someone for 30 minutes with a pact: no cameras, no scrolling. Talk about what you see outdoors." },
  { id: "t38", title: "Public art walk", minutes: 20, energy: "medium", company: "either", weather: "any", text: "Walk to a mural, statue, or fountain you already know in your city. Look at details you never noticed." },
  { id: "t39", title: "Cold-weather brisk walk", minutes: 20, energy: "medium", company: "either", weather: "cold", text: "Dress warmly and walk briskly for 15 minutes on familiar sidewalks. Warm up indoors afterward." },
  { id: "t40", title: "Hot-day shade rest", minutes: 10, energy: "low", company: "either", weather: "hot", text: "Sit in deep shade outdoors with water. Rest for eight minutes; avoid midday sun exertion." },
  { id: "t41", title: "Balcony or stoop tea", minutes: 10, energy: "low", company: "either", weather: "any", text: "Take a warm or cold drink to your balcony, stoop, or yard. Finish it before going back inside." },
  { id: "t42", title: "Skip-rope or jump in place", minutes: 10, energy: "high", company: "either", weather: "clear", text: "If you have a rope and a clear private or park space, jump lightly for a few minutes. Otherwise do step-ups on a low curb carefully." },
  { id: "t43", title: "Neighborhood gratitude map", minutes: 40, energy: "low", company: "solo", weather: "any", text: "On paper, sketch a tiny map of three outdoor places you like within walking distance, then visit one of them." },
  { id: "t44", title: "Group outdoor stretch", minutes: 20, energy: "low", company: "companion", weather: "any", text: "Do a short stretch circle outdoors with people you know. Keep it gentle and on soft ground or mats." },
  { id: "t45", title: "Listen for wind", minutes: 10, energy: "low", company: "either", weather: "any", text: "Close your eyes outdoors for two minutes and track where wind or air movement comes from. Then open your eyes and describe the scene aloud." }
];

function filterTasks(prefs) {
  const time = Number(prefs.time) || 20;
  const energy = prefs.energy || "medium";
  const company = prefs.company || "either";
  const weather = prefs.weather || "any";

  const energyRank = { low: 1, medium: 2, high: 3 };
  const want = energyRank[energy] || 2;

  return TASK_BANK.filter((t) => {
    if (t.minutes > time) return false;
    if ((energyRank[t.energy] || 2) > want) return false;
    if (company === "solo" && t.company === "companion") return false;
    if (company === "companion" && t.company === "solo") return false;
    if (weather !== "any" && t.weather !== "any" && t.weather !== weather) return false;
    return true;
  });
}

function pickOfflineTicket(prefs, count) {
  const n = count || 3;
  const pool = filterTasks(prefs);
  const source = pool.length >= n ? pool : TASK_BANK.filter((t) => t.minutes <= (Number(prefs.time) || 20));
  const shuffled = source.slice().sort(() => Math.random() - 0.5);
  const picked = shuffled.slice(0, n);
  while (picked.length < n) {
    picked.push(TASK_BANK[picked.length % TASK_BANK.length]);
  }
  return {
    title: "Grass Ticket (offline)",
    minutes: Number(prefs.time) || 20,
    tasks: picked.map((t) => ({ title: t.title, text: t.text, minutes: t.minutes })),
    source: "offline"
  };
}

const Tasks = { TASK_BANK, filterTasks, pickOfflineTicket };

if (typeof module !== "undefined" && module.exports) {
  module.exports = Tasks;
} else if (typeof window !== "undefined") {
  window.Tasks = Tasks;
}
