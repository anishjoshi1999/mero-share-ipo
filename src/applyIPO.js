const fetchClientId = async (brokerCode) => {
  console.log(`➡️ Fetching clientId for broker code: ${brokerCode}`);
  const res = await fetch("https://webbackend.cdsc.com.np/api/meroShare/capital/", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Origin: "https://meroshare.cdsc.com.np",
      Referer: "https://meroshare.cdsc.com.np/",
    },
  });

  if (!res.ok) throw new Error(`Failed to fetch clientId (status: ${res.status})`);

  const data = await res.json();
  const client = data.find((c) => c.code === brokerCode);

  if (!client) throw new Error(`Broker with code "${brokerCode}" not found in /capital/`);
  return client.id; // This is the DP_ID (clientId)
};


async function applyIPO(config) {
  const {
    username,
    password,
    dpId,
    targetScript,
    boid,
    crnNumber,
    appliedKitta,
    pin,
  } = config;

  const BASE_URL = "https://webbackend.cdsc.com.np/api/meroShare";
  const BO_URL = "https://webbackend.cdsc.com.np/api/meroShareView";
  const clientId = await fetchClientId(dpId);
  try {
    console.log(`➡️ Attempting login for user: ${username}`);
    const loginRes = await fetch(`${BASE_URL}/auth/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: "https://meroshare.cdsc.com.np",
        Referer: "https://meroshare.cdsc.com.np/",
      },
      body: JSON.stringify({ username, password, clientId }),
    });

    if (!loginRes.ok)
      throw new Error(`❌ Login failed with status ${loginRes.status}`);
    const loginData = await loginRes.json();
    console.log(`✅ Login successful for user: ${username}`);

    const token = loginRes.headers.get("authorization");
    if (!token) throw new Error("❌ No authorization token received!");
    console.log("✅ Authorization token obtained");

    const headers = {
      Authorization: token,
      "Content-Type": "application/json",
      Origin: "https://meroshare.cdsc.com.np",
      Referer: "https://meroshare.cdsc.com.np/",
    };

    console.log("➡️ Fetching applicable IPOs...");
    const ipoRes = await fetch(`${BASE_URL}/companyShare/applicableIssue/`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        filterFieldParams: [
          { key: "companyIssue.companyISIN.script", alias: "Scrip" },
          {
            key: "companyIssue.companyISIN.company.name",
            alias: "Company Name",
          },
        ],
        page: 1,
        size: 10,
        searchRoleViewConstants: "VIEW_APPLICABLE_SHARE",
        filterDateParams: [
          { key: "minIssueOpenDate", value: "" },
          { key: "maxIssueCloseDate", value: "" },
        ],
      }),
    });

    if (!ipoRes.ok)
      throw new Error(`❌ Failed to fetch IPOs with status ${ipoRes.status}`);
    const ipoData = await ipoRes.json();

    const share = ipoData.object.find(
      (i) => i.scrip.toUpperCase() === targetScript.toUpperCase()
    );
    if (!share) throw new Error(`❌ Target IPO "${targetScript}" not found!`);
    console.log(`✅ Target IPO found: ${share.companyName} (${share.scrip})`);

    const companyShareId = share.companyShareId;

    console.log(`➡️ Fetching BO details for BOID: ${boid}`);
    const boRes = await fetch(`${BO_URL}/myDetail/${boid}`, { headers });
    if (!boRes.ok)
      throw new Error(
        `❌ Failed to fetch BO details (status: ${boRes.status})`
      );
    const boData = await boRes.json();
    const { bankCode, accountNumber: bankAccountNumber, boid: demat } = boData;
    console.log(`✅ BO details fetched for BOID: ${boid}`);

    console.log(`➡️ Fetching bank info for bankCode: ${bankCode}`);
    const bankReqRes = await fetch(
      `https://webbackend.cdsc.com.np/api/bankRequest/${bankCode}`,
      { headers }
    );
    if (!bankReqRes.ok)
      throw new Error(
        `❌ Failed to fetch bank request details (status: ${bankReqRes.status})`
      );
    const bankReqData = await bankReqRes.json();
    const bankId = bankReqData.bank.id;

    const bankRes = await fetch(`${BASE_URL}/bank/${bankId}`, { headers });
    if (!bankRes.ok)
      throw new Error(
        `❌ Failed to fetch bank account info (status: ${bankRes.status})`
      );
    const bankAccount = (await bankRes.json())[0];
    const { id: customerId, accountBranchId } = bankAccount;
    console.log(`✅ Bank account info fetched for customerId: ${customerId}`);

    const payload = {
      accountBranchId,
      accountNumber: bankAccountNumber,
      accountTypeId: 1,
      appliedKitta: appliedKitta || "10",
      bankId: bankId.toString(),
      boid: username,
      companyShareId: companyShareId.toString(),
      crnNumber,
      customerId,
      demat,
      transactionPIN: pin,
    };

    console.log(`➡️ Applying IPO for ${targetScript}...`);
    const applyRes = await fetch(`${BASE_URL}/applicantForm/share/apply`, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });

    if (!applyRes.ok)
      throw new Error(
        `❌ IPO application failed for ${targetScript} (status: ${applyRes.status})`
      );

    const applyData = await applyRes.json();
    console.log(
      `✅ IPO application successful for ${targetScript}. Transaction reference: ${
        applyData.referenceNo || "N/A"
      }`
    );

    return applyData;
  } catch (err) {
    console.error(`❌ Operation failed: ${err.message}`);
    throw err;
  }
}

module.exports = applyIPO;
