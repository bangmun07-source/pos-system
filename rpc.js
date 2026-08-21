async function uploadBusinessLogo(base64) {

  if (!base64) {
    return null;
  }
    
  // VALIDATE BASE64
  const matches =
    base64.match(
      /^data:(.+);base64,(.+)$/
    );
  if (!matches) {
    throw new Error(
      "Format gambar tidak valid"
    );
  }
  const mime =
    matches[1];
  const base64Data =
    matches[2];

  // BASE64 → BINARY
  const binary =
    atob(base64Data);
  const bytes =
    new Uint8Array(
      binary.length
    );
  for (
    let i = 0;
    i < binary.length;
    i++
  ) {
    bytes[i] =
      binary.charCodeAt(i);
  }

  // FILE EXTENSION
  let ext =
    mime.split("/")[1];
  if (ext === "jpeg") {
    ext = "jpg";
  }

  // FILE PATH
  const path =
    `business/logo_${Date.now()}.${ext}`;


  // UPLOAD SUPABASE STORAGE
  const {
    error
  } =
    await supabaseClient
      .storage
      .from("Logo_Digital_Recipes")
      .upload(
        path,
        bytes,
        {
          contentType:
            mime,
          upsert:
            true
        }
      );

  if (error) {
    console.error(
      "Upload Business Logo Error:",
      error
    );
    throw error;
  }

  // PUBLIC URL
  const {
    data
  } =
    supabaseClient
      .storage
      .from("Logo_Digital_Recipes")
      .getPublicUrl(
        path
      );
  return data.publicUrl;
}


    // ===============================
    // LOGIN PAGE
    // ===============================

async function loginUserRPC(client,username,password){
  const {data,error} =
    await client.rpc(
      "login_user",
      {
        p_username: username,
        p_password: password
      }
    );
  if(error){
    throw error;
  }
  return data;
}

    // ===============================
    // DASHBOARD PAGE
    // ===============================

async function getDashboardDataRPC(branchId) {
  const { data, error } =
    await supabaseClient.rpc(
      "get_dashboard_data",
      {
        p_branch_id: branchId
      }
    );
  if (error) {
    throw error;
  }
  return data || {};
}

async function getLowStockRPC(branchId) {
  const { data, error } =
    await supabaseClient.rpc(
      "get_low_stock",
      {
        p_branch_id: branchId,
        p_limit: 100
      }
    );
  if (error) {
    throw error;
  }
  return data || [];
}

async function getRecentTransactionsRPC(branchId) {
  const { data, error } =
    await supabaseClient.rpc(
      "get_recent_transactions",
      {
        p_branch_id: branchId
      }
    );
  if (error) {
    throw error;
  }
  return data || [];
}

async function getShiftPerformanceRPC(branchId) {
  const { data, error } =
    await supabaseClient.rpc(
      "get_shift_performance",
      {
        p_branch_id: branchId
      }
    );
  if (error) {
    throw error;
  }
  return data || [];
}

async function getTodayYesterdayRPC(branchId) {
  const { data, error } =
    await supabaseClient.rpc(
      "get_today_yesterday_data",
      {
        p_branch_id: branchId
      }
    );
  if (error) {
    throw error;
  }
  return data || [];
}


    // ===============================
    // RECENTTRANSAKSI PAGE
    // ===============================

async function getRecentTransactionsPageRPC( branchId, startDate, endDate, status, table ) {
  const { data, error } =
    await supabaseClient.rpc(
      "get_recent_transactions_page",
      {
        p_branch_id: branchId,
        p_start: startDate || null,
        p_end: endDate || null,
        p_status: status || "ALL",
        p_table: table || "ALL"
      }
    );

  if (error) {
    throw error;
  }
  return data || [];
}


async function getRecentTransactionSummaryRPC( branchId, startDate, endDate, status, table ) {
  const { data, error } =
    await supabaseClient.rpc(
      "get_recent_transaction_summary",
      {
        p_branch_id: branchId,
        p_start: startDate || null,
        p_end: endDate || null,
        p_status: status || "ALL",
        p_table: table || "ALL"
      }
    );
  if (error) {
    throw error;
  }
  return data || {};
}

async function getReceiptDataRPC(trxId) {
  const { data, error } =
    await supabaseClient.rpc(
      "get_receipt_data",
      {
        p_trx_id: trxId
      }
    );
  if (error) {
    console.error(
      "get_receipt_data error:",
      error
    );
    throw error;
  }
  return data;
}

async function getSettingsPageDataRPC() {
  const {
    data,
    error
  } = await supabaseClient.rpc(
    "get_settings_page_data"
  );
  if (error) {
    console.error(
      "get_settings_page_data error:",
      error
    );
    throw error;
  }
  return data;
}

    // ===============================
    // GROSS RAVANUE PAGE
    // ===============================

async function getGrossRevenueDataRPC(branchId, startDate, endDate) {
  try {
      
    // SUMMARY + TREND + CATEGORY
    const summaryData =
      await getGrossRevenueByDateRPC(
        startDate,
        endDate,
        branchId
      );

    // RECENT TRANSACTIONS
    const recentTransactions =
      await getRecentTransactionsRPC(
        branchId,
        startDate,
        endDate
      );
      
    // TOP REVENUE PRODUCTS
    const topRevenue =
      await getTopRevenueProductsRPC(
        startDate,
        endDate,
        branchId,
        20
      );

    // GABUNGKAN
    return {
      summary:
        summaryData?.summary || {},
      trend:
        summaryData?.trend || [],
      category:
        summaryData?.category || [],
      recentTransactions:
        recentTransactions || [],
      topRevenue:
        topRevenue || []
    };
  } catch (err) {
    console.error(
      "getGrossRevenueDataRPC error:",
      err
    );
    throw err;
  }
}

async function getGrossRevenueByDateRPC(start, end, branchId) {
  const {
    data,
    error
  } = await supabaseClient.rpc(
    "get_gross_revenue_by_date",
    {
      p_branch_id: branchId,
      p_start: start || null,
      p_end: end || null
    }
  );
  if (error) {
    console.error(
      "get_gross_revenue_by_date error:",
      error
    );
    throw error;
  }
  return data;
}

async function getTopRevenueProductsRPC(start, end, branchId,limit = 10) {
  const {
    data,
    error
  } = await supabaseClient.rpc(
    "get_top_revenue_products",
    {
      p_branch_id: branchId,
      p_start: start || null,
      p_end: end || null,
      p_limit: limit
    }
  );
  if (error) {
    console.error(
      "get_top_revenue_products error:",
      error
    );
    throw error;
  }
  return data || [];
}

    // ===============================
    // LOGIC CHECKOUT
    // ===============================

async function checkoutTransaction(payload){
  const { data, error } =
    await supabaseClient.rpc(
      "checkout_transaction",
      {
        p_payload: payload
      }
    );
  if(error){
    console.error(
      "checkout_transaction error:",
      error
    );
    throw error;
  }
  return data;
}

async function getLowStockRPC(branchId) {

  const { data, error } =
    await supabaseClient.rpc(
      "get_low_stock",
      {
        p_branch_id: branchId,
        p_limit: 100
      }
    );

  if (error) throw error;

  return data || [];
}

async function getProductsRPC(branchId, role){
  const { data, error } =
    await supabaseClient.rpc(
      "get_products",
      {
        p_branch_id: branchId,
        p_role: role
      }
    );
  if(error){
    console.error(
      "get_products error:",
      error
    );
    throw error;
  }
  return data || [];
}

async function getRewardsRPC(memberId, branchId) {
  const { data, error } =
    await supabaseClient.rpc(
      "get_rewards",
      {
        p_member_id: memberId,
        p_branch_id: branchId
      }
    );
  if(error){
    console.error(
      "get_rewards error:",
      error
    );
    throw error;
  }
  return data || [];
}

async function getOrdersRPC() {
  const {
    data,
    error
  } = await supabaseClient.rpc(
    "get_orders"
  );
  if (error) {
    console.error(
      "get_orders error:",
      error
    );
    throw error;
  }
  return data || [];
}

async function removeItemFromCartRPC(transId, productId) {

  const {
    data,
    error
  } = await supabaseClient.rpc(
    "remove_item_from_cart",
    {
      p_trans_id: transId,
      p_product_id: productId
    }
  );

  if (error) {
    console.error(
      "remove_item_from_cart error:",
      error
    );

    throw error;
  }
  return data;
}

    // ===============================
    // MEMBER PAGE
    // ===============================

async function checkMemberRPC(memberId) {
  const {
    data,
    error
  } = await supabaseClient.rpc(
    "check_member",
    {
      p_member_id: memberId
    }
  );
  if (error) {
    console.error(
      "check_member error:",
      error
    );
    throw error;
  }
  return data;
}

async function getMemberPageDataRPC(branchId) {

  return await supabaseClient.rpc(
    "get_member_page_data",
    {
      p_branch_id: branchId || "ALL"
    }
  ).then(({ data, error }) => {

    if (error) {
      console.error(
        "get_member_page_data error:",
        error
      );

      throw error;
    }

    return data || {
      members: [],
      settings: {}
    };
  });
}

async function getTransactionNotificationsRPC(branchId) {

  const {
    data,
    error
  } = await supabaseClient.rpc(
    "get_transaction_notifications",
    {
      p_branch_id:
        branchId || "ALL"
    }
  );

  if (error) {
    console.error(
      "get_transaction_notifications error:",
      error
    );
    throw error;
  }
  return data || [];
}

async function getMemberDetailPageRPC(memberId, branchId) {

  const {
    data,
    error
  } = await supabaseClient.rpc(
    "get_member_detail_page",
    {
      p_member_id: memberId,
      p_branch_id: branchId || ""
    }
  );

  if (error) {
    console.error(
      "get_member_detail_page error:",
      error
    );
    throw error;
  }
  return data;
}

async function getMembersRPC(branchId) {

  const {
    data,
    error
  } = await supabaseClient.rpc(
    "get_members",
    {
      p_branch_id: branchId || null
    }
  );

  if (error) {
    console.error(
      "get_members error:",
      error
    );
    throw error;
  }
  return data || [];
}

async function searchMembersRPC(keyword) {

  const {
    data,
    error
  } = await supabaseClient.rpc(
    "search_members",
    {
      p_keyword:
        keyword || ""
    }
  );

  if (error) {
    console.error(
      "search_members error:",
      error
    );
    throw error;
  }

  console.log(
    "SEARCH RPC:",
    data
  );
  return data || [];
}

async function addMemberRPC(data) {

  const {
    data: result,
    error
  } = await supabaseClient.rpc(
    "add_member",
    {
      p_id_member:
        data.ID_Member,
      p_nama:
        data.Nama,
      p_tgl_lahir:
        data.Tgl_Lahir,
      p_wa:
        data.WA,
      p_email:
        data.Email,
      p_instagram:
        data.Instagram || "",
      p_facebook:
        data.Facebook || "",
      p_tiktok:
        data.TikTok || "",
      p_address:
        data.Address || "",
      p_join_date:
        data.Join_Date || "",
      p_photo:
        data.Photo || "",
      p_branch_id:
        data.branchId || ""
    }
  );

  if (error) {
    console.error(
      "add_member error:",
      error
    );
    throw error;
  }
  return result;
}

async function updateMemberRPC(data) {

  const {
    data: result,
    error
  } = await supabaseClient.rpc(
    "update_member",
    {
      p_id_member:
        data.ID_Member,
      p_nama:
        data.Nama,
      p_tgl_lahir:
        data.Tgl_Lahir,
      p_wa:
        data.WA,
      p_email:
        data.Email,
      p_total_spend:
        String(data.Total_Spend || "0"),
      p_level_current:
        data.Level_Current || "Kenal",
      p_point:
        String(data.Point || "0"),
      p_level_season:
        data.Level_Season_Terakhir || "",
      p_instagram:
        data.Instagram || "",
      p_facebook:
        data.Facebook || "",
      p_tiktok:
        data.TikTok || "",
      p_address:
        data.Address || "",
      p_join_date:
        data.Join_Date || "",
      p_photo:
        data.Photo || "",
      p_branch_id:
        data.branchId || ""
    }
  );

  if (error) {
    console.error(
      "update_member error:",
      error
    );
    throw error;
  }
  return result;
}


async function getMemberTierHistoryRPC(memberId) {

  const {
    data,
    error
  } = await supabaseClient.rpc(
    "get_member_tier_history",
    {
      p_member_id:
        memberId
    }
  );

  if (error) {
    console.error(
      "get_member_tier_history error:",
      error
    );
    throw error;
  }
  return data || [];
}

async function getRewardsRPC(memberId, branchId) {

  const {
    data,
    error
  } = await supabaseClient.rpc(
    "get_rewards",
    {
      p_member_id:
        memberId,

      p_branch_id:
        branchId
    }
  );

  if (error) {
    console.error(
      "get_rewards error:",
      error
    );
    throw error;
  }
  return data || [];
}


async function getMemberDashboardRPC(memberId) {

  const {
    data,
    error
  } = await supabaseClient.rpc(
    "get_member_dashboard",
    {
      p_member_id:
        memberId
    }
  );

  if (error) {
    console.error(
      "get_member_dashboard error:",
      error
    );
    throw error;
  }
  return data;
}

async function addMemberRPC(data) {

  const {
    data: result,
    error
  } = await supabaseClient.rpc(
    "add_member",
    {
      p_id_member:
        data.ID_Member,
      p_nama:
        data.Nama,
      p_tgl_lahir:
        data.Tgl_Lahir,
      p_wa:
        data.WA,
      p_email:
        data.Email,
      p_instagram:
        data.Instagram || "",
      p_facebook:
        data.Facebook || "",
      p_tiktok:
        data.TikTok || "",
      p_address:
        data.Address || "",
      p_join_date:
        data.Join_Date || "",
      p_photo:
        data.Photo || "",
      p_branch_id:
        data.branchId || ""
    }
  );

  if (error) {
    console.error(
      "add_member error:",
      error
    );
    throw error;
  }
  console.log(
    "ADD MEMBER RPC:",
    result
  );
  return result;
}

async function updateMemberRPC(data) {

  const {
    data: result,
    error
  } = await supabaseClient.rpc(
    "update_member",
    {
      p_id_member:
        data.ID_Member,
      p_nama:
        data.Nama,
      p_tgl_lahir:
        data.Tgl_Lahir,
      p_wa:
        data.WA,
      p_email:
        data.Email,
      p_total_spend:
        String(data.Total_Spend || "0"),
      p_level_current:
        data.Level_Current || "",
      p_point:
        String(data.Point || "0"),
      p_level_season:
        data.Level_Season_Terakhir || "",
      p_instagram:
        data.Instagram || "",
      p_facebook:
        data.Facebook || "",
      p_tiktok:
        data.TikTok || "",
      p_address:
        data.Address || "",
      p_join_date:
        data.Join_Date || "",
      p_photo:
        data.Photo ||
        data.PhotoBase64 ||
        "",
      p_branch_id:
        data.branchId || ""
    }
  );

  if (error) {
    console.error(
      "update_member error:",
      error
    );
    throw error;
  }
  console.log(
    "UPDATE MEMBER RPC:",
    result
  );
  return result;
}

    // ===============================
    // TABLE PAGE
    // ===============================

async function getTableDataRPC(branchId) {

  const {
    data,
    error
  } = await supabaseClient.rpc(
    "get_table_data",
    {
      p_branch_id: branchId
    }
  );

  if (error) {
    console.error(
      "get_table_data error:",
      error
    );
    throw error;
  }
  return data || [];
}

async function getLatestTransactionByTableRPC(mejaId) {

  const {
    data,
    error
  } = await supabaseClient.rpc(
    "get_latest_transaction_by_table",
    {
      p_meja: mejaId
    }
  );

  if (error) {
    console.error(
      "get_latest_transaction_by_table error:",
      error
    );
    throw error;
  }
  return data;
}

async function reserveTableRPC( mejaId, name, note ) {

  const {
    data,
    error
  } = await supabaseClient.rpc(
    "reserve_table",
    {
      p_meja_id: mejaId,
      p_name: name,
      p_note: note || ""
    }
  );

  if (error) {
    console.error(
      "reserve_table error:",
      error
    );
    throw error;
  }
  return data;
}

async function clearTableStatusRPC(mejaId) {

  const {
    data,
    error
  } = await supabaseClient.rpc(
    "clear_table_status",
    {
      p_meja_id: mejaId
    }
  );

  if (error) {
    console.error(
      "clear_table_status error:",
      error
    );
    throw error;
  }
  return data;
}

async function addNewTableRPC(tableName, branchId) {

  const {
    data,
    error
  } = await supabaseClient.rpc(
    "add_new_table",
    {
      p_branch_id: branchId,
      p_table_name: tableName
    }
  );

  if (error) {
    console.error(
      "add_new_table error:",
      error
    );
    throw error;
  }
  return data;
}

    // ===============================
    // INGREDIENT PAGE
    // ===============================

async function getRecipeMasterLedgerRPC(branchId) {
  const {
    data,
    error
  } = await supabaseClient.rpc(
    "get_recipe_master_ledger",
    {
      p_branch_id: branchId
    }
  );

  if (error) {
    console.error(
      "get_recipe_master_ledger error:",
      error
    );
    throw error;
  }
  return data;
}

async function getInventoryPageRPC(branchId) {

  const {
    data,
    error
  } = await supabaseClient.rpc(
    "get_inventory_page",
    {
      p_branch_id: branchId
    }
  );

  if (error) {
    console.error(
      "get_inventory_page error:",
      error
    );

    throw error;
  }

  return data || {
    summary: {},
    ingredients: [],
    suppliers: [],
    recipes: []
  };
}

async function getInventoryDashboardRPC(branchId) {

  const {
    data,
    error
  } = await supabaseClient.rpc(
    "get_inventory_dashboard",
    {
      p_branch_id: branchId
    }
  );

  if (error) {
    console.error(
      "get_inventory_dashboard error:",
      error
    );

    throw error;
  }

  return data || {};
}

async function getRecipesRPC() {

  const {
    data,
    error
  } = await supabaseClient.rpc(
    "get_recipes"
  );

  if (error) {
    console.error(
      "get_recipes error:",
      error
    );

    throw error;
  }

  return data || [];
}

async function getRecipeMasterLedgerRPC(branchId) {

  const {
    data,
    error
  } = await supabaseClient.rpc(
    "get_recipe_master_ledger",
    {
      p_branch_id: branchId
    }
  );

  if (error) {
    console.error(
      "get_recipe_master_ledger error:",
      error
    );

    throw error;
  }

  return data || [];
}

async function getIngredientPurchasesRPC(branchId, startDate, endDate) {

  const {
    data,
    error
  } = await supabaseClient.rpc(
    "get_ingredient_purchases",
    {
      p_branch_id: branchId,
      p_start: startDate || null,
      p_end: endDate || null
    }
  );

  if (error) {
    console.error(
      "get_ingredient_purchases error:",
      error
    );

    throw error;
  }

  return data || [];
}

async function getInventorySummaryRPC(branchId) {

  const {
    data,
    error
  } = await supabaseClient.rpc(
    "get_inventory_summary",
    {
      p_branch_id: branchId
    }
  );

  if (error) {
    console.error(
      "get_inventory_summary error:",
      error
    );

    throw error;
  }

  return data || {};
}

async function getDailyIngredientUsageRPC(branchId) {

  const {
    data,
    error
  } = await supabaseClient.rpc(
    "get_daily_ingredient_usage",
    {
      p_branch_id: branchId
    }
  );

  if (error) {
    console.error(
      "get_daily_ingredient_usage error:",
      error
    );

    throw error;
  }

  return data || [];
}

async function getLowIngredientStockRPC(branchId) {

  const {
    data,
    error
  } = await supabaseClient.rpc(
    "get_low_ingredient_stock",
    {
      p_branch_id: branchId
    }
  );

  if (error) {
    console.error(
      "get_low_ingredient_stock error:",
      error
    );

    throw error;
  }

  return data || [];
}

async function getCriticalIngredientsRPC(branchId) {

  const {
    data,
    error
  } = await supabaseClient.rpc(
    "get_critical_ingredients",
    {
      p_branch_id: branchId
    }
  );

  if (error) {
    console.error(
      "get_critical_ingredients error:",
      error
    );

    throw error;
  }

  return data || [];
}

async function getStockHistoryRPC(limit = 50, branchId) {

  const {
    data,
    error
  } = await supabaseClient.rpc(
    "get_stock_history",
    {
      p_limit: limit,
      p_branch_id: branchId
    }
  );

  if (error) {
    console.error(
      "get_stock_history error:",
      error
    );

    throw error;
  }

  return data || [];
}

async function getLiveDeductionFeed(limit = 20, branchId) {

  const {
    data,
    error
  } = await supabaseClient.rpc(
    "get_live_deduction_feed",
    {
      p_limit: limit,
      p_branch_id: branchId
    }
  );

  if (error) {
    console.error(
      "get_live_deduction_feed error:",
      error
    );

    throw error;
  }

  return data || [];
}

async function getIngredientSummaryRPC(ingredientName, branchId) {

  const {
    data,
    error
  } = await supabaseClient.rpc(
    "get_ingredient_summary",
    {
      p_ingredient_name: ingredientName,
      p_branch_id: branchId
    }
  );

  if (error) {
    console.error(
      "get_ingredient_summary error:",
      error
    );

    throw error;
  }

  return data || {};
}

async function getIngredientUsageLogRPC( ingredientId, branchId) {

  const {
    data,
    error
  } = await supabaseClient.rpc(
    "get_ingredient_usage_log",
    {
      p_ingredient_id: ingredientId,
      p_branch_id: branchId
    }
  );

  if (error) {
    console.error(
      "get_ingredient_usage_log error:",
      error
    );

    throw error;
  }

  return data || [];
}

async function saveRecipeRPC(payload) {

  const {
    data,
    error
  } = await supabaseClient.rpc(
    "save_recipe",
    {
      p_payload: payload
    }
  );

  if (error) {
    console.error(
      "save_recipe error:",
      error
    );

    throw error;
  }

  return data;
}

async function saveMaterialRPC(data = {}) {

  const {
    data: result,
    error
  } = await supabaseClient.rpc(
    "save_material",
    {
      p_id:
        generateIngredientId(),

      p_name:
        data.name || "",

      p_value:
        Number(data.value) || 0,

      p_qty:
        Number(data.qty) || 0,

      p_unit:
        data.unit || "",

      p_min:
        Number(data.min) || 0,

      p_cost:
        Number(data.cost) || 0,

      p_branch_id:
        data.branchId || "",

      p_outlet:
        data.outlet || ""
    }
  );

  if (error) {
    console.error(
      "save_material error:",
      error
    );

    throw error;
  }

  return result;
}

async function adjustIngredientStockRPC(data = {}) {

  const {
    data: result,
    error
  } = await supabaseClient.rpc(
    "adjust_ingredient_stock",
    {
      p_ingredient_id:
        String(
          data.ingredientId || ""
        ).trim(),

      p_branch_id:
        String(
          data.branchId || ""
        ).trim(),

      p_type:
        data.type || "",

      p_qty:
        Number(data.qty) || 0,

      p_reason:
        data.reason || ""
    }
  );

  if (error) {
    console.error(
      "adjust_ingredient_stock error:",
      error
    );

    throw error;
  }

  return result;
}

async function updateIngredientThresholdRPC(data = {}) {

  const {
    data: result,
    error
  } = await supabaseClient.rpc(
    "update_ingredient_threshold",
    {
      p_ingredient_id:
        String(
          data.ingredientId || ""
        ).trim(),

      p_branch_id:
        String(
          data.branchId || ""
        ).trim(),

      p_min:
        Number(data.min) || 0
    }
  );

  if (error) {
    console.error(
      "update_ingredient_threshold error:",
      error
    );

    throw error;
  }

  return result;
}

async function addPurchaseRPC(date, ingredientName, qty, totalPrice, supplier, note, branchId, outlet, paymentMethod = "CASH") {
console.log("ADD PURCHASE PARAMS:", {
  branchId,
  ingredientName,
  qty,
  totalPrice,
  supplier,
  note,
  outlet,
  paymentMethod
});
  const {
    data,
    error
  } = await supabaseClient.rpc(
    "add_ingredient_purchase",
    {
      p_date:
        date,

      p_ingredient_name:
        ingredientName,

      p_qty:
        Number(qty) || 0,

      p_total_price:
        Number(totalPrice) || 0,

      p_supplier:
        supplier || "",

      p_note:
        note || "",

      p_branch_id:
        branchId,

      p_outlet:
        outlet || "",

      p_payment_method:
        paymentMethod || "CASH"
    }
  );

  if (error) {
    console.error(
      "add_ingredient_purchase error:",
      error
    );

    throw error;
  }

  return data;
}

async function saveIngredientPurchaseRPC(data = {}) {

  const {
    data: result,
    error
  } = await supabaseClient.rpc(
    "save_ingredient_purchase",
    {
      p_date:
        getWIBDateTime(),

      p_ingredient:
        data.ingredient,

      p_qty:
        Number(data.qty) || 0,

      p_total_price:
        Number(data.totalPrice) || 0,

      p_supplier:
        data.supplier || "",

      p_note:
        data.note || "",

      p_branch_id:
        data.branchId,

      p_payment_method:
        data.paymentMethod || "CASH"
    }
  );

  if (error) {
    console.error(
      "save_ingredient_purchase error:",
      error
    );

    throw error;
  }

  return result;
}

async function updateRecipeMasterRPC(data = {}) {

  let imageUrl = "";

  // ==========================
  // Upload image jika ada
  // ==========================

  if (data.imageBase64) {

    imageUrl =
      await uploadProductImage(
        data.imageBase64,
        data.productId
      );
  }

  // SUPABASE RPC
  const {
    data: result,
    error
  } =
    await supabaseClient.rpc(
      "update_recipe_master",
      {
        p_recipe_id:
          data.recipeId,

        p_product_id:
          data.productId,

        p_branch_id:
          data.branchId,

        p_selling_price:
          Number(
            data.sellingPrice
          ) || 0,

        p_net_price:
          Number(
            data.netPrice
          ) || 0,

        p_product_name:
          data.productName || "",

        p_updated_by:
          data.updatedBy || "",

        p_image_url:
          imageUrl || ""
      }
    );

  if (error) {
    console.error(
      "update_recipe_master error:",
      error
    );
    throw error;
  }
  return result;
}

async function addNewProductRPC(data = {}) {

  const {
    data: result,
    error
  } =
    await supabaseClient.rpc(
      "add_new_product",
      {
        p_product_id:
          generateProductId(),

        p_name:
          data.name || "",

        p_category:
          data.category || "",

        p_price:
          Number(data.price) || 0,

        p_branch_id:
          data.branchId || "",

        p_outlet:
          data.outlet || ""
      }
    );

  if (error) {
    console.error(
      "add_new_product error:",
      error
    );
    throw error;
  }
  return result;
}

async function recalcAllProductStockRPC(branchId) {

  const {
    data,
    error
  } = await supabaseClient.rpc(
    "recalc_all_product_stock",
    {
      p_branch_id: branchId
    }
  );

  if (error) {
    console.error(
      "recalc_all_product_stock error:",
      error
    );

    throw error;
  }

  return data || {
    success: false
  };
}

async function logStockMovementRPC(data = {}) {

  const totalCost =
    (Number(data.qty) || 0) *
    (Number(data.unitPrice) || 0);

  const {
    data: result,
    error
  } = await supabaseClient.rpc(
    "log_stock_movement",
    {
      p_id:
        crypto.randomUUID(),

      p_timestamp:
        getWIBDateTime(),

      p_ingredient_id:
        data.ingredientId,

      p_action:
        data.action,

      p_qty_change:
        Number(data.qty) || 0,

      p_unit_price:
        Number(data.unitPrice) || 0,

      p_total_cost:
        totalCost,

      p_before:
        Number(data.before) || 0,

      p_after:
        Number(data.after) || 0,

      p_source:
        data.source || "",

      p_notes:
        data.note || "",

      p_branch_id:
        data.branchId || ""
    }
  );

  if (error) {
    console.error(
      "log_stock_movement error:",
      error
    );

    throw error;
  }

  return result;
}

async function deductIngredientStockRPC(
  productId,
  qtySold,
  branchId
) {

  const {
    data,
    error
  } = await supabaseClient.rpc(
    "deduct_ingredient_stock",
    {
      p_product_id:
        productId,

      p_qty_sold:
        Number(qtySold) || 0,

      p_branch_id:
        branchId
    }
  );

  if (error) {
    console.error(
      "deduct_ingredient_stock error:",
      error
    );

    throw error;
  }

  return data || {
    success: false
  };
}

async function getRecipeByProductRPC(productId) {

  const {
    data,
    error
  } = await supabaseClient.rpc(
    "get_recipe_by_product",
    {
      p_product_id:
        productId
    }
  );

  if (error) {
    console.error(
      "get_recipe_by_product error:",
      error
    );

    throw error;
  }

  return data || null;
}

async function getRecipeItemsRPC(recipeId) {

  const {
    data,
    error
  } = await supabaseClient.rpc(
    "get_recipe_items",
    {
      p_recipe_id: recipeId
    }
  );

  if (error) {
    console.error(
      "get_recipe_items error:",
      error
    );

    throw error;
  }

  return data || [];
}

async function validateIngredientStockRPC(cartItems, branchId) {

  const {
    data,
    error
  } = await supabaseClient.rpc(
    "validate_ingredient_stock",
    {
      p_cart_items: cartItems,
      p_branch_id: branchId
    }
  );

  if (error) {
    console.error(
      "validate_ingredient_stock error:",
      error
    );

    throw error;
  }

  return data || {
    valid: true,
    missing: []
  };
}

async function validateStockRPC(items) {

  const {
    data,
    error
  } = await supabaseClient.rpc(
    "validate_stock",
    {
      p_items: items
    }
  );

  if (error) {
    console.error(
      "validate_stock error:",
      error
    );

    throw error;
  }

  return data || {
    valid: true
  };
}

async function getRecipeListRPC(branchId) {

  const {
    data,
    error
  } = await supabaseClient.rpc(
    "get_recipe_list",
    {
      p_branch_id: branchId
    }
  );

  if (error) {
    console.error(
      "get_recipe_list error:",
      error
    );

    throw error;
  }

  return data || [];
}

async function getProductsRPC(branchId, role) {

  const {
    data,
    error
  } = await supabaseClient.rpc(
    "get_products",
    {
      p_branch_id: branchId,
      p_role: role
    }
  );

  if (error) {
    console.error(
      "get_products error:",
      error
    );

    throw error;
  }

  return data || [];
}

async function getIngredientsRPC(branchId) {

  const {
    data,
    error
  } = await supabaseClient.rpc(
    "get_ingredients",
    {
      p_branch_id: branchId
    }
  );

  if (error) {
    console.error(
      "get_ingredients error:",
      error
    );

    throw error;
  }

  return data || [];
}

async function getSuppliersRPC(branchId) {

  const {
    data,
    error
  } = await supabaseClient.rpc(
    "get_suppliers",
    {
      p_branch_id: branchId
    }
  );

  if (error) {
    console.error(
      "get_suppliers error:",
      error
    );

    throw error;
  }

  return data || [];
}

async function updateSupplierRPC(data) {

  const {
    data: result,
    error
  } = await supabaseClient.rpc(
    "update_supplier",
    {
      p_supplier_id: data.supplierId,
      p_branch_id: data.branchId,
      p_name: data.supplierName,
      p_category: data.category,
      p_contact: data.contactPerson,
      p_phone: data.phone,
      p_status: data.status
        ? "Active"
        : "INACTIVE",
      p_notes: data.notes
    }
  );

  if (error) {
    console.error(
      "update_supplier error:",
      error
    );

    throw error;
  }

  return result || {
    success: false
  };
}

async function saveSupplierRPC(data) {

  const {
    data: result,
    error
  } = await supabaseClient.rpc(
    "save_supplier",
    {
      p_id: generateSupplierId(),

      p_name:
        data.name || "",

      p_category:
        data.category || "",

      p_contact:
        data.contact || "",

      p_phone:
        Number(data.phone) || 0,

      p_status:
        data.status || "",

      p_notes:
        data.address || "",

      p_branch_id:
        data.branchId || "",

      p_outlet:
        data.outlet || ""
    }
  );

  if (error) {
    console.error(
      "save_supplier error:",
      error
    );

    throw error;
  }

  return result || {
    success: false
  };
}

async function getRecipePriceHistoryRPC(recipeId) {

  const {
    data,
    error
  } = await supabaseClient.rpc(
    "get_recipe_price_history",
    {
      p_recipe_id: recipeId
    }
  );

  if (error) {
    console.error(
      "get_recipe_price_history error:",
      error
    );

    throw error;
  }

  return data || [];
}

async function getInventoryRPC() {

  const {
    data,
    error
  } = await supabaseClient.rpc(
    "get_inventory",
    {}
  );

  if (error) {
    console.error(
      "get_inventory error:",
      error
    );

    throw error;
  }

  return data || [];
}

async function generateIngredientIdRPC() {

  const {
    data,
    error
  } = await supabaseClient.rpc(
    "generate_ingredient_id",
    {}
  );

  if (error) {
    console.error(
      "generate_ingredient_id error:",
      error
    );

    throw error;
  }

  return data || "ING001";
}









    // ===============================
    // SETTINGS PAGE
    // ===============================

async function getAnalyticsDashboardRPC(branchId, startDate, endDate) {

  const {
    data,
    error
  } = await supabaseClient.rpc(
    "get_analytics_dashboard",
    {
      p_branch_id: branchId,
      p_start: startDate,
      p_end: endDate
    }
  );

  if (error) {

    console.error(
      "get_analytics_dashboard error:",
      error
    );

    throw error;
  }

  return data;
}

async function getAnalyticsRPC(branchId, startDate, endDate) {

  const {
    data,
    error
  } = await supabaseClient.rpc(
    "get_analytics",
    {
      p_branch_id: branchId,
      p_start: startDate,
      p_end: endDate
    }
  );

  if (error) {

    console.error(
      "get_analytics error:",
      error
    );

    throw error;
  }

  return data;
}


async function getPaymentDistributionRPC(branchId, startDate, endDate) {

  const {
    data,
    error
  } = await supabaseClient.rpc(
    "get_payment_distribution",
    {
      p_branch_id: branchId,
      p_start: startDate,
      p_end: endDate
    }
  );

  if (error) {

    console.error(
      "get_payment_distribution error:",
      error
    );

    throw error;
  }

  return data;
}


async function getPeakHoursRPC(branchId, startDate, endDate ) {

  const {
    data,
    error
  } = await supabaseClient.rpc(
    "get_peak_hours",
    {
      p_branch_id: branchId,
      p_start: startDate,
      p_end: endDate
    }
  );

  if (error) {

    console.error(
      "get_peak_hours error:",
      error
    );

    throw error;
  }

  return data;
}

async function getTopSellingItemsRPC(branchId, startDate, endDate) {

  const {
    data,
    error
  } = await supabaseClient.rpc(
    "get_top_selling_items",
    {
      p_branch_id: branchId,
      p_start: startDate,
      p_end: endDate
    }
  );

  if (error) {

    console.error(
      "get_top_selling_items error:",
      error
    );

    throw error;
  }

  return data;
}


async function getRawMaterialAnalysisRPC(branchId, startDate, endDate) {

  const {
    data,
    error
  } = await supabaseClient.rpc(
    "get_raw_material_analysis",
    {
      p_branch_id: branchId,
      p_start: startDate,
      p_end: endDate
    }
  );

  if (error) {

    console.error(
      "get_raw_material_analysis error:",
      error
    );

    throw error;
  }

  return data;
}

    // ===============================
    // SETTINGS PAGE
    // ===============================

async function getSettingsPageDataRPC() {
  const {
    data,
    error
  } = await supabaseClient.rpc(
    "get_settings_page_data"
  );

  if (error) {
    console.error(
      "get_settings_page_data error:",
      error
    );
    throw error;
  }
  console.log(
    "RAW SETTINGS RPC:",
    data
  );
  return data;
}

async function getBranchOptionsRPC(data) {
 const client =
    getActiveSupabase();

  if (!client) {
    throw new Error(
      "Supabase client belum siap"
    );
  }
  const {
    data: result,
    error
  } = await client.rpc(
    "get_branch_options",
    {
      p_login_user_id:
        String(data.loginUserId)
    }
  );

  if (error) {
    console.error(
      "get_branch_options error:",
      error
    );
    throw error;
  }
  return result;
}

async function addNewBranchRPC(data) {
  const {
    data: result,
    error
  } = await supabaseClient.rpc(
    "add_new_branch",
    {
      p_branch_name: data.branchName,
      p_alamat: data.alamat,
      p_manager: data.manager,
      p_phone: data.phone
    }
  );

  if (error) {
    console.error(
      "add_new_branch error:",
      error
    );
    throw error;
  }
  return result;
}

async function updateBranchStatusRPC(branchId, active) {

  const {
    data,
    error
  } = await supabaseClient.rpc(
    "update_branch_status",
    {
      p_branch_id: branchId,
      p_active: active
    }
  );

  if (error) {
    console.error(
      "update_branch_status error:",
      error
    );
    throw error;
  }
  return data;
}

async function updateBranchRPC(data) {

  const {
    data: result,
    error
  } = await supabaseClient.rpc(
    "update_branch",
    {
      p_branch_id:
        data.branchId,
      p_branch_name:
        data.branchName,
      p_alamat:
        data.alamat,
      p_manager:
        data.manager
    }
  );

  if (error) {
    console.error(
      "update_branch error:",
      error
    );
    throw error;
  }
  return result;
}

async function getUsersRPC() {

  const {
    data,
    error
  } = await supabaseClient.rpc(
    "get_users"
  );

  if (error) {
    console.error(
      "get_users error:",
      error
    );
    throw error;
  }
  return data;
}

async function addNewUserRPC(data) {

  const {
    data: result,
    error
  } = await supabaseClient.rpc(
    "add_new_user",
    {
      p_username:
        data.username,
      p_password:
        data.password,
      p_role:
        data.role,
      p_branch_id:
        data.branchId,
      p_created_by:
        data.createdBy
    }
  );

  if (error) {
    console.error(
      "add_new_user error:",
      error
    );
    throw error;
  }
  // CLEAR SETTINGS STATE
  state.settingsPageData = null;
  return result;
}

async function updateUserRPC(data) {

  const {
    data: result,
    error
  } = await supabaseClient.rpc(
    "update_user",
    {
      p_id:
        String(data.id),
      p_username:
        data.username,
      p_password:
        data.password || null,
      p_login_user_id:
        String(data.login_user_id)
    }
  );

  if (error) {
    console.error(
      "update_user error:",
      error
    );
    throw error;
  }

  // CLEAR STATE
  state.settingsPageData = null;
  return result;
}

async function deleteUserRPC(data) {

  const {
    data: result,
    error
  } = await supabaseClient.rpc(
    "delete_user",
    {
      p_id:
        String(data.id),
      p_login_user_id:
        String(data.login_user_id)
    }
  );

  if (error) {
    console.error(
      "delete_user error:",
      error
    );
    throw error;
  }

  // CLEAR STATE
  state.settingsPageData = null;
  return result;
}

async function getSettingsRPC() {

  const {
    data,
    error
  } = await supabaseClient.rpc(
    "get_settings"
  );
  if (error) {
    throw error;
  }
  return data;
}

async function saveSettingsRPC(payload) {

  // VALIDASI
  validateSettings(payload);

  const {
    data,
    error
  } = await supabaseClient.rpc(
    "save_settings",
    {
      p_settings: payload
    }
  );

  if (error) {

    console.error(
      "save_settings error:",
      error
    );

    throw error;
  }

  return data;
}

async function getBusinessProfileRPC() {

  const {
    data,
    error
  } = await supabaseClient.rpc(
    "get_business_profile"
  );

  if (error) {
    console.error(
      "get_business_profile error:",
      error
    );
    throw error;
  }
  return data;
}

async function saveBusinessProfileRPC(data) {

  const {
    data: result,
    error
  } = await supabaseClient.rpc(
    "save_business_profile",
    {
      p_company_name:
        data.company_name,
      p_logo_url:
        data.logo_url,
      p_instagram:
        data.instagram,
      p_receipt_footer:
        data.receipt_footer
    }
  );

  if (error) {
    console.error(
      "save_business_profile error:",
      error
    );
    throw error;
  }
  return result;
}

async function getBranchInfoRPC(branchId) {
  const client =
    getActiveSupabase();
  const {
    data,
    error
  } = await client.rpc(
    "get_branch_info",
    {
      p_branch_id:
        branchId
    }
  );

  if (error) {
    console.error(
      "get_branch_info error:",
      error
    );
    throw error;
  }
  return data;
}


    // ===============================
    // LOYALTY PAGE
    // ===============================

async function getRewardProductsRPC(branchId) {

  const {
    data,
    error
  } = await supabaseClient.rpc(
    "get_reward_products",
    {
      p_branch_id: branchId || null
    }
  );

  if (error) {

    console.error(
      "get_reward_products error:",
      error
    );

    throw error;
  }

  return data || [];
}

async function deleteRewardRPC(id) {

  const {
    data,
    error
  } = await supabaseClient.rpc(
    "delete_reward",
    {
      p_id_reward: id
    }
  );

  if (error) {

    console.error(
      "delete_reward error:",
      error
    );

    throw error;
  }

  return data;
}

async function saveRewardProductRPC(data) {

  const {
    data: result,
    error
  } = await supabaseClient.rpc(
    "save_reward_product",
    {
      p_id_reward:
        data.ID_Reward,

      p_nama_reward:
        data.Nama_Reward,

      p_point_dibutuhkan:
        Number(
          data.Point_Dibutuhkan || 0
        ),

      p_produk_id:
        data.Produk_ID || null,

      p_status:
        data.Status || "active",

      p_branch_id:
        data.Branch_ID || null,

      p_max_redeem:
        Number(
          data.Max_Redeem || 0
        ),

      p_category:
        data.Category || null
    }
  );

  if (error) {

    console.error(
      "save_reward_product error:",
      error
    );

    throw error;
  }

  return result;
}

async function getSeasonConfigRPC() {

  const {
    data,
    error
  } = await supabaseClient.rpc(
    "get_season_config"
  );

  if (error) {

    console.error(
      "get_season_config error:",
      error
    );

    throw error;
  }

  return data;
}


async function setSeasonConfigRPC(
  key,
  value
) {

  const {
    data,
    error
  } = await supabaseClient.rpc(
    "set_season_config",
    {
      p_key: key,
      p_value: String(value)
    }
  );

  if (error) {

    console.error(
      "set_season_config error:",
      error
    );

    throw error;
  }

  return data;
}


async function openSeasonRPC(
  startDate,
  endDate
) {

  const {
    data,
    error
  } = await supabaseClient.rpc(
    "open_season",
    {
      p_start_date: startDate,
      p_end_date: endDate
    }
  );

  if (error) {

    console.error(
      "open_season error:",
      error
    );

    throw error;
  }

  return data;
}


async function closeSeasonRPC() {

  const {
    data,
    error
  } = await supabaseClient.rpc(
    "close_season"
  );

  if (error) {

    console.error(
      "close_season error:",
      error
    );

    throw error;
  }

  return data;
}


async function toggleAutoSeasonRPC() {

  const {
    data,
    error
  } = await supabaseClient.rpc(
    "toggle_auto_season"
  );

  if (error) {

    console.error(
      "toggle_auto_season error:",
      error
    );

    throw error;
  }
  return data;
}

async function saveCategoryRPC( branchId, categoryKey, categoryName, discount, reward ) {
  const {
    data,
    error
  } = await supabaseClient.rpc(
    "save_category",
    {
      p_branch_id: branchId,
      p_category_key: categoryKey,
      p_category_name: categoryName,
      p_discount: discount || 0,
      p_reward: reward || 0
    }
  );

  if (error) {
    console.error(
      "save_category error:",
      error
    );
    throw error;
  }
  return data;
}

async function getCategoriesRPC(branchId) {
  const {
    data,
    error
  } = await supabaseClient.rpc(
    "get_categories",
    {
      p_branch_id: branchId
    }
  );
  if (error) {
    console.error(
      "get_categories error:",
      error
    );
    throw error;
  }
  return data?.data || [];
}

    // ===============================
    // EXPENSES & OTHER INCOME PAGE
    // ===============================

async function getExpenseDashboardRPC(filter = {}) {

  let branchId =
    filter.branch;

  if (
    !branchId ||
    branchId === "ALL"
  ) {
    branchId =
      filter.loginBranchId || "ALL";
  }

  console.log(
    "RPC EXPENSE BRANCH:",
    branchId
  );

  const {
    data,
    error
  } = await supabaseClient.rpc(
    "get_expense_dashboard",
    {
      p_branch_id: branchId,

      p_status:
        filter.status === "All Status"
          ? "ALL"
          : filter.status || "ALL",

      p_category:
        filter.category === "All Categories"
          ? "ALL"
          : filter.category || "ALL",

      p_keyword:
        filter.keyword || "",

      p_start:
        filter.startDate || null,

      p_end:
        filter.endDate || null
    }
  );

  if (error) {

    console.error(
      "get_expense_dashboard error:",
      error
    );

    throw error;
  }
    console.log(
    "RPC EXPENSE RESULT:",
    data
  );

  return data || {
    summary: {},
    expenses: [],
    budget: {}
  };
}

async function getExpenseBranchesRPC() {

  const {
    data,
    error
  } = await supabaseClient.rpc(
    "get_expense_branches"
  );

  if (error) {

    console.error(
      "get_expense_branches error:",
      error
    );

    throw error;
  }

  return data || [];
}

async function saveExpenseBudgetRPC(data) {

  const {
    data: result,
    error
  } = await supabaseClient.rpc(
    "save_expense_budget",
    {
      p_branch_id:
        String(data.branchId),

      p_month:
        String(data.Month),

      p_budget:
        Number(data.Budget)
    }
  );

  if (error) {

    console.error(
      "save_expense_budget error:",
      error
    );

    throw error;
  }

  return result;
}

async function updateExpenseStatusRPC(refId, status) {

  const {
    data,
    error
  } = await supabaseClient.rpc(
    "update_expense_status",
    {
      p_ref_id: refId,
      p_status: status
    }
  );

  if (error) {

    console.error(
      "update_expense_status error:",
      error
    );

    throw error;
  }

  return data || {
    success: false
  };
}

async function updateExpenseAttachmentRPC(data = {}) {

  const {
    data: result,
    error
  } = await supabaseClient.rpc(
    "update_expense_attachment",
    {
      p_ref_id:
        data.Ref_ID,

      p_url:
        data.Attachment_URL
    }
  );

  if (error) {

    console.error(
      "update_expense_attachment error:",
      error
    );

    throw error;
  }

  return result;
}

async function updateOtherIncomeStatusRPC(
  refId,
  status
) {

  const {
    data,
    error
  } = await supabaseClient.rpc(
    "update_other_income_status",
    {
      p_refid: refId,

      p_status: status
    }
  );

  if (error) {

    console.error(
      "update_other_income_status error:",
      error
    );

    throw error;
  }

  return data;
}

async function deleteOtherIncomeRPC(id) {

  const {
    data,
    error
  } = await supabaseClient.rpc(
    "delete_other_income",
    {
      p_id: String(id)
    }
  );

  if (error) {

    console.error(
      "delete_other_income error:",
      error
    );

    throw error;
  }

  return data;
}

async function saveOtherIncomeRPC(data = {}) {
console.log(
    "SAVE OTHER INCOME DATA:",
    data
  );

  console.log(
    "SAVE OTHER INCOME RPC PARAMS:",
    {
      p_id: data.id,
      p_date: data.date,
      p_ref_id: data.refId,
      p_description: data.description,
      p_category: data.category,
      p_method: data.method,
      p_amount: data.amount,
      p_status: data.status,
      p_branch_id: data.branchId,
      p_notes: data.notes
    }
  );

  const {
    data: result,
    error
  } = await supabaseClient.rpc(
    "save_other_income",
    {
      p_id: data.id,
      p_date: data.date,
      p_ref_id: data.refId,
      p_description: data.description,
      p_category: data.category,
      p_method: data.method,
      p_amount: data.amount,
      p_status: data.status,
      p_branch_id: data.branchId,
      p_notes: data.notes
    }
  );

  if (error) {

    console.error(
      "save_other_income error:",
      error
    );

    throw error;
  }

  return result;
}

async function addExpenseRPC(data = {}) {

  const {
    data: result,
    error
  } = await supabaseClient.rpc(
    "add_expense",
    {
      p_branch_id:
        data.branchId,

      p_tanggal:
        data.tanggal,

      p_category:
        data.category,

      p_description:
        data.description,

      p_amount:
        data.amount,

      p_method:
        data.method,

      p_created_by:
        data.createdBy,

      p_type:
        data.type,

      p_status:
        data.status,
    }
  );

  if (error) {

    console.error(
      "add_expense error:",
      error
    );

    throw error;
  }

  return result;
}

async function getExpenseBudgetRPC(branchId) {

  console.log(
    "GET EXPENSE BUDGET BRANCH:",
    branchId
  );

  const {
    data,
    error
  } = await supabaseClient.rpc(
    "get_expense_budget",
    {
      p_branch_id:
        branchId
    }
  );

  if (error) {

    console.error(
      "get_expense_budget error:",
      error
    );

    throw error;
  }

  return data || {};
}

async function getCategoryBreakdownRPC(f = {}) {

  const status =
    f.status === "All Status"
      ? "ALL"
      : f.status;


  const category =
    f.category === "All Categories"
      ? "ALL"
      : f.category;


  const {
    data,
    error
  } = await supabaseClient.rpc(
    "get_category_breakdown",
    {
      p_branch_id:
        f.branch || "ALL",

      p_status:
        status,

      p_category:
        category,

      p_keyword:
        f.keyword || ""
    }
  );


  if (error) {

    console.error(
      "get_category_breakdown error:",
      error
    );

    throw error;
  }


  return data || [];
}

async function getOtherIncomeRPC(branchId) {

  const {
    data,
    error
  } = await supabaseClient.rpc(
    "get_other_income",
    {
      p_branch_id:
        branchId || null
    }
  );

  if (error) {

    console.error(
      "get_other_income error:",
      error
    );

    throw error;
  }

  return data || [];
}



    // ===============================
    // CASH FLOW PAGE
    // ===============================

async function getCashFlowPageDataRPC(filter = {}) {

  const {
    data,
    error
  } = await supabaseClient.rpc(
    "get_cash_flow_page_data",
    {
      p_login_user_id:
        Number(filter.loginUserId),

      p_branch_id:
        filter.branchId || "ALL",

      p_start:
        filter.startDate || null,

      p_end:
        filter.endDate || null
    }
  );

  if (error) {
    console.error(
      "get_cash_flow_page_data error:",
      error
    );
    throw error;
  }

  return data || {};
}


async function getAccountBalanceRPC(branchId) {
  const client =
    getActiveSupabase();

  if (!client) {
    throw new Error(
      "Supabase client belum siap"
    );
  }

  const {
    data,
    error
  } = await client.rpc(
    "get_account_balance",
    {
      p_branch_id:
        branchId
    }
  );

  if (error) {
    console.error(
      "get_account_balance error:",
      error
    );
    throw error;
  }

  return data || {};
}


async function getCashFlowSummaryRPC(filter = {}) {

  const {
    data,
    error
  } = await supabaseClient.rpc(
    "get_cash_flow_summary",
    {
      p_branch_id:
        filter.branchId || "ALL",

      p_start:
        filter.startDate || null,

      p_end:
        filter.endDate || null
    }
  );

  if (error) {
    console.error(
      "get_cash_flow_summary error:",
      error
    );
    throw error;
  }

  return data || {};
}


async function getCashFlowChartRPC(filter = {}) {

  const {
    data,
    error
  } = await supabaseClient.rpc(
    "get_cash_flow_chart",
    {
      p_branch_id:
        filter.branchId || "ALL",

      p_start:
        filter.startDate || null,

      p_end:
        filter.endDate || null
    }
  );

  if (error) {
    console.error(
      "get_cash_flow_chart error:",
      error
    );
    throw error;
  }

  return data || [];
}

async function getFundTransfersRPC(filter = {}) {

  const {
    data,
    error
  } = await supabaseClient.rpc(
    "get_fund_transfers",
    {
      p_branch_id:
        filter.branchId || "ALL",

      p_start:
        filter.startDate || null,

      p_end:
        filter.endDate || null
    }
  );

  if (error) {
    console.error(
      "get_fund_transfers error:",
      error
    );
    throw error;
  }

  return data || [];
}

async function transferFundsRPC(data = {}) {

  const {
    data: result,
    error
  } = await supabaseClient.rpc(
    "transfer_funds",
    {
      p_branch_id:
        data.branchId,

      p_from_account:
        data.fromAccount,

      p_to_account:
        data.toAccount,

      p_amount:
        Number(data.amount),

      p_note:
        data.note || "",

      p_created_by:
        data.createdBy || "Admin"
    }
  );

  if (error) {
    console.error(
      "transfer_funds error:",
      error
    );
    throw error;
  }

  return result;
}

async function getCashFlowReportDataRPC(filter = {}) {

  const {
    data,
    error
  } = await supabaseClient.rpc(
    "get_cash_flow_report_data",
    {
      p_branch_id:
        filter.branchId || "ALL",

      p_start:
        filter.startDate || null,

      p_end:
        filter.endDate || null
    }
  );

  if (error) {
    console.error(
      "get_cash_flow_report_data error:",
      error
    );
    throw error;
  }

  return data || {};
}

async function addOwnerTransactionRPC(data = {}) {

  const {
    data: result,
    error
  } = await supabaseClient.rpc(
    "add_owner_transaction",
    {
      p_branch_id:
        data.branchId,

      p_type:
        data.type,

      p_account:
        data.account,

      p_amount:
        Number(data.amount),

      p_note:
        data.note || "",

      p_created_by:
        data.createdBy || ""
    }
  );

  if (error) {
    console.error(
      "add_owner_transaction error:",
      error
    );
    throw error;
  }

  return result;
}

async function getOwnerTransactionsRPC(filter = {}) {

  const {
    data,
    error
  } = await supabaseClient.rpc(
    "get_owner_transactions",
    {
      p_branch_id:
        filter.branchId || "ALL",

      p_start:
        filter.startDate || null,

      p_end:
        filter.endDate || null
    }
  );

  if (error) {

    console.error(
      "get_owner_transactions error:",
      error
    );

    throw error;
  }

  return data || [];
}

async function getOwnerSummaryRPC(filter = {}) {

  const {
    data,
    error
  } = await supabaseClient.rpc(
    "get_owner_summary",
    {
      p_branch_id:
        filter.branchId || "ALL",

      p_start:
        filter.startDate || null,

      p_end:
        filter.endDate || null
    }
  );

  if (error) {

    console.error(
      "get_owner_summary error:",
      error
    );

    throw error;
  }

  return data || {};
}

async function getYesterdayDashboardSummaryRPC(
  branchId
) {

  const {
    data,
    error
  } = await supabaseClient.rpc(
    "get_yesterday_dashboard_summary",
    {
      p_branch_id:
        branchId || "ALL"
    }
  );

  if (error) {

    console.error(
      "get_yesterday_dashboard_summary error:",
      error
    );

    throw error;
  }

  return data || {};
}

async function createDatabaseBackupRPC() {

  const {
    data,
    error
  } = await supabaseClient.rpc(
    "create_database_backup",
    {}
  );

  if (error) {

    console.error(
      "create_database_backup error:",
      error
    );

    throw error;
  }

  return data;
}

async function deleteBackupHistoryRPC(data = {}) {

  const {
    data: result,
    error
  } = await supabaseClient.rpc(
    "delete_backup_history",
    data
  );

  if (error) {

    console.error(
      "delete_backup_history error:",
      error
    );

    throw error;
  }

  return result;
}

async function clearDatabaseRPC() {

  const {
    data,
    error
  } = await supabaseClient.rpc(
    "clear_database",
    {}
  );

  if (error) {

    console.error(
      "clear_database error:",
      error
    );

    throw error;
  }

  return data;
}

async function getBackupHistoryRPC() {

  const {
    data,
    error
  } = await supabaseClient.rpc(
    "get_backup_history",
    {}
  );

  if (error) {

    console.error(
      "get_backup_history error:",
      error
    );

    throw error;
  }

  return data || [];
}

async function updateBackupFileInfoRPC(data = {}) {

  const {
    data: result,
    error
  } = await supabaseClient.rpc(
    "update_backup_file_info",
    data
  );

  if (error) {

    console.error(
      "update_backup_file_info error:",
      error
    );

    throw error;
  }

  return result;
}

async function restoreDatabaseBackupRPC(data = {}) {

  const {
    data: result,
    error
  } = await supabaseClient.rpc(
    "restore_database_backup",
    data
  );

  if (error) {

    console.error(
      "restore_database_backup error:",
      error
    );

    throw error;
  }

  return result;
}

async function uploadDatabaseBackup(
  fileName,
  jsonData
) {
  const sessionId =
    localStorage.getItem(
      "pos_session_id"
    );
  if (!sessionId) {
    throw new Error(
      "Session login tidak ditemukan"
    );
  }

  const response =
    await fetch(
      "/api/backup/upload",
      {
        method: "POST",
        headers: {
          "Content-Type":
            "application/json",
          "x-session-id":
            sessionId
        },

        body: JSON.stringify({
          fileName,
          jsonData,
          tenantSlug:
            state.tenantSlug
        })
      }
    );

  const result =
    await response.json();

  if (!response.ok) {
    throw new Error(
      result.error ||
      "Upload backup gagal"
    );
  }

  return {
    path:
      result.path,
    size:
      result.size
  };
}


  // =========================
  // BACKUP VIA RPC
  // =========================
  
  async function uploadDatabaseBackup(
    fileName,
    jsonData
  ) {
  
    const response =
      await fetch(
        "/api/backup/upload",
        {
          method: "POST",
  
          headers: {
            "Content-Type":
              "application/json"
            
          },
  
          body: JSON.stringify({
            fileName,
            jsonData,
            tenantSlug: state.tenantSlug
          })
        }
      );
  
    const result =
      await response.json();
  
    if (!response.ok) {
  
      throw new Error(
        result.error ||
        "Upload backup gagal"
      );
    }
  
    return {
      path: result.path,
      size: result.size
    };
  }
  
  
  async function createFullBackup() {
    
  //  CREATE BACKUP VIA RPC
  const {
    data: backup,
    error
  } =
    await supabaseClient.rpc(
      "create_database_backup",
      {}
    );

  if (error) {
    throw error;
  }

  if (
    !backup?.backup_info?.backup_id
  ) {
    throw new Error(
      "Backup ID tidak ditemukan."
    );
  }

  const backupId =
    backup
      .backup_info
      .backup_id;

  const fileName =
    backupId + ".json";


  // =========================
  // 2. UPLOAD VIA VERCEL API
  // =========================

  const upload =
    await uploadDatabaseBackup(
      fileName,
      backup
    );

  if (!upload?.path) {
    throw new Error(
      "Upload backup gagal."
    );
  }


  // =========================
  // 3. UPDATE BACKUP HISTORY
  // =========================

  const {
    data: updateResult,
    error: updateError
  } =
    await supabaseClient.rpc(
      "update_backup_file_info",
      {
        p_backup_id:
          backupId,

        p_file_path:
          upload.path,

        p_file_size:
          upload.size
      }
    );

  if (updateError) {
    throw updateError;
  }


  return {
    success: true,

    backup_id:
      backupId,

    file_path:
      upload.path,

    file_size:
      upload.size
  };
}

// =========================
// RESTORE BACKUP VIA VERCEL
// =========================

async function restoreDatabaseBackupByPath(
  filePath
) {

  const response =
    await fetch(
      "/api/backup/restore",
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json"
        },

        body: JSON.stringify({
          filePath,
          tenantSlug: state.tenantSlug
        })
      }
    );

  const result =
    await response.json();

  if (!response.ok) {

    throw new Error(
      result.error ||
      "Restore backup gagal"
    );
  }

  return result;
}


async function restoreBackupById(
  backupId
) {

  // =========================
  // 1. AMBIL INFO BACKUP
  // =========================

  const {
    data: history,
    error
  } =
    await supabaseClient
      .from("Backup_History")
      .select(
        "backup_id,file_path"
      )
      .eq(
        "backup_id",
        backupId
      )
      .single();

  if (error) {
    throw error;
  }

  if (!history) {

    throw new Error(
      "Backup tidak ditemukan"
    );
  }

  if (!history.file_path) {

    throw new Error(
      "File backup tidak ditemukan"
    );
  }


  // =========================
  // 2. RESTORE VIA VERCEL API
  // =========================

  return await restoreDatabaseBackupByPath(
    history.file_path
  );
}

async function deleteDatabaseBackup(filePath) {

  const response =
    await fetch(
      "/api/backup/delete",
      {
        method: "POST",
        headers: {
          "Content-Type":
            "application/json"
        },

        body: JSON.stringify({
          filePath,
          tenantSlug: state.tenantSlug
        })
      }
    );

  const responseText =
    await response.text();
  
  console.log(
    "DELETE STORAGE STATUS:",
    response.status
  );
  
  console.log(
    "DELETE STORAGE RESPONSE:",
    responseText
  );
  
  let result = {};
  
  try {
    result =
      responseText
        ? JSON.parse(responseText)
        : {};
  }
  catch (e) {
    console.error(
      "DELETE STORAGE JSON ERROR:",
      e
    );
  }

  if (!response.ok) {
    throw new Error(
      result.error ||
      "Gagal menghapus file backup"
    );
  }
  return result;
}

async function deleteBackupById(backupId) {
   console.log(
    "DELETE BACKUP ID:",
    backupId
  );
  const {
    data: history,
    error
  } = await supabaseClient
    .from("Backup_History")
    .select("backup_id,file_path")
    .eq("backup_id", backupId)
    .single();
  
   console.log(
    "BACKUP HISTORY:",
    history,
    error
  );

  if (error) {
    throw error;
  }

  if (!history) {
    throw new Error(
      "Backup tidak ditemukan"
    );
  }

  if (history.file_path) {
    await deleteDatabaseBackup(
      history.file_path
    );
  }

  const {
    error: deleteError
  } = await supabaseClient.rpc(
    "delete_backup_history",
    {
      p_backup_id: backupId
    }
  );

  if (deleteError) {
    throw deleteError;
  }

  return {
    success: true,
    backup_id: backupId
  };
}



















