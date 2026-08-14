import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {

  console.log("=== EXPORT PDF START ===");

  if (req.method !== "POST") {
    return res
      .status(405)
      .send("Method not allowed");
  }

  try {

    const {
      type = "",
      start,
      end,
      branchId,
      status = "ALL",
      category = "ALL",
      tier = "ALL",
      search = "",
      loginUserId
    } = req.body || {};

    console.log("EXPORT TYPE:", type);
console.log("EXPORT BRANCH:", branchId);

// =====================================================
// TEST MEMBER RPC
// =====================================================

if (type === "members") {

  console.log(
    ">>> MASUK MEMBER EXPORT <<<"
  );

  const {
    data,
    error
  } = await supabase.rpc(
    "get_members",
    {
      p_branch_id: branchId
    }
  );

  console.log(
    "GET MEMBERS DATA:",
    data
  );

  console.log(
    "GET MEMBERS ERROR:",
    error
  );

  if (error) {
    throw error;
  }

  return res.status(200).json({
    success: true,
    rows: Array.isArray(data)
      ? data.length
      : 0
  });
} catch (err) {

    console.error(
      "EXPORT TEST ERROR:",
      err
    );

    return res.status(500).json({
      success: false,
      error: err?.message || "Unknown error"
    });

  }
}
