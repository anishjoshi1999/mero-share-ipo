require("dotenv").config();
const { MeroShareClient } = require("./src/meroShare");

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
        `${index + 1}. ${ipo.companyName} (${ipo.scrip}) - companyShareId: ${ipo.companyShareId}`
      );
    });

    // 2️⃣ Fetch BO details
    console.log("\n🏦 Fetching BO details...");
    const boData = await client.fetchBODetails(client.dpId);
    console.log(boData);

    // 3️⃣ Apply for an IPO (example: first IPO in the list)
    if (ipos.length > 0) {
      const targetIPO = ipos[0];
      console.log(`\n✉️ Applying for IPO: ${targetIPO.companyName} (${targetIPO.scrip})`);
      
      const appliedIPO = await client.applyForIPO({
        targetScript: targetIPO.scrip,
        boid: client.dpId,
        crnNumber: "1234567890", // replace with actual CRN
        appliedKitta: "10",       // number of shares
        pin: "0000",              // transaction PIN
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
      const detail = await client.fetchApplicationDetail(report.applicantFormId);
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
