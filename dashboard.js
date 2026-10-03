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
  { symbol: "META", name: "Meta Platforms Inc.", price: 42150 },
  { symbol: "GOLD" , name:"Gold Inc" , price : 17500}
];
stocks.forEach(s => { s.open = s.price; });

const getById = id => document.getElementById(id);
const find = symbol => stocks.find(s => s.symbol === symbol);
const profitClass = n => (n > 0 ? "profit" : n < 0 ? "loss" : "");
const sign = n => (n > 0 ? "+" : "");

function row(cells) 
{
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
        <button class="button button-buy" data-act="BUY">Buy</button>
        <button class="button button-sell" data-act="SELL">Sell</button>
      </td>`);
    tr.querySelectorAll("button").forEach(b =>
      b.addEventListener("click", () => openTrade(b.dataset.act, s)));
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

setInterval(() => {
  stocks.forEach(s => {
    const move = 1 + (Math.random() - 0.5) * 0.01;   // up to ±0.5% per tick
    s.price = Math.max(1, Math.round(s.price * move));
  });
  renderSummary(); renderHoldings();
  if (!tradeDialog.open && document.activeElement !== getById("stockSearch")) renderStocks();
}, 4000);

renderAll();
