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
