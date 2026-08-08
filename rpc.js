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

async function getRecentTransactionsPageRPC( branchId, startDate, endDate, status ) {
  return await supabaseClient.rpc(
    "get_recent_transactions_page",
    {
      p_branch_id: branchId,
      p_start: start || null,
      p_end: end || null,
      p_status: status || "ALL",
      p_table: "ALL"
    }
  );
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
