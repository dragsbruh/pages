function sundayOf(date) {
  const sunday = new Date(date);
  sunday.setUTCDate(sunday.getUTCDate() - sunday.getUTCDay());
  sunday.setUTCHours(0, 0, 0, 0);
  return sunday;
}

function colorOf(contributions) {
  if (contributions === 0) return "var(--contrib-0)";
  if (contributions < 3) return "var(--contrib-1)";
  if (contributions < 6) return "var(--contrib-2)";
  if (contributions < 10) return "var(--contrib-3)";
  return "var(--contrib-4)";
}

function emptyWeekFrom(sunday) {
  let dayCount = 7;

  const thisSunday = sundayOf(new Date());
  if (thisSunday.getTime() === sunday.getTime())
    dayCount = new Date().getUTCDay() + 1;

  const week = [];
  for (let i = 0; i < dayCount; i++) {
    const date = new Date(sunday);
    date.setUTCDate(date.getUTCDate() + i);
    week.push({
      sources: {},
      contributions: 0,
      date: date.toISOString().slice(0, 10),
    });
  }

  return week;
}

function buildHeatmapData(sources) {
  // my ignorance led me to create this abomination
  // i couldve used css grid and flattened, but i
  // made this shit so im gonna use it

  const weeks = new Map();

  for (const sourceName of Object.keys(sources)) {
    const source = sources[sourceName].sort((a, b) => a.timestamp - b.timestamp);

    for (const day of source) {
      const sunday = sundayOf(day.timestamp * 1000);
      const key = Math.floor(sunday.getTime() / 1000);

      if (!weeks.has(key)) {
        weeks.set(key, emptyWeekFrom(sunday));
      }

      if (day.contributions > 0) {
        const week = weeks.get(key);

        const idx = new Date(day.timestamp * 1000).getUTCDay();
        week[idx].contributions += day.contributions;

        // so one of codeberg or github is producing non-UTC timestamps, until then this hack
        // should work. it should be slightly placing contributions on the wrong day, but worst
        // that could happen is like what 10 contributions get placed before or after that day.

        if (!week[idx].sources[sourceName]) week[idx].sources[sourceName] = 0;
        week[idx].sources[sourceName] += day.contributions;
      }
    }
  }

  return [...weeks.entries()].sort(([a], [b]) => a - b).map(([, week]) => week);
}

document.addEventListener("DOMContentLoaded", () => {
  fetch("https://contrib.furina.is-a.dev/")
    .then(res => res.json())
    .then(data => {
      const heatmap = buildHeatmapData(data);

      const chart = document.querySelector("#contrib-chart");

      let totalContributions = 0;
      for (const week of heatmap) {
        for (const day of week) {
          totalContributions += day.contributions;

          const cell = document.createElement("div");
          cell.className = "day";

          cell.title = `${day.contributions} contributions on ${day.date} (${Object.entries(day.sources).map(([name, value]) => `${name}: ${value}`).join(", ")})`;
          cell.style.backgroundColor = colorOf(day.contributions);

          chart.appendChild(cell);
        }
      }

      const msg = document.querySelector("#contrib-count");
      msg.textContent = `${totalContributions} contributions since ${heatmap[0][0].date}`
    });
});
