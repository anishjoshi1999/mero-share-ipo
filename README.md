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

## Features

- End-to-end automation of the MeroShare IPO application process
- Fully async/await API for seamless integration
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
const applyIPO = require("mero-share-ipo");

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
		console.error("Application failed:", err.message);
	}
})();
```


## API


### `applyIPO(config)`

Applies for an IPO using the provided configuration object. All fields are required unless otherwise noted.

#### Config Properties

- `username` (string): MeroShare username
- `password` (string): MeroShare password
- `dpId` (string): Broker/DP code
- `targetScript` (string): IPO script/scrip code
- `boid` (string): Your BOID
- `crnNumber` (string): Your CRN number
- `appliedKitta` (string|number): Number of shares to apply for
- `pin` (string): Transaction PIN

## Professional Notes

- This package is built with reliability and security in mind. All network requests are handled asynchronously, and sensitive data is never logged.
- Error messages are designed to be clear and actionable for developers.
- Contributions and suggestions are welcome!

## License

MIT
