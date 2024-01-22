/*
GOAL - Automate SSL Renewal 
Namecheap required steps:
Step 1: Run ssl.getInfo command on Namecheap API to check SSL Cert expiration date ('expires') and SSL Cert status ('status').
Step 2: If SSL Cert expires within 90 days and status = 'active', run ssl.renew command.
Step 3: If renew is successful (status = 'OK') generate CSR (generateCSR()).
Step 4: If generateCSR() is successful, run ssl.activate command with new CSR and Certificate ID.  
*/

const https = require('https');
const xml2js = require('xml2js');
const util = require('util');
const forge = require('node-forge');

// Convert callback-based xml2js.parseString to a Promise-based version
const parseString = util.promisify(xml2js.parseString);
const apiUser = '';
const userName = '';
const apiKey = '';
const clientIp = ''; // server or compouter IP Address
const sslType = ''; // type of ssl example: positivessl
// Global variable to store and access the certificate ID across functions
let globalCertificateID = 0000000; // Namecheap SSL Certificate ID

// Asynchronously create an SSL certificate
async function createCertificate() {
     // API command and URL setup
    const command = 'namecheap.ssl.create';
    const url = `https://api.sandbox.namecheap.com/xml.response?ApiUser=${apiUser}&ApiKey=${apiKey}&UserName=${userName}&ClientIp=${clientIp}&Type=${sslType}&years=1&Command=${command}`;

    try {
        // Await the HTTPS request and parse the XML response
        const data = await httpsGet(url);
        const result = await parseString(data);
// Check if the response status is OK and set the globalCertificateID
        if (result.ApiResponse.$.Status === 'OK') {
            console.log('Certificate Creation Successful:', JSON.stringify(result, null, 2));
            globalCertificateID = result.ApiResponse.CommandResponse[0].SSLCreateResult[0].SSLCertificate[0].$.CertificateID;
    return globalCertificateID;
        } else {
            // Log errors if the certificate creation fails
            console.log('Certificate Creation Error:', JSON.stringify(result.ApiResponse.Errors, null, 2));
            return null;
        }
    } catch (error) {
         // Catch and log any errors during the HTTPS request or XML parsing
        console.error('Error during certificate creation:', error);
        return null;
    }
}

async function renewCertificate(certificateID) {
    const command = 'namecheap.ssl.renew';
    const url = `https://api.sandbox.namecheap.com/xml.response?ApiUser=${apiUser}&ApiKey=${apiKey}&UserName=${userName}&ClientIp=${clientIp}&certificateid=${certificateID}&ssltype=${sslType}&years=1&Command=${command}`;

    try {
        const data = await httpsGet(url);
        const result = await parseString(data);

        // Add this line to log the result
        console.log("Renewal Response:", JSON.stringify(result, null, 2));

        if (result.ApiResponse.$.Status === 'OK') {
            generateCSR(); 
        } else {
            console.log('SSL Renewal Error:', JSON.stringify(result.ApiResponse.Errors, null, 2));
        }
    } catch (error) {
        console.error(`Got error: ${error.message}`);
    }
}

async function getSSLInfo(certificateID) {
    const command = 'namecheap.ssl.getinfo';
    const url = `https://api.sandbox.namecheap.com/xml.response?ApiUser=${apiUser}&ApiKey=${apiKey}&UserName=${userName}&ClientIp=${clientIp}&Command=${command}&CertificateID=${certificateID}&returncertificate=true&returntype=individual`;

    try {
        const data = await httpsGet(url);
        const result = await parseString(data);

        console.log("SSL Info Response:", JSON.stringify(result, null, 2));

        // Extract the expiration date from the response
        const expirationDateStr = result.ApiResponse.CommandResponse[0].SSLGetInfoResult[0].CertificateDetails[0].Expires[0];
        const expirationDate = new Date(expirationDateStr);

        // Calculate the difference in days
        const currentDate = new Date();
        const timeDiff = expirationDate.getTime() - currentDate.getTime();
        const daysUntilExpiration = Math.ceil(timeDiff / (1000 * 3600 * 24));

        // Check if within 90-day window
        if (daysUntilExpiration <= 90) {
            return true; // Eligible for renewal
        } else {
            console.error(`Certificate not eligible for renewal. Days until eligible: ${daysUntilExpiration - 90}`);
            return false;
        }
    } catch (error) {
        console.error(`Got error in getSSLInfo: ${error.message}`);
        return false;
    }
}


function generateCSR() {
    const keys = forge.pki.rsa.generateKeyPair(2048);
    const csr = forge.pki.createCertificationRequest();
    csr.publicKey = keys.publicKey;

    // Set the subject of the CSR
    csr.setSubject([
        { name: 'commonName', value: 'www.example.com' },
        { name: 'countryName', value: 'US' },
        { name: 'stateOrProvinceName', value: 'California' },
        { name: 'localityName', value: 'San Francisco' },
        { name: 'organizationName', value: 'Example, Inc.' },
        { name: 'organizationalUnitName', value: 'IT' }
    ]);

    // Sign the CSR using the private key
    csr.sign(keys.privateKey);

    // Convert the CSR to PEM format
    const pem = forge.pki.certificationRequestToPem(csr);
    console.log("pem: ", pem);

    return pem;
}

async function activateCertificate(certificateID, csr) {
    const command = 'namecheap.ssl.activate';
    const url = `https://api.sandbox.namecheap.com/xml.response?ApiUser=${apiUser}&ApiKey=${apiKey}&UserName=${userName}&ClientIp=${clientIp}&Command=${command}&CertificateID=${certificateID}&CSR=${encodeURIComponent(csr)}&Type=${sslType}`;

    try {
        const data = await httpsGet(url);
        const result = await parseString(data);

        console.log("Activation Response:", JSON.stringify(result, null, 2));

        if (result.ApiResponse.$.Status === 'OK') {
            // Handle successful activation
            console.log('SSL Activation Successful');
        } else {
            // Handle activation errors
            console.log('SSL Activation Error:', JSON.stringify(result.ApiResponse.Errors, null, 2));
        }
    } catch (error) {
        console.error(`Got error: ${error.message}`);
    }
}

function httpsGet(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                resolve(data);
            });
        }).on('error', (e) => {
            reject(e);
        });
    });
}

// Main execution
(async () => {
    await createCertificate();  // This will set the globalCertificateID
    if (globalCertificateID) {
        const isEligibleForRenewal = await getSSLInfo(globalCertificateID);
        if (isEligibleForRenewal) {
            const renewalSuccess = await renewCertificate(globalCertificateID);
            if (renewalSuccess) {
                const csr = generateCSR(); // Generate the CSR
                await activateCertificate(globalCertificateID, csr); // Activate the certificate with the CSR
            }
        }
    }
})();

