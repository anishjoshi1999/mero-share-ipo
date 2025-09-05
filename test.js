require("dotenv").config();
const applyIPO = require("./src/applyIPO");

(async () => {
  try {
    const result = await applyIPO({
      username: process.env.MERO_SHARE_USERNAME,
      password: process.env.MERO_SHARE_PASSWORD,
      dpId: process.env.DP_ID,
      targetScript: process.env.TARGET_SCRIPT,
      boid: process.env.BOID,
      crnNumber: process.env.CRN,
      appliedKitta: process.env.APPLIED_KITTA,
      pin: process.env.PIN
    });

    console.log("IPO Applied Successfully:", result);
  } catch (err) {
    console.error("Error:", err.message);
  }
})();
