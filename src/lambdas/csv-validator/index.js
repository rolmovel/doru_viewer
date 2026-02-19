const AWS = require('aws-sdk');
const csv = require('csv-parser');
const stream = require('stream');

const s3 = new AWS.S3();
const sns = new AWS.SNS();

const REQUIRED_COLUMNS = [
  'id', 'timestamp', 'country_iso', 'country_name', 
  'category', 'title', 'url', 'record_count', 'relevance_level'
];

const VALID_CATEGORIES = [
  'Seguridad Física', 
  'General', 
  'Ruido/No relevante', 
  'Regulatorio'
];

exports.handler = async (event) => {
  const records = [];
  const errors = [];
  
  for (const record of event.Records) {
    const bucket = record.s3.bucket.name;
    const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '));
    
    try {
      const result = await validateCSV(bucket, key);
      records.push(...result.validRecords);
      errors.push(...result.errors);
      
      // Move valid file to processing folder
      await moveFile(bucket, key, bucket, key.replace('/raw/', '/validated/'));
      
    } catch (error) {
      console.error(`Error processing ${key}:`, error);
      errors.push({ file: key, error: error.message });
      
      // Move invalid file to rejected folder
      await moveFile(bucket, key, bucket, key.replace('/raw/', '/rejected/'));
      
      // Send alert if >5% errors
      if (errors.length > 0) {
        await sendAlert(bucket, key, errors);
      }
    }
  }
  
  return {
    statusCode: 200,
    body: JSON.stringify({ 
      processed: records.length, 
      errors: errors.length 
    })
  };
};

async function validateCSV(bucket, key) {
  const params = { Bucket: bucket, Key: key };
  const data = await s3.getObject(params).promise();
  
  const validRecords = [];
  const errors = [];
  
  return new Promise((resolve, reject) => {
    const bufferStream = new stream.PassThrough();
    bufferStream.end(data.Body);
    
    bufferStream
      .pipe(csv())
      .on('headers', (headers) => {
        const missing = REQUIRED_COLUMNS.filter(col => !headers.includes(col));
        if (missing.length > 0) {
          reject(new Error(`Missing columns: ${missing.join(', ')}`));
        }
      })
      .on('data', (row) => {
        const validation = validateRow(row);
        if (validation.valid) {
          validRecords.push(row);
        } else {
          errors.push({ row, error: validation.error });
        }
      })
      .on('end', () => {
        resolve({ validRecords, errors });
      })
      .on('error', reject);
  });
}

function validateRow(row) {
  // Validate country code (ISO-3166 alpha-2)
  if (!/^[A-Z]{2}$/.test(row.country_iso)) {
    return { valid: false, error: `Invalid country code: ${row.country_iso}` };
  }
  
  // Validate category
  if (!VALID_CATEGORIES.includes(row.category)) {
    row.category = 'General'; // Default to General
  }
  
  // Validate URL format
  try {
    new URL(row.url);
  } catch {
    return { valid: false, error: `Invalid URL: ${row.url}` };
  }
  
  return { valid: true };
}

async function moveFile(sourceBucket, sourceKey, destBucket, destKey) {
  await s3.copyObject({
    Bucket: destBucket,
    CopySource: `${sourceBucket}/${sourceKey}`,
    Key: destKey
  }).promise();
  
  await s3.deleteObject({
    Bucket: sourceBucket,
    Key: sourceKey
  }).promise();
}

async function sendAlert(bucket, key, errors) {
  const message = {
    default: JSON.stringify({
      alert: 'CSV Validation Errors',
      bucket,
      file: key,
      errorCount: errors.length,
      errors: errors.slice(0, 5) // First 5 errors
    })
  };
  
  // This would send to an SNS topic
  console.log('Alert:', message);
}
