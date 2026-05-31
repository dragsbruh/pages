const colors = [
  "var(--contrib-0)",
  "var(--contrib-1)",
  "var(--contrib-2)",
  "var(--contrib-3)",
  "var(--contrib-4)",
];

function getLevel(count) {
  if (count === 0) return 0;
  if (count < 3) return 1;
  if (count < 6) return 2;
  if (count < 10) return 3;
  return 4;
}

document.addEventListener("DOMContentLoaded", () => {
  const parentDiv = document.querySelector("#contributions");

  // TODO: codeberg

  fetch("https://contrib.furina.is-a.dev/").then(res => res.json()).then(data => {
    const chart = document.createElement("div");
    parentDiv.appendChild(chart);

    chart.id = "chart";

    data.weeks.forEach((week) => {
      const row = document.createElement("div");
      chart.appendChild(row);

      row.className = "week";

      week.contributionDays.forEach((day) => {
        const cell = document.createElement("div");
        row.appendChild(cell);

        cell.title = `${day.contributionCount} contributions on github on ${day.date}`
        cell.className = "day";
        cell.style.backgroundColor = colors[getLevel(day.contributionCount)];
      })
    })
  })
})
