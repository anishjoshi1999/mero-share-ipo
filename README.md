# MeroShare IPO Automation (Experimental / Educational)

⚠️ **Disclaimer:**  
This software demonstrates how HTTP requests can be used to interact with MeroShare's APIs to apply for IPOs. **Using it with real accounts may violate MeroShare Terms of Service** and could result in account suspension, financial loss, or legal consequences.

This project is intended for **educational purposes only**:

- Learn how HTTP requests and workflows can be automated with Node.js
- Study API interaction patterns
- Test improvements or modifications in **sandbox or dummy environments**

Do **not** use real credentials unless you fully understand the risks and accept all consequences.

---

# mero-share-ipo

Effortlessly automate your IPO applications on Nepal's MeroShare platform with Node.js. This package provides a robust, developer-friendly API for interacting with MeroShare's backend, leveraging modern JavaScript best practices such as async/await for clean, readable code.

GitHub Repository: [anishjoshi1999/mero-share-ipo](https://github.com/anishjoshi1999/mero-share-ipo)

## Features

- End-to-end automation of the MeroShare IPO application process
- Modern async/await API via the `MeroShareClient` class
- Secure credential management via environment variables
- Comprehensive error handling and informative logging
- Designed for reliability and maintainability

## Installation

Install via npm:

```bash
npm install mero-share-ipo
```

## Getting Started

First, create a `.env` file in your project root and add your MeroShare credentials:

```env
MERO_SHARE_USERNAME=your_username
MERO_SHARE_PASSWORD=your_password
DP_ID=your_dp_id # Broker/DP code
TARGET_SCRIPT=IPO_SCRIPT
BOID=your_boid
CRN=your_crn
APPLIED_KITTA=10
PIN=your_transaction_pin
```

### Example Usage

```javascript
require("dotenv").config();
const { MeroShareClient } = require("mero-share-ipo");

(async () => {
  const client = new MeroShareClient({
    username: process.env.MERO_SHARE_USERNAME,
    password: process.env.MERO_SHARE_PASSWORD,
    dpId: process.env.DP_ID,
  });

  try {
    console.log("🔑 Logging in...");
    await client.login();

    // 1️⃣ Fetch all available IPOs
    console.log("\n📈 Fetching available IPOs...");
    const ipos = await client.fetchIPOs();
    ipos.forEach((ipo, index) => {
      console.log(
        `${index + 1}. ${ipo.companyName} (${ipo.scrip}) - companyShareId: ${
          ipo.companyShareId
        }`
      );
    });

    // 2️⃣ Fetch BO details
    console.log("\n🏦 Fetching BO details...");
    const boData = await client.fetchBODetails(client.dpId);
    console.log(boData);

    // 3️⃣ Apply for an IPO (example: first IPO in the list)
    if (ipos.length > 0) {
      const targetIPO = ipos[0];
      console.log(
        `\n✉️ Applying for IPO: ${targetIPO.companyName} (${targetIPO.scrip})`
      );

      const appliedIPO = await client.applyForIPO({
        targetScript: targetIPO.scrip,
        boid: client.dpId,
        crnNumber: "1234567890", // replace with actual CRN
        appliedKitta: "10", // number of shares
        pin: "0000", // transaction PIN
      });
      console.log("Application Response:", appliedIPO);
    }

    // 4️⃣ Fetch all IPO application reports
    console.log("\n📋 Fetching all IPO application reports...");
    const reports = await client.fetchApplicationReports();
    reports.forEach((r) => {
      console.log(
        `${r.scrip} - ${r.companyName} - applicantFormId: ${r.applicantFormId} - Applied: ${r.appliedKitta} - Received: ${r.receivedKitta} - Status: ${r.statusName}`
      );
    });

    // 5️⃣ Fetch detailed info for each IPO application
    console.log("\n🔍 Fetching detailed IPO application status...");
    for (const report of reports) {
      const detail = await client.fetchApplicationDetail(
        report.applicantFormId
      );
      console.log(
        `\n📌 ${report.scrip} - ${report.companyName}\n` +
          `ApplicantFormId: ${detail.applicantFormId}\n` +
          `Applied Kitta: ${detail.appliedKitta}\n` +
          `Received Kitta: ${detail.receivedKitta}\n` +
          `Status: ${detail.statusName}\n` +
          `Stage: ${detail.stageName}\n` +
          `Remarks: ${detail.reasonOrRemark || detail.meroshareRemark}`
      );
    }

    console.log("\n✅ All actions completed successfully!");
  } catch (err) {
    console.error("❌ Error:", err.message);
  }
})();
```

## API

### `MeroShareClient`

Create a new client:

```js
const client = new MeroShareClient({ username, password, dpId });
```

#### Methods

- `login()` – Authenticates and stores the session token
- `applyForIPO({ targetScript, boid, crnNumber, appliedKitta, pin })` – Applies for an IPO
- `fetchIPOs()` – Lists currently applicable IPOs
- `fetchBODetails(boid)` – Gets BO account details
- `fetchApplicationReports()` – Lists your IPO application reports
- `fetchApplicationDetail(applicantFormId)` – Gets details for a specific application

#### Example: Fetch IPOs

```js
const ipos = await client.fetchIPOs();
console.log(ipos);
```

## Professional Notes

- This package is built with reliability and security in mind. All network requests are handled asynchronously, and sensitive data is never logged.
- Error messages are designed to be clear and actionable for developers.
- Contributions and suggestions are welcome! See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

MIT
