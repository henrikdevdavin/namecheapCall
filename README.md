# namecheapCall

# SSL Renewal Automation Script

## Overview
This script automates the renewal of SSL certificates using the Namecheap API. It checks the certificate expiration date and status, and if eligible, renews the certificate, generates a new CSR (Certificate Signing Request), and activates the certificate.

## Prerequisites
- Node.js
- Namecheap API credentials (API User, API Key, and Client IP)
- Knowledge of your SSL type

## Installation
1. Clone the repository or download the source code.
2. Install the required Node.js packages:

## Configuration
Update the script with your Namecheap API credentials and other required information:
- `apiUser`: Your username for Namecheap API access.
- `apiKey`: Your API key for Namecheap.
- `userName`: The username on which commands are executed. Usually the same as `apiUser`.
- `clientIp`: The IP address from which API calls are made. Only IPv4 is supported.
- `sslType`: The type of SSL certificate you're using (e.g., `positivessl`).

## Usage
To run the script, simply execute:

The script performs the following steps:
1. **Check SSL Certificate**: Uses `ssl.getInfo` to check the certificate's expiration date and status.
2. **Renew SSL Certificate**: If the certificate expires within 90 days and is active, it executes `ssl.renew`.
3. **Generate CSR**: On successful renewal, it generates a new CSR.
4. **Activate SSL Certificate**: With a successful CSR generation, it activates the certificate using `ssl.activate`.

## Functions
- `createCertificate()`: Asynchronously creates an SSL certificate.
- `renewCertificate(certificateID)`: Renews the SSL certificate.
- `getSSLInfo(certificateID)`: Retrieves SSL certificate information.
- `generateCSR()`: Generates a Certificate Signing Request.
- `activateCertificate(certificateID, csr)`: Activates the SSL certificate with the given CSR.
- `httpsGet(url)`: A utility function to perform HTTPS GET requests.

## Notes
- The script currently points to Namecheap's sandbox environment. Modify the URLs to point to the live API for production use.
- Ensure that your API credentials and other sensitive information are secured and not hardcoded in the script.
- This script is intended for automation purposes and assumes familiarity with SSL certificates and the Namecheap API.

## References
For more information on the Namecheap API methods, visit [Namecheap API Documentation](https://www.namecheap.com/support/api/methods/).

## License
N/A

## Author
henrikdevdavin
