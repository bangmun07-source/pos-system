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

