/**
 * Utility parameters and functions for Pinata IPFS uploads.
 * Uses the API keys provided in frontend/.env
 */

const PINATA_JWT = import.meta.env.VITE_PINATA_JWT;

/**
 * Uploads a base64 Data URL to IPFS via Pinata.
 * @param {string} base64Data - The pure base64 data URL (e.g., 'data:image/png;base64,iVBORw0K...')
 * @param {string} fileName - Optional filename to easily identify the upload on Pinata dashboard
 * @returns {Promise<string>} The IPFS CID (Hash) of the uploaded file
 */
export const uploadBase64ToPinata = async (base64Data, fileName = 'agrotrust-crop.png') => {
  try {
    if (!base64Data) throw new Error("No image data provided");
    
    // Extract base64 part and mime type
    const matches = base64Data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      throw new Error('Invalid input string for Base64 image data');
    }
    const type = matches[1];
    const data = matches[2];

    // Convert base64 to Blob
    const byteCharacters = atob(data);
    const byteArrays = [];
    for (let offset = 0; offset < byteCharacters.length; offset += 512) {
      const slice = byteCharacters.slice(offset, offset + 512);
      const byteNumbers = new Array(slice.length);
      for (let i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      byteArrays.push(byteArray);
    }
    const blob = new Blob(byteArrays, { type: type });
    
    // Create FormData for Pinata API
    const formData = new FormData();
    formData.append('file', blob, fileName);
    
    // Add optional pinata metadata for organization
    const pinataMetadata = JSON.stringify({ name: fileName });
    formData.append('pinataMetadata', pinataMetadata);

    const pinataOptions = JSON.stringify({ cidVersion: 0 });
    formData.append('pinataOptions', pinataOptions);

    console.log(`[Pinata] Uploading file '${fileName}' to IPFS...`);
    
    // Make request using standard fetch API
    const res = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PINATA_JWT}`
      },
      body: formData
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("[Pinata] Error upload response:", errorText);
      throw new Error(`Failed to upload to Pinata: ${res.status} ${res.statusText}`);
    }

    const dataRes = await res.json();
    return dataRes.IpfsHash; // Return the CID

  } catch (error) {
    console.error('[Pinata] Error uploading file: ', error);
    throw error;
  }
};

/**
 * Returns the viewable HTTP gateway URL for a given IPFS CID.
 */
export const getIpfsUrl = (cid) => {
  if (!cid) return null;
  // Use a more permissive public gateway than Pinata's default (which rate-limits heavily)
  return `https://ipfs.io/ipfs/${cid}`;
};
