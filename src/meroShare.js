const BASE_URL = "https://webbackend.cdsc.com.np/api/meroShare";
const BO_URL = "https://webbackend.cdsc.com.np/api/meroShareView";

async function fetchClientId(brokerCode) {
  const res = await fetch(`${BASE_URL}/capital/`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Origin: "https://meroshare.cdsc.com.np",
      Referer: "https://meroshare.cdsc.com.np/",
    },
  });

  if (!res.ok) {
    throw new Error(`❌ Failed to fetch clientId (status: ${res.status})`);
  }

  const data = await res.json();
  const client = data.find((c) => c.code === brokerCode);
  if (!client) {
    throw new Error(
      `❌ Broker with code "${brokerCode}" not found in /capital/`
    );
  }
  return client.id;
}

class MeroShareClient {
  constructor({ username, password, dpId }) {
    this.username = username;
    this.password = password;
    this.dpId = dpId;
    this.token = null;
  }

  async login() {
    const clientId = await fetchClientId(this.dpId);
    const loginRes = await fetch(`${BASE_URL}/auth/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: "https://meroshare.cdsc.com.np",
        Referer: "https://meroshare.cdsc.com.np/",
      },
      body: JSON.stringify({
        username: this.username,
        password: this.password,
        clientId,
      }),
    });
    if (!loginRes.ok) {
      throw new Error(`❌ Login failed with status ${loginRes.status}`);
    }

    const loginData = await loginRes.json();
    if (loginData.statusCode !== 200) {
      throw new Error(`❌ Login failed: ${loginData.message}`);
    }

    this.token = loginRes.headers.get("authorization");
    if (!this.token) throw new Error("❌ No authorization token received!");

    console.log(`✅ Login successful for user: ${this.username}`);
  }

  async authFetch(url, options = {}) {
    if (!this.token) {
      console.log("⚠️ No token found. Logging in...");
      await this.login();
    }

    let res = await fetch(url, {
      ...options,
      headers: {
        ...(options.headers || {}),
        Authorization: this.token,
        Origin: "https://meroshare.cdsc.com.np",
        Referer: "https://meroshare.cdsc.com.np/",
      },
    });

    // Handle token expiry (e.g., 401 Unauthorized)
    if (res.status === 401) {
      console.log("⚠️ Token expired. Re-logging in...");
      await this.login();
      res = await fetch(url, {
        ...options,
        headers: {
          ...(options.headers || {}),
          Authorization: this.token,
          Origin: "https://meroshare.cdsc.com.np",
          Referer: "https://meroshare.cdsc.com.np/",
        },
      });
    }

    return res;
  }

  async fetchIPOs() {
    const res = await this.authFetch(
      `${BASE_URL}/companyShare/applicableIssue/`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
      }
    );

    if (!res.ok) {
      throw new Error(`❌ Failed to fetch IPOs (status: ${res.status})`);
    }

    return (await res.json()).object || [];
  }

  async fetchBODetails(boid) {
    const res = await this.authFetch(`${BO_URL}/myDetail/${boid}`);
    if (!res.ok)
      throw new Error(`❌ Failed to fetch BO details (status: ${res.status})`);
    return res.json();
  }

  async applyForIPO({
    targetScript,
    boid,
    crnNumber,
    appliedKitta = "10",
    pin,
  }) {
    const ipoList = await this.fetchIPOs();
    const share = ipoList.find(
      (i) => i.scrip.toUpperCase() === targetScript.toUpperCase()
    );
    if (!share) throw new Error(`❌ Target IPO "${targetScript}" not found!`);
    console.log(`✅ Target IPO found: ${share.companyName} (${share.scrip})`);

    const companyShareId = share.companyShareId;

    // BO details
    const boData = await this.fetchBODetails(boid);
    const { bankCode, boid: demat } = boData;

    // Bank request info
    const bankReqRes = await this.authFetch(
      `${BASE_URL.replace("/meroShare", "")}/bankRequest/${bankCode}`
    );
    if (!bankReqRes.ok)
      throw new Error(
        `❌ Failed to fetch bank request (status: ${bankReqRes.status})`
      );
    const bankReqData = await bankReqRes.json();
    const bankId = bankReqData.bank.id;

    // Bank account
    const bankRes = await this.authFetch(`${BASE_URL}/bank/${bankId}`);
    if (!bankRes.ok)
      throw new Error(
        `❌ Failed to fetch bank account (status: ${bankRes.status})`
      );
    const bankAccount = (await bankRes.json())[0];
    const {
      id: customerId,
      accountBranchId,
      accountNumber: registeredAccountNumber,
    } = bankAccount;

    console.log(`✅ Bank account info fetched for customerId: ${customerId}`);

    // Apply IPO
    const payload = {
      accountBranchId,
      accountNumber: registeredAccountNumber,
      accountTypeId: 1,
      appliedKitta,
      bankId: bankId.toString(),
      boid: this.username,
      companyShareId: companyShareId.toString(),
      crnNumber,
      customerId,
      demat,
      transactionPIN: pin,
    };

    const applyRes = await this.authFetch(
      `${BASE_URL}/applicantForm/share/apply`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );

    if (!applyRes.ok) {
      const error = await applyRes.json();
      throw new Error(
        `❌ IPO application failed for ${targetScript} (message: ${error.message})`
      );
    }

    const applyData = await applyRes.json();
    console.log(
      `✅ IPO application successful for ${targetScript}. Transaction reference: ${
        applyData.referenceNo || "N/A"
      }`
    );
    return applyData;
  }
  async fetchApplicationReports() {
    const res = await this.authFetch(
      `${BASE_URL}/applicantForm/active/search/`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filterFieldParams: [
            {
              key: "companyShare.companyIssue.companyISIN.script",
              alias: "Scrip",
            },
          ],
          filterDateParams: [
            { key: "appliedDate", condition: "", alias: "", value: "" },
          ],
          page: 1,
          size: 200,
          searchRoleViewConstants: "VIEW_APPLICANT_FORM_COMPLETE",
        }),
      }
    );

    if (!res.ok)
      throw new Error(
        `❌ Failed to fetch application reports (status: ${res.status})`
      );
    const data = await res.json();
    return data.object || [];
  }
  async fetchApplicationDetail(applicantFormId) {
    const res = await this.authFetch(
      `${BASE_URL}/applicantForm/report/detail/${applicantFormId}`,
      {
        method: "GET",
      }
    );

    if (!res.ok) {
      throw new Error(
        `❌ Failed to fetch application detail for applicantFormId ${applicantFormId} (status: ${res.status})`
      );
    }

    return res.json(); // contains statusName, stageName, etc.
  }
}

module.exports = { MeroShareClient };
