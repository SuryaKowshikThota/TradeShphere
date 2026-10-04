const user = Store.current();
if (!user) window.location.href = "index.html";

/* Market data: prices drift randomly to feel live. */
const stocks = [
  { symbol: "AAPL", name: "Apple Inc.", price: 17525 },
  { symbol: "MSFT", name: "Microsoft Corporation", price: 35208 },
  { symbol: "TSLA", name: "Tesla Inc.", price: 20104 },
  { symbol: "NVDA", name: "NVIDIA Corporation", price: 11950 },
  { symbol: "AMZN", name: "Amazon.com Inc.", price: 15320 },
  { symbol: "GOOGL", name: "Alphabet Inc.", price: 13890 },
  { symbol: "META", name: "Meta Platforms Inc.", price: 42150 }
];
/* Price history: 50 earlier prices, made by walking backwards from the current price. */
stocks.forEach(s => {
  s.history = [s.price];
  for (let i = 1; i < 50; i++) {
    const move = 1 + (Math.random() - 0.5) * 0.01;
    s.history.unshift(Math.round(s.history[0] / move));
  }
  s.open = s.history[0];
});

const getById = id => document.getElementById(id);
const find = symbol => stocks.find(s => s.symbol === symbol);
const profitClass = n => (n > 0 ? "profit" : n < 0 ? "loss" : "");
const sign = n => (n > 0 ? "+" : "");

function row(cells) {
  const tr = document.createElement("tr");
  tr.innerHTML = cells;
  return tr;
}

/* ---------- Rendering ---------- */
function renderSummary() {
  let invested = 0, cost = 0;
  user.holdings.forEach(h => {
    invested += find(h.symbol).price * h.quantity;
    cost += h.avgPrice * h.quantity;
  });
  const pl = invested - cost;
  const plPct = cost ? (pl / cost) * 100 : 0;

  getById("welcomeUser").textContent = "Welcome, " + user.name;
  getById("portfolioValue").textContent = money(user.cashBalance + invested);
  getById("cashBalance").textContent = money(user.cashBalance);
  getById("investedValue").textContent = money(invested);
  getById("stockCount").textContent = user.holdings.length + (user.holdings.length === 1 ? " position" : " positions");
  getById("totalProfitLoss").textContent = sign(pl) + money(pl);
  getById("totalProfitLoss").className = profitClass(pl);
  getById("totalProfitLossPercent").textContent = sign(plPct) + plPct.toFixed(2) + "%";
}

function renderStocks() {
  const q = getById("stockSearch").value.trim().toLowerCase();
  const body = getById("stockList");
  body.innerHTML = "";
  const list = stocks.filter(s => s.name.toLowerCase().includes(q) || s.symbol.toLowerCase().includes(q));
  if (!list.length) {
    body.innerHTML = `<tr><td colspan="4" class="empty-message">No stocks match "${q.replace(/[<>&"]/g, "")}".</td></tr>`;
    return;
  }
  list.forEach(s => {
    const change = ((s.price - s.open) / s.open) * 100;
    const tr = row(`
      <td><strong>${s.name}</strong><small>${s.symbol}</small></td>
      <td class="align-right">${money(s.price)}</td>
      <td class="align-right ${profitClass(change)}">${sign(change)}${change.toFixed(2)}%</td>
      <td class="align-right">
        <button class="button button-outline" data-act="CHART">Chart</button>
        <button class="button button-buy" data-act="BUY">Buy</button>
        <button class="button button-sell" data-act="SELL">Sell</button>
      </td>`);
    tr.querySelectorAll("button").forEach(b =>
      b.addEventListener("click", () => {
        if (b.dataset.act === "CHART") showChartFor(s.symbol);
        else openTrade(b.dataset.act, s);
      }));
    body.appendChild(tr);
  });
}

function renderHoldings() {
  const body = getById("holdingsList");
  body.innerHTML = "";
  if (!user.holdings.length) {
    body.innerHTML = `<tr><td colspan="6" class="empty-message">You don't own any stocks yet. Pick one from the market above and press Buy.</td></tr>`;
    return;
  }
  user.holdings.forEach(h => {
    const s = find(h.symbol);
    const value = s.price * h.quantity;
    const pl = value - h.avgPrice * h.quantity;
    const pct = (pl / (h.avgPrice * h.quantity)) * 100;
    body.appendChild(row(`
      <td><strong>${s.name}</strong><small>${s.symbol}</small></td>
      <td class="align-right">${h.quantity}</td>
      <td class="align-right">${money(h.avgPrice)}</td>
      <td class="align-right">${money(s.price)}</td>
      <td class="align-right">${money(value)}</td>
      <td class="align-right ${profitClass(pl)}">${sign(pl)}${money(pl)}<small>${sign(pct)}${pct.toFixed(2)}%</small></td>`));
  });
}

function renderTransactions() {
  const body = getById("transactionList");
  body.innerHTML = "";
  if (!user.transactions.length) {
    body.innerHTML = `<tr><td colspan="6" class="empty-message">No transactions yet.</td></tr>`;
    return;
  }
  user.transactions.slice().reverse().forEach(t => {
    body.appendChild(row(`
      <td>${new Date(t.date).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</td>
      <td><span class="trade-type ${t.type ==="BUY" ? "type-buy" : "type-sell"}">${t.type}</span></td>
      <td>${t.symbol}</td>
      <td class="align-right">${t.quantity}</td>
      <td class="align-right">${money(t.price)}</td>
      <td class="align-right">${money(t.total)}</td>`));
  });
}

function renderAll() { renderSummary(); renderStocks(); renderHoldings(); renderTransactions(); }

/* ---------- Trading ---------- */
const tradeDialog = getById("tradeDialog");
let trade = null;

function maxQuantity() {
  if (trade.type === "BUY") return Math.floor(user.cashBalance / trade.stock.price);
  const h = user.holdings.find(x => x.symbol === trade.stock.symbol);
  return h ? h.quantity : 0;
}

function updateDialog() {
  const qty = Number(getById("quantityInput").value);
  const valid = Number.isInteger(qty) && qty > 0;
  getById("dialogTotal").textContent = money(valid ? qty * trade.stock.price : 0);
  let error = "";
  if (!valid) error = "Enter a whole number of 1 or more.";
  else if (qty > maxQuantity()) {
    error = trade.type === "BUY" ? "Not enough virtual cash for that quantity." : "You don't own that many shares.";
  }
  getById("dialogError").textContent = error;
  getById("confirmTrade").disabled = Boolean(error);
}

function openTrade(type, stock) {
  trade = { type, stock };
  if (type === "SELL" && maxQuantity() === 0) {
    showMessage(`You don't own any ${stock.symbol} shares.`, true);
    return;
  }
  getById("dialogTitle").textContent = `${type === "BUY" ? "Buy" : "Sell"} ${stock.symbol}`;
  getById("dialogInfo").textContent = `${stock.name} at ${money(stock.price)} · You can ${type === "BUY" ? "afford" : "sell"} up to ${maxQuantity()}`;
  getById("confirmTrade").textContent = type === "BUY" ? "Buy shares" : "Sell shares";
  getById("quantityInput").value = 1;
  updateDialog();
  tradeDialog.showModal();
  getById("quantityInput").select();
}

function executeTrade() {
  const qty = Number(getById("quantityInput").value);
  const { type, stock } = trade;
  const total = qty * stock.price;
  let holding = user.holdings.find(h => h.symbol === stock.symbol);

  if (type === "BUY") {
    user.cashBalance -= total;
    if (holding) {
      holding.avgPrice = (holding.avgPrice * holding.quantity + total) / (holding.quantity + qty);
      holding.quantity += qty;
    } else {
      user.holdings.push({ symbol: stock.symbol, quantity: qty, avgPrice: stock.price });
    }
  } else {
    user.cashBalance += total;
    holding.quantity -= qty;
    if (holding.quantity === 0) user.holdings = user.holdings.filter(h => h.symbol !== stock.symbol);
  }
  user.transactions.push({ type, symbol: stock.symbol, quantity: qty, price: stock.price, total, date: new Date().toISOString() });
  Store.save(user);
  renderAll();
  showMessage(`${type === "BUY" ? "Bought" : "Sold"} ${qty} share(s) of ${stock.symbol}.`);
}

getById("quantityInput").addEventListener("input", updateDialog);
getById("cancelTrade").addEventListener("click", () => tradeDialog.close());
getById("tradeForm").addEventListener("submit", e => {
  if (getById("confirmTrade").disabled) return e.preventDefault();
  executeTrade();
});

/* ---------- Pop-up message, controls, live prices ---------- */
let messageTimer;
function showMessage(text, isError) {
  const el = getById("popupMessage");
  el.textContent = text;
  el.className = "popup-message show" + (isError ? " error" : "");
  clearTimeout(messageTimer);
  messageTimer = setTimeout(() => el.classList.remove("show"), 3000);
}

getById("logoutButton").addEventListener("click", () => { Store.logout(); window.location.href = "index.html"; });
getById("resetButton").addEventListener("click", () => {
  if (!confirm("Reset your account to ₹1,00,000 and clear all holdings and history?")) return;
  user.cashBalance = START_CASH; user.holdings = []; user.transactions = [];
  Store.save(user);
  renderAll();
  showMessage("Account reset.");
});
getById("stockSearch").addEventListener("input", renderStocks);

/* ---------- Price chart (drawn on a canvas) ---------- */
let chartSymbol = stocks[0].symbol;
let hoverIndex = null;                       // which point the mouse is over

const chartCanvas = getById("priceChart");
const chartSelect = getById("chartStock");
stocks.forEach(s => chartSelect.add(new Option(s.name + " (" + s.symbol + ")", s.symbol)));

function drawChart() {
  const s = find(chartSymbol);
  const data = s.history;
  const c = chartCanvas.getContext("2d");
  const w = chartCanvas.width, h = chartCanvas.height;
  const left = 80, right = 20, top = 20, bottom = 34;

  let min = Math.min(...data), max = Math.max(...data);
  if (min === max) { min -= 1; max += 1; }
  const space = (max - min) * 0.1;
  min -= space; max += space;

  const x = i => left + (i / (data.length - 1)) * (w - left - right);
  const y = p => top + (1 - (p - min) / (max - min)) * (h - top - bottom);
  const isUp = data[data.length - 1] >= data[0];
  const lineColor = isUp ? "#16a34a" : "#dc2626";

  c.clearRect(0, 0, w, h);
  c.font = "14px Arial";

  // grid lines with price labels
  for (let i = 0; i <= 4; i++) {
    const price = min + ((max - min) * i) / 4;
    c.strokeStyle = "#e2e8f0"; c.lineWidth = 1;
    c.beginPath(); c.moveTo(left, y(price)); c.lineTo(w - right, y(price)); c.stroke();
    c.fillStyle = "#64748b";
    c.fillText(Math.round(price).toLocaleString("en-IN"), 6, y(price) + 5);
  }

  // coloured area under the line
  c.beginPath();
  c.moveTo(x(0), h - bottom);
  data.forEach((p, i) => c.lineTo(x(i), y(p)));
  c.lineTo(x(data.length - 1), h - bottom);
  c.closePath();
  c.fillStyle = isUp ? "#dcfce7" : "#fee2e2";
  c.fill();

  // the price line
  c.beginPath();
  data.forEach((p, i) => (i === 0 ? c.moveTo(x(i), y(p)) : c.lineTo(x(i), y(p))));
  c.strokeStyle = lineColor; c.lineWidth = 3; c.stroke();

  // dot on the latest price
  c.beginPath();
  c.arc(x(data.length - 1), y(s.price), 5, 0, Math.PI * 2);
  c.fillStyle = lineColor; c.fill();

  c.fillStyle = "#64748b";
  c.fillText("Earlier", left, h - 10);
  c.fillText("Now", w - right - 30, h - 10);

  // mouse crosshair and price label
  if (hoverIndex !== null) {
    const hx = x(hoverIndex), hy = y(data[hoverIndex]);
    c.strokeStyle = "#94a3b8"; c.lineWidth = 1;
    c.beginPath(); c.moveTo(hx, top); c.lineTo(hx, h - bottom); c.stroke();
    c.beginPath(); c.arc(hx, hy, 5, 0, Math.PI * 2); c.fillStyle = "#0b1a4a"; c.fill();
    const label = money(data[hoverIndex]);
    const boxX = hx > w / 2 ? hx - 130 : hx + 10;
    c.fillStyle = "#0b1a4a"; c.fillRect(boxX, top, 120, 28);
    c.fillStyle = "#ffffff"; c.fillText(label, boxX + 10, top + 19);
  }
}

function updateChart() {
  const s = find(chartSymbol);
  const change = ((s.price - s.history[0]) / s.history[0]) * 100;
  getById("chartPrice").textContent = s.name + "  " + money(s.price);
  getById("chartChange").textContent = sign(change) + change.toFixed(2) + "%";
  getById("chartChange").className = profitClass(change);
  getById("chartRange").textContent = "High " + money(Math.max(...s.history)) + "  ·  Low " + money(Math.min(...s.history));
  chartSelect.value = chartSymbol;
  drawChart();
}

function showChartFor(symbol) {
  chartSymbol = symbol;
  hoverIndex = null;
  updateChart();
  getById("chart").scrollIntoView();
}

chartSelect.addEventListener("change", () => showChartFor(chartSelect.value));
chartCanvas.addEventListener("mousemove", e => {
  const box = chartCanvas.getBoundingClientRect();
  const mouseX = (e.clientX - box.left) * (chartCanvas.width / box.width);
  const count = find(chartSymbol).history.length;
  const index = Math.round(((mouseX - 80) / (chartCanvas.width - 100)) * (count - 1));
  hoverIndex = Math.min(count - 1, Math.max(0, index));
  drawChart();
});
chartCanvas.addEventListener("mouseleave", () => { hoverIndex = null; drawChart(); });

/* ---------- Live price updates every 4 seconds ---------- */
setInterval(() => {
  stocks.forEach(s => {
    const move = 1 + (Math.random() - 0.5) * 0.01;   // up to ±0.5% per tick
    s.price = Math.max(1, Math.round(s.price * move));
    s.history.push(s.price);
    if (s.history.length > 50) s.history.shift();     // keep the last 50 points
  });
  renderSummary(); renderHoldings(); updateChart();
  if (!tradeDialog.open && document.activeElement !== getById("stockSearch")) renderStocks();
}, 4000);

renderAll();
updateChart();
