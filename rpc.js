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
