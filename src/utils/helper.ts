
// Add this function to generate serial numbers
export function generateSerialNumber  (asset = null) {
    // console.log(asset)
    const activeAsset = asset;
    // console.log(activeAsset)
    const prefix = activeAsset?.substring(0, 3).toUpperCase() || 'AST';
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    return `${prefix}-${randomNum}`;
  };