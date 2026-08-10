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

async function loginUserRPC(username,password){
  const {data,error} =
    await supabaseClient.rpc(
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

  const {
    data: result,
    error
  } = await supabaseClient.rpc(
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

  const {
    data,
    error
  } = await supabaseClient.rpc(
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

  const {
    data: result,
    error
  } = await supabaseClient.rpc(
    "save_other_income",
    {
      p_id:
        data.id,

      p_date:
        data.date,

      p_ref_id:
        data.refId,

      p_description:
        data.description,

      p_category:
        data.category,

      p_method:
        data.method,

      p_amount:
        data.amount,

      p_status:
        data.status,

      p_branch_id:
        data.branchId,

      p_notes:
        data.notes
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

      p_ref_id:
        data.refId
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

  const {
    data,
    error
  } = await supabaseClient.rpc(
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

async function clearDatabase() {

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


  // =========================
  //  BACKUP VIA RPC
  // =========================

async uploadDatabaseBackup(
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
          jsonData
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

  // =========================
  // 1. CREATE BACKUP VIA RPC
  // =========================

  const {
    data: backup,
    error
  } = await supabaseClient.rpc(
    "create_database_backup",
    {}
  );

  if (error) {
    throw error;
  }


  if (!backup?.backup_info?.backup_id) {

    throw new Error(
      "Backup ID tidak ditemukan."
    );

  }


  const backupId =
    backup.backup_info.backup_id;

  const fileName =
    backupId + ".json";


  // =========================
  // 2. UPLOAD BACKUP
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
  // 3. UPDATE HISTORY
  // =========================

  const {
    data: updateResult,
    error: updateError
  } = await supabaseClient.rpc(
    "update_backup_file_info",
    {
      p_backup_id: backupId,
      p_file_path: upload.path,
      p_file_size: upload.size
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

async function downloadDatabaseBackup(filePath) {

  const bucket =
    "database_backup";


  const {
    data,
    error
  } =
    await supabaseClient
      .storage
      .from(bucket)
      .download(filePath);


  if (error) {

    console.error(
      "Download backup error:",
      error
    );

    throw error;
  }


  return data;
}

async function restoreBackupById(
  p_backup_id
) {

  // =========================
  // 1. AMBIL INFO BACKUP
  // =========================

  const {
    data: history,
    error: historyError
  } =
    await supabaseClient
      .from("Backup_History")
      .select("*")
      .eq(
        "backup_id",
        p_backup_id
      )
      .single();


  if (historyError) {
    throw historyError;
  }


  if (!history) {

    throw new Error(
      "Backup tidak ditemukan"
    );

  }


  // =========================
  // 2. DOWNLOAD FILE
  // =========================

  const blob =
    await downloadDatabaseBackup(
      history.file_path
    );


  // =========================
  // 3. PARSE JSON
  // =========================

  const text =
    await blob.text();

  const json =
    JSON.parse(text);


  // =========================
  // 4. RESTORE VIA RPC
  // =========================

  const {
    data: result,
    error: restoreError
  } =
    await supabaseClient.rpc(
      "restore_database_backup",
      {
        p_backup: json,

        p_restored_by:
          "SYSTEM"
      }
    );


  if (restoreError) {
    throw restoreError;
  }


  return result;
}


async function deleteDatabaseBackup(filePath) {

  const bucket =
    "database_backup";


  const {
    data,
    error
  } =
    await supabaseClient
      .storage
      .from(bucket)
      .remove([
        filePath
      ]);


  if (error) {

    console.error(
      "Delete backup file error:",
      error
    );

    throw error;
  }


  return true;
}

async function deleteBackupById(
  p_backup_id
) {

  // =========================
  // 1. AMBIL DATA BACKUP
  // =========================

  const {
    data: backup,
    error: historyError
  } =
    await supabaseClient
      .from("Backup_History")
      .select("*")
      .eq(
        "backup_id",
        p_backup_id
      )
      .single();


  if (historyError) {
    throw historyError;
  }


  if (!backup) {

    throw new Error(
      "Backup tidak ditemukan"
    );

  }


  // =========================
  // 2. HAPUS FILE STORAGE
  // =========================

  if (backup.file_path) {

    await deleteDatabaseBackup(
      backup.file_path
    );

  }


  // =========================
  // 3. HAPUS HISTORY
  // =========================

  const {
    data,
    error
  } =
    await supabaseClient.rpc(
      "delete_backup_history",
      {
        p_backup_id:
          p_backup_id
      }
    );


  if (error) {
    throw error;
  }


  return data;
}



















