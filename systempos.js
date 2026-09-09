
/**
   * 1. GLOBAL STATE
*/

let state = {
  user: null,
	tenantSlug: null,
  branchId: null,
  cart: [],
  products: [],
  recipes: [],         
  deductionFeed: [], 
  currentMemberPoint: 0,
  currentTable: null,
  currentMember: null,
  paymentMethod: null,
  recipeMap: {},
  memberCurrentPage: 1,
  memberPerPage: 10,

  settings: {
    tax: 11,
    service: 5,
    discount: 0,
    point_ratio: 10000
  },

  dashboardData: null,
  growthData: null,

  isRedeemOpen: false,
  loadingRedeem: false

};
window.state = state;
let isProcessing = false;
let memberSearchValue = "";
let selectedTier = "ALL";

const params =
  new URLSearchParams(
    window.location.search
  );

state.tenantSlug =
  params.get("tenant");
	
function isLoggedIn() {
  return state.user && state.branchId;
}

function isAdmin() {
  return state.user && state.user.role === "admin";
}

function isKasir() {
  return state.user && state.user.role === "kasir";
}

function requireBranch() {
  if (!state.branchId) {
    navigate("loginPage");
    return false;
  }
  return true;
}


let editingMember = null;
let liveLock = false;
let selectedTableId = null;
let selectedRecipeId = null;
let selectedRecipeName = "";
let sellingPrice = 0;
let currentIngredients = [];
let currentTransaction = null;
let activeTransaction = null;


// PAGINATION RECENTTRANSAKSI
let recentCurrentPage = 1;
const recentItemsPerPage = 10;
let recentData = [];
let analyticsTimeout = null;

// PAGINATION ROW MATERIAL
let rawMaterialData = [];
let rawMaterialPage = 1;
const rawMaterialPerPage = 10;;

// PAGINATION TOP REVENUE
let topRevenueCurrentPage = 1;
const topRevenueItemsPerPage = 10;
let allTopRevenueData = [];

// PAGINATION INVENTORY
let inventoryCurrentPage = 1;
const inventoryItemsPerPage = 10;
let allInventoryData = [];
	
// PAGINATION INGREDIENT PURCHASE
let purchaseData = [];
let purchaseFilteredData = [];
let purchaseCurrentPage = 1;
const purchasePageSize = 10;

// PAGINATION SUPPLIER
let supplierCurrentPage = 1;
const supplierItemsPerPage = 5;
let allSupplierData = [];

// PAGINATION RECIPES
let recipeCurrentPage = 1;
const recipeItemsPerPage = 5;
let allRecipesData = [];

// PAGINATION EXPENSES
let currentPage = 1;
const itemsPerPage = 10;
let activeExpenseData = [];
let allExpenseData = [];
let currentBudget = 0;

// PAGINATION OTHER INCOME
let allOtherIncomeData = [];
let filteredOtherIncomeData = [];
let otherIncomeCurrentPage = 1;
const otherIncomeRowsPerPage = 10;

// PAGINATION BRANCH
let allBranches = [];
let branchCurrentPage = 1;
const branchPerPage = 5;

// PAGINATION USERS
let allUsers = [];
let userCurrentPage = 1;
const userPerPage = 5;

// PAGINATION REWARD
let rewardData = [];
let rewardPage = 1;
const rewardLimit = 5;

function applyTheme() {
  const theme = localStorage.getItem("theme") || "dark";

  if (theme === "dark") {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }
	updateMunoLogo();
}

function toggleTheme() {
  const html = document.documentElement;
  html.classList.toggle("dark");
  const isDark = html.classList.contains("dark");
  localStorage.setItem(
    "theme",
    isDark ? "dark" : "light"
  );

  updateThemeIcon();
	updateMunoLogo();
}

const MUNO_LOGO_LIGHT =
  "https://glbyqlibiapiorztgxee.supabase.co/storage/v1/object/public/App-Logo/MUNO%20DARK%20512.png";
const MUNO_LOGO_DARK =
  "https://glbyqlibiapiorztgxee.supabase.co/storage/v1/object/public/App-Logo/MUNO%20WHITE%20512.png";

function updateMunoLogo() {
  const logo = document.getElementById("munoLogo");
  if (!logo) return;
  const isDark = document.documentElement.classList.contains("dark");
  logo.src = isDark
    ? MUNO_LOGO_DARK
    : MUNO_LOGO_LIGHT;
}

function updateThemeIcon() {
  const icon = document.getElementById("themeIcon");
  if (!icon) return;
  const isDark = document.documentElement.classList.contains("dark");
  icon.textContent = isDark ? "light_mode" : "dark_mode";
}
	
let sidebarOpen = false;
function toggleSidebar() {
	const sidebar = document.getElementById("sidebar");
	if (!sidebar) return;
	sidebarOpen = !sidebarOpen;
	if (sidebarOpen) { 
		sidebar.style.width = "18rem"; // w-72
	} else { 
		sidebar.style.width = "4rem";  // w-16
	}
}

// CLOSE SAAT TAP DI LUAR — KHUSUS HP
document.addEventListener("click", function (e) {
	if (window.innerWidth >= 768) return;
	const sidebar = document.getElementById("sidebar");
	if (!sidebar || !sidebarOpen) return;
	// Tap di dalam sidebar → jangan close
	if (sidebar.contains(e.target)) return;
	// Tap di luar → close
	sidebarOpen = false;
	sidebar.style.width = "4rem";
});



let billingOpen = false;

function toggleBillingSidebar(mode = "table") {
  const sidebar = document.getElementById("billingSidebar");
  billingOpen = !billingOpen;

  const width =
    mode === "pos"
      ? "w-[520px]"
      : "w-[350px]";

  if (billingOpen) {
    sidebar.classList.remove(
      "translate-x-[120%]",
      "opacity-0",
      "pointer-events-none",
      "w-0",
      "w-[350px]",
      "w-[520px]"
    );
    sidebar.classList.add(width);

  } else {
    sidebar.classList.add(
      "translate-x-[120%]",
      "opacity-0",
      "pointer-events-none",
      "w-0"
    );
    sidebar.classList.remove(
      "w-[350px]",
      "w-[520px]"
    );
  }
}

function setActiveCategory(el){
  document.querySelectorAll(".category-btn")
    .forEach(btn=>{
      btn.classList.remove("active-category");
    });
  el.classList.add("active-category");
}

function waitBranch(callback) {
  const check = () => {
    if (state.branchId) {
      callback();
    } else {
      setTimeout(check, 50);
    }
  };
  check();
}

function updateDeductionStats(totalQty) {
  const dailyEl = document.getElementById("dailyDeductionValue");
  if (dailyEl) {
    dailyEl.innerText = totalQty + " Unit";
  }
}

function filterByBranch(data) {
  if (!state.branchId) return [];
  return (data || []).filter(item => {
    return !item.branchId || item.branchId === state.branchId;
  });
}


function formatIDR(amount) {
  if (!amount || isNaN(amount)) amount = 0;
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}

function formatIDR(value) {
  return "Rp " + Math.round(value).toLocaleString("id-ID");
}

function setValue(id, value) {
  const el = document.getElementById(id);
  if (el) {
    el.value = value;
  }
}

function setHTML(id, value) {
  const el = document.getElementById(id);
  if (el) {
    el.innerHTML = value;
  }
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) {
    el.innerText = value;
  }
}
	
applyTheme();
	
document.addEventListener("DOMContentLoaded", async () => {
  const params = new URLSearchParams(window.location.search);
  // 1. CEK PERUBAHAN TENANT (Wajib Login Ulang Jika Tenant Berubah)
  const urlTenant = params.get("tenant") ? params.get("tenant").trim() : null;
  const savedTenant = localStorage.getItem("pos_tenantSlug");

  // Jika di URL ada tenant DAN berbeda dengan yang tersimpan di localStorage sebelumnya
  if (urlTenant && savedTenant && urlTenant !== savedTenant) {
    // Hapus sesi user agar harus login ulang dengan akun tenant baru
    localStorage.removeItem("pos_user");
    localStorage.removeItem("pos_session_id");
    localStorage.removeItem("pos_branchId");
    localStorage.removeItem("pos_cached_tenant_config");
  }

  // Set tenant slug aktif
  if (urlTenant) {
    state.tenantSlug = urlTenant;
    localStorage.setItem("pos_tenantSlug", state.tenantSlug);
  } else {
    state.tenantSlug = savedTenant || null;
  }
	
  // 2. CONNECT TENANT (Dengan Fallback Offline yang Aman)
  if (state.tenantSlug) {
    try {
      const tenantConfig = await connectTenant(state.tenantSlug);
      if (tenantConfig) {
        localStorage.setItem("pos_cached_tenant_config", JSON.stringify(tenantConfig));
      }
    } catch (error) {
      const cachedConfig = localStorage.getItem("pos_cached_tenant_config");
      if (cachedConfig) {
        const config = JSON.parse(cachedConfig);
	        supabaseClient = supabase.createClient(
	          config.supabase_url,
	          config.supabase_anon_key
	        );
      } else {
       	 alert("Tenant tidak aktif. Silakan hubungi administrator.");
        return;
      }
    }
  }
	
  // 3. PAGE & BOOT APP
  const page = params.get("page") || window.__ACTIVE_PAGE || null;
  async function bootApp(targetPage = "dashboardPage") {
    const ok = await restoreSession();
    if (!ok) {
      navigate("loginPage");
      return;
    }

    const role = state.user?.role?.toLowerCase();
    // BRANCH CONTEXT
    if (role === "owner") {
      state.branchId = localStorage.getItem("pos_branchId") || "";
    } else {
      state.branchId = state.user?.branchId || localStorage.getItem("pos_branchId") || "";
    }

    window.__ACTIVE_PAGE = targetPage;
    navigate(targetPage);
    // Tunggu template masuk ke DOM
    setTimeout(() => {
      updateThemeIcon();
      updateMunoLogo();
    }, 0);
  }
  // ROUTING
  if (page) {
    window.__ACTIVE_PAGE = page;
    await bootApp(page);
  } else {
    await bootApp("dashboardPage");
  }
});



async function restoreSession() {
  const user = localStorage.getItem("pos_user");
  const branchId = localStorage.getItem("pos_branchId");
  const loginTenant = localStorage.getItem("pos_login_tenant");
  const sessionId = localStorage.getItem("pos_session_id");

  // TIDAK ADA USER
  if (!user) {
    return false;
  }

  const currentTenant = state.tenantSlug || "master";

  // SESSION ID TIDAK ADA
  if (!sessionId) {
    localStorage.removeItem("pos_user");
    localStorage.removeItem("pos_branchId");
    localStorage.removeItem("pos_login_tenant");
    localStorage.removeItem("pos_session_id");
    state.user = null;
    state.branchId = "";
    return false;
  }
	
  // TENANT BERBEDA
  if (
    loginTenant &&
    loginTenant !== currentTenant
  ) {
    localStorage.removeItem("pos_user");
    localStorage.removeItem("pos_branchId");
    localStorage.removeItem("pos_login_tenant");
    localStorage.removeItem("pos_session_id");
    state.user = null;
    state.branchId = "";
    return false;
  }

  // VALIDASI SESSION + STATUS TENANT
  try {
    const response =
      await fetch("/api/auth/login", {
        method: "GET",

        headers: {
          "x-session-id": sessionId,
          "x-tenant-slug": currentTenant
        }
      });

    const result = await response.json();

    // TENANT INACTIVE / SESSION INVALID
    if (
      !response.ok ||
      !result.success
    ) {

      localStorage.removeItem("pos_user");
      localStorage.removeItem("pos_branchId");
      localStorage.removeItem("pos_login_tenant");
      localStorage.removeItem("pos_session_id");
      state.user = null;
      state.branchId = "";

      alert(
        result.error ||
        "Session tidak valid atau tenant tidak aktif."
      );
      return false;
    }

    // SESSION VALID
    state.user = {
      ...result.user,
      id: result.user.id || result.user.ID_User,
      username: result.user.username || result.user.Username,
      role: result.user.role || result.user.Role,
      branchId: result.user.branchId
    };
    state.branchId =result.user.branchId || "";
    localStorage.setItem("pos_user", JSON.stringify(state.user));

    if (state.branchId) {
      localStorage.setItem(
        "pos_branchId",
        state.branchId
      );
    }

    localStorage.setItem(
      "pos_login_tenant",
      currentTenant
    );
    return true;
  } catch (error) {
    // Jangan hapus session kalau hanya
    // internet/API sedang tidak tersedia.
    state.user = JSON.parse(user);
    state.branchId = branchId || "";
    return true;
  }
}

function navigate(pageId, params = {}) {
  const role =
    (
      state.user?.Role ||
      state.user?.role ||
      ""
    ).toLowerCase();

  if (params.roles) {
    const allowedRoles =
      params.roles.map(
        r => r.toLowerCase()
      );

    if (
      !allowedRoles.includes(role)
    ) {
      alert(
        "You do not have permission to access this page."
      );
      return;
    }
  }
  // OWNER ONLY PAGE
  const ownerPages = [
    "cashFlowPage"
  ];

  if (
    ownerPages.includes(pageId) &&
    role !== "owner"
  ) {
    showToast(
      "Access denied"
    );
    return;
  }

  const template = document.getElementById(pageId);
  const app = document.getElementById("app");
  if (!template || !app) {
    return;
  }
  app.innerHTML = "";
  document.querySelectorAll(".page-overlay").forEach(e => e.remove());
  app.appendChild(template.content.cloneNode(true));
	updateMunoLogo();
  setTimeout(() => {
    loadBranchName();
  }, 0);

  // HEADER USER
  const headerUsername = document.getElementById("headerUsername");
  const headerRole = document.getElementById("headerRole");
	if (headerUsername) {
	  headerUsername.textContent =
	    state.user?.Username ||
	    state.user?.username ||
	    "-";
	}
	
	if (headerRole) {
	  headerRole.textContent =
	    state.user?.Role ||
	    state.user?.role ||
	    "-";
	}

	// SETTINGS MENU
	// Owner + Admin
	const userRole =
	  (
	    state.user?.Role ||
	    state.user?.role ||
	    ""
	  ).toLowerCase();
	
	document.querySelectorAll(".settingsMenu").forEach(menu => {
	  menu.style.display =
	    (
	      userRole === "owner" ||
	      userRole === "admin"
	    )
	      ? "flex"
	      : "none";
	});

	// OWNER ONLY MENU
	document.querySelectorAll(".ownerOnly").forEach(menu => {
	  menu.style.display =
	    userRole === "owner"
	      ? "flex"
	      : "none";
	});

  currentPage = pageId;
  if (window.dashboardInterval) {
    clearInterval(window.dashboardInterval);
    window.dashboardInterval = null;
  }
  setTimeout(() => {
    initModule(pageId, params);
  }, 50);
}
	
async function handleLogin() {
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();

  try {
    let result;
    try {
      const response =
        await fetch("/api/auth/login", {
          method: "POST",

          headers: {
            "Content-Type": "application/json"
          },

          body: JSON.stringify({
            tenantSlug: state.tenantSlug || "master",
            username,
            password
          })
        });

		result = await response.json();
		if (!response.ok) {
		  const error = new Error(
			result.error ||
			"Login gagal"
		  );
		  error.status = response.status;
		  throw error;
		}

    } catch (networkError) {
			
		if (networkError.status) {
		  throw networkError;
		}
			
      // MASTER TIDAK BOLEH OFFLINE FALLBACK
    	if (
        !state.tenantSlug ||
        state.tenantSlug === "master"
      ) {
        throw networkError;
      }

      // CUSTOMER OFFLINE
      if (!supabaseClient) {
        throw new Error(
          "Tenant offline tidak tersedia."
        );
      }

      const {
        data: dbUser,
        error: dbError
      } =
        await supabaseClient
          .from("Users")
          .select(
            "ID_User, Username, Password, Role, branchId"
          )
          .eq(
            "Username", 
			  username
          )
          .maybeSingle();

      if (
        dbError ||
        !dbUser
      ) {
        throw new Error(
          "Login offline gagal: Username tidak ditemukan."
        );
      }

      if (
        dbUser.Password !== password
      ) {
        throw new Error(
          "Login offline gagal: Password salah."
        );
      }

      result = {
        success: true,
        session_id:
          "offline_session_" +
          Date.now(),
        user: {
          ID_User: dbUser.ID_User,
          Username: dbUser.Username,
          Role: dbUser.Role,
          branchId: dbUser.branchId
        }
      };
    }

    // VALIDASI
    if (
      !result ||
      !result.success
    ) {
      alert(
        "Username atau password salah"
      );
      return;
    }

    // USER
    const user = {
      ...result.user,

      id: result.user.id || result.user.ID_User,
      username: result.user.username || result.user.Username,
      role: result.user.role || result.user.Role,
      branchId: result.user.branchId
    };
    state.user = user;
    state.branchId = user.branchId || "";
    localStorage.setItem("pos_user", JSON.stringify(user));

    // SESSION
    if (!result.session_id) {
      throw new Error(
        "Session login tidak dibuat."
      );
    }

    localStorage.setItem("pos_session_id", result.session_id);
    if (state.branchId) {localStorage.setItem("pos_branchId", state.branchId);}
    localStorage.setItem("pos_login_tenant", state.tenantSlug || "master");

    navigate("dashboardPage");

  } catch (err) {
    alert(
      err.message ||
      "Login gagal"
    );
  }
}
	
function logout() {
  localStorage.removeItem("pos_user");
  localStorage.removeItem(
    "pos_branchId"
  );
  localStorage.removeItem(
    "pos_session_id"
  );
  state.user = null;
  state.branchId = null;
  state.cart = [];
  state.products = [];
  navigate(
    "loginPage"
  );
}
	
function initApp() {
  const params =
    new URLSearchParams(
      window.location.search
    );
  const page = params.get("page");
  const urlTenant = params.get("tenant");
  if (urlTenant) {
    state.tenantSlug = urlTenant.trim();
    localStorage.setItem("pos_tenantSlug", state.tenantSlug);
  } else {

    state.tenantSlug =
      localStorage.getItem(
        "pos_tenantSlug"
      ) || "";
  }
	
  // USER
  const user = localStorage.getItem("pos_user");
  if (!user) {
    navigate(
      "loginPage"
    );
    return;
  }

  state.user = JSON.parse(user);
  const role =
    (
      state.user?.role ||
      state.user?.Role ||
      ""
    ).toLowerCase();

  // BRANCH CONTEXT
  if (role === "owner") {
    state.branchId =
      localStorage.getItem(
        "pos_branchId"
      ) || "";

  } else {
    state.branchId =
      state.user?.branchId ||
      localStorage.getItem(
        "pos_branchId"
      ) ||
      "";
  }
	
  if (page) {
    window.__ACTIVE_PAGE = page;
    navigate(page);
    return;
  }
  navigate("dashboardPage");
}
	
function formatRupiah(angka) {
  return "IDR " + Number(angka).toLocaleString("id-ID");
}
	
function formatRupiah(num) {
  return "Rp " + Number(num).toLocaleString("id-ID");
}

function formatPercent(val) {
  let num = Number(val) || 0;
  return (num >= 0 ? "+" : "") + num.toFixed(1) + "%";
}

function format(value) {
  return "IDR " + Number(value || 0)
    .toLocaleString("id-ID");
}

function formatRupiah(number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0
  }).format(Number(number || 0));
}
	
function formatDate(date) {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
}

function formatDate(date) {
  if (!date) return "-";
  let d;
  if (typeof date === "string") {
    d = new Date(date.replace(" ", "T"));
  } else {
    d = new Date(date);
  }
  if (isNaN(d.getTime())) {
    return "-";
  }
  return d.toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function formatRupiah(num) {
  return "IDR " + Number(num).toLocaleString("id-ID");
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
	
let clockInterval;
function startClock() {
  if (clockInterval) clearInterval(clockInterval);
  updateDateTime();
  clockInterval = setInterval(updateDateTime, 1000);
}

function initModule(pageId) {
  switch(pageId) {
    case "dashboardPage":
			loadDashboard();
			startClock();
    break;

    case "grossRevenuePage": {
      initDatePicker();
      const startEl = document.getElementById("startDate");
      const endEl = document.getElementById("endDate");

      if (!startEl || !endEl) break;
			
      const today = new Date();
      const past = new Date();

      past.setDate(today.getDate() - 7);
      startEl.value = past.toISOString().split("T")[0];
      endEl.value = today.toISOString().split("T")[0];

      updateDateLabel(  startEl.value, endEl.value );
      loadGrossRevenuePage();
      break;
    }
		  
    case "recentTransactionsPage":{
			const startEl = document.getElementById("startDate");
			const endEl = document.getElementById("endDate");
			if (startEl && endEl) {
				const today = new Date();
				const past = new Date();
				past.setDate(today.getDate() - 7);

				startEl.value = past.toISOString().split("T")[0];
				endEl.value = today.toISOString().split("T")[0];
			}
			// 1. INIT LISTENER DULU
			initTransactionFilters();
			// 2. BARU LOAD DATA
			loadRecentTransactionsPage();
			loadRecentTransactionSummary();
    break;
    }

    case "posPage":
      resetPOSMember();
      waitBranch(() => {
        loadNotifications();
        loadProducts(() => {
          initSearch();
        });
    
        fetchSettings(() => {
          renderCart();
        });
				loadLoyaltySettings();
        preloadRecipeMap();
        loadRecipes(state.branchId);
      });
    break;
		  
    case "orderPage":
      loadOrders(state.branchId);
    break;

    case "memberPage":
      waitBranch(() => {
        loadMembers(() => {
          loadMemberStats();
          loadMemberGrowth();
          loadNotifications();
          initMemberSearch();
          initTierFilter();
          initMemberExport();
        });
      });
    break;

    case "tablePage":
      loadTables(state.branchId);
    break;

    case "inventoryPage":
		  waitBranch(async () => {
		    await loadInventoryPage(
		      state.branchId
		    );
		    await loadRecipeProducts();
		    initIngredientExportDate();
			initPurchaseFilters();
		  });
	  break;

    case "analyticsPage": {
      initAnalyticsDate();
      loadAnalyticsPage();
    break;
    }
   
    case "settingsPage":
      loadSettingsPage();
    break;

    case "loyaltysettingPage":
      initLoyaltyPage();
    break;

		case "taxservicesettingPage":
		  waitBranch(async () => {
		    await loadTaxSettings();
		  });
	  break;

    case "expensessettingPage":{
			const startEl = document.getElementById("expenseStartDate");
			const endEl = document.getElementById("expenseEndDate");
			const today = new Date();
			const past = new Date();
			past.setDate(today.getDate() - 6);
			if (startEl) { startEl.value = past.toISOString().split("T")[0]; }
			if (endEl) { endEl.value = today.toISOString().split("T")[0]; }
			initExpenseSettingPage();
			initOtherIncomeEvents();
    break;
    }

    case "cashFlowPage":
      initCashFlowPage();
      loadCashFlowNotification()
    break;

		case "assetPage":
		  waitBranch(() => {
		    initAssetPage();
		  });
		break;

		case "accountingPage":
		  initAccountingModule();
		break;
  }
}
	
  // ==================================
  // DASHBOARD
  // ==================================

async function loadDashboard() {
  const branchId = state.branchId;
  const cacheKey = JSON.stringify({branchId: branchId});
  if (
    state.dashboardData &&
    state.dashboardFilter === cacheKey
  ) {
    renderDashboard(
      state.dashboardData
    );
    return;
  }
  if (!branchId) {
    return;
  }
  try {
    const dashboardData =
      await getDashboardDataRPC(
        branchId
      );

    state.dashboardData = dashboardData || {};
    state.dashboardFilter = cacheKey;
    renderDashboard(state.dashboardData);
  }
  catch(err) {
    showToast(
      "Gagal memuat dashboard",
      "error"
    );
  }
}

function updateDateTime() {
  const dateEl = document.getElementById("dash-date");
  const timeEl = document.getElementById("dash-time");
  if (!dateEl || !timeEl) return; 
  const now = new Date();
  const date = now.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });

  const time = now.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit"
  });

  dateEl.innerText = date;
  timeEl.innerText = time;
}

function renderDashboard(data) {
  if (!data) return;
  const safeSet = (id, value) => {
    const el = document.getElementById(id);
    if (el) el.innerText = value;
  };

  renderLowStock(data.lowStock || []);
  renderRecentTransactions(data.recentTransactions || []);
  renderShiftPerformance(data.shift || {});
	
  const revenue = data.revenue || data.summary?.totalRevenue || 0;
  const orders = data.orders || data.summary?.orders || 0;
  const aov = data.aov || data.summary?.aov || 0;

  safeSet("dash-revenue", format(revenue));
  safeSet("dash-orders", orders);
  safeSet("dash-aov", format(aov));

  safeSet("dash-revenue-growth", formatPercent(data.growth?.revenue || 0));
  safeSet("dash-orders-growth", formatPercent(data.growth?.orders || 0));
  safeSet("dash-aov-growth", formatPercent(data.growth?.aov || 0));

  const occEl = document.getElementById("dash-occupancy");
  const occPercentEl = document.getElementById("dash-occupancy-percent");

  if (data.occupancy) {
    if (occEl) occEl.innerText = `${data.occupancy.occupied}/${data.occupancy.total}`;
    if (occPercentEl) occPercentEl.innerText = `${data.occupancy.percent}% FULL`;
  }

  const tbody = document.getElementById("dash-transactions");
  if (tbody) {
    const trx = (data.recentTransactions || []).slice(0, 20);
    tbody.innerHTML = trx.length
      ? trx.map(t => `
        <tr>
          <td class="pl-6">${t.id}</td>
          <td class="text-center">${t.table}</td>
          <td class="pl-10">${format(t.total)}</td>
          <td class="text-center">${t.status || "-"}</td>
        </tr>
      `).join("")
      : `<tr><td colspan="5">No transactions</td></tr>`;
  }

  if (document.getElementById("shift-wait"))
    document.getElementById("shift-wait").innerText = data.shift?.waitTime || "0m";
  if (document.getElementById("shift-tips"))
    document.getElementById("shift-tips").innerText = format(data.shift?.tips || 0);
  if (document.getElementById("shift-rating"))
    document.getElementById("shift-rating").innerText = data.shift?.rating || 0;
}

function renderLowStock(items) {
  const el = document.getElementById("low-stock-list");
  if (!el) return;

  if (!items.length) {
    el.innerHTML = `<p class="text-muted text-sm">No low stock items</p>`;
    return;
  }

  el.innerHTML = items.map(i => `
    <div class="flex justify-between text-sm py-1 border-b border-outline-variant">
      <span>${i.nama}</span>
      <span class="text-red-400 font-bold">${i.stok}</span>
    </div>
  `).join("");
}

function renderRecentTransactions(list) {
  const el = document.getElementById("dash-transactions");
  if (!el) return;

  if (!Array.isArray(list) || !list.length) {
    el.innerHTML = `
    <tr>
      <td colspan="4">
        No transactions
      </td>
    </tr>`;
    return;
  }

  el.innerHTML = list.map(t => `
    <tr>
      <td class="pl-6">${t.id}</td>
      <td class="text-center">${t.table || "-"}</td>
      <td class="pl-10">${format(t.total)}</td>
      <td class="text-center">${t.status || "-"}</td>
    </tr>
  `).join("");
}

function renderShiftPerformance(shift) {
  const el = document.getElementById("shift-performance");
  if (!el) return;

  const format = v => "IDR " + (v || 0).toLocaleString("id-ID");

  el.innerHTML = `
    <div class="flex flex-col gap-3">

      <div class="flex items-center justify-between py-3 border-b border-outline-variant">
        <div>
          <p class="text-sm text-on-surface font-medium font-bold">MORNING</p>
          <p class="text-xs text-muted ">${shift.pagi?.orders || 0} orders</p>
        </div>
        <p class="font-bold">${format(shift.pagi?.revenue)}</p>
      </div>

      <div class="flex items-center justify-between py-3 border-b border-outline-variant">
        <div>
          <p class="text-sm text-on-surface font-medium font-bold">AFTERNOON</p>
          <p class="text-xs text-muted ">${shift.siang?.orders || 0} orders</p>
        </div>
        <p class="font-bold">${format(shift.siang?.revenue)}</p>
      </div>

      <div class="flex items-center justify-between py-3 border-b border-outline-variant">
        <div>
          <p class="text-sm text-on-surface font-medium font-bold">EVENING</p>
          <p class="text-xs text-muted ">${shift.malam?.orders || 0} orders</p>
        </div>
        <p class="font-bold">${format(shift.malam?.revenue)}</p>
      </div>

    </div>
  `;
}

  // ==================================
  // RECENT TRANSAKSI
  // ==================================

function renderTransactions(data) {
  const tbody = document.getElementById("recentTransactionsList");
  if (!tbody) return;
  // EMPTY
  if (!data || data.length === 0){
    tbody.innerHTML = `
      <tr>
        <td colspan="7"
          class="text-center py-6 text-muted">
          No transactions
        </td>
      </tr>
    `;
    return;
  }
  tbody.innerHTML = data.map(trx => {
    const statusColor =
      trx.status === "Paid"
        ? "text-green-500"
        : trx.status === "Pending"
        ? "text-yellow-500"
        : "text-red-500";

    return `
      <tr class="hover:bg-outline-variant transition-colors">
        <td class="px-6 py-4 font-medium">
          ${trx.id || "-"}
        </td>

        <td>
          ${trx.date || trx.createdAt
            ? formatDate(trx.date || trx.createdAt)
            : "-"}
        </td>

        <td class="px-6 py-4 text-center">
          ${trx.table || "-"}
        </td>

        <td>
          ${trx.memberName || trx.memberId || trx.member || "-"}
        </td>

        <td class="px-6 py-4 text-right font-bold">
          Rp ${Number(trx.total || 0).toLocaleString("id-ID")}
        </td>

        <td class="px-6 py-4 text-center">
          ${trx.status || "-"}
        </td>

        <td class="px-6 py-4 text-center">
          <button
            onclick="openTransactionModal('${trx.id}')"
            class="text-blue-400 hover:underline text-sm">
            View
          </button>
        </td>
      </tr>
    `;
  }).join("");
}

function refreshRecentTransactions() {
  loadRecentTransactionsPage();
  loadRecentTransactionSummary();
}

function initTransactionFilters() {
  const start = document.getElementById("startDate");
  const end = document.getElementById("endDate");
  const status = document.getElementById("statusFilter");
  if (!start || !end) return;
  let timer;

  const trigger = () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      refreshRecentTransactions();
    }, 300);
  };
  start.addEventListener("change", trigger);
  end.addEventListener("change", trigger);
  start.addEventListener("input", trigger);
  end.addEventListener("input", trigger);
  status?.addEventListener("change", trigger);
}
	
async function loadRecentTransactionsPage() {
  if (!state.branchId) {
    recentData = [];
    paginateRecentTransactions([]);
    return;
  }
  const start = document.getElementById("startDate")?.value || "";
  const end = document.getElementById("endDate")?.value || "";
  const status = document.getElementById("statusFilter")?.value || "ALL";
  const table = document.getElementById("tableFilter")?.value || "ALL";
  const cacheKey =
    JSON.stringify({
      branchId: state.branchId,
      role: state.user?.role,
      start,
      end,
      status,
      table
    });

  if (
    state.recentTransactionsData &&
    state.recentTransactionsFilter === cacheKey
  ) {
    recentData = state.recentTransactionsData;
    recentCurrentPage = 1;
    paginateRecentTransactions(recentData);
    return;
  }
  try {
    const transactions =
      await getRecentTransactionsPageRPC(
        state.branchId,
        start,
        end,
        status,
        table
      );
    recentData = transactions || [];
    state.recentTransactionsData = recentData;
    state.recentTransactionsFilter = cacheKey;
    recentCurrentPage = 1;
    paginateRecentTransactions(recentData);
  }
  catch(err) {
  	showToast(
	    "Gagal memuat transaksi",
	    "error"
	  );
  }
}

async function initExportButton() {
  const btn =
    document.getElementById("exportBtn");
  if (!btn) return;
  btn.onclick = async () => {
    const start = document.getElementById("startDate")?.value || "";
    const end = document.getElementById("endDate")?.value || "";
    const status = document.getElementById("statusFilter")?.value || "ALL";
    // Buka tab dulu agar tidak kena popup blocker
    const pdfTab = window.open("", "_blank");
    if (pdfTab) {
      pdfTab.document.write(`
        <html>
          <head>
            <title>
              Generating PDF...
            </title>

            <style>
              body {
                font-family: Arial;
                display: flex;
                justify-content: center;
                align-items: center;
                height: 100vh;
                background: #0B0F14;
                color: white;
              }
            </style>
          </head>
          <body>
            <h2>
              Generating PDF...
            </h2>
          </body>
        </html>
      `);
    }
    try {
			const sessionId =
  				localStorage.getItem("pos_session_id");
      const res =
        await fetch(
          "/api/export-pdf-report",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json"
            },
            body: JSON.stringify({
              start,
              end,
              status,
              branchId: state.branchId,
							sessionId,
							tenantSlug: state.tenantSlug
            })
          }
        );
      if (!res.ok) {
        throw new Error(
          await res.text()
        );
      }
      const url =
        await res.text();
      if (pdfTab && url) {
        pdfTab.location.href =
          url;
      }
      else {
        if (pdfTab) {
          pdfTab.document.body.innerHTML = `
            <h2>
              PDF belum aktif
            </h2>
          `;
        }
      }
    }
    catch (err) {
	  showToast(
		"Gagal export PDF",
		"error"
	  );
      if (pdfTab) {
        pdfTab.document.body.innerHTML = `
          <h2>
            Failed Generate PDF
          </h2>
          <p>
            ${err.message || ""}
          </p>
        `;
      }
    }
  };
}

function paginateRecentTransactions(data) {
  const start = (recentCurrentPage - 1) * recentItemsPerPage;
  const end = start + recentItemsPerPage;
  const pageData = data.slice(start, end);

  renderTransactions(pageData);
  renderRecentPagination(data.length);
}


function renderRecentPagination(totalData) {
  const totalPages = Math.max( 1, Math.ceil(totalData / recentItemsPerPage) );
  // INFO
  const from =
    totalData === 0
      ? 0
      : (recentCurrentPage - 1) * recentItemsPerPage + 1;
  const to = Math.min( recentCurrentPage * recentItemsPerPage, totalData );
  const info = document.getElementById("recentTransactionInfo");
  if (info) { info.innerText =  `Showing ${from}-${to} of ${totalData}`;}
  // BUTTON
  const prevBtn = document.getElementById("recentPrevBtn");
  const nextBtn = document.getElementById("recentNextBtn");
  if (prevBtn) { prevBtn.disabled = recentCurrentPage <= 1; }
  if (nextBtn) { nextBtn.disabled = recentCurrentPage >= totalPages; }
}

document.addEventListener("click", function(e) {
  // PREVIOUS
  if (e.target.closest("#recentPrevBtn")) {
    if (recentCurrentPage > 1) {
      recentCurrentPage--;
      paginateRecentTransactions(recentData);
    }
  }
  // NEXT
  if (e.target.closest("#recentNextBtn")) {
    const maxPage = Math.ceil(recentData.length / recentItemsPerPage);
    if (recentCurrentPage < maxPage) {
      recentCurrentPage++;
      paginateRecentTransactions(recentData);
    }
  }
});


function formatCurrency(value) {
  return "IDR " + Number(value || 0).toLocaleString("id-ID");
}

async function loadRecentTransactionSummary() {
  const start = document.getElementById("startDate")?.value || "";
  const end = document.getElementById("endDate")?.value || "";
  const status = document.getElementById("statusFilter")?.value || "ALL";
  const table = document.getElementById("tableFilter")?.value || "ALL";
  const branchId = state.branchId || "";
  const role = state.user?.role || "user";
  const cacheKey =
    JSON.stringify({
      branchId,
      role,
      start,
      end,
      status,
      table
    });

  if (
    state.recentSummaryData &&
    state.recentSummaryFilter === cacheKey
  ) {
    renderRecentTransactionSummary(
      state.recentSummaryData
    );
    return;
  }

  try {
    const summary =
      await getRecentTransactionSummaryRPC(
        branchId,
        start,
        end,
        status,
        table
      );

    state.recentSummaryData = summary || {};
    state.recentSummaryFilter = cacheKey;
    renderRecentTransactionSummary(state.recentSummaryData);
  }
  catch(err) {
  }
}

function renderRecentTransactionSummary(data) {
  document.getElementById(
    "totalRevenueValue"
  ).textContent =
    formatCurrency(data.revenue || 0);

  document.getElementById(
    "activeGuestsValue"
  ).textContent =
    Number(data.activeGuests || 0)
      .toLocaleString("id-ID");

  document.getElementById(
    "itemsSoldValue"
  ).textContent =
    Number(data.itemsSold || 0)
      .toLocaleString("id-ID");
}

async function exportRecentTransactions() {
	
  const start = document.getElementById("startDate")?.value || "";
  const end = document.getElementById("endDate")?.value || "";
  const status = document.getElementById("statusFilter")?.value || "ALL";

  if (!start || !end) {
    alert("Pilih tanggal dulu");
    return;
  }

  const branchId =
    state.branchId || "";
  if (!branchId) {
    alert("Branch belum tersedia");
    return;
  }

  // OPEN PDF / REPORT TAB
  const pdfWindow = window.open("", "_blank");
  if (!pdfWindow) {
    alert("Popup diblokir browser");
    return;
  }

  pdfWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>
          Generating Report...
        </title>

        <style>
          body {
            margin: 0;
            height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #0B0F14;
            color: white;
            font-family: Arial, sans-serif;
          }

          .box {
            text-align: center;
          }

          .loader {
            width: 32px;
            height: 32px;
            border: 3px solid #ffffff33;
            border-top-color: white;
            border-radius: 50%;
            animation: spin .8s linear infinite;
            margin: 0 auto 20px;
          }

          @keyframes spin {
            to {
              transform: rotate(360deg);
            }
          }
        </style>
      </head>

      <body>
        <div class="box">
          <div class="loader"></div>
          <h2>
            Generating Report...
          </h2>

          <p>
            Please wait
          </p>
        </div>
      </body>
    </html>
  `);

  try {
		const sessionId =
		  localStorage.getItem("pos_session_id");
    const response =
	  await fetch(
	    "/api/export-pdf",
	    {
	      method: "POST",
	      headers: {
	        "Content-Type":
	          "application/json"
	      },
	
	      body: JSON.stringify({
	        type: "recent-transactions",
	        start,
	        end,
	        status,
	        branchId,
					sessionId,
					tenantSlug: state.tenantSlug
	      })
	    }
	  );

    // GET RESPONSE AS TEXT
    const text = await response.text();

    // SERVER ERROR
    if (!response.ok) {
      throw new Error(
        text ||
        "Export gagal"
      );
    }

    // VALIDATE HTML
    if (
      !text ||
      !text.trim()
    ) {
      throw new Error(
        "Response API kosong."
      );
    }
		
    // WRITE REPORT
    pdfWindow.document.open();
    pdfWindow.document.write(text);
    pdfWindow.document.close();
  }

  catch (err) {
    if (pdfWindow) {
      pdfWindow.document.open();
      pdfWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>
              Export Error
            </title>

            <style>
              body {
                font-family: Arial;
                padding: 40px;
                background: #0B0F14;
                color: white;
              }

              .error {
                color: #ff6b6b;
              }
            </style>
          </head>

          <body>
            <h2 class="error">
              Export Error
            </h2>

            <p>
              ${String(err.message || err)}
            </p>
          </body>
        </html>
      `);
      pdfWindow.document.close();
    }
  }
}



function openTransactionModal(trxId) {
  // hapus modal lama
  document.getElementById("transactionModalWrapper")?.remove();
  const template = document.getElementById("transactionModalTemplate");
        if (!template) {
          return;
        }
  const clone = template.content.cloneNode(true);
  const wrapper = document.createElement("div");
  wrapper.id = "transactionModalWrapper";
  wrapper.appendChild(clone);
  document.body.appendChild(wrapper);

  const trx = recentData.find(t => String(t.ID_Transaksi || t.id).trim() === String(trxId).trim());
        if (!trx) return;
  // SIMPAN TRANSAKSI AKTIF
  currentTransaction = { id: trx.ID_Transaksi || trx.id || trx.trxId };
  wrapper.querySelector("#modalTransactionId").innerText = trx.ID_Transaksi || trx.id;
  wrapper.querySelector("#modalTransactionTotal").innerText =
    "Rp " + Number(trx.total || 0).toLocaleString("id-ID");
  wrapper
  .querySelector("#transactionModalOverlay")
  .addEventListener("click", function(e){

    if(e.target.id === "transactionModalOverlay"){
      closeTransactionModal();
    }
  });
}

function openViewTransactionModal() {
  document.getElementById("transactionModalWrapper")?.remove();
        if (!currentTransaction) return;
  const trxId = currentTransaction.id;
  document.getElementById("viewTransactionModalWrapper")?.remove();
  const template = document.getElementById("viewtransactionModalTemplate");
        if (!template) return;
  const wrapper = document.createElement("div");
  wrapper.id = "viewTransactionModalWrapper";
  wrapper.appendChild(template.content.cloneNode(true));
  document.body.appendChild(wrapper);
  const container = wrapper.querySelector("#viewtrxitems");
  container.innerHTML = "Loading...";
  // AMBIL DARI DATA YANG SUDAH LO LOAD (getTransactionWithItems)
  const trx = recentData.find(t => t.id === trxId);
		if (!trx) {
			container.innerHTML = "Data tidak ditemukan";
			return;
		}
  trx.items = Array.isArray(trx.items) ? trx.items : [];
  renderViewTransaction(wrapper, trx);
}

function renderViewTransaction(wrapper, trx) {
  const n = (v) => Number(v || 0);
  const items = Array.isArray(trx.items) ? trx.items : [];
  wrapper.querySelector("#viewtrxid").innerText = trx.id || "-";
  const dt = trx.date ? new Date(trx.date) : null;
  wrapper.querySelector("#viewtrxdate").innerText =
    dt ? dt.toLocaleDateString("id-ID") : "-";
  wrapper.querySelector("#viewtrxtime").innerText =
    dt ? dt.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit"
    }) : "-";
  wrapper.querySelector("#viewtrxtable").innerText = trx.table || "-";
  wrapper.querySelector("#viewtrxcashier").innerText = trx.cashier || "-";

  const subtotal = items.reduce((sum, i) => {
    return sum + (i.qty || 0) * (i.price || 0);
  }, 0);
  wrapper.querySelector("#viewtrxsubtotal").innerText = "IDR " + subtotal.toLocaleString("id-ID");
  wrapper.querySelector("#viewtrxdiscount").innerText = "- IDR " + n(trx.discount).toLocaleString("id-ID");
  wrapper.querySelector("#viewtrxservice").innerText = "IDR " + n(trx.service).toLocaleString("id-ID");
  wrapper.querySelector("#viewtrxtax").innerText = "IDR " + n(trx.tax).toLocaleString("id-ID");
  wrapper.querySelector("#viewtrxtotal").innerText = "IDR " + n(trx.total).toLocaleString("id-ID");
  const container = wrapper.querySelector("#viewtrxitems");
  if (items.length === 0) {
    container.innerHTML = `
      <div class="text-center text-xs opacity-50 py-4">
        No items
      </div>
    `;
    return;
  }

  container.innerHTML = items.map(item => `
    <div class="grid grid-cols-12 items-start text-xs">
      <div class="col-span-8 pr-3">
        <div class="font-medium text-sm">
          ${item.name || "-"}
        </div>
				
        <div class="text-[10px] opacity-60 mt-1">
          ${item.note || ""}
        </div>
      </div>

      <div class="col-span-1 text-center">
        ${item.qty || 0}
      </div>

      <div class="col-span-3 text-right font-medium">
        ${((item.qty || 0) * (item.price || 0)).toLocaleString("id-ID")}
      </div>
    </div>
  `).join("");
}


function openSendDigitalReceipt(data) {
  const trx = recentData.find(t => t.id === data.id) || data;
  const template = document.getElementById("senddigitalReceipt");
  const wrapper = document.createElement("div");
  wrapper.id = "sendDigitalReceiptWrapper";
  wrapper.appendChild(template.content.cloneNode(true));
  document.body.appendChild(wrapper);
  wrapper.querySelector("#receiptTransactionId").textContent = trx.id;
  wrapper.querySelector("#receiptTransactionTotal").textContent = "Rp " + (Number(trx.total) || 0).toLocaleString("id-ID");
  wrapper.querySelector("#receiptWhatsappInput").value = trx.phone || "";
}

async function sendReceiptWhatsapp() {
  const phone = document
  .getElementById("receiptWhatsappInput")
  .value
  .replace(/\D/g, "");
		if (!phone) {alert("Nomor belum diisi");
			return;
		}
  const trxIdEl =document.getElementById( "receiptTransactionId");
		if (!trxIdEl) { alert("Modal belum siap (receiptTransactionId tidak ada)");
			return; }
  const trxId = trxIdEl.textContent.trim();
		if (!trxId || trxId === "undefined") { alert("TRX ID kosong");
			return; }
	
  try {
		
    const trx = await getReceiptDataRPC(trxId);
    if (!trx) {
      alert("Transaksi tidak ditemukan");
      return;
    }
    sendReceiptWhatsappWithData(
      trx,
      phone,
      null
    );
			}
			catch(err){
			alert("Gagal mengambil transaksi" );
  }
}

function sendReceiptWhatsappWithData(trx, phone, customMessage = null) {
  const tpl = document.getElementById("receiptTemplate");
  if (!tpl) return;
  const wrapper = document.createElement("div");
  wrapper.style.position = "absolute";
  wrapper.style.left = "-9999px";
  wrapper.appendChild(tpl.content.cloneNode(true));
	document.body.appendChild(wrapper);
	// Terapkan tema ke receipt
	const isDark = document.documentElement.classList.contains("dark");
	if (isDark) {
	  wrapper.classList.add("dark");
	}
	
  const n = (v) => Number(v || 0);
  const subtotal = n(trx.subtotal);
  const total = n(trx.total);
  
  // HEADER
  wrapper.querySelector("#receiptTitle").textContent =
  trx.branchName || "-";
  if (trx.logo_url) {
  wrapper.querySelector("#receiptLogo").src =
    trx.logo_url;
  }
  const ig = wrapper.querySelector("#receiptInstagram");
  if (ig) {
  ig.textContent =
    trx.instagram
      ? "Instagram: " + trx.instagram
      : "";
  }
  wrapper.querySelector("#receiptId").textContent = trx.id || "-";
  wrapper.querySelector("#receiptDate").textContent = trx.date || "-";
  wrapper.querySelector("#receiptTable").textContent = trx.table || "-";
	wrapper.querySelector("#receiptCashier").textContent = trx.cashier || "-";
  wrapper.querySelector("#receiptPhone").textContent = trx.phone || "-";
  wrapper.querySelector("#receiptAddress").textContent = trx.address || "-";
  const footer = wrapper.querySelector("#receiptFooterText");
  if (footer) {
    footer.innerHTML =
      (trx.receipt_footer || 
      "Thank you for visiting.\nEnjoy the moment. Take it slow.\nHave a nice day.")
      .replace(/\n/g, "<br>");
  }
  wrapper.querySelector("#receiptTotal").textContent = "Rp " + total.toLocaleString("id-ID");
  // BREAKDOWN (FIXED)
  wrapper.querySelector("#receiptSubtotal").textContent = "Rp " + subtotal.toLocaleString("id-ID");
  wrapper.querySelector("#receiptTax").textContent = "Rp " + n(trx.tax).toLocaleString("id-ID");
  wrapper.querySelector("#receiptService").textContent = "Rp " + n(trx.service).toLocaleString("id-ID");
  wrapper.querySelector("#receiptDiscount").textContent = "- Rp " + n(trx.discount).toLocaleString("id-ID");

  // ITEMS
  const container = wrapper.querySelector("#receiptItemsContainer");
  const items = trx.items || [];
  container.innerHTML = items.length
  ? items.map(i => `
    <div class="flex justify-between text-sm mb-2">
      <div>
        <div>${i.name}</div>
        <div class="text-xs opacity-60">Qty: ${i.qty}</div>
      </div>
      <div>
        Rp ${(i.qty * i.price).toLocaleString("id-ID")}
      </div>
    </div>
  `).join("")
  : `<div class="text-xs opacity-50 text-center">No items</div>`;
	
	 // RENDER + SEND
	const canvas = wrapper.querySelector("#receiptCanvas");
	setTimeout(async () => {
	
	  try {
	    const receiptCanvas = await html2canvas(canvas, {
	      scale: 1,
	      useCORS: true,
	      backgroundColor: "#101715"
	    });
	
	    // CANVAS → BLOB
	    const blob = await new Promise(resolve => {
	      receiptCanvas.toBlob(
	        resolve,
	        "image/jpeg",
	        0.65
	      );
	    });
	
	    if (!blob) {
	      throw new Error("Gagal membuat gambar receipt");
	    }
	
	    // UPLOAD LANGSUNG KE SUPABASE STORAGE
	    const fileName = `${trx.id}.jpg`;
		const {
		  error: uploadError
		} = await supabaseClient
		  .storage
		  .from("Recipes_Digital")
	      .upload(
	        fileName,
	        blob,
	        {
	          contentType: "image/jpeg",
	          upsert: true
	        }
	      );
	    if (uploadError) {
	      throw uploadError;
	    }
			
	    // PUBLIC URL
	   const {
		  data: publicData
		} = supabaseClient
		  .storage
		  .from("Recipes_Digital")
		  .getPublicUrl(fileName);
	
	    const url = publicData?.publicUrl;
	    if (!url) {
	      throw new Error(
	        "Receipt URL tidak diterima"
	      );
	    }
			const sessionId =
  			localStorage.getItem("pos_session_id");
			if (!sessionId) {
			  throw new Error("Session login tidak ditemukan");
			}
	    // UPDATE RECEIPT URL
	    const {
		  data: rpcResult,
		  error: rpcError
		} = await supabaseClient.rpc(
		  "update_receipt_url",
		  {
		    p_trx_id: trx.id,
		    p_receipt_url: url,
		    p_session_id: sessionId
		  }
		);
			
			if (rpcError) {
			  throw rpcError;
			}
			
			if (!rpcResult?.success) {
			  throw new Error(
			    rpcResult?.message ||
			    "Gagal menyimpan receipt URL"
			  );
			}
			
	    // WHATSAPP
	    let wa =
	      String(phone || "")
	        .replace(/\D/g, "");
	
	    if (wa.startsWith("0")) {
	      wa =
	        "62" +
	        wa.slice(1);
	    }
	    else if (!wa.startsWith("62")) {
	      wa =
	        "62" +
	        wa;
	    }
	
	    let finalMessage;
	    if (customMessage) {
	      finalMessage =
	        customMessage +
	        "\n\n📎 Digital Receipt\n" +
	        url;
	
	    } else {
	      finalMessage =
	        "🧾 *Digital Receipt*\n\n" +
	        "Thank you for visiting.\n" +
	        "Enjoy the moment. Take it slow.\n\n" +
	        "Have a nice day.\n\n" +
	        "📎 Receipt:\n" +
	        url;
	    }
			
	    window.open(
	      "https://api.whatsapp.com/send?phone=" +
	      wa +
	      "&text=" +
	      encodeURIComponent(finalMessage),
	      "_blank"
	    );
	    wrapper.remove();
	  }
	  catch (err) {
	    console.error(
	      "DIGITAL RECEIPT ERROR:",
	      err
	    );
	    alert(
	      err?.message ||
	      "Gagal membuat digital receipt"
	    );
	    wrapper.remove();
	  }
	}, 100);
}

function goToRecentTransactions() {
  navigate("recentTransactionsPage");
}

function renderReceipt(data) {
  const tpl = document.getElementById("receiptTemplate");
  const clone = tpl.content.cloneNode(true);
  const wrapper = document.createElement("div");
  wrapper.style.position = "absolute";
  wrapper.style.left = "-9999px";
  wrapper.appendChild(clone);
  document.body.appendChild(wrapper);
  wrapper.querySelector("#receiptId").textContent = data.trxId;
  wrapper.querySelector("#receiptDate").textContent = data.date;
  wrapper.querySelector("#receiptTable").textContent = data.table;
	wrapper.querySelector("#receiptCashier").textContent = data.cashier || "-";
  wrapper.querySelector("#receiptTotal").textContent = data.total;
  wrapper.querySelector("#receiptSubtotal").textContent = data.total;
  wrapper.querySelector("#receiptTax").textContent = data.tax;
  wrapper.querySelector("#receiptService").textContent = data.service;
  wrapper.querySelector("#receiptDiscount").textContent = data.discount;
  const canvas = wrapper.querySelector("#receiptCanvas");
	const receiptBackground = "#101715";
  html2canvas(canvas, {
    scale: 1,
    useCORS: true,
    backgroundColor: "#101715"
  }).then(canvas => {
    const image =
      canvas.toDataURL(
        "image/jpeg",
        0.65
      );
    wrapper.remove();
  });
}

document.addEventListener("click", function(e) {
  if (e.target.closest("#closeReceiptModal")) {
    document
		.getElementById("sendDigitalReceiptModal")
		?.remove();
  }
});

function closeTransactionModal() {
  document
    .querySelectorAll(
      "#transactionModalWrapper, #viewTransactionModalWrapper"
    )
    .forEach(el => el.remove());
}

function closeViewTransactionModal() {
  document
    .getElementById("viewTransactionModalWrapper")
    ?.remove();
  openTransactionModal(currentTransaction);
}

async function fetchSettings(callback) {
  try {
    const data =
      await getSettingsPageDataRPC();
    if (!data) {
      throw new Error(
        "Data settings tidak ditemukan"
      );
    }
    // Ambil bagian settings saja
    state.settings = data.settings || {};
		
    if (callback) {
      callback();
    }
  } catch (err) {
    alert(
      "Gagal mengambil settings"
    );
  }
}


    // ==================================
    // GROSS REVENUE
    // ==================================      

async function loadGrossRevenuePage() {
  const branchId = state.branchId || "";
  const startDate = document.getElementById("startDate")?.value || "";
  const endDate = document.getElementById("endDate")?.value || "";
  const cacheKey = JSON.stringify({
    branchId,
    startDate,
    endDate
  });

  // CACHE FRONTEND
  if (
    state.grossRevenueData &&
    state.grossRevenueFilter === cacheKey
  ) {
    const res = state.grossRevenueData;
    renderGrossRevenue(res.summary || {});
    renderRevenueTrend(res.trend || []);
    renderDonut(res.category || []);
    renderRecentTransactions(res.recentTransactions || []);
    allTopRevenueData = res.topRevenue || [];
    topRevenueCurrentPage = 1;
    renderTopRevenueTable();
    return;
  }
  try {
	  const res =
	    await getGrossRevenueDataRPC(
	      branchId,
	      startDate,
	      endDate
	    );

	  // SIMPAN CACHE
	  state.grossRevenueData = res;
	  state.grossRevenueFilter = cacheKey;
	  renderGrossRevenue(res.summary || {});
	  renderRevenueTrend(res.trend || []);
	  renderDonut(res.category || []);
	  renderRecentTransactions(res.recentTransactions || []);
	  allTopRevenueData = res.topRevenue || [];
	  topRevenueCurrentPage = 1;
	  renderTopRevenueTable();
	}
	catch (err) {
	  showToast(
	    "Gagal memuat Gross Revenue",
	    "error"
	  );
	}
}

async function applyDateFilter() {
  const branchId =
    state.branchId || "";
  // Owner belum pilih outlet
  if (!branchId) return;
  const start = document.getElementById("startDate")?.value;
  const end = document.getElementById("endDate")?.value;
  if (!start || !end) return;
  toggleLoading(true);

  try {
	  
    // GET GROSS REVENUE DATA
    const res =
      await getGrossRevenueDataRPC(
        branchId,
        start,
        end
      );
	  
    // CACHE
    state.grossRevenueData = res;
    state.grossRevenueFilter =
      JSON.stringify({
        branchId,
        startDate: start,
        endDate: end
      });
		
    renderGrossRevenue(res.summary || {});

    // CLEAR OLD CHART
    document
      .getElementById("grossRevenueDonut")
      ?.replaceChildren();
    document
      .getElementById("revenueTrendContainer")
      ?.replaceChildren();

    renderRevenueTrend(res.trend || []);
    renderDonut(res.category || []);
    renderRecentTransactions(res.recentTransactions || []);
    updateDiscountBar(
      res.summary?.totalDiscount || 0,
      res.summary?.totalRevenue || 0
    );

    // TOP PRODUCTS
    allTopRevenueData = res.topRevenue || [];
    topRevenueCurrentPage = 1;
    renderTopRevenueTable();
  }
  catch (err) {
    showToast(
      "Gagal memuat Gross Revenue",
      "error"
    );
  }
  finally {
    toggleLoading(false);
  }
}

document.addEventListener(
  "click",
  function(e) {
    const btn =
      e.target.closest(
        "#btnExportGrossRevenuePDF"
      );

    if (!btn) return;
    exportGrossRevenuePDF();
  }
);

async function exportGrossRevenuePDF() {
  const start = document.getElementById("startDate")?.value;
  const end = document.getElementById("endDate")?.value;
  const branchId = state.branchId;

  // VALIDASI
  if (!start || !end) {
    alert("Pilih tanggal dulu");
    return;
  }
  if (!branchId) {
    alert("Branch tidak valid");
    return;
  }

  // OPEN WINDOW
  const pdfWindow = window.open("", "_blank");
  if (!pdfWindow) {
    alert("Popup diblokir browser.");
    return;
  }

  // LOADING
  pdfWindow.document.write(`
    <html>
      <head>
        <title>Generating Gross Revenue Report</title>
        <style>
          body {
            margin: 0;
            background: #0B0F14;
            color: white;
            font-family: Arial, sans-serif;

            display: flex;
            align-items: center;
            justify-content: center;

            height: 100vh;
          }

          .loading {
            text-align: center;
          }

          .title {
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 8px;
          }

          .text {
            font-size: 13px;
            opacity: .7;
          }
        </style>
      </head>

      <body>
        <div class="loading">
          <div class="title">
            Gross Revenue Report
          </div>

          <div class="text">
            Generating PDF...
          </div>
        </div>
      </body>
    </html>
  `);

  try {
    const sessionId =
			localStorage.getItem("pos_session_id");
    const response =
      await fetch("/api/export-pdf", {
				method: "POST",
				headers: {
					"Content-Type": "application/json"
				},
				body: JSON.stringify({
					type: "gross-revenue",
					start,
					end,
					branchId,
					sessionId,
					tenantSlug: state.tenantSlug
				})
			});

    // HTTP ERROR
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        errorText ||
        `Export gagal (${response.status})`
      );
    }

    // GET HTML REPORT
    const html = await response.text();
    if (!html) {
      throw new Error(
        "Server mengembalikan HTML kosong"
      );
    }

    // RENDER REPORT
    pdfWindow.document.open();
    pdfWindow.document.write(html);
    pdfWindow.document.close();
  }
  catch (err) {
    // ERROR PAGE
    pdfWindow.document.open();
    pdfWindow.document.write(`
      <html>
        <body style="
          background:#0B0F14;
          color:white;
          font-family:Arial;
          padding:40px;">
          <h2>
            Export Failed
          </h2>

          <p style="color:#aaa;">
            Gagal membuat Gross Revenue Report.
          </p>

          <pre style="
            white-space:pre-wrap;
            background:#151A21;
            padding:15px;
            border-radius:10px;">
							${String(
	            err?.message ||
	            err)}
					</pre>
        </body>
      </html>
    `);
    pdfWindow.document.close();
  }
}

function calcGrowth(today, yesterday) {
  today = Number(today) || 0;
  yesterday = Number(yesterday) || 0;
  if (yesterday === 0) return 0; 
  return ((today - yesterday) / yesterday) * 100;
}    

function renderRevenueTrend(data) {
  const container = document.getElementById("revenueTrendContainer");
  if (!container) return;
  container.innerHTML = "";
  if (!Array.isArray(data) || data.length === 0) {
    container.innerHTML =
      "<p class='text-xs text-muted'>No data</p>";
    return;
  }

  const max =
    Math.max(
      ...data.map(d => d.total || 0),
      1
    );

  let html =
    `<div class="flex items-end gap-3 min-w-max h-full">`;
	
  data.forEach(item => {
    const height = ((item.total || 0) / max) * 180;

    html += `
      <div class="w-10 flex flex-col items-center justify-end gap-1 flex-shrink-0">
        <div
          class="w-6 bg-primary rounded-t-sm"
          style="height:${height}px">
        </div>

        <span class="text-[10px] text-muted whitespace-nowrap">
          ${item.date ? item.date.slice(5, 10) : "-"}
        </span>
      </div>
    `;
  });
  html += `</div>`;
  container.innerHTML = html;
}

 // ================= RENDER SUMMARY =================
function renderGrossRevenue(data) {
  if (!data) return;
  const revenueEl = document.getElementById("gr-total-revenue");
  const discountEl = document.getElementById("gr-total-discount");
  const taxEl = document.getElementById("gr-total-tax");
  const aovEl = document.getElementById("gr-average");
  if (discountEl) discountEl.innerText = format(data.totalDiscount);
  if (taxEl) taxEl.innerText = format(data.totalTax);
  if (revenueEl) revenueEl.innerText = format(data.totalSubtotal);
  if (aovEl) aovEl.innerText = format(data.aov);
  // FIX DISCOUNT BAR (PAKAI ID HTML YANG SUDAH ADA)
  setTimeout(() => {
    const bar = document.getElementById("discountBarFill");
    if (!bar) return;
    const percent = data.totalSubtotal > 0
      ? (data.totalDiscount / data.totalSubtotal) * 100
      : 0;
    bar.style.width = percent + "%";
    bar.style.transition = "width 0.4s ease";
  }, 50);
}


 function renderDonut(data) {
  const svg = document.getElementById("grossRevenueDonut");
  const legend = document.getElementById("donutLegend");
  if (!svg || !legend) return;

  svg.innerHTML = `
    <circle cx="80" cy="80" r="50"
      stroke="#222a3d"
      stroke-width="12"
      fill="transparent"></circle>
  `;
  legend.innerHTML = "";
  const cleanData = (data || [])
  .map(d => ({
    category: (d.category || "").trim(),
    value: Number(d.grossRevenue) || 0
  }))
  .filter(d => d.category && d.value > 0);;
  if (!cleanData.length) return;
  const total = cleanData.reduce((a, b) => a + b.value, 0);
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const colors = ["#f59e0b", "#8fd5ff", "#34d399", "#f472b6", "#a78bfa", "#ff5733", "#33c1ff"];
  let offset = 0;
  cleanData.forEach((item, index) =>  {
    const percent = item.value / total;
    const dash = circumference * percent;
    const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    circle.setAttribute("cx", "80");
    circle.setAttribute("cy", "80");
    circle.setAttribute("r", "50");
    circle.setAttribute("fill", "transparent");
    circle.setAttribute("stroke", colors[index % colors.length]);
    circle.setAttribute("stroke-width", "12");
    // FIX: TIDAK PAKAI ROTATE LAGI
    circle.setAttribute("stroke-dasharray", `${dash} ${circumference}`);
    circle.setAttribute("stroke-dashoffset", -offset);
    svg.appendChild(circle);
    offset += dash;
  });

  legend.innerHTML = cleanData.map((item, index) => {
    const percent = ((item.value / total) * 100).toFixed(0);
    return `
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <span class="w-2 h-2 rounded-md"
            style="background:${colors[index % colors.length]}"></span>
          <span class="text-sm font-medium">${item.category}</span>
        </div>
        <span class="text-sm font-bold">${percent}%</span>
      </div>
    `;
  }).join("");
}

function openDateFilter() {
  const start = document.getElementById("startDate");
  if (!start) return;
  setTimeout(() => {
    if (start.showPicker) {
      start.showPicker();
    } else {
      start.focus();
      start.click();
    }
  }, 10);
}

function initDatePicker() {
  setTimeout(() => {
		const start = document.getElementById("startDate");
		const end = document.getElementById("endDate");

		if (!start || !end) return;
		const trigger = () => {
			if (start.value && end.value) {
				updateDateLabel(start.value, end.value);
				applyDateFilter();
			}
		};

		start.addEventListener("change", trigger);
		end.addEventListener("change", trigger);
	}, 50);
}

function updateDateLabel(start, end) {
  const label = document.getElementById("dateRangeLabel");
  if (!label) return;
  const s = new Date(start).toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric"
  });
  const e = new Date(end).toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric"
  });
  label.childNodes[2].nodeValue = ` ${s} - ${e} `;
}

function updateDiscountBar(discount, revenue) {
	const bar = document.getElementById("discountBarFill");
	if (!bar) return;
	const percent = revenue > 0 ? (discount / revenue) * 100 : 0;
	bar.style.width = percent + "%";
}

function renderTopRevenueTable() {
const tbody = document.getElementById("topRevenueTable");
if (!tbody) return;
tbody.innerHTML = "";

// PAGINATION
const totalData = allTopRevenueData.length;
const totalPages =
  Math.max(
    1,
    Math.ceil(totalData / topRevenueItemsPerPage)
  );
const start = (topRevenueCurrentPage - 1) * topRevenueItemsPerPage;
const end = start + topRevenueItemsPerPage;
const data = allTopRevenueData.slice(start, end);

// RENDER
data.forEach(item => {
  const img = (item.image || "")
    .replace(
      /https:\/\/drive\.google\.com\/file\/d\/([^/]+)\/view.*/,
      "https://drive.google.com/thumbnail?id=$1&sz=w2000"
    );

  tbody.innerHTML += `
    <tr class="hover:bg-outline-variant transition-colors">
      <td class="px-8 py-5">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-md bg-surface-container overflow-hidden">
            <img src="${img}" class="w-full h-full object-cover"/>
          </div>
          <div>
            <p class="text-sm font-bold">${item.name || "-"}</p>
            <p class="text-[10px] text-on-surface-variant">
              ${item.category || "-"}
            </p>
          </div>
        </div>
      </td>

      <td class="px-8 py-5">
        <span class="px-2.5 py-1 rounded-md bottom-theme text-on-surface text-[10px] font-bold uppercase">
          ${item.category || "-"}
        </span>
      </td>

      <td class="px-8 py-5 text-center font-medium">
        ${(item.units || 0).toLocaleString("id-ID")}
      </td>

      <td class="px-8 py-5 text-right font-headline font-bold">
        Rp ${(item.revenue || 0).toLocaleString("id-ID")}
      </td>

      <td class="px-8 py-5 text-right">
        <span class="material-symbols-outlined text-sm text-on-surface">
          trending_up
        </span>
      </td>

    </tr>
  `;
});

  // FOOTER
  const info = document.getElementById("topRevenueInfo");
  if (info) {
    const from = totalData === 0 ? 0 : start + 1;
    const to = Math.min(end, totalData);
    info.innerText = `Showing ${from}-${to} of ${totalData} Products`;
  }

  // BUTTON
  const prevBtn = document.getElementById("topRevenuePrevBtn");
  const nextBtn = document.getElementById("topRevenueNextBtn");
  if (prevBtn) {
    prevBtn.disabled = topRevenueCurrentPage <= 1;
    prevBtn.onclick = () => {
      if (topRevenueCurrentPage > 1) {
        topRevenueCurrentPage--;
        renderTopRevenueTable();
      }
    };
  }

  if (nextBtn) {
    nextBtn.disabled =
      topRevenueCurrentPage >= totalPages;
    nextBtn.onclick = () => {
      if (topRevenueCurrentPage < totalPages) {
        topRevenueCurrentPage++;
        renderTopRevenueTable();
      }
    };
  }
}

    // =========================
    // POS PAGE
    // =========================

function goPOS(){
  navigate('posPage');
}
    
function validateStock() {
  for (const item of state.cart) {
    const product = state.products.find(p => String(p.ID_Produk) === String(item.id));
    if (!product) {
      showToast("Produk tidak ditemukan","error");
      return false;
    }
    const stock =  Number(product.Stok ?? product.stock ?? 0);
    if (item.qty > stock) {
      showToast(
        `Stok ${product.Nama_Produk} tidak cukup`,
        "error"
      );
      return false;
    }
  }
  return true;
}

function deductStock() {
  state.cart.forEach(item => {
    const product = state.products.find(p => p.ID_Produk === item.id);
    if (product) {
      product.Stok = (Number(product.Stok || 0)) - item.qty;
    }
  });
}

function selectTable(id) {
  state.currentTable = id;
  selectedTableId = id; 
  document.getElementById("billing-table-info").innerText = "Table " + id;

  loadBilling(id); 
  toggleBillingSidebar();
}

async function preloadRecipeMap() {
  const branchId = state.branchId;
  if (!branchId) {
    return;
  }
  // CACHE
  if (
    state.recipeMap &&
    state.recipeMapBranchId === branchId
  ) {
    return;
  }
  
  try {
    // SUPABASE RPC
    const recipe =
      await getRecipeMasterLedgerRPC(
        branchId
      );
        
    // NORMALIZE
    const norm = v =>
      String(v || "")
        .trim()
        .toUpperCase();
    
    // BUILD RECIPE MAP
    state.recipeMap = {};
    (recipe || []).forEach(r => {
      state.recipeMap[
        norm(r.productId)
      ] = r;
      state.recipeMap[
        norm(r.name)
      ] = r;
    });
    state.recipeMapBranchId =
      branchId;
  } catch (err) {
  }
}

async function checkout() { 
  const btn = document.getElementById("btnCheckout");
  if (btn?.disabled) return;
  if (!state.branchId) {
    alert("Branch tidak valid");
    return;
  }
  if (isProcessing) return; 
  const table = state.currentTable || document.getElementById("table-input")?.value;
  if (!table) return alert("Pilih meja dulu");
  state.currentTable = table; 
  if (!state.user) return alert("User belum login");
  if (state.cart.length === 0) return alert("Keranjang kosong");
  if (!state.paymentMethod) return alert("Pilih pembayaran");

	// CEK STATUS TABLE
	try {
	  const tableData =
	    await getTableStatus(table);
	
	  if (tableData?.status === "occupied") {
	    alert(
	      `Table ${table} sedang digunakan. Silakan clear table terlebih dahulu.`
	    );
	    return;
	  }
	
	  if (tableData?.status === "reserved") {
	    alert(
	      `Table ${table} sedang direservasi.`
	    );
	    return;
	  }
	} catch (error) {
	  alert(
	    "Gagal memeriksa status table."
	  );
	  return;
	}
  isProcessing = true; //  kunci mulai
  if (btn) btn.disabled = true;
  const memberId = state.currentMember ? String(state.currentMember).trim() : null;
  const calc = calculateTotal();
  const totalPointUsed = state.cart
		.filter(i => i.isRedeem)
		.reduce((sum, i) => sum + (i.pointUsed || 0), 0);

  const payload = {
		requestId: crypto.randomUUID(),
		userId: state.user.username,
		branchId: state.branchId, 
		mejaId: state.currentTable,
		memberId: memberId,
		pointUsed: totalPointUsed,

  items: state.cart.map(i => ({
    id: i.id,
    name: i.name,
    qty: i.qty,
    price: i.price,
    category: i.category || "",
	note: i.note || "",
    subtotal: i.qty * i.price,
    isRedeem: i.isRedeem || false,
    pointUsed: i.pointUsed || 0 ,
    rewardId: i.isRedeem ? i.rewardId : null 
  })),

		subtotal: calc.subtotal,
		discount: calc.discount,
		tax: calc.tax,
		service: calc.service,
		total: calc.total,
		paymentMethod: state.paymentMethod
  };

  async function hitungHPPDanKirim(payload) {
  	await sendTransaction(payload);
	}
    if (memberId) {

	  try {
	    const member =
	      await checkMemberRPC(memberId);
				state.currentMemberData = member;
	    if (!member) {
	      alert(
	        "Member tidak ditemukan ❌"
	      );
	      isProcessing = false;
	      if (btn) {
	        btn.disabled = false;
	      }
	      return;
	    }
			payload.memberId = member.id;
			payload.memberData = member;
	    await hitungHPPDanKirim(payload);
	  } catch (error) {
	    alert(
	      "Gagal memeriksa member ❌"
	    );
	
	    isProcessing = false;
	    if (btn) {
	      btn.disabled = false;
	    }
	    return;
	  }
	} else {
	  await hitungHPPDanKirim(payload);
	}
}	

async function sendTransaction(payload){
  if (!payload) {
    alert("Payload NULL");
    return;
  }

  try {
    isProcessing = true;
    const btn = document.getElementById("btnCheckout");
    	if(btn){btn.disabled = true;}
		const res = await checkoutTransaction(payload);
	    isProcessing = false;
	    if(btn){
	      btn.disabled = false;
	    }
	    if(!res){
	      alert(
	        "Backend mengembalikan NULL"
	      );
	      return;
	    }

	    if(res.success){
	      showToast(
	        "Transaksi berhasil ✔",
	        "success"
	      );

	      if(payload.memberId){
	        state.memberPageData = null;
	        state.members = null;
	      }
      state.recentTransactionsData = null;
      state.recentTransactionsFilter = null;
      state.recentSummaryData = null;
      state.recentSummaryFilter = null;
      state.analyticsData = null;
      state.analyticsFilter = null;
      state.cashFlowData = null;
      state.cashFlowFilter = null;
      state.dashboardData = null;
      state.tableData = null;
      state.inventoryData = null;
      state.inventoryFilter = null;
      // state.products = null;
      state.cart = [];
			state.products = null;
			state.productsBranchId = null;
			state.productsRole = null;
			await loadProducts();
      state.currentMember = null;
      state.selectedMember = null;
      state.currentMemberPoint = 0;
      state.paymentMethod = null;
      state.discountActive = false;

      const memberInput = document.getElementById("member-input");
      const tableInput = document.getElementById("table-input");
      if(memberInput){
        memberInput.value = "";
      }
      if(tableInput){
        tableInput.value = "";
      }
      renderCart();
      updateSummary(0);
    }
    else{
      showToast(
        "Gagal: " + res.message,
        "error"
      );
    }
  }
  catch(err){
    isProcessing = false;
    const btn = document.getElementById("btnCheckout");
    if(btn){
      btn.disabled = false;
    }
    alert(
      err.message ||
      "Error server!"
    );
  }
}

function setTable(value) {
  state.currentTable = value.trim();
}

function selectPayment(method) {
  state.paymentMethod = method;
  // Reset semua tombol dulu
  ["Cash", "QRIS", "Bank"].forEach(m => {
    const btn = document.getElementById("pay-" + m);
    if (!btn) return;

    btn.classList.remove(
      "bg-outline-variant",
      "text-foreground"
    );
    btn.classList.add(
      "bg-background",
      "text-foreground"
    );
  });
  // Aktifkan tombol yang dipilih
  const activeBtn = document.getElementById("pay-" + method);
  if (activeBtn) {
    activeBtn.classList.remove(
      "bg-background",
    );
    activeBtn.classList.add(
      "bg-outline-variant",
      "text-foreground"
    );
  }
  // Tampilkan info
  updatePaymentUI(method);
}
	
function updatePaymentUI(method) {
    const el = document.getElementById("payment-info");
    if (!el) return;
    if(method === "QRIS") {
        el.innerHTML = `<img src="${qrisImage}" style="max-width:150px;">`;
    } else if(method === "Bank") {
        el.innerHTML = `<p>Nomor Rekening: 123456789</p>`;
    } else {
        el.innerHTML = `<p>Bayar Tunai di kasir</p>`;
    }
}

function renderProducts(products) {
  const el = document.getElementById("product-list");
  if (!el) return;
  el.innerHTML = products.map(p => {
    const id = p.ID_Produk || p.id || "-";
    const name = p.Nama_Produk || p.nama || "Unknown Product";
    const price = Number(p.Harga || p.harga || 0);
    const stock = p.Stok ?? p.stock ?? 0;
    const category = p.Kategori || p.category || "-";

    return `
    <div 
      class="bg-background rounded-md overflow-hidden shadow-[0_2px_10px_rgba(0,0,0,0.15)] cursor-pointer hover:scale-[1.02] transition"
      onclick="addToCartById('${id}')"
    >

      <div class="h-24 overflow-hidden">
        <img 
          src="${p.Gambar || 'https://via.placeholder.com/150'}"
          class="w-full h-full object-cover block"
        />
      </div>

      <div class="p-3">
        <h4 class="font-bold text-foreground text-sm lg:text-lg">${name}</h4>

        <div class="flex justify-between items-center mt-1">
          <span class="text-sm lg:text-lg text-muted">
            ${format(price)}
          </span>

          <span class="text-xs lg:text-sm px-2 py-1 border border-outline-variant rounded-md bg-background text-foreground">
            ${category}
          </span>
        </div>

        <p class="text-xs lg:text-sm text-muted mt-1">
          Stock: ${stock}
        </p>
      </div>

    </div>
  `;
  }).join("");
}

async function loadOrders() {
  const el = document.getElementById("order-list");
  if (!el) return;

  try {

    const data =
      await getOrdersRPC();
    el.innerHTML =
      data.map(o => `
        <div>
          <p>${o.id}</p>
          <p>${o.total}</p>
          <p>${o.date}</p>
        </div>
      `).join("");
  } catch (err) {
    el.innerHTML = `
      <p>
        Gagal memuat order
      </p>
    `;
  }
}

function addToCartFromFilter(id) {
  const product = state.recipes.find(r =>
    String(r.id || r.ID || r.productId).toLowerCase() === String(id).toLowerCase()
  );
  if (!product) return;
  const existing = state.cart.find(i => i.id === id);
  if (existing) {
    existing.qty++;
  } else {
		state.cart.push({
			id: product.ID_Produk,
			name: product.Nama_Produk,
			price: Number(product.Harga || 0),
			qty: 1,
			note: "",
			isRedeem: false,
			productId: product.ID_Produk,
			rewardId: null
		});
  }
  renderCart(); 
}

function addToCartById(id, isRedeem = false, rewardId = null) {
	const products = state.products || [];
  const product = state.products.find(p => p.ID_Produk === id);
  if (!product) return;
  addToCart(product, isRedeem, rewardId);
}

function addToCart(product, isRedeem = false, rewardId = null) {
  // VALIDASI MEMBER kalau redeem
  if (isRedeem) {
    if (!state.currentMember) {
      alert("Pilih member dulu!");
      return;
    }
    if (!state.currentMemberPoint) {
      alert("Point member belum dimuat");
      return;
    }
    if (!rewardId) {
      alert("Reward tidak valid!");
      return;
    }
  }
  const existing = state.cart.find(
    i => i.id === product.ID_Produk && i.isRedeem === isRedeem
  );
  if (existing) {
    existing.qty++;
    if (isRedeem) {
      existing.rewardId = rewardId;
    }
  } else {
    state.cart.push({
      id: product.ID_Produk,
      name: product.Nama_Produk,
      price: isRedeem ? 0 : Number(product.Harga || 0),
      qty: 1,
      note: "",
      isRedeem: isRedeem,
      productId: product.ID_Produk,
      rewardId: isRedeem ? rewardId : null
    });
  }
  renderCart();
}

async function loadProducts(callback) {
	const role = state.user?.role?.toLowerCase() || "";
	const branchId = state.branchId;
	if (!branchId) {
	  return;
	}
	await loadPOSCategories();
	if (
	  state.products &&
	  state.productsBranchId === branchId &&
	  state.productsRole === role
	) {
	  renderProducts(
	    state.products
	  );
	  if(callback){
	    callback();
	  }
	  return;
	}
	
	try {
	  const products =
	    await getProductsRPC(
	      branchId,
	      role
	    );

	  state.products = products || [];
	  state.productsBranchId = branchId;
	  state.productsRole = role;
	  loadNotifications();
	  renderProducts(state.products);
	  if(callback){
	    callback();
	  }
	}
	catch(err){
	  showToast(
	    "Gagal memuat produk",
	    "error"
	  );
	}
}
    
function initSearch() {
  const input = document.getElementById("searchInput");
  if (!input) {
    return;
  }
  input.addEventListener("input", function(e) {
    const keyword = e.target.value.toLowerCase();
    if (!state.products) return;
    if (!keyword) {
      renderProducts(state.products);
      return;
    }
    const hasil = state.products.filter(p =>
      (p.Nama_Produk || "").toLowerCase().includes(keyword) ||
      (p.Kategori || "").toLowerCase().includes(keyword)
    );
    renderProducts(hasil);
  });
}

function filterProducts(category) {
  if (!state.products || state.products.length === 0) return;
  let filtered = state.products;
  if (category && category !== "All") {
    filtered = state.products.filter(p =>
      p.Kategori.toLowerCase() === category.toLowerCase()
    );
  }
  renderProducts(filtered); 
}

async function loadPOSCategories() {
  try {
    const categoryContainer =
      document.getElementById(
        "pos-category-list"
      );
    if (!categoryContainer) return;
    categoryContainer.innerHTML = "";
  
    // ALL
    const allButton = document.createElement("button");
    allButton.type = "button";
    allButton.className = "category-btn active-category flex items-center justify-center px-2 sm:px-3 md:px-4 lg:px-6 py-2 sm:py-2.5 md:py-3 rounded-md font-semibold headline-font text-xs lg:text-sm whitespace-nowrap transition-all";
    allButton.textContent = "ALL";
    allButton.onclick = () => {
      setActiveCategory(allButton);
      filterProducts("All");
    };
    categoryContainer.appendChild(allButton);

    // DATABASE CATEGORIES
    const categories =
      await getCategoriesRPC(
        state.branchId
      );
	  state.categories = categories || [];
    categories.forEach(category => {
      const button =
        document.createElement(
          "button"
        );
      button.type = "button";
      button.className = "category-btn flex items-center justify-center px-2 sm:px-3 md:px-4 lg:px-6 py-2 sm:py-2.5 md:py-3 rounded-md font-semibold headline-font text-xs lg:text-sm whitespace-nowrap transition-all";
      button.textContent =
        (
          category.category_name ||
          category.category_key ||
          ""
        ).toUpperCase();
      button.onclick = () => {
        setActiveCategory(button);
        filterProducts(
          category.category_name
        );
      };
      categoryContainer.appendChild(button);
    });
  } catch (error) {
		showToast(
			"Gagal memuat Categories",
			"error"
		);
  }
}


function renderCart() {
  const container = document.getElementById("cart-items");
  if (!container) return;
  container.innerHTML = "";
  let subtotal = 0;
  if (state.cart.length === 0) {
    container.innerHTML = "<p class='text-muted  text-sm'>Cart kosong</p>";
    updateSummary(0);
    return;
  }
  state.cart.forEach((item, index) => {
    subtotal += item.price * item.qty;
    const label = item.isRedeem ? "(REDEEM)" : "";
    container.innerHTML += `
			<div class=" p-4 rounded-md">
					<h4 class="font-bold">${item.name} ${label}</h4>
					<p class="text-sm lg:text-lg text-muted">${format(item.price)}</p>

					<input placeholder="Catatan..."
						value="${item.note || ''}"
						oninput="updateNote(${index}, this.value)"
						class="w-full mt-2 p-1 rounded-md bg-background text-muted text-xs lg:text-sm">

					<div class="flex items-center gap-2 mt-2">
						<button onclick="decreaseQty(${index})">-</button>
						<span class="min-w-[20px] text-center">${item.qty}</span>
						<button onclick="increaseQty(${index})">+</button>
						<button onclick="removeItemById('${item.id}')" class="text-red-500 ml-2"> 🗑️
						</button>
					</div>
				</div>	
		`;
  });
  updateSummary(subtotal);
}

function selectProduct(index) {
  const product = state.products[index];
  if (!product) return;
  addToCartFromFilter(product.ID_Produk);
}

function selectProductById(id) {
  addToCartFromFilter(id);
}
  
async function removeItemById(id) {
  const index =
    state.cart.findIndex(
      i => i.id === id
    );

  if (index === -1) {
    return;
  }
  // Hapus dari cart lokal
  state.cart.splice(
    index,
    1
  );

  renderCart();
  // Hapus dari transaksi di Supabase
  if (state.user) {

    try {
      const res =
        await removeItemFromCartRPC(
          state.user.id,
          id
        );

      if (res?.success) {
        showToast(
          "Item dihapus dari transaksi",
          "success"
        );
      }

    } catch (error) {
      showToast(
        "Gagal menghapus item dari transaksi",
        "error"
      );
    }
  }
}

function updateSummary(subtotal, member = null) {
  const el = document.getElementById("pos-cart-summary");
  if (!el) return;

  // Gunakan satu sumber perhitungan
  const calc = calculateTotal();
  const taxRate = Number(state.settings?.tax || 0);
  const serviceRate = Number(state.settings?.service || 0);
  el.innerHTML = `
    <div class="flex justify-between m-3 text-sm">
      <span>Subtotal</span>
      <span>${format(calc.subtotal)}</span>
    </div>

    <div class="flex justify-between m-3 text-sm">
      <span>Tax (${taxRate}%)</span>
      <span>${format(calc.tax)}</span>
    </div>

    <div class="flex justify-between m-3 text-sm">
      <span>Service (${serviceRate}%)</span>
      <span>${format(calc.service)}</span>
    </div>

	 <div class="flex justify-between m-3 text-sm text-tertiary">
	  <span>
	    Discount${calc.discountRate > 0 ? ` (${calc.discountRate}%)` : ""}
	  </span>
	  <span>- ${format(calc.discount)}</span>
	</div>

    <div class="h-[1px] my-2"></div>

    <div class="flex justify-between m-3 font-bold text-lg">
      <span>Total</span>
      <span>${format(calc.total)}</span>
    </div>
  `;
}

// ==========================================
// CATEGORY DISCOUNT
// ==========================================

function getCategoryDiscount(categoryName) {
  if (!categoryName) return 0;
  const category =
    (state.categories || []).find(c =>
      String(c.branch_id) ===
      String(state.branchId) &&
      String(c.category_name || "")
        .trim()
        .toLowerCase() ===
      String(categoryName || "")
        .trim()
        .toLowerCase()
    );
  return Number(
    category?.discount || 0
  );
}


function getCartCategoryDiscount() {
  let maxDiscount = 0;
  state.cart.forEach(item => {

    // Redeem tidak mendapatkan discount
    if (item.isRedeem) return;
    const product =
      state.products.find(
        p =>
          String(p.ID_Produk) ===
          String(item.id)
      );
	
    if (!product) return;
    const categoryName =
      product.Kategori ||
      product.Category ||
      item.category ||
      "";
    const discount =
      getCategoryDiscount(
        categoryName
      );
    maxDiscount =
      Math.max(
        maxDiscount,
        discount
      );
  });
  return maxDiscount;
}

function calculateTotal() {
  const subtotal =
    state.cart.reduce(
      (sum, item) =>
        sum + (item.price * item.qty),
      0
    );

  const isMember =
    state.currentMember &&
    state.currentMember !== "";
						
  // GLOBAL DISCOUNT
  const globalDiscountRate =
    Number(
      state.settings?.discount || 0
    );

  const globalDiscountAmount =
    subtotal *
    globalDiscountRate /
    100;

  // CATEGORY DISCOUNT PER ITEM
  let categoryDiscountAmount = 0;
  state.cart.forEach(item => {
    // Produk redeem tidak mendapatkan discount
    if (item.isRedeem) return;
    const product =
      state.products.find(
        p =>
          String(p.ID_Produk) ===
          String(item.id)
      );

    if (!product) return;
    const categoryName =
      product.Kategori ||
      product.Category ||
      item.category ||
      "";

    const categoryDiscount = getCategoryDiscount(categoryName);

    const itemSubtotal =
      Number(item.price || 0) *
      Number(item.qty || 0);

    categoryDiscountAmount +=
      itemSubtotal *
      categoryDiscount /
      100;
  });

  // MEMBER DISCOUNT
  const memberDiscountRate =
    isMember
      ? Number(
          state.loyaltySettings?.member_discount || 0
        )
      : 0;

  const memberDiscountAmount =
    subtotal *
    memberDiscountRate /
    100;

	// BIRTHDAY DISCOUNT
	const birthdayDiscountRate =
		isMember
			? Number(
					state.loyaltySettings?.birthday_discount || 0
				)
			: 0;
	
	let birthdayDiscountAmount = 0;
	
	if (
		isMember &&
		state.currentMemberData?.tgl_lahir
	) {
		const today = new Date();
		const birth = new Date(state.currentMemberData.tgl_lahir);
		if (
			today.getMonth() === birth.getMonth() &&
			today.getDate() === birth.getDate()
		) {
			birthdayDiscountAmount =
				subtotal *
				birthdayDiscountRate /
				100;
		}
	}

  // PILIH DISCOUNT TERBESAR
  const discount =
    Math.max(
      globalDiscountAmount,
      memberDiscountAmount,
			birthdayDiscountAmount,
      categoryDiscountAmount
    );
	
  // RATE UNTUK SUMMARY
  let displayDiscountRate = 0;
  if (
    discount === globalDiscountAmount &&
    globalDiscountAmount > 0
  ) {
    displayDiscountRate =
      globalDiscountRate;
  }
  if (
	  discount === memberDiscountAmount &&
	  memberDiscountAmount > 0
	) {
	  displayDiscountRate =
	    memberDiscountRate;
	}
	if (
	  discount === birthdayDiscountAmount &&
	  birthdayDiscountAmount > 0
	) {
	  displayDiscountRate =
	    birthdayDiscountRate;
	}

  // CALCULATE
  const base = subtotal - discount;
  const tax =
    base *
    Number(
      state.settings?.tax || 0
    ) /
    100;
  const service =
    base *
    Number(
      state.settings?.service || 0
    ) /
    100;
  const total =
    base +
    tax +
    service;
  return {
    subtotal,
    discount,
    discountRate: displayDiscountRate,
    tax,
    service,
    total
  };
}

function clearCart() {
  state.cart = [];
  state.currentMember = null;
  state.currentTable = null;
  state.currentMemberPoint = 0;
  state.paymentMethod = null;
  const memberInput = document.getElementById("member-input");
  const tableInput = document.getElementById("table-input");
  if (memberInput) memberInput.value = "";
  if (tableInput) tableInput.value = "";
  renderCart();
}

function format(num) {
  return "IDR " + Number(num || 0).toLocaleString("id-ID");
}

function increaseQty(index) {
  state.cart[index].qty++;
  state.cart[index].subtotal = state.cart[index].qty * state.cart[index].price;
  renderCart();
}

function decreaseQty(index) {
  if (state.cart[index].qty > 1) {
    state.cart[index].qty--;
  } else {
    state.cart.splice(index, 1);
  }
  renderCart();
}

function updateNote(index, value) {
  state.cart[index].note = value;
}

async function openRedeem() {
  if (!state.currentMember) {
    alert("Pilih member dulu!");
    return;
  }
  if (!state.branchId) {
    alert("Branch belum dipilih!");
    return;
  }
  showToast(
    "Loading reward...",
    "info"
  );
  try {

    const res =
      await getRewardsRPC(
        state.currentMember,
        state.branchId
      );
    showRedeemPopup(res);
  }
  catch(err){
    alert(
      "Gagal ambil reward"
    );
  }
}

function resetPOSMember() {
  state.selectedMember = null;
  state.currentMember = null;
  const memberInput =
    document.getElementById("memberSearch");
  if (memberInput) {
    memberInput.value = "";
  }
  const memberId =
    document.getElementById("member-id");

  if (memberId) {
    memberId.value = "";
  }
  const result =
    document.getElementById("memberResult");
  if (result) {
    result.style.display = "none";
  }
}

async function selectMember(member) {
  document.getElementById("memberSearch").value = member.nama;
  document.getElementById("member-id").value = member.id;
  state.selectedMember = member;
  state.currentMember = member.id;
  state.currentMemberData =
  await checkMemberRPC(member.id);
  document.getElementById("memberResult").style.display = "none";
  const subtotal =
    state.cart.reduce(
      (sum, item) =>
        sum + (item.price * item.qty),
      0
    );
  updateSummary(subtotal);
}

function showRedeemPopup(data) {
  //  1. Ambil template
  const template = document.getElementById("redeempointModal");
  if (!template) {
    return;
  }
  //  2. Clone template
  const clone = template.content.cloneNode(true);
  //  3. Wrapper biar bisa dihapus nanti
  const wrapper = document.createElement("div");
  wrapper.id = "redeemModalWrapper";
  wrapper.appendChild(clone);
  document.body.appendChild(wrapper);
  //  4. SEKARANG element SUDAH ADA
  wrapper.querySelector("#redeemMemberName").innerText = data.member.nama;
  wrapper.querySelector("#redeemMemberId").innerText = data.member.id;
  wrapper.querySelector("#redeemPoint").innerText = data.member.point;
  //  SIMPAN STATE
  state.rewards = data.rewards;
  state.currentMemberPoint = data.member.point;
  //  RENDER REWARD
  const container = wrapper.querySelector("#rewardContainer");
  container.innerHTML = "";
  data.rewards.forEach(r => {
    const canRedeem = data.member.point >= r.point;
    const div = document.createElement("div");
    div.innerHTML = `
      <div class="bg-background
          rounded-md
          border border-outline-variant
          p-4 shadow-[0_2px_10px_rgba(0,0,0,0.15)]
          transition-all
          duration-200
          hover:bg-background-high
          ${!canRedeem ? 'opacity-50' : ''}">

          <div class="flex items-start justify-between">
              <div class="flex gap-3">
                  <div class=" w-11 h-11
                      rounded-md
                      bg-background-high
                      flex items-center justify-center
                      text-on-surface">
                      <span class="material-symbols-outlined">
                          card_giftcard
                      </span>
                  </div>

                  <div>
                      <h5 class="font-semibold text-on-surface">
                          ${r.nama}
                      </h5>

                      <p class="text-xs text-on-surface-variant mt-1">
                          ${Number(r.point).toLocaleString()} Points
                      </p>
                  </div>
              </div>
          </div>

          <button ${!canRedeem ? 'disabled' : ''}
            onclick="selectReward('${String(r.ID_Reward)}')"
            class=" mt-4 w-full h-10 rounded-md transition active:scale-95
							${
									canRedeem
									? `
									bottom-theme
									text-on-surface
									`
									: `
									bg-background-high
									text-on-surface-variant
									cursor-not-allowed
									`
							}">
              ${canRedeem ? 'Redeem' : 'Insufficient Points'}
          </button>
      </div>
      `;
    container.appendChild(div);
  });
}

function selectReward(rewardId) {
  const reward = state.rewards.find(r => r.ID_Reward == rewardId);
  if (!reward) {
    alert("Reward tidak ditemukan");
    return;
  }

  const product = state.products.find(p => p.ID_Produk == reward.Produk_ID);
  if (!product) {
    alert("Produk tidak ditemukan");
    return;
  }

  // HITUNG POINT YANG SUDAH DIPAKAI
  const totalPointUsed = state.cart
    .filter(i => i.isRedeem)
    .reduce((sum, i) => {
      const prod = state.products.find(p => p.ID_Produk == i.id);
      return sum + ((Number(prod?.Redeem_Point) || 0) * i.qty);
    }, 0);

  // CEK POINT
  if ((state.currentMemberPoint - totalPointUsed) < (Number(product.Redeem_Point) || 0)) {
    alert("Point tidak cukup");
    return;
  }

  // CEK MAX REDEEM
  const usedQty = state.cart
    .filter(i => i.isRedeem && i.id === product.ID_Produk)
    .reduce((sum, i) => sum + i.qty, 0);
  if (reward.Max_Redeem && usedQty >= reward.Max_Redeem) {
    alert("Maksimal redeem tercapai");
    return;
  }

  // MASUK CART (INI YANG HARUS KONSISTEN)
  addToCart(product, true, reward.ID_Reward);
  renderCart();
  closeRedeem();
}

function closeRedeem() {
  const modal = document.getElementById("redeemModalWrapper");
    if (modal) modal.remove();
}

    
    
    // =========================
    // MEMBERS PAGE
    // =========================

function calculatePoints(total){
  return Math.floor(total / state.settings.point_ratio)
}

async function getMemberDetailPage(memberId, branchId) {
  try {
    const data =
      await getMemberDetailPageRPC(
        memberId,
        branchId
      );
    return data;
  } catch (error) {
    throw error;
  }
}

async function uploadMemberImage(
  base64,
  memberId
) {

  if (!base64) {
    return null;
  }

  if (!memberId) {
    throw new Error(
      "Member ID kosong"
    );
  }

  const response =
    await fetch(
      "/api/handle-member-image-upload",
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json"
        },

        body: JSON.stringify({
          base64,
          memberId,
					tenantSlug: state.tenantSlug
        })
      }
    );

  const result =
    await response.json();
  if (
    !response.ok ||
    !result.success
  ) {
    throw new Error(
      result.error ||
      "Gagal upload member image"
    );
  }

  return result.url;
}

async function loadMembers(callback) {

  const el =
    document.getElementById(
      "member-table-body"
    );

  if (!el) return;

  // LOAD FROM CACHE
  if (state.memberPageData) {
    const data =
      state.memberPageData;
    state.members =
      data.members || [];
    state.settings =
      data.settings || {};
    renderTierFilter(
      state.settings
    );
    renderTierSettings(
      state.settings
    );
    renderMembers(
      state.members
    );

    if (callback) {
      callback();
    }
    return;
  }

  // LOAD FROM SUPABASE RPC
  try {
	  
    const res =
      await getMemberPageDataRPC(
        state.branchId,
      );

    state.memberPageData =
      res;
    state.members =
      res.members || [];
    state.settings =
      res.settings || {};
    renderTierFilter(
      state.settings
    );
    renderTierSettings(
      state.settings
    );
    renderMembers(
      state.members
    );

    if (callback) {
      callback();
    }
  } catch (err) {
    showToast(
      "Gagal memuat member",
      "error"
    );
  }
}
	
function updateTierOptions(s) {
  const update = (id, value) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = value;
    el.value = value;
  };
  update("filter_tier_1", s.tier_1_name_value);
  update("filter_tier_2", s.tier_2_name_value);
  update("filter_tier_3", s.tier_3_name_value);
  update("filter_tier_4", s.tier_4_name_value);
  update("filter_tier_5", s.tier_5_name_value);
}

function renderTierFilter(settings) {
  const select = document.getElementById("tierFilter");
  if (!select || !settings) return;
  select.innerHTML = `
    <option value="all">All Tier</option>
    <option value="${settings.tier_1_name_value}">${settings.tier_1_name_value}</option>
    <option value="${settings.tier_2_name_value}">${settings.tier_2_name_value}</option>
    <option value="${settings.tier_3_name_value}">${settings.tier_3_name_value}</option>
    <option value="${settings.tier_4_name_value}">${settings.tier_4_name_value}</option>
    <option value="${settings.tier_5_name_value}">${settings.tier_5_name_value}</option>
  `;
}


function renderMembers(data = state.members) {
  const tbody = document.getElementById("member-table-body");
  if (!tbody) return;
	
  // INIT PAGINATION
  if (!state.memberCurrentPage)
    state.memberCurrentPage = 1;
  if (!state.memberPerPage)
    state.memberPerPage = 10;
  const currentPage = state.memberCurrentPage;
  const perPage = state.memberPerPage;

  // EMPTY
  if (!data || data.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7"
            class="text-center text-muted py-6">
          No members
        </td>
      </tr>
    `;
    return;
  }

  // PAGINATION
  const totalData = data.length;
  const totalPages = Math.ceil(totalData / perPage);
  const start = (currentPage - 1) * perPage;
  const end = start + perPage;
  const paginatedData = data.slice(start, end);

  // RENDER
  tbody.innerHTML = paginatedData.map(m => `

    <tr class="hover:bg-outline-variant">
      <td class="px-8 py-5 text-sm font-mono text-on-surface">
        ${m.ID_Member}
      </td>
      <td class="px-8 py-5">
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-md
                      bg-background
                      flex items-center justify-center
                      font-bold text-xs">

            ${(m.Nama || "")
              .substring(0,2)
              .toUpperCase()}
          </div>
          <span class="text-sm font-semibold">
            ${m.Nama}
          </span>
        </div>
      </td>

      <td class="px-8 py-5 text-sm">
        ${m.Level_Current || "Kenal"}
      </td>
      <td class="px-8 py-5 text-sm text-right">
        Rp ${(
          Number(
            String(m.Total_Spend || 0)
            .replace(/\./g,"")
          )
        ).toLocaleString("id-ID")}

      </td>
      <td class="px-8 py-5 text-sm font-bold text-right">
        ${m.Point || 0}
      </td>

      <td class="px-8 py-5 text-center">
      <button 
        onclick="handleMemberCard(this)"
        data-phone="${m.WA || ''}"
        data-name="${m.Nama || ''}"
        data-memberid="${m.ID_Member || ''}"
        data-level="${m.Level_Current || ''}"
        data-point="${m.Point || 0}"
        class="text-tertiary"
      >
        <span class="material-symbols-outlined">chat</span>
      </button>
      </td>
      <td class="px-8 py-5 text-right">
        <button
          class="text-muted hover:text-on-surface transition-colors"
          onclick="openMemberProfile('${String(m.ID_Member).trim()}')"
        >
          <span class="material-symbols-outlined">
            more_vert
          </span>
        </button>
      </td>
    </tr>
  `).join("");

  // FOOTER TEXT
  const footerText = document.querySelector("#memberPage .text-xs.text-on-surface-variant.font-medium");
  if (footerText) {
    footerText.innerText = `Showing ${paginatedData.length} of ${totalData} members`;
  }

  // PAGINATION BUTTON
  const prevBtn = document.getElementById("memberPrevBtn");
  const nextBtn = document.getElementById("memberNextBtn");
  // PREV
  if (prevBtn) {
    prevBtn.disabled =
      currentPage <= 1;
    prevBtn.onclick = () => {
      if (state.memberCurrentPage > 1) {
        state.memberCurrentPage--;
        renderMembers(data);
      }
    };
  }

  // NEXT
  if (nextBtn) {
    nextBtn.disabled =
      currentPage >= totalPages;
    nextBtn.onclick = () => {
      if (state.memberCurrentPage < totalPages) {
        state.memberCurrentPage++;
        renderMembers(data);
      }
    };
  }
}


function loadWhatsAppModal(){
  const template = document.getElementById("whatsAppMessageModalTemplate");
  if (!template) return;
  document.body.appendChild(
    template.content.cloneNode(true)
  );

}

function loadIngredientStockAlertTemplate(){
  const template = document.getElementById("ingredientStockAlertTemplate");
  if(!template) return;
  if(document.getElementById("ingredientStockAlertModal")) return;
  const clone = template.content.cloneNode(true);
  document.body.appendChild(clone);

}

function ensureIngredientStockAlertModal() {

  let modal =
    document.getElementById(
      "ingredientStockAlertModal"
    );

  if (modal) {
    return modal;
  }

  const template =
    document.getElementById(
      "ingredientStockAlertTemplate"
    );

  if (!template) {
    return null;
  }

  const clone =
    template.content.cloneNode(true);
  document.body.appendChild(clone);
  modal =
    document.getElementById(
      "ingredientStockAlertModal"
    );
  return modal;
}
	
window.ingredientStockData = [];
function openIngredientStockAlert(data = []) {
  const modal =
    ensureIngredientStockAlertModal();

  if (!modal) {
    return;
  }
  const list =
    document.getElementById(
      "ingredientStockAlertList"
    );

  if (!list) {
    return;
  }

  list.innerHTML = "";

  data.forEach(item => {

    const qty =
      Number(item.qty || 0);

    const min =
      Number(item.min || 0);

    const statusClass =
      qty <= 0
        ? "text-red-500"
        : "text-orange-400";

    const statusText =
      qty <= 0
        ? "OUT"
        : "LOW";

    list.innerHTML += `
      <div class="py-5 border-b border-outline-variant">
        <div class="flex justify-between gap-4">
          <div class="flex items-start gap-3">
            <div
              class="w-9 h-9 rounded-md
              flex items-center
              justify-center
              flex-shrink-0">

              <span
                class="material-symbols-outlined
                text-on-surface text-xl">
                inventory_2
              </span>
            </div>
			  
            <div>
              <p
                class="font-bold text-xs lg:text-sm text-on-surface">
                ${item.name || "-"}
              </p>

              <p
                class="text-xs
                text-on-surface-variant
                mt-2">
                Current Stock :
                <span
                  class="font-semibold text-on-surface">
                  ${qty} ${item.unit || ""}
                </span>
              </p>

              <p
                class="text-xs
                text-on-surface-variant
                mt-1">
                Minimum Stock :
                <span
                  class="font-semibold text-on-surface">
                  ${min} ${item.unit || ""}
                </span>
              </p>
            </div>
          </div>

          <span
            class="text-xs font-bold ${statusClass}">
            ${statusText}
          </span>
        </div>
      </div>
    `;
  });

  modal.classList.remove("hidden");
  modal.classList.add("flex");
}

function closeIngredientStockAlert(){
  const modal = document.getElementById("ingredientStockAlertModal");
  if (!modal) return;
  modal.classList.add("hidden");

}

function ensureWhatsAppModal() {

  let modal =
    document.getElementById("whatsapp-message-modal");

  if (modal) {
    return modal;
  }

  const template =
    document.getElementById(
      "whatsAppMessageModalTemplate"
    );

  if (!template) {

    return null;
  }

  const clone =
    template.content.cloneNode(true);
  document.body.appendChild(clone);
  modal =
    document.getElementById(
      "whatsapp-message-modal"
    );

  return modal;
}
	
let whatsappComposerData = null;
function ensureWhatsAppModal() {

  // Sudah ada di DOM
  let modal =
    document.getElementById(
      "whatsapp-message-modal"
    );

  if (modal) {
    return modal;
  }

  // Ambil template
  const template =
    document.getElementById(
      "whatsAppMessageModalTemplate"
    );

  if (!template) {
    return null;
  }

  // Clone isi template
  const clone =
    template.content.cloneNode(true);
  document.body.appendChild(clone);

  // Ambil kembali setelah masuk DOM
  modal =
    document.getElementById(
      "whatsapp-message-modal"
    );
  return modal;
}


function openWhatsAppComposer({phone, title, message, type = null, trxId}) {
  whatsappComposerData = {phone, title, message, type, trxId};
  const modal =
    ensureWhatsAppModal();
  if (!modal) {
    return;
  }

  // TITLE
  const titleEl =
    document.getElementById(
      "waModalTitle"
    );
  if (titleEl) {
    titleEl.innerText =
      title || "WhatsApp Message";
  }

  // PHONE
  const phoneEl =
    document.getElementById(
      "waRecipient"
    );

  if (phoneEl) {
    phoneEl.value =
      phone || "";
  }

  // MESSAGE
  const messageEl =
    document.getElementById(
      "waMessage"
    );

  if (messageEl) {
    messageEl.value =
      message || "";
  }

  // OPEN MODAL
  modal.classList.remove("hidden");
  modal.classList.add("flex");
	
  // COUNTER
  updateWhatsAppCounter();

  // SEND BUTTON
  const sendBtn =
    document.getElementById(
      "waSendButton"
    );

  if (sendBtn) {
    sendBtn.onclick =
      sendWhatsAppComposer;
  }
}

function closeWhatsAppModal() {
  const modal = document.getElementById( "whatsapp-message-modal" );
  if (modal) {
    modal.classList.add("hidden");
    modal.classList.remove("flex");
  }
  whatsappComposerData = null;
}

async function sendWhatsAppComposer() {
  if (!whatsappComposerData) {
    return;
  }
  const messageEl =
    document.getElementById("waMessage");
  const message =
    messageEl
      ? messageEl.value
      : "";
  if (!message.trim()) {
    alert("Message masih kosong");
    return;
  }
  if (
    whatsappComposerData.type ===
    "transaction"
  ) {

    try {
      const trx =
        await getReceiptDataRPC(
          whatsappComposerData.trxId
        );
      if (!trx) {
        alert(
          "Data transaksi belum tersedia"
        );
        return;
      }
      sendReceiptWhatsappWithData(
        trx,
        whatsappComposerData.phone,
        message
      );
      closeWhatsAppModal();
    } catch (err) {
      alert(
        "Gagal mengambil data transaksi"
      );
    }
    return;
  }
  let wa =
    String(
      whatsappComposerData.phone || ""
    )
    .replace(/\D/g, "");
  if (wa.startsWith("0")) {
    wa =
      "62" +
      wa.slice(1);
  } else if (!wa.startsWith("62")) {
    wa =
      "62" +
      wa;
  }
  const url =
    "https://api.whatsapp.com/send?phone=" +
    wa +
    "&text=" +
    encodeURIComponent(message);
  window.open(
    url,
    "_blank"
  );
  closeWhatsAppModal();
}

function resetWhatsAppMessage() {
  if (!whatsappComposerData) {
    return;
  }
  const messageEl = document.getElementById("waMessage");
  if (messageEl) {
    messageEl.value =
      whatsappComposerData.message || "";
  }
  updateWhatsAppCounter();
}

function copyWhatsAppMessage() {
  const messageEl = document.getElementById("waMessage");
  if (!messageEl) {
    return;
  }
  navigator.clipboard.writeText(
    messageEl.value
  );
}

function updateWhatsAppCounter() {
  const messageEl = document.getElementById("waMessage");
  const counterEl = document.getElementById("waCounter");
  if (!messageEl || !counterEl) {
    return;
  }

  const length = messageEl.value.length;
  counterEl.innerText =
    `${length} Characters`;
}

function createMemberInfoMessage({name,memberId,level,point}) {

  return `
    MEMBER INFORMATION 📢

    Nama : *${name || "-"}*
    Member ID : *${memberId || "-"}*
    Level : *${level || "-"}*
    Total Point : *${Number(point || 0).toLocaleString("id-ID")}*

    Terima kasih telah menjadi member kami.

    Silakan tunjukkan Nama/Member ID Anda setiap transaksi untuk mendapatkan 
		point dan menikmati berbagai reward member.

    Sampai jumpa kembali.
  `;  
}

	
function createBirthdayMessage({ name }) {

  return ` 
  *Happy Birthday, ${name}!* 🎉🥳

  Semoga selalu diberikan kesehatan, kebahagiaan, dan rezeki yang lancar.

  Semoga semua yang diinginkan segera tercapai
  dan pastinya makin banyak alasan untuk tersenyum 😉

  Salam hangat,
  Tim Kami
  `;

}

function createTransactionMessage({name,total,point,invoice}){
  return `
    HALLO ${name || "-"},
    Terima kasih telah bertransaksi hari ini.
    No. Transaksi
    ${invoice || "-"}

    Total Transaksi
    Rp ${Number(total || 0).toLocaleString("id-ID")}

    Point Diperoleh
    ${Number(point || 0).toLocaleString("id-ID")} Point

    Kami tunggu kunjungan Anda kembali.
    Salam hangat.
    `;
}

	
function sendMemberCard(phone, name, memberId, level, point) {
  if (!phone) return;

  // NORMALISASI NOMOR WA
  let wa = String(phone)
    .replace(/\D/g, "");

  if (wa.startsWith("0")) {
    wa = "62" + wa.slice(1);
  } else if (!wa.startsWith("62")) {
    wa = "62" + wa;
  }

  // FORMAT POINT
  const totalPoint =
    Number(point || 0).toLocaleString("id-ID");
	
  // PESAN
  const message =
  "MEMBER INFORMATION\n\n" +
  "Nama\n" + (name || "-") + "\n\n" +
  "Member ID\n" + (memberId || "-") + "\n\n" +
  "Level\n" + (level || "-") + "\n\n" +
  "Total Point\n" +
  Number(point || 0).toLocaleString("id-ID") + "\n\n" +
  "Terima kasih telah menjadi member kami.\n\n" +
  "Silakan tunjukkan Member ID Anda setiap melakukan transaksi untuk mendapatkan point dan menikmati berbagai reward member.\n\n" +
  "Sampai jumpa kembali";

  // BUKA WHATSAPP
  window.open(
    "https://wa.me/" +
      wa +
      "?text=" +
      encodeURIComponent(message),
    "_blank"
  );
}

function handleMemberCard(btn){
  const phone = btn.dataset.phone;
  const message =
    createMemberInfoMessage({
      name: btn.dataset.name,
      memberId: btn.dataset.memberid,
      level: btn.dataset.level,
      point: btn.dataset.point
    });

  openWhatsAppComposer({
    phone,
    title: "Member Information",
    message
  });

}

function handleBirthday(btn){
  const phone = btn.dataset.phone;
  const message = 
  createBirthdayMessage({
	name: btn.dataset.name});
  openWhatsAppComposer({
    phone,
    title: "Birthday Greeting",
    message
  });
}

function handleTransaction(btn){
  const message =
    createTransactionMessage({
      name: btn.dataset.name,
      total: btn.dataset.total,
      point: btn.dataset.point,
      invoice: btn.dataset.invoice
    });

  openWhatsAppComposer({
    phone: btn.dataset.phone,
    title: "Thank You",
    message,
    trxId: btn.dataset.trxid,
    type: "transaction"
  });
}

function handleNotification(btn){
  const type =
    btn.dataset.type;
  if(type === "ingredient"){
    openIngredientStockAlert(
      window.ingredientStockData
    );
  }
}

function handleMemberSearch(value) {
  const keyword = value.toLowerCase();
  const filtered = state.members.filter(m => {
    return (
      (m.Nama || "").toLowerCase().includes(keyword) ||
      (m.ID_Member || "").toLowerCase().includes(keyword) ||
      (m.WA || "").toLowerCase().includes(keyword)
    );
  });
  renderMembers(filtered);
}

function handleTierFilter(tier) {
  let filtered = state.members;
  if (tier !== "all") {
    filtered = state.members.filter(m =>
      (m.Level_Current || "kenal") === tier
    );
  }
  renderMembers(filtered);
}

function initMemberSearch() {
  const input = document.getElementById("memberSearchInput");
  if (!input) {
    return;
  }
  input.addEventListener("input", (e) => {
    handleMemberSearch(e.target.value);
  });
}

function initTierFilter() {
  const select = document.getElementById("tierFilter");
  if (!select) {
    return;
  }
  select.addEventListener("change", (e) => {
    handleTierFilter(e.target.value);
  });

}

function loadMemberStats(){
  const res =
    state.memberPageData?.stats;

  if(!res) return;
  document.getElementById("total-members").innerText =
    formatNumber(res.total);
  document.getElementById("total-top-tier").innerText =
    formatNumber(res.topTier);
  document.getElementById("total-points").innerText =
    formatCompact(res.points);
  document.getElementById("top-tier-label").innerText =
    `${res.topTierName} Tier`;
}

function loadMemberGrowth() {
  const res = state.memberPageData;
  if (!res) return;
  const el = document.getElementById("member-growth");
  if (!el) return;
  const growth = res.growth?.growth || 0;
  const sign = growth >= 0 ? "+" : "";
  el.innerText =
    `${sign}${growth}%`;
}

function applyFilters() {
  const keyword = document.getElementById("memberSearchInput")?.value.toLowerCase() || "";
  const tier = document.getElementById("tierFilter")?.value || "all";
  let data = state.members;

  if (tier !== "all") {
    data = data.filter(m => (m.Level_Current || "Kenal") === tier);
  }
  if (keyword) {
    data = data.filter(m =>
      (m.Nama || "").toLowerCase().includes(keyword) ||
      (m.ID_Member || "").toLowerCase().includes(keyword)
    );
  }
  renderMembers(data);
}

function initMemberExport() {
  const btn =
    document.getElementById(
      "btnExportMembersPDF"
    );

  if (!btn) return;
  btn.onclick = exportMembersPDF;
}

async function exportMembersPDF() {

  // FILTER
  const tier =
    document.getElementById("tierFilter")?.value || "ALL";

  const branchId =
    state?.branchId || "";
 
  // VALIDASI
  if (!branchId) {
    showToast(
      "Branch login tidak ditemukan",
      "error"
    );
    return;
  }
	
  // OPEN REPORT WINDOW
  const pdfWindow =
    window.open(
      "",
      "_blank"
    );

  if (!pdfWindow) {
    showToast(
      "Popup diblokir browser",
      "error"
    );
    return;
  }
	
  // LOADING PAGE
  pdfWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>
        Generating Member Report...
      </title>

      <style>
        body {
          margin: 0;
          height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #0B0F14;
          color: white;
          font-family: Arial,
            sans-serif;
        }

        .box {
          text-align: center;
        }

        .loader {
          width: 32px;
          height: 32px;
          border: 3px solid
            rgba(255,255,255,.2);
          border-top-color: white;
          border-radius: 50%;
          animation: spin .8s linear infinite;
          margin: 0 auto 20px;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        h2 {
          margin: 0 0 8px;
          font-size: 18px;
        }

        p {
          margin: 0;
          font-size: 13px;
          opacity: .65;
        }

      </style>
    </head>

    <body>
      <div class="box">
        <div class="loader"></div>
        <h2>
          Generating Member Report...
        </h2>

        <p>
          Please wait
        </p>
      </div>
    </body>
    </html>
  `);
	
// REQUEST
try {	
	const sessionId =
		localStorage.getItem("pos_session_id");
	
  const payload = {
    type: "members",
    tier: tier,
    branchId: branchId,
		sessionId,
		tenantSlug: state.tenantSlug
  };

    const response =
      await fetch(
        "/api/export-pdf",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json"
          },
          body:
            JSON.stringify(
              payload
            )
        }
      );

    // RESPONSE TEXT
    const text =
      await response.text();

    // HTTP ERROR
    if (!response.ok) {
      let errorMessage =
        `Export member gagal (${response.status})`;
			
      try {
        const json =
          JSON.parse(text);
        errorMessage =
          json?.error ||
          json?.message ||
          errorMessage;
      }
				
      catch (_) {
        if (text) {
          errorMessage =
            text;
        }
      }
      throw new Error(
        errorMessage
      );
    }

    // EMPTY RESPONSE
    if (
      !text ||
      !text.trim()
    ) {
      throw new Error(
        "Server mengembalikan HTML kosong."
      );
    }

    // RENDER REPORT
    pdfWindow.document.open();
    pdfWindow.document.write(
      text
    );
    pdfWindow.document.close();
  }

  catch (err) {
    const message =
      String(
        err?.message ||
        err ||
        "Unknown error"
      )
      .replace(
        /&/g,
        "&amp;"
      )
      .replace(
        /</g,
        "&lt;"
      )
      .replace(
        />/g,
        "&gt;"
      );

    pdfWindow.document.open();
    pdfWindow.document.write(`

      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>
          Export Member Error
        </title>

        <style>
          body {
            margin: 0;
            padding: 40px;
            background: #0B0F14;
            color: white;
            font-family: Arial,
              sans-serif;
          }

          .error {
            color: #ff6b6b;
          }

          .message {
            margin-top: 20px;
            background: #151A21;
            padding: 15px;
            border-radius: 10px;
            white-space: pre-wrap;
            color: #ff8080;
          }
        </style>
      </head>

      <body>
        <h2 class="error">
          Export Member Error
        </h2>

        <p>
          Gagal membuat Member Report.
        </p>

        <div class="message">
          ${message}
        </div>
      </body>
      </html>
    `);

    pdfWindow.document.close();
    showToast(
      "Export Member gagal",
      "error"
    );
  }
}

function openAddMemberModal() {
  const template = document.getElementById("addmemeberModalTemplate");
  const clone = template.content.cloneNode(true);
  const modalWrapper = document.createElement("div");
  modalWrapper.id = "addMemberModalWrapper";
  modalWrapper.appendChild(clone);
  document.body.appendChild(modalWrapper);
  // CLOSE BUTTON (FIXED)
  const closeBtn = modalWrapper.querySelector("#closeAddMemberModal");
  if (closeBtn) {
    closeBtn.onclick = () => {
      modalWrapper.remove();
    };
  }
  // CLICK OUTSIDE CLOSE
  modalWrapper.addEventListener("click", (e) => {
    if (e.target === modalWrapper) {
      modalWrapper.remove();
    }
  });
  // OPTIONAL: ESC KEY CLOSE
  document.addEventListener("keydown", function escClose(e) {
    if (e.key === "Escape") {
      modalWrapper.remove();
      document.removeEventListener("keydown", escClose);
    }
  });
}

function saveMember() {
  const modal = document.getElementById("addMemberModalWrapper");
  const name = modal.querySelector('input[placeholder="e.g. Julian Vane"]').value;
  const wa = modal.querySelector('input[type="tel"]').value;
  const email = modal.querySelector('input[type="email"]').value;
  modal.remove();
}

async function submitMember() {
  const payload = {
    ID_Member:
      document.querySelector("#memberID").value,
    Nama:
      document.querySelector("#memberName").value,
    Tgl_Lahir:
      document.querySelector("#memberDOB").value,
    WA:
      document.querySelector("#memberWA").value,
    Email:
      document.querySelector("#memberEmail").value,
    Instagram:
      document.querySelector("#memberIG").value,
    Facebook:
      document.querySelector("#memberFB").value,
    TikTok:
      document.querySelector("#memberTiktok").value,
    Address:
      document.querySelector("#memberAddress").value,
    branchId:
      state.branchId
  };

  try {
	  
    // SUPABASE RPC
    const result =
      await addMemberRPC(payload);
    if (!result) {
      throw new Error(
        "Backend mengembalikan data kosong"
      );
    }

    // Jika RPC mengembalikan success false
    if (result.success === false) {
      throw new Error(
        result.message ||
        "Gagal menyimpan member"
      );
    }

    showToast(
      "Member berhasil ditambahkan ✔",
      "success"
    );

    // Reset cache member
    state.memberPageData = null;
    state.members = null;
    resetMemberForm();
    closeAddMemberModal();
    // Reload data member
    await loadMembers();
	
  } catch (err) {
    showToast(
      err.message ||
      "Gagal simpan member!",
      "error"
    );
  }
}

function closeAddMemberModal() {
  const modal = document.getElementById("addMemberModalWrapper");
  if (modal) {
    modal.remove();
  }
}

function updateDOBText() {
  const input = document.getElementById("memberDOB");
  const text = document.getElementById("dobText");
  if (input.value) {
    // format default YYYY-MM-DD → bisa langsung tampilkan
    text.innerText = input.value;
  } else {
    text.innerText = "Select Date";
  }
}

function resetMemberForm() {
  // reset semua input
  const inputs = document.querySelectorAll(
    "#memberID, #memberName, #memberDOB, #memberWA, #memberEmail, #memberIG, #memberFB, #memberTiktok"
  );
  inputs.forEach(el => {
    if (el) el.value = "";
  });
  // reset textarea (address)
  const address = document.querySelector("#memberAddress");
  if (address) address.value = "";
  // reset DOB custom text UI
  const dobText = document.getElementById("dobText");
  if (dobText) dobText.innerText = "Select Date";
  // safety reset date input (biar browser tertentu nggak nyangkut)
  const dob = document.querySelector("#memberDOB");
  if (dob) dob.value = "";
}

function initMemberTabs(modal) {
  const tabs = modal.querySelectorAll("[data-tab]");
  const contents = modal.querySelectorAll("[data-tab-content]");
  function setTab(active) {

    tabs.forEach(btn => {
      const isActive = btn.dataset.tab === active;
      btn.classList.toggle("border-b-2", isActive);
      btn.classList.toggle("border-primary", isActive);
      btn.classList.toggle("text-on-surface", isActive);
      btn.classList.toggle("text-on-surface-variant", !isActive);
    });
    contents.forEach(sec => {
      sec.classList.toggle("hidden", sec.dataset.tabContent !== active);
    });
  }
  tabs.forEach(btn => {
    btn.addEventListener("click", () => {
      setTab(btn.dataset.tab);
    });
  });
  setTab("personal");
}

function setField(modal, key, value) {
  const el = modal.querySelector(`[data-field="${key}"]`);
  if (!el) return;
  el.textContent = value || "-";
}

function openMemberProfile(memberId) {
  const member = state.members.find(m =>
    String(m.ID_Member).trim() === String(memberId).trim()
  );

  if (!member) {
    alert("Member tidak ditemukan di state");
    return;
  } editingMember = member;

  // REMOVE OLD MODAL
  document.getElementById("member-modal-wrapper")?.remove();
  const template = document.getElementById("profilmemberModalTemplate");
  const clone = template.content.cloneNode(true);
  const wrapper = document.createElement("div");
  wrapper.id = "member-modal-wrapper";
  wrapper.className = "fixed inset-0 z-[60]";
  wrapper.appendChild(clone);
  document.body.appendChild(wrapper);
  const modal = wrapper.querySelector("[data-member-modal]");
  if (!modal) return;

  // HEADER
  modal.querySelector("#memberName").innerText = member.Nama || "-";
  modal.querySelector("#memberId").innerText = member.ID_Member || "-";
  const tierBadge = modal.querySelector("#memberTierBadge");

  if (tierBadge) {
    const tier = member.Level_Current || "";
    tierBadge.innerText = tier.toUpperCase();
    tierBadge.className = "absolute bottom-1 right-1 px-3 py-0.5 rounded-md text-[10px] font-bold tracking-widest z-20 shadow-lg";
	  
    const settings = window.loyaltySettings || {};
    const tier1 = String(settings.tier_1_name_value || "") .toLowerCase();
    const tier2 = String(settings.tier_2_name_value || "") .toLowerCase();
    const tier3 = String(settings.tier_3_name_value || "") .toLowerCase();
    const tier4 = String(settings.tier_4_name_value || "") .toLowerCase();
    const tier5 = String(settings.tier_5_name_value || "") .toLowerCase();
    const current = String(tier).toLowerCase();

    if (current === tier5) {
      tierBadge.classList.add(
        "bg-cyan-400",
        "text-black"
      );
    }

    else if (current === tier4) {
      tierBadge.classList.add(
        "bg-slate-300",
        "text-black"
      );
    }

    else if (current === tier3) {
      tierBadge.classList.add(
        "bg-amber-500",
        "text-black"
      );
    }

    else if (current === tier2) {
      tierBadge.classList.add(
        "bg-slate-500",
        "text-white"
      );
    }

    else {
      tierBadge.classList.add(
        "bg-zinc-700",
        "text-white"
      );
    }
  }
  const img = modal.querySelector("#memberPhoto");

    if (img) {
      let photoUrl = "";
      const photo =
        String(
          member.Photo || ""
        ).trim();
		
      if (photo) {
        // ===== SUPABASE =====
        if (
          photo.includes("supabase.co")
        ) {
          photoUrl = photo;
        }
        // ===== GOOGLE DRIVE LINK =====
        else if (
          photo.includes(
            "drive.google.com"
          )
        ) {
          const match =
            photo.match(
              /\/d\/([^/]+)/
            );

          if (match) {
            photoUrl =
              "https://drive.google.com/thumbnail?id=" +
              match[1] +
              "&sz=w1000";
          }
        }
        // ===== HANYA ID DRIVE =====
        else {
          photoUrl =
            "https://drive.google.com/thumbnail?id=" +
            photo +
            "&sz=w1000";
        }
      }

      img.src =
        photoUrl ||
        "https://ui-avatars.com/api/?name=" +
        encodeURIComponent(
          member.Nama || "Member"
        );
    }

  // FIELD MAPPING (FIXED SESUAI TABLE)
  const set = (id, val) => {
    const el = modal.querySelector(`#${id}`);
    if (el) el.innerText = val ?? "-";
  };

  set(
  "joinDate",
  member.Join_Date
    ? new Date(member.Join_Date).toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "long",
        year: "numeric"
      })
    : "-"
  );

  set(
    "birthday",
    member.Tgl_Lahir
      ? new Date(member.Tgl_Lahir).toLocaleDateString("id-ID", {
          day: "2-digit",
          month: "long",
          year: "numeric"
        })
      : "-"
  );
  set("whatsapp", member.WA);
  set("address", member.Address);

  // MONEY
  const invest = modal.querySelector("#totalInvestment");
  if (invest) {
    invest.innerHTML = `IDR ${(Number(member.Total_Spend || 0)).toLocaleString("id-ID")}`;
  }
  const points = modal.querySelector("#loyaltyPoints");
  if (points) {
    points.innerHTML = `${member.Point || 0} <span class="text-xs ml-2">PTS</span>`;
  }

  // TIER HISTORY
  getMemberDetailPageRPC(
    member.ID_Member,
    state.branchId
  )
  .then(data => {
    if(!data || !data.success){
      renderTierProgression([]);
      renderTierTimeline([], modal );
      return;
    }
    const history = data.tierHistory?.history || [];
    renderTierProgression(history);
    renderTierTimeline(history, modal);
  })
  .catch(err => {
    renderTierProgression([]);
    renderTierTimeline(
      [],
      modal
    );
  });

  document.body.style.overflow = "hidden";
  initMemberTabs(modal);
}

function initMemberTabs(modal) {
  const buttons = modal.querySelectorAll("[data-tab]");
  const contents = modal.querySelectorAll(".tab-content");
  buttons.forEach(btn => {
    btn.addEventListener("click", () => {
      const target = btn.dataset.tab;

      // RESET BUTTON
      buttons.forEach(b => {
        b.classList.remove(
          "border-b-2",
          "border-primary",
          "text-on-surface",
          "font-semibold"
        );
        b.classList.add(
          "text-on-surface-variant"
        );

      });
      // ACTIVE BUTTON
      btn.classList.add(
        "border-b-2",
        "border-primary",
        "text-on-surface",
        "font-semibold"
      );
      btn.classList.remove(
        "text-on-surface-variant"
      );
      // HIDE CONTENT
      contents.forEach(content => {
        content.classList.add("hidden");
      });
      // SHOW TARGET
      const activeTab =
        modal.querySelector(`#${target}Tab`);
      if (activeTab) {
        activeTab.classList.remove("hidden");
      }
    });
  });
}

function renderTierTimeline(history, modal) {
  const container = modal.querySelector("#tierHistoryTimeline");
  if (!container) return;
  if (!history || !history.length) {
    container.innerHTML = `
      <div class="text-sm text-muted">
        No tier history
      </div>
    `;
    return;
  }
	
  const settings = window.loyaltySettings || {};
  const tier1 = String(settings.tier_1_name_value || "") .toLowerCase();
  const tier2 = String(settings.tier_2_name_value || "") .toLowerCase();
  const tier3 = String(settings.tier_3_name_value || "") .toLowerCase();
  const tier4 = String(settings.tier_4_name_value || "") .toLowerCase();
  const tier5 = String(settings.tier_5_name_value || "") .toLowerCase();
	
  container.innerHTML = history.map((h, index) => {
    const current = index === 0;
    const year = h.year || "-";
    const tier = h.tier || settings.tier_1_name_value || "-";
    let icon = "handshake";
    const tierLower = String(tier).toLowerCase();
    if (tierLower === tier5) { icon = "diamond";}
    else if (tierLower === tier4) { icon = "workspace_premium"; }
    else if (tierLower === tier3) { icon = "local_cafe"; }
    else if (tierLower === tier2) { icon = "sentiment_very_satisfied"; }
    else if (tierLower === tier1) { icon = "handshake"; }

    let description = "Recently joined the loyalty ecosystem and started building customer activity.";
    if (tierLower === tier5) { description = "Recognized as one of the highest loyalty members with exceptional spending activity and premium privileges."; }
    else if (tierLower === tier4) { description = "Maintained outstanding transaction consistency and unlocked premium member benefits.";}
    else if (tierLower === tier3) { description = "Demonstrated strong purchasing activity with enhanced loyalty rewards."; }
    else if (tierLower === tier2) { description = "Actively engaged through recurring visits and steady transaction growth."; }



    return `
      <div class="relative pl-10">
        <div class="
          absolute left-[15px] top-2 bottom-0 w-px
          ${current
            ? "bg-gradient-to-b from-primary to-primary-container/20"
            : "bg-outline-variant/30"}
        "></div>
        <div class="
          absolute left-0 top-1
          w-8 h-8 rounded-md
          flex items-center justify-center
          z-10
          ${current
            ? "bg-primary shadow-[0_0_15px_rgba(255,193,116,0.3)]"
            : "bg-surface-container-highest border border-outline-variant/30"}
        ">
          <span class="
            material-symbols-outlined text-sm
            ${current
              ? "text-on-primary"
              : "text-secondary"}
          ">
            ${icon}
          </span>
        </div>

        <div class="
          p-5 rounded-md

          ${current
            ? "bg-surface-container-low/40 border border-primary/20"
            : "bg-surface-container-low/20 border border-outline-variant"}
        ">
          <div class="flex justify-between items-start mb-2">
            <div>
              <h4 class="
                font-headline text-lg font-bold
                ${current
                  ? "text-on-surface"
                  : "text-on-surface"}
              ">
                ${tier} Status
              </h4>
			  
              <p class="
                font-label text-[10px]
                text-on-surface-variant
                uppercase tracking-widest
                font-bold opacity-60
              ">
                ${year}
              </p>
			  
              <p class="
                text-xs
                text-on-surface-variant
                leading-relaxed
                mt-2
              ">
                ${description}
              </p>
            </div>
            ${
              current
                ? `
                  <div class="
                    bottom-theme
                    px-2 py-1
                    rounded
                    text-[10px]
                    font-bold
                    text-on-surface
                    border border-primary/20
                  ">
                    CURRENT
                  </div>
                `
                : ""
            }
          </div>
        </div>
      </div>
    `;
  }).join("");

}

function closeMemberProfile() {
  document.getElementById("member-modal-wrapper")?.remove();
  document.body.style.overflow = "";
}

document.addEventListener("click", function (e) {
  // CLOSE BUTTON
  const closeBtn = e.target.closest("[data-member-close]");
  if (closeBtn) {
    closeMemberProfile();
    return;
  }
  // BACKDROP CLICK
  const modal = e.target.closest("[data-member-modal]");
  if (modal && e.target === modal) {
    closeMemberProfile();
  }
});

function enableEditMember() {
  const modal = document.querySelector("[data-member-modal]");
  if (!modal || !editingMember) return;
  const makeInput = (id, value) => {
    const el = modal.querySelector(`#${id}`);
    if (!el) return;
    el.innerHTML = `
      <input class="w-full bg-background p-2 rounded-md"
        value="${value || ""}" id="edit-${id}">
    `;
  };
  makeInput("memberName", editingMember.Nama);
  makeInput("whatsapp", editingMember.WA);
  makeInput("address", editingMember.Address);
  makeInput("birthday", editingMember.Tgl_Lahir);
  makeInput("joinDate", editingMember.Join_Date);
  // ubah tombol jadi SAVE
	const btn =
	  document.querySelector("#memberEditBtn");

	if (btn) {
	  btn.innerHTML = `
	    <span
	      class="material-symbols-outlined mr-2 text-xl"
	      style="font-variation-settings: 'FILL' 1;">
	      save
	    </span>
	    Save Changes
	  `;
	  btn.onclick = saveMemberEdit;
	}
}

async function saveMemberEdit() {
  const modal =
    document.querySelector(
      "[data-member-modal]"
    );

  if (!modal || !editingMember) {
    return;
  }

  // PAYLOAD
  const payload = {
    ...editingMember,

    Nama:
      document.querySelector(
        "#edit-memberName"
      ).value,

    WA:
      document.querySelector(
        "#edit-whatsapp"
      ).value,

    Address:
      document.querySelector(
        "#edit-address"
      ).value,

    Tgl_Lahir:
      document.querySelector(
        "#edit-birthday"
      ).value,

    Join_Date:
      document.querySelector(
        "#edit-joinDate"
      ).value,
    PhotoBase64:
      memberPhotoBase64,
    branchId:
      state.branchId

  };
	
  try {
    // UPLOAD FOTO BARU
    if (
      payload.PhotoBase64 &&
      payload.ID_Member
    ) {

      const photoUrl =
        await uploadMemberImage(
          payload.PhotoBase64,
          payload.ID_Member
        );

      if (!photoUrl) {
        throw new Error(
          "URL foto member tidak diterima"
        );
      }

      // SIMPAN URL KE PHOTO
      payload.Photo = photoUrl;
    }
	
    // JANGAN KIRIM BASE64 KE RPC
    delete payload.PhotoBase64;

    // UPDATE MEMBER
    const res =
      await updateMemberRPC(
        payload
      );

    // VALIDATE RESPONSE
    if (!res) {
      throw new Error(
        "Backend mengembalikan data kosong"
      );
    }

    if (res.success === false) {
      throw new Error(
        res.message ||
        "Gagal update member"
      );
    }

    // SUCCESS
    showToast(
      "Member berhasil diperbarui ✔",
      "success"
    );

    // CLEAR CACHE
    state.memberPageData = null;
    state.members = null;

    // CLOSE + RELOAD
    closeMemberProfile();
    await loadMembers();
  }
  catch (err) {
    showToast(
      err.message ||
      "Gagal update member",
      "error"
    );
  }
}

function renderTierProgression(history = []) {

  const el =
    document.getElementById("tierProgression");

  if (!el) return;

  if (!history.length) {

    el.innerHTML = `
      <p class="text-xs lg:text-sm text-on-surface-variant">
        No tier history
      </p>
    `;

    return;
  }

  el.innerHTML = history.map((item, index) => {

    const isCurrent = index === 0;

    return `
      <div class="relative flex items-center justify-between pl-8">

        <div class="
          absolute left-0 w-2 h-2 rounded-md
          ${isCurrent
            ? "bg-primary shadow-[0_0_8px_rgba(245,158,11,0.6)]"
            : "bg-outline-variant"}
        "></div>

        <div>
          <p class="
            text-[10px] font-bold tracking-widest uppercase
            ${isCurrent
              ? "text-on-surface"
              : "text-on-surface-variant/60"}
          ">
            ${item.year}
          </p>

          <p class="
            text-sm font-semibold
            ${isCurrent
              ? "text-on-surface"
              : "text-on-surface/80"}
          ">
            ${item.tier}
          </p>
        </div>

        ${
          isCurrent
            ? `
            <span class="
              text-[10px]
              bg-primary-container/20
              text-on-surface
              border border-primary/30
              px-2 py-0.5
              rounded-md
            ">
              Current
            </span>
          `
            : ""
        }

      </div>
    `;
  }).join("");
}

async function loadNotifications() {
  let res = state.memberPageData;
  if (!res) {
    try {
      res = await getMemberPageDataRPC(
        state.branchId
      );
      state.memberPageData = res;

    } catch (err) {
      return;
    }
  }

	const badge = document.getElementById("notificationBadge");
	const list = document.getElementById("notificationList");

	if (!badge || !list) return;
	list.innerHTML = "";

	const members = res?.birthday || [];
	const transactions = res?.transaction || [];
	const ingredients = res?.ingredientStock || [];
	window.ingredientStockData = ingredients;

 	if ( !res?.success ||
		(
		members.length === 0 &&
		transactions.length === 0 &&
		ingredients.length === 0
		)
		) {
			badge.classList.add("hidden");
			list.innerHTML = `
			<div class="p-4 text-sm text-muted">
				No Notifications
			</div>
			`;
			return;
		}

	badge.classList.remove("hidden");
	badge.innerText = "";
	if (window.ingredientStockData.length > 0) {
		list.innerHTML += `
		<div
 
		onclick="handleNotification(this)"
		data-type="ingredient"
		class="
		p-4 border-b border-outline-variant
		hover:bg-outline-variant
		cursor-pointer
		transition-all
		"
		data-type="ingredient"
		>
			<div class="flex items-start gap-3">
				<div class="w-10 h-10 rounded-md bg-red-500/10 flex items-center justify-center">
					<span class="material-symbols-outlined text-red-500">
						warning
					</span>
				</div>

				<div class="flex-1">
					<p class="font-semibold text-sm">
						⚠️ Ingredient Low Stock
					</p>

					<p class="text-xs text-on-surface-variant mt-1">
						${ingredients.length}
						ingredient perlu restock

						• Klik untuk melihat detail
					</p>
				</div>
			</div>
		</div>
		`;
	}

	members.forEach(member => {
		list.innerHTML += `

		 <div class=" p-4 border-b border-outline-variant hover:bg-outline-variant cursor-pointer transition-all"
				onclick="handleBirthday(this)"
				data-phone="${member.phone || ''}"
				data-name="${member.name || ''}" >
				<div class="flex items-start gap-3">
					<div class="w-10 h-10 rounded-md overflow-hidden bg-background">

					<img src="${member.photo || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(member.name)}"
						class="w-full h-full object-cover"/>
				</div>

					<div class="flex-1">
						<p class="font-semibold text-sm">
							${
								member.daysLeft === 0
									? `🎂 ${member.name} berulang tahun hari ini`
									: `🎂 ${member.name} ulang tahun ${member.daysLeft} hari lagi`
							}
						</p>

						<p class="text-xs text-on-surface-variant mt-1">
							Klik untuk mengirim ucapan WhatsApp
						</p>
					</div>
				</div>
			</div>
		`;
	});

	transactions.forEach(trx => {
		list.innerHTML += `
			<div class=" p-4 border-b border-outline-variant hover:bg-outline-variant cursor-pointer transition-all"
				onclick="handleTransaction(this)"
				data-phone="${trx.phone || ''}"
				data-name="${trx.name || ''}"
				data-total="${trx.total || 0}"
				data-point="${trx.point || 0}"
				data-invoice="${trx.invoice || ''}"
				data-trxid="${trx.id || trx.invoice || ''}">
				
				<div class="flex items-start gap-3">
					<div class=" w-10 h-10 rounded-md overflow-hidden bg-background">
						<img src="${trx.photo || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(trx.name)}"
							class="w-full h-full object-cover"/>
					</div>
					
					<div class="flex-1">
						<p class="font-semibold text-sm">
							💰 ${trx.name} baru melakukan transaksi
						</p>
	
						<p class="text-xs text-on-surface-variant mt-1">
							Rp ${Number(trx.total || 0).toLocaleString("id-ID")}
							• Klik untuk mengirim ucapan terima kasih
						</p>
					</div>
				</div>
			`;
		});
	}

function toggleNotification() {
  const el = document.getElementById("notificationDropdown");
  if (!el) return;
  el.classList.toggle("hidden");
}

let memberPhotoBase64 = null;
    
async function previewMemberPhoto(e) {
  const file = e.target.files[0];
  if (!file) return;
  const compressed = await compressImage(
      file,
      500,
      0.6
    );
  memberPhotoBase64 = await fileToBase64(compressed);
  document.getElementById("memberPhoto" ).src = memberPhotoBase64;
}

	
    	// ==================================
    	// TABLES
    	// ==================================

async function loadTables() {

  if (!state.branchId) {
    return;
  }
  // LOAD FROM CACHE
  if (
    state.tableData &&
    state.tableDataBranchId === state.branchId
  ) {
    renderTableGrid(
      state.tableData
    );
    return;
  }

  try {

    // SUPABASE RPC
    const res =
      await getTableDataRPC(
        state.branchId
      );
		
    state.tableData =
      res || [];
    state.tableDataBranchId =
      state.branchId;
    renderTableGrid(
      state.tableData
    );
  }

  catch (err) {
    showToast(
      "Gagal memuat meja",
      "error"
    );
  }
}

async function loadBilling(mejaId) {

  try {
	
    if (!mejaId) {
      renderBilling(null);
      return;
    }

    // SUPABASE RPC
    const res =
      await getLatestTransactionByTableRPC(
        mejaId
      );

    renderBilling(
      res || null
    );
  }

  catch (err) {
    showToast(
      "Gagal load billing",
      "error"
    );
  }
}

function renderTableGrid(data) {

  const grid = document.getElementById("table-grid");
  if (!grid) return;
  let available = 0;
  let occupied = 0;
  let reserved = 0;
  let html = "";

  (data || []).forEach(t => {

    const status = (t.status || "").toLowerCase().trim();
    const tableNumber = String(t.name || "").padStart(2, "0");
    if (status === "available") available++;
    else if (status === "occupied") occupied++;
    else if (status === "reserved") reserved++;
    if (status === "occupied") {
      html += `
        <div
          onclick="selectTable('${t.id}')"
          class="bg-background rounded-md overflow-hidden
            border border-outline-variant
            shadow-[0_2px_10px_rgba(0,0,0,0.15)]
            p-6 relative hover:bg-outline-variant transition">
          <div class="flex justify-between mb-2">
            <span class="px-2 py-1 rounded-md bg-background border border-outline-variant font-bold text-2xl">${tableNumber}</span>
            <span class="text-xs font-bold text-on-surface">Occupied</span>
          </div>
          <p>IDR ${t.total || 0}</p>
          <p class="text-sm">${t.guest || "-"}</p>
        </div>
      `;
    }

    else if (status === "reserved") {
      html += `
        <div
        onclick="selectTable('${t.id}')"
        class="bg-background rounded-md overflow-hidden
            border border-outline-variant
            shadow-[0_2px_10px_rgba(0,0,0,0.15)]
            p-6 relative hover:bg-outline-variant transition">
          <div class="flex justify-between mb-2">
            <span class="font-bold text-2xl">${tableNumber}</span>
            <span class="text-xs text-on-surface">Reserved</span>
          </div>
          <p>${t.guest || "-"}</p>
          <p class="text-sm">${t.note || "-"}</p>
        </div>
      `;
    }

    else {
      html += `
        <div
        onclick="selectTable('${t.id}')"
        class="bg-background rounded-md overflow-hidden
            border border-outline-variant
            shadow-[0_2px_10px_rgba(0,0,0,0.15)]
            p-6 relative hover:bg-outline-variant transition flex flex-col items-center cursor-pointer">
          <span class="text-2xl font-bold">${tableNumber}</span>

          <button
            class="mt-3 px-4 py-2 bottom-theme border border-outline-variant text-on-surface rounded-md">
            Open Table
          </button>

        </div>
      `;
    }
  });

  grid.innerHTML = html;
  document.getElementById("availableCount").textContent = available;
  document.getElementById("occupiedCount").textContent = occupied;
  document.getElementById("reservedCount").textContent = reserved;
}

function assignTable(tableId, orderId, guest, total) {
  table.status = "occupied";
  table.orderId = orderId;
  table.guest = guest;
  table.total = total;
  table.duration = 0;
  renderTableGrid();
}

function reserveTable(tableId, guest, time, pax) {
  table.status = "reserved";
  table.guest = guest;
  table.time = time;
  table.pax = pax;
  renderTableGrid();
}

function clearTable(tableId) {
  table.status = "available";
  table.orderId = null;
  table.guest = null;
  table.total = null;
  table.duration = null;
  renderTableGrid();
}

function openReserveModalFromSidebar() {
  if (!selectedTableId) {
    alert("Pilih meja dulu!");
    return;
  }
  document.getElementById("billingActions").classList.add("hidden");
  document.getElementById("reserveForm").classList.remove("hidden");
}

function cancelReserve() {
  document.getElementById("reserveForm").classList.add("hidden");
  document.getElementById("billingActions").classList.remove("hidden");
}

async function saveReserve() {
  const name =
    document.getElementById(
      "reserveName"
    )?.value?.trim() || "";
  const note =
    document.getElementById(
      "reserveNote"
    )?.value?.trim() || "";

  try {

    if (!selectedTableId) {
      showToast(
        "Meja belum dipilih",
        "error"
      );
      return;
    }

    // SUPABASE RPC
    const res =
      await reserveTableRPC(
        selectedTableId,
        name,
        note
      );

    if (res) {
      state.tableData = null;
      cancelReserve();
      await loadTables();
    }
  }

  catch (err) {
    showToast(
      err?.message ||
      "Gagal reserve meja",
      "error"
    );
  }
}

async function clearSelectedTable() {
  if (!selectedTableId) {
    alert(
      "Pilih meja dulu!"
    );
    return;
  }

  try {
	
    // SUPABASE RPC
    const res =
      await clearTableStatusRPC(
        selectedTableId
      );
		
    if (res) {
      // Clear cache
      state.tableData = null;
      // Reload table
      await loadTables();
      // Reset selected table
      selectedTableId = null;
      const info =
        document.getElementById(
          "billing-table-info"
        );

      if (info) {
        info.innerText =
          "No Table Selected";
      }
    }
  }
  catch (err) {
    showToast(
      err?.message ||
      "Gagal reset meja",
      "error"
    );
  }
}

function renderBilling(data) {
  const container = document.getElementById("table-cart-items");
  const summary = document.getElementById("table-cart-summary");
  const statusEl = document.getElementById("billing-table-status");

  if (!data) {
    container.innerHTML =
      "<p class='text-muted text-sm'>No active transaction</p>";

    summary.innerHTML = "";

    if (statusEl) {
      statusEl.innerText = "No Status";
    }

    return;
  }

  // STATUS
  if (statusEl) {
    statusEl.innerText = data.status || "No Status";
  }

  // ITEMS
  container.innerHTML = "";

  data.items.forEach(item => {
    container.innerHTML += `
      <div class="flex justify-between items-center bg-background p-4 rounded-2xl">
        <div class="flex items-center gap-4">
          <div class="w-10 h-10 flex items-center justify-center rounded-md text-on-surface font-bold text-sm">
            ${item.qty}x
          </div>

          <div>
            <p class="text-sm font-semibold text-on-surface">
              ${item.name}
            </p>

            <p class="text-sm font-medium text-on-surface-variant">
              ${item.note || ""}
            </p>
          </div>
        </div>

        <p class="text-sm font-bold text-on-surface">
          ${formatRupiah(item.total)}
        </p>
      </div>
    `;
  });

  // SUMMARY
	summary.innerHTML = `
	  <div class="space-y-2">
	
		<div class="flex justify-between text-sm">
		  <span class="text-muted">Subtotal</span>
		  <span>${formatRupiah(data.subtotal)}</span>
		</div>
	
		<div class="flex justify-between text-sm">
		  <span class="text-muted">Discount</span>
		  <span>- ${formatRupiah(data.discount)}</span>
		</div>
	
		<div class="flex justify-between text-sm">
		  <span class="text-muted">Tax</span>
		  <span>${formatRupiah(data.tax)}</span>
		</div>
	
		<div class="flex justify-between text-sm">
		  <span class="text-muted">Service</span>
		  <span>${formatRupiah(data.service)}</span>
		</div>
	
		<div class="flex justify-between pt-4">
		  <span class="font-bold">Total</span>
	
		  <span class="font-bold text-on-surface">
			${formatRupiah(data.total)}
		  </span>
		</div>
	
	  </div>
	`;
}
	
function initTablePage() {
  loadTables();
}

function formatNumber(num) {
  return Number(num || 0).toLocaleString("id-ID");
}

function formatCompact(num) {
  num = Number(num || 0);
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "K";
  return num;
}

function openTable(mejaId) {
  selectedTableId = mejaId;
  document.getElementById("billing-table-info").innerText =
    "Table " + mejaId;
  loadBilling(mejaId);
}

function updateStockPreview() {
  const qty = Number(document.getElementById("stockQty")?.value) || 0;
  const price = Number(document.getElementById("purchasePrice")?.value.replace(/\D/g,'')) || 0;
  const costEl = document.getElementById("totalCostPreview");
  if (costEl) {
    costEl.innerText = "Rp " + price.toLocaleString("id-ID");
  }
  const current = window.currentIngredientStock || 0;
  const stockEl = document.getElementById("newStockPreview");
  if (stockEl) {
    stockEl.innerText = (current + qty).toLocaleString("id-ID") + "g,ml,pcs";
  }
}

document.addEventListener("input", function(e) {
  if (e.target.id === "stockQty" || e.target.id === "purchasePrice") {
    updateStockPreview();
  }
});

function openAddTableModal() {
  const template = document.getElementById("addTableModalTemplate");
  if (document.getElementById("addTableModal")) return;
  const wrapper = document.createElement("div");
  wrapper.id = "addTableModal";
  wrapper.innerHTML = template.innerHTML;
  document.body.appendChild(wrapper);
}

function closeAddTableModal() {
  document.getElementById("addTableModal")?.remove();
}
	
async function saveNewTable() {
  const tableName =
    document
      .getElementById("newTableName")
      ?.value
      ?.trim();
  if (!tableName) {
    alert(
      "Table Name wajib diisi."
    );
    return;
  }

  if (!state.branchId) {
    alert(
      "Branch belum tersedia."
    );
    return;
  }

  try {
	
    // SUPABASE RPC
    const res =
      await addNewTableRPC(
        tableName,
        state.branchId
      );

    if (res) {
      closeAddTableModal();

      // CLEAR CACHE
      state.tableData = null;
      state.tableDataBranchId = null;

      // RELOAD TABLE
      await loadTables();
    }
  }

  catch (err) {
    alert(
      err?.message ||
      "Gagal menambahkan meja"
    );
  }
}


// ==================================
// INVENTORY
// ==================================	

async function loadInventoryPage(branchId) {

  if (
    state.inventoryData &&
    state.inventoryBranchId === branchId
  ) {

    renderInventoryPage(
      state.inventoryData
    );
    return;
  }

  try {
		const sessionId =
      localStorage.getItem("pos_session_id");
    const {
      data,
      error
    } = await supabaseClient.rpc(
      "get_inventory_page",
      {
        p_branch_id: branchId,
				p_session_id: sessionId
      }
    );

    if (error) {
      throw error;
    }
		
    // CACHE
    state.inventoryData =
      data || {
        summary: {},
        ingredients: [],
        suppliers: [],
        recipes: []
      };

    state.inventoryBranchId =
      branchId;

    // RENDER
    renderInventoryPage(
      state.inventoryData
    );
  } catch (err) {
    showToast(
      err?.message ||
      "Gagal load inventory",
      "error"
    );
  }
}

function renderInventoryPage(data) {
	if (!data) return;
	
	// SUMMARY
	const summary = data.summary || {};
	const totalMaterials =
		document.getElementById(
		"totalMaterialsValue"
	);
	if(totalMaterials){
		totalMaterials.innerHTML =
		`${summary.totalSKU || 0}
		<span class="text-sm text-muted ">
		SKU
		</span>`;
	
	}
	const estimatedValue =
		document.getElementById(
		"estimatedValueValue"
	);
	if(estimatedValue){
		estimatedValue.innerHTML =
		`${((summary.totalValue || 0) / 1000000).toFixed(1)}
			<span class="text-sm text-muted ">
				IDR
			</span>`;
	}
	const criticalStock =
		document.getElementById(
			"criticalStockValue"
		);
	if(criticalStock){
		criticalStock.innerHTML =
		`${summary.criticalStock || 0}
			<span class="text-sm text-error/60">
				Items
			</span>`;
	}
	const dailyDeduction =
		document.getElementById(
			"dailyDeductionValue"
		);
	if(dailyDeduction){
		dailyDeduction.innerHTML =
		`${summary.dailyDeduction || 0}
			<span class="text-sm text-muted ">
				Unit
			</span>`;
	}
	  // INGREDIENTS
	  state.ingredients =
	    data.ingredients || [];
	
	  const tbody =
	    document.getElementById(
	      "ingredientsTable"
	    );
	
	  if (tbody) {
	    if (
	      state.ingredients.length === 0
	    ) {
	      tbody.innerHTML = `
	        <tr>
	          <td colspan="8"
	              class="text-center py-6 text-muted">
	            No data
	          </td>
	        </tr>
	      `;
	
	    } else {
	      renderIngredients(
	        state.ingredients
	      );
	    }
	  }
	
	// PURCHASES
	purchaseData =
		data.purchases || [];
	purchaseFilteredData =
		[...purchaseData];
	purchaseCurrentPage = 1;
	applyPurchaseFilters();
	// SUPPLIERS
	allSupplierData = data.suppliers || [];
	state.supplierData = data.suppliers || [];
	state.supplierBranchId = data.branchId || state.branchId;
	renderSuppliers();
	// RECIPES
	state.recipes =
	  data.recipes || [];
	allRecipesData =
	  data.recipes || [];
	renderRecipes();
}

async function loadIngredients(branchId) {
  if (!branchId) {
    return;
  }
  const cacheKey =
    `ingredients_${branchId}`;

  // CACHE
  if (
    state.ingredients &&
    state.ingredientsCacheKey === cacheKey
  ) {
    renderIngredients(
      state.ingredients
    );
    return;
  }

  try {
    const sessionId =
      localStorage.getItem("pos_session_id");
    const {
      data,
      error
    } = await supabaseClient.rpc(
      "get_ingredients",
      {
        p_branch_id: branchId,
				p_session_id: sessionId
      }
    );
    if (error) {
      throw error;
    }

    // CACHE
    state.ingredients = data || [];
    state.ingredientsCacheKey = cacheKey;
    // EMPTY CHECK
    const tbody =
      document.getElementById(
        "ingredientsTable"
      );

    if (!tbody) {
      return;
    }
    if (
      !state.ingredients.length
    ) {
      tbody.innerHTML = `
        <tr>
          <td colspan="8"
              class="text-center py-6 text-muted">
            No data
          </td>
        </tr>
      `;
      return;
    }
    // RENDER
    renderIngredients(
      state.ingredients
    );
  }
  catch (err) {
    showToast(
      err?.message ||
      "Gagal memuat ingredients.",
      "error"
    );
  }
}

function initPurchaseFilters() {
  const search =
    document.getElementById(
      "purchaseSearch"
    );

  const status =
    document.getElementById(
      "purchaseStatusFilter"
    );

  search?.addEventListener(
    "input",
    () => {
      applyPurchaseFilters();
    }
  );

  status?.addEventListener(
    "change",
    () => {
      applyPurchaseFilters();
    }
  );
}
async function loadIngredientPurchases(branchId, start = null, end = null) {
  const tbody = document.getElementById("ingredientPurchaseTable");
	if (!branchId) {
			purchaseData = [];
			purchaseFilteredData = [];
			purchaseCurrentPage = 1;
			renderPurchasePage();
		return;
  }
	
	initPurchaseFilters();
  if (!tbody) return;
  tbody.innerHTML = `
    <tr>
      <td colspan="9" class="text-center text-muted py-6">
        Loading...
      </td>
    </tr>
  `;

  try {
		const sessionId =
      localStorage.getItem("pos_session_id");
    const {
      data,
      error
    } = await supabaseClient.rpc(
      "get_ingredient_purchases",
      {
				p_session_id: sessionId,
        p_branch_id: branchId,
        p_start: start,
        p_end: end
      }
    );

    if (error) {
      throw error;
    }
    purchaseData = Array.isArray(data)
      ? data
      : [];
    purchaseCurrentPage = 1;
    applyPurchaseFilters();

  } catch (error) {
    tbody.innerHTML = `
      <tr>
        <td colspan="9" class="text-center text-error py-6">
          Failed to load purchase data
        </td>
      </tr>
    `;
  }
}

function applyPurchaseFilters() {
  const searchInput =
    document.getElementById("purchaseSearch");

  const statusSelect =
    document.getElementById("purchaseStatusFilter");

  const search = (
    searchInput?.value || ""
  ).trim().toLowerCase();

	const status =
	  String(statusSelect?.value || "ALL")
		.trim()
		.toUpperCase();
	
  purchaseFilteredData = purchaseData.filter(purchase => {
    const matchesSearch =
      !search ||
      String(purchase.ID || "")
        .toLowerCase()
        .includes(search) ||

      String(purchase.Name_Supplier || "")
        .toLowerCase()
        .includes(search) ||

      String(purchase.Ingredient || "")
        .toLowerCase()
        .includes(search);

    const purchaseStatus =
      String(purchase.Status || "")
        .toUpperCase();
    const matchesStatus =
      status === "ALL" ||
      purchaseStatus === status;
    return matchesSearch && matchesStatus;
  });
  purchaseCurrentPage = 1;
  renderPurchasePage();
}
	
function renderIngredientPurchases(purchases) {
  const tbody = document.getElementById("ingredientPurchaseTable");
  if (!tbody) return;
  if (!purchases.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="9" class="text-center text-muted py-6">
          No purchase data
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = purchases.map(purchase => {
    const status = String(
      purchase.Status || ""
    ).toUpperCase();

    return `
      <tr class="hover:bg-outline-variant transition">
        <td class="px-8 py-4 text-sm font-semibold">
          ${escapeHtml(purchase.ID || "-")}
        </td>

        <td class="px-8 py-4 text-sm">
          ${escapeHtml(purchase.Date || "-")}
        </td>

        <td class="px-8 py-4 text-sm">
          ${escapeHtml(purchase.Name_Supplier || "-")}
        </td>

        <td class="px-8 py-4 text-sm">
          ${escapeHtml(purchase.Ingredient || "-")}
        </td>

        <td class="px-8 py-4 text-sm">
          ${Number(purchase.Qty || 0).toLocaleString("id-ID")}
        </td>

        <td class="px-8 py-4 text-sm font-semibold">
          Rp ${Number(purchase.Total_Price || 0).toLocaleString("id-ID")}
        </td>

        <td class="px-8 py-4 text-sm">
          ${escapeHtml(purchase.Payment_Method || "-")}
        </td>

        <td class="px-8 py-4 text-sm">
          ${renderPurchaseStatus(status)}
        </td>

        <td class="px-8 py-4 text-right">
          <button onclick="openPurchaseAction('${escapeHtml(purchase.ID)}')"
            class="p-2 rounded-md text-on-surface-variant hover:text-on-surface transition">
            <span class="material-symbols-outlined text-lg">
              more_vert
            </span>
          </button>
        </td>
      </tr>
    `;
  }).join("");
}
	
function renderPurchasePage() {
  const totalItems =
    purchaseFilteredData.length;

  const totalPages =
    Math.max(
      1,
      Math.ceil(totalItems / purchasePageSize)
    );

  if (purchaseCurrentPage > totalPages) {
    purchaseCurrentPage = totalPages;
  }
  const start =
    (purchaseCurrentPage - 1)
    * purchasePageSize;

  const end =
    start + purchasePageSize;

  const pageData =
    purchaseFilteredData.slice(
      start,
      end
    );

  renderIngredientPurchases(pageData);
  renderPurchasePagination(
    totalPages
  );

  const showing =
    document.getElementById(
      "purchaseShowing"
    );

  if (showing) {
    showing.textContent =
      pageData.length;
  }
}

function renderPurchasePagination(totalPages) {
  const container =
    document.getElementById(
      "ingredientPurchasePagination"
    );

  if (!container) return;
  if (totalPages <= 1) {
    container.innerHTML = "";
    return;
  }

  let html = `
    <div class="flex items-center gap-1">
  `;

  // Previous
  html += `
    <button
      onclick="changePurchasePage(${purchaseCurrentPage - 1})"
      ${purchaseCurrentPage === 1 ? "disabled" : ""}
      class="px-3 py-1 text-xs disabled:opacity-40">
      ‹
    </button>
  `;

  for (
    let i = 1;
    i <= totalPages;
    i++
  ) {
    html += `
      <button
        onclick="changePurchasePage(${i})"
        class="px-3 py-1 text-xs ${
          i === purchaseCurrentPage
            ? "bg-surface-container-high font-bold"
            : ""
        }">
        ${i}
      </button>
    `;
  }

  // Next
  html += `
    <button
      onclick="changePurchasePage(${purchaseCurrentPage + 1})"
      ${purchaseCurrentPage === totalPages ? "disabled" : ""}
      class="px-3 py-1 rounded-md border border-outline-variant text-xs disabled:opacity-40">
      ›
    </button>
  `;
  html += `</div>`;
  container.innerHTML = html;
}

function changePurchasePage(page) {
  const totalPages =
    Math.max(
      1,
      Math.ceil(
        purchaseFilteredData.length
        / purchasePageSize
      )
    );

  if (
    page < 1 ||
    page > totalPages
  ) {
    return;
  }
  purchaseCurrentPage = page;
  renderPurchasePage();
}
	
function renderPurchaseStatus(status) {
  let className = "bg-surface-container-high text-muted";
  if (status === "PAID") {
    className = "bg-success-container/20 text-success";
  }
  if (status === "PENDING") {
    className = "bg-warning-container/20 text-warning";
  }
  if (status === "CANCELLED") {
    className = "bg-error-container/20 text-error";
  }
  return `
    <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${className}">
      ${status || "UNKNOWN"}
    </span>
  `;
}

window.openPurchaseAction = function (purchaseId) {
  const purchase = purchaseData.find(
    item => String(item.ID) === String(purchaseId)
  );

  if (!purchase) {
    return;
  }
	
	window.currentPurchaseAction = purchase;
  const template =
    document.getElementById(
      "ingredientPurchaseActionModal"
    );

  if (!template) {
    return;
  }
  // Hapus popup lama
  document
    .querySelectorAll(".purchase-action-modal")
    .forEach(el => el.remove());

  // Clone template
  const clone =
    template.content.cloneNode(true);
  const wrapper =
    document.createElement("div");
  wrapper.className =
    "purchase-action-modal";
  wrapper.appendChild(clone);
  document.body.appendChild(wrapper);
  window.purchaseActionModalEl =
    wrapper;
  document.body.style.overflow =
    "hidden";

  // ISI DATA
  const setText = (id, value) => {
    const el =
      wrapper.querySelector("#" + id);
    if (el) {
      el.textContent =
        value ?? "-";
    }
  };

  setText(
    "purchaseModalIngredient",
    purchase.Ingredient
  );
  setText(
    "purchaseModalId",
    purchase.ID
  );
  setText(
    "purchaseModalDate",
    purchase.Date
  );
  setText(
    "purchaseModalSupplier",
    purchase.Name_Supplier
  );
  setText(
    "purchaseModalQty",
    purchase.Qty
  );
  setText(
    "purchaseModalTotal",
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0
    }).format(
      Number(purchase.Total_Price || 0)
    )
  );
  setText(
    "purchaseModalPayment",
    purchase.Payment_Method
  );
  setText(
    "purchaseModalStatus",
    purchase.Status
  );
};

window.closePurchaseAction = function () {
  if (window.purchaseActionModalEl) {
    window.purchaseActionModalEl.remove();
    window.purchaseActionModalEl =
      null;
  }
  document.body.style.overflow = "";
};

window.viewPurchaseNote = function () {
  const purchase = window.currentPurchaseAction;
  if (!purchase) {
    return;
  }
  const template =
    document.getElementById("purchaseNoteModal");
  if (!template) {
    return;
  }
  document
    .querySelectorAll(".purchase-note-modal")
    .forEach(el => el.remove());
  const clone =
    template.content.cloneNode(true);
  const wrapper =
    document.createElement("div");
  wrapper.className =
    "purchase-note-modal";
  wrapper.appendChild(clone);
  document.body.appendChild(wrapper);
  window.purchaseNoteModalEl = wrapper;
  document.body.style.overflow = "hidden";
  const note =
    wrapper.querySelector("#purchaseNoteText");
  if (note) {
    note.textContent =
      purchase.Note || "Tidak ada catatan.";
  }
};

window.closePurchaseNote = function () {
  if (window.purchaseNoteModalEl) {
    window.purchaseNoteModalEl.remove();
    window.purchaseNoteModalEl = null;
  }
  document.body.style.overflow = "";
};


window.openPurchaseStatusAction = function () {
  const purchase =
    window.currentPurchaseAction;
  if (!purchase) {
    return;
  }

  const template =
    document.getElementById(
      "purchaseStatusModal"
    );

  if (!template) {
    return;
  }

  document
    .querySelectorAll(".purchase-status-modal")
    .forEach(el => el.remove());
  const clone =
    template.content.cloneNode(true);
  const wrapper =
    document.createElement("div");
  wrapper.className =
    "purchase-status-modal";
  wrapper.appendChild(clone);
  document.body.appendChild(wrapper);
  window.purchaseStatusModalEl =
    wrapper;
  window.selectedPurchaseStatus =
    purchase.Status || "PAID";
  document.body.style.overflow =
    "hidden";

  // Current status
  const current =
    wrapper.querySelector(
      "#purchaseCurrentStatus"
    );

  if (current) {
    current.textContent =
      purchase.Status || "-";
  }
  // Tandai status aktif
  selectPurchaseStatus(
    purchase.Status || "PAID"
  );
};

window.selectPurchaseStatus = function (status) {
  window.selectedPurchaseStatus =
    status;
  const modal =
    window.purchaseStatusModalEl;

  if (!modal) return;
  modal
    .querySelectorAll(
      ".purchase-status-option"
    )
    .forEach(button => {
      const isSelected =
        button.dataset.status === status;
      const check =
        button.querySelector(
          ".purchase-status-check"
        );

      if (isSelected) {
        button.classList.add(
          "bg-background-high"
        );

        if (check) {
          check.classList.remove(
            "opacity-0"
          );
        }
      } else {
        button.classList.remove(
          "bg-background-high"
        );

        if (check) {
          check.classList.add(
            "opacity-0"
          );
        }
      }
    });
};

window.closePurchaseStatus = function () {
  if (window.purchaseStatusModalEl) {
    window.purchaseStatusModalEl.remove();
    window.purchaseStatusModalEl =
      null;
  }
  document.body.style.overflow = "";
};

window.confirmPurchaseStatus = async function () {
  const purchase =
    window.currentPurchaseAction;
  const status =
    window.selectedPurchaseStatus;

  if (!purchase) {
    showToast(
      "Purchase tidak ditemukan",
      "error"
    );
    return;
  }

  if (!status) {
    showToast(
      "Pilih status terlebih dahulu",
      "error"
    );
    return;
  }

  try {
		const sessionId =
      localStorage.getItem("pos_session_id");
    const {
      data,
      error
    } = await supabaseClient.rpc(
      "update_ingredient_purchase_status",
      {
        p_purchase_id: purchase.ID,
				p_session_id: sessionId,
        p_status: status,
        p_updated_by: "SYSTEM"
				
      }
    );

    if (error) {
      throw error;
    }

    if (
      data &&
      data.success === false
    ) {
      throw new Error(
        "Gagal mengubah status purchase"
      );
    }
	purchase.Status = status;
	closePurchaseStatus();
	closePurchaseAction();
	renderPurchasePage();
	state.supplierData = null;
	state.supplierBranchId = null;
	state.ingredients = null;
	state.ingredientsCacheKey = null;
	state.cashFlowData = null;
  state.cashFlowFilter = null;
	await loadSuppliers();
    showToast(
      "Status purchase berhasil diubah",
      "success"
    );
  }
  catch (err) {
    showToast(
      err?.message ||
      "Gagal mengubah status purchase",
      "error"
    );
  }
};
	
function openInventoryPage() {
  if (!state.branchId) {
    return;
  }
  loadInventoryPage(state.branchId);
}

async function loadSuppliers() {
  if (
    state.supplierData &&
    state.supplierBranchId === state.branchId
  ) {
    allSupplierData =
      state.supplierData;
    renderSuppliers();
    return;
  }

  try {
		const sessionId =
      localStorage.getItem("pos_session_id");
    const branchId =
      state.branchId;

    if (!branchId) {
      return;
    }
    // SUPABASE RPC
    const { data, error } =
      await supabaseClient.rpc(
        "get_suppliers",
        {
          p_branch_id: branchId,
					p_session_id: sessionId
        }
      );

    if (error) {
      throw error;
    }

    // CACHE
    allSupplierData =
      data || [];
    state.supplierData =
      data || [];
    state.supplierBranchId =
      branchId;

    // RENDER
    renderSuppliers();
  } catch (err) {
    showToast(
      err?.message ||
      "Gagal memuat supplier.",
      "error"
    );
  }
}

function renderSuppliers() {
  const tbody =
    document.getElementById(
      "suppliersTable"
    );

  if (!tbody) return;
  if (
    !allSupplierData ||
    allSupplierData.length === 0
  ) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8"
          class="text-center py-6 text-muted">
          No suppliers
        </td>
      </tr>
    `;
    renderSupplierPagination();
    return;
  }

  const start =
    (supplierCurrentPage - 1) *
    supplierItemsPerPage;
  const end =
    start + supplierItemsPerPage;
  const paginatedData =
    allSupplierData.slice(
      start,
      end
    );

  tbody.innerHTML =
    paginatedData.map(
      (item, index) => {
        const initials =
          (item.name || "")
            .split(" ")
            .map(w => w[0])
            .join("")
            .substring(0, 2)
            .toUpperCase();

        const isActive =
          item.status === "Active";

        // FINANCIAL DATA
        const totalSpend =
          Number(
            item.total_spend
          ) || 0;

        const totalDebt =
          Number(
            item.total_debt
          ) || 0;

        return `
          <tr class="${
            index % 2 === 0
              ? "bg-background/10"
              : ""
          } hover:bg-outline-variant transition-colors group">

            <!-- SUPPLIER NAME -->
            <td class="px-8 py-5">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-md bg-outline-variant flex items-center justify-center text-on-surface font-bold">
                  ${initials}
                </div>

                <span class="font-bold text-sm">
                  ${item.name || "-"}
                </span>
              </div>
            </td>

            <!-- CATEGORY -->
            <td class="px-8 py-5 text-sm text-muted">
              ${item.category || "-"}
            </td>

            <!-- CONTACT -->
            <td class="px-8 py-5 text-sm font-medium">
              ${item.contact || "-"}
            </td>

            <!-- PHONE -->
            <td class="px-8 py-5 text-sm text-muted">
              ${item.phone || "-"}
            </td>

            <!-- TOTAL SPEND -->
            <td class="px-8 py-5 text-sm font-semibold">
              Rp ${totalSpend.toLocaleString("id-ID")}
            </td>

            <!-- HUTANG -->
            <td class="px-8 py-5 text-sm font-semibold ${
              totalDebt > 0
                ? "text-error"
                : "text-muted"
            }">
              Rp ${totalDebt.toLocaleString("id-ID")}
            </td>

            <!-- STATUS -->
            <td class="px-8 py-5">
              ${
                isActive
                ? `
                  <span class="px-3 py-1 bg-outline-variant/20 text-on-surface text-[10px] border border-outline-variant font-headline font-semibold rounded-md uppercase" >
                    Active
                  </span>
                `
                : `
                  <span class="px-3 py-1 bg-error-container/20 text-error text-[10px] font-headline font-semibold rounded-md uppercase" >
                    Inactive
                  </span>
                `
              }
            </td>

            <!-- ACTIONS -->
            <td class="px-8 py-5 text-right">
              <div class="flex items-center justify-end gap-1" >
                <button onclick="openEditSupplierModal('${item.id}')"
                  class="p-2 hover:text-on-surface rounded-md text-on-surface-variant" >

                  <span class="material-symbols-outlined text-sm">
                    edit
                  </span>
                </button>
              </div>
            </td>
          </tr>
        `;
      }
    ).join("");
  renderSupplierPagination();
}
	
let currentSupplierData = null;
function openEditSupplierModal(supplierId) {
  const supplier =
    allSupplierData.find(
      x => String(x.id) === String(supplierId)
    );

  if (!supplier) return;
  currentSupplierData = supplier;
  document
    .getElementById("editSupplierModalWrapper")
    ?.remove();
  const tpl = document.getElementById("editsupplierModal");
  if (!tpl) return;
  const wrapper = document.createElement("div");
  wrapper.id = "editSupplierModalWrapper";
  wrapper.appendChild( tpl.content.cloneNode(true) );
  document.body.appendChild(wrapper);
	
  setTimeout(() => {
    document.getElementById(
      "supplierNameInput"
    ).value = supplier.name || "";

    document.getElementById(
      "supplierCategoryInput"
    ).value = supplier.category || "";

    document.getElementById(
      "supplierContactInput"
    ).value = supplier.contact || "";

    document.getElementById(
      "supplierPhoneInput"
    ).value = supplier.phone || "";

    document.getElementById(
      "supplierAddressInput"
    ).value = supplier.notes || "";

    document.getElementById(
      "supplierStatusInput"
    ).checked =
      supplier.status === "Active";
  }, 50);
}

async function saveeditSupplier() {
  if (!currentSupplierData) return;

  const supplierName =
    document.getElementById(
      "supplierNameInput"
    );

  const category =
    document.getElementById(
      "supplierCategoryInput"
    );

  const contact =
    document.getElementById(
      "supplierContactInput"
    );

  const phone =
    document.getElementById(
      "supplierPhoneInput"
    );

  const notes =
    document.getElementById(
      "supplierAddressInput"
    );

  const status =
    document.getElementById(
      "supplierStatusInput"
    );

  if (
    !supplierName ||
    !category ||
    !contact ||
    !phone ||
    !notes ||
    !status
  ) {
    return;
  }

  const payload = {
    supplierId: currentSupplierData.id,
    branchId: currentSupplierData.branchId,
    supplierName: supplierName.value,
    category: category.value,
    contactPerson: contact.value,
    phone: phone.value,
    notes: notes.value,
    status: status.checked
  };

  try {
		const sessionId =
      localStorage.getItem("pos_session_id");
    // UPDATE SUPPLIER
    const {
      data: updateData,
      error: updateError
    } =
      await supabaseClient.rpc(
        "update_supplier",
        {
          p_supplier_id: payload.supplierId,
          p_branch_id: payload.branchId,
          p_name: payload.supplierName,
          p_category: payload.category,
          p_contact: payload.contactPerson,
          p_phone: payload.phone,
          p_status: payload.status
              ? "Active"
              : "INACTIVE",
          p_notes: payload.notes,
					p_session_id: sessionId
        }
      );

    if (updateError) {
      throw updateError;
    }

    // LOAD ULANG SUPPLIER
    const {
      data: suppliers,
      error: suppliersError
    } =
      await supabaseClient.rpc(
        "get_suppliers",
        {
          p_branch_id: payload.branchId,
					p_session_id: sessionId
        }
      );

    if (suppliersError) {
      throw suppliersError;
    }
	
    // UPDATE CACHE
    allSupplierData = suppliers || [];
    state.supplierData = suppliers || [];
    state.supplierBranchId = payload.branchId;

    // RENDER
    renderSuppliers();
    closeEditSupplierModal();
    showToast(
      "Supplier updated",
      "success"
    );
  } catch (err) {
    showToast(
      err?.message ||
      "Failed update supplier",
      "error"
    );
  }
}
	
function closeEditSupplierModal() {
  document
    .getElementById("editSupplierModalWrapper")
    ?.remove();
  currentSupplierData = null;
}

function renderSupplierPagination() {
  const container = document.getElementById("supplierPagination");
  if (!container) return;
  const totalPages = Math.ceil(allSupplierData.length / supplierItemsPerPage);
  let html = `
    <div class="flex items-center gap-2">
      <button onclick="changeSupplierPage(${supplierCurrentPage - 1})"
        ${supplierCurrentPage === 1 ? "disabled" : ""}
        class=" p-2 rounded-md
          ${supplierCurrentPage === 1
            ? "text-on-surface-variant cursor-not-allowed"
            : "text-on-surface-variant hover:text-on-surface"} " >
        <span class="material-symbols-outlined text-lg">
          chevron_left
        </span>
      </button>
  `;

  for (let i = 1; i <= totalPages; i++) {
    html += `
      <button onclick="changeSupplierPage(${i})"
        class=" w-8 h-8 rounded-md text-xs font-bold transition-colors
          ${supplierCurrentPage === i
            ? "text-on-surface"
            : "text-on-surface-variant hover:bg-outline-variant"}">
        ${i}
      </button>
    `;
  }

  html += `
      <button onclick="changeSupplierPage(${supplierCurrentPage + 1})"
        ${supplierCurrentPage === totalPages ? "disabled" : ""}
        class="p-2 rounded-md
          ${supplierCurrentPage === totalPages
            ? "text-on-surface-variant cursor-not-allowed"
            : "text-muted hover:text-muted"}">
        <span class="material-symbols-outlined text-lg">
          chevron_right
        </span>
      </button>
    </div>
  `;
  container.innerHTML = html;
}

function changeSupplierPage(page) {
  const totalPages = Math.ceil(
    allSupplierData.length / supplierItemsPerPage
  );
  if (page < 1 || page > totalPages) return;
  supplierCurrentPage = page;
  renderSuppliers();
}

async function loadRecipes() {
  const branchId = state.branchId;
  if (!branchId) {
    return;
  }

  // CACHE
  if (
    state.recipeData &&
    state.recipeDataBranchId === branchId
  ) {
    state.recipes = state.recipeData;
    allRecipesData = state.recipeData;
    renderRecipes();
    return;
  }

  try {
    const sessionId =
      localStorage.getItem("pos_session_id");
    // SUPABASE RPC
	const {
	  data,
	  error
	} = await supabaseClient.rpc(
	  "get_recipes",
	  {
	    p_branch_id: branchId,
      p_session_id: sessionId
	  }
	);

    if (error) {
      throw error;
    }
    // CACHE
    state.recipes = data || [];
    allRecipesData = data || [];
    state.recipeData = data || [];
    state.recipeDataBranchId = branchId;
    // RENDER
    const tbody =
      document.getElementById(
        "recipesTable"
      );

    if (!tbody) {
      return;
    }
    renderRecipes();
  }
  catch (err) {
    showToast(
      err?.message ||
      "Gagal memuat recipes.",
      "error"
    );
  }
}

function renderRecipes() {
  const tbody = document.getElementById("recipesTable");
  if (!tbody) return;

  if (!allRecipesData || allRecipesData.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" class="text-center py-6 text-on-surface-variant">
          No recipes
        </td>
      </tr>
    `;
    return;
  }

  // PAGINATION
  const start = (recipeCurrentPage - 1) * recipeItemsPerPage;
  const end = start + recipeItemsPerPage;

 	const filteredData = allRecipesData.filter(item =>
		!state.branchId || item.branchId === state.branchId
	);
  const paginatedData = filteredData.slice(start, end);
  tbody.innerHTML = paginatedData.map((item, index) => {
    return `
    <tr class="
      ${index % 2 === 0 ? 'bg-background/10' : ''}
      hover:bg-outline-variant transition-colors ">

      <td class="px-6 py-4 font-bold">
        ${item.productName || item.Product_Name || item.Nama_Produk || item.name || "-"}
      </td>

      <td class="px-6 py-4 text-sm text-on-surface-variant">
        ${item.ingredientsLabel || item.ingredients?.map(i => `${i.name} (${i.qty})`).join(", ")}
      </td>

      <td class="px-6 py-4">
        Rp ${(item.cost || 0).toLocaleString("id-ID")}
      </td>

      <td class="px-6 py-4">
        Rp ${(item.selling || 0).toLocaleString("id-ID")}
      </td>

      <td class="px-6 py-4">
        Rp ${(item.net || 0).toLocaleString("id-ID")}
      </td>

      <td class="text-center">
        <div class="flex flex-col items-center gap-1">
          <span class="text-xs font-bold">
            ${item.costPercent}%
          </span>

          <div class="w-16 h-1 bg-outline-variant rounded-full overflow-hidden">
            <div class="h-full 
              ${item.costPercent > 60 ? 'bg-red-500' :
                item.costPercent >= 40 ? 'bg-yellow-400' :
                'bg-emerald-500'}"
              style="width:${item.costPercent}%">
            </div>
          </div>
        </div>
      </td>

      <td class="px-6 py-4 font-bold text-green-400">
        Rp ${item.profit.toLocaleString("id-ID")}
      </td>

      <td class="px-6 py-4 text-right text-[10px] text-on-surface-variant">
        <button onclick="openRecipeModal('${item.id}')" class="p-2 hover:text-on-surface">
          <span class="material-symbols-outlined text-sm">edit</span>
        </button>
      </td>
    </tr>
    `;
  }).join("");
  renderRecipePagination();
}

let currentRecipeData = null;
async function openRecipeModal(recipeId) {
  const item =
    allRecipesData.find(
      x =>
        String(x.id) ===
        String(recipeId)
    );

  if (!item) return;
  currentRecipeData = item;
  document
    .getElementById(
      "recipeModalWrapper"
    )
    ?.remove();

  const tpl =
    document.getElementById(
      "recipemasterledgerModal"
    );
  const wrapper = document.createElement("div");
  wrapper.id = "recipeModalWrapper";
  wrapper.appendChild( tpl.content.cloneNode(true) );
  document.body.appendChild( wrapper );

  // FILL DATA
  document.getElementById(
    "recipeTitle"
  ).innerText =
    item.name;

  document.getElementById(
    "recipeNameInput"
  ).value =
    item.name;

  document.getElementById(
    "recipeSellingPrice"
  ).value =
    item.selling;

  document.getElementById(
    "recipeNetPrice"
  ).value =
    item.net;

  const margin =
    item.net > 0
      ? (
          (item.net - item.cost) /
          item.net
        ) * 100
      : 0;

  document.getElementById(
    "recipeMarginPercent"
  ).innerHTML =
    `${margin.toFixed(1)}
    <span class="text-xl ml-0.5">
      %
    </span>`;

  document.getElementById(
    "recipeProfitValue"
  ).innerText =
    "Rp " +
    (
      item.net - item.cost
    ).toLocaleString("id-ID");

  // PRICE HISTORY

  try {
		const sessionId =
      localStorage.getItem("pos_session_id");
    const {
      data,
      error
    } = await supabaseClient.rpc(
      "get_recipe_price_history",
      {
        p_recipe_id: item.id,
				p_session_id: sessionId
      }
    );

    if (error) {
      throw error;
    }

    renderRecipePriceHistory(
      data || []
    );
  }
  catch (err) {
    renderRecipePriceHistory(
      []
    );
  }
}
	
async function saveRecipeMaster() {

  if (!currentRecipeData) return;
  // GET IMAGE PRODUK
  const file =
    document.getElementById(
      "recipeImageInput"
    )?.files?.[0];

  let imageBase64 = null;
  if (file) {
    const compressed =
      await compressImage(file);
    imageBase64 =
      await fileToBase64(
        compressed
      );
  }

  // PAYLOAD
  const payload = {
    recipeId:
      currentRecipeData.id,
    productId:
      currentRecipeData.productId,
    branchId:
      currentRecipeData.branchId,
    productName:
      document.getElementById(
        "recipeNameInput"
      ).value,

    sellingPrice:
      Number(
        document
          .getElementById(
            "recipeSellingPrice"
          )
          .value
          .replace(
            /[^0-9]/g,
            ""
          )
      ),

    netPrice:
      Number(
        document
          .getElementById(
            "recipeNetPrice"
          )
          .value
          .replace(
            /[^0-9]/g,
            ""
          )
      ),

    updatedBy:
      state.user?.name ||
      state.user?.fullName ||
      state.user?.username ||
      "Unknown",
    imageBase64
  };

  try {
		const sessionId =
      localStorage.getItem("pos_session_id");
    // PRODUCT IMAGE
    let imageUrl =
      currentRecipeData.image || "";
    if (imageBase64) {
      imageUrl =
        await uploadProductImage(
          imageBase64,
          payload.productId
        );
    }

    // UPDATE RECIPE MASTER
    const {
      data,
      error
    } = await supabaseClient.rpc(
      "update_recipe_master",
      {
        p_recipe_id: payload.recipeId,
        p_product_id: payload.productId,
        p_branch_id: payload.branchId,
				p_session_id: sessionId,
        p_selling_price: payload.sellingPrice,
        p_net_price: payload.netPrice,
        p_product_name: payload.productName,
        p_updated_by: payload.updatedBy,
        p_image_url: imageUrl || ""
      }
    );

    if (error) {
      throw error;
    }
    closeRecipeMasterModal();
    state.recipeData = null;
    state.recipeDataBranchId = null;
    state.inventoryData = null;
    state.inventoryBranchId = null;
    state.products = null;
    state.productBranchId = null;
		
    // RELOAD
    await loadInventoryPage(
      state.branchId
    );
    await loadRecipes();
    showToast(
      "Product updated",
      "success"
    );
  }
  catch (err) {
    showToast(
      err?.message ||
      "Failed update product",
      "error"
    );
  }
}

async function uploadProductImage(
  base64,
  productId
) {

  if (!base64) {
    return null;
  }

  if (!productId) {
    throw new Error(
      "Product ID tidak ditemukan"
    );
  }

  const response =
    await fetch(
      "/api/handle-product-image-upload",
      {
        method: "POST",
        headers: {
          "Content-Type":
            "application/json"
        },

        body: JSON.stringify({
          base64,
          productId,
					tenantSlug: state.tenantSlug
        })
      }
    );

  const result = await response.json();
  if (
    !response.ok ||
    !result.success
  ) {
    throw new Error(
      result.error ||
      "Upload product image gagal"
    );
  }
  return result.url;
}

function renderRecipePriceHistory(data) {
  const tbody =
    document.getElementById(
      "recipePriceHistoryTable"
    );
  if (!tbody) return;
  if (!data.length) {

    tbody.innerHTML = `
      <tr>
        <td colspan="4"
            class="px-6 py-8 text-center text-muted">
          No price history
        </td>
      </tr>
    `;

    return;
  }
  tbody.innerHTML = data.map(row => `
    <tr class="hover:bg-outline-variant">
      <td class="px-6 py-4">
        ${row.date}
      </td>

      <td class="px-6 py-4">
        Rp ${row.oldNet.toLocaleString("id-ID")}
      </td>

      <td class="px-6 py-4 text-on-surface font-bold">
        Rp ${row.newNet.toLocaleString("id-ID")}
      </td>

      <td class="px-6 py-4">
        ${row.updatedBy}
      </td>
    </tr>
  `).join("");
}
	
function closeRecipeMasterModal() {
  document
    .getElementById("recipeModalWrapper")
    ?.remove();
}

async function exportRecipeReport() {
  const branchId = getBranchId();
  if (!branchId) {
    alert("Branch tidak ditemukan");
    return;
  }
  const pdfWindow =
    window.open("", "_blank");
	
  if (!pdfWindow) {
    alert("Popup diblokir browser.");
    return;
  }

  // LOADING
  pdfWindow.document.write(`
    <html>
      <body style="
        background:#0B0F14;
        color:white;
        font-family:Arial;
        display:flex;
        align-items:center;
        justify-content:center;
        height:100vh;
      ">
        Generating Recipe Report...
      </body>
    </html>
  `);

  try {
		const sessionId =
  		localStorage.getItem("pos_session_id");
    const response =
      await fetch(
        "/api/export-pdf",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json"
          },

          body: JSON.stringify({
            type: "recipe",
            branchId,
						sessionId,
						tenantSlug: state.tenantSlug
          })
        }
      );

    // CHECK RESPONSE
    if (!response.ok) {
      const errorText =
        await response.text();
      throw new Error(
        errorText ||
        "Gagal export Recipe Report"
      );
    }
			
    // GET HTML
    const html =
      await response.text();
    if (!html) {
      throw new Error(
        "Response export kosong"
      );
    }

    // SHOW REPORT
    pdfWindow.document.open();
    pdfWindow.document.write(
      html
    );
    pdfWindow.document.close();
  }
  catch (err) {
    pdfWindow.document.open();
    pdfWindow.document.write(`
      <html>
        <body style="font-family:Arial; padding:40px;">
          <h3>
            Export PDF Failed
          </h3>

          <pre>
						${String(
						  err?.message ||
						  "Export PDF gagal"
						)}
          </pre>
        </body>
      </html>
    `);

    pdfWindow.document.close();
    alert(
      err?.message ||
      "Export Recipe Report gagal"
    );
  }
}

function renderRecipePagination() {
  const totalPages = Math.ceil(allRecipesData.length / recipeItemsPerPage);
  const pagination = document.getElementById("recipePagination");
  if (!pagination) return;
  let buttons = "";
  // LEFT
  buttons += `
    <button onclick="changeRecipePage(${recipeCurrentPage - 1})"
      ${recipeCurrentPage === 1 ? "disabled" : ""}
      class="p-2 rounded-md transition-colors
        ${recipeCurrentPage === 1
          ? 'text-on-surface-variant cursor-not-allowed'
          : 'text-muted hover:text-muted'}">
      <span class="material-symbols-outlined text-lg">
        chevron_left
      </span>
    </button>
  `;

  // PAGE NUMBER
  for (let i = 1; i <= totalPages; i++) {
    buttons += `
      <button onclick="changeRecipePage(${i})"
        class="w-8 h-8 rounded-md text-xs font-bold transition-colors
          ${recipeCurrentPage === i
            ? 'text-white'
            : 'text-muted  hover:bg-outline-variant'}">
        ${i}
      </button>
    `;
  }

  // RIGHT
  buttons += `
    <button onclick="changeRecipePage(${recipeCurrentPage + 1})"
      ${recipeCurrentPage === totalPages ? "disabled" : ""}
      class="p-2 rounded-md transition-colors
        ${recipeCurrentPage === totalPages
          ? 'text-on-surface-variant cursor-not-allowed'
          : 'text-muted hover:text-muted'}">
      <span class="material-symbols-outlined text-lg">
        chevron_right
      </span>
    </button>
  `;
  pagination.innerHTML = buttons;
}

function changeRecipePage(page) {
  const totalPages = Math.ceil(allRecipesData.length / recipeItemsPerPage);
  if (page < 1 || page > totalPages) return;
  recipeCurrentPage = page;
  renderRecipes();
}
	
function getStatus(qty, min) {
  if (qty <= min) return "Critical";
  if (qty <= min * 1.5) return "Low";
  return "Optimal";
}

function renderIngredients(data) {
  allInventoryData = data;
  const tbody = document.getElementById("ingredientsTable");
  if (!tbody) return;
  const start = (inventoryCurrentPage - 1) * inventoryItemsPerPage;
  const end = start + inventoryItemsPerPage;
  const paginatedData = data.slice(start, end);
  tbody.innerHTML = paginatedData.map((item, index) => {
    const itemWithBranch = {
      ...item,
      branchId: item.branchId || "BR001"
    };
    //  ICON MAPPING
    const iconMap = {
      "Kopi": "coffee",
      "Susu": "water_drop",
      "Gula": "cookie",
      "Sirup": "liquor",
      "Coklat": "nutrition"
    };
    const icon = iconMap[item.name] || "inventory_2";
    //  COST
    const cost = Number(item.costPerUnit || 0);
    const qty = Number(item.qty || 0);
    const min = Number(item.min || 0);
    const value = qty * cost;
    //  FIX ERROR LO YANG HILANG INI
    const isCritical = item.qty <= item.min / 2;
    const isLow = item.qty <= item.min;

    return `
      <tr class="
        ${index % 2 === 0 ? 'bg-background/10' : ''}
        hover:bg-outline-variant transition-colors group">

        <!-- INGREDIENT -->
        <td class="px-8 py-5">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 flex items-center justify-center text-on-surface">
              <span class="material-symbols-outlined">${icon}</span>
            </div>
            <span class="font-bold text-sm">${item.name}</span>
          </div>
        </td>

        <!-- VALUE -->
        <td class="px-8 py-5 text-sm font-medium">
          ${formatIDR(value)}
        </td>

        <!-- QTY -->
        <td class="px-8 py-5 font-headline font-bold text-lg ${isLow ? 'text-error' : 'text-on-surface'}">
          ${item.qty}
        </td>

        <!-- UNIT -->
        <td class="px-8 py-5 text-sm text-muted">
          ${item.unit}
        </td>

        <!-- MIN -->
        <td class="px-8 py-5 text-sm text-muted">
          ${item.min}
        </td>

        <!-- COST -->
        <td class="px-8 py-5 text-sm font-medium">
          ${formatIDR(item.costPerUnit)}
        </td>

        <!-- STATUS -->
        <td class="px-8 py-5 text-center">
          ${
            isCritical
              ? `<span class="px-3 py-1 bg-red-500/20 text-red-400 text-[10px] font-black rounded-md uppercase">Critical</span>`
              : isLow
                ? `<span class="px-3 py-1 bg-yellow-500/20 text-yellow-400 text-[10px] font-black rounded-md uppercase">Low</span>`
                : `<span class="px-3 py-1 bg-green-500/20 text-green-400 text-[10px] font-black rounded-md uppercase">Optimal</span>`
          }
        </td>

        <!-- ACTION -->
        <td class="px-8 py-5 text-right flex items-center justify-end gap-1">
          <button onclick='openIngredientModal(${JSON.stringify(itemWithBranch)})' class="p-2 hover:text-on-surface text-on-surface-variant">
            <span class="material-symbols-outlined text-sm">more_vert</span>
          </button>
        </td>
      </tr>
    `;
  }).join("");
  renderInventoryPagination();
}

function openIngredientModal(item) {
  const tpl = document.getElementById("ingredientinventoryModal");
  const wrapper = document.createElement("div");
  wrapper.id = "ingredientModalWrapper";
  wrapper.appendChild(tpl.content.cloneNode(true));
  document.body.appendChild(wrapper);
  const modal = wrapper;
  modal.querySelector("#modalItemName").innerText = item.name;
  modal.querySelector("#modalStockText").innerText = item.qty + "";
  window.currentIngredientItem = item; 
}

function closeIngredientModal() {
  const modal = document.getElementById("ingredientModalWrapper");
  if (modal) modal.remove();
}

let currentAdjustItem = null;
let currentMode = "add";
function openAdjustFromIngredient() {
  closeIngredientModal();
  const item = window.currentIngredientItem;
  currentAdjustItem = item;
  const tpl = document.getElementById("inventoryModal");
  const wrapper = document.createElement("div");
  wrapper.id = "adjustStockWrapper";
  wrapper.appendChild(tpl.content.cloneNode(true));
  document.body.appendChild(wrapper);
  setTimeout(() => {
    document.getElementById("adjustItemName").innerText = item.name;
    document.getElementById("adjustCurrentStock").innerText = item.qty + "";
    setupAdjustLogic(item); 
  }, 0);
}
	
function updateProjected() {
  const input = document.getElementById("modalQty");
  if (!input || !currentAdjustItem) return;
  const qty = Number(input.value || 0);
  const projected = currentAdjustItem.qty + qty;
  const el = document.querySelector(".text-on-surface.text-xl");
  if (el) {
    el.innerHTML = `${projected}<span class="text-xs ml-1 text-muted">G</span>`;
  }
}

document.addEventListener("input", (e) => {
  if (e.target && e.target.id === "modalQty") {
    updateProjected();
  }
});

function setupAdjustLogic(item) {
  currentMode = "add";
  const qtyInput = document.getElementById("modalQty");
  const projected = document.getElementById("projectedStock");
  const btnAdd = document.getElementById("btnAdd");
  const btnSub = document.getElementById("btnSubtract");
  const btnSet = document.getElementById("btnSet");
	
  function setActive(activeBtn) {
    [btnAdd, btnSub, btnSet].forEach(btn => {
      btn.classList.remove("btn-active");
      btn.classList.add("btn-inactive");
    });
    activeBtn.classList.remove("btn-inactive");
    activeBtn.classList.add("btn-active");
  }

  function calculate() {
    const qty = Number(qtyInput.value || 0);
    let result = item.qty;
    if (currentMode === "add") result += qty;
    if (currentMode === "subtract") result -= qty;
    if (currentMode === "set") result = qty;
    projected.innerHTML = `${result} <span class="text-xs ml-1 text-muted"></span>`;
  }
  btnAdd.onclick = () => {
    currentMode = "add";
    setActive(btnAdd);
    calculate();
  };
  btnSub.onclick = () => {
    currentMode = "subtract";
    setActive(btnSub);
    calculate();
  };
  btnSet.onclick = () => {
    currentMode = "set";
    setActive(btnSet);
    calculate();
  };
  qtyInput.addEventListener("input", calculate);
  setActive(btnAdd);
  calculate();
}

function closeAdjustStockModal() {
  const modal = document.getElementById("adjustStockWrapper");
  if (modal) modal.remove();
}

let currentThresholdItem = null;
function openThresholdFromIngredient() {
  closeIngredientModal();
  currentThresholdItem = window.currentIngredientItem;
  const tpl = document.getElementById("inventorythersholdModal");
  const wrapper = document.createElement("div");

  wrapper.id = "inventoryThresholdWrapper";
  wrapper.appendChild(tpl.content.cloneNode(true));
  document.body.appendChild(wrapper);
  document.getElementById(
    "thresholdItemName"
  ).innerText =
    currentThresholdItem.name;
  document.getElementById(
    "thresholdValue"
  ).value =
    currentThresholdItem.min || 0;
}

async function submitAdjust() {
  const qty =
    Number(
      document.getElementById(
        "modalQty"
      ).value || 0
    );

  const reason =
    document.getElementById(
      "modalReason"
    ).value;

  if (!currentAdjustItem) {
    return;
  }

  const payload = {
    ingredientId: currentAdjustItem.id,
    type: currentMode,
    qty: qty,
    reason: reason,
    branchId: currentAdjustItem.branchId
  };

  try {
    const sessionId =
      localStorage.getItem("pos_session_id");
    const {
      data,
      error
    } = await supabaseClient.rpc(
      "adjust_ingredient_stock",
      {
        p_ingredient_id: payload.ingredientId,
        p_branch_id: payload.branchId,
        p_type: payload.type,
        p_qty: payload.qty,
				p_session_id: sessionId,
        p_reason: payload.reason
      }
    );

    if (error) {
      throw error;
    }
    state.inventoryData = null;
    state.inventoryBranchId = null;
    state.ingredients = null;
    state.ingredientsCacheKey = null;
    closeAdjustStockModal();
    await loadInventoryPage(state.branchId);
    await loadIngredients(state.branchId);
    showToast(
      "Stock updated"
    );
  }
  catch (err) {
    alert(
      err?.message ||
      "Gagal update stock"
    );
  }
}

function closeAdjustStockModal() {
  const modal = document.getElementById("adjustStockWrapper");
  if (modal) modal.remove();
}

function openThresholdFromIngredient() {
  closeIngredientModal();
  currentThresholdItem = window.currentIngredientItem;
  const tpl = document.getElementById("inventorythersholdModal");
  const wrapper = document.createElement("div");
  wrapper.id = "inventoryThresholdWrapper";
  wrapper.appendChild(tpl.content.cloneNode(true));
  document.body.appendChild(wrapper);
  document.getElementById(
    "thresholdItemName"
  ).innerText =
    currentThresholdItem.name;

  document.getElementById(
    "thresholdValue"
  ).value =
    currentThresholdItem.min || 0;

}

async function submitThreshold() {
  const min =
    Number(
      document.getElementById(
        "thresholdValue"
      ).value || 0
    );
  if (!currentThresholdItem) {
    return;
  }

  const payload = {
    ingredientId: currentThresholdItem.id,
    branchId: currentThresholdItem.branchId,
    min: min
  };

  try {
    const sessionId =
      localStorage.getItem("pos_session_id");
    const {
      data,
      error
    } = await supabaseClient.rpc(
      "update_ingredient_threshold",
      {
        p_ingredient_id: payload.ingredientId,
        p_branch_id: payload.branchId,
        p_min: payload.min,
				p_session_id: sessionId
      }
    );

    if (error) {
      throw error;
    }

    // CLEAR CACHE
    state.inventoryData = null;
    state.inventoryBranchId = null;
    state.ingredients = null;
    state.ingredientsCacheKey = null;
    closeThresholdModal();
    await loadInventoryPage(state.branchId);
    await loadIngredients(state.branchId);
    showToast(
      "Threshold updated"
    );
  }
		
  catch (err) {
    showToast(
      err?.message ||
      "Failed update threshold",
      "error"
    );
  }
}

function closeThresholdModal() {
  document
    .getElementById("inventoryThresholdWrapper")
    ?.remove();
}

let currentUsageItem = null;
async function openUsageLogFromIngredient() {
  const item = window.currentIngredientItem;
  if (
    !item ||
    !item.id ||
    !item.branchId
  ) {
    return;
  }

  const tpl =
    document.getElementById(
      "inventorydetailusageModal"
    );

  if (!tpl) {
    return;
  }
  document
    .getElementById(
      "inventoryUsageLogWrapper"
    )
    ?.remove();
  const wrapper = document.createElement("div");
  wrapper.id = "inventoryUsageLogWrapper";
  wrapper.appendChild(tpl.content.cloneNode(true));
  document.body.appendChild(wrapper);

  document.getElementById(
    "usageLogItemName"
  ).innerText =
    item.name || "-";

  try {
    const sessionId =
      localStorage.getItem("pos_session_id");
    const {
      data,
      error
    } = await supabaseClient.rpc(
      "get_ingredient_usage_log",
      {
        p_ingredient_id: item.id,
        p_branch_id: item.branchId,
				p_session_id: sessionId
      }
    );

    if (error) {
      throw error;
    }
    const usageData =
      data || [];

    // RENDER
    renderUsageLog(usageData);
    renderUsageSummary(
      usageData,
      Number(
        item.qty || 0
      )
    );
  }
  catch (err) {
    showToast(
      err?.message ||
      "Gagal memuat data."
    );
  }
}

function renderUsageSummary(data, currentStock) {
  const currentStockEl = document.getElementById("usageCurrentStock");
  const totalOutEl = document.getElementById("usageTotalOut");
  const avgDailyEl = document.getElementById("usageAvgDaily");
  if (
    !currentStockEl ||
    !totalOutEl ||
    !avgDailyEl
  ) {
    return;
  }
  if (!data.length) {
    currentStockEl.innerText = currentStock;
    totalOutEl.innerText = 0;
    avgDailyEl.innerText = 0;
    return;
  }
  const totalOut = data
    .filter(r => r.action === "OUT")
    .reduce(
      (sum, r) =>
        sum + (Number(r.qtyChange) || 0),
      0
    );
  const uniqueDays = new Set(
    data.map(r =>
      new Date(r.timestamp)
        .toDateString()
    )
  ).size || 1;
  const avgDaily = totalOut / uniqueDays;
  const remainingDays =
    avgDaily > 0
      ? currentStock / avgDaily
      : 0;
  currentStockEl.innerText = Number(currentStock || 0).toFixed(0);
  totalOutEl.innerText = totalOut.toFixed(0);
  avgDailyEl.innerText = remainingDays.toFixed(1);
}

function renderUsageLog(data) {
  const tbody =
    document.getElementById(
      "usageLogTableBody"
    );
  if (!tbody) return;
  tbody.innerHTML = "";
  if (!data.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5"
            class="py-8 text-center text-on-surface-variant">
          Tidak ada riwayat
        </td>
      </tr>
    `;
    return;
  }

  data
  .sort(
    (a, b) =>
      new Date(b.timestamp) -
      new Date(a.timestamp)
  )
  .slice(0, 10).forEach(log => {
    let badgeColor = "text-tertiary";
    let badgeName = "POS Deduction";
    if (
      log.action === "add"
    ) {
      badgeColor = "text-on-surface";
      badgeName = "Manual Add";
    }
    if (
      log.action === "subtract"
    ) {
      badgeColor = "text-error";
      badgeName = "Manual Subtract";
    }
    if (
      log.action === "set"
    ) {
      badgeColor = "text-secondary";
      badgeName = "Stock Set";
    }
    const qtyColor =
      log.qtyChange >= 0
        ? "text-on-surface"
        : "text-error";
    const qtyText =
      log.qtyChange >= 0
        ? `+${log.qtyChange}`
        : `${log.qtyChange}`;
    const parts = String(log.timestamp) .split(" ");
    const date = parts[0] || "-";
    const time = parts[1] || "-";

    tbody.innerHTML += `
      <tr class="hover:bg-outline-variant transition-colors">
        <td class="py-5 px-6">
          <div class="flex flex-col">
            <span class="text-on-surface font-medium">
              ${date}
            </span>

            <span class="text-xs text-on-surface-variant opacity-60">
              ${time}
            </span>
          </div>
        </td>
		
        <td class="py-5 px-6">
          <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-outline-variant text-xs font-semibold ${badgeColor}">
            <span class="w-1.5 h-1.5 rounded-md bg-current"></span>
            ${badgeName}
          </span>
        </td>

        <td class="py-5 px-6 text-on-surface-variant font-mono text-sm">
          ${log.notes || "-"}
        </td>

        <td class="py-5 px-6 text-right font-display font-bold ${qtyColor}">
          ${qtyText}g
        </td>

        <td class="py-5 px-6 text-right font-display font-medium text-on-surface">
          ${log.after}
        </td>
      </tr>
    `;
  });
}

function closeUsageLogModal() {
  document
    .getElementById(
      "inventoryUsageLogWrapper"
    )
    ?.remove();
}

function renderInventoryPagination() {
  const container = document.getElementById("inventoryPagination");
  if (!container) return;
  const totalPages = Math.ceil(allInventoryData.length / inventoryItemsPerPage);
  let html = `
    <div class="flex items-center gap-2">
      <button onclick="changeInventoryPage(${inventoryCurrentPage - 1})"
        ${inventoryCurrentPage === 1 ? "disabled" : ""}
        class="
          p-2 rounded-md
          ${inventoryCurrentPage === 1
            ? "text-on-surface-variant cursor-not-allowed"
            : "text-muted hover:text-muted"}">
        <span class="material-symbols-outlined text-lg">
          chevron_left
        </span>
      </button>
  `;

  for (let i = 1; i <= totalPages; i++) {
    html += `
      <button onclick="changeInventoryPage(${i})"
        class="w-8 h-8 rounded-md text-xs font-bold transition-colors
          ${inventoryCurrentPage === i
            ? "text-white"
            : "text-muted hover:bg-outline-variant"}">
        ${i}
      </button>
    `;
  }

  html += `
      <button onclick="changeInventoryPage(${inventoryCurrentPage + 1})"
        ${inventoryCurrentPage === totalPages ? "disabled" : ""}
        class="p-2 rounded-md
          ${inventoryCurrentPage === totalPages
            ? "text-on-surface-variant cursor-not-allowed"
            : "text-muted hover:text-muted"}">
        <span class="material-symbols-outlined text-lg">
          chevron_right
        </span>
      </button>
    </div>
  `;
  container.innerHTML = html;
}
	
function changeInventoryPage(page) {
  const totalPages = Math.ceil(
    allInventoryData.length / inventoryItemsPerPage
  );
  if (page < 1 || page > totalPages) return;
  inventoryCurrentPage = page;
  renderIngredients(allInventoryData);
}


function toggleLoading(show) {
  let loader = document.getElementById("global-loader");
  if (!loader) {
    loader = document.createElement("div");
    loader.id = "global-loader";
    loader.style = `
      position:fixed;
      top:0;left:0;
      width:100%;height:100%;
      background:rgba(0,0,0,0.5);
      display:flex;
      align-items:center;
      justify-content:center;
      color:white;
      font-size:20px;
      z-index:9999;
    `;
    loader.innerText = "Loading...";
    document.body.appendChild(loader);
    }
    loader.style.display = show ? "flex" : "none";
}

function showToast(msg, type = "success") {
  const container = document.getElementById("toast-container");
  if (!container) {
    return;
  }
  const toast = document.createElement("div");
  toast.className = `
    w-[200px]
    h-[50px]
    px-3
    break-words
    bg-background
    border border-outline-variant group
    shadow-[0_2px_10px_rgba(0,0,0,0.15)]
    relative
    px-6 pt-4
    rounded-md
    text-[12px]
    items-center
    justify-center
    text-center
    font-semibold
    animate-in fade-in zoom-in
    pointer-events-auto
    ${
      type === "error"
      ? "text-red-500"
      : "text-emerald-500"
    }
  `;

  toast.textContent = msg;
  container.appendChild(toast);
  setTimeout(() => {

    toast.classList.add(
      "opacity-0"
    );
    setTimeout(()=>{
      toast.remove();
    },300);
  },3000);
}	

async function saveRecipe() {
  const productId =
    document.getElementById(
      "recipeProductSelect"
    ).value;

  if (!productId) {
    alert(
      "Pilih produk dulu"
    );
    return;
  }

  const ingredients = [];
  document
    .querySelectorAll(
      ".ingredient-row"
    )
    .forEach(row => {
      const ingredientId =
        row.querySelector(
          ".ingredient-select"
        ).value;

      const qty =
        row.querySelector(
          ".ingredient-qty"
        ).value;

      const unit =
        row.querySelector(
          ".ingredient-unit"
        ).value;
      if (
        ingredientId &&
        qty
      ) {

        ingredients.push({
          ingredientId,
          qty: Number(qty),
          unit
        });
      }
    });

  if (!ingredients.length) {
    alert(
      "Tambahkan ingredient dulu"
    );
    return;
  }

  const payload = {
    productId,
    ingredients,
    branchId: state.branchId
  };

  try {

    const sessionId =
      localStorage.getItem("pos_session_id");
    const {
      data,
      error
    } = await supabaseClient.rpc(
      "save_recipe",
      {
        p_payload: payload,
				p_session_id: sessionId
      }
    );

    if (error) {
      throw error;
    }
    state.inventoryData = null;
    state.inventoryBranchId = null;
    state.recipeData = null;
    state.recipeDataBranchId = null;
    state.recipes = null;
    await loadInventoryPage(state.branchId);
    await loadRecipes();
    alert(
      "Recipe berhasil disimpan"
    );
  }
  catch (err) {
    alert(
      err?.message ||
      "Gagal menyimpan recipe"
    );
  }
}
	
async function loadIngredientsByBranch(branchId) {
  const modal =
    document.querySelector(
      ".stock-modal"
    );

  if (!modal) return;
  const select =
    modal.querySelector(
      "#ingredientName"
    );

  if (!select) return;

  // CACHE
  if (
    state.ingredientSelectData &&
    state.ingredientSelectBranchId ===
      branchId
  ) {
    renderIngredientOptions(select, state.ingredientSelectData);
    return;
  }

  select.innerHTML =
    `<option>Loading...</option>`;

  try {

    const sessionId =
      localStorage.getItem("pos_session_id");
    const {
      data,
      error
    } = await supabaseClient.rpc(
      "get_ingredients",
      {
        p_branch_id: branchId,
				p_session_id: sessionId
      }
    );

    if (error) {
      throw error;
    }

    const ingredients = data || [];
    // CACHE
    state.ingredientSelectData =ingredients;
    state.ingredientSelectBranchId =branchId;
    renderIngredientOptions(select, ingredients);
    const first = ingredients[0]?.name;

    if (first) {
      loadIngredientSummary(
        first
      );
    }
  }
  catch (err) {
    select.innerHTML =
      `<option>
        Failed load ingredients
      </option>`;
  }
}

function renderIngredientOptions(select, data) {
  select.innerHTML = "";
  data.forEach(item => {
    const opt = document.createElement("option");
    opt.value = item.name;
    opt.textContent = item.name;
    select.appendChild(opt);
  });
}

function onSelectRecipeProduct(e) {
  const value = e?.target?.value || e;
  if (!value) {
    selectedRecipeId = null;
    selectedRecipeName = "";
    sellingPrice = 0;
    currentIngredients = [];
    renderRecipeBuilder([]);
    return;
  }

  selectedRecipeId = value;
  const recipe = state.recipeProductsData?.find(r =>
    String(r.Recipe_ID || "").trim().toUpperCase() ===
    String(value).trim().toUpperCase()
  );

  if (!recipe) {
    selectedRecipeName = "";
    sellingPrice = 0;
    currentIngredients = [];
    renderRecipeBuilder([]);
    return;
  }
  selectedRecipeName = recipe.Product_Name;
  sellingPrice = recipe.Selling_Price;
  loadRecipeItems(value);
}

async function loadRecipeItems(recipeId) {
  if (!recipeId) return;
  // CACHE
  if (
    state.recipeItemsData &&
    state.recipeItemsRecipeId ===
      recipeId
  ) {
    currentIngredients =
      state.recipeItemsData.map(i => ({
        ingredientId: i.ingredientId,
        qty: i.qty,
        unit: i.unit
      }));
    renderRecipeBuilder(currentIngredients);
    return;
  }

  try {

    const sessionId =
      localStorage.getItem("pos_session_id");
    const {
      data,
      error
    } = await supabaseClient.rpc(
      "get_recipe_items",
      {
        p_recipe_id: recipeId,
				p_session_id: sessionId
      }
    );

    if (error) {
      throw error;
    }
    const items = data || [];

    // CACHE
    state.recipeItemsData = items;
    state.recipeItemsRecipeId = recipeId;
	
    // NORMALIZE
    currentIngredients =
      items.map(i => ({
        ingredientId: i.ingredientId,
        qty: i.qty,
        unit: i.unit
      }));

    // RENDER
    renderRecipeBuilder(
      currentIngredients
    );
  }
  catch (err) {
    renderRecipeBuilder(
      []
    );
  }
}
	
function renderRecipeBuilder(data = []) {
  const container = document.getElementById("ingredientContainer");
  if (!container) return;
  container.innerHTML = "";
  data.forEach((item, index) => {
    const row = document.createElement("div");
    row.className = `
      flex items-center gap-3 p-3
      bg-background
      rounded-md border border-outline-variant
      hover:background transition-all
    `;

    row.innerHTML = `
      <select onchange="updateIngredient(${index}, this.value)"
        class="flex-1 bg-background text-sm rounded-md px-3 py-2">
        <option value="">Select Ingredient</option>

        ${state.ingredients?.map(i => `
          <option value="${i.id || i.ID || ''}"
              ${String(i.id || i.ID || '').trim() ===
                String(item.ingredientId || '').trim()
                  ? 'selected'
                  : ''}>
              ${i.name || i.Name || '-'}
            </option>
        `).join("")}
      </select>

      <input type="number"
        value="${item.qty}"
        onchange="updateQty(${index}, this.value)"
        class="w-24 bg-background rounded-md px-3 py-2"/>

      <select
        onchange="updateUnit(${index}, this.value)"
        class="w-24 bg-background rounded-md px-3 py-2">
        <option value="gram"
          ${item.unit === "gram" || item.unit === "g" ? "selected" : ""}>
          gram
        </option>

        <option value="ml"
          ${item.unit === "ml" ? "selected" : ""}>
          ml
        </option>

        <option value="pcs"
          ${item.unit === "pcs" ? "selected" : ""}>
          pcs
        </option>
      </select>

      <button onclick="removeIngredient(${index})"
        class="p-2 text-red-400 hover:bg-red-500/10 rounded-md">
        🗑
      </button>
    `;
    container.appendChild(row);
  });
}



function renderRecipeProducts(recipes) {
  const select =
    document.getElementById(
      "recipeProductSelect"
    );

  if (!select) return;
  select.innerHTML = `
    <option value="">
      Select a product to configure recipe...
    </option>
  `;
  recipes.forEach(r => {
    select.innerHTML += `
      <option value="${r.Recipe_ID}">
        ${r.Product_Name}
      </option>
    `;
  });
}

async function loadRecipeProducts() {
  const branchId = state.branchId;
  if (!branchId) return;

  try {
		const sessionId =
      localStorage.getItem("pos_session_id");
    const {
      data,
      error
    } = await supabaseClient.rpc(
      "get_recipe_list",
      {
				p_session_id: sessionId,
        p_branch_id: branchId
      }
    );

    if (error) {
      throw error;
    }
    const recipes = data || [];
    state.recipeProductsData = recipes;
    state.recipeProductsBranchId = branchId;
    renderRecipeProducts(recipes);
  }
  catch (err) {
    state.recipeProductsData = [];
    renderRecipeProducts([]);
  }
}
	
function updateLiveStockUI(deductionMap) {
  Object.keys(deductionMap).forEach(id => {
    const el = document.querySelector(`[data-stock-id="${id}"]`);
    if (!el) return;
    const qty = deductionMap[id].qty;
    el.innerHTML = `
      <div class="text-xs text-red-400">
        -${qty.toLocaleString("id-ID")}
      </div>
    `;
  });
}

function addIngredient() {
  if (!Array.isArray(currentIngredients)) {
    currentIngredients = [];
  }
  currentIngredients.push({
    ingredientId: "",
    qty: 0,
    unit: "gram"
  });
  renderRecipeBuilder(currentIngredients);
}

function updateQty(index, value) {
  currentIngredients[index].qty = Number(value);
}

function updateUnit(index, value) {
  currentIngredients[index].unit = value;
}
	
function updateIngredient(index, value) {
  currentIngredients[index].ingredientId = value;
}
	
function removeIngredient(index) {
  if (!Array.isArray(currentIngredients)) {
    currentIngredients = [];
  }
  currentIngredients.splice(index, 1);
  renderRecipeBuilder(currentIngredients); 
}

async function saveRecipeConfig() {
  if (!selectedRecipeId) return;
  try {
		const sessionId =
      localStorage.getItem("pos_session_id");
    // PRODUCT ID
    const productId =
      currentRecipeData?.productId ||
      allRecipesData.find(
        x =>
          String(x.id) ===
          String(selectedRecipeId)
      )?.productId;

    if (!productId) {
      throw new Error(
        "Product ID recipe tidak ditemukan."
      );
    }
	
    // PAYLOAD
    const payload = {
      productId,
      ingredients:
        currentIngredients.map(item => ({
          ingredientId: item.ingredientId,
          qty: Number(item.qty) || 0,
          unit: item.unit || ""
        })),
      branchId: state.branchId
    };

    // SUPABASE RPC
    const {
      data,
      error
    } = await supabaseClient.rpc(
      "save_recipe",
      {
        p_payload: payload,
				p_session_id: sessionId
      }
    );

    if (error) {
      throw error;
    }

    // CLEAR CACHE
    state.inventoryData = null;
    state.inventoryBranchId = null;
    state.recipeData = null;
    state.recipeDataBranchId = null;
    state.recipeProductsData = null;
    state.recipeProductsBranchId = null;
    state.recipeItemsData = null;
    state.recipeItemsRecipeId = null;

    // RELOAD
    await loadInventoryPage(state.branchId);
    await loadRecipes();
    alert(
      "Recipe updated!"
    );
  }
  catch (err) {
    alert(
      err?.message ||
      "Gagal update recipe"
    );
  }
}

window.loadIngredientSummary = async function(name) {
  if (!name) return;
  const branchId =
    document.getElementById(
      "branchSelect"
    )?.value ||
    state.branchId;

  if (!branchId) return;

  try {
		const sessionId =
      localStorage.getItem("pos_session_id");
    const {
      data,
      error
    } = await supabaseClient.rpc(
      "get_ingredient_summary",
      {
        p_ingredient_name: name,
        p_branch_id: branchId,
				p_session_id: sessionId
      }
    );

    if (error) {
      throw error;
    }

    // RESULT
    const res = data || {};
    const totalCost =
      Number(
        res.totalCost ??
        res.total_cost ??
        0
      );

    const totalQty =
      Number(
        res.totalQty ??
        res.total_qty ??
        0
      );

    // RENDER
    const costEl =
      document.getElementById(
        "totalCostPreview"
      );

    const stockEl =
      document.getElementById(
        "newStockPreview"
      );

    if (costEl) {
      costEl.innerText =
        "Rp " +
        totalCost.toLocaleString(
          "id-ID"
        );
    }


    if (stockEl) {
      stockEl.innerText =
        totalQty.toLocaleString(
          "id-ID"
        );
    }
  }
  catch (err) {
  }
};
	
window.openStockInModal = function () {
  const template = document.getElementById("stockInModalTemplate");
  if (!template) return;
  const clone = template.content.cloneNode(true);
  document.querySelectorAll(".stock-modal").forEach(el => el.remove());
  const wrapper = document.createElement("div");
  wrapper.className = "stock-modal";
  wrapper.appendChild(clone);
  document.body.appendChild(wrapper);
  window.stockModalEl = wrapper;
  document.body.style.overflow = "hidden";
  loadStockInData();
  const dateInput = document.getElementById("arrivalDate");
  if (dateInput) {
    const today = new Date();
    dateInput.value = today.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    });
  }
};	

function renderStockInIngredientOptions(select, data){
  select.innerHTML = "";
  data.forEach(item=>{
    const opt = document.createElement("option");
    opt.value = item.name;
    opt.textContent = item.name;
    select.appendChild(opt);
  });
}

function renderSupplierOptions(select, data) {
  select.innerHTML = "";
  data.forEach(item => {
    const opt = document.createElement("option");
    opt.value = item.name;
    opt.textContent = item.name;
    opt.dataset.id = item.id;
    select.appendChild(opt);
  });
}

window.loadStockInData = async function () {
  const modal =
    document.querySelector(
      ".stock-modal"
    );
  if (!modal) return;
  // BRANCH + INGREDIENT
  const branchId = state.branchId;
  loadStockInIngredients(modal, branchId);
  loadBranchDropdown();
  // SUPPLIER
  const supplierSelect =
    modal.querySelector(
      "#supplierSelect"
    );
  if (!supplierSelect) return;
  // CACHE SUPPLIER
  if (
    state.supplierData &&
    state.supplierBranchId ===
      branchId
  ) {
    renderSupplierOptions(
      supplierSelect,
      state.supplierData
    );
    return;
  }
	
  try {
    const sessionId =
      localStorage.getItem("pos_session_id");
    const {
      data,
      error
    } = await supabaseClient.rpc(
      "get_suppliers",
      {
        p_branch_id:branchId,
				p_session_id: sessionId
      }
    );
    if (error) {
      throw error;
    }
    const suppliers = data || [];
    // CACHE
    state.supplierData = suppliers;
    state.supplierBranchId = branchId;
    // RENDER
    renderSupplierOptions(supplierSelect, suppliers);
  }
  catch (err) {
  }
};

async function loadStockInIngredients( modal, branchId ) {
  if (!modal) return;
  branchId = branchId || state.branchId;
  if (!branchId) return;

  const select =
    modal.querySelector(
      "#ingredientName"
    );
  if (!select) return;

  // CACHE
  if (
    state.stockInIngredients &&
    state.stockInIngredientsBranchId ===
      branchId
  ) {
    renderStockInIngredientOptions(
      select,
      state.stockInIngredients
    );
    return;
  }

  select.innerHTML =
    `<option>Loading...</option>`;

  try {
    const sessionId =
      localStorage.getItem("pos_session_id");
    const {
      data,
      error
    } = await supabaseClient.rpc(
      "get_ingredients",
      {
        p_branch_id: branchId,
				p_session_id: sessionId
      }
    );

    if (error) {
      throw error;
    }

    const ingredients =data || [];
    // CACHE
    state.stockInIngredients = ingredients;
    state.stockInIngredientsBranchId = branchId;

    // RENDER
    renderStockInIngredientOptions(select, ingredients);
    // LOAD SUMMARY
    const first =
      ingredients[0]?.name;
    if (first) {
      loadIngredientSummary(
        first
      );
    }
  }
  catch (err) {
    select.innerHTML =
      `<option>
        Failed load ingredients
      </option>`;
  }
}
	
window.stockModalEl = null;
window.saveStockIn = async function () {
  const modal =
    document.querySelector(
      ".stock-modal"
    );
  if (!modal) return;

  const ingredient =
    modal.querySelector(
      "#ingredientName"
    )?.value;

  const qty =
    modal.querySelector(
      "#stockQty"
    )?.value;

  const price =
    modal.querySelector(
      "#purchasePrice"
    )?.value;

  // SUPPLIER
  const supplierSelect =
    modal.querySelector(
      "#supplierSelect"
    );
  const supplier =
    supplierSelect?.value || "";
  const supplierId =
    supplierSelect
      ?.options[
        supplierSelect.selectedIndex
      ]
      ?.dataset.id || null;

  const note =
    modal.querySelector(
      "textarea"
    )?.value;

  // PAYMENT
  const paymentMethod =
    modal.querySelector(
      "#purchasePaymentMethod"
    )?.value ||
    "CASH";

  const status =
    modal.querySelector(
      "#purchasePaymentStatus"
    )?.value ||
    "PAID";

  const branchSelect =
    modal.querySelector(
      "#branchSelect"
    );

  const branchId = state.branchId;

  const outletName =
    branchSelect
      ? branchSelect.options[
          branchSelect.selectedIndex
        ]?.text || ""
      : "";

  if (!branchId) {
    alert(
      "Branch belum dipilih!"
    );
    return;
  }
	
  const wibDate =
    new Intl.DateTimeFormat(
      "sv-SE",
      {
        timeZone: "Asia/Jakarta",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false
      }
    )
    .format(new Date())
    .replace(
      " ",
      "T"
    );

  try {

    // TOTAL PRICE
    const totalPrice = Number(price) || 0;
	
    const sessionId =
      localStorage.getItem("pos_session_id");
    const {
      data,
      error
    } = await supabaseClient.rpc(
      "add_ingredient_purchase",
      {
				p_session_id: sessionId,
        p_date: wibDate,
        p_ingredient_name: ingredient || "",
        p_qty: Number(qty) || 0,
        p_total_price: totalPrice,
        p_supplier: supplier || "",
        p_supplier_id: supplierId,
        p_note: note || "",
        p_branch_id: branchId,
        p_outlet: outletName || "",
        p_payment_method: paymentMethod || "CASH",
        p_status: status || "PAID"
      }
    );

    if (error) {
      throw error;
    }

    // CLEAR CACHE
    state.inventoryData = null;
    state.inventoryBranchId = null;
    state.stockInIngredients = null;
    state.stockInIngredientsBranchId = null;
    state.supplierData = null;
    state.supplierBranchId = null;
    state.recipeData = null;
    state.recipeDataBranchId = null;
    // CLOSE MODAL
    closeModal();
    showToast(
      "Purchase berhasil disimpan",
      "success"
    );

  } catch (error) {
    let message =
      "Gagal menyimpan purchase";
    const err = error?.message || "";
    if (
      err.includes(
        "Saldo Cash tidak mencukupi"
      )
    ) {
      message =
        "Saldo Cash tidak mencukupi";
    }
    else if (
      err.includes(
        "Saldo Bank tidak mencukupi"
      )
    ) {
      message =
        "Saldo Bank tidak mencukupi";
    }
    alert(message);
  }
};
	
window.closeModal = function () {
  document.querySelectorAll(".fixed.inset-0")
    .forEach(el => el.remove());
  document.body.style.overflow = "auto";
};

document.addEventListener("change", function(e) {
  if (e.target.id === "ingredientName") {
    const val = e.target.value;
    if (!val) return;
    loadIngredientSummary(val);
  }
});

async function loadBranchDropdown() {

  try {
  
    const sessionId =
      localStorage.getItem("pos_session_id");
    const {
      data,
      error
    } = await supabaseClient.rpc(
      "get_expense_branches",
			{
				p_session_id: sessionId
			}
    );

    if (error) {
      throw error;
    }

    // NORMALIZE DATA
    const branches = data || [];
    // SELECT ELEMENT
    const materialSelect =
      document.getElementById(
        "material_branch"
      );

    const supplierSelect =
      document.getElementById(
        "supplier_branch"
      );

    const stockBranchSelect =
      document.getElementById(
        "branchSelect"
      );

    // CLEAR OPTIONS
    if (materialSelect) {
      materialSelect.innerHTML = "";
    }
    if (supplierSelect) {
      supplierSelect.innerHTML = "";
    }
    if (stockBranchSelect) {
      stockBranchSelect.innerHTML = "";
    }

    // RENDER BRANCH
    branches.forEach(branch => {
      // STOCK IN
      if (stockBranchSelect) {
        const option = document.createElement("option");
        option.value = branch.id;
        option.textContent = branch.name;
        stockBranchSelect.appendChild(option);
      }

      // MATERIAL
      if (materialSelect) {
        const option = document.createElement("option");
        option.value = branch.id;
        option.textContent = branch.name;
        materialSelect.appendChild(option);
      }

      // SUPPLIER
      if (supplierSelect) {
        const option = document.createElement("option");
        option.value = branch.id;
        option.textContent = branch.name;
        supplierSelect.appendChild(option);
      }
    });

    // LOCK USER BRANCH
    if (materialSelect) {
      materialSelect.value = state.branchId;
      materialSelect.disabled = true;
    }
    if (supplierSelect) {
      supplierSelect.value = state.branchId;
      supplierSelect.disabled = true;
    }
    if (stockBranchSelect) {
      stockBranchSelect.value = state.branchId;
      stockBranchSelect.disabled = true;
    }
  }
  catch (err) {
    showToast(
      err?.message ||
      "Gagal memuat branch.",
      "error"
    );
  }
}

window.openAddMaterialModal = function () {
  // HAPUS semua dulu (anti numpuk)
  document.querySelectorAll("#add-material-modal-wrapper").forEach(el => el.remove());
  const tpl = document.getElementById("addmaterialModalTemplate");
  const clone = tpl.content.cloneNode(true);
  // kasih wrapper sendiri (INI KUNCI)
  const wrapper = document.createElement("div");
  wrapper.id = "add-material-modal-wrapper";
  wrapper.appendChild(clone);
  document.body.appendChild(wrapper);
  loadBranchDropdown();
};
	
window.closeAddMaterialModal = function () {
  document.querySelectorAll("#add-material-modal-wrapper").forEach(el => el.remove());
};

function openSupplierModal() {
  const template = document.getElementById("addsupplierModalTemplate");
  const clone = template.content.cloneNode(true);
  document.body.appendChild(clone);
  loadBranchDropdown();
}
	
async function saveSupplier() {
  const branchSelect =
    document.getElementById(
      "supplier_branch"
    );

  const data = {
    name:
      document.getElementById(
        "supplier_name"
      ).value,

    category:
      document.getElementById(
        "supplier_category"
      ).value,

    contact:
      document.getElementById(
        "supplier_contact"
      ).value,

    phone:
      document.getElementById(
        "supplier_phone"
      ).value,

    address:
      document.getElementById(
        "supplier_address"
      ).value,

    status:
      document.getElementById(
        "supplier_status"
      ).checked
        ? "Active"
        : "Inactive",

    branchId: branchSelect.value,
	
    outlet:
      branchSelect.options[
        branchSelect.selectedIndex
      ].text
  };

  try {

    const sessionId =
      localStorage.getItem("pos_session_id");
    const {
      data: res,
      error
    } =
      await supabaseClient.rpc(
        "save_supplier",
        {
          p_name: data.name || "",
          p_category: data.category || "",
          p_contact: data.contact || "",
          p_phone: Number(data.phone) || 0,
          p_status: data.status || "",
          p_notes: data.address || "",
          p_branch_id: data.branchId || "",
          p_outlet: data.outlet || "",
					p_session_id: sessionId
        }
      );

    if (error) {
      throw error;
    }

    // SUCCESS CHECK
    if (
      res &&
      res.success === false
    ) {
      throw new Error(
        res.message ||
        "Gagal menyimpan supplier"
      );
    }

    // CLEAR CACHE
    closeSupplierModal();
    state.supplierData = null;
    state.supplierBranchId = null;
    state.inventoryData = null;
    state.inventoryBranchId = null;
    // RELOAD
    await loadInventoryPage(state.branchId);
    showToast(
      "Supplier berhasil disimpan",
      "success"
    );
  }
  catch (err) {
    showToast(
      err?.message ||
      "Gagal menyimpan supplier",
      "error"
    );
  }
}

function closeSupplierModal() {
  const modal = document.querySelector('[data-modal="supplier"]');
  if (modal) modal.remove();
}

function getBranchId() {
  return state.branchId || localStorage.getItem("branchId");
}

async function exportInventoryPDF() {
  const branchId = getBranchId();
  if (!branchId) {
    alert(
      "Branch tidak ditemukan"
    );
    return;
  }
  const pdfWindow =
    window.open(
      "",
      "_blank"
    );

  if (!pdfWindow) {
    alert(
      "Popup diblokir browser"
    );
    return;
  }

  // LOADING
  pdfWindow.document.write(`
    <html>
      <body style="
        background:#0B0F14;
        color:white;
        font-family:Arial;
        display:flex;
        align-items:center;
        justify-content:center;
        height:100vh;
      ">
        Generating Inventory Report...
      </body>
    </html>
  `);

  try {
		const sessionId =
  		localStorage.getItem("pos_session_id");
    const response =
      await fetch(
        "/api/export-pdf",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json"
          },

          body: JSON.stringify({
            type: "inventory",
            branchId: branchId,
						sessionId,
						tenantSlug: state.tenantSlug
          })
        }
      );

    // CHECK RESPONSE
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        errorText ||
        "Export Inventory gagal"
      );
    }

    // GET HTML
    const html = await response.text();
    if (!html) {
      throw new Error(
        "Response export kosong"
      );
    }
    // SHOW REPORT
    pdfWindow.document.open();
    pdfWindow.document.write(html);
    pdfWindow.document.close();
  }

  catch (err) {
    pdfWindow.document.open();
    pdfWindow.document.write(`
	
      <html>
        <body style=" font-family:Arial; padding:40px;">
          <h2>
            Export PDF Failed
          </h2>

          <pre>
						${String(
						  err?.message ||
						  "Export PDF gagal"
						)}
          </pre>
        </body>
      </html>
    `);

    pdfWindow.document.close();
    alert(
      err?.message ||
      "Export PDF gagal"
    );
  }
}

function previewRecipeImage(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function () {
    document.getElementById(
      "recipeImagePreview"
    ).src = reader.result;
  };
  reader.readAsDataURL(file);
}

function fileToBase64(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

async function compressImage(file, maxWidth = 1200, quality = 0.8) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      let width = img.width;
      let height = img.height;
      if (width > maxWidth) {
        height =
          height *
          (maxWidth / width);
        width = maxWidth;
      }
      const canvas =
        document.createElement(
          "canvas"
        );
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(
        img,
        0,
        0,
        width,
        height
      );
      canvas.toBlob(
        blob => resolve(blob),
        "image/jpeg",
        quality
      );
    };
    img.src = URL.createObjectURL(file);
  });
}

function fileToBase64(fileOrBlob) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () =>
      resolve(reader.result);
    reader.readAsDataURL(fileOrBlob);
  });
}

function switchTab(tab) {
  const overviewBtn = document.getElementById('tab-overview');
  const historyBtn = document.getElementById('tab-history');
  const overviewContent = document.getElementById('content-overview');
  const historyContent = document.getElementById('content-history');
  if (tab === 'overview') {
      overviewBtn.classList.add('border-white', 'text-on-surface');
      overviewBtn.classList.remove('border-transparent', 'text-on-surface/50');
      historyBtn.classList.remove('border-white', 'text-on-surface');
      historyBtn.classList.add('border-transparent', 'text-on-surface/50');
      overviewContent.classList.remove('hidden');
      historyContent.classList.add('hidden');
  } else {
      historyBtn.classList.add('border-white', 'text-on-surface');
      historyBtn.classList.remove('border-transparent', 'text-on-surface/50');
      overviewBtn.classList.remove('border-white', 'text-on-surface');
      overviewBtn.classList.add('border-transparent', 'text-on-surface/50');
      historyContent.classList.remove('hidden');
      overviewContent.classList.add('hidden');
  }
}

function openModal(templateId) {
  const old =
    document.getElementById(templateId);
  if (old) {
    old.remove();
  }
  const tpl =
    document.getElementById(
      templateId + "Template"
    );
  if (!tpl) return;
  const modal =
    tpl.content
      .firstElementChild
      .cloneNode(true);
  modal.id = templateId;
  document.body.appendChild(modal);
}


async function openAddProductModal() {
  openModal(
    "addProductModal"
  );
  await loadProductCategories();
}

async function loadProductCategories() {
  const branchId = state.branchId;
  if (!branchId) {
    return;
  }

  try {
    const categories =
      await getCategoriesRPC(
        branchId
      );

    // PRODUCT CATEGORY SELECT
    const select =
      document.getElementById(
        "newProductCategory"
      );

    if (select) {
      select.innerHTML =
        `<option value="">
          Select Category
        </option>`;

      categories.forEach(
        category => {
          const option =
            document.createElement(
              "option"
            );
          option.value = category.category_name;
          option.textContent = category.category_name;
          select.appendChild(option);
        }
      );
    }
	
    // CATEGORY SETTINGS UI
    categories.forEach(
      category => {
        const key =
          category.category_key;

        const nameInput =
          document.getElementById(
            `${key}_name`
          );

        const discountInput =
          document.getElementById(
            `${key}_discount`
          );

        const rewardInput =
          document.getElementById(
            `${key}_reward`
          );
        if (nameInput) {
          nameInput.value =
            category.category_name || "";
        }
        if (discountInput) {
          discountInput.value =
            category.discount ?? 0;
        }
        if (rewardInput) {
          rewardInput.value =
            category.reward ?? 0;
        }
      }
    );
  }
  catch (err) {
		if (select) {
			select.innerHTML =
				`<option value="">
					Gagal memuat category
				</option>`;
    }
  }
}

async function saveNewProduct() {
  const name =
    document
      .getElementById("newProductName")
      ?.value
      .trim();

  const category =
    document
      .getElementById("newProductCategory")
      ?.value;

  const price =
    Number(
      document
        .getElementById("newProductPrice")
        ?.value || 0
    );

  const branchId = state.branchId;

  const branchSelect =
    document.getElementById(
      "newProductBranch"
    );

  const outlet =
    branchSelect
      ? branchSelect.options[
          branchSelect.selectedIndex
        ]?.text || ""
      : state.branchName || "";

  // VALIDATION
  if (!name) {
    alert(
      "Product Name wajib diisi."
    );
    return;
  }
  if (!category) {
    alert(
      "Category wajib dipilih."
    );
    return;
  }
  if (price <= 0) {
    alert(
      "Selling Price tidak valid."
    );
    return;
  }
  if (!branchId) {
    alert(
      "Branch belum dipilih."
    );
    return;
  }
  try {
    const sessionId =
      localStorage.getItem("pos_session_id");
    const {
      data: res,
      error
    } =
      await supabaseClient.rpc(
        "add_new_product",
        {
          p_name: name,
          p_category: category,
          p_price: price,
          p_branch_id: branchId,
          p_outlet: outlet,
					p_session_id: sessionId
        }
      );

    // RPC ERROR
    if (error) {
      throw error;
    }
    // SUCCESS CHECK
    if (
      !res ||
      res.success === false
    ) {
      throw new Error(
        res?.message ||
        "Gagal menyimpan product."
      );
    }
    closeAddProductModal();
    state.products = null;
    state.productBranchId = null;
    state.recipeData = null;
    state.recipeDataBranchId = null;
    state.recipeProductsData = null;
    state.recipeProductsBranchId = null;
    state.inventoryData = null;
    state.inventoryBranchId = null;
    await loadProducts();
    await loadRecipes();
    await loadInventoryPage(state.branchId);
    // SUCCESS TOAST
    showToast(
      "Product added successfully.",
      "success"
    );
  }
  catch (err) {
    alert(
      err?.message ||
      "Gagal menyimpan product."
    );
  }
}

async function saveMaterial() {
  const select =
    document.getElementById(
      "material_branch"
    );

  const data = {
    branchId: select.value,
    branchName:
      select.options[
        select.selectedIndex
      ].text,
    name:
      document.getElementById(
        "material_name"
      ).value,
    unit:
      document.getElementById(
        "material_unit"
      ).value,
    min:
      Number(
        document.getElementById(
          "material_min"
        ).value || 0
      )
  };

  try {
    const sessionId =
      localStorage.getItem("pos_session_id");
    const {
      data: res,
      error
    } =
      await supabaseClient.rpc(
        "save_material",
        {
          p_name: data.name || "",
          p_value: 0,
          p_qty: 0,
          p_unit: data.unit || "",
          p_min: Number(data.min) || 0,
          p_cost: 0,
          p_branch_id: data.branchId || "",
          p_outlet: data.branchName || "",
					p_session_id: sessionId
        }
      );

    if (error) {
      throw error;
    }
    // SUCCESS CHECK
    if (
      res &&
      res.success === false
    ) {
      throw new Error(
        res.message ||
        "Gagal menyimpan material"
      );
    }
	
    // CLEAR CACHE
    closeAddMaterialModal();
    state.products = null;
    state.productBranchId = null;
    state.recipeData = null;
    state.recipeDataBranchId = null;
    state.recipeProductsData = null;
    state.recipeProductsBranchId = null;
    state.inventoryData = null;
    state.inventoryBranchId = null;
		state.stockInIngredients = null;
		state.stockInIngredientsBranchId = null;
    await loadProducts();
    await loadRecipes();
    await loadInventoryPage(state.branchId);

    showToast(
      "Material berhasil disimpan",
      "success"
    );
  }
  catch (err) {
    showToast(
      err?.message ||
      "Gagal menyimpan material",
      "error"
    );
  }
}

function closeModal(id) {
  const modal = document.getElementById(id);
  if(modal) modal.remove();
}

function closeAddProductModal(){
  const modal = document.getElementById("addProductModal");
  if(modal){
    modal.remove();
  }
}

function initIngredientExportDate() {
  const start = document.getElementById("ingredientExportStart");
  const end = document.getElementById("ingredientExportEnd");
  if (!start || !end) return;
  const today = new Date();
  const weekAgo = new Date(today);
  weekAgo.setDate(today.getDate() - 7);
  const format = (d) => d.toISOString().split("T")[0];
  start.value = format(weekAgo);
  end.value = format(today);
  const applyDateFilter = () => {
    loadIngredientPurchases(
      state.branchId,
      start.value,
      end.value
    );
  };
  start.onchange = applyDateFilter;
  end.onchange = applyDateFilter;
}

async function exportIngredientPurchases() {
  const branchId =
    getBranchId();
  if (!branchId) {
    alert(
      "Branch tidak ditemukan"
    );
    return;
  }

  const startDate =
    document.getElementById(
      "ingredientExportStart"
    )?.value;

  const endDate =
    document.getElementById(
      "ingredientExportEnd"
    )?.value;

  const pdfWindow =
    window.open(
      "",
      "_blank"
    );

  if (!pdfWindow) {
    alert(
      "Popup diblokir browser"
    );
    return;
  }

  // LOADING
  pdfWindow.document.write(`
    <html>
      <body style="
        background:#0B0F14;
        color:white;
        font-family:Arial;
        display:flex;
        align-items:center;
        justify-content:center;
        height:100vh;
      ">
        Generating Ingredient Purchase Report...
      </body>
    </html>
  `);

  try {
		const sessionId =
  		localStorage.getItem("pos_session_id");
    const response =
      await fetch(
        "/api/export-pdf",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json"
          },

          body: JSON.stringify({
            type: "ingredient-purchase",
            branchId: branchId,
            start: startDate,
            end: endDate,
						sessionId,
						tenantSlug: state.tenantSlug
          })
        }
      );

    // CHECK RESPONSE
    if (!response.ok) {
      const errorText =
        await response.text();
      throw new Error(
        errorText ||
        "Export Ingredient Purchase gagal"
      );
    }

    // GET HTML
    const html = await response.text();

    if (!html) {
      throw new Error(
        "Response export kosong"
      );
    }

    // SHOW REPORT
    pdfWindow.document.open();
    pdfWindow.document.write(
      html
    );
    pdfWindow.document.close();
  }

  catch (err) {
    pdfWindow.document.open();
    pdfWindow.document.write(`
      <html>
        <body style="font-family:Arial; padding:40px;">

          <h2>
            Export PDF Failed
          </h2>

          <pre>
			${String(
			  err?.message ||
			  "Export PDF gagal"
			)}
          </pre>
        </body>
      </html>
    `);
    pdfWindow.document.close();
    alert(
      err?.message ||
      "Export PDF gagal"
    );
  }
}


	// ==================================
	// ANALYTICS
	// ==================================

function initAnalyticsDate() {
  const startEl = document.getElementById("analyticsStartDate");
  const endEl = document.getElementById("analyticsEndDate");
  if (!startEl || !endEl) return;
  // kalau sudah ada nilai jangan timpa
  if (startEl.value && endEl.value) {
    return;
  }
  const today = new Date();
  const lastWeek = new Date(today.getTime() - 6 * 24 * 60 * 60 * 1000);
  endEl.value = today.toISOString().split("T")[0];
  startEl.value = lastWeek.toISOString().split("T")[0];
}

function renderWeeklyChart(weekly) {
  const container = document.getElementById("weeklyChart");
  if (!container) return;
  container.innerHTML = "";
  const max = Math.max(...weekly, 1);
  weekly.forEach((val, i) => {
    const prev = weekly[i - 1] || val;
    const height = (val / max) * 100;
    let colorClass = "bg-outline-variant";
    // WARNA HALUS (bukan ngejreng)
    if (val > prev) {
      colorClass = "bg-emerald-400/70 hover:bg-emerald-400";
    } else if (val < prev) {
      colorClass = "bg-red-400/70 hover:bg-red-400";
    } else {
      colorClass = "bg-outline-variant hover:bg-primary-container";
    }
    // LAST BAR (highlight kayak contoh lo)
    if (i === weekly.length - 1) {
      colorClass = "bg-primary-container";
    }
    const bar = document.createElement("div");
    bar.className = `
      flex-1 
      ${colorClass} 
      rounded-t-md 
      transition-all duration-300 
      hover:scale-y-105
    `;
    bar.style.height = height + "%";
    // tooltip
    bar.title = "Rp " + val.toLocaleString("id-ID");
    container.appendChild(bar);
  });
}

function renderAnalytics(data) {
  if (!data) {
    return;
  }
  const setText = (id, value) => {
    const el = document.getElementById(id);
    if (el) el.innerText = value;
  };
  setText("revenueValue", "Revenue: " + formatIDR(data.revenue || 0));
  setText("hppValue", "HPP: " + formatIDR(data.hpp || 0));
  setText("opsValue", "OPEX: " + formatIDR(data.operational || 0));
	setText("depreciationValue", "Depreciation: " + formatIDR(data.depreciation || 0));
  setText("otherincometValue","Other Income: " + formatIDR(data.otherIncome || 0));
  setText("grossProfitValue", "Gross Profit: " + formatIDR(data.grossProfit || 0));
  setText("netProfitValue", formatIDR(data.netProfit || 0));
  setText("activeMembersValue",formatNumber(data.activeMembers || 0));

  const growthEl = document.getElementById("growthValue");
    if (growthEl) {
      const parent = growthEl.parentElement;
      // reset warna dulu
      parent.classList.remove("text-emerald-400", "text-red-400");
      if (data.growth === null) {
        growthEl.innerText = "No data";
      } else {
        const g = data.growth;
        const sign = g > 0 ? "+" : "";
        growthEl.innerText = `${sign}${g.toFixed(1)}% vs last period`;
        if (g > 0) {
          parent.classList.add("text-emerald-400");
        } else if (g < 0) {
          parent.classList.add("text-red-400");
        }
      }
    }
  renderWeeklyChart(data.weekly || [0,0,0,0]);
  renderActiveMembers(data);
}

function renderActiveMembers(data) {
  const el = document.getElementById("activeMemberList");
  if (!el) return;
  el.innerHTML = "";
  (data.activeMemberList || []).forEach(m => {
    const name = m.name || m.id;
    const id = m.id || m;
    const initials = name
      .split(" ")
      .map(w => w[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
    const row = document.createElement("div");
    row.className = "flex items-center gap-3 p-2 rounded-md bg-outline-variant hover:bg-outline-variant/10 transition";
    row.innerHTML = `
      <div class="w-8 h-8 rounded-md bg-emerald-500/20 flex items-center justify-center text-xs font-bold text-emerald-400">
        ${initials}
      </div>

      <div class="flex flex-col">
        <span class="text-sm text-white font-semibold">${name}</span>
        <span class="text-[10px] text-muted ">${id}</span>
      </div>
    `;
    el.appendChild(row);
  });
}

function formatNumber(num){
  return Number(num || 0)
    .toLocaleString("id-ID");
}

function onDateChange() {
  if (analyticsTimeout) {
    clearTimeout(analyticsTimeout);
  }
  analyticsTimeout = setTimeout(() => {
    loadAnalyticsPage();
  }, 50);
}

let analyticsLoading = false;
async function loadAnalyticsPage() {
  if (analyticsLoading) return;
  analyticsLoading = true;

  try {
    const startEl =
      document.getElementById(
        "analyticsStartDate"
      );

    const endEl =
      document.getElementById(
        "analyticsEndDate"
      );

    if (!startEl || !endEl) {
      return;
    }
    const startDate = startEl.value;
    const endDate = endEl.value;
    if (!startDate || !endDate) {
      return;
    }

    const cacheKey =
      JSON.stringify({
        branchId: state.branchId,
        startDate,
        endDate
      });

    // CACHE
    if (
      state.analyticsData &&
      state.analyticsFilter === cacheKey
    ) {
      renderAnalyticsPageData(
        state.analyticsData
      );
      return;
    }

    // SUPABASE RPC
    const res =
      await getAnalyticsDashboardRPC(
        state.branchId,
        startDate,
        endDate
      );

    // VALIDASI
    if (!res) {
      throw new Error(
        "Data analytics tidak ditemukan"
      );
    }
    // CACHE
    state.analyticsData = res;
    state.analyticsFilter = cacheKey;
    renderAnalyticsPageData(res);
  }

  catch (err) {
    showToast(
      err?.message ||
      "Gagal load analytics",
      "error"
    );
  }
  finally {
    analyticsLoading = false;
  }
}
	
function renderAnalyticsPageData(data){
  renderAnalytics( data.analytics );
  renderPaymentDistribution( data.paymentDistribution );
  renderHeatmap( data.peakHours );
  renderTopSellingItems( data.topSelling );
  renderRawMaterialAnalysis( data.rawMaterials );
}

function renderPaymentDistribution(data) {
  try {
    const container = document.getElementById("paymentDistribution");
    if (!container) return;
    container.innerHTML = "";
    // kalau kosong
    if (!data || data.length === 0) {
      container.innerHTML = '<div class="text-sm text-muted  text-center">No payment data</div>';
      return;
    }
    const colors = {
      CASH: "bg-[#9CA3AF]",
      QRIS: "bg-[#F59E0B]",
      TRANSFER: "bg-[#6366F1]"
    };

    data.forEach(function(item) {
      let percent = parseFloat(item.percent);
      if (isNaN(percent)) percent = 0;
      percent = Math.max(0, Math.min(percent, 100));
      const method = item.method || "UNKNOWN";
      const color = colors[method] || "bg-primary";
      const row = document.createElement("div");
      row.className = "space-y-5";
      row.innerHTML =
        '<div class="flex justify-between items-center">' +
          // kiri (label)
          '<div class="flex items-center gap-2">' +
            '<div class="w-2.5 h-2.5 rounded-md ' + color + '"></div>' +
            '<span class="text-muted text-sm lg:text-base">' + method + '</span>' +
          '</div>' +
          // kanan (percent)
          '<span class="font-bold text-xs">' + percent.toFixed(1) + '%</span>' +
        '</div>' +
        // bar besar
        '<div class="w-full h-6 bg-outline-variant rounded-md overflow-hidden">' +
          '<div class="' + color + ' h-full rounded-md transition-all duration-700 ease-out" ' +
          'style="width:' + percent + '%"></div>' +
        '</div>';
      container.appendChild(row);
    });
  } catch (err) {
  }
}

function renderHourHeader(container) {
  const header = document.createElement("div");
  header.className = "flex mb-2";
  // kosongin kolom pertama (biar sejajar dengan label hari)
  const empty = document.createElement("div");
  empty.className = "w-10";
  header.appendChild(empty);
  for (let h = 0; h < 24; h++) {
    const el = document.createElement("div");
    el.className = "flex-1 text-[8px] text-center text-muted";
    el.innerText = String(h).padStart(2, "0");
    header.appendChild(el);
  }
  container.appendChild(header);
}

function renderHeatmap(data) {
  const container = document.getElementById("heatmapGrid");
  if (!container) return;
  container.innerHTML = "";
  if (!data || !Array.isArray(data)) return;
  const days = ["SUN","MON","TUE","WED","THU","FRI","SAT"];
  // cari max
  let max = 0;
  data.forEach(day => {
    if (!Array.isArray(day)) return;
    day.forEach(v => {
      if (v > max) max = v;
    });
  });
  if (max === 0) max = 1;
  data.forEach((day, i) => {
    const col = document.createElement("div");
    col.className = "flex flex-col gap-[2px] flex-1";
    if (!Array.isArray(day)) return;
    // 24 jam cell
    day.forEach((value, hour) => {
      const ratio = value / max;
      const cell = document.createElement("div");
      cell.className = "flex-1 min-h-[6px] rounded-sm";
      if (ratio > 0.75) {
        cell.classList.add("bg-primary-container");
      } else if (ratio > 0.5) {
        cell.classList.add("bg-amber-500/80");
      } else if (ratio > 0.25) {
        cell.classList.add("bg-amber-500/40");
      } else if (ratio > 0) {
        cell.classList.add("bg-amber-500/20");
      } else {
        cell.classList.add("bg-outline-variant");
      }
      // optional tooltip biar enak
      cell.title = `${days[i]} ${hour}:00 = ${value}`;
      col.appendChild(cell);
    });
    // label hari
    const label = document.createElement("span");
    label.className = "text-[10px] text-muted  text-center font-bold mt-2";
    label.innerText = days[i] || "-";
    col.appendChild(label);
    container.appendChild(col);
  });
}

function renderRawMaterialAnalysis(data) {
  rawMaterialData = data || [];
  rawMaterialPage = 1;
  renderRawMaterialPage();
}

function renderRawMaterialPage() {
  const tbody =
    document.getElementById(
      "rawMaterialAnalysisBody"
    );
  if (!tbody) return;
  tbody.innerHTML = "";
  if (!rawMaterialData.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="9"
            class="py-10 text-center text-muted ">
          No data available
        </td>
      </tr>
    `;
    renderRawMaterialPagination();
    return;
  }
  const start = (rawMaterialPage - 1) * rawMaterialPerPage;
  const end = start + rawMaterialPerPage;
  const rows = rawMaterialData.slice(start, end);
  tbody.innerHTML = rows.map(item => {
    let statusClass = `
      bg-emerald-500/10
      text-emerald-500
      border-emerald-500/20
    `;
    if (item.status === "Warning") {
      statusClass = `
        bg-amber-500/10
        text-amber-500
        border-amber-500/20
      `;
    }
    if (item.status === "Critical") {
      statusClass = `
        bg-red-500/10
        text-red-500
        border-red-500/20
      `;
    }
    const daysColor =
      item.status === "Critical"
        ? "text-red-500"
        : item.status === "Warning"
        ? "text-amber-500"
        : "text-emerald-500";
    return `
      <tr class="hover:bg-outline-variant transition-colors">
        <td class="px-8 py-6">
          <div class="font-bold text-sm">
            ${item.name}
          </div>
        </td>

        <td class="px-8 py-6 text-sm">
          ${formatNumber(item.stock)}
          ${item.unit}
        </td>

        <td class="px-8 py-6 text-sm text-muted">
          ${formatNumber(item.dailyUsage)}
          ${item.unit}/day
        </td>

        <td class="px-8 py-6 text-sm text-muted ">
          ${formatNumber(item.minStock)}
          ${item.unit}
        </td>

        <td class="px-8 py-6">
          <span class="
            px-3 py-1 rounded-md
            text-[10px]
            font-bold
            uppercase
            border
            ${statusClass}
          ">
            ${item.status}
          </span>
        </td>

        <td class="px-8 py-6">
          <span class="
            text-sm
            font-bold
            ${daysColor}
          ">
            ${item.daysLeft} Days
          </span>
        </td>

        <td class="px-8 py-6 text-right font-headline font-bold text-on-surface">
          ${formatNumber(item.stockValue)}
        </td>

        <td class="px-8 py-6 text-xs text-muted ">
          ${
            item.lastRestock
              ? new Date(item.lastRestock)
                  .toLocaleDateString("id-ID")
              : "-"
          }
        </td>

        <td class="px-8 py-6 text-right text-on-surface-variant">
          <button
            onclick="navigate('inventoryPage')"
            class="p-2 hover:text-on-surface transition-all"
          >
            <span class="material-symbols-outlined text-sm">
              visibility
            </span>
          </button>
        </td>
      </tr>
    `;
  }).join("");
  renderRawMaterialPagination();
}

function renderRawMaterialPagination() {
  const info =
    document.getElementById(
      "rawMaterialPaginationInfo"
    );
  const pagination =
    document.getElementById(
      "rawMaterialPagination"
    );
  const prevBtn =
    document.getElementById(
      "rawMaterialPrev"
    );
  const nextBtn =
    document.getElementById(
      "rawMaterialNext"
    );

  if (
    !info ||
    !pagination ||
    !prevBtn ||
    !nextBtn
  ) return;
  const total = rawMaterialData.length;
  const totalPages =
    Math.max(
      1,
      Math.ceil(
        total /
        rawMaterialPerPage
      )
    );
  const start =
    total === 0
      ? 0
      : ((rawMaterialPage - 1) *
          rawMaterialPerPage) + 1;
  const end =
    Math.min(
      rawMaterialPage *
      rawMaterialPerPage,
      total
    );

  info.innerHTML = `
    Showing
    <span class="text-on-surface font-bold">
      ${start}
    </span>
    to
    <span class="text-on-surface font-bold">
      ${end}
    </span>
    of
    <span class="text-on-surface font-bold">
      ${total}
    </span>
    entries
  `;
  let pagesHtml = "";
  for (
    let i = 1;
    i <= totalPages;
    i++
  ) {

    pagesHtml += `
      <button
        onclick="goToRawMaterialPage(${i})"
        class="
          w-8 h-8 rounded-md
          text-xs font-bold
          transition-all
          ${
            i === rawMaterialPage
              ? "text-on-surface"
              : "text-on-surface-variant hover:text-on-surface"
          }
        ">
        ${i}
      </button>
    `;
  }
  pagination.innerHTML = pagesHtml;
  prevBtn.disabled = rawMaterialPage === 1;
  nextBtn.disabled = rawMaterialPage === totalPages;
  prevBtn.onclick = () => {
    if (
      rawMaterialPage > 1
    ) {
      rawMaterialPage--;
      renderRawMaterialPage();
    }
  };
  nextBtn.onclick = () => {
    if (
      rawMaterialPage <
      totalPages
    ) {
      rawMaterialPage++;
      renderRawMaterialPage();
    }
  };
}

function goToRawMaterialPage(page) {
  rawMaterialPage = page;
  renderRawMaterialPage();
}

function openIngredient(id) {
  const ingredient =
    state.ingredients.find(
      i => String(i.id) === String(id)
    );
  if (!ingredient) return;
  openIngredientModal(ingredient);
}

function renderTopSellingItems(items){
  const container = document.getElementById("topSellingItemsContainer");
  if(!container) return;
  container.innerHTML = "";
  items.forEach(item => {
    container.innerHTML += `
      <div class="flex items-center gap-4">
        <div class="w-12 h-12 flex items-center justify-center">
          <span class="material-symbols-outlined">restaurant</span>
        </div>

        <div class="flex-1">
          <h4 class="text-sm text-on-surface uppercase font-headline font-bold tracking-[0.20em]">${item.name}</h4>
          <p class="text-xs text-on-surface-variant">${item.qty} Sold</p>
        </div>

        <div class="text-right">
          <p class="text-sm font-bold text-on-surface">
            Rp ${formatNumber(item.revenue)}
          </p>
        </div>
      </div>
    `;
  });
}

document.addEventListener(
  "click",
  function(e) {
    const btn =
      e.target.closest(
        "#btnExportAnalyticsPDF"
      );
    if (!btn) return;
    exportAnalyticsPDF();
  }
);


async function exportAnalyticsPDF() {
  const start =
    document.getElementById(
      "analyticsStartDate"
    )?.value;

  const end =
    document.getElementById(
      "analyticsEndDate"
    )?.value;

  const branchId = state.branchId;

  // VALIDASI
  if (!start || !end) {
    alert(
      "Pilih tanggal dulu"
    );
    return;
  }
	
  if (!branchId) {
    alert(
      "Branch tidak valid"
    );
    return;
  }

  // OPEN TAB
  const pdfTab =
    window.open(
      "",
      "_blank"
    );

  if (!pdfTab) {
    alert(
      "Popup diblokir browser"
    );
    return;
  }

  // LOADING PAGE
  pdfTab.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>
        Analytics Report
      </title>
			
      <style>

        body {
          background:#0B0F14;
          color:white;
          font-family:Arial;
          display:flex;
          align-items:center;
          justify-content:center;
          height:100vh;
          margin:0;
        }

        .loading {
          text-align:center;
        }

        .title {
          font-size:18px;
          font-weight:bold;
          margin-bottom:8px;
        }

        .subtitle {
          font-size:13px;
          opacity:.7;
        }
      </style>
    </head>

    <body>
      <div class="loading">
        <div class="title">
          Analytics Report
        </div>
				
        <div class="subtitle">
          Generating PDF...
        </div>
      </div>
    </body>
    </html>
  `);
  pdfTab.document.close();
  // CALL VERCEL API
  try {
		const sessionId =
  		localStorage.getItem("pos_session_id");
    const response =
      await fetch("/api/export-pdf", {
		  method: "POST",
		  headers: {
			"Content-Type": "application/json"
		  },
		  body: JSON.stringify({
			type: "analytics",
			start,
			end,
			branchId,
			sessionId,
			tenantSlug: state.tenantSlug
		  })
		});

    // HTTP ERROR
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        errorText ||
        `Export gagal (${response.status})`
      );
    }

    // API RETURN
    const result = await response.text();
    if (!result) {
      throw new Error(
        "Server tidak mengembalikan hasil PDF"
      );
    }

    // JIKA API RETURN URL
    if (
      result.startsWith("http://") ||
      result.startsWith("https://") ||
      result.startsWith("/")
    ) {
      pdfTab.location.href = result;
      return;
    }

    // JIKA API RETURN HTML
    pdfTab.document.open();
    pdfTab.document.write(result);
    pdfTab.document.close();
  }

  // ERROR
  catch(err) {
    pdfTab.document.open();
    pdfTab.document.write(`
      <!DOCTYPE html>
					<html>
						<body style="
							background:#0B0F14;
							color:white;
							font-family:Arial;
							padding:40px;">
			
			        <h2>
			          Failed Generate PDF
			        </h2>
			
			        <p style="color:#aaa;">
			          Gagal membuat Analytics Report.
			        </p>
			
			        <pre style="
			          white-space:pre-wrap;
			          background:#151A21;
			          padding:15px;
			          border-radius:10px;
			        ">${String(
			          err?.message ||
			          err
			        )}</pre>
		      </body>
	      </html>
    `);
    pdfTab.document.close();
  }
}


	// ==================================
	// SETTINGS
	// ==================================

	
function reloadCurrentPage() {
  initModule(currentPage);
}

function applySettingsPage(data) {
  // update state/cache
  state.settings = data.settings || {};
 if (data.businessProfile) {
	  state.businessProfile =
	    data.businessProfile;
	}
  // update branch
  window.branchData = data.branches || [];
  allBranches = data.branches || [];
  // update users
  window.userData = data.users || [];
  allUsers = data.users || [];
  loadBranchesTable(allBranches);
  renderUsers();
  const taxInput = document.getElementById("taxInput");
  const serviceInput = document.getElementById("serviceInput");
  const discountInput = document.getElementById("discountInput");
  if (taxInput) taxInput.value = state.settings.tax || 0;
  if (serviceInput) serviceInput.value = state.settings.service || 0;
  if (discountInput) discountInput.value = state.settings.discount || 0;
  loadBusinessProfile();
}

async function loadSettingsPage() {
  // CACHE
  if (state.settingsPageData) {
    applySettingsPage(
      state.settingsPageData
    );
    initBusinessProfile();
    return;
  }

  try {
    // SUPABASE RPC
    const data = await getSettingsPageDataRPC();
    // NORMALIZE RESPONSE
    const result =
      data || {
        settings: {},
        loyalty: {},
        branch: {},
        users: []
      };
		
    // CACHE
    state.settingsPageData = result;
    applySettingsPage(state.settingsPageData);
    initBusinessProfile();
    await loadBusinessProfile();
  }
  catch (err) {
    showToast(
      err?.message ||
      "Gagal memuat Settings.",
      "error"
    );
  }
}
	
async function reloadSettingsPage() {

  try {
    // SUPABASE RPC
    const data =
      await getSettingsPageDataRPC();

    // UPDATE STATE
    state.settingsPageData =
      data || {
        settings: {},
        loyalty: {},
        branch: {},
        users: []
      };

    // APPLY UI
    applySettingsPage(
      state.settingsPageData
    );
  }

  catch (err) {
    showToast(
      err?.message ||
      "Gagal reload Settings.",
      "error"
    );
  }
}

function loadBranchSelector(branches) {
  const select = document.getElementById("globalBranchSelector");
  if (!select) return;
  const role = state.user.role;
  // OWNER
  if (role === "Owner") {
    select.innerHTML = branches.map(b => `
      <option value="${b.branchId}">
        ${b.branchName}
      </option>
    `).join("");
    // default
	    select.value = state.branchId;
	    select.disabled = false;
	    select.onchange = function () {
      state.branchId = this.value;
      reloadCurrentPage();
    };
  } 
  // ADMIN / CASHIER
  else {
    const userBranch = branches.find(
      b => b.branchId === state.user.branchId
    );
    select.innerHTML = `
      <option value="${state.user.branchId}">
        ${userBranch 
          ? userBranch.branchName 
          : state.user.branchId}
      </option>
    `;
    select.value = state.user.branchId;
    select.disabled = true;
    state.branchId = state.user.branchId;
    select.onchange = null;
  }
}

function loadBranchesTable(branches) {
  window.branchData = branches;
  allBranches = branches;
  loadBranchSelector(branches);
  renderBranchTable();
}

function renderBranchTable(){
  const tbody = document.getElementById("branchTableBody");
  if(!tbody) return;
  const start = (branchCurrentPage - 1) * branchPerPage;
  const end = start + branchPerPage;
  const rows = allBranches.slice(start, end);
  let html = "";
  rows.forEach(b => {
    html += `
      <tr class="group hover:bg-outline-variant transition-colors">
        <td class="py-5 px-4">
          <div class="font-bold text-on-surface">${b.branchName}</div>
          <div class="text-[10px] text-muted ">${b.branchId}</div>
        </td>

        <td class="py-5 px-4 text-md text-on-surface font-bold">
          ${b.manager || "-"}
        </td>

        <td class="py-5 px-4 text-sm text-muted">
          ${b.alamat || "-"}
        </td>

        <td class="py-5 px-4 text-center">
          <label class="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              class="sr-only peer"
              ${String(b.status).toUpperCase() === "ACTIVE" ? "checked" : ""}
              onchange="toggleBranchStatus('${b.branchId}', this.checked)">

            <div class="w-10 h-5 bg-on-surface-variant border border-outline-variant rounded-md
						  peer
						  peer-checked:bg-foreground
						  after:content-['']
						  after:absolute
						  after:top-0.5
						  after:left-[2px]
						  after:bg-background
						  after:rounded-md
						  after:h-4
						  after:w-4
						  after:transition-all
						  peer-checked:after:translate-x-full">
						</div>
          </label>
        </td>

        <td class="py-5 px-4">
          <div class="flex justify-end gap-2">
            <button onclick="openEditBranchModal('${b.branchId}')"
              class="w-9 h-9 hover:bottom-theme transition rounded-md">

              <span class="material-symbols-outlined text-sm">
                edit
              </span>
            </button>
          </div>
        </td>
      </tr>
    `;
  });
  tbody.innerHTML = html;
  renderBranchPagination();
}

function renderBranchPagination() {
  const pagination = document.getElementById("branchPagination");
  if (!pagination) return;
  const totalData = allBranches.length;
  const totalPages = Math.ceil(totalData / branchPerPage);
  // Info Showing
  document.getElementById("branchShowingStart").textContent =
    totalData === 0
      ? 0
      : (branchCurrentPage - 1) * branchPerPage + 1;
  document.getElementById("branchShowingEnd").textContent =
    Math.min(branchCurrentPage * branchPerPage, totalData);
  document.getElementById("branchTotalData").textContent = totalData;
  let html = "";
  // Previous
  html += `
    <button onclick="changeBranchPage(${branchCurrentPage - 1})"
      ${branchCurrentPage === 1 ? "disabled" : ""}
      class="px-3 py-2 disabled:opacity-40 disabled:cursor-not-allowed">
      ‹
    </button>
  `;
  // Number
  for (let i = 1; i <= totalPages; i++) {
    html += `
      <button onclick="changeBranchPage(${i})"
        class="w-7 h-7 rounded-md transition text-xs font-bold
        ${
          i === branchCurrentPage
            ? 'text-white'
            : 'text-muted  hover:bg-outline-variant'}
        }">
        ${i}
      </button>
    `;
  }
  // Next
  html += `
    <button onclick="changeBranchPage(${branchCurrentPage + 1})"
      ${branchCurrentPage === totalPages || totalPages === 0 ? "disabled" : ""}
      class="px-3 py-2 disabled:opacity-40 disabled:cursor-not-allowed">
      ›
    </button>
  `;
  pagination.innerHTML = html;
}

function changeBranchPage(page) {
  const totalPages = Math.ceil(allBranches.length / branchPerPage);
  if (page < 1 || page > totalPages) return;
  branchCurrentPage = page;
  renderBranchTable();
}

function openAddBranchModal(){
  openModal("addBranchModal");
}

function closeAddBranchModal(){
  const modal = document.getElementById("addBranchModal");
  if(modal){
    modal.remove();
  }
}

async function saveNewBranch() {
  const data = {
    branchName:
      document
        .getElementById("newBranchName")
        ?.value
        ?.trim() || "",
    manager:
      document
        .getElementById("newBranchManager")
        ?.value
        ?.trim() || "",
    phone:
      document
        .getElementById("newBranchPhone")
        ?.value
        ?.trim() || "",
    alamat:
      document
        .getElementById("newBranchAddress")
        ?.value
        ?.trim() || ""
  };
  if (!data.branchName) {
    alert(
      "Branch Name wajib diisi."
    );
    return;
  }
  if (!data.manager) {
    alert(
      "Manager wajib diisi."
    );
    return;
  }
  if (!data.alamat) {
    alert(
      "Address wajib diisi."
    );
    return;
  }

  try {
    // SUPABASE RPC
    const res =
      await addNewBranchRPC(
        data
      );

    // HANDLE RESPONSE
    if (!res?.success) {
      alert(
        res?.message ||
        "Gagal menambahkan outlet."
      );
      return;
    }
    closeAddBranchModal();
    state.settingsPageData = null;
    await reloadSettingsPage();
    showToast(
      "Outlet berhasil ditambahkan."
    );
  }

  catch (err) {
    alert(
      err?.message ||
      "Gagal menambahkan outlet."
    );
  }
}

async function toggleBranchStatus(branchId, status) {
  try {
    // SUPABASE RPC
    const res =
      await updateBranchStatusRPC(
        branchId,
        status
      );

    // HANDLE RESPONSE
    if (
      res &&
      res.success === false
    ) {
      throw new Error(
        res.message ||
        "Gagal mengubah status outlet."
      );
    }

    // CLEAR STATE
    state.settingsPageData = null;
    await reloadSettingsPage();
    showToast(
      "Status outlet berhasil diubah"
    );
  }

  catch (err) {
    showToast(
      err?.message ||
      "Gagal mengubah status outlet",
      "error"
    );
  }
}

function openEditBranchModal(branchId){
  const branch = window.branchData.find(
    x => String(x.branchId) === String(branchId)
  );
  if(!branch) return;
  openModal("editBranchModal");
  document.getElementById("editBranchId").value = branch.branchId;
  document.getElementById("editBranchName").value = branch.branchName;
  document.getElementById("editBranchManager").value = branch.manager;
  document.getElementById("editBranchAddress").value = branch.alamat;
}

async function saveEditBranch() {

  const data = {
    branchId:
      document
        .getElementById("editBranchId")
        ?.value
        ?.trim() || "",
    branchName:
      document
        .getElementById("editBranchName")
        ?.value
        ?.trim() || "",
    manager:
      document
        .getElementById("editBranchManager")
        ?.value
        ?.trim() || "",
    alamat:
      document
        .getElementById("editBranchAddress")
        ?.value
        ?.trim() || ""
  };

  if (!data.branchName) {
    alert(
      "Branch Name wajib diisi."
    );
    return;
  }

  if (!data.manager) {
    alert(
      "Manager wajib diisi."
    );
    return;
  }

  if (!data.alamat) {
    alert(
      "Address wajib diisi."
    );
    return;
  }

  try {
    // SUPABASE RPC
    const res =
      await updateBranchRPC(
        data
      );

    // HANDLE RESPONSE
    if (
      res &&
      res.success === false
    ) {
      alert(
        res.message ||
        "Gagal memperbarui outlet."
      );
      return;
    }
    closeEditBranchModal();
    state.settingsPageData = null;
    await reloadSettingsPage();
    showToast(
      "Outlet berhasil diperbarui."
    );
  }

  catch (err) {
    alert(
      err?.message ||
      "Gagal memperbarui outlet."
    );
  }
}

function closeEditBranchModal(){
  const modal = document.getElementById("editBranchModal");
  if(modal){
    modal.remove();
  }
}

async function saveTaxSettings() {
  const data = {
    tax:
      Number(
        document
          .getElementById("taxInput")
          ?.value
      ) || 0,
    service:
      Number(
        document
          .getElementById("serviceInput")
          ?.value
      ) || 0,
    discount:
      Number(
        document
          .getElementById("discountInput")
          ?.value
      ) || 0
  };

  try {
    const sessionId =
      localStorage.getItem("pos_session_id");
    const {
      data: result,
      error
    } = await supabaseClient.rpc(
      "save_settings",
      {
        p_settings: data,
				p_session_id: sessionId
      }
    );

    if (error) {
      throw error;
    }
    state.settingsPageData = null;
    await reloadSettingsPage();
    alert(
      "Settings saved!"
    );
  }

  catch (err) {
    alert(
      err?.message ||
      "Gagal menyimpan settings."
    );
  }
}

function loadUsers(users) {
  window.userData = users || [];
  allUsers = users || [];
  renderUsers();
}


function renderUsers() {
  const tbody = document.getElementById("userTableBody");
  if (!tbody) return;

  const start = (userCurrentPage - 1) * userPerPage;
  const end = start + userPerPage;
  const rows = (allUsers || []).slice(start, end);

  const role = state.user?.role?.toLowerCase();

  let html = "";
  rows.forEach(user => {
    const userRole = user.role.toLowerCase();
    const canManage =
      role === "owner" ||
      (role === "admin" && userRole === "cashier");

    html += `
      <tr class="hover:bg-outline-variant transition">
        <!-- FULL NAME -->
        <td class="px-5 py-4 font-medium">
          ${user.Full_Name || "-"}
        </td>

        <!-- USERNAME -->
        <td class="px-5 py-4">
          ${user.username}
        </td>

        <!-- ROLE -->
        <td class="px-5 py-4">
          ${user.role}
        </td>

        <!-- PASSWORD -->
        <td class="px-5 py-4">
          ••••••
        </td>

        <!-- OUTLET -->
        <td class="px-5 py-4">
          ${user.outlet}
        </td>

        <!-- ACTIONS -->
        <td class="px-5 py-4">
          <div class="flex justify-end gap-2">

            ${canManage ? `
              <button onclick="openEditUserModal('${user.id}')"
                class="w-9 h-9 hover:bottom-theme transition rounded-md">
                <span class="material-symbols-outlined text-sm">
                  edit
                </span>
              </button>

              <button onclick="deleteUser('${user.id}')"
                class="w-9 h-9 hover:bg-red-500/10 transition rounded-md">
                <span class="material-symbols-outlined text-sm text-red-400">
                  delete
                </span>
              </button>
            ` : ""}
          </div>
        </td>
      </tr>
    `;
  });

  tbody.innerHTML = html;
  renderUserPagination();
}

function renderUserPagination() {
  const pagination = document.getElementById("userPagination");
  if (!pagination) return;
  const total = allUsers.length;
  const totalPages = Math.ceil(total / userPerPage);
  document.getElementById("userShowingStart").textContent = total ? (userCurrentPage - 1) * userPerPage + 1 : 0;
  document.getElementById("userShowingEnd").textContent = Math.min(userCurrentPage * userPerPage, total);
  document.getElementById("userTotalData").textContent = total;
  let html = "";
  // Previous
  html += `
    <button onclick="changeUserPage(${userCurrentPage - 1})"
      ${userCurrentPage === 1 ? "disabled" : ""}
      class="px-3 py-2 disabled:opacity-40">
      ‹
    </button>
  `;
  // Number
  for (let i = 1; i <= totalPages; i++) {
    html += `
      <button onclick="changeUserPage(${i})"
        class="w-8 h-8 rounded-md transition text-xs font-bold
        ${
          i === userCurrentPage
            ? 'text-white'
            : 'text-muted  hover:bg-outline-variant'}
        }">
        ${i}
      </button>
    `;
  }
  // Next
  html += `
    <button onclick="changeUserPage(${userCurrentPage + 1})"
      ${userCurrentPage === totalPages || totalPages === 0 ? "disabled" : ""}
      class="px-3 py-2 disabled:opacity-40">
      ›
    </button>
  `;
  pagination.innerHTML = html;
}

function changeUserPage(page){
  const totalPages = Math.ceil(allUsers.length / userPerPage);
  if(page < 1 || page > totalPages) return;
  userCurrentPage = page;
  renderUsers();
}

function openEditUserModal(id){
  const user = window.userData.find(x => String(x.id) === String(id));
  if(!user) return;
  openModal("editUserModal");
  document.getElementById("editUserId").value = user.id;
	document.getElementById("editUserFullName").value = user.full_name || "";
  document.getElementById("editUsername").value = user.username;
  document.getElementById("editPassword").value = "";
  document.getElementById("editRole").value = user.role;
  document.getElementById("editOutlet").value = user.outlet;
}

async function saveEditUser() {
  const data = {
    id:
      document
        .getElementById("editUserId")
        ?.value
        ?.trim() || "",
    fullName:
      document
        .getElementById("editUserFullName")
        ?.value
        ?.trim() || "",
    username:
      document
        .getElementById("editUsername")
        ?.value
        ?.trim() || "",
    login_user_id:
      state.user.id
  };
  const password =
    document
      .getElementById("editPassword")
      ?.value
      ?.trim() || "";
  if (!data.fullName) {
    alert(
      "Full Name wajib diisi."
    );
    return;
  }
  if (!data.username) {
    alert(
      "Username wajib diisi."
    );
    return;
  }
  if (password !== "") {
    data.password =
      password;
  }

  try {
    // SUPABASE RPC
    const res =
      await updateUserRPC(
        data
      );

    // HANDLE RESPONSE
    if (
      res &&
      res.success === false
    ) {
      alert(
        res.message ||
        "Gagal memperbarui user."
      );
      return;
    }
    closeEditUserModal();
    state.settingsPageData = null;
    await reloadSettingsPage();
    showToast(
      "User berhasil diperbarui."
    );

  } catch (err) {
    alert(
      err?.message ||
      "Gagal memperbarui user."
    );
  }
}

function closeEditUserModal(){
  const modal = document.getElementById("editUserModal");
  if(modal){
    modal.remove();
  }
}
	
async function loadBranchOptions() {

  try {
    // SUPABASE RPC
    const data =
      await getBranchOptionsRPC({
        loginUserId:
          state.user.id
      });

    // SELECT ELEMENT
    const select =
      document.getElementById(
        "newUserBranch"
      );
    if (!select) {
      return;
    }
    const branches = data?.branches || [];
    // CLEAR OPTIONS
    select.innerHTML = "";

    // ONLY ONE BRANCH
    if (branches.length === 1) {
      select.innerHTML = `
        <option
          value="${branches[0].branchId}"
        >
          ${branches[0].branchName}
        </option>
      `;
      select.value =
        branches[0].branchId;
      select.disabled = true;
    }
	
    // MULTIPLE BRANCHES
    else {
      select.disabled = false;
      select.innerHTML = `
        <option value="">
          Select Outlet
        </option>
      `;
      branches.forEach(
        branch => {
          select.innerHTML += `
            <option
              value="${branch.branchId}"
            >
              ${branch.branchName}
            </option>
          `;
        }
      );
    }
  }

  catch (err) {
    showToast(
      err?.message ||
      "Gagal memuat outlet.",
      "error"
    );
  }
}

function loadUserRoleOptions(){
  const select = document.getElementById("newUserRole");
  if(!select) return;
  const currentRole = state.user.role.toLowerCase();
  select.innerHTML = `
    <option value="">
      Select Role
    </option>
  `;
  // OWNER
  if(currentRole === "owner"){
    select.innerHTML += `
      <option value="Admin">
        Admin
      </option>
      <option value="Cashier">
        Cashier
      </option>
    `;
  }
  // ADMIN
  else if(currentRole === "admin"){
    select.innerHTML += `
      <option value="Cashier">
        Cashier
      </option>
    `;
  }
}

function openAddUserModal(){
  openModal("addUserModal");
  loadBranchOptions();
  loadUserRoleOptions();
}

async function saveNewUser() {
  const data = {
	  username: document.getElementById("newUsername")?.value?.trim() || "",
	  fullName: document.getElementById("newUserFullName")?.value?.trim() || "",
	  password: document.getElementById("newPassword")?.value?.trim() || "",
	  role: document.getElementById("newUserRole")?.value || "",
	  branchId:
	    document.getElementById("newUserBranch")?.value ||
	    state.user.branchId,
	  createdBy: String(state.user.id)
	};
  if (!data.branchId) {
	  alert(
	    "Silakan pilih outlet."
	  );
	  return;
	}
	
	if (!data.fullName) {
	  alert(
	    "Full Name wajib diisi."
	  );
	  return;
	}
	
	if (!data.username) {
	  alert(
	    "Username wajib diisi."
	  );
	  return;
	}
  if (!data.password) {
    alert(
      "Password wajib diisi."
    );
    return;
  }
  if (!data.role) {
    alert(
      "Role wajib dipilih."
    );
    return;
  }

  try {

    // SUPABASE RPC
    const res =
      await addNewUserRPC(
        data
      );
    // HANDLE RESPONSE
    if (
      res &&
      res.success === false
    ) {
      alert(
        res.message ||
        "Gagal menambahkan user."
      );
      return;
    }
    closeAddUserModal();
    state.settingsPageData = null;
    await reloadSettingsPage();
    showToast(
      "User berhasil ditambahkan."
    );
  }

  catch (err) {
    alert(
      err?.message ||
      "Gagal menambahkan user."
    );
  }
}

function closeAddUserModal(){
  const modal = document.getElementById("addUserModal");
  if(modal){
    modal.remove();
  }
}

async function deleteUser(id) {
  if (
    !confirm(
      "Hapus user ini?"
    )
  ) {
    return;
  }

  try {
    // SUPABASE RPC
    const res =
      await deleteUserRPC({
        id: id,
        login_user_id:
          state.user.id
      });

    // HANDLE RESPONSE
    if (
      res &&
      res.success === false
    ) {
      alert(
        res.message ||
        "Gagal menghapus user."
      );
      return;
    }
    state.settingsPageData = null;
    await reloadSettingsPage();
    showToast(
      "User berhasil dihapus."
    );
  }

  catch (err) {
    alert(
      err?.message ||
      "Gagal menghapus user."
    );
  }
}

function applyBusinessProfile(data){
  if(!data) return;
  const companyName = document.getElementById("businessCompanyName");
  const instagram = document.getElementById("businessInstagram");
  const receiptFooter = document.getElementById("businessReceiptFooter");
  const logoPreview = document.getElementById("businessLogoPreview");
  if(companyName){
    companyName.value =
      data.company_name || "";
  }
  if(instagram){
    instagram.value =
      data.instagram || "";
  }
  if(receiptFooter){
    receiptFooter.value =
      data.receipt_footer || "";
  }
  if(logoPreview){
    logoPreview.src =
      data.logo_url || "";
  }
}

async function loadBusinessProfile() {

  try {
    const data = await getBusinessProfileRPC();
    state.businessProfile =
      data || {
        company_name: "",
        instagram: "",
        receipt_footer: "",
        logo_url: ""
      };

    applyBusinessProfile(
      state.businessProfile
    );

  }
  catch (err) {
    showToast(
      err?.message ||
      "Gagal memuat Business Profile",
      "error"
    );
  }
}

function initBusinessProfile() {
  const saveButton =
    document.getElementById(
      "btnSaveBusinessProfile"
    );

  if (!saveButton) {
    return;
  }
  saveButton.onclick = saveBusinessProfile;
  initBusinessLogoPreview();
}
	
function initBusinessLogoPreview() {
  const input =
    document.getElementById(
      "businessLogoInput"
    );

  const preview =
    document.getElementById(
      "businessLogoPreview"
    );

  if (!input || !preview) return;
  input.onchange = function (e) {
    const file =
      e.target.files?.[0];
    if (!file) return;
    const reader =
      new FileReader();
    reader.onload =
      function (ev) {
        preview.src =
          ev.target.result;
      };
    reader.readAsDataURL(file);
  };
}


async function uploadBusinessLogo(base64) {
  if (!base64) {
    return null;
  }
  const client = getActiveSupabase();
  if (!client) {
    throw new Error(
      "Supabase client belum siap"
    );
  }

  // PARSE BASE64
  const matches =
    base64.match(
      /^data:(.+);base64,(.+)$/
    );

  if (!matches) {
    throw new Error(
      "Format gambar tidak valid"
    );
  }

  const mime = matches[1];
  const base64Data = matches[2];
  const buffer =
    Uint8Array.from(
      atob(base64Data),
      c => c.charCodeAt(0)
    );
  // EXTENSION
  const ext = mime.split("/")[1] || "jpg";
  // PATH
  const path =
    `business/logo_${Date.now()}.${ext}`;
  // UPLOAD
  const {
    error: uploadError
  } = await client.storage
    .from("Logo_Digital_Recipes")
    .upload(
      path,
      buffer,
      {
        contentType: mime,
        upsert: true
      }
    );

  if (uploadError) {
    throw uploadError;
  }
	
  // PUBLIC URL
  const {
    data: publicData
  } = client.storage
    .from("Logo_Digital_Recipes")
    .getPublicUrl(path);

  const logoUrl =
    publicData?.publicUrl;

  if (!logoUrl) {
    throw new Error(
      "Public URL logo tidak ditemukan"
    );
  }
  return logoUrl;
}

function fileToBase64(file) {
  return new Promise(
    (resolve, reject) => {
      const reader =
        new FileReader();
      reader.onload =
        () => resolve(
          reader.result
        );
      reader.onerror =
        () => reject(
          new Error(
            "Gagal membaca file logo"
          )
        );
      reader.readAsDataURL(file);
    }
  );
}

async function saveBusinessProfile() {
  const companyName =
    document.getElementById(
      "businessCompanyName"
    );
  const instagram =
    document.getElementById(
      "businessInstagram"
    );
  const receiptFooter =
    document.getElementById(
      "businessReceiptFooter"
    );
  const logoPreview =
    document.getElementById(
      "businessLogoPreview"
    );
  const logoInput =
    document.getElementById(
      "businessLogoInput"
    );

  // VALIDATE
  if (
    !companyName ||
    !instagram ||
    !receiptFooter ||
    !logoPreview
  ) {
    return;
  }

  // DATA AWAL
  const data = {
    company_name: companyName.value.trim(),
    instagram: instagram.value.trim(),
    receipt_footer: receiptFooter.value.trim(),
    logo_url: logoPreview.src || ""
  };

  try {
    // CEK LOGO BARU
    const file = logoInput?.files?.[0];

    if (file) {
      // FILE → BASE64
      const base64 =
        await fileToBase64(
          file
        );

      // UPLOAD API
      const logoUrl =
        await uploadBusinessLogo(
          base64
        );
      if (!logoUrl) {
        throw new Error(
          "URL logo tidak diterima dari API"
        );
      }
      data.logo_url = logoUrl;
    }
	
    // SAVE PROFILE VIA RPC
    const result =
      await saveBusinessProfileRPC(
        data
      );

    // CHECK RPC
    if (
      result &&
      result.success === false
    ) {

      throw new Error(
        result.message ||
        "Gagal menyimpan profile"
      );
    }

    // UPDATE STATE
    state.businessProfile = {
      ...(state.businessProfile || {}),
      company_name: data.company_name,
      instagram: data.instagram,
      receipt_footer: data.receipt_footer,
      logo_url: data.logo_url
    };

    // UPDATE UI
    applyBusinessProfile(
      state.businessProfile
    );

    // CLEAR FILE INPUT
    if (logoInput) {
      logoInput.value = "";
    }

    // SUCCESS
    showToast(
      "Business Profile berhasil disimpan",
      "success"
    );
  }
  catch (err) {
    showToast(
      err?.message ||
      "Gagal menyimpan Business Profile",
      "error"
    );
  }
}
	
async function loadBranchName() {
  // LOAD FROM STATE
  if (state.branchInfo) {
    const el =
      document.getElementById(
        "appBrandName"
      );

    if (el) {
      el.innerText =
        (
          state.branchInfo.branchName ||
          "SISTEM KASIR"
        ).toUpperCase();
    }
    return;
  }
  // VALIDATE BRANCH
  if (!state.branchId) {
    const el =
      document.getElementById(
        "appBrandName"
      );
    if (el) {
      el.innerText =
        "PILIH OUTLET";
    }
    return;
  }

  try {
    // SUPABASE RPC
    const data =
      await getBranchInfoRPC(
        state.branchId
      );
  
    // SAVE STATE
    state.branchInfo =
      data || {
        branchName:
          "SISTEM KASIR"
      };
	
    // APPLY UI
    const el =
      document.getElementById(
        "appBrandName"
      );

    if (el) {
      el.innerText =
        (
          state.branchInfo.branchName ||
          "SISTEM KASIR"
        ).toUpperCase();
    }
  }

  catch (err) {
    const el =
      document.getElementById(
        "appBrandName"
      );
    if (el) {
      el.innerText =
        "SISTEM KASIR";
    }
  }
}

	
	// ==================================
	// TAX
	// ==================================

async function loadTaxSettings() {
  try {
    const sessionId =
      localStorage.getItem("pos_session_id");

    const {
      data,
      error
    } = await supabaseClient.rpc(
      "get_settings",
      {
        p_session_id: sessionId
      }
    );

    if (error) {
      throw error;
    }
    const settings = data || {};
    const taxInput = document.getElementById("taxInput");
    const serviceInput = document.getElementById("serviceInput");
    const discountInput = document.getElementById("discountInput");

    if (taxInput) {
      taxInput.value =
        settings.tax ?? 0;
    }
    if (serviceInput) {
      serviceInput.value =
        settings.service ?? 0;
    }
    if (discountInput) {
      discountInput.value =
        settings.discount ?? 0;
    }
  }
  catch (err) {
    showToast(
      err?.message ||
      "Gagal memuat tax settings",
      "error"
    );
  }
}
	
	// ==================================
	// EXPENSES 
	// ==================================

function getExpenseFilters() {
  return {
    branch: state.branchId,
    category: document.getElementById("expenseCategoryFilter")?.value || "All Categories",
    status: document.getElementById("expenseStatusFilter")?.value || "All Status",
    startDate: document.getElementById("expenseStartDate")?.value,
    endDate: document.getElementById("expenseEndDate")?.value,
    keyword: document.getElementById("expenseSearchInput")?.value?.toLowerCase() || ""
  };
}

function initExpenseSettingPage() {
  loadExpenseBranches("expenseBranchFilter");
  loadExpenseDashboard();
  document
    .getElementById(
      "expenseSearchInput"
    )
    ?.addEventListener(
      "input",
      filterExpenseTable
    );

  document
    .getElementById(
      "expenseCategoryFilter"
    )
    ?.addEventListener(
      "change",
      filterExpenseTable
    );

  document
    .getElementById(
      "expenseStatusFilter"
    )
    ?.addEventListener(
      "change",
      filterExpenseTable
    );

  document
	  .getElementById("expenseStartDate")
	  ?.addEventListener(
	    "change",
	    filterExpenseTable
	  );
	
	document
	  .getElementById("expenseEndDate")
	  ?.addEventListener(
	    "change",
	    filterExpenseTable
	  );

  document
    .getElementById(
      "expenseBranchFilter"
    )
    ?.addEventListener(
      "change",
      async () => {
        state.expenseDashboardData = null;
        state.expenseDashboardFilter = null;
        await loadExpenseDashboard();
      }
    );

  setTimeout(() => {
    document
      .getElementById(
        "btnNewExpense"
      )
      ?.addEventListener(
        "click",
        openAddExpensePopup
      );
  }, 50);
}

function bindExpenseSearch() {
  const el = document.getElementById("expenseSearchInput");
  if (!el) return;
  el.addEventListener("input", (e) => {
    const keyword = e.target.value.toLowerCase();
    const filtered = expenseData.filter(x =>
      (x.Description || "").toLowerCase().includes(keyword) ||
      (x.Category || "").toLowerCase().includes(keyword)
    );
    renderExpenseTable(filtered);
  });
}
	
function openBudgetModal() {
  const template = document.getElementById("addbudgetpopup");
  const clone = template.content.cloneNode(true);
  document.body.appendChild(clone);
  loadBudgetBranches();
}

function closeBudgetModal(){
  const modal = document.getElementById("budgetModal");
  if(modal){
    modal.remove();
  }
}

function applyExpenseDashboard(data){
  allExpenseData = data.expenses || [];
  allOtherIncome = data.otherIncome || [];
  expenseBranches = data.branches || [];
  state.expenseBranches = expenseBranches;
  expenseCategoryData = data.categoryBreakdown || [];
  expenseBudget = data.budget || 0;
  currentPage = 1;
  window.currentFilteredData = allExpenseData;
  loadExpenseBranches();
  loadOtherIncomeBranches();
  paginate(allExpenseData);
  updateExpenseKPIs(allExpenseData, expenseBudget);
  renderCategoryBreakdown();
  renderOtherIncome();
	updateExpenseAIInsight();
}

async function loadExpenseDashboard() {
  const filter = getExpenseFilters();
  filter.loginBranchId = state.branchId;
  const filterKey = JSON.stringify(filter);
  // CACHE HIT
  if (
    state.expenseDashboardData &&
    state.expenseDashboardFilter === filterKey
  ) {
    loadExpenseBranches("expenseBranchFilter");
    loadOtherIncomeBranches("otherIncomeBranchFilter");
    applyExpenseDashboard(state.expenseDashboardData);
    return;
  }

  try {
    const data =
      await getExpenseDashboardRPC(
        filter
      );

    // CACHE
    state.expenseDashboardData =data;
    state.expenseDashboardFilter =filterKey;
    loadExpenseBranches("expenseBranchFilter");
    loadOtherIncomeBranches("otherIncomeBranchFilter");
    applyExpenseDashboard(data);
  }
  catch (err) {
    showToast(
      err?.message ||
      "Gagal memuat data.",
      "error"
    );
  }
}

function loadBudgetBranches() {
  const select = document.getElementById("budgetBranch");
  if (!select) return;
  const branches = state.expenseDashboardData?.branches || [];
  select.innerHTML = "";
  branches.forEach(b => {
    select.innerHTML += `
      <option value="${b.id}">
        ${b.name}
      </option>
    `;
  });

  // DEFAULT = BRANCH LOGIN
  select.value = state.branchId;
  select.disabled = true;
}

document.addEventListener("input",function(e){
	if(e.target.id==="budgetAmount"){
	 const amount = Number(e.target.value||0)
	 	.toLocaleString("id-ID");
	 document.getElementById("budgetPreviewAmount")
	 	.innerText = "Rp " + amount;
	}
	if(e.target.id==="budgetMonth"){
	 const branch = document.getElementById("budgetBranch").value;
	 document.getElementById("budgetPreviewText")
	 	.innerText = `${branch} • ${e.target.value}`;
	}
});

function updateExpenseAIInsight(filteredData) {
  const el =
    document.getElementById(
      "expenseAIInsight"
    );

  if (!el) return;
  const data =
    filteredData ||
    allExpenseData ||
    [];

  if (!data.length) {
    el.innerHTML =
      "Belum ada data pengeluaran pada periode yang dipilih.";
    return;
  }

  // TOTAL
  const totalExpense =
    data.reduce(
      (sum, item) =>
        sum + Number(item.amount || 0),
      0
    );

  const transactionCount = data.length;
  const averageExpense =
    transactionCount > 0
      ? totalExpense /
        transactionCount
      : 0;

  // CATEGORY
  const categories = {};
  data.forEach(item => {
    const category =
      item.category?.trim() ||
      "Lainnya";

    const amount =
      Number(item.amount || 0);

    categories[category] =
      (categories[category] || 0) +
      amount;
  });

  const categoryEntries =
    Object.entries(categories)
      .sort(
        (a, b) =>
          b[1] - a[1]
      );

  const biggestCategory =
    categoryEntries[0];

  // BIGGEST EXPENSE
  const biggestExpense =
    [...data]
      .sort(
        (a, b) =>
          Number(b.amount || 0) -
          Number(a.amount || 0)
      )[0];

  // PAYMENT METHOD
  const paymentMethods = {};
  data.forEach(item => {
    const method =
      item.paymentMethod?.trim() ||
      "Tidak diketahui";

    paymentMethods[method] =
      (paymentMethods[method] || 0) +
      1;
  });

  const dominantPayment =
    Object.entries(paymentMethods)
      .sort(
        (a, b) =>
          b[1] - a[1]
      )[0];

  // BUDGET
  let budgetPercentage = null;
  let budgetStatus = "";
  if (Number(expenseBudget) > 0) {
    budgetPercentage =
      (
        totalExpense /
        Number(expenseBudget)
      ) * 100;

    if (
      budgetPercentage >= 100
    ) {
      budgetStatus =
        `Budget sudah terpakai <b>${budgetPercentage.toFixed(0)}%</b> dan telah melewati batas.`;
    } else if (
      budgetPercentage >= 80
    ) {
      budgetStatus =
        `Budget sudah terpakai <b>${budgetPercentage.toFixed(0)}%</b> dan mulai mendekati batas.`;
    } else {
      budgetStatus =
        `Budget baru terpakai <b>${budgetPercentage.toFixed(0)}%</b>.`;
    }
  }

  // RINGKASAN
  let insight =
    `Terdapat <b>${transactionCount}</b> transaksi ` +
    `dengan total pengeluaran ` +
    `<b>Rp ${totalExpense.toLocaleString("id-ID")}</b>.`;

  // KATEGORI TERBESAR
  if (biggestCategory) {
    const categoryPercentage =
      totalExpense > 0
        ? (
            biggestCategory[1] /
            totalExpense
          ) * 100
        : 0;

    insight +=
      ` Kategori terbesar adalah ` +
      `<b>${biggestCategory[0]}</b> ` +
      `sebesar <b>Rp ${biggestCategory[1].toLocaleString("id-ID")}</b> ` +
      `(${categoryPercentage.toFixed(0)}% dari total).`;
  }

  // PENGELUARAN TERBESAR
  if (biggestExpense) {

    const biggestAmount =
      Number(
        biggestExpense.amount || 0
      );

    const biggestPercentage =
      totalExpense > 0
        ? (
            biggestAmount /
            totalExpense
          ) * 100
        : 0;

    insight +=
      ` Pengeluaran individual terbesar adalah ` +
      `<b>${biggestExpense.description || "Tanpa deskripsi"}</b> ` +
      `sebesar <b>Rp ${biggestAmount.toLocaleString("id-ID")}</b>.`;

    // MASUKAN PENGELUARAN BESAR
    if (
      biggestPercentage >= 30
    ) {

      insight +=
        ` <b>Masukan:</b> Pengeluaran tersebut ` +
        `menyumbang sekitar <b>${biggestPercentage.toFixed(0)}%</b> ` +
        `dari total pengeluaran. Sebaiknya periksa apakah biaya ini ` +
        `bersifat rutin, penting, atau masih dapat dioptimalkan.`;
    }
  }

  // MASUKAN KATEGORI
  if (biggestCategory) {

    const categoryPercentage =
      totalExpense > 0
        ? (
            biggestCategory[1] /
            totalExpense
          ) * 100
        : 0;

    if (
      categoryPercentage >= 50
    ) {

      insight +=
        ` Kategori <b>${biggestCategory[0]}</b> ` +
        `menyumbang lebih dari setengah total pengeluaran. ` +
        `<b>Masukan:</b> Pertimbangkan untuk mengevaluasi ` +
        `komponen biaya pada kategori tersebut.`;

    } else if (
      categoryPercentage >= 35
    ) {

      insight +=
        ` <b>Masukan:</b> Pengeluaran cukup terkonsentrasi ` +
        `pada kategori <b>${biggestCategory[0]}</b>. ` +
        `Kategori ini layak menjadi prioritas evaluasi.`;
    }
  }

  // BUDGET INSIGHT
  if (
    budgetPercentage !== null
  ) {

    if (
      budgetPercentage >= 100
    ) {

      insight +=
        ` <b>Masukan:</b> Pengeluaran sudah melewati ` +
        `budget. Prioritaskan evaluasi terhadap pengeluaran ` +
        `yang tidak mendesak sebelum menambah biaya baru.`;

    } else if (
      budgetPercentage >= 80
    ) {

      insight +=
        ` <b>Masukan:</b> Penggunaan budget sudah cukup tinggi. ` +
        `Sebaiknya pantau pengeluaran berikutnya agar ` +
        `tidak melewati batas.`;

    } else if (
      budgetPercentage <= 50
    ) {

      insight +=
        ` <b>Masukan:</b> Penggunaan budget masih relatif rendah, ` +
        `sehingga ruang pengeluaran masih cukup tersedia.`;
    }
  }

  // POLA TRANSAKSI
  if (
    transactionCount >= 20 &&
    averageExpense < 100000
  ) {

    insight +=
      ` <b>Masukan:</b> Jumlah transaksi pengeluaran cukup banyak ` +
      `dengan nilai rata-rata relatif kecil. ` +
      `Periksa pengeluaran kecil yang berulang karena ` +
      `akumulasinya dapat menjadi signifikan.`;

  } else if (
    transactionCount <= 5 &&
    averageExpense > 1000000
  ) {
    insight +=
      ` <b>Masukan:</b> Jumlah transaksi relatif sedikit, ` +
      `tetapi nilai rata-ratanya cukup besar. ` +
      `Sebaiknya berikan perhatian khusus pada setiap ` +
      `pengeluaran bernilai tinggi.`;
  }

  // PAYMENT METHOD
  if (dominantPayment) {
    const paymentPercentage =
      (
        dominantPayment[1] /
        transactionCount
      ) * 100;

    if (
      paymentPercentage >= 70
    ) {

      insight +=
        ` Sebagian besar transaksi menggunakan ` +
        `<b>${dominantPayment[0]}</b> ` +
        `(${paymentPercentage.toFixed(0)}% dari transaksi).`;
    }
  }

  // KONDISI NORMAL
  if (
    budgetPercentage !== null &&
    budgetPercentage < 80 &&
    (!biggestCategory ||
      (
        biggestCategory[1] /
        totalExpense
      ) < 0.5)
  ) {

    insight +=
      ` <b>Masukan:</b> Pola pengeluaran saat ini ` +
      `masih terlihat cukup terkendali. ` +
      `Pertahankan pemantauan terutama pada kategori ` +
      `dengan pertumbuhan biaya paling tinggi.`;
  }

  // STATUS BUDGET
  if (budgetStatus) {
    insight +=
      ` ${budgetStatus}`;
  }

  // RENDER
  el.innerHTML =
    insight;
}

async function saveExpenseBudget() {
  const branchId = state.branchId;
  if (!branchId) {
    showToast(
      "Branch belum tersedia.",
      "error"
    );
    return;
  }

  const payload = {
    branchId: branchId,
    Month:
      document.getElementById(
        "budgetMonth"
      ).value,

    Budget:
      Number(
        document.getElementById(
          "budgetAmount"
        ).value
      )
  };

  try {

    await saveExpenseBudgetRPC(
      payload
    );
    closeBudgetModal();
    state.expenseDashboardData = null;
    state.expenseDashboardFilter = null;
    await loadExpenseDashboard();
    showToast(
      "Budget berhasil disimpan."
    );
  }

  catch (err) {
    showToast(
      err?.message ||
      "Gagal menyimpan budget.",
      "error"
    );
  }
}

function getCurrentMonthKey() {
  return new Date().toISOString().slice(0, 7);
}

let expenseData = [];
function renderExpenseTable(data) {
  expenseData = data;
  const table = document.getElementById("expenseTableBody");

  if (!table) return;
  table.innerHTML = "";
  if (!data.length) {
    table.innerHTML = `
      <tr>
        <td colspan="7" class="text-center py-10 text-muted">
          No expense data
        </td>
      </tr>
    `;
    return;
  }

  data.forEach((item, index) => {
    const amount = Number(item.amount || 0);
    const statusColor =
      item.status === "Paid"
        ? "text-on-surface"
        : item.status === "Pending"
        ? "text-secondary"
        : "text-error";

    table.innerHTML += `
      <tr class="border-b border-outline-variant hover:bg-outline-variant transition-colors">
        <td class="px-8 py-5">
          <p class="font-bold text-on-surface">
            ${formatDate(item.tanggal)}
          </p>

          <p class="text-[10px] text-on-surface-variant mt-0.5">
            ${item.refId || "-"}
          </p>
        </td>

        <td class="px-4 py-5 font-medium text-on-surface">
          ${item.description || "-"}
        </td>

        <td class="px-4 py-5">
          <span class="px-2 py-0.5 text-xs text-on-surface uppercase font-headline font-bold tracking-[0.20em]">
            ${item.category || "-"}
          </span>
        </td>

        <td class="px-4 py-5 text-on-surface-variant">
          ${item.paymentMethod || "-"}
        </td>

        <td class="px-4 py-5 font-bold text-on-surface text-sm">
          Rp ${amount.toLocaleString("id-ID")}
        </td>

        <td class="px-4 py-5">
          <div class="flex items-center gap-1.5 ${statusColor}">
            <span class="w-1.5 h-1.5 rounded-md bg-current"></span>

            <span class="font-bold text-[9px] uppercase tracking-wide">
              ${item.status || "-"}
            </span>
          </div>
        </td>

        <td class="px-8 py-5 text-right">
          <div class="flex justify-end gap-3">
            <button onclick="showExpenseReceipt(${index})"
              class="text-on-surface-variant hover:text-on-surface transition-colors">
              <span class="material-symbols-outlined text-lg">
                receipt_long
              </span>
            </button>

            <button onclick="showExpenseMenu(event, ${index})"
              class="text-on-surface-variant hover:text-white transition-colors">
              <span class="material-symbols-outlined text-lg">
                more_vert
              </span>
            </button>
          </div>
        </td>
      </tr>
    `;
  });
  document.getElementById("expenseTableInfo").innerText =
    `Showing ${data.length} Ledger Entries`;
}

function showExpenseReceipt(index) {
    const expense = expenseData[index];
    if (!expense) return;
    let modal = document.getElementById("expense-receipt-modal");
    if (!modal) {
        const template = document.getElementById("expense-receipt-modal-template");
        document.body.appendChild(template.content.cloneNode(true));
        modal = document.getElementById("expense-receipt-modal");
    }
    // Isi Data
    document.getElementById("receipt-ref").textContent = expense.refId || "-";
    document.getElementById("receipt-date").textContent = formatDate(expense.tanggal);
    document.getElementById("receipt-category").textContent =  expense.category || "-";
    document.getElementById("receipt-description").textContent =  expense.description || "-";
    document.getElementById("receipt-payment").textContent = expense.paymentMethod || "-";
    document.getElementById("receipt-branch").textContent = expense.outlet || "-";
    document.getElementById("receipt-user").textContent = expense.createdBy || "-";
    document.getElementById("receipt-amount").textContent = formatCurrency(expense.amount || 0);
    // Status
    const status = document.getElementById("receipt-status");
    status.textContent = expense.status || "-";
    status.className = "px-4 py-1 rounded-md text-sm font-semibold";
    switch ((expense.status || "").toLowerCase()) {
        case "paid":
            status.classList.add(
                "bottom-theme",
                "text-on-surface-400"
            );
            break;
        case "pending":
            status.classList.add(
                "bg-yellow-500",
                "text-yellow-400"
            );
            break;

        case "void":
            status.classList.add(
                "bg-red-500",
                "text-red-400"
            );
            break;
        default:
            status.classList.add(
                "bg-gray-500/20",
                "text-gray-400"
            );
            break;
    }
    modal.classList.remove("hidden");
    modal.classList.add("flex");
}

function closeExpenseReceipt() {
    const modal = document.getElementById("expense-receipt-modal");
    if (!modal) return;
    modal.classList.remove("flex");
    modal.classList.add("hidden");
}

let selectedExpenseIndex = null;
function showExpenseMenu(event, index) {
    event.stopPropagation();
    selectedExpenseIndex = index;
    let modal = document.getElementById("expense-action-modal");
    if (!modal) {
        const template = document.getElementById("expenseActionModalTemplate");
        document.body.appendChild(template.content.cloneNode(true));
        modal = document.getElementById("expense-action-modal");
    }
    modal.classList.remove("hidden");
    modal.classList.add("flex");
}

function closeExpenseMenu() {
    const modal = document.getElementById("expense-action-modal");
    if (!modal) return;
    modal.remove();
}

function showExpenseStatusModal(expense) {
    let modal = document.getElementById("expense-status-modal");
    if (!modal) {
        const template = document.getElementById("expenseStatusModalTemplate");
        document.body.appendChild(template.content.cloneNode(true));
        modal = document.getElementById("expense-status-modal");
    }

    document.getElementById("expenseStatusRef").textContent = expense.refId;
    document.getElementById("expenseCurrentStatus").textContent = expense.status;
    document.getElementById("expenseNewStatus").value = expense.status;
    modal.classList.remove("hidden");
    modal.classList.add("flex");
}

async function saveExpenseStatus() {
  const expense = expenseData[selectedExpenseIndex];
  if (!expense) return;
  const newStatus =
    document.getElementById(
      "expenseNewStatus"
    ).value;

  if (newStatus === expense.status) {
    showToast(
      "Status tidak berubah.",
      "info"
    );
    return;
  }

  try {
    const res =
      await updateExpenseStatusRPC(
        expense.refId,
        newStatus
      );

    if (!res?.success) {
      showToast(
        res?.message ||
        "Gagal memperbarui status.",
        "error"
      );
      return;
    }

    showToast(
      "Status berhasil diperbarui.",
      "success"
    );

    closeExpenseStatusModal();
    // CLEAR CACHE
    state.cashFlowData = null;
    state.cashFlowFilter = null;
    state.expenseDashboardData = null;
    state.expenseDashboardFilter = null;
    selectedExpenseIndex = null;
    await loadExpenseDashboard();
  }

  catch (err) {
    showToast(
      err?.message ||
      "Gagal memperbarui status.",
      "error"
    );
  }
}
	
function closeExpenseStatusModal() {
    const modal = document.getElementById("expense-status-modal");
    if (!modal) return;
    modal.remove();
}

function openExpenseStatusModal() {
    const expense = expenseData[selectedExpenseIndex];
    if (!expense) return;
    closeExpenseMenu();
    showExpenseStatusModal(expense);
}

function viewExpenseAttachment() {
	const expense = expenseData[selectedExpenseIndex];
	if (!expense) return;
	closeExpenseMenu();
	let modal =
			document.getElementById(
					"expense-attachment-modal"
			);
	if (!modal) {
			const template = document.getElementById("expenseAttachmentModalTemplate");
			document.body.appendChild(template.content.cloneNode(true));
			modal = document.getElementById("expense-attachment-modal");
	}
	const ref = document.getElementById("attachmentRef");
	if (ref) {
			ref.textContent =
					expense.refId || "-";
	}
	const file = document.getElementById("expenseAttachmentFile");
	if (file) {
			if (expense.Attachment_URL) {
					file.innerHTML = `
					<a href="${expense.Attachment_URL}"
					target="_blank"
					class="flex items-center gap-3 p-4 rounded-md bg-background-high hover:bg-outline-variant/10 transition">
							<span class="material-symbols-outlined text-on-surface">
									description
							</span>

							<span class="text-xs lg:text-sm text-on-surface">
									Open Attachment
							</span>
					</a>
					`;
			} else {
					file.innerHTML = `
					<div class="p-4 rounded-md bg-background-high text-xs lg:text-sm text-on-surface-variant text-center">
							No attachment available
					</div>
					`;
			}
	}
	modal.classList.remove("hidden");
	modal.classList.add("flex");
}

function closeExpenseAttachmentModal(){
    const modal = document.getElementById("expense-attachment-modal");
    if(!modal) return;
    modal.remove();
}

function openExpenseAttachmentFile() {
    const expense = expenseData[selectedExpenseIndex];
    if (!expense) return;
    closeExpenseAttachmentModal();
    let modal =
        document.getElementById(
            "expense-view-attachment-modal"
        );

    if (!modal) {
        const template = document.getElementById("expenseViewAttachmentModalTemplate");
        document.body.appendChild(template.content.cloneNode(true));
        modal = document.getElementById("expense-view-attachment-modal");
    }
    document.getElementById("viewAttachmentRef").textContent = expense.refId || "-";
    const fileName =
        expense.Attachment_URL
        ? expense.Attachment_URL.split("/").pop()
        : "Unknown File";
    document.getElementById(
        "viewAttachmentName"
    ).textContent =
        fileName;
    const preview =document.getElementById("viewAttachmentPreview");
    if (!expense.Attachment_URL) {
        preview.innerHTML = `
            <div class="text-center">
							<span class="material-symbols-outlined text-6xl text-outline/50">
									description
							</span>
			
							<p class="mt-3 text-on-surface-variant">
									No attachment available
							</p>
            </div>
        `;
    } else {
        preview.innerHTML = `
          <div class="p-6 rounded-md bg-background-high text-center space-y-4">
						<span class="material-symbols-outlined text-6xl text-on-surface">
								picture_as_pdf
						</span>
			
						<div>
							<p class="font-semibold text-on-surface">
									PDF Document
							</p>
			
							<p class="text-xs text-on-surface-variant mt-1">
									${expense.Attachment_URL.split("/").pop()}
							</p>
						</div>

						<a href="${expense.Attachment_URL}"
						target="_blank"
						class="inline-flex items-center justify-center gap-2 px-6 h-11 bg-background bottom-theme border border-white/5 rounded-md  font-bold text-on-surface">

								<span class="material-symbols-outlined">
										open_in_new
								</span>
								Open PDF
						</a>
				</div>
       `;
    }
    modal.classList.remove("hidden");
    modal.classList.add("flex");
}

function closeExpenseViewAttachmentModal() {
	const modal = document.getElementById("expense-view-attachment-modal");
	if (!modal) return;
	modal.remove();
}

function downloadExpenseAttachment() {
    const expense = expenseData[selectedExpenseIndex];
    if (!expense) return;
    if (!expense.Attachment_URL) {
        showToast(
            "No attachment available.",
            "info"
        );
        return;
    }
    window.open(
        expense.Attachment_URL,
        "_blank"
    );
}

let selectedAttachmentExpenseIndex = null;
function openExpenseAddAttachmentModal() {
    const expense = expenseData[selectedExpenseIndex];
    if (!expense) return;
    selectedAttachmentExpenseIndex = selectedExpenseIndex;
    let modal = document.getElementById("expense-add-attachment-modal");
    if (!modal) {
        const template = document.getElementById("expenseAddAttachmentModalTemplate");
        document.body.appendChild(template.content.cloneNode(true));
        modal = document.getElementById("expense-add-attachment-modal");
    }
    document.getElementById("uploadAttachmentRef").textContent = expense.refId || "-";
    modal.classList.remove("hidden");
    modal.classList.add("flex");
}

function closeExpenseAddAttachmentModal() {
    const modal = document.getElementById("expense-add-attachment-modal");
    if (!modal) return;
    modal.remove();
    selectedAttachmentExpenseIndex = null;
}

function previewExpenseAttachment(event) {
    const file = event.target.files[0];
    if (!file) return;
    // batas 10 MB
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
        showToast(
            "File maksimal 10 MB",
            "error"
        );
        event.target.value = "";
        return;
    }
    document.getElementById("expenseSelectedFile").classList.remove("hidden");
    document.getElementById("expenseFileName").textContent = file.name;
    document.getElementById("expenseFileSize").textContent = formatFileSize(file.size);
}

function formatFileSize(bytes) {
    if (bytes === 0)
        return "0 Bytes";
    const sizes = [
        "Bytes",
        "KB",
        "MB",
        "GB"
    ];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return (Math.round(bytes / Math.pow(1024,i)
        )
        +
        " "
        +
        sizes[i]
    );
}

function removeExpenseAttachment() {

  const input =
    document.getElementById(
      "expenseAttachmentInput"
    );

  if (input) {
    input.value = "";
  }

  const selectedFile =
    document.getElementById(
      "expenseSelectedFile"
    );

  if (selectedFile) {
    selectedFile.classList.add(
      "hidden"
    );
  }
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve(reader.result);
    };

    reader.onerror = () => {
      reject(
        new Error("Gagal membaca file")
      );
    };
    reader.readAsDataURL(file);
  });
}

async function uploadExpenseAttachment() {
  const expense = expenseData[selectedAttachmentExpenseIndex];
	
  if (!expense) {
    showToast(
      "Expense tidak ditemukan",
      "error"
    );
    return;
  }

  const input =
    document.getElementById(
      "expenseAttachmentInput"
    );
  const file =
    input?.files?.[0];

  if (!file) {
    showToast(
      "Pilih file terlebih dahulu",
      "warning"
    );
    return;
  }

  try {
    let base64;
    if (
      file.type === "image/jpeg" ||
      file.type === "image/png" ||
      file.type === "image/webp"
    ) {
  
      const compressed =
        await compressImage(file);
      base64 =
        await fileToBase64(
          compressed
        );
    }

    // PDF
    else if ( file.type === "application/pdf" ) {
      base64 =
        await fileToBase64(
          file
        );
    }

    // FORMAT LAIN
    else {
      throw new Error(
        "Format file tidak didukung. Gunakan PDF, JPG, atau PNG."
      );
    }

    if (!base64) {
      throw new Error(
        "Gagal membaca file"
      );
    }

    // UPLOAD KE VERCEL API
    const response =
      await fetch(
        "/api/handle-expense-attachment",
        {
          method:
            "POST",
          headers: {
            "Content-Type":
              "application/json"
          },

          body:
            JSON.stringify({
              base64,
              branchId: expense.branchId,
              refId: expense.refId,
							tenantSlug: state.tenantSlug
            })
        }
      );

    const result =
      await response.json();

    if (
      !response.ok ||
      !result.success
    ) {

      throw new Error(
        result.error ||
        "Upload attachment gagal"
      );
    }

    // URL HASIL UPLOAD
    const url =
      result.url;

    if (!url) {
      throw new Error(
        "URL attachment tidak ditemukan"
      );
    }
	
    // SIMPAN URL KE OPERATIONS
    await updateExpenseAttachmentRPC({
      Ref_ID:
        expense.refId,
      Attachment_URL:
        url
    });

    // SUCCESS
    showToast(
      "Attachment berhasil disimpan",
      "success"
    );
    closeExpenseAddAttachmentModal();
    state.expenseDashboardData = null;
    state.expenseDashboardFilter = null;
    await loadExpenseDashboard();
		
  }catch (err) {
    showToast(
      err?.message ||
      "Upload attachment gagal",
      "error"
    );
  }
}

function renderOtherIncome() {
  allOtherIncomeData =
    Array.isArray(allOtherIncome)
      ? allOtherIncome.map(item => ({
          ...item,
          date:
            item.date
              ? String(item.date).trim()
              : ""
        }))
      : [];
  filteredOtherIncomeData =
    [...allOtherIncomeData];
  renderOtherIncomeTable();
}

function getOtherIncomeFilters() {
  return {
    keyword: document.getElementById("otherIncomeSearchInput")?.value || "",
    category: document.getElementById("otherIncomeCategoryFilter")?.value || "ALL",
    status: document.getElementById("otherIncomeStatusFilter")?.value || "ALL",
    branch: document.getElementById("otherIncomeBranchFilter")?.value || "ALL",
    startDate: document.getElementById("expenseStartDate")?.value || "",
    endDate: document.getElementById("expenseEndDate")?.value || ""
  };
}

function filterOtherIncomeTable() {
  const f = getOtherIncomeFilters();
  filteredOtherIncomeData = allOtherIncomeData.filter(item => {
    // SEARCH
    const keyword = (f.keyword || "").toLowerCase();
    const text =
      `${item.description || ""}
       ${item.category || ""}
       ${item.refId || ""}
       ${item.notes || ""}
       ${item.method || ""}`
      .toLowerCase();
    const matchSearch =
      !keyword ||
      text.includes(keyword);
    // CATEGORY
    const matchCategory =
      f.category === "ALL" ||
      f.category === "All Categories" ||
      item.category === f.category;
    // STATUS
    const matchStatus =
      f.status === "ALL" ||
      f.status === "All Status" ||
      item.status === f.status;
    // BRANCH
    const matchBranch =
      f.branch === "ALL" ||
      String(item.branchId || "")
        .trim()
        .toUpperCase()
        ===
      String(f.branch || "")
        .trim()
        .toUpperCase();
    // DATE RANGE
    let itemDate = null;
    if (item.date) {
      itemDate =
        new Date(item.date + "T00:00:00");
    }
    const matchStart =
      !f.startDate ||
      (
        itemDate &&
        itemDate >=
        new Date(f.startDate + "T00:00:00")
      );
    const matchEnd =
      !f.endDate ||
      (
        itemDate &&
        itemDate <=
        new Date(f.endDate + "T23:59:59")
      );
    return (
      matchSearch &&
      matchCategory &&
      matchStatus &&
      matchBranch &&
      matchStart &&
      matchEnd
    );
  });
  otherIncomeCurrentPage = 1;
  window.currentOtherIncomeFiltered =
    filteredOtherIncomeData;
  renderOtherIncomeTable();
}

function renderOtherIncomeTable() {
  const tbody = document.getElementById("otherIncomeTableBody");
  if (!tbody) return;
  tbody.innerHTML = "";
  if (!filteredOtherIncomeData.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="text-center py-10 text-muted">
          No other income data
        </td>
      </tr>
    `;
    updateOtherIncomeTableInfo();
    renderOtherIncomePagination();
    return;
  }
  const start = (otherIncomeCurrentPage - 1) * otherIncomeRowsPerPage;
  const end = start + otherIncomeRowsPerPage;
  const rows = filteredOtherIncomeData.slice(start, end);
  rows.forEach(item => {
    tbody.innerHTML += `
      <tr class="border border-outline-variant hover:bg-outline-variant transition-colors">
        <td class="px-8 py-5">
          <p class="font-bold text-on-surface">
            ${formatDate(item.date)}
          </p>

          <p class="text-[10px] text-on-surface-variant mt-0.5">
            ${item.refId}
          </p>
        </td>

        <td class="px-4 py-5 font-medium text-on-surface">
          ${item.description || "-"}
        </td>

        <td class="px-4 py-5">
          <span class="px-2 py-0.5 text-on-surface rounded-md text-xs uppercase tracking-widest font-headline font-bold tracking-[0.20em]">
            ${item.category}
          </span>
        </td>

        <td class="px-4 py-5 text-on-surface-variant">
          ${item.method}
        </td>

        <td class="px-4 py-5 font-bold text-on-surface text-sm">
          ${formatRupiah(item.amount)}
        </td>

        <td class="px-4 py-5">
          ${renderOtherIncomeStatus(item.status)}
        </td>

        <td class="px-8 py-5 text-right">
          <div class="flex justify-end gap-3">
            <button onclick="viewOtherIncome('${item.refId}')"
            	class="text-on-surface-variant hover:text-on-surface hover:scale-110 transition-all">
                <span class="material-symbols-outlined text-lg">
                    receipt_long
                </span>
            </button>

            <!-- CHANGE STATUS -->
            <button onclick="editOtherIncomeStatus('${item.refId}')"
            class="text-on-surface-variant hover:text-amber-400 hover:scale-110 transition-all">
                <span class="material-symbols-outlined text-lg">
                    edit
                </span>
            </button>
          </div>
        </td>
      </tr>
    `;
  });
  updateOtherIncomeTableInfo();
  renderOtherIncomePagination();
}

function renderOtherIncomeStatus(status) {
  const map = {
    Paid: {
      color: "white"
    },
    Pending: {
      color: "primary"
    },
    Void: {
      color: "error"
    },
    Cancelled: {
      color: "error"
    }

  };
  const config =
    map[status] || map.Pending;
  return `
    <div class="flex items-center gap-1.5 text-${config.color}">
      <span class="w-1.5 h-1.5 rounded-md bg-${config.color}"></span>

      <span class="font-bold text-[9px] uppercase tracking-wide">
        ${status}
      </span>
    </div>
  `;
}

function renderOtherIncomePagination() {
  const wrapper =
    document.getElementById("otherIncomePagination");
  if (!wrapper) return;
  wrapper.innerHTML = "";
  const totalPages =
    Math.ceil(filteredOtherIncomeData.length / otherIncomeRowsPerPage);
  wrapper.innerHTML += `
    <button onclick="changeOtherIncomePage(-1)"
      class="w-8 h-8 rounded-md flex items-center justify-center transition-colors">

      <span class="material-symbols-outlined text-sm">
        chevron_left
      </span>
    </button>
  `;

  for (let i = 1; i <= totalPages; i++) {

    wrapper.innerHTML += `
      <button onclick="goToOtherIncomePage(${i})"
        class=" w-8 h-8 rounded-md flex items-center justify-center text-xs font-bold
          ${i === otherIncomeCurrentPage
            ? "text-on-surface"
            : "text-on-surface-variant hover:text-on-surface"}">
        ${i}
      </button>
    `;
  }

  wrapper.innerHTML += `
    <button onclick="changeOtherIncomePage(1)"
      class="w-8 h-8 rounded-md flex items-center justify-center transition-colors">

      <span class="material-symbols-outlined text-sm">
        chevron_right
      </span>
    </button>
  `;
}

function viewOtherIncome(refId) {
    const item =
        filteredOtherIncomeData.find(
            x => x.refId === refId
        );
    if (!item) {
        showToast(
            "Data tidak ditemukan",
            "error"
        );
        return;
    }
    let modal =
        document.getElementById(
            "other-income-detail-modal"
        );
    if (!modal) {
        const template =
            document.getElementById(
                "otherIncomeDetailModalTemplate"
            );
        document.body.appendChild(
            template.content.cloneNode(true)
        );
        modal =
            document.getElementById(
                "other-income-detail-modal"
            );
    }
    document.getElementById("otherIncomeDetailRef").textContent = item.refId || "-";
    document.getElementById("otherIncomeDetailDescription").textContent = item.description || "-";
    document.getElementById("otherIncomeDetailCategory").textContent = item.category || "-";
    document.getElementById("otherIncomeDetailAmount").textContent = formatRupiah(item.amount);
    document.getElementById("otherIncomeDetailMethod").textContent = item.method || "-";
    document.getElementById("otherIncomeDetailDate").textContent = formatDate(item.date);
    document.getElementById("otherIncomeDetailNotes").textContent = item.notes || "-";
    document.getElementById("otherIncomeDetailStatus").innerHTML = renderOtherIncomeStatus(item.status);
    modal.classList.remove("hidden");
    modal.classList.add("flex");
}

function closeOtherIncomeDetailModal(){
    const modal =
        document.getElementById(
            "other-income-detail-modal"
        );
    if (!modal) return;
    modal.remove();
}

function editOtherIncomeStatus(refId) {
    const item =
        allOtherIncomeData.find(
            x => x.refId === refId
        );
    if (!item) {
        showToast("Data tidak ditemukan","error");
        return;
    }
    selectedOtherIncome = item;
    let modal =
        document.getElementById(
            "edit-other-income-status-modal"
        );
    if (!modal) {
        const template =
            document.getElementById(
                "editOtherIncomeStatusTemplate"
            );
        document.body.appendChild(
            template.content.cloneNode(true)
        );
        modal =
            document.getElementById(
                "edit-other-income-status-modal"
            );
    }
    document.getElementById(
        "editOtherIncomeRef"
    ).textContent =
        item.refId;
    document.getElementById(
        "editOtherIncomeStatus"
    ).value =
        item.status || "Pending";
    modal.classList.remove("hidden");
    modal.classList.add("flex");
}

function closeOtherIncomeStatusModal(){
    const modal =
			document.getElementById(
					"edit-other-income-status-modal"
        );
    if(modal){
			modal.classList.add("hidden");
			modal.classList.remove("flex");
    }
}	

async function saveOtherIncomeStatus() {
  if (!selectedOtherIncome) {
    showToast(
      "Data tidak ditemukan",
      "error"
    );
    return;
  }

  const status =
    document.getElementById(
      "editOtherIncomeStatus"
    )?.value;

  if (!status) {
    showToast(
      "Status tidak dipilih",
      "warning"
    );
    return;
  }

  try {

    const res =
      await updateOtherIncomeStatusRPC(
        selectedOtherIncome.refId,
        status
      );

    if (
      res &&
      res.success === false
    ) {
      throw new Error(
        res.message ||
        "Gagal mengubah status"
      );
    }

    showToast(
      "Status berhasil diubah",
      "success"
    );

    // CLEAR CASH FLOW CACHE
    state.cashFlowData = null;
    state.cashFlowFilter = null;
    closeOtherIncomeStatusModal();
    state.expenseDashboardData = null;
    state.expenseDashboardFilter = null;
    await loadExpenseDashboard();
  }
  catch (err) {
    showToast(
      err.message ||
      "Gagal mengubah status",
      "error"
    );
  }
}

function changeOtherIncomePage(direction) {
  const totalPages =
    Math.ceil(filteredOtherIncomeData.length / otherIncomeRowsPerPage);
  otherIncomeCurrentPage += direction;
  if (otherIncomeCurrentPage < 1)
    otherIncomeCurrentPage = 1;
  if (otherIncomeCurrentPage > totalPages)
    otherIncomeCurrentPage = totalPages;
  renderOtherIncomeTable();
}

function goToOtherIncomePage(page) {
  otherIncomeCurrentPage = page;
  renderOtherIncomeTable();
}

function updateOtherIncomeTableInfo() {
  const el = document.getElementById("otherIncomeTableInfo");
  if (!el) return;
  const total = filteredOtherIncomeData.length;
  const start =
    total === 0
      ? 0
      : ((otherIncomeCurrentPage - 1) * otherIncomeRowsPerPage) + 1;
  const end =
    Math.min(
      otherIncomeCurrentPage * otherIncomeRowsPerPage,
      total
    );
  el.innerText =
    `Showing ${start} to ${end} of ${total} Ledger Entries`;
}

function loadOtherIncomeBranches(
  selectId = "otherIncomeBranchFilter"
) {
  const select =
    document.getElementById(selectId);

  if (!select) return;
  select.innerHTML = "";
  const branches =
    state.expenseDashboardData
      ?.branches || [];

  branches.forEach(b => {
    select.innerHTML += `
      <option value="${b.id}">
        ${b.name}
      </option>
    `;
  });

  // DEFAULT = BRANCH LOGIN
  select.value = state.branchId;
  select.disabled = true;
}

function initOtherIncomeEvents() {
  document.getElementById("otherIncomeSearchInput")
    ?.addEventListener(
      "input",
      filterOtherIncomeTable
    );
  document.getElementById("otherIncomeCategoryFilter")
    ?.addEventListener(
      "change",
      filterOtherIncomeTable
    );
  document.getElementById("otherIncomeStatusFilter")
    ?.addEventListener(
      "change",
      filterOtherIncomeTable
    );
  document.getElementById("otherIncomeBranchFilter")
    ?.addEventListener(
      "change",
      filterOtherIncomeTable
    );
  document.getElementById("expenseStartDate")
    ?.addEventListener(
      "change",
      filterOtherIncomeTable
    );
  document.getElementById("expenseEndDate")
    ?.addEventListener(
      "change",
      filterOtherIncomeTable
    );
}

function closeAddNewOtherIncome() {
  document
    .getElementById("addNewOtherIncomeWrapper")
    ?.remove();
}

function renderCategoryBreakdown(data = allExpenseData) {
  const map = {};

  data.forEach(item => {
    const status =
      item.status ||
      item.Status;

    if (
      String(status)
        .trim()
        .toUpperCase() !== "PAID"
    ) return;

    const amount = Number(
      item.amount ||
      item.Amount ||
      0
    );

    const category =
      item.category ||
      item.Category ||
      "Other";

    map[category] =
      (map[category] || 0) + amount;
  });

  const total =
    Object.values(map)
      .reduce(
        (a, b) => a + b,
        0
      );

  const result =
    Object.keys(map).map(cat => ({
      name: cat,
      amount: map[cat],
      percent:
        total > 0
          ? (map[cat] / total) * 100
          : 0
    }));

  drawCategory(result);
}

function drawCategory(data) {
  const container =
    document.querySelector("#categoryBreakdown");
  if (!container) return;
  container.innerHTML = "";
  if (!Array.isArray(data) || data.length === 0) {
    container.innerHTML =
    `<div class="text-sm text-gray-400">
      No data
    </div>`;
    return;
  }

  container.innerHTML =
  data.map(item => `
    <div class="space-y-2">
      <div class="flex justify-between text-sm">
        <span class="font-medium">
          ${item.name}
        </span>

        <span>
          ${Number(item.percent).toFixed(1)}%
        </span>
      </div>
      <div class="h-2 w-full bg-outline-variant rounded-md">
        <div
          class="h-full bg-primary rounded-md"
          style="width:${item.percent}%">
        </div>
      </div>
    </div>
  `).join("");
}


function filterExpenseTable() {
  const f = getExpenseFilters();
  const filtered =
    allExpenseData.filter(item => {
      // BRANCH
      const itemBranch =
        String(
          item.branchId || ""
        )
        .trim()
        .toUpperCase();

      const filterBranch =
        String(
          f.branch || ""
        )
        .trim()
        .toUpperCase();

      const matchBranch =
        filterBranch === "ALL" ||
        !filterBranch ||
        itemBranch === filterBranch;

      // SEARCH
      const keyword =
        String(
          f.keyword || ""
        )
        .trim()
        .toLowerCase();

      const text =
        `${item.description || ""}
         ${item.category || ""}
         ${item.refId || ""}`
        .toLowerCase();

      const matchSearch =
        !keyword ||
        text.includes(keyword);

      // CATEGORY
      const matchCategory =
        f.category === "All Categories" ||
        String(
          item.category || ""
        ).trim() ===
        String(
          f.category || ""
        ).trim();

      // STATUS
      const matchStatus =
        f.status === "All Status" ||
        String(
          item.status || ""
        )
        .trim()
        .toUpperCase() ===
        String(
          f.status || ""
        )
        .trim()
        .toUpperCase();
      // DATE
      const itemDate =
        item.tanggal
          ? new Date(item.tanggal)
          : null;

      const matchStart =
        !f.startDate ||
        (
          itemDate &&
          !isNaN(itemDate) &&
          itemDate >=
            new Date(
              `${f.startDate}T00:00:00`
            )
        );

      const matchEnd =
        !f.endDate ||
        (
          itemDate &&
          !isNaN(itemDate) &&
          itemDate <=
            new Date(
              `${f.endDate}T23:59:59.999`
            )
        );

      return (
        matchBranch &&
        matchSearch &&
        matchCategory &&
        matchStatus &&
        matchStart &&
        matchEnd
      );
    });

  currentPage = 1;
  window.currentFilteredData = filtered;
  paginate(filtered);
  updateExpenseKPIs(filtered);
	updateExpenseAIInsight(filtered);
  setTimeout(() => {
    renderCategoryBreakdown(filtered);
  }, 50);
}
	
function updateExpenseKPIs(data = [], budget = null) {
  if (budget === null) {
    budget = expenseBudget || 0;
  }
  const branchId = state?.branchId;
  const filteredData = data.filter(item =>
    String(item.branchId || "").trim() === String(branchId || "").trim()
  );
  let totalExpense = 0;
  const categoryMap = {};
  filteredData.forEach(item => {
    const status = item.status || item.Status;
    // hanya hitung yang sudah dibayar
    if (status !== "Paid") return;
    const amount = Number(
      item.amount || item.Amount || 0
    );
    totalExpense += amount;
    const cat =
      item.category || item.Category || "Other";
    categoryMap[cat] =
      (categoryMap[cat] || 0) + amount;
  });

  // TOTAL EXPENSE
  const totalEl = document.getElementById("kpiTotalExpense");
  if (totalEl) {
    totalEl.innerText = `IDR ${totalExpense.toLocaleString("id-ID")}`;
  }
  // LARGEST CATEGORY
  let largestCategory = "-";
  let largestAmount = 0;
  for (let cat in categoryMap) {
    if (categoryMap[cat] > largestAmount) {
      largestAmount = categoryMap[cat];
      largestCategory = cat;
    }
  }
  const catEl = document.getElementById("kpiLargestCategory");
  const catAmtEl = document.getElementById("kpiLargestCategoryAmount");
  if (catEl) catEl.innerText = largestCategory;
  if (catAmtEl) catAmtEl.innerText = `IDR ${largestAmount.toLocaleString("id-ID")}`;
  // BUDGET FLOW
  const currentBudget =
    Number(budget || 0);
  const remaining =
    currentBudget - totalExpense;
    // USED % (TOTAL vs BUDGET)
    const usedPercent = currentBudget > 0
      ? (totalExpense / currentBudget) * 100
      : 0;
    const safeUsed = Math.max(0, Math.min(100, usedPercent));
    // REMAINING % (SUDAH PUNYA)
    const remainPercent = currentBudget > 0
      ? (remaining / currentBudget) * 100
      : 0;
    const safeRemain = Math.max(0, Math.min(100, remainPercent));
    //  CARD 1: TOTAL vs BUDGET
    const budgetTotalEl = document.getElementById("kpiBudgetTotal");
    if (budgetTotalEl) {
      budgetTotalEl.innerText = `/ IDR ${currentBudget.toLocaleString("id-ID")}`;
    }
    const usedBar = document.getElementById("kpiBudgetBar");
    if (usedBar) {
      usedBar.style.width = `${safeUsed}%`;
    }
    const utilText = document.getElementById("kpiBudgetUtilizedText");
    if (utilText) {
      utilText.innerText = `${safeUsed.toFixed(1)}% Budget Utilized`;
    }
    //  CARD 2: BUDGET REMAINING (JANGAN DIUBAH LOGICNYA)
    const percentEl = document.getElementById("kpiRemainingPercent");
    const remainEl = document.getElementById("kpiRemainingAmount");
    if (percentEl) {
      percentEl.innerText = `${safeRemain.toFixed(0)}%`;
    }
    if (remainEl) {
      remainEl.innerText = `IDR ${remaining.toLocaleString("id-ID")}`;
    }
    const remainBar = document.getElementById("expenseBudgetBar");
    if (remainBar) {
      remainBar.style.width = `${safeRemain}%`;
    }

    // MONTH LABEL
    const monthLabel = document.getElementById("kpiBudgetMonthLabel");
    if (monthLabel) {
      const monthName = new Date().toLocaleString("en-US", {
        month: "short"
      });
      monthLabel.innerText = `Left for ${monthName}`;
    }
    // TREND (bulan ini vs bulan lalu)
    const now = new Date();
    // FIX SAFE MONTH KEY (anti bug timezone)
    const thisMonth =
      `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const lastMonthCalc =
      now.getMonth() === 0
        ? { y: now.getFullYear() - 1, m: 12 }
        : { y: now.getFullYear(), m: now.getMonth() };
    const lastMonth =
      `${lastMonthCalc.y}-${String(lastMonthCalc.m).padStart(2, "0")}`;
    let thisMonthTotal = 0;
    let lastMonthTotal = 0;

    filteredData.forEach(item => {
      const amount = Number(item.amount || 0);
      let itemMonth = "";
      if (item.tanggal instanceof Date) {
        itemMonth = item.tanggal.toISOString().slice(0, 7);
      } else if (typeof item.tanggal === "string") {
        itemMonth = item.tanggal.slice(0, 7);
      }
      if (itemMonth === thisMonth) thisMonthTotal += amount;
      if (itemMonth === lastMonth) lastMonthTotal += amount;
    });

  // TREND LOGIC (ANTI FAKE 100%)
  let trend = 0;
  if (thisMonthTotal === 0 && lastMonthTotal === 0) {
    trend = 0;
  } 
  else if (lastMonthTotal === 0) {
    trend = 0; // jangan paksa 100% biar gak misleading
  } 
  else {
    trend = ((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100;
  }
  const safeTrend = isFinite(trend) ? trend : 0;
  // UI UPDATE
  const trendWrapper = document.getElementById("kpiExpenseTrend");
  const trendValue = document.getElementById("kpiExpenseTrendValue");
  const trendIcon = document.getElementById("kpiExpenseTrendIcon");
  if (trendValue) {
    trendValue.innerText = `${Math.abs(safeTrend).toFixed(1)}%`;
  }
  if (trendWrapper) {
    if (safeTrend >= 0) {
      trendWrapper.classList.add("text-error");
      trendWrapper.classList.remove("text-on-surface");
    } else {
      trendWrapper.classList.add("text-on-surface");
      trendWrapper.classList.remove("text-error");
    }
  }
  if (trendIcon) {
    trendIcon.innerText = safeTrend >= 0 ? "arrow_upward" : "arrow_downward";
  }
}


function loadExpenseBranches(selectId = "expenseBranchFilter") {
  const select =
    document.getElementById(selectId);
  if (!select) return;
  const branches = state.expenseDashboardData?.branches || [];
  select.innerHTML = "";
  branches.forEach(b => {
    select.innerHTML += `
      <option value="${b.id}">
        ${b.name}
      </option>
    `;
  });
  // DEFAULT = BRANCH LOGIN
  select.value = state.branchId;
  select.disabled = true;
}

let selectedExpenseMethod = "Cash";
function openAddExpensePopup() {
  // hapus dulu kalau popup lama masih ada
  document.getElementById("expensePopupWrapper")?.remove();
  const template = document.getElementById("addnewexpenses");
  if (!template) return;
  const clone = template.content.cloneNode(true);
  const wrapper = document.createElement("div");
  wrapper.id = "expensePopupWrapper";
  wrapper.appendChild(clone);
  document.body.appendChild(wrapper);
  // default payment method
  selectExpenseMethod("Cash");
  loadExpenseBranches("expenseBranchSelect");
  // ambil select branch
  const branchSelect = wrapper.querySelector("#expenseBranchSelect");
  if (branchSelect) {
    branchSelect.value = state.branchId;
    branchSelect.disabled = true;
  }
  // tombol close
  const closeBtn = wrapper.querySelector("#btnCloseExpensePopup");
  if (closeBtn) {
    closeBtn.addEventListener("click", closeAddExpensePopup);
  }
  // tombol save
  const saveBtn = wrapper.querySelector("#btnSaveExpense");
  if (saveBtn) {
    saveBtn.addEventListener("click", saveExpense);
  }
}

function selectExpenseMethod(method) {
  selectedExpenseMethod = method;
  const buttons = [
    "expenseMethodCash",
    "expenseMethodBank",
    "expenseMethodQris"
  ];

  buttons.forEach(id => {
    document
      .getElementById(id)
      .classList.remove(
        "bg-outline-variant",
        "text-on-surface",
        "shadow-sm",
        "rounded-md"
      );
  });

  let activeId = "";
  if (method === "Cash")
    activeId = "expenseMethodCash";
  if (method === "Bank Transfer")
    activeId = "expenseMethodBank";
  if (method === "QRIS")
    activeId = "expenseMethodQris";
  document
    .getElementById(activeId)
    .classList.add(
      "bg-outline-variant",
      "text-on-surface",
      "shadow-sm",
      "rounded-md"
    );
}

function closeAddExpensePopup() {
  document.getElementById("expensePopupWrapper")?.remove();
}
	
async function saveExpense() {
  const branchSelect = document.getElementById("expenseBranchSelect");
  if (!branchSelect) {
    showToast(
      "Branch tidak ditemukan",
      "error"
    );
    return;
  }

  const data = {
    branchId: branchSelect.value,
    tanggal:
      document.getElementById(
        "expenseDate"
      )?.value || "",
    category:
      document.getElementById(
        "expenseCategory"
      )?.value || "",
    description:
      document.getElementById(
        "expenseTitle"
      )?.value || "",
    amount:
      Number(
        (
          document.getElementById(
            "expenseAmount"
          )?.value || "0"
        ).replace(/[^\d]/g, "")
      ),
    method: selectedExpenseMethod,
    createdBy: state.userName || "Admin",
    type: "Expense",
    outlet:
      branchSelect.options[
        branchSelect.selectedIndex
      ]?.text || "",
    status: "Paid"
  };

  try {
    // SUPABASE RPC
    const res = await addExpenseRPC(data);
    if (
      res &&
      res.success === false
    ) {
      throw new Error(
        res.message ||
        "Gagal menyimpan expense"
      );
    }

	if (
	  String(data.category || "").trim().toUpperCase() === "ASSET"
	) {
	  clearAssetCache();
	}
	
    state.cashFlowData = null;
    state.cashFlowFilter = null;
    state.expenseDashboardData = null;
    state.expenseDashboardFilter = null;
    await loadExpenseDashboard();
    showToast(
      "Expense berhasil disimpan",
      "success"
    );
  }
  catch (error) {
    const errText =
      error?.message ||
      JSON.stringify(error);

    let message =
      "Gagal menyimpan expense";
    if (
      errText.includes(
        "Saldo Cash tidak mencukupi"
      )
    ) {
      message =
        "Saldo Cash tidak mencukupi";
    }
    else if (
      errText.includes(
        "Saldo Bank tidak mencukupi"
      )
    ) {
      message =
        "Saldo Bank tidak mencukupi";
    }
    else if (errText) {
      message =
        errText;
    }
    showToast(
      message,
      "error"
    );
  }
}

function openAddNewOtherIncome() {
  const template =
    document.getElementById("addneweotherincome");
  const wrapper =
    document.createElement("div");
  wrapper.id =
    "addNewOtherIncomeWrapper";
  wrapper.appendChild(
    template.content.cloneNode(true)
  );

  document.body.appendChild(wrapper);
  loadOtherIncomeBranches(
    "otherIncomeBranch"
  );

  // CATEGORY CHANGE
  const categorySelect =
    document.getElementById(
      "otherIncomeCategory"
    );
  categorySelect.addEventListener(
    "change",
    async function () {
      const category = this.value;
      const assetContainer =
        document.getElementById(
          "otherIncomeAssetContainer"
        );
      const assetSelect =
        document.getElementById(
          "otherIncomeAsset"
        );
      const assetInfo =
        document.getElementById(
          "otherIncomeAssetInfo"
        );
      if (category !== "Asset Sale") {
        assetContainer.classList.add(
          "hidden"
        );
        assetSelect.innerHTML =
          '<option value="">Pilih Asset</option>';
        assetInfo.classList.add(
          "hidden"
        );
        return;
      }
      // Tampilkan pilihan asset
      assetContainer.classList.remove(
        "hidden"
      );
      await loadOtherIncomeAssets();
    }
  );

  // BRANCH CHANGE
  const branchSelect =
    document.getElementById(
      "otherIncomeBranch"
    );
  branchSelect.addEventListener(
    "change",
    async function () {
      const category =
        document.getElementById(
          "otherIncomeCategory"
        ).value;
      if (category === "Asset Sale") {
        await loadOtherIncomeAssets();
      }
    }
  );
	
  // ASSET CHANGE
  const assetSelect =
    document.getElementById(
      "otherIncomeAsset"
    );

  assetSelect.addEventListener(
    "change",
    function () {

      const option =
        this.options[this.selectedIndex];

      const info =
        document.getElementById(
          "otherIncomeAssetInfo"
        );

      const bookValue =
        document.getElementById(
          "otherIncomeAssetBookValue"
        );

      if (!this.value) {

        info.classList.add(
          "hidden"
        );

        return;
      }

      const value =
        Number(
          option.dataset.bookValue || 0
        );
      bookValue.textContent =
        "Rp" +
        value.toLocaleString("id-ID");
      info.classList.remove(
        "hidden"
      );
    }
  );
}

async function loadOtherIncomeAssets() {
  const branchId =
    document.getElementById("otherIncomeBranch").value;
  const select =
    document.getElementById("otherIncomeAsset");
  const sessionId =
    localStorage.getItem("pos_session_id");

  if (!branchId) {
    select.innerHTML =
      '<option value="">Pilih Branch terlebih dahulu</option>';
    return;
  }

  if (!sessionId) {
    select.innerHTML =
      '<option value="">Session tidak ditemukan</option>';
    return;
  }
  select.innerHTML =
    '<option value="">Loading asset...</option>';
	
  try {
    const {
      data,
      error
    } = await supabaseClient.rpc(
      "get_available_assets",
      {
        p_branch_id: branchId,
        p_session_id: sessionId
      }
    );

    if (error) {
      console.error(
        "Load assets error:",
        error
      );
      select.innerHTML =
        '<option value="">Gagal memuat asset</option>';
      return;
    }
    select.innerHTML =
      '<option value="">Pilih Asset</option>';

    if (!data || data.length === 0) {
      select.innerHTML =
        '<option value="">Tidak ada asset aktif</option>';
      return;
    }

    data.forEach(asset => {
      const option =
        document.createElement("option");
      option.value =
        asset.Asset_ID;
      option.textContent =
        `${asset.Asset_Name} — Rp${Number(
          asset.Book_Value || 0
        ).toLocaleString("id-ID")}`;
      option.dataset.bookValue =
        asset.Book_Value || 0;
      option.dataset.purchaseCost =
        asset.Purchase_Cost || 0;
      select.appendChild(option);

    });

  } catch (err) {
    select.innerHTML =
      '<option value="">Gagal memuat asset</option>';
  }
}

async function submitOtherIncome() {
  const now = new Date();
  const id =
    "OI-" +
    now.getTime() +
    "-" +
    Math.floor(Math.random() * 10000);
  const refId = id;
  const category =
    document.getElementById("otherIncomeCategory").value;
  // ASSET ID
  let assetId = null;
  if (category === "Asset Sale") {
    assetId =
      document.getElementById("otherIncomeAsset")?.value || null;

    if (!assetId) {
      showToast(
        "Silakan pilih asset yang akan dijual",
        "error"
      );
      return;
    }
  }

  const data = {
    id: id,
    date:
      document.getElementById(
        "otherIncomeDate"
      ).value,
    refId: refId,
    description:
      document.getElementById(
        "otherIncomeDescription"
      ).value,

    category: category,
    method:
      document.getElementById(
        "otherIncomeMethod"
      ).value,
    amount:
      Number(
        document.getElementById(
          "otherIncomeAmount"
        ).value || 0
      ),

    status: "Paid",
    branchId:
      document.getElementById(
        "otherIncomeBranch"
      ).value,
    notes:
      document.getElementById(
        "otherIncomeNotes"
      ).value,
    // BARU
    assetId: assetId
  };

  try {
    const res =
      await saveOtherIncomeRPC(data);

    if (
      res &&
      res.success === false
    ) {
      throw new Error(
        res.message ||
        "Gagal menyimpan Other Income"
      );
    }

    document
      .getElementById(
        "addNewOtherIncomeWrapper"
      )
      ?.remove();
    state.expenseDashboardData = null;
    state.expenseDashboardFilter = null;
    state.cashFlowData = null;
    state.cashFlowFilter = null;
    await loadExpenseDashboard();

    showToast(
      "Other Income berhasil disimpan",
      "success"
    );

  } catch (err) {
    showToast(
      err?.message ||
      "Gagal menyimpan Other Income",
      "error"
    );
  }
}

document.addEventListener("click", function (e) {
  const btn = e.target.closest("#btnExportExpensePDF");
  if (!btn) return;
  exportExpensePDF();
});


async function exportExpensePDF() {
  const f = getExpenseFilters();
  const branchId = state?.branchId || "";

  if (!branchId) {
    showToast(
      "Branch login tidak ditemukan",
      "error"
    );
    return;
  }

  // OPEN WINDOW
  const pdfWindow =
    window.open(
      "",
      "_blank"
    );

  if (!pdfWindow) {
    showToast(
      "Popup diblokir browser",
      "error"
    );
    return;
  }
	
  // LOADING
  pdfWindow.document.write(`
    <!DOCTYPE html>
	    <html>
		    <head>
		      <title>
		        Generating Expense Report
		      </title>

		      <style>
		        body {
		          margin: 0;
		          background: #0B0F14;
		          color: white;
		          font-family: Arial, sans-serif;
		
		          display: flex;
		          align-items: center;
		          justify-content: center;
		
		          height: 100vh;
		        }
		
		        .loading {
		          text-align: center;
		        }
		
		        .title {
		          font-size: 18px;
		          font-weight: bold;
		          margin-bottom: 8px;
		        }
		
		        .text {
		          font-size: 13px;
		          opacity: .7;
		        }
		
		      </style>
		    </head>
		
		    <body>
		      <div class="loading">
		        <div class="title">
		          Expense Report
		        </div>
		
		        <div class="text">
		          Generating report...
		        </div>
		      </div>
		    </body>
	    </html>
  `);

  try {
		const sessionId =
  		localStorage.getItem("pos_session_id");
    const payload = {
      type: "expense",
      branchId: branchId,
			sessionId,
      start: f?.startDate || null,
      end: f?.endDate || null,
      status: f?.status === "All Status"
          ? "ALL"
          : f?.status || "ALL",
      category: f?.category === "All Categories"
          ? "ALL"
          : f?.category || "ALL",
			tenantSlug: state.tenantSlug
	};
		
    // CALL SINGLE EXPORT API
    const response =
      await fetch(
        "/api/export-pdf",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json"
          },
          body:
            JSON.stringify(payload)
        }
      );

    // HTTP ERROR
    if (!response.ok) {

      const errorText =
        await response.text();
      throw new Error(
        errorText ||
        `Export gagal (${response.status})`
      );
    }
		
    // GET HTML REPORT
    const html =
      await response.text();
    if (!html) {
      throw new Error(
        "Server mengembalikan HTML kosong"
      );
    }

    // RENDER REPORT
    pdfWindow.document.open();
    pdfWindow.document.write(html);
    pdfWindow.document.close();
  }

  catch (err) {
    // ERROR PAGE
    pdfWindow.document.open();
    pdfWindow.document.write(`
      <!DOCTYPE html>
	      <html>
		      <body style="
		        background:#0B0F14;
		        color:white;
		        font-family:Arial;
		        padding:40px;
		      ">
	
		        <h2>
		          Export Failed
		        </h2>
		
		        <p style="
		          color:#aaa;
		        ">
		          Gagal membuat Expense Report.
		        </p>
		
		        <pre style="
		          white-space:pre-wrap;
		          background:#151A21;
		          padding:15px;
		          border-radius:10px;
		          color:#ff6b6b;
		        ">${String(
		          err?.message ||
		          err ||
		          "Unknown error"
		        )
		          .replace(/&/g, "&amp;")
		          .replace(/</g, "&lt;")
		          .replace(/>/g, "&gt;")
		        }</pre>
	      	</body>
	      </html>
    `);
    pdfWindow.document.close();
  }
}

function paginate(data) {
  const start = (currentPage - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  const pageData = data.slice(start, end);
  renderExpenseTable(pageData);
  renderPagination(data); 
  document.getElementById("expenseTableInfo").innerText =
    `Showing ${start + 1} - ${Math.min(end, data.length)} of ${data.length}`;
}
	
function renderPagination(data) {
  const container = document.getElementById("pagination");
  if (!container) return;
  const totalPages = Math.ceil(data.length / itemsPerPage);
  let html = "";
  // ⬅ LEFT
 html += `
  <button class="chevron-left w-8 h-8 rounded-md flex items-center justify-center transition-colors">
    <span class="material-symbols-outlined text-sm">chevron_left</span>
  </button>
`;
  // PAGES
  for (let i = 1; i <= totalPages; i++) {
    const isActive = i === currentPage;
    html += `
      <button data-page="${i}"
        class="page-btn w-8 h-8 rounded-md flex items-center justify-center text-xs font-bold transition-colors
        ${isActive
          ? "text-on-surface"
          : "text-on-surface-variant hover:text-on-surface"}">
        ${i}
      </button>
    `;
  }
  // ➡ RIGHT
 html += `
  <button class="chevron-right w-8 h-8 rounded-md flex items-center justify-center transition-colors">
    <span class="material-symbols-outlined text-sm">chevron_right</span>
  </button>
`;
  container.innerHTML = html;
}

document.addEventListener("click", function(e) {
  const data = window.currentFilteredData || allExpenseData;
  if (e.target.closest(".chevron-left")) {
    if (currentPage > 1) {
      currentPage--;
      paginate(data);
    }
  }
  if (e.target.closest(".chevron-right")) {
    const maxPage = Math.ceil(data.length / itemsPerPage);
    if (currentPage < maxPage) {
      currentPage++;
      paginate(data);
    }
  }
  const btn = e.target.closest(".page-btn");
  if (btn) {
    currentPage = Number(btn.dataset.page);
    paginate(data);
  }
});

document.addEventListener("click", function (e) {
  if (
    e.target &&
    (
      e.target.id === "btnExportOtherIncomePDF" ||
      e.target.closest("#btnExportOtherIncomePDF")
    )
  ) {
    exportOtherIncomePDF();
  }
});

async function exportOtherIncomePDF() {
  const f =
    getOtherIncomeFilters();
  const win =
    window.open(
      "",
      "_blank"
    );
  if (!win) {
    alert(
      "Popup diblokir browser"
    );
    return;
  }

  // LOADING
  win.document.write(`
    <html>
      <body style="
        background:#0B0F14;
        color:white;
        font-family:Arial;
        display:flex;
        align-items:center;
        justify-content:center;
        height:100vh;
      ">
        Generating Other Income Report...
      </body>
    </html>
  `);

  try {
		const sessionId =
  		localStorage.getItem("pos_session_id");
    const response =
      await fetch(
        "/api/export-pdf",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json"
          },

          body: JSON.stringify({
            type: "other-income",
            branchId: state.branchId,
            category: f.category,
            status: f.status,
            search: f.keyword,
            start: f.startDate,
            end: f.endDate,
						sessionId,
						tenantSlug: state.tenantSlug
          })
        }
      );
		
    // CHECK RESPONSE
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        errorText ||
        "Export Other Income gagal"
      );
    }

    // GET HTML
    const html = await response.text();
    if (!html) {
      throw new Error(
        "Response export kosong"
      );
    }

    // SHOW REPORT
    win.document.open();
    win.document.write(html);
    win.document.close();
  }

  catch (err) {
    win.document.open();
    win.document.write(`
      <html>
        <body style="
          font-family:Arial;
          padding:40px;
        ">
          <h2>
            Export PDF Failed
          </h2>

          <pre>
						${String(
						  err?.message ||
						  "Export PDF gagal"
						)}
          </pre>
        </body>
      </html>
    `);

    win.document.close();
    alert(
      err?.message ||
      "Export PDF gagal"
    );
  }
}

	
    // ==================================
    // MEMBER & LOYALTY UPDATES
    // ==================================

function initLoyaltyPage() {
  loadLoyaltySettings();
  initRewardPagination();
  loadRewardProducts();
  initPointRatioListener();
  initSeasonControl();
	loadCategorySettings();
  document.getElementById("saveSettingsBtn")
    ?.addEventListener(
      "click",
      saveLoyaltySettings
    );
  loadSeasonStatus();
}

async function loadLoyaltySettings() {

  // LOAD FROM STATE
  if (state.loyaltySettings) {
    applyLoyaltySettings(
      state.loyaltySettings
    );
    return;
  }

  try {
    // SUPABASE RPC
    const s =
      await getSettingsRPC();
    // CACHE / STATE
    state.loyaltySettings =
      s || {};

    // RENDER
    applyLoyaltySettings(
      state.loyaltySettings
    );
  }
  catch (err) {
    showToast(
      err?.message ||
      "Gagal memuat Loyalty Settings",
      "error"
    );
  }
}

async function loadCategorySettings() {

  try {
    const branchId = state.branchId;

    if (!branchId) {
      return;
    }

    const categories =
      await getCategoriesRPC(
        branchId
      );

    // RESET UI
    for (let i = 1; i <= 5; i++) {
      const name =
        document.getElementById(
          `category_${i}_name`
        );

      const discount =
        document.getElementById(
          `category_${i}_discount`
        );

      const reward =
        document.getElementById(
          `category_${i}_reward`
        );
      if (name) {
        name.value = "";
      }
      if (discount) {
        discount.value = 0;
      }
      if (reward) {
        reward.value = 0;
      }
    }
		
    // LOAD DATABASE → UI
    categories.forEach(
      category => {

        const key =
          String(
            category.category_key || ""
          );

        const match =
          key.match(
            /^category_(\d+)$/
          );

        if (!match) return;

        const index =
          Number(match[1]);

        if (
          index < 1 ||
          index > 5
        ) {
          return;
        }

        const name =
          document.getElementById(
            `category_${index}_name`
          );

        const discount =
          document.getElementById(
            `category_${index}_discount`
          );

        const reward =
          document.getElementById(
            `category_${index}_reward`
          );

        if (name) {
          name.value =
            category.category_name || "";
        }

        if (discount) {
          discount.value =
            Number(
              category.discount ?? 0
            );
        }

        if (reward) {
          reward.value =
            Number(
              category.reward ?? 0
            );
        }
      }
    );
  }
  catch (err) {
  }
}

function renderTierSettings(s) {
  const setText = (id, value) => {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  };
  // LABEL
  setText("tier_label_1", s.tier_1_name_value || "Starter");
  setText("tier_label_2", s.tier_2_name_value || "Explorer");
  setText("tier_label_3", s.tier_3_name_value || "Premium");
  setText("tier_label_4", s.tier_4_name_value || "Elite");
  setText("tier_label_5", s.tier_5_name_value || "Diamond");

  // THRESHOLD
  setText("tier-1", formatRupiah(s.tier_1) + "+");
  setText("tier-2", formatRupiah(s.tier_2) + "+");
  setText("tier-3", formatRupiah(s.tier_3) + "+");
  setText("tier-4", formatRupiah(s.tier_4) + "+");
  setText("tier-5", formatRupiah(s.tier_5) + "+");
  const tier5 = document.getElementById("tier-5");
  if (tier5) tier5.classList.add("text-on-surface");
}

function applyLoyaltySettings(s) {
  setInputValue("tier_1", s.tier_1);
  setInputValue("tier_2", s.tier_2);
  setInputValue("tier_3", s.tier_3);
  setInputValue("tier_4", s.tier_4);
  setInputValue("tier_5", s.tier_5);
  const setValue = (id,value)=>{
    const el=document.getElementById(id);
    if(el) el.value=value || "";
  };
  setValue("tier_1_name",s.tier_1_name_value);
  setValue("tier_2_name",s.tier_2_name_value);
  setValue("tier_3_name",s.tier_3_name_value);
  setValue("tier_4_name",s.tier_4_name_value);
  setValue("tier_5_name",s.tier_5_name_value);
	
  renderTierSettings(s);
  const slider =
    document.getElementById("point_ratio");
  if(slider){
    slider.value =
      Number(s.point_ratio || 0);
  }
  const pointText =
    document.getElementById("point_ratio_text");
  if(pointText){
    pointText.textContent =
      "IDR " +
      Number(s.point_ratio || 0)
      .toLocaleString("id-ID");
  }
  setInputValue("point_amount", s.point_reward);
	setInputValue(
	  "memberDiscountInput",
	  s.member_discount
	);

setInputValue(
	  "birthdayDiscountInput",
	  s.birthday_discount
	);
}

async function loadLoyaltySettings() {

  // LOAD FROM STATE
  if (state.loyaltySettings) {
    applyLoyaltySettings(
      state.loyaltySettings
    );
    return;
  }

  try {

    // SUPABASE RPC
    const s = await getSettingsRPC();
    // SAVE STATE
    state.loyaltySettings = s || {};
    // APPLY UI
    applyLoyaltySettings(state.loyaltySettings);
  }

  catch (err) {
    showToast(
      err?.message ||
      "Gagal memuat Loyalty Settings",
      "error"
    );
  }
}

function initPointRatioListener() {
  const slider = document.getElementById("point_ratio");
  const text = document.getElementById("point_ratio_text");
  if (!slider || !text) return;
  slider.oninput = () => {
    let value = Number(slider.value) || 0;
    value = Math.round(value / 500) * 500;
    slider.value = value;
    text.innerText =
      "IDR " +
      value.toLocaleString("id-ID");
  };
}

function setInputValue(id, value) {
  const el = document.getElementById(id);
  if (!el) return;
  // kalau slider → pakai angka asli
  if (el.type === "range") {
    el.value = Number(value || 0);
  } 
  // kalau input biasa → format rupiah
  else {
    el.value = Number(value || 0).toLocaleString("id-ID");
  }
}

async function saveLoyaltySettings() {
  const payload = {
    // THRESHOLD TIER
    tier_1: parseNumber("tier_1"),
    tier_2: parseNumber("tier_2"),
    tier_3: parseNumber("tier_3"),
    tier_4: parseNumber("tier_4"),
    tier_5: parseNumber("tier_5"),

    // NAMA TIER
    tier_1_name:
      document
        .getElementById("tier_1_name")
        ?.value
        ?.trim() || "",
    tier_2_name:
      document
        .getElementById("tier_2_name")
        ?.value
        ?.trim() || "",
    tier_3_name:
      document
        .getElementById("tier_3_name")
        ?.value
        ?.trim() || "",
    tier_4_name:
      document
        .getElementById("tier_4_name")
        ?.value
        ?.trim() || "",
    tier_5_name:
      document
        .getElementById("tier_5_name")
        ?.value
        ?.trim() || "",

    // POINT SYSTEM
    point_ratio: parseNumber("point_ratio"),
    point_reward: parseNumber("point_amount"),
						
    // MEMBER DISCOUNT
    member_discount: parseNumber("memberDiscountInput"),

    // BIRTHDAY DISCOUNT
    birthday_discount: parseNumber("birthdayDiscountInput")
  };

  // CATEGORY
  const categoryPayload = [];
  for (let i = 1; i <= 5; i++) {
    const name =
      document
        .getElementById(`category_${i}_name`)
        ?.value
        ?.trim() || "";

    const discount = parseNumber(`category_${i}_discount`);
    const reward = parseNumber(`category_${i}_reward`);
    // Category kosong dilewati
    if (!name) {
      continue;
    }
    categoryPayload.push({
      category_key: `category_${i}`,
      category_name: name,
      discount: discount,
      reward: reward
    });
  }

  try {
    // SUPABASE RPC
    const res =
      await saveSettingsRPC(
        payload
      );
 
    // SAVE CATEGORIES
    for (const category of categoryPayload) {
      await saveCategoryRPC(
        state.branchId,
        category.category_key,
        category.category_name,
        category.discount,
        category.reward
      );
    }
	
    // HANDLE RESPONSE
    if (
      res &&
      res.success === false
    ) {
      throw new Error(
        res.message ||
        "Gagal menyimpan Loyalty Settings"
      );
    }

    // SUCCESS
    alert(
      "Loyalty settings saved!"
    );
		state.rewardProducts = null;
		state.rewardProductsBranchId = null;
    // CLEAR STATE
    state.loyaltySettings = null;
    state.memberPageData = null;
    state.settingsPageData = null;
		await loadRewardProducts();
    await loadLoyaltySettings();
  }
  catch (err) {
    alert(
      err?.message ||
      "Gagal menyimpan Loyalty Settings"
    );
  }
}

function validateSettings(p) {
  if (
    Number(p.tier_1) >=
    Number(p.tier_2)
  ) {
    throw new Error(
      "Tier 1 harus lebih kecil dari Tier 2"
    );
  }

  if (
    Number(p.tier_2) >=
    Number(p.tier_3)
  ) {
    throw new Error(
      "Tier 2 harus lebih kecil dari Tier 3"
    );
  }

  if (
    Number(p.tier_3) >=
    Number(p.tier_4)
  ) {
    throw new Error(
      "Tier 3 harus lebih kecil dari Tier 4"
    );
  }

  if (
    Number(p.tier_4) >=
    Number(p.tier_5)
  ) {
    throw new Error(
      "Tier 4 harus lebih kecil dari Tier 5"
    );
  }
}
	
function parseNumber(id) {
  const val = document.getElementById(id)?.value || "0";
  return Number(val.replace(/\./g, "")) || 0;
}

async function loadSeasonStatus() {
  const badge =
    document.getElementById(
      "season_status_badge"
    );
  if (!badge) {
    setTimeout(
      loadSeasonStatus,
      50
    );
    return;
  }

  // LOAD FROM STATE
  if (state.seasonStatus) {
    updateSeasonUI(
      state.seasonStatus
    );
    return;
  }

  try {
    // SUPABASE RPC
    const data =
      await getSeasonConfigRPC();
    state.seasonStatus = data || {};
    updateSeasonUI(state.seasonStatus);
  }
  catch (err) {
    showToast(
      err?.message ||
      "Gagal memuat Season Status",
      "error"
    );
  }
}

function initSeasonControl() {
  const openBtn = document.getElementById("btn_open_season");
  const closeBtn = document.getElementById("btn_close_season");
  const autoBtn = document.getElementById("btn_auto_season");
  if (!openBtn || !closeBtn || !autoBtn) return;
  openBtn.onclick = openSeason;
  closeBtn.onclick = closeSeason;
  autoBtn.onclick = toggleAutoSeason;
}

function refreshSeasonStatus(){
  state.seasonStatus = null;
  loadSeasonStatus();
}	

async function openSeason() {
  const startDate =
    document.getElementById(
      "season_start"
    )?.value;
  const endDate =
    document.getElementById(
      "season_end"
    )?.value;

  // VALIDASI
  if (!startDate) {
    showToast(
      "Start date wajib diisi",
      "error"
    );
    return;
  }

  if (!endDate) {
    showToast(
      "End date wajib diisi",
      "error"
    );
    return;
  }

  try {
    // SUPABASE RPC
    const res =
      await openSeasonRPC(
        startDate,
        endDate
      );
    if (
      res &&
      res.success === false
    ) {
      throw new Error(
        res.message ||
        "Gagal membuka season"
      );
    }
    // CLEAR CACHE STATE
    state.seasonStatus = null;
    await loadSeasonStatus();
    showToast(
      "Season berhasil dibuka",
      "success"
    );
  }

  catch (err) {
    showToast(
      err?.message ||
      "Gagal membuka season",
      "error"
    );
  }
}

async function closeSeason() {
  try {
    // KONFIRMASI
    const confirmed =
      confirm(
        "Tutup season sekarang?\n\n" +
        "Semua member akan diproses " +
        "untuk reset tier dan spend."
      );

    if (!confirmed) {
      return;
    }
    // SUPABASE RPC
    const res =
      await closeSeasonRPC();
   
    // CHECK RESULT
    if (
      res &&
      res.success === false
    ) {
      throw new Error(
        res.message ||
        "Gagal menutup season"
      );
    }
		
    // CLEAR STATE
    state.seasonStatus = null;
    state.memberPageData = null;
    await loadSeasonStatus();

    // NOTIFICATION
    showToast(
      `Season berhasil ditutup. ${
        res?.members_processed || 0
      } member diproses.`,
      "success"
    );

  }

  catch (err) {
    showToast(
      err?.message ||
      "Gagal menutup season",
      "error"
    );
  }
}

async function toggleAutoSeason() {

  try {
    const res =
      await toggleAutoSeasonRPC();

    if (!res?.success) {
      throw new Error(
        res?.message ||
        "Gagal mengubah auto season"
      );
    }

    // Refresh status season
    state.seasonStatus = null;
    await refreshSeasonStatus();
    showToast(
      res.message ||
      "Auto Season berhasil diubah",
      "success"
    );
  }
  catch (err) {
    showToast(
      err?.message ||
      "Gagal mengubah auto season",
      "error"
    );
  }
}

function updateSeasonUI(res) {
  const badge = document.getElementById("season_status_badge");
  if (!badge || !res) return;
  let status = res.status;
  // normalize dari backend
  if (status === "ACTIVE") status = "OPEN";
  if (status === "OPEN") status = "OPEN";
  if (status === "CLOSED") status = "CLOSED";
  if (status === "ON") status = "AUTO";
  badge.innerText = status;
  // RESET CLASS TOTAL (IMPORTANT)
  badge.className =
    "text-[10px] font-inter tracking-widest uppercase px-3 py-1 rounded-md";
  // APPLY STYLE
  switch (status) {
    case "OPEN": badge.classList.add("bg-green-500/20", "text-green-400");
      break;
    case "CLOSED": badge.classList.add("bg-red-500/20", "text-red-400");
      break;
    case "AUTO": badge.classList.add("bg-primary/20", "text-on-surface");
      break;
    default: badge.classList.add("bg-surface-container", "text-on-surface-variant");
  }
}

function initRewardPagination() {
  document
    .getElementById("rewardPrevBtn")
    ?.addEventListener(
      "click",
      () => changeRewardPage(-1)
    );
  document
    .getElementById("rewardNextBtn")
    ?.addEventListener(
      "click",
      () => changeRewardPage(1)
    );
}

async function loadRewardProducts() {
  const branchId =
    document.getElementById(
      "rewardBranchFilter"
    )?.value ||
    state.branchId;

  // CACHE
  if (
    state.rewardProducts &&
    state.rewardProductsBranchId === branchId
  ) {

    rewardData = state.rewardProducts;
    rewardPage = 1;
    renderRewardProductsTable();
    return;
  }

  try {

    const res =
      await getRewardProductsRPC(
        branchId
      );
		
    // AMBIL ARRAY REWARDS
    const data =
      Array.isArray(res)
        ? res
        : Array.isArray(res?.rewards)
          ? res.rewards
          : [];

    // CACHE
    state.rewardProducts = data;
    state.rewardProductsBranchId = branchId;
    rewardData = state.rewardProducts;
    rewardPage = 1;
    renderRewardProductsTable();
  }
  catch (err) {
    showToast(
      err?.message ||
      "Gagal memuat reward.",
      "error"
    );
  }
}
	
function renderRewardProductsTable() {
  const tbody =
    document.getElementById("rewardTableBody");
  if (!tbody) return;
  tbody.innerHTML = "";
  const start =
    (rewardPage - 1) * rewardLimit;
  const data =
    rewardData.slice(
      start,
      start + rewardLimit
    );

  if (!data.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="4"
            class="py-12 text-center text-muted ">
          No reward products found
        </td>
      </tr>
    `;
    updateRewardPagination();
    return;
  }

  tbody.innerHTML = data
    .map(r => `
      <tr class="border border-outline-variant hover:bg-outline-variant">

        <td class="px-6 py-4 font-medium">
          ${r.productName}
        </td>

        <td class="px-6 py-4">
          ${r.category}
        </td>

        <td class="px-6 py-4 text-center font-bold text-on-surface">
          ${r.point} Pts
        </td>

        <td class="px-6 py-4">
          <div class="flex justify-end gap-2">
            <button onclick="deleteReward('${r.id}')"
              class="w-8 h-8 hover:text-red-400 flex items-center justify-center transition-all">
              <span class="material-symbols-outlined text-[15px]">
                delete
              </span>
            </button>
          </div>
        </td>
      </tr>
    `)
    .join("");
  updateRewardPagination();
}

function changeRewardPage(step) {
  const totalPages =
    Math.ceil(
      rewardData.length / rewardLimit
    ) || 1;
  const newPage =
    rewardPage + step;
  if (
    newPage < 1 ||
    newPage > totalPages
  ) {
    return;
  }
  rewardPage = newPage;
  renderRewardProductsTable();
}

function updateRewardPagination() {
  const totalPages =
    Math.ceil(
      rewardData.length /
      rewardLimit
    ) || 1;
  document.getElementById(
    "rewardPrevBtn"
  ).disabled =
    rewardPage <= 1;
  document.getElementById(
    "rewardNextBtn"
  ).disabled =
    rewardPage >= totalPages;
}
	
async function deleteReward(id) {
  if (
    !confirm(
      "Hapus reward ini?"
    )
  ) {
    return;
  }

  try {
    // SUPABASE RPC
    const res =
      await deleteRewardRPC(id);

    if (!res?.success) {
      throw new Error(
        res?.message ||
        "Gagal menghapus reward"
      );
    }

    // CLEAR CACHE
    state.rewardProducts = null;
    state.rewardProductsBranchId = null;
		rewardData = [];  
    await loadRewardProducts();
    showToast(
      "Reward berhasil dihapus.",
      "success"
    );
  }
  catch (err) {
    showToast(
      err?.message ||
      "Gagal menghapus reward",
      "error"
    );
  }
}
	
function loadRewardBranch(){
  const select = document.getElementById("rewardBranch");
  if(!select) return;
  const branch =
    allBranches.find(
      b => b.branchId === state.branchId
    );
  select.innerHTML = `
    <option value="${state.branchId}">
      ${
        branch
        ? branch.branchName
        : state.branchId
      }
    </option>
  `;
  select.value = state.branchId;
  select.disabled = true;
}

function openAddRewardModal() {
  document.body.insertAdjacentHTML(
    "beforeend",
    document.getElementById("addRewardModalTemplate").innerHTML
  );
  loadRewardBranch();
  setTimeout(() => {
    loadRewardProductsForModal();
  }, 50);
}

function closeAddRewardModal() {
  document.getElementById("addRewardModal")?.remove();
}

function onRewardProductChange() {
  const select = document.getElementById("rewardProduct");
  if (!select || !select.selectedOptions.length) return;
  const opt = select.selectedOptions[0];
  document.getElementById("rewardCategory").textContent =
    opt.dataset.category || "-";
}	

async function loadRewardProductsForModal() {

  const branchId =
    document.getElementById(
      "rewardBranch"
    )?.value ||
    state.branchId;

  const role =
    state.user?.role?.toLowerCase() || "";

  try {
    // LOAD PRODUCTS FROM RPC
    const products =
      await getProductsRPC(
        branchId,
        role
      );

    const select =
      document.getElementById(
        "rewardProduct"
      );
    if (!select) return;
    select.innerHTML =
      `
      <option value="">
        Pilih Produk
      </option>
      `;

    products.forEach(p => {
      select.innerHTML +=
        `
        <option
          value="${p.ID_Produk}"
          data-category="${p.Kategori}">
          ${p.Nama_Produk}
        </option>
        `;
    });
    onRewardProductChange();
  }
  catch (err) {
    showToast(
      err.message ||
      "Terjadi kesalahan.",
      "error"
    );
  }
}
	
document.addEventListener("change", e => {
  if (e.target.id === "rewardBranch") {
    loadRewardProductsForModal();
  }
  if (e.target.id === "rewardProduct") {
    onRewardProductChange();
  }
});

async function saveRewardProduct() {
  const product =
    document
      .getElementById("rewardProduct")
      ?.selectedOptions[0];

  if (!product || !product.value) {
    alert(
      "Pilih produk terlebih dahulu."
    );
    return;
  }
  const branchId =
    document.getElementById(
      "rewardBranch"
    )?.value ||
    state.branchId;

  const payload = {
    ID_Reward: "R" + Date.now(),
    Branch_ID: branchId,
    Produk_ID: product.value,
    Nama_Reward: product.text,
    Point_Dibutuhkan: 30,
    Status: "active",
    Max_Redeem: 0,
    Category: product.dataset.category || null
  };

  try {

    // SAVE VIA SUPABASE RPC
    const result =
      await saveRewardProductRPC(
        payload
      );
    // VALIDATE RESULT
    if (
      result &&
      result.success === false
    ) {
      throw new Error(
        result.message ||
        "Gagal menyimpan reward."
      );
    }
    closeAddRewardModal();
    // CLEAR CACHE
    state.rewardProducts = null;
    state.rewardProductsBranchId = null;
    await loadRewardProducts();
    showToast(
      "Reward berhasil ditambahkan."
    );
  }
  catch (err) {
    alert(
      err.message ||
      "Gagal menyimpan reward."
    );
  }
}

// ===========================
// DOCUMENTATION DATA
// ===========================

const docs = {
  dashboard: {
  title: "Dashboard",
  icon: "Home",
  subtitle: "Ringkasan performa bisnis dan informasi penting secara real-time.",
  content: `
  
      <section class="space-y-6">
        <div>
          <h3 class="text-xl font-bold mb-3">Deskripsi</h3>

          <p class="text-muted leading-8">
            Dashboard merupakan halaman utama sistem POS yang menampilkan
            ringkasan kondisi bisnis secara real-time. Halaman ini dirancang untuk
            memberikan gambaran cepat mengenai performa penjualan, aktivitas
            transaksi, kondisi stok, serta performa operasional sehingga pengguna
            dapat memantau perkembangan bisnis tanpa harus membuka setiap menu
            secara terpisah.
          </p>
        </div>

        <div>
          <h3 class="text-xl font-bold mb-3">
            Informasi yang Ditampilkan
          </h3>

          <ul class="space-y-3 text-muted leading-7">
            <li>
              • <b>KPI (Key Performance Indicator)</b> menampilkan informasi utama
              mengenai performa bisnis yang terdiri dari
              <b>Net Revenue</b>, <b>Total Order</b>,
              <b>Average Order Value (AOV)</b>, dan
              <b>Live Occupancy</b>. 
              Khusus pada kartu <b>Net Revenue</b>, pengguna dapat mengklik kartu
              tersebut untuk diarahkan ke halaman <b>Gross Revenue</b> dan melihat
              detail pendapatan secara lebih lengkap.
            </li>

            <li>
              • <b>Recent Transactions</b> menampilkan hingga
              <b>15 transaksi terbaru</b> sebagai monitoring aktivitas penjualan.
              Untuk melihat riwayat transaksi secara lebih lengkap, pengguna dapat
              menggunakan tombol <b>View All</b> yang akan mengarahkan ke halaman
              <b>Recent Transactions</b>.
            </li>

            <li>
              • <b>Low Stock Alerts</b> menampilkan informasi stok produk atau
              bahan yang sudah mendekati batas minimum persediaan.
              Fitur ini membantu pengguna mengetahui kebutuhan restock lebih cepat
              sehingga dapat menghindari kekurangan stok saat operasional berjalan.
            </li>

            <li>
              • <b>Shift Performance</b> menampilkan performa operasional berdasarkan
              pembagian waktu kerja, yaitu <b>Morning</b>,
              <b>Afternoon</b>, dan <b>Evening</b>.
              Informasi ini membantu pengguna mengevaluasi aktivitas penjualan dan
              produktivitas setiap shift.
            </li>

          </ul>
        </div>

        <div>
          <h3 class="text-xl font-bold mb-3">
            Manfaat
          </h3>

          <p class="text-muted leading-8">
            Dashboard membantu pemilik usaha dan manajemen dalam memantau kondisi
            bisnis secara cepat melalui informasi penjualan, transaksi terbaru,
            kondisi stok, serta performa shift. Dengan adanya ringkasan data dalam
            satu halaman, pengguna dapat mengambil keputusan operasional dengan
            lebih efektif dan efisien.
          </p>
        </div>
      </section>
    `
  },

  pos: {
  title: "POS",
  icon: "point_of_sale",
  subtitle: "Panduan transaksi penjualan, pembayaran, diskon, dan proses checkout.",
  content: `

      <section class="space-y-6">
        <div>
          <h3 class="text-xl font-bold mb-3">Deskripsi</h3>

          <p class="text-muted leading-8">
            POS merupakan halaman utama sistem POS yang digunakan untuk melakukan
            proses transaksi penjualan. Halaman ini menyediakan seluruh kebutuhan
            operasional kasir mulai dari pemilihan produk, pengelolaan pesanan,
            penggunaan member, perhitungan diskon, hingga proses pembayaran.
            Selain itu, POS telah terintegrasi dengan sistem inventory dan recipe
            sehingga setiap transaksi dapat melakukan perhitungan HPP serta
            pengurangan bahan baku secara otomatis.
          </p>
        </div>

        <div>
          <h3 class="text-xl font-bold mb-3">
            Informasi yang Ditampilkan
          </h3>
		  
          <ul class="space-y-3 text-muted leading-7">
            <li>
              • <b>Header POS</b> menyediakan fitur
              <b>Search Product</b>, <b>Notification</b>, dan
              <b>Kategori Produk</b> untuk membantu pengguna mencari dan memilih
              produk dengan lebih mudah.

              Pada bagian <b>Notification</b>, sistem akan menampilkan pengingat
              mengenai member yang akan berulang tahun. Notifikasi akan muncul mulai
              dari <b>7 hari sebelum tanggal ulang tahun</b> hingga hari ulang tahun
              member berlangsung. Setelah melewati tanggal ulang tahun, notifikasi
              akan otomatis hilang dari daftar pemberitahuan.
            </li>

            <li>
              • <b>Product Grid</b> menampilkan daftar produk yang tersedia untuk
              dijual. Pengguna dapat memilih produk secara langsung melalui tampilan
              grid untuk menambahkan produk ke dalam transaksi.
            </li>

            <li>
              • <b>Checkout Card</b> digunakan untuk mengelola daftar pesanan yang
              sedang berlangsung. Pada bagian ini terdapat input
              <b>Table</b> yang digunakan untuk menentukan meja pelanggan.

              Apabila sebuah meja telah digunakan dalam transaksi aktif, status meja
              tersebut akan berubah menjadi <b>Occupancy</b> pada halaman
              <b>Table Status</b>, sehingga pengguna dapat mengetahui meja yang
              sedang digunakan pelanggan.
            </li>

            <li>
              • <b>Member Search</b> digunakan untuk mencari dan memilih member yang
              telah terdaftar dalam sistem.

              Member yang dipilih dapat memperoleh keuntungan berupa
              <b>Discount</b> dan <b>Point</b> sesuai dengan pengaturan rasio
              pembelian yang telah ditentukan pada halaman <b>Loyalty</b>.

              Fitur diskon hanya berlaku untuk pelanggan yang terdaftar sebagai
              member, sedangkan pelanggan non-member tidak mendapatkan diskon
              member.
            </li>

            <li>
              • <b>Redeem Point</b> digunakan untuk melakukan penukaran point member
              menjadi produk reward.

              Proses redeem hanya dapat dilakukan apabila jumlah point yang dimiliki
              member telah mencukupi sesuai dengan nilai reward yang telah ditentukan
              pada sistem.
            </li>

            <li>
              • <b>Automatic Cost Calculation & Inventory Deduction</b> melakukan
              proses perhitungan otomatis pada setiap transaksi.

              Ketika produk dipilih, sistem akan membaca komposisi bahan baku dari
              recipe produk dan menghitung nilai
              <b>Harga Pokok Penjualan (HPP)</b> berdasarkan penggunaan bahan baku.

              Setelah transaksi berhasil dilakukan, jumlah bahan baku pada halaman
              <b>Inventory</b> akan berkurang secara otomatis sesuai dengan jumlah
              produk yang terjual.
            </li>

            <li>
              • <b>Stock Availability Validation</b> melakukan pengecekan
              ketersediaan bahan baku sebelum transaksi dapat diselesaikan.

              Apabila terdapat bahan baku yang habis atau jumlah stok tidak
              mencukupi, sistem akan memberikan pemberitahuan dan pengguna tidak
              dapat melanjutkan transaksi sampai stok bahan baku tersedia kembali.

              Fitur ini membantu mencegah terjadinya penjualan produk yang tidak
              memiliki bahan baku.
            </li>

            <li>
              • <b>Transaction Summary</b> menampilkan ringkasan perhitungan
              transaksi yang terdiri dari total pembelian, <b>Discount</b>,
              <b>Tax</b>, dan <b>Service</b> sebelum transaksi dilakukan.
            </li>

            <li>
              • <b>Payment Method</b> menyediakan pilihan metode pembayaran yang
              tersedia untuk menyelesaikan transaksi sesuai dengan metode pembayaran
              yang digunakan pelanggan.
            </li>

            <li>
              • <b>Buy Button</b> digunakan untuk mengkonfirmasi dan menyelesaikan
              transaksi setelah seluruh data pesanan, member, perhitungan biaya,
              dan metode pembayaran telah sesuai.
            </li>
          </ul>
        </div>

        <div>
          <h3 class="text-xl font-bold mb-3">
            Manfaat
          </h3>

          <p class="text-muted leading-8">
            POS membantu proses transaksi menjadi lebih cepat, akurat, dan
            terorganisir. Dengan integrasi antara penjualan, member, loyalty,
            inventory, dan recipe management, sistem dapat mengurangi kesalahan
            perhitungan serta membantu pengguna mengontrol penggunaan bahan baku
            secara otomatis.

            Selain mempermudah proses pembayaran, fitur otomatisasi HPP dan stok
            membantu pemilik usaha mengetahui biaya produk, menjaga ketersediaan
            bahan baku, serta meningkatkan efisiensi operasional bisnis.
          </p>
        </div>

      </section>
  `
  },

  table: {
  title: "TABLE",
  icon: "table_restaurant",
  subtitle: "Pengelolaan meja, status meja, dan alur pelayanan pelanggan.",
  content: `

      <section class="space-y-6">
        <div>
          <h3 class="text-xl font-bold mb-3">Deskripsi</h3>

          <p class="text-muted leading-8">
            Table merupakan halaman pada sistem POS yang digunakan untuk mengelola
            status dan informasi meja dalam operasional bisnis. Halaman ini membantu
            pengguna memantau ketersediaan meja, mengatur reservasi pelanggan, serta
            memperbarui status meja berdasarkan kondisi operasional secara real-time.
          </p>
        </div>

        <div>
          <h3 class="text-xl font-bold mb-3">
            Informasi yang Ditampilkan
          </h3>

          <ul class="space-y-3 text-muted leading-7">
            <li>
              • <b>Table Status</b> menampilkan kondisi setiap meja yang tersedia
              dalam sistem. Status meja terdiri dari:
              <b>Available</b>, <b>Occupancy</b>, dan <b>Reserved</b>.

              <br><br>

              <b>Available</b> menunjukkan meja dalam kondisi kosong dan dapat
              digunakan oleh pelanggan.

              <br>

              <b>Occupancy</b> menunjukkan meja sedang digunakan oleh pelanggan
              yang memiliki transaksi aktif.

              <br>

              <b>Reserved</b> menunjukkan meja telah dipesan oleh pelanggan untuk
              waktu tertentu.
            </li>

            <li>
              • <b>Add New Table</b> digunakan untuk menambahkan meja baru ke dalam
              sistem. Fitur ini membantu pengguna menyesuaikan jumlah meja dengan
              kondisi aktual pada area operasional.
            </li>

            <li>
              • <b>Table Grid</b> menampilkan seluruh daftar meja dalam bentuk grid
              agar pengguna dapat melihat status meja secara cepat.

              Setiap meja akan menampilkan informasi berdasarkan kondisi terkini
              sehingga pengguna dapat mengetahui meja yang tersedia, sedang digunakan,
              maupun telah dilakukan reservasi.
            </li>

            <li>
              • <b>Table Card</b> menyediakan aksi pengelolaan meja yang terdiri dari
              <b>Reserve Table</b> dan <b>Clear Table</b>.

              Untuk melakukan reservasi, pengguna dapat memilih meja yang ingin
              dipesan kemudian menekan tombol <b>Reserve</b>. Sistem akan menampilkan
              input untuk memasukkan <b>Nama Pelanggan</b> dan
              <b>Catatan Reservasi</b>.

              Setelah reservasi berhasil disimpan, status meja akan berubah menjadi
              <b>Reserved</b>.
            </li>

            <li>
              • <b>Clear Table</b> digunakan untuk mengubah status meja yang sudah
              selesai digunakan pelanggan.

              Ketika pelanggan telah selesai dan meninggalkan meja, pengguna dapat
              memilih tombol <b>Clear Table</b> sehingga status meja akan kembali
              menjadi <b>Available</b> dan dapat digunakan kembali oleh pelanggan
              berikutnya.
            </li>
          </ul>
        </div>

        <div>
          <h3 class="text-xl font-bold mb-3">
            Manfaat
          </h3>

          <p class="text-muted leading-8">
            Halaman Table membantu pengguna mengelola operasional meja dengan lebih
            terstruktur. Dengan adanya informasi status meja secara real-time,
            pengguna dapat mengetahui ketersediaan meja, menghindari kesalahan
            reservasi, serta mempercepat proses pelayanan pelanggan.

            Sistem ini juga membantu meningkatkan efisiensi operasional dengan
            menghubungkan status meja dengan aktivitas transaksi pada sistem POS.
          </p>
        </div>
      </section>
  `
  },

  member:{
      title:"MEMBER",
      icon:"groups",
      subtitle:"Manajemen pelanggan, dan data member.",
      content:`
      
      <section class="space-y-6">
        <div>
          <h3 class="text-xl font-bold mb-3">Deskripsi</h3>

          <p class="text-muted leading-8">
            Member merupakan halaman pada sistem POS yang digunakan untuk mengelola
            seluruh data pelanggan yang telah terdaftar sebagai member. Halaman ini
            menyediakan informasi mengenai profil member, status tier, point,
            riwayat aktivitas, serta berbagai fitur untuk mendukung program loyalty
            sehingga hubungan dengan pelanggan dapat dikelola secara lebih efektif.
          </p>
        </div>

        <div>
          <h3 class="text-xl font-bold mb-3">
            Informasi yang Ditampilkan
          </h3>

          <ul class="space-y-3 text-muted leading-7">
            <li>
              • <b>Header Member</b> menyediakan fitur
              <b>Birthday Notification</b> dan
              <b>Add New Member</b>.

              Pada bagian <b>Birthday Notification</b>, sistem akan menampilkan
              daftar member yang akan berulang tahun mulai dari
              <b>7 hari sebelum tanggal ulang tahun</b> hingga hari ulang tahun
              berlangsung. Setelah melewati tanggal tersebut, notifikasi akan
              otomatis dihapus dari daftar pemberitahuan.

              Tombol <b>Add New Member</b> digunakan untuk mendaftarkan pelanggan
              baru ke dalam program membership.
            </li>

            <li>
              • <b>KPI (Key Performance Indicator)</b> menampilkan ringkasan data
              membership yang terdiri dari <b>Total Member</b>,
              <b>Highest Member Tier</b>, dan
              <b>Point Issued</b>.

              Informasi ini membantu pengguna memantau perkembangan jumlah member,
              pencapaian tier tertinggi, serta total point yang telah diterbitkan
              kepada seluruh member.
            </li>

            <li>
              • <b>Member Table</b> menyediakan fitur
              <b>Search Member</b>,
              <b>Select Tier</b>, dan
              <b>Export Member PDF</b>.

              Fitur pencarian digunakan untuk menemukan member berdasarkan nama
              maupun informasi yang tersedia, sedangkan filter tier digunakan untuk
              menampilkan member berdasarkan tingkatan loyalty tertentu.
              Tombol <b>Export Member PDF</b> digunakan untuk menghasilkan laporan
              data member dalam format PDF.
            </li>

            <li>
              • <b>Daftar Member</b> menampilkan informasi setiap pelanggan yang
              telah terdaftar sebagai member. Informasi yang ditampilkan meliputi
              <b>Member ID</b>, <b>Nama Member</b>,
              <b>Tier Status</b>, <b>Total Transaksi</b>,
              <b>Point</b>, dan <b>Nomor WhatsApp</b>.
            </li>

            <li>
              • <b>Action</b> digunakan untuk mengelola data setiap member.
              Pengguna dapat melihat detail profil, melakukan perubahan informasi
              member, serta mengunggah foto profil member apabila diperlukan.
            </li>
          </ul>
        </div>

        <div>
          <h3 class="text-xl font-bold mb-3">
            Manfaat
          </h3>

          <p class="text-muted leading-8">
            Halaman Member membantu pengguna mengelola data pelanggan secara lebih
            terstruktur melalui program loyalty. Dengan adanya informasi mengenai
            tier, point, total transaksi, serta notifikasi ulang tahun, pengguna
            dapat meningkatkan kualitas pelayanan, menjaga hubungan dengan pelanggan,
            serta mendukung strategi pemasaran berbasis member. Selain itu, fitur
            pencarian, filter, dan export laporan memudahkan proses administrasi
            serta pengelolaan data member.
          </p>
        </div>
      </section>
      `
  },

  grossrevenue:{
      title:"GROSS REVENUE",
      icon:"monitoring",
      subtitle:"Analisis pendapatan kotor, laba, dan performa penjualan.",
      content:`
      
      <section class="space-y-6">
        <div>
          <h3 class="text-xl font-bold mb-3">Deskripsi</h3>

          <p class="text-muted leading-8">
            Gross Revenue merupakan halaman pada sistem POS yang digunakan untuk
            menganalisis pendapatan penjualan secara lebih rinci berdasarkan periode
            tertentu. Halaman ini menyajikan ringkasan pendapatan, tren penjualan,
            kategori dengan pendapatan tertinggi, serta produk dengan kontribusi
            pendapatan terbesar sehingga memudahkan pengguna dalam mengevaluasi
            performa bisnis.
          </p>
        </div>

        <div>
          <h3 class="text-xl font-bold mb-3">
            Informasi yang Ditampilkan
          </h3>

          <ul class="space-y-3 text-muted leading-7">
            <li>
              • <b>Date Filter</b> menyediakan pilihan
              <b>Start Date</b> dan <b>End Date</b> untuk menentukan periode laporan
              yang akan ditampilkan. Selain itu, tersedia tombol
              <b>Export</b> yang digunakan untuk mengunduh laporan Gross Revenue
              sesuai dengan periode yang dipilih.
            </li>

            <li>
              • <b>KPI (Key Performance Indicator)</b> menampilkan ringkasan
              pendapatan yang terdiri dari
              <b>Gross Revenue</b>,
              <b>Total Discount</b>,
              <b>Tax</b>, dan
              <b>Average Order Value (AOV)</b>.

              Informasi ini membantu pengguna mengetahui total pendapatan sebelum
              pengurangan biaya, total diskon yang diberikan kepada pelanggan,
              total pajak yang diperoleh, serta rata-rata nilai transaksi.
            </li>

            <li>
              • <b>Revenue Trend</b> menampilkan grafik perkembangan pendapatan
              berdasarkan periode yang dipilih sehingga pengguna dapat melihat
              perubahan performa penjualan dari waktu ke waktu.
            </li>

            <li>
              • <b>Top Revenue Category</b> menampilkan kategori produk yang
              memberikan kontribusi pendapatan terbesar selama periode laporan.
              Informasi ini membantu pengguna mengetahui kategori produk yang
              memiliki performa penjualan terbaik.
            </li>

            <li>
              • <b>Top Revenue Product</b> menampilkan daftar produk dengan
              pendapatan tertinggi selama periode yang dipilih. Tabel ini membantu
              pengguna mengidentifikasi produk yang paling banyak memberikan
              kontribusi terhadap total pendapatan bisnis.
            </li>
          </ul>
        </div>

        <div>
          <h3 class="text-xl font-bold mb-3">
            Manfaat
          </h3>

          <p class="text-muted leading-8">
            Halaman Gross Revenue membantu pengguna menganalisis performa pendapatan
            secara lebih mendalam melalui ringkasan KPI, grafik tren penjualan,
            kategori dengan pendapatan tertinggi, serta daftar produk dengan
            kontribusi terbesar. Informasi tersebut dapat digunakan sebagai dasar
            dalam mengevaluasi strategi penjualan, menentukan produk unggulan, dan
            mendukung pengambilan keputusan bisnis yang lebih tepat.
          </p>
        </div>
      </section>
      `
  },

  recenttransactions:{
    title:"RECENT TRANSACTIONS",
    icon:"receipt_long",
    subtitle:"Melihat riwayat transaksi beserta detail pembayaran.",
    content:`
    
    <section class="space-y-6">
      <div>
        <h3 class="text-xl font-bold mb-3">Deskripsi</h3>

        <p class="text-muted leading-8">
          Recent Transactions merupakan halaman pada sistem POS yang digunakan
          untuk melihat riwayat seluruh transaksi penjualan yang telah dilakukan.
          Halaman ini menyajikan informasi transaksi secara lengkap berdasarkan
          periode tertentu, sehingga pengguna dapat memantau aktivitas penjualan,
          melihat detail transaksi, serta mengirim ulang struk digital kepada
          pelanggan apabila diperlukan.
        </p>
      </div>

      <div>
        <h3 class="text-xl font-bold mb-3">
          Informasi yang Ditampilkan
        </h3>

        <ul class="space-y-3 text-muted leading-7">

          <li>
            • <b>Date Filter</b> menyediakan pilihan
            <b>Start Date</b> dan <b>End Date</b> untuk menentukan periode
            transaksi yang akan ditampilkan. Selain itu, tersedia tombol
            <b>Export</b> yang digunakan untuk mengunduh laporan transaksi sesuai
            dengan periode yang dipilih.
          </li>

          <li>
            • <b>KPI (Key Performance Indicator)</b> menampilkan ringkasan
            aktivitas transaksi yang terdiri dari
            <b>Total Revenue</b>,
            <b>Active Guest</b>, dan
            <b>Item Sold</b>.
			
            <br><br>

            <b>Total Revenue</b> menunjukkan total pendapatan yang dibayarkan oleh
            pelanggan selama periode yang dipilih.
            <br>
			
            <b>Active Guest</b> menampilkan jumlah pelanggan yang melakukan
            transaksi.
            <br>
			
            <b>Item Sold</b> menunjukkan total seluruh produk yang berhasil
            terjual.
          </li>

          <li>
            • <b>Recent Transactions Table</b> menampilkan daftar transaksi yang
            telah dilakukan selama periode yang dipilih. Informasi yang
            ditampilkan meliputi <b>Transaction ID</b>,
            <b>Date & Time</b>, <b>Table</b>,
            <b>Guest/Member</b>, <b>Total Amount</b>,
            <b>Status</b>, dan <b>Action</b>.
          </li>
		  
          <li>
            • <b>Action</b> menyediakan beberapa fitur untuk setiap transaksi.
            Pengguna dapat membuka popup detail transaksi untuk melihat daftar
            produk yang dibeli beserta informasi transaksi secara lengkap.
            Selain itu, tersedia fitur
            <b>Send Digital Receipt</b> yang digunakan untuk mengirim ulang struk
            digital kepada pelanggan.
          </li>
        </ul>
      </div>
	  
      <div>
        <h3 class="text-xl font-bold mb-3">
          Manfaat
        </h3>
        <p class="text-muted leading-8">
          Halaman Recent Transactions membantu pengguna memantau seluruh aktivitas
          penjualan secara terpusat. Dengan adanya ringkasan KPI, daftar transaksi,
          detail pembelian, serta fitur pengiriman ulang struk digital, pengguna
          dapat melakukan pengecekan transaksi dengan lebih mudah, meningkatkan
          pelayanan kepada pelanggan, serta mempermudah proses pelaporan dan
          administrasi penjualan.
        </p>
      </div>
    </section>
    `
  },

  settings:{
      title:"SETTINGS",
      icon:"settings",
      subtitle:"Manajemen Pengelolaan Outlet.",
      content:`
      
      <section class="space-y-6">
        <div>
          <h3 class="text-xl font-bold mb-3">Deskripsi</h3>

          <p class="text-muted leading-8">
            Settings merupakan halaman pada sistem POS yang digunakan untuk
            mengelola konfigurasi sistem, data outlet, serta akun pengguna.
            Halaman ini memungkinkan administrator melakukan pengaturan operasional
            seperti penambahan outlet, pengelolaan pengguna, serta mengakses
            informasi pendukung mengenai sistem.
          </p>
        </div>

        <div>
          <h3 class="text-xl font-bold mb-3">
            Informasi yang Ditampilkan
          </h3>

          <ul class="space-y-3 text-muted leading-7">
            <li>
              • <b>Branch Management</b> digunakan untuk mengelola seluruh data
              outlet yang terdaftar pada sistem.

              Tersedia tombol <b>Add New Branch</b> untuk menambahkan outlet baru
              dengan mengisi informasi berupa
              <b>Branch Name</b>,
              <b>Manager</b>,
              <b>Phone Number</b>, dan
              <b>Address</b>.

              Informasi nomor telepon dan alamat outlet akan digunakan sebagai
              identitas outlet dan ditampilkan pada struk digital yang diterima
              pelanggan.
            </li>

            <li>
              • <b>Branch Table</b> menampilkan daftar seluruh outlet yang telah
              terdaftar dalam sistem. Informasi yang ditampilkan meliputi
              <b>Branch Name</b>,
              <b>Manager</b>,
              <b>Address</b>, dan
              <b>Status</b>.

              Pada kolom <b>Action</b>, pengguna dapat mengubah informasi
              <b>Branch Name</b>, <b>Manager</b>, dan
              <b>Address</b> sesuai kebutuhan operasional.
            </li>

            <li>
              • <b>User Management</b> digunakan untuk mengelola seluruh akun
              pengguna yang memiliki akses ke sistem POS.

              Tersedia tombol <b>Add New User</b> untuk menambahkan akun baru
              dengan menentukan
              <b>Branch</b>,
              <b>Username</b>,
              <b>Password</b>, dan
              <b>Role</b>.

              Hak akses setiap pengguna akan disesuaikan berdasarkan role yang
              dipilih. Sebagai contoh, pengguna dengan role
              <b>Cashier</b> hanya dapat mengakses fitur-fitur tertentu sesuai
              dengan kewenangan yang telah ditetapkan.
            </li>

            <li>
              • <b>User Table</b> menampilkan seluruh akun pengguna yang telah
              terdaftar pada sistem. Informasi yang ditampilkan meliputi
              <b>Username</b>,
              <b>Role</b>,
              <b>Password</b>, dan
              <b>Branch</b>.

              Pada kolom <b>Action</b>, pengguna dapat mengubah informasi
              <b>Username</b> dan <b>Password</b>, serta menghapus akun pengguna
              apabila sudah tidak digunakan.
            </li>

			 <li>
			  • <b>Business Profile</b> digunakan untuk mengatur informasi dan identitas
			  bisnis yang akan ditampilkan pada struk digital.
			
				Pengguna dapat mengunggah <b>Logo Bisnis</b> yang akan digunakan pada
				struk, serta mengatur informasi <b>Instagram</b> bisnis dan <b>Footer Message</b> atau pesan penutup yang ditampilkan pada bagian
				bawah struk.
				
				Informasi yang dapat diatur meliputi: <b>Logo Bisnis</b>, <b>Instagram</b>, dan <b>Footer Message</b>.
				
				Logo dan informasi yang diatur pada <b>Business Profile</b> digunakan
				sebagai identitas bisnis Customer pada struk digital.
				
			</li>


            <li>
              • <b>Footer Information</b> menyediakan beberapa informasi pendukung
              yang terdiri dari
              <b>Privacy Policy</b>,
              <b>License Agreement</b>,
              <b>Documentation</b>, dan
              <b>Support Center</b>.

              Menu tersebut digunakan sebagai sumber informasi mengenai kebijakan
              penggunaan sistem, lisensi perangkat lunak, dokumentasi pengguna,
              serta pusat bantuan apabila diperlukan.
            </li>
          </ul>
        </div>
		
        <div>
          <h3 class="text-xl font-bold mb-3">
            Manfaat
          </h3>

          <p class="text-muted leading-8">
            Halaman Settings membantu administrator mengelola konfigurasi sistem
            secara terpusat, mulai dari pengelolaan outlet hingga akun pengguna.
            Dengan adanya pengaturan hak akses berdasarkan role, sistem dapat
            meningkatkan keamanan penggunaan sekaligus memastikan setiap pengguna
            hanya dapat mengakses fitur sesuai dengan tanggung jawabnya. Selain itu,
            informasi outlet yang tersimpan akan digunakan secara otomatis pada
            struk digital sehingga identitas setiap cabang tetap konsisten.
          </p>
        </div>
      </section>
      `
  },

  expenses:{
      title:"EXPENSES",
      icon:"payments",
      subtitle:"Pengelolaan Outlet Expenses & Other Income.",
      content:`
      
      <section class="space-y-6">
        <div>
          <h3 class="text-xl font-bold mb-3">Deskripsi</h3>
          <p class="text-muted leading-8">
            Expenses merupakan halaman pada sistem POS yang digunakan untuk
            mengelola seluruh pengeluaran dan pendapatan di luar transaksi penjualan.
            Halaman ini membantu pengguna mencatat biaya operasional, memantau
            anggaran bulanan, mengelola pemasukan tambahan, serta menganalisis
            distribusi pengeluaran berdasarkan kategori sehingga kondisi keuangan
            bisnis dapat dipantau dengan lebih baik.
          </p>
        </div>

        <div>
          <h3 class="text-xl font-bold mb-3">
            Informasi yang Ditampilkan
          </h3>

          <ul class="space-y-3 text-muted leading-7">
            <li>
              • <b>Date Filter</b> menyediakan pilihan
              <b>Start Date</b> dan <b>End Date</b> untuk menentukan periode laporan
              yang akan ditampilkan. Selain itu, tersedia tombol
              <b>Add Monthly Budget</b> yang digunakan untuk menetapkan anggaran
              operasional bulanan sebagai acuan dalam memantau pengeluaran.
            </li>

            <li>
              • <b>KPI (Key Performance Indicator)</b> menampilkan ringkasan
              kondisi pengeluaran yang terdiri dari
              <b>Total Expenses</b>,
              <b>Budget Remaining</b>, dan
              <b>Largest Category</b>.

              <br><br>
              <b>Total Expenses</b> menunjukkan total pengeluaran selama periode
              yang dipilih.

              <br>
              <b>Budget Remaining</b> menampilkan sisa anggaran bulanan yang masih
              tersedia.
              <br>

              <b>Largest Category</b> menunjukkan kategori pengeluaran dengan nilai
              terbesar selama periode laporan.
            </li>

            <li>
              • <b>Expenses Table</b> digunakan untuk mengelola seluruh data
              pengeluaran operasional.

              Tersedia fitur
              <b>Export</b>,
              <b>Add New Expense</b>,
              <b>Search</b>,
              <b>Select Category</b>,
              <b>Select Status</b>, dan
              <b>Select Branch</b> untuk mempermudah pencarian dan pengelolaan data.

              Tabel menampilkan informasi berupa
              <b>Date</b>,
              <b>Description</b>,
              <b>Category</b>,
              <b>Payment Method</b>,
              <b>Amount</b>,
              <b>Status</b>, dan
              <b>Action</b>.
            </li>

            <li>
              • <b>Other Income Table</b> digunakan untuk mencatat seluruh
              pendapatan yang berasal dari luar transaksi penjualan.

              Tersedia fitur
              <b>Export</b>,
              <b>Add New Income</b>,
              <b>Search</b>,
              <b>Select Category</b>,
              <b>Select Status</b>, dan
              <b>Select Branch</b>.

              Tabel menampilkan informasi berupa
              <b>Date</b>,
              <b>Description</b>,
              <b>Category</b>,
              <b>Payment Method</b>,
              <b>Amount</b>,
              <b>Status</b>, dan
              <b>Action</b>.
            </li>

            <li>
              • <b>Category Breakdown</b> menampilkan visualisasi distribusi
              pengeluaran berdasarkan kategori. Informasi ini membantu pengguna
              mengetahui kategori yang paling banyak menyerap anggaran sehingga
              dapat digunakan sebagai bahan evaluasi dalam pengelolaan biaya
              operasional.
            </li>
          </ul>
        </div>

        <div>
          <h3 class="text-xl font-bold mb-3">
            Manfaat
          </h3>

          <p class="text-muted leading-8">
            Halaman Expenses membantu pengguna mengelola arus pengeluaran dan
            pendapatan non-penjualan secara lebih terstruktur. Dengan adanya
            pengaturan anggaran bulanan, pencatatan expenses dan other income,
            serta analisis kategori pengeluaran, pengguna dapat memantau kondisi
            keuangan bisnis, mengendalikan biaya operasional, dan mengambil
            keputusan yang lebih tepat dalam pengelolaan anggaran.
          </p>
        </div>
      </section>
      `
  },

  loyalty: {
    title: "LOYALTY",
    icon: "workspace_premium",
    subtitle: "Pengaturan point, program loyalty pelanggan.",
    content: `
    
    <section class="space-y-6">
		  <div>
		    <h3 class="text-xl font-bold mb-3">Deskripsi</h3>
	
	
				<p class="text-muted leading-8">
				  Loyalty merupakan halaman pada sistem POS yang digunakan untuk mengelola
				  program loyalitas pelanggan. Halaman ini memungkinkan pengguna mengatur
				  perolehan point, reward, tingkatan membership, benefit khusus member,
				  serta pengaturan point dan diskon berdasarkan kategori produk.
				  Dengan pengaturan tersebut, Customer dapat memberikan keuntungan yang
				  berbeda kepada member sesuai dengan strategi loyalty yang diterapkan.
				</p>
			</div>
		
		  <div>
		    <h3 class="text-xl font-bold mb-3">
		      Informasi yang Ditampilkan
		    </h3>
	
				<ul class="space-y-3 text-muted leading-7">
				  <li>
				    • <b>Point Earning Ratio</b> digunakan untuk mengatur jumlah point
				    yang diperoleh pelanggan berdasarkan nilai transaksi.
				
				    Sebagai contoh, rasio dapat diatur menjadi
				    <b>1 Point : Rp10.000</b> atau
				    <b>2 Point : Rp10.000</b>.
				
				    Nilai rasio tersebut dapat disesuaikan dengan kebijakan bisnis sehingga
				    sistem dapat menghitung point yang diterima member pada setiap transaksi.
				  </li>
				
				  <li>
				    • <b>Reward Product Table</b> digunakan untuk mengelola daftar produk
				    yang dapat ditukarkan menggunakan point member.
				
				    Pengguna dapat menambahkan produk reward melalui tombol
				    <b>Add Reward Product</b>.
				
				    Tabel menampilkan informasi berupa
				    <b>Product Name</b>,
				    <b>Category</b>,
				    <b>Reward Point</b>, dan
				    <b>Action</b>.
				
				    Pada kolom <b>Action</b>, pengguna dapat menghapus produk reward
				    apabila sudah tidak digunakan lagi.
				  </li>
				
				  <li>
				    • <b>Membership Tier</b> digunakan untuk mengatur tingkatan membership
				    berdasarkan total nominal pembelian pelanggan.
				
				    Pengguna dapat menentukan batas minimum total pengeluaran yang harus
				    dicapai agar member dapat naik ke tier berikutnya. Sistem kemudian
				    dapat menyesuaikan tingkatan member berdasarkan akumulasi transaksi.
				  </li>
				
				  <li>
				    • <b>Member Benefit</b> digunakan untuk memberikan keuntungan khusus
				    kepada pelanggan yang terdaftar sebagai member.
				
				    Benefit yang tersedia dapat berupa
				    <b>Diskon Khusus Member</b> dan
				    <b>Diskon Ulang Tahun Member</b>.
				
				    Pengaturan ini memungkinkan bisnis memberikan penawaran khusus kepada
				    member sebagai bentuk apresiasi dan untuk meningkatkan loyalitas
				    pelanggan.
				  </li>
				
				  <li>
				    • <b>Product Category</b> digunakan untuk mengelola kategori produk
				    yang digunakan dalam program loyalty.
				
				    Pengguna dapat mengganti atau menyesuaikan
				    <b>Nama Category</b> sesuai dengan kebutuhan dan struktur bisnis yang
				    digunakan.
				
				    Category tersebut dapat digunakan sebagai dasar untuk menentukan
				    pengaturan <b>Discount Category</b> dan
				    <b>Point Category</b>.
				  </li>
				
				  <li>
				    • <b>Discount Category</b> digunakan untuk mengatur besaran diskon
				    berdasarkan kategori produk tertentu.
				
				    Pengguna dapat menentukan kategori produk yang mendapatkan diskon
				    sehingga sistem dapat menerapkan ketentuan diskon sesuai dengan
				    kategori yang telah dikonfigurasi.
				  </li>
				
				  <li>
				    • <b>Point Category</b> digunakan untuk mengatur perolehan point
				    berdasarkan kategori produk.
				
				    Pengguna dapat menentukan kategori produk tertentu untuk memperoleh
				    point dengan nilai atau aturan yang berbeda dari pengaturan point
				    umum.
				  </li>
					
					<li> 
						• <b>Season Tier</b> digunakan untuk mengatur periode berlakunya tingkatan membership serta proses penyesuaian level tier ketika periode tersebut berakhir.
							Pengguna dapat menentukan periode season, misalnya selama
							<b>1 tahun</b>. Selama season berlangsung, member dapat meningkatkan level
							berdasarkan ketentuan <b>Membership Tier</b> yang telah ditentukan.
							
							Setelah periode season berakhir, sistem dapat melakukan penyesuaian level
							tier berdasarkan aturan yang telah dikonfigurasi oleh pengguna.
							
							Sebagai contoh, apabila terdapat tingkatan:
							<b>Level A</b>,
							<b>Level B</b>,
							<b>Level C</b>,
							<b>Level D</b>, dan
							<b>Level E</b>, maka pada saat season berakhir:
							
							<ul class="list-disc list-inside mt-2 space-y-1"> <li><b>Level E</b> turun menjadi <b>Level C</b>.</li> <li><b>Level D</b> turun menjadi <b>Level C</b>.</li> <li><b>Level C</b> turun menjadi <b>Level B</b>.</li> <li><b>Level B</b> tetap berada pada <b>Level B</b>.</li> <li><b>Level A</b> tetap berada pada <b>Level A</b>.</li> </ul>
							
							Nama setiap level tier dapat disesuaikan oleh pengguna sesuai dengan
							kebutuhan dan strategi membership bisnis.
							
							Pengaturan <b>Season Tier</b> membantu bisnis menjalankan program membership
							secara berkala sehingga level member dapat dievaluasi dan disesuaikan pada
							setiap akhir periode season.
					</li>
				</ul>
		  </div>
		
		  <div>
		    <h3 class="text-xl font-bold mb-3">
		      Manfaat
		    </h3>

				<p class="text-muted leading-8">
				  Halaman Loyalty membantu pengguna membangun hubungan jangka panjang
				  dengan pelanggan melalui program membership yang terstruktur. Dengan
				  pengaturan point, reward, membership tier, benefit member, diskon
				  kategori, serta point berdasarkan kategori produk, bisnis dapat membuat
				  program loyalty yang lebih fleksibel dan sesuai dengan strategi
				  penjualan. Fitur ini dapat digunakan untuk mendorong pembelian berulang,
				  memberikan apresiasi kepada member, serta meningkatkan keterikatan
				  pelanggan terhadap bisnis.
				</p>
		  </div>
		</section>

    `
  },

  taxes: {
    title: "TAXES",
    icon: "account_balance",
    subtitle: "Konfigurasi pajak, service charge, dan biaya lainya .",
    content: `
    
    <section class="space-y-6">
      <div>
        <h3 class="text-xl font-bold mb-3">Deskripsi</h3>
        <p class="text-muted leading-8">
          Taxes & Fees merupakan halaman pada sistem POS yang digunakan untuk
          mengelola pengaturan pajak, biaya layanan, dan diskon yang akan
          diterapkan secara otomatis pada setiap transaksi. Halaman ini membantu
          pengguna menyesuaikan kebijakan biaya operasional sesuai dengan
          kebutuhan bisnis sehingga proses perhitungan transaksi menjadi lebih
          konsisten dan akurat.
        </p>
      </div>

      <div>
        <h3 class="text-xl font-bold mb-3">
          Informasi yang Ditampilkan
        </h3>

        <ul class="space-y-3 text-muted leading-7">
          <li>
            • <b>Tax Setting</b> digunakan untuk menentukan besaran pajak yang
            akan dikenakan pada setiap transaksi. Nilai pajak yang telah
            disimpan akan dihitung secara otomatis pada saat proses checkout.
          </li>

          <li>
            • <b>Service Charge Setting</b> digunakan untuk menentukan besaran
            biaya layanan (service charge) yang akan ditambahkan pada setiap
            transaksi sesuai dengan kebijakan operasional bisnis.
          </li>

          <li>
            • <b>Discount Setting</b> digunakan untuk mengatur persentase diskon
            yang diterapkan pada transaksi sesuai dengan ketentuan yang berlaku.
            Pengaturan ini bekerja bersama dengan fitur loyalty sehingga
            pelanggan yang memenuhi syarat dapat memperoleh potongan harga
            secara otomatis.
          </li>

          <li>
            • <b>Automatic Transaction Calculation</b> memastikan seluruh nilai
            pajak, biaya layanan, dan diskon yang telah dikonfigurasi akan
            diterapkan secara otomatis pada setiap transaksi. Hal ini membantu
            mengurangi kesalahan perhitungan dan menjaga konsistensi proses
            pembayaran.
          </li>

        </ul>
      </div>

      <div>
        <h3 class="text-xl font-bold mb-3">
          Manfaat
        </h3>

        <p class="text-muted leading-8">
          Halaman Taxes & Fees membantu pengguna mengelola kebijakan pajak,
          biaya layanan, dan diskon secara terpusat. Dengan penerapan otomatis
          pada setiap transaksi, sistem dapat meningkatkan akurasi perhitungan,
          mempercepat proses checkout, serta memastikan seluruh transaksi
          mengikuti kebijakan yang telah ditetapkan.
        </p>
      </div>
    </section>
    `
  },

  analytics: {
    title: "ANALYTICS",
    icon: "analytics",
    subtitle: "Visualisasi data bisnis, laporan profit, dan analisis performa bisnis .",
    content: `
    
    <section class="space-y-6">
      <div>
        <h3 class="text-xl font-bold mb-3">Deskripsi</h3>

        <p class="text-muted leading-8">
          Analytics merupakan halaman pada sistem POS yang digunakan untuk
          menganalisis performa bisnis secara menyeluruh berdasarkan data
          penjualan, keuntungan, pelanggan, metode pembayaran, serta penggunaan
          bahan baku. Halaman ini membantu pemilik usaha dan manajemen memahami
          kondisi bisnis melalui berbagai visualisasi data sehingga pengambilan
          keputusan dapat dilakukan dengan lebih cepat dan akurat.
        </p>
      </div>

      <div>
        <h3 class="text-xl font-bold mb-3">
          Informasi yang Ditampilkan
        </h3>

        <ul class="space-y-3 text-muted leading-7">
          <li>
            • <b>Date Filter</b> menyediakan pilihan
            <b>Start Date</b> dan <b>End Date</b> untuk menentukan periode analisis
            yang akan ditampilkan. Selain itu, tersedia tombol
            <b>Export</b> untuk mengunduh laporan analytics sesuai dengan periode
            yang dipilih.
          </li>

          <li>
            • <b>Active Member</b> menampilkan jumlah member yang melakukan
            transaksi selama periode yang dipilih. Informasi ini membantu pengguna
            mengetahui tingkat aktivitas pelanggan yang telah bergabung dalam
            program loyalty.
          </li>

          <li>
            • <b>Net Profit</b> menampilkan grafik keuntungan bersih selama
            <b>1 bulan</b> yang dikelompokkan berdasarkan
            <b>mingguan</b> sehingga pengguna dapat melihat perkembangan laba
            bisnis secara lebih mudah.

            Pada bagian bawah grafik ditampilkan ringkasan yang terdiri dari
            <b>Net Revenue</b>,
            <b>HPP (Harga Pokok Penjualan)</b>,
            <b>Expenses</b>,
            <b>Other Income</b>, dan
            <b>Gross Profit</b> sebagai dasar evaluasi performa keuangan.
          </li>

          <li>
            • <b>Payment Distribution</b> menampilkan distribusi transaksi
            berdasarkan metode pembayaran yang digunakan pelanggan, sehingga
            pengguna dapat mengetahui metode pembayaran yang paling sering
            digunakan dalam operasional bisnis.
          </li>

          <li>
            • <b>Top Selling Item</b> menampilkan
            <b>5 produk dengan jumlah penjualan tertinggi</b> selama periode yang
            dipilih. Informasi ini membantu pengguna mengidentifikasi produk yang
            paling diminati pelanggan.
          </li>

          <li>
            • <b>Peak Traffic Hours</b> menampilkan jam operasional dengan jumlah
            transaksi atau kunjungan pelanggan tertinggi dalam rentang waktu
            <b>24 jam</b>.

            Grafik ini membantu pengguna mengetahui waktu paling ramai sehingga
            dapat digunakan sebagai acuan dalam pengaturan jadwal operasional,
            persiapan stok, dan pembagian shift karyawan.
          </li>

          <li>
            • <b>Material Analytics Table</b> menampilkan informasi penggunaan
            bahan baku secara rinci untuk membantu mengontrol persediaan.

            Tabel menampilkan informasi berupa
            <b>Material</b>,
            <b>Current Stock</b>,
            <b>Daily Usage</b>,
            <b>Minimum Threshold</b>,
            <b>Status</b>,
            <b>Daily Left</b>,
            <b>Value (IDR)</b>,
            <b>Last Restock</b>, dan
            <b>Action</b>.

            Pada kolom <b>Action</b>, pengguna dapat langsung menuju halaman
            <b>Inventory</b> untuk melihat maupun mengelola data bahan baku yang
            dipilih.
          </li>
        </ul>
      </div>
	  
      <div>
        <h3 class="text-xl font-bold mb-3">
          Manfaat
        </h3>

        <p class="text-muted leading-8">
          Halaman Analytics membantu pengguna memahami kondisi bisnis melalui
          analisis penjualan, keuntungan, pelanggan, metode pembayaran, serta
          penggunaan bahan baku dalam satu halaman. Dengan informasi yang
          disajikan secara visual dan terstruktur, pengguna dapat mengevaluasi
          performa bisnis, mengoptimalkan operasional, mengendalikan biaya,
          serta mengambil keputusan yang lebih tepat berdasarkan data yang
          tersedia.
        </p>
      </div>
    </section>
    `
  },

  inventory: {
    title: "INVENTORY",
    icon: "inventory_2",
    subtitle: "Pengelolaan stok bahan baku, supplier, dan hitung Hpp .",
    content: `
		<section class="space-y-6">
		  <div>
		    <h3 class="text-xl font-bold mb-3">Deskripsi</h3>
		
		    <p class="text-muted leading-8">
		      Inventory merupakan halaman pada sistem POS yang digunakan untuk
		      mengelola bahan baku atau material, pembelian, supplier, komposisi
		      material pada produk, serta perhitungan biaya bahan. Halaman ini
		      membantu pengguna memantau kondisi stok, nilai persediaan, pembelian
		      material, dan komposisi bahan yang digunakan dalam setiap produk.
		    </p>
		  </div>
		
		  <div>
		    <h3 class="text-xl font-bold mb-3">
		      Informasi yang Ditampilkan
		    </h3>
		
		    <ul class="space-y-3 text-muted leading-7">
		
		      <li>
		        • <b>KPI</b> menampilkan ringkasan kondisi inventory secara
		        keseluruhan, meliputi <b>Total Material SKU</b>,
		        <b>Estimated Value</b>, <b>Critical Stock</b>, dan
		        <b>Daily Deduction</b>.
		      </li>
		
		      <li>
		        • <b>Ingredient Stock</b> digunakan untuk memantau persediaan
		        ingredient atau bahan yang tersedia. Informasi ini membantu pengguna
		        mengetahui jumlah stok dan kondisi bahan yang digunakan dalam
		        operasional bisnis.
		      </li>
		
		      <li>
		        • <b>Ingredient Purchase</b> digunakan untuk mencatat dan mengelola
		        pembelian ingredient atau bahan dari supplier. Data pembelian dapat
		        digunakan sebagai dasar untuk memperbarui persediaan dan memantau
		        riwayat pembelian material.
		      </li>
		
		      <li>
		        • <b>Supplier</b> digunakan untuk mengelola informasi supplier yang
		        menyediakan bahan atau material untuk kebutuhan bisnis. Pengguna
		        dapat mengelola data supplier yang digunakan dalam proses pembelian
		        ingredient.
		      </li>
		
		      <li>
		        • <b>Material Composition</b> digunakan untuk melihat komposisi
		        material yang digunakan pada produk sekaligus mengetahui
		        <b>Cost Value</b> dan persentase biaya material terhadap produk.
		        Tabel juga menampilkan <b>Price</b> dan <b>Action</b>.
		
		        Pada bagian <b>Action</b>, pengguna dapat mengunggah atau mengganti
		        foto produk serta mengubah nama produk dan harga sesuai kebutuhan
		        bisnis.
		      </li>
		
		      <li>
		        • <b>Material Composition</b> juga digunakan untuk menambahkan
		        ingredient ke dalam setiap produk. Pengguna dapat menentukan
		        ingredient yang digunakan beserta jumlah atau komposisinya sehingga
		        sistem dapat menghitung kebutuhan material dan biaya bahan yang
		        digunakan pada produk.
		      </li>
		
		    </ul>
		  </div>
		
		  <div>
		    <h3 class="text-xl font-bold mb-3">
		      Manfaat
		    </h3>
		
		    <p class="text-muted leading-8">
		      Halaman Inventory membantu pengguna mengontrol persediaan material,
		      memantau pembelian, mengelola supplier, serta mengetahui komposisi dan
		      biaya bahan pada setiap produk. Dengan informasi tersebut, pengguna
		      dapat memantau kondisi stok, mengetahui material yang membutuhkan
		      perhatian, serta membantu menentukan harga produk berdasarkan biaya
		      bahan yang digunakan.
		    </p>
		  </div>
		</section>
		`
  },

  cashflow: {
    title: "CASH FLOW",
    icon: "account_balance_wallet",
    subtitle: "Mengelola arus kas, transfer dana, serta memantau kondisi keuangan bisnis.",
    content: `
		<section class="space-y-6">
		  <div>
		    <h3 class="text-xl font-bold mb-3">Deskripsi</h3>
		
		    <p class="text-muted leading-8">
		      Cash Flow merupakan halaman pada sistem POS yang digunakan untuk
		      memantau dan mengelola arus kas bisnis. Halaman ini membantu pengguna
		      melihat pergerakan dana masuk dan keluar, saldo akun, transfer dana,
		      sumber pemasukan, kategori pengeluaran, serta perubahan modal pemilik
		      dalam periode tertentu.
		    </p>
		  </div>
		
		  <div>
		    <h3 class="text-xl font-bold mb-3">
		      Informasi yang Ditampilkan
		    </h3>
		
		    <ul class="space-y-3 text-muted leading-7">
		
		      <li>
		        • <b>Date Range</b> digunakan untuk menentukan periode tanggal yang
		        ingin ditampilkan pada laporan Cash Flow. Pengguna dapat memilih
		        rentang tanggal tertentu untuk melihat pergerakan arus kas dalam
		        periode tersebut.
		      </li>
		
		      <li>
		        • <b>Export</b> digunakan untuk mengekspor data Cash Flow sehingga
		        pengguna dapat menyimpan atau menggunakan data tersebut untuk
		        kebutuhan laporan dan analisis keuangan.
		      </li>
		
		      <li>
		        • <b>KPI</b> menampilkan ringkasan kondisi arus kas yang meliputi
		        <b>Cash In</b>, <b>Cash Out</b>, <b>Net Flow</b>, dan
		        <b>Balance</b>.
		      </li>
		
		      <li>
		        • <b>Account Balance</b> digunakan untuk melihat saldo dana pada
		        masing-masing akun yang digunakan dalam sistem.
		      </li>
		
		      <li>
		        • <b>Transfer Funds</b> digunakan untuk mencatat perpindahan dana
		        dari satu akun ke akun lainnya sehingga pergerakan saldo antar-akun
		        dapat dipantau dalam sistem.
		      </li>
		
		      <li>
		        • <b>Cash In vs Cash Out Chart</b> menampilkan grafik perbandingan
		        antara dana yang masuk dan dana yang keluar berdasarkan periode
		        yang dipilih. Grafik ini membantu pengguna melihat pola dan kondisi
		        arus kas bisnis secara lebih mudah.
		      </li>
		
		      <li>
		        • <b>Income Source</b> menampilkan sumber dana masuk yang berasal
		        dari <b>Sales</b> atau pemasukan utama bisnis serta
		        <b>Other Income</b> atau pemasukan lainnya.
		      </li>
		
		      <li>
		        • <b>Expenses Category</b> menampilkan kategori dana keluar yang
		        berasal dari <b>Expense</b> dan <b>Ingredient Purchase</b>.
		        Informasi ini membantu pengguna mengetahui sumber utama pengeluaran
		        bisnis.
		      </li>
		
		      <li>
		        • <b>Owner Equity</b> digunakan untuk mencatat aktivitas modal
		        pemilik, yang meliputi <b>Add Capital</b> untuk penambahan modal
		        dan <b>Withdraw Funds</b> untuk penarikan dana oleh pemilik.
		      </li>
		
		    </ul>
		  </div>

			<div>
		    <h3 class="text-xl font-bold mb-3">
		      Informasi dan Fungsi yang Tersedia
		    </h3>
		
		    <ul class="space-y-3 text-muted leading-7">
		
		      <li>
		        • <b>Backup</b> digunakan untuk membuat salinan data Customer yang
		        diperlukan sebagai cadangan. Pengguna dapat menjalankan proses backup
		        melalui Chat Bot sesuai dengan perintah yang tersedia.
		      </li>
		
		      <li>
		        • <b>Restore</b> digunakan untuk memulihkan data dari backup yang
		        sebelumnya telah dibuat. Pengguna dapat memilih backup yang tersedia
		        untuk menjalankan proses pemulihan data.
		      </li>
		
		      <li>
		        • <b>Delete Backup</b> digunakan untuk menghapus file atau data
		        backup yang sudah tidak diperlukan. Pengguna dapat memilih backup
		        tertentu yang ingin dihapus.
		      </li>
		
		      <li>
		        • <b>Delete Digital Receipt</b> digunakan untuk menghapus struk
		        digital yang tersimpan pada sistem sesuai dengan data yang dipilih
		        pengguna.
		      </li>
		
		    </ul>
		  </div>
		
		  <div>
		    <h3 class="text-xl font-bold mb-3">
		      Manfaat
		    </h3>
		
		    <p class="text-muted leading-8">
		      Chat Bot membantu pengguna menjalankan fungsi tertentu pada MUNO
		      dengan lebih praktis melalui perintah percakapan. Fitur ini dapat
		      digunakan untuk mengelola backup dan restore data, membersihkan backup
		      yang sudah tidak diperlukan, serta menghapus struk digital sesuai
		      kebutuhan operasional bisnis.
		    </p>
		  </div>
		
		  <div>
		    <h3 class="text-xl font-bold mb-3">
		      Manfaat
		    </h3>
		
		    <p class="text-muted leading-8">
		      Halaman Cash Flow membantu pengguna memahami kondisi keuangan bisnis
		      berdasarkan pergerakan dana masuk dan keluar. Dengan informasi saldo
		      akun, transfer dana, sumber pemasukan, kategori pengeluaran, serta
		      aktivitas modal pemilik, pengguna dapat memantau arus kas dengan lebih
		      terstruktur dan mengambil keputusan keuangan berdasarkan kondisi
		      aktual bisnis.
		    </p>
		  </div>
		</section>
		`
  }
	
};

function openDocumentation(page){
  const doc = docs[page];
  if(!doc) return;
  // hapus modal lama kalau masih ada
  document.getElementById("documentationModal")?.remove();
  // clone template
  const modal = document
    .getElementById("documentationModalTemplate")
    .content
    .cloneNode(true);
  document.body.appendChild(modal);
  // kasih id ke modal utama
  document.body.lastElementChild.id = "documentationModal";
  document.getElementById("docTitle").textContent = doc.title;
  document.getElementById("docSubtitle").textContent = doc.subtitle;
  document.getElementById("docIcon").textContent = doc.icon;
  document.getElementById("docContent").innerHTML = doc.content;
}

function closeDocumentationModal(){
  document.getElementById("documentationModal")?.remove();
}
	

	// ===========================
	// CASH FLOW
	// ===========================

function initCashFlowFilters(){
  document.getElementById("cf-start-date")
    ?.addEventListener("change", loadCashFlowPage);
  document.getElementById("cf-end-date")
    ?.addEventListener("change", loadCashFlowPage);
  document.getElementById("cf-branch")
    ?.addEventListener("change", ()=>{
      loadCashFlowPage();
      loadCashFlowNotification();
    });
}

function initCashFlowPage(){
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - 6);
  document.getElementById("cf-start-date").value = startDate.toISOString().split("T")[0];
  document.getElementById("cf-end-date").value = endDate.toISOString().split("T")[0];
	
  loadCashFlowBranchOptions();
  initCashFlowFilters();
  loadCashFlowPage();
}

async function loadCashFlowPage() {
	const filter = {
	  loginUserId: state.user?.ID_User,

    branchId:
      document.getElementById(
        "cf-branch"
      )?.value ||
      state.branchId,

    startDate:
      document.getElementById(
        "cf-start-date"
      )?.value || "",

    endDate:
      document.getElementById(
        "cf-end-date"
      )?.value || ""
  };
  const cacheKey = JSON.stringify(filter);
  // CACHE HIT
  if (
    state.cashFlowData &&
    state.cashFlowFilter === cacheKey
  ) {
    renderAccountBalance(state.cashFlowData.account);
    renderCashFlowSummary(state.cashFlowData.summary);
    renderCashFlowChart(state.cashFlowData.chart);
    renderTransferHistory(state.cashFlowData.transfers || []);
    renderOwnerSummary(state.cashFlowData.ownerSummary);
    renderOwnerHistory(state.cashFlowData.ownerTransactions || []);
    return;
  }

  try {
    const sessionId =
      localStorage.getItem("pos_session_id");
    const {
      data,
      error
    } =
      await supabaseClient.rpc(
        "get_cash_flow_page_data",
        {
          p_login_user_id: filter.loginUserId,
					p_session_id: sessionId,
          p_branch_id:  filter.branchId || "ALL",
          p_start: filter.startDate ||null,
          p_end: filter.endDate || null
        }
      );

    if (error) {
      throw error;
    }

    // ACCESS CHECK
    if (
      data &&
      data.success === false
    ) {
      showToast(
        data.message ||
        "Access denied.",
        "error"
      );
      return;
    }
    // CACHE
    state.cashFlowData = data || {};
    state.cashFlowFilter = cacheKey;
    renderAccountBalance(data?.account);
    renderCashFlowSummary(data?.summary);
    renderCashFlowChart(data?.chart);
    renderTransferHistory(data?.transfers || []);
    renderOwnerSummary(data?.ownerSummary);
    renderOwnerHistory(data?.ownerTransactions || []);
  }
  catch (err) {
    showToast(
      err?.message ||
      "Gagal memuat Cash Flow.",
      "error"
    );
  }
}

async function loadCashFlowBranchOptions() {

  // CACHE
  if (state.cashFlowBranches) {
    renderCashFlowBranchOptions(state.cashFlowBranches);
    return;
  }

  try {
    const sessionId =
      localStorage.getItem("pos_session_id");
    const {
      data,
      error
    } = await supabaseClient.rpc(
      "get_expense_branches",
			{
				p_session_id: sessionId
			}
    );

    if (error) {
      throw error;
    }

    // NORMALIZE DATA
    state.cashFlowBranches = data || [];
    renderCashFlowBranchOptions(state.cashFlowBranches);
  }
  catch (err) {
    showToast(
      err?.message ||
      "Gagal memuat branch.",
      "error"
    );
  }
}
	
function renderCashFlowBranchOptions(branches) {
  const select = document.getElementById("cf-branch");
  if (!select) return;

  select.innerHTML = `
    <option value="ALL">
      All Branch
    </option>
  `;

  branches.forEach(branch => {
    select.innerHTML += `
      <option value="${branch.id}">
        ${branch.name}
      </option>
    `;
  });
}

async function loadAccountBalance() {
  const branchId = document.getElementById("cf-branch")?.value || state.branchId;

  // Jika ALL
  if (branchId === "ALL") {
    document.getElementById("cf-cash").textContent = "-";
    document.getElementById("cf-bank").textContent = "-";
    document.getElementById("cf-inventory").textContent = "-";
    document.getElementById("cf-asset").textContent = "-";
    document.getElementById("cf-total").textContent = "-";
    return;
  }

  try {
    const data =
      await getAccountBalanceRPC(branchId);

    if (!data) {
      throw new Error(
        "Data account balance tidak ditemukan."
      );
    }
    renderAccountBalance(data);

  }
  catch (err) {
    showToast(
      err.message ||
      "Gagal memuat balance.",
      "error"
    );
  }
}


function renderAccountBalance(data) {
  document.getElementById("cf-cash").textContent = formatRupiah(data?.Cash || 0);
  document.getElementById("cf-bank").textContent = formatRupiah(data?.Bank || 0);
  document.getElementById("cf-inventory").textContent = formatRupiah(data?.Inventory || 0);
  document.getElementById("cf-asset").textContent = formatRupiah(data?.Asset || 0);
  // Total Balance = Cash + Bank
  const totalBalance =
    (data?.Cash || 0) +
    (data?.Bank || 0);

  document.getElementById("cf-total").textContent =
    formatRupiah(totalBalance);
}

function renderCashFlowSummary(data) {
  // KPI
  document.getElementById("cf-cashin").textContent = formatRupiah(data.income);
  document.getElementById("cf-cashout").textContent = formatRupiah(data.expense);
  document.getElementById("cf-net").textContent = formatRupiah(data.netFlow);
  document.getElementById("cf-balance").textContent = formatRupiah(data.balance);

  // INCOME SOURCES
  const total = data.income || 0;
  const salesPercent = total
      ? (data.sales / total) * 100
      : 0;
  const otherPercent = total
      ? (data.otherIncome / total) * 100
      : 0;
  document.getElementById("cf-sales").textContent = formatRupiah(data.sales);
  document.getElementById("cf-income").textContent = formatRupiah(data.otherIncome);
  document.getElementById("cf-total-in").textContent = formatRupiah(total);
  document.getElementById("cf-sales-percent").textContent = salesPercent.toFixed(1) + "%";
  document.getElementById("cf-income-percent").textContent = otherPercent.toFixed(1) + "%";
  document.getElementById("cf-sales-bar").style.width = salesPercent + "%";
  document.getElementById("cf-income-bar").style.width = otherPercent + "%";
  // EXPENSE CATEGORIES
  const totalOut = data.expense || 0;
  const operationPercent = totalOut > 0
      ? (data.operationExpense / totalOut) * 100
      : 0;
  const purchasePercent = totalOut > 0
      ? (data.ingredientPurchase / totalOut) * 100
      : 0;
  // Nominal
  document.getElementById("cf-expenses").textContent = formatRupiah(data.operationExpense);
  document.getElementById("cf-purchases").textContent = formatRupiah(data.ingredientPurchase);
  document.getElementById("cf-total-out").textContent = formatRupiah(totalOut);
  document.getElementById("cf-expenses-percent").textContent = operationPercent.toFixed(1) + "%";
  document.getElementById("cf-purchases-percent").textContent = purchasePercent.toFixed(1) + "%";
  document.getElementById("cf-expenses-bar").style.width = operationPercent + "%";
  document.getElementById("cf-purchases-bar").style.width = purchasePercent + "%";
}


function renderCashFlowChart(data){
  const container =
    document.getElementById(
      "cash-flow-chart"
    );

  if(!container) return;
  container.innerHTML = "";
  const max = Math.max(
    ...data.cashIn,
    ...data.cashOut,
    1
  );

  data.labels.forEach((label,index)=>{
    const inHeight =
      Math.round(
        data.cashIn[index] /
        max *
        240
      );
    const outHeight =
      Math.round(
        data.cashOut[index] /
        max *
        240
      );
    container.innerHTML += `
<div class="flex flex-col items-center flex-1">
  <div
    class="h-[240px]
    flex items-end gap-2">

    <div
      class="w-5 bg-primary"
      style="height:${inHeight}px">
    </div>

    <div
      class="w-5 bg-outline-variant"
      style="height:${outHeight}px">
    </div>
  </div>
  <span
    class="mt-4
    text-xs
    text-on-surface-variant">
    ${label}
  </span>
</div>
`;
  });
}

// OWNER TRANSACTION MODAL
function renderTransferHistory(data) {
  const container =
    document.getElementById("cf-transfers");
  if (!container) return;
  container.innerHTML = "";
  if (!data || data.length === 0) {
    container.innerHTML = `
      <div class="text-xs lg:text-sm text-on-surface-variant text-center py-4">
        No transfer history
      </div>
    `;
    return;
  }
  data
  .slice(0, 10)
  .forEach(item => {
    const date = new Date(item.Date);
    container.innerHTML += `
      <div class="flex justify-between items-start text-sm">
        <div>
          <div class="font-semibold">
            ${item.From_Account}
            →
            ${item.To_Account}
          </div>

          <div class="text-xs text-on-surface-variant mt-1">
            ${date.toLocaleDateString("id-ID")}
            ${item.Note ? "• " + item.Note : ""}
          </div>
        </div>
		
        <div class="font-bold">
          ${formatRupiah(item.Amount)}
        </div>
      </div>
    `;
  });
}

function openTransferModal(){
  const template =
    document.getElementById(
      "transferFundModalTemplate"
    );
  if(!template){
    return;
  }
  const clone = template.content.cloneNode(true);
  document.body.appendChild(clone);
}

async function saveTransfer() {
  const data = {
    branchId: state.branchId,
		
    fromAccount:
      document.getElementById(
        "tf-from"
      )?.value,

    toAccount:
      document.getElementById(
        "tf-to"
      )?.value,

    amount:
      Number(
        document.getElementById(
          "tf-amount"
        )?.value || 0
      ),

    note:
      document.getElementById(
        "tf-note"
      )?.value || "",

    createdBy:
      state.user?.username ||
      "Admin"
  };

  // VALIDASI
  if (
    !data.amount ||
    data.amount <= 0
  ) {

    showToast(
      "Jumlah transfer harus diisi",
      "warning"
    );
    return;
  }
	
  try {
    // SUPABASE RPC
    const res =
      await transferFundsRPC(data);
    // RESPONSE
    if (
      res &&
      res.success === false
    ) {

      throw new Error(
        res.message ||
        "Transfer gagal"
      );
    }

    showToast(
      res?.message ||
      "Transfer berhasil",
      "success"
    );
    // CLEAR CACHE
    state.cashFlowData = null;
    state.cashFlowFilter = null;
    closeTransferModal();
    await loadCashFlowPage();
  }
  catch (err) {
    showToast(
      err?.message ||
      "Transfer gagal",
      "error"
    );
  }
}

function closeTransferModal(){
  const modal =
    document.querySelector(
      "#transferFundModalTemplate"
    );
  const fixed =
    document.querySelector(
      ".fixed.inset-0.z-\\[9999\\]"
    );
  if(fixed){
    fixed.remove();
  }
}

function renderOwnerSummary(data){
  if(!data) return;
  document.getElementById(
    "owner-capital-total"
  ).textContent =
    formatRupiah(
      data.totalCapital || 0
    );
  document.getElementById(
    "owner-withdraw-total"
  ).textContent =
    formatRupiah(
      data.totalWithdraw || 0
    );
}

function renderOwnerHistory(rows) {
  const container =
    document.getElementById(
      "owner-equity-history"
    );
  if (!container) return;
  if (!rows.length) {
    container.innerHTML = `
      <div class="text-center py-8 text-muted  text-sm">
        No owner transactions
      </div>
    `;
    return;
  }
  container.innerHTML =
    rows
    .slice(0, 10)
    .map(row => {
      const isCapital =
        row.Type === "CAPITAL";
      return `
        <div class="flex items-center justify-between p-4 px-4 rounded-md border border-outline-variant bg-background">
          <div class=px-4>
            <div class="font-semibold text-sm">
              ${isCapital ? "Add Capital" : "Withdraw"}
            </div>

            <div class="text-xs text-muted  mt-1">
              ${row.Account || "-"}
            </div>

            <div class="text-xs text-muted ">
              ${row.Note || "-"}
            </div>
          </div>

          <div class="text-right px-4">
            <div class="${
              isCapital
                ? "text-emerald-400"
                : "text-red-400"
              } font-bold">

              ${
                isCapital
                  ? "+"
                  : "-"
              }
              ${formatRupiah(
                Number(
                  row.Amount || 0
                )
              )}
            </div>
          </div>
        </div>
      `;
    }).join("");
}


async function saveOwnerCapital() {
  await addOwnerTransaction({
    branchId: state.branchId,
    type: "CAPITAL",
    account: document.getElementById("ownerAccount").value,
    amount: Number(document.getElementById("ownerAmount").value),
    note: document.getElementById("ownerNote").value,
    createdBy: state.user.username
  });
    state.cashFlowData = null;
    state.cashFlowFilter = null;
    loadCashFlowPage();
}
	
async function addOwnerTransaction(data) {
	const sessionId =
		localStorage.getItem("pos_session_id");
  const {
    data: result,
    error
  } = await supabaseClient.rpc(
    "add_owner_transaction",
    {
      p_branch_id: data.branchId,
			p_session_id: sessionId,
      p_type: data.type,
      p_account: data.account,
      p_amount: Number(data.amount),
      p_note: data.note || "",
      p_created_by: data.createdBy || ""
    }
  );

  if (error) {
    throw error;
  }
  return result;
}

let ownerTransactionType = "CAPITAL";
function openOwnerCapitalModal() {
  ownerTransactionType = "CAPITAL";
  const template =
    document.getElementById(
      "ownerTransactionModalTemplate"
    );
  const clone =
    template.content.cloneNode(true);
  document.body.appendChild(clone);
  document.getElementById(
    "ownerModalTitle"
  ).innerText =
    "Add Capital";
  document.getElementById(
    "ownerModalSubtitle"
  ).innerText =
    "Record owner capital transaction";
  document.getElementById(
    "ownerModalIconSymbol"
  ).innerText =
    "trending_up";
  document.getElementById(
    "saveOwnerBtn"
  ).innerText =
    "Save Capital";
  document.getElementById(
    "cancelOwnerBtn"
  ).onclick =
    closeOwnerTransactionModal;
  document.getElementById(
    "closeOwnerModalBtn"
  ).onclick =
    closeOwnerTransactionModal;
}

function openOwnerWithdrawModal() {
  ownerTransactionType = "WITHDRAW";
  const template =
    document.getElementById(
      "ownerTransactionModalTemplate"
    );
  const clone =
    template.content.cloneNode(true);
  document.body.appendChild(clone);
  document.getElementById(
    "ownerModalTitle"
  ).innerText =
    "Withdraw Funds";
  document.getElementById(
    "ownerModalSubtitle"
  ).innerText =
    "Record owner withdraw transaction";
  document.getElementById(
    "ownerModalIconSymbol"
  ).innerText =
    "trending_down";
  document.getElementById(
    "saveOwnerBtn"
  ).innerText =
    "Save Withdraw";
  document.getElementById(
    "cancelOwnerBtn"
  ).onclick =
    closeOwnerTransactionModal;
  document.getElementById(
    "closeOwnerModalBtn"
  ).onclick =
    closeOwnerTransactionModal;
}

function closeOwnerTransactionModal() {
  document
    .getElementById("ownerTransactionModal")
    ?.remove();
}

async function saveOwnerTransaction() {
  try {
    const account =
      document.getElementById("ownerAccount").value;
    const amount =
      Number(
        document.getElementById("ownerAmount").value
      );
    const note =
      document.getElementById("ownerNote").value.trim();
    if (!amount || amount <= 0) {
      throw new Error("Masukkan nominal yang valid.");
    }
    await addOwnerTransaction({
      branchId:
        state.branchId,
      type:
        ownerTransactionType,
      account,
      amount,
      note,
      createdBy:
        state.user.Username ||
        state.user.username ||
        ""
    });
    state.cashFlowData = null;
    state.cashFlowFilter = null;
    closeOwnerTransactionModal();
    await loadCashFlowPage();
    alert("Owner transaction berhasil disimpan.");
  }
  catch (err) {
    alert(err.message);
  }
}

function toggleCashFlowNotification(){
  const dropdown = 
    document.getElementById("cashFlowNotifDropdown");
  if(!dropdown) return;
  dropdown.classList.toggle("hidden");
  if(!dropdown.classList.contains("hidden")){
    loadCashFlowNotification();
  }
}

async function loadCashFlowNotification() {
  const branchId = document.getElementById("cf-branch")?.value || "ALL";
  // CACHE
  if (
    state.cashFlowNotification &&
    state.cashFlowNotificationBranch === branchId
  ) {
    renderCashFlowNotification(state.cashFlowNotification);
    updateCashFlowBadge(state.cashFlowNotification);
    return;
  }

  try {
    const sessionId =
      localStorage.getItem("pos_session_id");
    const {
      data,
      error
    } = await supabaseClient.rpc(
      "get_yesterday_dashboard_summary",
      {
				p_session_id: sessionId,
        p_branch_id: branchId
      }
    );

    if (error) {
      throw error;
    }

    // CACHE
    state.cashFlowNotification = data || {};
    state.cashFlowNotificationBranch = branchId;
    renderCashFlowNotification(data || {});
    updateCashFlowBadge(data || {});
  }
  catch (err) {
  }
}
	
function renderCashFlowNotification(data){
  const list = document.getElementById("cashFlowNotifList");
  if(!list) return;
  list.innerHTML = `
  <div class="p-4 space-y-4">
    <div>
      <p class="text-xs text-muted">
        Yesterday Summary
      </p>

      <p class="font-bold text-sm">
        Income :
        Rp ${formatRupiah(data.cashFlow.income)}
      </p>

      <p class="font-bold text-sm">
        Expense :
        Rp ${formatRupiah(data.cashFlow.expense)}
      </p>

      <p class="font-bold text-sm">
        Purchase :
        Rp ${formatRupiah(data.cashFlow.purchase)}
      </p>

      <p class="font-bold text-sm text-on-surface mt-2">
        Net :
        Rp ${formatRupiah(data.cashFlow.netFlow)}
      </p>
    </div>
	
    <div class="border-t border-outline-variant pt-3">
      <p class="text-xs text-muted">
        Owner Equity
      </p>

      <p class="text-sm">
        Deposit :
        Rp ${formatRupiah(data.ownerEquity.deposit)}
      </p>

      <p class="text-sm">
        Withdrawal :
        Rp ${formatRupiah(data.ownerEquity.withdrawal)}
      </p>
    </div>

    <div class="border-t border-outline-variant pt-3">
      <p class="text-xs text-muted">
        Fund Transfer
      </p>

      <p class="text-sm">
        ${data.fundTransfer.count} transaksi
      </p>

      <p class="text-sm">
        Total :
        Rp ${formatRupiah(data.fundTransfer.total)}
      </p>
    </div>
  </div>
  `;
}

function updateCashFlowBadge(data){
  const badge =
    document.getElementById("cashFlowNotifBadge");
  if(!badge) return;
  const active =
    data.cashFlow.income > 0 ||
    data.cashFlow.expense > 0 ||
    data.cashFlow.purchase > 0 ||
    data.ownerEquity.deposit > 0 ||
    data.ownerEquity.withdrawal > 0 ||
    data.fundTransfer.count > 0;
  badge.classList.toggle(
    "hidden",
    !active
  );
}

    // CHAT BOT 
function openBackupChat(){
  const popup = document.getElementById("backupChatPopup");
  popup.classList.remove("hidden");
}

function closeBackupChat(){
  const popup = document.getElementById("backupChatPopup");
  popup.classList.add("hidden");
}

function sendBackupChat(){
  const input = document.getElementById("backupChatInput");
  const message = input.value.trim();
  if(!message) return;
		input.value = "";
}

function sendBackupChat(){
  const input = document.getElementById("backupChatInput");
  const message = input.value.trim();

  if(!message) return;
  addBackupChatMessage(
    "user",
    message
  );
  input.value = "";
  handleBackupCommand(message);
}

document.addEventListener("keydown", function(e){
  const input = document.getElementById("backupChatInput");
  if(!input) return;
  if(
    e.key === "Enter" &&
    document.activeElement === input
  ){
    e.preventDefault();
    sendBackupChat();
  }
});

function addBackupChatMessage(type, text){
  const container = document.getElementById("backupChatMessages");
  const div = document.createElement("div");
  if(type === "user"){
    div.className = ` ml-auto max-w-[80%] border border-outline-variant rounded-md bg-background p-5 text-sm lg:text-base text-lift `;
  }else{
    div.className = ` max-w-[80%] border border-outline-variant rounded-md bg-background p-5 text-sm lg:text-base `;
  }
  div.innerHTML = text;
    container.appendChild(div);
    container.scrollTop =
    container.scrollHeight;
}

// BACKUP INTENTS
const intents = {
  BACKUP: [
    "backup",
    "backup database",
    "buat backup",
    "buat full backup",
    "backup data"
  ],
  RESTORE: [
    "list backup",
    "restore",
    "restore backup",
    "pulihkan",
    "recover"
  ],
  DELETE_BACKUP: [
    "hapus backup",
    "delete backup",
    "remove backup"
  ],
  CHECK_DATABASE: [
    "cek database",
    "lihat database",
    "cek backup",
    "lihat backup",
    "daftar backup",
    "list backup",
    "backup tersedia"
  ],
  CLEAR_DATABASE: [
    "database tabel",
    "delete tabel",
    "hapus tabel",
    "clear tabel",
    "clear database",
    "reset database",
    "kosongkan database"
  ],
	CLEAR_DIGITAL_RECEIPTS: [
		"hapus semua struk digital",
		"hapus struk digital",
		"clear digital receipts",
		"clear receipt",
		"bersihkan struk digital",
		"hapus semua receipt"
	]
};

const analyticsIntents = {
  NET_PROFIT:[
    "net profit",
    "profit",
    "laba",
    "keuntungan",
    "untung bersih"
  ],
  REVENUE:[
    "omzet",
    "revenue",
    "pendapatan",
    "penjualan"
  ],
  TOP_PRODUCT:[
    "top produk",
    "produk paling laku",
    "produk terlaris",
    "best seller",
    "paling banyak terjual"
  ],
  PEAK_HOURS:[
    "jam ramai",
    "jam sibuk",
    "peak hour",
    "peak hours",
    "jam tersibuk",
    "jam paling ramai",
    "waktu ramai",
    "waktu tersibuk",
    "kapan ramai",
    "kapan paling ramai",
    "jam transaksi terbanyak",
    "waktu transaksi terbanyak",
    "jam dengan transaksi terbanyak",
    "jam terbaik",
    "jam operasional ramai"
  ],
  PAYMENT:[
    "metode",
    "payment",
    "pembayaran",
    "payment paling banyak",
    "pembayaran terbanyak",
    "metode pembayaran"
  ],
  STOCK_ALERT:[
    "stok kritis",
    "stok habis",
    "bahan hampir habis"
  ]
};

const hariIndex = {
  senin:1,
  selasa:2,
  rabu:3,
  kamis:4,
  jumat:5,
  sabtu:6,
  minggu:0
};

const hariNama = [
  "Minggu",
  "Senin",
  "Selasa",
  "Rabu",
  "Kamis",
  "Jumat",
  "Sabtu"
];

function extractAnalyticsDate(text){
  const months = {
    januari:"01",
    februari:"02",
    maret:"03",
    april:"04",
    mei:"05",
    juni:"06",
    juli:"07",
    agustus:"08",
    september:"09",
    oktober:"10",
    november:"11",
    desember:"12"
  };
  const match =
    text.match(
      /(\d{1,2})\s+(januari|februari|maret|april|mei|juni|juli|agustus|september|oktober|november|desember)\s+(\d{4})/i
    );
  if(!match){
    return null;
  }
  const day = match[1].padStart(2,"0");
  const month = months[match[2].toLowerCase()];
  const year = match[3];
  return `${year}-${month}-${day}`;
}

function extractAnalyticsMonth(text){
  const months = {
    januari:0,
    februari:1,
    maret:2,
    april:3,
    mei:4,
    juni:5,
    juli:6,
    agustus:7,
    september:8,
    oktober:9,
    november:10,
    desember:11
  };

  for(const month in months){
    if(text.includes(month)){
      const year = new Date().getFullYear();
      const start = new Date(year, months[month], 1);
      const end = new Date(year, months[month]+1, 0);
      return {
        start: formatLocalDate(start),
        end: formatLocalDate(end)
      };
    }
  }
  return null;
}

function extractAnalyticsRange(text){
  const now = new Date();
  // KEMARIN
  if(text.includes("kemarin")){
    const d = new Date(now);
    d.setDate(d.getDate()-1);
    const date = formatLocalDate(d);
    return {
      start:date,
      end:date
    };
  }
  // HARI INI
  if(text.includes("hari ini")){
    const date = formatLocalDate(now);
    return {
      start:date,
      end:date
    };
  }
  // MINGGU INI
  if(text.includes("minggu ini")){
    const day = now.getDay();
    const diff =
      day === 0
        ? -6
        : 1 - day;
    const start = new Date(now);
    start.setDate(
      now.getDate() + diff
    );
    return {
      start: formatLocalDate(start),
      end: formatLocalDate(now)
    };
  }

  // BULAN INI
  if(text.includes("bulan ini")){
    const start =
      new Date(
        now.getFullYear(),
        now.getMonth(),
        1
      );
    return {
      start: formatLocalDate(start),
      end: formatLocalDate(now)
    };
  }
  return null;
}

// MATCH INTENT
function matchIntent(cmd, keywords){
  return keywords.some(keyword =>
    cmd.includes(keyword)
  );
}

function formatLocalDate(date){
  const year = date.getFullYear();
  const month = String(date.getMonth()+1) 
		.padStart(2,"0");
  const day = String(date.getDate())
    .padStart(2,"0");
  return `${year}-${month}-${day}`;
}

function handleBackupCommand(message){
  const cmd = message.toLowerCase().trim();

  // ANALYTICS
  if(matchIntent(cmd, analyticsIntents.NET_PROFIT) ||
     matchIntent(cmd, analyticsIntents.REVENUE) ||
     matchIntent(cmd, analyticsIntents.TOP_PRODUCT)||
     matchIntent(cmd, analyticsIntents.PEAK_HOURS) ||
     matchIntent(cmd, analyticsIntents.PAYMENT) ||
     matchIntent(cmd, analyticsIntents.STOCK_ALERT)
     ){
      handleAnalyticsCommand(message);
    return;
  }
  // RESTORE
  if(matchIntent(cmd, intents.RESTORE)){
    loadBackupList();
    return;
  }
  // DELETE BACKUP
  if(matchIntent(cmd, intents.DELETE_BACKUP)){
    loadBackupList();
    return;
  }
  // CHECK DATABASE
  if(matchIntent(cmd, intents.CHECK_DATABASE)){
    loadBackupList();
    return;
  }
	// CLEAR DIGITAL RECEIPTS
	if(matchIntent(cmd, intents.CLEAR_DIGITAL_RECEIPTS)){
	  clearDigitalReceiptsConfirm();
	  return;
	}
  // CLEAR DATABASE
  if(matchIntent(cmd, intents.CLEAR_DATABASE)){
    clearDatabaseConfirm();
    return;
  }
  // BACKUP
  if(matchIntent(cmd, intents.BACKUP)){
    setTimeout(()=>{
      addBackupChatMessage(
        "bot",
        `
        <b>Backup Database</b>
        <br><br>

        Saya siap membuat full backup
        seluruh data Sistem POS.

        <br><br>
		
        Konfirmasi backup?
        <br><br>
        <div class="flex justify-center">
          <button
          onclick="startBackupProcess()"
          class="px-4 py-2 rounded-md bottom-theme border border-outline-variant text-on-surface text-xs">
            BACKUP NOW
          </button>
        </div>
        `
      );
    },500);
    return;
  }
  // UNKNOWN
  addBackupChatMessage(
    "bot",
    "Maaf, saya belum memahami perintah tersebut."
  );
}

function handleAnalyticsCommand(message){
  const cmd = message.toLowerCase().trim();
  const branchId = state.branchId;
  const today = formatLocalDate(new Date());
  const selectedDate = extractAnalyticsDate(cmd);
  let range = extractAnalyticsRange(cmd);
  if(!range && !selectedDate){
    range =
      extractAnalyticsMonth(cmd);
  }
  let startDate;
  let endDate;
  if(selectedDate){
    startDate = selectedDate;
    endDate = selectedDate;
  }
  else if(range){
    startDate = range.start;
    endDate = range.end;
  }
  else{
    const start =
      new Date(
        new Date().getFullYear(),
        new Date().getMonth(),
        1
      );
    startDate =
      formatLocalDate(start);
    endDate =
      today;
  }

  if(matchIntent(cmd,analyticsIntents.NET_PROFIT)){
      getChatAnalytics(startDate, endDate, branchId,
        data=>{
          const a = data.analytics || {};
          let title = "Net Profit";
          if(startDate === endDate){
            title = "Net Profit Hari Ini";
          }
          else{
            const totalDays =
              (
                new Date(endDate) -
                new Date(startDate)
              ) / (1000*60*60*24) + 1;

            if(totalDays <= 7){
              title = "Net Profit Mingguan";
            }
            else{
              title = "Net Profit Bulanan";
            }
          }

          addBackupChatMessage(
          "bot",
          `
          ${title}
          <br><br>
          Revenue:
          Rp ${Number(a.revenue || 0).toLocaleString()}
            <br><br>
          HPP: Rp ${Number(a.hpp || 0).toLocaleString()}
            <br><br> 
          Gross Profit: Rp ${Number(a.grossProfit || 0).toLocaleString()}
            <br><br>
          Operational Expense: Rp ${Number(a.operational || 0).toLocaleString()}
            <br><br>
          Net Profit Before Other Income: Rp ${Number(a.netProfitBeforeOtherIncome || 0).toLocaleString()}
            <br><br>
          Other Income: Rp ${Number(a.otherIncome || 0).toLocaleString()}
            <br><br>
          <b> Final Net Profit: Rp ${Number(a.netProfit || 0).toLocaleString()} </b>
          `
          );
      });
    return;
  }

  if(matchIntent(cmd,analyticsIntents.REVENUE)){
    getChatAnalytics(startDate, endDate, branchId,
    data=>{
      const totalDays =
        (
          new Date(endDate) -
          new Date(startDate)
        ) / (1000*60*60*24) + 1;

      let title = "Omzet";
      if(totalDays === 1){
        title = "Omzet Hari Ini";
      }
      else if(totalDays <= 7){
        title = "Omzet Mingguan";
      }
      else{
        title = "Omzet Bulanan";
      }

      addBackupChatMessage(
        "bot",
        `
        ${title}
        <br><br>
        Total Revenue: <b> Rp ${Number(data.analytics.revenue || 0) .toLocaleString()}</b>
        `
      );
    });
    return;
  }

  if(matchIntent(cmd,analyticsIntents.TOP_PRODUCT)){
    getChatAnalytics(startDate, endDate, branchId,
    data=>{
      const item = data.topSelling?.[0];
        addBackupChatMessage(
        "bot",
        `
        Produk Terlaris
        ${item.name}
        Terjual:
        ${item.qty} pcs
        `
        );
    });
    return;
  }

  // PEAK HOURS
  if(matchIntent(cmd,analyticsIntents.PEAK_HOURS)){
    getChatAnalytics(startDate, endDate, branchId,
    data=>{
      let selectedDay = null;
          for(const hari in hariIndex){
            if(cmd.includes(hari)){
              selectedDay = hariIndex[hari];
              break;
            }
          }
      let peak = null;
      let max = 0;
      const start = new Date(startDate);
      data.peakHours.forEach((dayData, dayIndex)=>{
        if(selectedDay !== null && dayIndex !== selectedDay){
          return;
        }
        dayData.forEach((total, hour)=>{
          if(total > max){
            max = total;
            peak = {
              hari: hariNama[dayIndex],
              jam:`${String(hour).padStart(2,"0")}:00`,
              total
            };
          }
        });
      });

      if(!peak || peak.total === 0){
        addBackupChatMessage(
          "bot",
          "Belum ada data jam ramai."
        );
        return;
      }
		
      const totalDays =
      (
        new Date(endDate) -
        new Date(startDate)
      ) / (1000*60*60*24) + 1;

      let title = "Jam Ramai";
        if(totalDays === 1){
          title = "Jam Transaksi Harian";
        }
        else if(totalDays <= 7){
          title = "Jam Ramai Periode Minggu Ini";
        }
        else{
          title = "Jam Ramai Periode Bulanan";
        }
		
      addBackupChatMessage(
        "bot",
        `
        ${title}

        Hari:
        ${peak.hari}

        Jam:
        ${peak.jam}

        Total Transaksi:
        ${peak.total}
        `
      );
    });
    return;
  }

  // PAYMENT
  if(matchIntent(cmd,analyticsIntents.PAYMENT)){
    getChatAnalytics(startDate, endDate, branchId,
    data=>{
      const pay = data.paymentDistribution?.[0];
      if(!pay){
		  
        addBackupChatMessage(
          "bot",
          "Belum ada data pembayaran."
        );
        return;
      }
		
      addBackupChatMessage(
        "bot",
        `
        Pembayaran Terbanyak
          ${pay.method}
        Total:
          Rp ${Number(pay.value || 0)
          .toLocaleString()}
        Persentase:
          ${pay.percent}%
        `
      );
    });
    return;
  }

  // STOCK ALERT
  if(matchIntent(cmd,analyticsIntents.STOCK_ALERT)){
    getChatAnalytics(startDate, endDate, branchId,
    data=>{
      const stock = data.rawMaterials || [];
      const low =
        stock.filter(item =>
          Number(item.stock || 0) <= Number(item.minStock || 0));
      if(low.length===0){
        addBackupChatMessage(
          "bot",
          `
          Stok Aman
          Semua bahan masih dalam batas aman.
          `
        );
        return;
      }

      let list = "";
      low.slice(0,5)
      .forEach(item=>{

        list += `
        • <b>${item.name}</b>
        <br>
        Stok: ${item.stock}
        <br><br>
        `;
      });
		
      addBackupChatMessage(
        "bot",
        `
        ⚠️ Stok Kritis
        Ada ${low.length} bahan perlu diperhatikan.
        <br><br>
        ${list}
        `
      );
    });
    return;
  }
}

function clearDigitalReceiptsConfirm(){
  addBackupChatMessage(
    "bot",
    `
    <b>Hapus Semua Struk Digital</b>
    <br><br>
    Semua file struk digital yang tersimpan
    di Storage akan dihapus.
    <br><br>
    Data transaksi <b>tidak akan dihapus</b>.
    <br><br>
    Struk lama tetap dapat dibuat ulang
    dari data transaksi.
    <br><br>
    Yakin ingin menghapus semua struk digital?
    <br><br>
    <div class="flex justify-center">
      <button onclick="startClearDigitalReceipts()"
        class="px-4 py-2 rounded-md bottom-theme border border-outline-variant text-on-surface text-xs">
        HAPUS SEMUA
      </button>
    </div>
    `
  );
}

async function startClearDigitalReceipts(){
  const progressId =
    "digitalReceiptClearProgress-" +
    Date.now();
  addBackupChatMessage(
    "bot",
    `
    <b>Clear Digital Receipts</b>
    <br><br>
    <div class="w-full">
      <div
        class="w-full h-2 rounded-md bg-outline-variant/10 overflow-hidden">
        <div
          id="${progressId}"
          class="h-full bg-outline-variant transition-all duration-500"
          style="width:0%">
        </div>
      </div>

      <div
        id="${progressId}-text"
        class="mt-2 text-xs opacity-60">
        Mempersiapkan...
      </div>
    </div>
    `
  );

  let progress = 0;
  const interval =
    setInterval(() => {
      progress +=
        Math.floor(
          Math.random() * 10
        ) + 5;
      if(progress >= 90){
        progress = 90;
      }
      const bar =
        document.getElementById(
          progressId
        );
      const text =
        document.getElementById(
          progressId + "-text"
        );
      if(bar){
        bar.style.width =
          progress + "%";
      }
      if(text){
        if(progress < 20){
          text.innerHTML =
            "Mengecek digital receipt...";
        }
        else if(progress < 40){
          text.innerHTML =
            "Mencari file struk digital...";
        }
        else if(progress < 65){
          text.innerHTML =
            "Menghapus file dari Storage...";
        }
        else if(progress < 85){
          text.innerHTML =
            "Membersihkan receipt URL...";
        }
        else{

          text.innerHTML =
            "Menyelesaikan proses...";
        }
      }
    }, 800);

  try {
    const response =
	  await fetch(
		"/api/clear-digital-receipts",
		{
		  method: "POST",
		  headers: {
			"Content-Type":
			  "application/json"
		  },
		  body: JSON.stringify({
			tenantSlug: state.tenantSlug
		  })
		}
	  );

    const result =
      await response.json();
    if(
      !response.ok ||
      !result.success
    ){
      throw new Error(
        result.error ||
        "Gagal menghapus struk digital"
      );
    }
    clearInterval(interval);

    // FINISH 100%
    const bar =
      document.getElementById(
        progressId
      );
    const text =
      document.getElementById(
        progressId + "-text"
      );
    if(bar){
      bar.style.width = "100%";
    }
    if(text){
      text.innerHTML =
        "Selesai.";
    }

    // HASIL
    setTimeout(() => {
      addBackupChatMessage(
        "bot",
        `
        <b>Struk Digital Berhasil Dihapus</b>
        <br><br>
        ${result.deleted || 0}
        struk digital berhasil dihapus.
        <br><br>
        Data transaksi tetap aman.
        `
      );
    }, 500);
  }
  catch(error){
    clearInterval(interval);
    const text =
      document.getElementById(
        progressId + "-text"
      );
    if(text){
      text.innerHTML =
        "Gagal.";
    }
    addBackupChatMessage(
      "bot",
      `
      ❌ <b>Gagal Menghapus Struk Digital</b>
      <br><br>
      ${error.message}
      `
    );
  }
}
	
async function getChatAnalytics(start, end, branchId, callback) {
  try {
    const sessionId =
      localStorage.getItem("pos_session_id");
    const {
      data,
      error
    } = await supabaseClient.rpc(
      "get_analytics_dashboard",
      {
				p_branch_id: branchId,
				p_start: start || null,
				p_end: end || null,
				p_session_id: sessionId
      }
    );

    if (error) {
      throw error;
    }
    callback(data || {});
  }
  catch (err) {
    addBackupChatMessage(
      "bot",
      `
      ❌ Gagal mengambil analytics
      <br><br>
      ${err.message}
      `
    );
  }
}

async function loadBackupList(){
  try {

    const data = await getBackupHistoryRPC();

    if(data.length === 0){

      addBackupChatMessage(
        "bot",
        `
        ⚠️ Belum ada backup tersedia.
        `
      );
      return;
    }
	  
    let html = `
    <b>List Backup Database</b>
    <br><br>
    <ul class="list-disc pl-5">
      <li>
        Sebelum melakukan restore database, pastikan seluruh data pada tabel tujuan sudah dihapus terlebih dahulu untuk menghindari duplikasi atau konflik data.
      </li>

      <li>
        Restore backup akan menggantikan data yang ada dengan data dari file backup. Pastikan memilih file backup yang benar sebelum melanjutkan proses.
      </li>

      <li>
        Apabila ingin menghapus backup database, pastikan file backup tersebut sudah tidak diperlukan lagi.
      </li>

      <li>
        Data backup yang sudah dihapus tidak dapat dikembalikan. Pastikan melakukan pengecekan terlebih dahulu sebelum menjalankan proses delete backup.
      </li>
    </ul>

    `;
	  
    data.forEach(item=>{
      const size =
        (
          (item.file_size || 0) /
          1024
        )
        .toFixed(1);

      html += `
      <div class="border border-outline-variant rounded-md p-4 mb-3">
        <b>
          ${item.backup_id}
        </b>
        <br>
		
        <span class="text-xs text-muted">
          ${item.created_at}
          <br>
          ${item.backup_type}
          • ${size} KB
        </span>
		
        <br><br>
		
        <div class="flex gap-2">
          <button onclick="restoreBackup('${item.backup_id}')"
          	class="px-4 py-2 rounded-md bottom-theme border border-outline-variant text-on-surface text-xs">
            	RESTORE
          </button>

          <button onclick="deleteBackup('${item.backup_id}')"
          	class="px-4 py-2 rounded-md bg-red-500/10 border border-red-500/10 text-red-400 text-xs">
            	DELETE
          </button>
        </div>
      </div>
      `;
    });

    addBackupChatMessage(
      "bot",
      `
      <div id="backupListContainer">
        ${html}
      </div>
      `
    );
  }
  catch(err){
    addBackupChatMessage(
      "bot",
      `
      ❌ Gagal mengambil backup
      <br><br>
      ${err.message}
      `
    );
  }
}	

async function startBackupProcess() {
  const progressId = "backup-progress-" + Date.now();
  addBackupChatMessage(
    "bot",
    `
    Backup sedang diproses...

    <div id="${progressId}-box"
      class="w-full bg-outline-variant/10 rounded-md h-2 overflow-hidden">
      <div id="${progressId}"
        class="h-full bg-primary rounded-md transition-all duration-500"
        style="width:5%">
			</div>
    </div>

    <p id="${progressId}-text"
      class="text-xs text-muted mt-2">
      	Menyiapkan database...
    </p>
    `
  );

  let progress = 5;
  const interval = setInterval(() => {
    progress +=
      Math.floor(Math.random() * 10) + 5;
    if (progress >= 90) {
      progress = 90;
    }
    const bar = document.getElementById(progressId);
    const text =document.getElementById(progressId + "-text");
    if (bar) {
      bar.style.width =
        progress + "%";
    }
    if (text) {
      if (progress < 20) {
        text.innerHTML =
          "Mengambil data Transaksi...";
      }
      else if (progress < 35) {
        text.innerHTML =
          "Mengambil data Member...";
      }
      else if (progress < 50) {
        text.innerHTML =
          "Mengambil data Ingredient...";
      }
      else if (progress < 80) {
        text.innerHTML =
          "Mengambil data Produk...";
      }
      else {
        text.innerHTML =
          "Menyusun file backup JSON...";
      }
    }
  }, 800);

  try {
    // BACKUP SUPABASE
    const result =
      await createFullBackup();
    if (!result?.success) {
      throw new Error(
        result?.message ||
        "Backup gagal"
      );
    }


    clearInterval(interval);
    const bar = document.getElementById(progressId);
    const text = document.getElementById(progressId + "-text");
    if (bar) {
      bar.style.width =
        "100%";
    }
    if (text) {
      text.innerHTML =
        "Backup selesai";
    }

    setTimeout(() => {
      const progressBox =document.getElementById(progressId + "-box");
      if (progressBox) {
        progressBox.remove();
      }

      addBackupChatMessage(
        "bot",
        `
        Backup berhasil
        <br><br>

        File:
        <b>
          ${result.backup_id}.json
        </b>

        <br><br>

        Ukuran:
        ${(result.file_size / 1024).toFixed(1)}
        KB
        `
      );
    }, 700);
  }
  catch (err) {
    clearInterval(interval);
    addBackupChatMessage(
      "bot",
      `
      ❌ Backup gagal
      <br><br>
      ${err.message}
      `
    );
  }
}

let isRestoring = false;
async function restoreBackup(id) {
  if (isRestoring) return;

  if (
    !confirm(
      `Restore ${id}?

			Semua data sekarang akan diganti
			dengan backup ini.`)
  ) {
    return;
  }

  isRestoring = true;
  const progressId = "restore-progress-" + Date.now();
  addBackupChatMessage(
    "bot",
    `
    Restore sedang diproses...

    <div id="${progressId}-box"
      class="w-full bg-outline-variant/10 rounded-md h-2 overflow-hidden">
      <div id="${progressId}"
        class="h-full bg-primary rounded-md transition-all duration-500"
        style="width:5%">
			</div>
    </div>

    <p id="${progressId}-text"
      class="text-xs text-muted mt-2">
     	 Menyiapkan restore...
    </p>
    `
  );

  let progress = 5;
  const interval =
    setInterval(() => {
      progress +=
        Math.floor(
          Math.random() * 10
        ) + 5;
      if (progress >= 90) {
        progress = 90;
      }
      const bar =
        document.getElementById(
          progressId
        );
      const text =
        document.getElementById(
          progressId + "-text"
        );
      if (bar) {
        bar.style.width =
          progress + "%";
      }
      if (text) {
        if (progress < 20) {
          text.innerHTML =
            "Mengembalikan data Transaksi...";
        }
        else if (progress < 35) {
          text.innerHTML =
            "Mengembalikan data Member...";
        }
        else if (progress < 45) {
          text.innerHTML =
            "Mengembalikan data Ingredient...";
        }
        else if (progress < 65) {
          text.innerHTML =
            "Mengembalikan data Produk...";
        }
        else if (progress < 80) {
          text.innerHTML =
            "Membaca file backup JSON...";
        }
        else {
          text.innerHTML =
            "Menyusun kembali database...";
        }
      }
    }, 800);

  try {
	  
    // RESTORE VIA VERCEL
    const res =
      await restoreBackupById(id);
    if (
      res?.success === false
    ) {
      throw new Error(
        res.message ||
        "Restore gagal"
      );
    }
    clearInterval(interval);
    isRestoring = false;
    const bar =
      document.getElementById(
        progressId
      );
    const text =
      document.getElementById(
        progressId + "-text"
      );
    if (bar) {
      bar.style.width =
        "100%";
    }
    if (text) {
      text.innerHTML =
        "Restore selesai";
    }

    setTimeout(() => {
      const box =
        document.getElementById(
          progressId + "-box"
        );

      if (box) {
        box.remove();
      }
      addBackupChatMessage(
        "bot",
        `
        Restore berhasil
        <br><br>
        Database sudah dikembalikan.
        `
      );

      // CLEAR CACHE
      state.cashFlowData = null;
      state.cashFlowFilter = null;
      state.expenseDashboardData = null;
      state.expenseDashboardFilter = null;
      state.grossRevenueData = null;
      state.grossRevenueFilter = null;
      setTimeout(() => {
        loadCashFlowPage();
      }, 1000);
    }, 700);
  }
  catch (err) {
    clearInterval(interval);
    isRestoring = false;
    addBackupChatMessage(
      "bot",
      `
      ❌ Restore gagal
      <br><br>
      ${err.message}
      `
    );
  }
}

async function deleteBackup(id) {
  if (!confirm(
      `Hapus backup ${id} ?
			File backup akan dihapus permanen.`)
  ) {
    return;
  }
  const progressId = "delete-progress-" + Date.now();
  addBackupChatMessage(
    "bot",
    `
    Menghapus backup...

    <div id="${progressId}-box"
      class="w-full bg-outline-variant/10 rounded-md h-2 overflow-hidden">
      <div id="${progressId}"
        class="h-full bg-red-400 rounded-md transition-all duration-500"
        style="width:5%">
			</div>
    </div>

    <p id="${progressId}-text"
      class="text-xs text-muted mt-2">
      Menyiapkan penghapusan...
    </p>
    `
  );

  let progress = 5;
  const interval =
    setInterval(() => {
      progress +=
        Math.floor(
          Math.random() * 10
        ) + 5;
      if (progress >= 90) {
        progress = 90;
      }

      const bar = document.getElementById(progressId);
      const text = document.getElementById(progressId + "-text");
      if (bar) {
        bar.style.width =
          progress + "%";
      }

      if (text) {
        if (progress < 20) {
          text.innerHTML =
            "Mencari data backup...";
        }
        else if (progress < 50) {
          text.innerHTML =
            "Menghapus file backup JSON...";
        }
        else if (progress < 80) {
          text.innerHTML =
            "Menghapus dari Storage...";
        }
        else {
          text.innerHTML =
            "Menghapus riwayat backup...";
        }
      }
    }, 800);

  try {
    // DELETE SUPABASE BACKUP
    const res =
      await deleteBackupById(id);

    if ( res?.success === false
    ) {
      throw new Error(
        res.message ||
        "Gagal menghapus backup"
      );
    }

    clearInterval(interval);
    const bar = document.getElementById(progressId);
    const text =document.getElementById(progressId + "-text");
    if (bar) {
      bar.style.width =
        "100%";
    }

    if (text) {
      text.innerHTML =
        "Backup berhasil dihapus";
    }

    setTimeout(() => {
      addBackupChatMessage(
        "bot",
        `
        Backup berhasil dihapus
        <br><br>
        ${id}
        `
      );
      loadBackupList();
    }, 700);
  }
  catch (err) {
    clearInterval(interval);
    addBackupChatMessage(
      "bot",
      `
      ❌ Hapus backup gagal
      <br><br>
      ${err.message}
      `
    );
  }
}
	
async function clearDatabaseConfirm() {
  if (
    !confirm(`
⚠️ PERINGATAN

Semua data POS aktif akan dihapus:

- Transaksi
- Member
- Produk
- Inventory
- Cashflow
- Data operasional lainnya

Pastikan data POS sudah backup terbaru.

Lanjutkan?
    `)
  ) {
    return;
  }

  const progressId = "clear-progress-" + Date.now();
  addBackupChatMessage(
    "bot",
    `
    Mengosongkan database...

    <div id="${progressId}-box"
      class="w-full bg-outline-variant/10 rounded-md h-2 overflow-hidden">
      <div id="${progressId}"
        class="h-full bg-primary rounded-md transition-all duration-500"
        style="width:5%">
			</div>
    </div>

    <p id="${progressId}-text"
      class="text-xs text-muted mt-2">
      Menyiapkan database...
    </p>
    `
  );

  let progress = 5;
  const interval =
    setInterval(() => {
      progress +=
        Math.floor(
          Math.random() * 10
        ) + 5;
      if (progress >= 90) {
        progress = 90;
      }
      const bar =
        document.getElementById(
          progressId
        );
      const text =
        document.getElementById(
          progressId + "-text"
        );
      if (bar) {
        bar.style.width =
          progress + "%";
      }
      if (text) {
        if (progress < 20) {
          text.innerHTML =
            "Clear tabel Transaksi...";
        }
        else if (progress < 35) {
          text.innerHTML =
            "Clear tabel Member...";
        }
        else if (progress < 50) {
          text.innerHTML =
            "Clear tabel Ingredient...";
        }
        else if (progress < 80) {
          text.innerHTML =
            "Clear tabel History...";
        }
        else {
          text.innerHTML =
            "Clear database...";
        }
      }
    }, 800);
	
  try {
    // CLEAR DATABASE
    const res =
      await clearDatabaseRPC();

    if (
      res?.success === false
    ) {
      throw new Error(
        res.message ||
        "Clear database gagal"
      );
    }

    clearInterval(interval);
    const bar = document.getElementById(progressId);
    const text = document.getElementById(progressId + "-text");
    if (bar) {
      bar.style.width =
        "100%";
    }
    if (text) {
      text.innerHTML =
        "Database berhasil dikosongkan";
    }

    addBackupChatMessage(
      "bot",
      `
      Tabel database berhasil dikosongkan
      <br><br>
      ${res?.message || "Database berhasil dikosongkan."}
      `
    );

    // CLEAR CACHE
    state.cashFlowData = null;
    state.cashFlowFilter = null;
    state.expenseDashboardData = null;
    state.expenseDashboardFilter = null;
    state.grossRevenueData = null;
    state.grossRevenueFilter = null;
  }
  catch (err) {
    clearInterval(interval);
    addBackupChatMessage(
      "bot",
      `
      ❌ Clear database gagal
      <br><br>
      ${err.message}
      `
    );
  }
}
	
document.addEventListener(
  "click",
  function(e) {
    const btn =
      e.target.closest(
        "#btnExportCashFlowPDF"
      );

    if (!btn) return;
    exportCashFlowReport();
  }
);


async function exportCashFlowReport() {
  const startDate =
    document.getElementById(
      "cf-start-date"
    )?.value || "";

  const endDate =
    document.getElementById(
      "cf-end-date"
    )?.value || "";

  const branch =
    document.getElementById(
      "cf-branch"
    )?.value ||
    state?.branchId ||
    "ALL";

  // LOGIN USER
  const loginUserId = state?.user?.id || "";
  // VALIDASI
  if (!startDate || !endDate) {
    alert(
      "Pilih tanggal dulu"
    );
    return;
  }

  if (!branch) {
    alert(
      "Branch tidak valid"
    );
    return;
  }

  if (!loginUserId) {
    alert(
      "User login tidak ditemukan."
    );
    return;
  }

  // OPEN WINDOW
  const pdfWindow =
    window.open(
      "",
      "_blank"
    );

  if (!pdfWindow) {
    alert(
      "Popup diblokir browser."
    );
    return;
  }

  // LOADING
  pdfWindow.document.write(`
    <html>
      <head>
        <title>
          Generating Cash Flow Report
        </title>
				
        <style>
          body {
            margin: 0;
            background: #0B0F14;
            color: white;
            font-family: Arial, sans-serif;
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100vh;
          }

          .loading {
            text-align: center;
          }

          .title {
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 8px;
          }

          .text {
            font-size: 13px;
            opacity: .7;
          }
        </style>
      </head>

      <body>
        <div class="loading">
          <div class="title">
            Cash Flow Report
          </div>

          <div class="text">
            Generating PDF...
          </div>
        </div>
      </body>
    </html>
  `);

  try {
		const sessionId =
  		localStorage.getItem("pos_session_id");
    const response =
	  await fetch("/api/export-pdf", {
		method: "POST",
		headers: {
		  "Content-Type": "application/json"
		},
	
		body: JSON.stringify({
		  type: "cash-flow",
		  start: startDate,
		  end: endDate,
		  branchId: branch,
			sessionId,
		  loginUserId,
			tenantSlug: state.tenantSlug
		})
	});
		
    // HTTP ERROR
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        errorText ||
        `Export gagal (${response.status})`
      );
    }
    // GET HTML REPORT
    const html = await response.text();
    if (!html) {
      throw new Error(
        "Server mengembalikan HTML kosong"
      );
    }
    // RENDER REPORT
    pdfWindow.document.open();
    pdfWindow.document.write(html);
    pdfWindow.document.close();
  }

  catch (err) {
    // ERROR PAGE
    pdfWindow.document.open();
    pdfWindow.document.write(`
      <html>
        <body style="
          background:#0B0F14;
          color:white;
          font-family:Arial;
          padding:40px;">

          <h2>
            Export Failed
          </h2>

          <p style="color:#aaa;">
            Gagal membuat Cash Flow Report.
          </p>

          <pre style=" white-space:pre-wrap;
            background:#151A21;
            padding:15px;
            border-radius:10px;">
							${String( err?.message || err)}
					</pre>
        </body>
      </html>
    `);
    pdfWindow.document.close();
  }
}

/* =========================================================
   ASSET MANAGEMENT
   ========================================================= */

let assetData = [];
let depreciationHistoryData = [];

let assetCurrentPage = 1;
let depreciationCurrentPage = 1;

const ASSET_PAGE_SIZE = 10;
const DEPRECIATION_PAGE_SIZE = 10;


/* =========================================================
   FORMAT
   ========================================================= */

function formatAssetCurrency(value) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(Number(value || 0));
}

function formatAssetNumber(value) {
  return new Intl.NumberFormat("id-ID", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(Number(value || 0));
}

function formatAssetDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (isNaN(date.getTime())) return value;
  return date.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
}

function formatAssetPeriod(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (isNaN(date.getTime())) return value;
  return date.toLocaleDateString("id-ID", {
    month: "short",
    year: "numeric"
  });
}


/* =========================================================
   LOAD ASSET DATA
   ========================================================= */
state.assetData = null;
state.assetDataBranchId = null;

state.depreciationHistoryData = null;
state.depreciationHistoryBranchId = null;
async function loadAssetPage() {
  try {
    const sessionId =
      localStorage.getItem("pos_session_id");

    if (!state.branchId) {
      console.warn("BranchId belum tersedia");
      return;
    }

    if (!sessionId) {
      console.warn("Session ID belum tersedia");
      return;
    }

    const branchId = state.branchId;

    // =====================================================
    // CACHE ASSETS
    // =====================================================

    if (
      state.assetData &&
      state.assetDataBranchId === branchId
    ) {
      assetData = state.assetData;
    } else {
      const {
        data: assets,
        error: assetError
      } = await supabaseClient.rpc(
        "get_assets",
        {
          p_branch_id: branchId,
          p_session_id: sessionId
        }
      );

      if (assetError) {
        throw assetError;
      }

      assetData = assets || [];

      // SAVE CACHE
      state.assetData = assetData;
      state.assetDataBranchId = branchId;
    }

    // =====================================================
    // CACHE DEPRECIATION HISTORY
    // =====================================================

    if (
      state.depreciationHistoryData &&
      state.depreciationHistoryBranchId === branchId
    ) {
      depreciationHistoryData =
        state.depreciationHistoryData;
    } else {
      const {
        data: depreciation,
        error: depreciationError
      } = await supabaseClient.rpc(
        "get_asset_depreciation_history",
        {
          p_branch_id: branchId,
          p_session_id: sessionId
        }
      );

      if (depreciationError) {
        throw depreciationError;
      }

      depreciationHistoryData =
        depreciation || [];

      // SAVE CACHE
      state.depreciationHistoryData =
        depreciationHistoryData;

      state.depreciationHistoryBranchId =
        branchId;
    }

    // =====================================================
    // RENDER
    // =====================================================

    renderAssetKPI();
    renderAssetTable();
    renderDepreciationHistory();

  } catch (error) {
    console.error(
      "loadAssetPage error:",
      error
    );

    assetData = [];
    depreciationHistoryData = [];

    renderAssetKPI();
    renderAssetTable();
    renderDepreciationHistory();
  }
}

function clearAssetCache() {
  state.assetData = null;
  state.assetDataBranchId = null;

  state.depreciationHistoryData = null;
  state.depreciationHistoryBranchId = null;
}

/* =========================================================
   KPI
   ========================================================= */

function renderAssetKPI() {
  const activeAssets = assetData.filter(
    asset => String(asset.Status).toUpperCase() === "ACTIVE"
  );
  const totalAssets = activeAssets.length;
  const purchaseCost = activeAssets.reduce(
    (sum, asset) => sum + Number(asset.Purchase_Cost || 0),
    0
  );
  const accumulatedDepreciation = activeAssets.reduce(
    (sum, asset) => sum + Number(asset.Accumulated_Depreciation || 0),
    0
  );
  const bookValue = activeAssets.reduce(
    (sum, asset) => sum + Number(asset.Book_Value || 0),
    0
  );

  const monthlyDepreciation = activeAssets.reduce(
    (sum, asset) => {
      if (
        String(asset.Depreciation_Method).toUpperCase() ===
        "STRAIGHT LINE"
      ) {
        const usefulLife = Number(
          asset.Useful_Life_Months || 0
        );
        if (usefulLife > 0) {
          return sum +
            (
              Number(asset.Purchase_Cost || 0) /
              usefulLife
            );
        }
      }
      return sum;
    },
    0
  );

  const totalCountElement = document.getElementById("asset-total-count");
  const purchaseCostElement = document.getElementById("asset-purchase-cost");
  const accumulatedElement =
    document.getElementById(
      "asset-accumulated-depreciation"
    );
  const bookValueElement = document.getElementById("asset-book-value");
  const monthlyElement =
    document.getElementById(
      "asset-monthly-depreciation"
    );

  if (totalCountElement) {totalCountElement.textContent =
      formatAssetNumber(totalAssets);
  }
  if (purchaseCostElement) {purchaseCostElement.textContent =
      formatAssetCurrency(purchaseCost);
  }
  if (accumulatedElement) {accumulatedElement.textContent =
      formatAssetCurrency(accumulatedDepreciation);
  }
  if (bookValueElement) {bookValueElement.textContent =
      formatAssetCurrency(bookValue);
  }
  if (monthlyElement) {monthlyElement.textContent =
      formatAssetCurrency(monthlyDepreciation);
  }
}

/* =========================================================
   ASSET TABLE
   ========================================================= */

function renderAssetTable() {
  const tbody = document.getElementById("asset-table-body");
  if (!tbody) return;
  const searchInput = document.getElementById("assetSearchInput");
  const statusFilter = document.getElementById("assetStatusFilter");
  const search =
    searchInput?.value
      ?.trim()
      ?.toLowerCase() || "";

  const status =
    statusFilter?.value || "all";

  let filteredData = assetData.filter(asset => {
    const matchesSearch =
      !search ||
      String(asset.Asset_ID)
        .toLowerCase()
        .includes(search) ||
      String(asset.Asset_Name)
        .toLowerCase()
        .includes(search);

    const matchesStatus =
      status === "all" ||
      String(asset.Status).toLowerCase() === status;
    return matchesSearch && matchesStatus;
  });

  const totalPages =
    Math.max(
      1,
      Math.ceil(
        filteredData.length /
        ASSET_PAGE_SIZE
      )
    );

  if (assetCurrentPage > totalPages) {
    assetCurrentPage = totalPages;
  }

  const start =
    (assetCurrentPage - 1) *
    ASSET_PAGE_SIZE;

  const pageData =
    filteredData.slice(
      start,
      start + ASSET_PAGE_SIZE
    );

  if (!pageData.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="9"
            class="text-center text-muted py-10">
          No assets found
        </td>
      </tr>
    `;
    updateAssetPagination(
      filteredData.length,
      totalPages
    );
    return;
  }

  tbody.innerHTML =
    pageData.map(asset => {
      const usefulLife = Number(asset.Useful_Life_Months || 0);
		
      const depreciationPerMonth =
        usefulLife > 0 &&
        String(asset.Depreciation_Method)
          .toUpperCase() === "STRAIGHT LINE"
          ? Number(asset.Purchase_Cost || 0) /
            usefulLife
          : 0;

      const status =
        String(asset.Status || "")
          .toUpperCase();

      const statusClass =
			  status === "ACTIVE"
			    ? "text-emerald-400"
			    : "text-muted";
			
			const actionHTML = `
			  <div class="relative inline-block">
			
				<button
				  type="button"
				  onclick="openAssetActionModal('${escapeAssetHTML(asset.Asset_ID)}')"
				  class="w-8 h-8 flex items-center justify-center
						 rounded-md
						 hover:bg-background-high
						 transition-colors"
				  title="Action"
				>
				  <span class="material-symbols-outlined text-[20px]">
					more_vert
				  </span>
				</button>
			
			  </div>
			`;
      return `
        <tr class="hover:bg-background-high transition-colors">
          <!-- ASSET -->
          <td class="px-6 py-4">
            <div class="flex flex-col">
              <span class="font-semibold text-sm">
                ${escapeAssetHTML(asset.Asset_Name)}
              </span>
			  
              <span class="text-[10px] text-muted mt-1">
                ${escapeAssetHTML(asset.Asset_ID)}
              </span>
            </div>
          </td>

          <!-- PURCHASE DATE -->
          <td class="px-6 py-4 text-sm text-muted">
            ${formatAssetDate(asset.Purchase_Date)}
          </td>

          <!-- PURCHASE COST -->
          <td class="px-6 py-4 text-right text-sm">
            ${formatAssetCurrency(asset.Purchase_Cost)}
          </td>

          <!-- USEFUL LIFE -->
          <td class="px-6 py-4 text-center">
            <span class="text-sm">
              ${
                usefulLife > 0
                  ? usefulLife + " bulan"
                  : "-"
              }
            </span>
          </td>

          <!-- DEPRECIATION -->
          <td class="px-6 py-4 text-right text-sm">
            ${
              depreciationPerMonth > 0
                ? formatAssetCurrency(
                    depreciationPerMonth
                  )
                : "-"
            }
          </td>

          <!-- ACCUMULATED -->
          <td class="px-6 py-4 text-right text-sm">
            ${formatAssetCurrency(asset.Accumulated_Depreciation )}
          </td>

          <!-- BOOK VALUE -->
          <td class="px-6 py-4 text-right text-sm font-semibold">
            ${formatAssetCurrency( asset.Book_Value)}
          </td>

          <!-- STATUS -->
          <td class="px-6 py-4 text-center">
            <span class="${statusClass} text-[10px] font-bold uppercase tracking-widest">
              ${escapeAssetHTML(asset.Status)}
            </span>
          </td>

					<!-- ACTION -->
					<td class="px-6 py-4 text-center">
					  ${actionHTML}
					</td>
        </tr>
      `;
    }).join("");
  updateAssetPagination(
    filteredData.length,
    totalPages
  );
}

let currentAsset = null;
function openAssetActionModal(assetId) {
  const asset = assetData.find(
    item => String(item.Asset_ID) === String(assetId)
  );

  if (!asset) {
    console.warn("Asset tidak ditemukan:", assetId);
    return;
  }

  currentAsset = asset;
  const template = document.getElementById("assetActionModalTemplate");
  if (!template) {
    console.warn("assetActionModalTemplate tidak ditemukan");
    return;
  }

  // Hapus modal lama jika masih ada
  document
    .getElementById("assetActionModalOverlay")
    ?.remove();
  const modal = template.content.cloneNode(true);
  document.body.appendChild(modal);
	
  // SET DATA
  const nameEl = document.getElementById("modalAssetName");
  const idEl = document.getElementById("modalAssetId");
  const depreciationStatusEl =
    document.getElementById(
      "modalAssetDepreciationStatus"
    );

  if (nameEl) {
    nameEl.textContent =
      asset.Asset_Name || "-";
  }

  if (idEl) {
    idEl.textContent =
      asset.Asset_ID || "-";
  }

  if (depreciationStatusEl) {
    const usefulLife =
      Number(asset.Useful_Life_Months || 0);

    if (usefulLife > 0) {
      const depreciation =
        String(asset.Depreciation_Method || "")
          .toUpperCase() === "STRAIGHT LINE"
          ? Number(asset.Purchase_Cost || 0) /
            usefulLife
          : 0;
      depreciationStatusEl.textContent =
        `${usefulLife} bulan • ${formatAssetCurrency(depreciation)} / bulan`;

    } else {
      depreciationStatusEl.textContent =
        "Masa manfaat belum diatur";
    }
  }
}

function closeAssetActionModal() {
  const overlay =
    document.getElementById(
      "assetActionModalOverlay"
    );
  if (overlay) {
    overlay.remove();
  }
  currentAsset = null;
}

function openAssetDepreciationModal(asset) {
  if (!asset) {
    console.warn("Asset tidak ditemukan");
    return;
  }

  currentAsset = asset;
  const template =
    document.getElementById(
      "assetDepreciationModalTemplate"
    );

  if (!template) {
    console.warn(
      "assetDepreciationModalTemplate tidak ditemukan"
    );
    return;
  }
  // Tutup modal sebelumnya
  document .getElementById("assetActionModalOverlay")
    ?.remove();
  document .getElementById("assetDepreciationModalOverlay")
    ?.remove();
  const modal = template.content.cloneNode(true);
  document.body.appendChild(modal);

  // =========================
  // DATA ASSET
  // =========================

  const nameEl =
    document.getElementById(
      "depreciationModalAssetName"
    );

  const idEl =
    document.getElementById(
      "depreciationModalAssetId"
    );

  const purchaseCostEl =
    document.getElementById(
      "depreciationModalPurchaseCost"
    );

  const usefulLifeEl =
    document.getElementById(
      "assetUsefulLifeInput"
    );

  const methodEl =
    document.getElementById(
      "assetDepreciationMethod"
    );

  if (nameEl) {
    nameEl.textContent = asset.Asset_Name || "-";
  }
  if (idEl) {
    idEl.textContent = asset.Asset_ID || "-";
  }

  if (purchaseCostEl) {
    purchaseCostEl.textContent =
      formatAssetCurrency(
        Number(asset.Purchase_Cost || 0)
      );
  }
  // Isi nilai lama jika sudah pernah diatur
  if (usefulLifeEl) {
    const usefulLife =
      Number(asset.Useful_Life_Months || 0);

    usefulLifeEl.value =
      usefulLife > 0
        ? usefulLife
        : "";
  }

  if (methodEl) {
    methodEl.value =
      asset.Depreciation_Method ||
      "Straight Line";
  }

  // Hitung preview awal
  updateAssetDepreciationPreview();
  // Update preview saat input berubah
	if (usefulLifeEl) {
	  usefulLifeEl.addEventListener(
	    "input",
	    updateAssetDepreciationPreview
	  );
	}
	
	if (methodEl) {
	  methodEl.addEventListener(
	    "change",
	    updateAssetDepreciationPreview
	  );
	}
	
	// Fokus input + pilih seluruh nilai lama
	setTimeout(() => {
	  if (usefulLifeEl) {
	    usefulLifeEl.focus();
	    usefulLifeEl.select();
	  }
	}, 50);
}

function updateAssetDepreciationPreview() {
  const usefulLifeEl =
    document.getElementById(
      "assetUsefulLifeInput"
    );

  const monthlyEl =
    document.getElementById(
      "depreciationModalMonthly"
    );

  if (!usefulLifeEl || !monthlyEl) {
    return;
  }
  const usefulLife = Number(usefulLifeEl.value || 0);
  const purchaseCost = Number(currentAsset?.Purchase_Cost || 0);
  const method =
    document.getElementById(
      "assetDepreciationMethod"
    )?.value || "Straight Line";
  let depreciation = 0;

  if (
    usefulLife > 0 &&
    method.toUpperCase() === "STRAIGHT LINE"
  ) {
    depreciation =
      purchaseCost / usefulLife;
  }
  monthlyEl.textContent = formatAssetCurrency(depreciation);
}

function formatAssetCurrency(value) {
  return new Intl.NumberFormat(
    "id-ID",
    {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 2
    }
  ).format(Number(value || 0));
}

function closeAssetDepreciationModal() {
  const overlay =
    document.getElementById(
      "assetDepreciationModalOverlay"
    );
  if (overlay) {
    overlay.remove();
  }
}

async function saveAssetDepreciationSetting() {

  try {
    if (!currentAsset) {
      alert("Asset tidak ditemukan.");
      return;
    }
    const usefulLifeEl =
      document.getElementById(
        "assetUsefulLifeInput"
      );
    const methodEl =
      document.getElementById(
        "assetDepreciationMethod"
      );
    const usefulLife = Number(usefulLifeEl?.value || 0);
    const method = methodEl?.value || "Straight Line";
    // VALIDASI
    if (
      !Number.isInteger(usefulLife) ||
      usefulLife <= 0
    ) {
      alert(
        "Masa manfaat harus diisi lebih dari 0 bulan."
      );
      usefulLifeEl?.focus();
      return;
    }

    if (
      method.toUpperCase() !==
      "STRAIGHT LINE"
    ) {
      alert(
        "Metode depresiasi belum didukung."
      );
      return;
    }

    const sessionId =
      localStorage.getItem("pos_session_id");
    if (!sessionId) {
      alert("Session ID tidak ditemukan.");
      return;
    }
    if (!state.branchId) {
      alert("Branch belum tersedia.");
      return;
    }
    // SIMPAN
    const { data, error } =
      await supabaseClient.rpc(
        "update_asset_depreciation_setting",
        {
          p_asset_id: currentAsset.Asset_ID,
          p_useful_life_months: usefulLife,
          p_depreciation_method: method,
          p_session_id: sessionId
        }
      );

    if (error) {
      throw error;
    }

    // UPDATE DATA LOCAL
	const assetIndex =
	  assetData.findIndex(
	    asset =>
	      String(asset.Asset_ID) ===
	      String(currentAsset.Asset_ID)
	  );
	
	if (assetIndex !== -1) {
	  assetData[assetIndex].Useful_Life_Months =
	    usefulLife;
	
	  assetData[assetIndex].Depreciation_Method =
	    method;
	
	  currentAsset =
	    assetData[assetIndex];
	
	  // SYNC CACHE
	  state.assetData =
	    assetData;
	    
	  state.assetDataBranchId =
	    state.branchId;
	}
    // TUTUP MODAL
    closeAssetDepreciationModal();
    // REFRESH UI
    renderAssetKPI();
    renderAssetTable();
    console.log(
      "Pengaturan depresiasi berhasil disimpan."
    );

  } catch (error) {
    console.error(
      "saveAssetDepreciationSetting error:",
      error
    );
    alert(
      error?.message ||
      "Gagal menyimpan pengaturan depresiasi."
    );
  }
}

function viewAssetDetail(asset) {
  if (!asset) {
    console.warn("Asset tidak ditemukan");
    return;
  }

  currentAsset = asset;
  const template =
    document.getElementById(
      "assetDetailModalTemplate"
    );

  if (!template) {
    console.warn(
      "assetDetailModalTemplate tidak ditemukan"
    );
    return;
  }

  // Tutup modal sebelumnya
  document .getElementById("assetActionModalOverlay")
    ?.remove();
  document .getElementById("assetDetailModalOverlay")
    ?.remove();

  const modal = template.content.cloneNode(true);
  document.body.appendChild(modal);

  // BASIC
  document.getElementById(
    "detailAssetName"
  ).textContent =
    asset.Asset_Name || "-";

  document.getElementById(
    "detailAssetId"
  ).textContent =
    asset.Asset_ID || "-";

  document.getElementById(
    "detailAssetPurchaseDate"
  ).textContent =
    formatAssetDate(asset.Purchase_Date);

  document.getElementById(
    "detailAssetPurchaseCost"
  ).textContent =
    formatAssetCurrency(
      asset.Purchase_Cost
    );

  // DEPRECIATION
  const usefulLife = Number(asset.Useful_Life_Months || 0);
  const monthlyDepreciation =
    usefulLife > 0 &&
    String(asset.Depreciation_Method || "")
      .toUpperCase() === "STRAIGHT LINE"
      ? Number(asset.Purchase_Cost || 0) /
        usefulLife
      : 0;

  document.getElementById(
    "detailAssetUsefulLife"
  ).textContent =
    usefulLife > 0
      ? `${usefulLife} bulan`
      : "Belum diatur";

  document.getElementById(
    "detailAssetMethod"
  ).textContent =
    usefulLife > 0
      ? asset.Depreciation_Method || "-"
      : "-";

  // VALUE
  document.getElementById(
    "detailAssetAccumulated"
  ).textContent =
    formatAssetCurrency(
      asset.Accumulated_Depreciation
    );

  document.getElementById(
    "detailAssetBookValue"
  ).textContent =
    formatAssetCurrency(
      asset.Book_Value
    );

  document.getElementById(
    "detailAssetMonthlyDepreciation"
  ).textContent =
    usefulLife > 0
      ? formatAssetCurrency(
          monthlyDepreciation
        )
      : "-";

  // STATUS
  document.getElementById(
    "detailAssetStatus"
  ).textContent =
    asset.Status || "-";

  document.getElementById(
    "detailAssetLastDepreciation"
  ).textContent =
    asset.Last_Depreciation_Date
      ? formatAssetDate(
          asset.Last_Depreciation_Date
        )
      : "Belum ada";

  // NOTES
  document.getElementById(
    "detailAssetNotes"
  ).textContent =
    asset.Notes || "-";
}

function closeAssetDetailModal() {
  const overlay =
    document.getElementById(
      "assetDetailModalOverlay"
    );
  if (overlay) {
    overlay.remove();
  }
}

function formatAssetDate(dateValue) {
  if (!dateValue) {
    return "-";
  }
  const date = new Date(dateValue);
  if (isNaN(date.getTime())) {
    return "-";
  }
  return date.toLocaleDateString(
    "id-ID",
    {
      day: "2-digit",
      month: "short",
      year: "numeric"
    }
  );
}

/* =========================================================
   ASSET PAGINATION
   ========================================================= */

function updateAssetPagination(totalItems, totalPages) {
  const info =
    document.getElementById(
      "asset-pagination-info"
    );

  const prevBtn =
    document.getElementById(
      "assetPrevBtn"
    );

  const nextBtn =
    document.getElementById(
      "assetNextBtn"
    );
	
  if (info) {
    if (totalItems === 0) {
      info.textContent = "Showing 0 assets";
    } else {
      const start =
        (assetCurrentPage - 1) *
        ASSET_PAGE_SIZE + 1;
		
      const end =
        Math.min(
          assetCurrentPage *
          ASSET_PAGE_SIZE,
          totalItems
        );
      info.textContent = `Showing ${start}-${end} of ${totalItems} assets`;
    }
  }

  if (prevBtn) {
    prevBtn.disabled = assetCurrentPage <= 1;
  }
  if (nextBtn) {
    nextBtn.disabled = assetCurrentPage >= totalPages;
  }
}


/* =========================================================
   DEPRECIATION HISTORY
   ========================================================= */

function renderDepreciationHistory() {
  const tbody =
    document.getElementById(
      "depreciation-table-body"
    );
  if (!tbody) return;
  const searchInput =
    document.getElementById(
      "depreciationSearchInput"
    );

  const search =
    searchInput?.value
      ?.trim()
      ?.toLowerCase() || "";

  const filteredData =
    depreciationHistoryData.filter(item => {
      return (
        !search ||
        String(item.Asset_ID)
          .toLowerCase()
          .includes(search) ||
        String(item.Asset_Name)
          .toLowerCase()
          .includes(search)
      );
    });

  const totalPages =
    Math.max(
      1,
      Math.ceil(
        filteredData.length /
        DEPRECIATION_PAGE_SIZE
      )
    );

  if (
    depreciationCurrentPage >
    totalPages
  ) {
    depreciationCurrentPage =
      totalPages;
  }

  const start =
    (depreciationCurrentPage - 1) *
    DEPRECIATION_PAGE_SIZE;

  const pageData =
    filteredData.slice(
      start,
      start + DEPRECIATION_PAGE_SIZE
    );

  if (!pageData.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="text-center text-muted py-10">
          No depreciation history
        </td>
      </tr>
    `;
    updateDepreciationPagination(
      filteredData.length,
      totalPages
    );
    return;
  }


  tbody.innerHTML =
    pageData.map(item => {
      return `
        <tr class="hover:bg-background-high transition-colors">
          <td class="px-6 py-4 text-sm">
            ${formatAssetPeriod(
              item.Period
            )}
          </td>

          <td class="px-6 py-4">
            <div class="flex flex-col">
              <span class="text-sm font-semibold">
                ${escapeAssetHTML(
                  item.Asset_Name
                )}
              </span>

              <span class="text-[10px] text-muted">
                ${escapeAssetHTML(
                  item.Asset_ID
                )}
              </span>
            </div>
          </td>

          <td class="px-6 py-4 text-right text-sm">
            ${formatAssetCurrency(
              item.Depreciation_Amount
            )}
          </td>

          <td class="px-6 py-4 text-right text-sm">
            ${formatAssetCurrency(
              item.Book_Value_Before
            )}
          </td>

          <td
            class="px-6 py-4 text-right
            text-sm font-semibold">
            ${formatAssetCurrency(
              item.Book_Value_After
            )}
          </td>

          <td class="px-6 py-4 text-sm text-muted">
            ${formatAssetDateTime(
              item.Created_At
            )}
          </td>
        </tr>
      `;
    }).join("");

  updateDepreciationPagination(
    filteredData.length,
    totalPages
  );
}


/* =========================================================
   DEPRECIATION PAGINATION
   ========================================================= */

function updateDepreciationPagination( totalItems, totalPages ) {
  const info =
    document.getElementById(
      "depreciation-pagination-info"
    );

  const prevBtn =
    document.getElementById(
      "depreciationPrevBtn"
    );

  const nextBtn =
    document.getElementById(
      "depreciationNextBtn"
    );


  if (info) {
    if (totalItems === 0) {
      info.textContent =
        "Showing 0 depreciation records";

    } else {
      const start =
        (depreciationCurrentPage - 1) *
        DEPRECIATION_PAGE_SIZE + 1;

      const end =
        Math.min(
          depreciationCurrentPage *
          DEPRECIATION_PAGE_SIZE,
          totalItems
        );
      info.textContent =
        `Showing ${start}-${end} of ${totalItems} records`;
    }
  }
  if (prevBtn) {
    prevBtn.disabled = depreciationCurrentPage <= 1;
  }
  if (nextBtn) {
    nextBtn.disabled = depreciationCurrentPage >= totalPages;
  }
}


/* =========================================================
   EVENT LISTENERS
   ========================================================= */

function initAssetPageEvents() {
  const searchInput =
    document.getElementById(
      "assetSearchInput"
    );

  const statusFilter =
    document.getElementById(
      "assetStatusFilter"
    );

  const depreciationSearch =
    document.getElementById(
      "depreciationSearchInput"
    );


  searchInput?.addEventListener(
    "input",
    () => {
      assetCurrentPage = 1;
      renderAssetTable();
    }
  );

  statusFilter?.addEventListener(
    "change",
    () => {
      assetCurrentPage = 1;
      renderAssetTable();
    }
  );

  depreciationSearch?.addEventListener(
    "input",
    () => {
      depreciationCurrentPage = 1;
      renderDepreciationHistory();
    }
  );

  document
    .getElementById("assetPrevBtn")
    ?.addEventListener(
      "click",
      () => {

        if (assetCurrentPage > 1) {
          assetCurrentPage--;
          renderAssetTable();
        }
      }
    );

  document
    .getElementById("assetNextBtn")
    ?.addEventListener(
      "click",
      () => {
        assetCurrentPage++;
        renderAssetTable();
      }
    );

  document
    .getElementById("depreciationPrevBtn")
    ?.addEventListener(
      "click",
      () => {

        if (depreciationCurrentPage > 1) {
          depreciationCurrentPage--;
          renderDepreciationHistory();
        }
      }
    );
	
  document
    .getElementById("depreciationNextBtn")
    ?.addEventListener(
      "click",
      () => {
        depreciationCurrentPage++;
        renderDepreciationHistory();
      }
    );
}


/* =========================================================
   DATE TIME
   ========================================================= */

function formatAssetDateTime(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}


/* =========================================================
   HTML ESCAPE
   ========================================================= */

function escapeAssetHTML(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}


/* =========================================================
   INITIALIZE
   ========================================================= */

function initAssetPage() {
  assetCurrentPage = 1;
  depreciationCurrentPage = 1;
  initAssetPageEvents();
  loadAssetPage();
}


/* =========================================================
   OVERVIEW AKUTANSI
   ========================================================= */
async function loadAccountingOverview() {
  const period = document.getElementById('accounting-period').value;
  const branch = document.getElementById('accounting-branch').value;
  const { start, end } = getAccountingDateRange(period);
  const sessionId = localStorage.getItem("pos_session_id");
  const { data, error } = await supabase.rpc(
    'get_accounting_overview',
    {
      p_branch_id: branch,
      p_start: start,
      p_end: end,
      p_session_id: sessionId
    }
  );
  if (error) throw error;
  renderAccountingOverview(data);
}


let accountingInitialized = false;
async function initAccountingModule() {
  try {
    const periodEl = document.getElementById("accounting-period");
    const branchEl = document.getElementById("accounting-branch");

    if (!periodEl || !branchEl) {
      console.warn("Accounting DOM belum tersedia");
      return;
    }

    if (!accountingInitialized) {
      periodEl.addEventListener("change", loadAccountingOverview);
      branchEl.addEventListener("change", loadAccountingOverview);

      accountingInitialized = true;
    }

    await loadAccountingOverview();

  } catch (error) {
    console.error("Accounting init error:", error);
  }
}

/* =========================================================
   RENDER ACCOUNTING OVERVIEW
   ========================================================= */
function renderAccountingOverview(data) {
  if (!data) {
    console.warn("Accounting overview data kosong");
    return;
  }

  const toNumber = (value) => {
    if (value === null || value === undefined || value === "") {
      return 0;
    }

    const number = Number(value);
    return Number.isFinite(number) ? number : 0;
  };

  const formatIDR = (value) => {
    const number = toNumber(value);

    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(number);
  };

  const setText = (id, value) => {
    const el = document.getElementById(id);

    if (el) {
      el.textContent = formatIDR(value);
    }
  };

  const setPlainText = (id, value) => {
    const el = document.getElementById(id);

    if (el) {
      el.textContent = value ?? "-";
    }
  };

  const escapeHTML = (value) => {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  };


  /* =======================================================
     NORMALIZE DATA
     ======================================================= */

  const kpi = data.kpi || {};
  const profitLoss = data.profitLoss || {};
  const financial = data.financialPosition || {};

  const apList = Array.isArray(data.accountsPayableList)
    ? data.accountsPayableList
    : [];

  const recentJournals = Array.isArray(data.recentJournals)
    ? data.recentJournals
    : [];


  /* =======================================================
     KPI
     ======================================================= */

  setText("accounting-cash", kpi.cash);
  setText("accounting-bank", kpi.bank);
  setText("accounting-inventory", kpi.inventory);
  setText("accounting-ap", kpi.accountsPayable);
  setText("accounting-revenue", kpi.revenue);
  setText("accounting-expense", kpi.expense);
  setText("accounting-net-profit", kpi.netProfit);
  setText("accounting-equity", kpi.equity);


  /* =======================================================
     FINANCIAL POSITION - ASSETS
     ======================================================= */

  setText(
    "accounting-assets-cash",
    financial.cash
  );

  setText(
    "accounting-assets-bank",
    financial.bank
  );

  setText(
    "accounting-assets-inventory",
    financial.inventory
  );

  setText(
    "accounting-total-assets",
    financial.totalAssets
  );


  /* =======================================================
     FINANCIAL POSITION - LIABILITIES & EQUITY
     ======================================================= */

  setText(
    "accounting-liability-ap",
    financial.accountsPayable
  );

  setText(
    "accounting-liability-equity",
    financial.equity
  );

  setText(
    "accounting-total-liabilities-equity",
    financial.totalLiabilitiesEquity
  );


  /* =======================================================
     ACCOUNTS PAYABLE LIST
     ======================================================= */

  const apContainer =
    document.getElementById("accounting-ap-list");

  const apTotal =
    document.getElementById("accounting-ap-total");

  if (apContainer) {

    if (apList.length === 0) {

      apContainer.innerHTML = `
        <div class="h-full flex flex-col items-center justify-center text-center">
          <span class="material-symbols-outlined text-4xl text-muted mb-3">
            check_circle
          </span>

          <p class="text-sm font-semibold text-on-surface">
            No Outstanding Payables
          </p>

          <p class="text-xs text-on-surface-variant mt-1">
            All supplier balances are currently settled.
          </p>
        </div>
      `;

    } else {

      apContainer.innerHTML = apList.map(item => {

        const supplier =
          escapeHTML(item.supplier || "-");

        const status =
          escapeHTML(item.status || "OUTSTANDING");

        const date =
          item.date
            ? new Date(item.date).toLocaleDateString("id-ID", {
                day: "2-digit",
                month: "short",
                year: "numeric"
              })
            : "-";

        const amount =
          toNumber(item.amount);

        return `
          <div class="border border-outline-variant rounded-md p-4">

            <div class="flex items-start justify-between gap-4">

              <div class="min-w-0">

                <p class="font-semibold text-sm truncate">
                  ${supplier}
                </p>

                <p class="text-xs text-on-surface-variant mt-1">
                  ${escapeHTML(date)}
                </p>

                <p class="text-[10px] uppercase tracking-wider text-red-400 mt-2">
                  ${status}
                </p>

              </div>

              <div class="text-right shrink-0">

                <p class="font-bold text-sm">
                  ${formatIDR(amount)}
                </p>

              </div>

            </div>

          </div>
        `;

      }).join("");
    }
  }

  /*
   * Total AP menggunakan data dari financial position
   * supaya konsisten dengan KPI dan Balance Sheet.
   */
  if (apTotal) {
    apTotal.textContent =
      formatIDR(financial.accountsPayable);
  }


  /* =======================================================
     RECENT JOURNAL ENTRIES
     ======================================================= */

  const journalContainer =
    document.getElementById("accounting-recent-journals");

  if (journalContainer) {

    if (recentJournals.length === 0) {

      journalContainer.innerHTML = `
        <div class="h-full flex flex-col items-center justify-center text-center">
          <span class="material-symbols-outlined text-4xl text-muted mb-3">
            receipt_long
          </span>

          <p class="text-sm font-semibold text-on-surface">
            No Recent Journal Entries
          </p>

          <p class="text-xs text-on-surface-variant mt-1">
            Journal transactions will appear here.
          </p>
        </div>
      `;

    } else {

      journalContainer.innerHTML =
        recentJournals.map(journal => {

          const date =
            journal.date
              ? new Date(journal.date).toLocaleDateString("id-ID", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric"
                })
              : "-";

          const description =
            escapeHTML(
              journal.description ||
              journal.memo ||
              journal.reference ||
              "Journal Entry"
            );

          const reference =
            escapeHTML(
              journal.reference ||
              journal.id ||
              ""
            );

          const amount =
            toNumber(
              journal.amount ??
              journal.total ??
              journal.debit ??
              0
            );

          return `
            <div class="flex items-center justify-between gap-4
                        border border-outline-variant rounded-md p-4">

              <div class="flex items-center gap-3 min-w-0">

                <div class="main-icon-box shrink-0">
                  <span class="material-symbols-outlined">
                    receipt_long
                  </span>
                </div>

                <div class="min-w-0">

                  <p class="text-sm font-semibold truncate">
                    ${description}
                  </p>

                  <div class="flex items-center gap-2 mt-1">

                    <span class="text-xs text-on-surface-variant">
                      ${escapeHTML(date)}
                    </span>

                    ${
                      reference
                        ? `
                          <span class="text-xs text-on-surface-variant">
                            •
                          </span>

                          <span class="text-xs text-on-surface-variant truncate">
                            ${reference}
                          </span>
                        `
                        : ""
                    }

                  </div>

                </div>

              </div>

              <div class="font-bold text-sm shrink-0">
                ${formatIDR(amount)}
              </div>

            </div>
          `;

        }).join("");
    }
  }


  /* =======================================================
     OPTIONAL: SAVE CURRENT ACCOUNTING DATA
     ======================================================= */
  window.currentAccountingOverview = data;

  console.log(
    "Accounting overview rendered:",
    data
  );
}


