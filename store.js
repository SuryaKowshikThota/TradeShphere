/* Shared helpers: all data lives in localStorage (no backend needed). */
const DEMO = {
   name: "Demo User",
   email: "demo@tradesphere.com",
   password: "123456" 
  };
const START_CASH = 100000;


// Store.users , Store.saveusers , Store.save ,Store.create , Store.current
// Store.seeddemo , Store.login , Store.logout
const Store = {
  users() {
    try { 
      return JSON.parse(localStorage.getItem("ts_users")) || {}; 
    }
    catch (e) {
       return {}; 
    }
  },
  saveUsers(users) {
  localStorage.setItem("ts_users", JSON.stringify(users));
  },
  login(email) {
    localStorage.setItem("ts_session", email);
  },
  logout() {
    localStorage.removeItem("ts_session");
  },
  current() {
    return this.users()[localStorage.getItem("ts_session")] || null;
  },
  save(user) { 
      const u = this.users(); 
      u[user.email] = user; 
      this.saveUsers(u); 
  },

  create(name, email, password) {
    const user = 
    { name,
      email, password,
      cashBalance: START_CASH,
      holdings: [],
      transactions: [] 

    };
    this.save(user);
    return user;
  },
  seedDemo() {
    if (!this.users()[DEMO.email]) 
      this.create(DEMO.name, DEMO.email, DEMO.password);
  },
};

function money(n) {
  return "₹" + Number(n).toLocaleString("en-IN", { maximumFractionDigits: 2 });
}
