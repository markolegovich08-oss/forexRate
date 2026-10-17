
const API_URL = "https://open.er-api.com/v6/latest/USD";

const currencyNames = {
  USD: "Долар США",
  EUR: "Євро",
  UAH: "Українська гривня",
  GBP: "Фунт стерлінгів",
  PLN: "Польський злотий",
  CHF: "Швейцарський франк",
  CAD: "Канадський долар",
  AUD: "Австралійський долар",
  JPY: "Японська єна",
  CZK: "Чеська крона",
  TRY: "Турецька ліра",
  CNY: "Китайський юань",
  SEK: "Шведська крона",
  NOK: "Норвезька крона",
  RON: "Румунський лей"
};

const currencySymbols = {
  USD: "$",
  EUR: "€",
  UAH: "₴",
  GBP: "£",
  PLN: "zł",
  CHF: "Fr",
  CAD: "C$",
  AUD: "A$",
  JPY: "¥",
  CZK: "Kč",
  TRY: "₺",
  CNY: "¥",
  SEK: "kr",
  NOK: "kr",
  RON: "lei"
};

const $ = id => document.getElementById(id);

let rates = {};
let isLoading = false;

function formatNumber(number, digits = 2) {
  return Number(number).toLocaleString("uk-UA", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits
  });
}

function showToast(message) {
  const toast = $("toast");

  toast.textContent = message;
  toast.classList.add("show");

  setTimeout(() => {
    toast.classList.remove("show");
  }, 2800);
}

async function loadRates() {
  if (isLoading) return;

  isLoading = true;
  $("refreshBtn").disabled = true;
  $("refreshBtn").textContent = "Завантаження...";

  try {
    const response = await fetch(API_URL, {
      cache: "no-store"
    });

    if (!response.ok) {
      throw new Error("Помилка завантаження курсів");
    }

    const data = await response.json();

    if (data.result !== "success" || !data.rates) {
      throw new Error("Джерело не повернуло курси");
    }

    rates = data.rates;

    renderRates();

    $("heroUsd").textContent =
      formatNumber(rates.UAH);

    $("heroEur").textContent =
      formatNumber(rates.UAH / rates.EUR);

    const updateDate = data.time_last_update_utc
      ? new Date(data.time_last_update_utc)
      : new Date();

    $("updatedAt").textContent =
      "Оновлено: " +
      updateDate.toLocaleString("uk-UA", {
        dateStyle: "short",
        timeStyle: "short"
      });

    showToast("Курси успішно оновлено!");
  } catch (error) {
    console.error(error);

    $("updatedAt").textContent =
      "Не вдалося отримати дані";

    $("rateGrid").innerHTML = `
      <div class="glass loading">
        Не вдалося завантажити курси валют.
        Перевір інтернет і натисни «Оновити».
      </div>
    `;

    showToast("Помилка завантаження курсів");
  } finally {
    isLoading = false;
    $("refreshBtn").disabled = false;
    $("refreshBtn").textContent = "↻ Оновити";
  }
}

function renderRates() {
  const search = $("searchInput")
    .value.trim().toLowerCase();

  const currencies = Object.keys(currencyNames);

  const filtered = currencies.filter(code => {
    const name = currencyNames[code];

    return (
      rates[code] &&
      (
        code.toLowerCase().includes(search) ||
        name.toLowerCase().includes(search)
      )
    );
  });

  if (filtered.length === 0) {
    $("rateGrid").innerHTML = `
      <div class="glass loading">
        Валюту не знайдено.
      </div>
    `;
    return;
  }

  $("rateGrid").innerHTML = filtered.map(code => {
    // API надає курси відносно USD.
    // Перераховуємо їх у кількість гривень за 1 одиницю валюти.
    const rateInUah = rates.UAH / rates[code];

    const symbol = currencySymbols[code] || code;
    const digits = code === "UAH" ? 4 : 2;

    return `
      <article class="glass rate-card">
        <div class="rate-symbol">${symbol}</div>

        <div class="rate-info">
          <strong>${code}</strong>
          <small>${currencyNames[code]}</small>
        </div>

        <div class="rate-value">
          ${formatNumber(rateInUah, digits)}
          <small>UAH за 1 ${code}</small>
        </div>
      </article>
    `;
  }).join("");
}

$("searchInput").addEventListener("input", renderRates);

$("refreshBtn").addEventListener("click", loadRates);

loadRates();
