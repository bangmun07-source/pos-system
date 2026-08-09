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
    
  // CLEAR FRONTEND STATE
  state.settingsPageData = null;
  state.memberPageData = null;
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

