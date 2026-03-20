const fabricPricing = [
  { sku: "F 2", cu: 2, cusPer30s: 60, paygMonth: 292, reservedMonth: 173.667, paygHour: 0.4, reservedHour: 0.238 },
  { sku: "F 4", cu: 4, cusPer30s: 120, paygMonth: 584, reservedMonth: 347.334, paygHour: 0.8, reservedHour: 0.476 },
  { sku: "F 8", cu: 8, cusPer30s: 240, paygMonth: 1168, reservedMonth: 694.667, paygHour: 1.6, reservedHour: 0.952 },
  { sku: "F 16", cu: 16, cusPer30s: 480, paygMonth: 2336, reservedMonth: 1389.334, paygHour: 3.2, reservedHour: 1.904 },
  { sku: "F 32", cu: 32, cusPer30s: 960, paygMonth: 4672, reservedMonth: 2778.667, paygHour: 6.4, reservedHour: 3.807 },
  { sku: "F 64", cu: 64, cusPer30s: 1920, paygMonth: 9344, reservedMonth: 5557.334, paygHour: 12.8, reservedHour: 7.613 },
  { sku: "F 128", cu: 128, cusPer30s: 3840, paygMonth: 18688, reservedMonth: 11114.667, paygHour: 25.6, reservedHour: 15.226 },
  { sku: "F 256", cu: 256, cusPer30s: 7680, paygMonth: 37376, reservedMonth: 22229.334, paygHour: 51.2, reservedHour: 30.452 },
  { sku: "F 512", cu: 512, cusPer30s: 15360, paygMonth: 74752, reservedMonth: 44458.667, paygHour: 102.4, reservedHour: 60.903 },
  { sku: "F 1024", cu: 1024, cusPer30s: 30720, paygMonth: 149504, reservedMonth: 88917.334, paygHour: 204.8, reservedHour: 121.805 },
];

const lowerSkuColumns = [2, 4, 8, 16, 32, 64];
const usageSplits = [0, 0.2, 0.25, 0.5, 0.75, 0.8, 1];
const upgradeReasons = [
  { reason: "Deployment pipelines", ppu: true, fabric: true },
  { reason: "Pipelines", ppu: false, fabric: true },
  { reason: "Unified refresh", ppu: false, fabric: true },
  { reason: "Easier administration", ppu: false, fabric: true },
  { reason: "SaaS experience", ppu: false, fabric: true },
  { reason: "Simpler billing", ppu: false, fabric: true },
  { reason: "Faster refresh times", ppu: false, fabric: true, note: "In theory :)" },
];

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});

const number = new Intl.NumberFormat("en-US");
const percent = new Intl.NumberFormat("en-US", {
  style: "percent",
  maximumFractionDigits: 0,
});

const elements = {
  requiredCus: document.querySelector("#required-cus"),
  hoursPerMonth: document.querySelector("#hours-per-month"),
  proSeats: document.querySelector("#pro-seats"),
  ppuSeats: document.querySelector("#ppu-seats"),
  dataFactoryCost: document.querySelector("#data-factory-cost"),
  sqlCost: document.querySelector("#sql-cost"),
  selectedSku: document.querySelector("#selected-sku"),
  reservedCost: document.querySelector("#reserved-cost"),
  paygoCost: document.querySelector("#paygo-cost"),
  monthlySavings: document.querySelector("#monthly-savings"),
  heroSku: document.querySelector("#hero-sku"),
  heroThroughput: document.querySelector("#hero-throughput"),
  heroTooltipPanel: document.querySelector("#hero-tooltip-panel"),
  scenarioTable: document.querySelector("#scenario-table"),
  pricingTable: document.querySelector("#pricing-table"),
  comparisonCards: document.querySelector("#comparison-cards"),
};

function getInputs() {
  return {
    requiredCus: Math.max(1, Number(elements.requiredCus.value) || 1),
    hoursPerMonth: Math.max(1, Number(elements.hoursPerMonth.value) || 730),
    proSeats: Math.max(0, Number(elements.proSeats.value) || 0),
    ppuSeats: Math.max(0, Number(elements.ppuSeats.value) || 0),
    dataFactoryCost: Math.max(0, Number(elements.dataFactoryCost.value) || 0),
    sqlCost: Math.max(0, Number(elements.sqlCost.value) || 0),
  };
}

function pickRecommendedSku(requiredCus) {
  return fabricPricing.find((row) => row.cusPer30s > requiredCus) || fabricPricing.at(-1);
}

function formatScenarioCell(lowerCu, selectedCu, lowerRatio, hoursPerMonth) {
  if (lowerCu >= selectedCu) {
    return "N/A";
  }

  const lower = fabricPricing.find((row) => row.cu === lowerCu);
  const higher = fabricPricing.find((row) => row.cu === selectedCu);
  const blended =
    lowerRatio * hoursPerMonth * lower.paygHour +
    (1 - lowerRatio) * hoursPerMonth * higher.paygHour;

  return currency.format(blended);
}

function renderScenarioTable(selectedSku, hoursPerMonth) {
  const selectedCu = selectedSku.cu;
  const lowerPercentages = usageSplits.map((ratio) => 1 - ratio);
  const higherPercentages = usageSplits;

  const thead = elements.scenarioTable.querySelector("thead");
  const tbody = elements.scenarioTable.querySelector("tbody");

  thead.innerHTML = "";
  tbody.innerHTML = "";

  const headRow = document.createElement("tr");
  const columns = [
    "Higher SKU %",
    "Lower SKU %",
    ...lowerSkuColumns.map((cu) => `Lower SKU: F ${cu}`),
  ];

  columns.forEach((label) => {
    const th = document.createElement("th");
    th.textContent = label;
    headRow.appendChild(th);
  });
  thead.appendChild(headRow);

  higherPercentages.forEach((ratio, index) => {
    const tr = document.createElement("tr");
    const values = [
      percent.format(lowerPercentages[index]),
      percent.format(ratio),
      ...lowerSkuColumns.map((lowerCu) =>
        formatScenarioCell(lowerCu, selectedCu, ratio, hoursPerMonth)
      ),
    ];

    values.forEach((value) => {
      const td = document.createElement("td");
      td.textContent = value;
      tr.appendChild(td);
    });

    tbody.appendChild(tr);
  });
}

function renderPricingTable() {
  const thead = elements.pricingTable.querySelector("thead");
  const tbody = elements.pricingTable.querySelector("tbody");

  thead.innerHTML = "";
  tbody.innerHTML = "";

  const headers = [
    "SKU",
    "Capacity Unit",
    "CUs / 30s",
    "PAYG / Month",
    "Reserved / Month",
    "PAYG / Hour",
    "Reserved / Hour",
  ];

  const headerRow = document.createElement("tr");
  headers.forEach((label) => {
    const th = document.createElement("th");
    th.textContent = label;
    headerRow.appendChild(th);
  });
  thead.appendChild(headerRow);

  fabricPricing.forEach((row) => {
    const tr = document.createElement("tr");
    [
      row.sku,
      number.format(row.cu),
      number.format(row.cusPer30s),
      currency.format(row.paygMonth),
      currency.format(row.reservedMonth),
      currency.format(row.paygHour),
      currency.format(row.reservedHour),
    ].forEach((value) => {
      const td = document.createElement("td");
      td.textContent = value;
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });
}

function renderComparisonCards(inputs) {
  const currentMonthlyCost =
    inputs.dataFactoryCost +
    inputs.sqlCost +
    inputs.proSeats * 10 +
    inputs.ppuSeats * 20;

  const reservedRows = fabricPricing
    .filter((row) => row.cu <= 64)
    .map((row) => ({
      label: row.cu < 64 ? `${row.sku} with Power BI Pro` : `${row.sku} without Power BI Pro`,
      value: row.reservedMonth + (row.cu < 64 ? inputs.ppuSeats * 10 : 0),
    }));

  const paygRows = fabricPricing
    .filter((row) => row.cu <= 64)
    .map((row) => ({
      label: row.cu < 64 ? `${row.sku} with Power BI Pro` : `${row.sku} without Power BI Pro`,
      value: row.paygMonth + (row.cu < 64 ? inputs.ppuSeats * 10 : 0),
    }));

  const selectedReserved = reservedRows.find((row) => row.label.startsWith(`F ${pickRecommendedSku(inputs.requiredCus).cu}`));
  const selectedPayg = paygRows.find((row) => row.label.startsWith(`F ${pickRecommendedSku(inputs.requiredCus).cu}`));

  const cards = [
    {
      label: "Current Estate",
      value: currency.format(currentMonthlyCost),
      list: [
        `Data Factory: ${currency.format(inputs.dataFactoryCost)}`,
        `SQL Database: ${currency.format(inputs.sqlCost)}`,
        `Power BI Pro: ${number.format(inputs.proSeats)} seats`,
        `Power BI PPU: ${number.format(inputs.ppuSeats)} seats`,
      ],
    },
    {
      label: "Fabric Reserved",
      value: selectedReserved ? currency.format(selectedReserved.value) : "N/A",
      list: reservedRows.map((row) => `${row.label}: ${currency.format(row.value)}`),
    },
    {
      label: "Fabric Pay-as-you-go",
      value: selectedPayg ? currency.format(selectedPayg.value) : "N/A",
      list: paygRows.map((row) => `${row.label}: ${currency.format(row.value)}`),
    },
    {
      label: "Upgrade Reasons",
      value: `${upgradeReasons.length} drivers`,
      list: upgradeReasons.map((item) =>
        `${item.reason} (${item.ppu ? "PPU" : "PPU no"}, ${item.fabric ? "Fabric yes" : "Fabric no"}${item.note ? `, ${item.note}` : ""})`
      ),
    },
  ];

  elements.comparisonCards.innerHTML = "";

  cards.forEach((card) => {
    const article = document.createElement("article");
    article.className = "comparison-card";
    article.innerHTML = `
      <div class="comparison-card__label">${card.label}</div>
      <div class="comparison-card__value">${card.value}</div>
      <ul class="comparison-card__list">
        ${card.list.map((item) => `<li>${item}</li>`).join("")}
      </ul>
    `;
    elements.comparisonCards.appendChild(article);
  });
}

function updateSummary(selectedSku) {
  elements.selectedSku.textContent = selectedSku.sku;
  elements.reservedCost.textContent = currency.format(selectedSku.reservedMonth);
  elements.paygoCost.textContent = currency.format(selectedSku.paygMonth);
  elements.monthlySavings.textContent = currency.format(
    selectedSku.paygMonth - selectedSku.reservedMonth
  );
  elements.heroSku.textContent = selectedSku.sku;
  elements.heroThroughput.textContent = `${number.format(
    selectedSku.cusPer30s
  )} CUs per 30 seconds`;
  elements.heroTooltipPanel.textContent = `${selectedSku.sku} provides ${number.format(
    selectedSku.cu
  )} Capacity Units. Microsoft evaluates usage in 30-second windows, so ${number.format(
    selectedSku.cu
  )} x 30 = ${number.format(selectedSku.cusPer30s)} CUs per 30 seconds.`;
}

function render() {
  const inputs = getInputs();
  const selectedSku = pickRecommendedSku(inputs.requiredCus);

  updateSummary(selectedSku);
  renderScenarioTable(selectedSku, inputs.hoursPerMonth);
  renderComparisonCards(inputs);
}

renderPricingTable();
render();

document.querySelectorAll("input").forEach((input) => {
  input.addEventListener("input", render);
});
