const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');

const dynamodb = new AWS.DynamoDB.DocumentClient();
const s3 = new AWS.S3();

exports.handler = async (event) => {
  const records = [];
  
  for (const record of event.Records) {
    const bucket = record.s3.bucket.name;
    const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '));
    
    try {
      // Get validated CSV data
      const data = await s3.getObject({ Bucket: bucket, Key: key }).promise();
      const rows = JSON.parse(data.Body.toString());
      
      // Normalize and enrich data
      const normalizedRecords = rows.map(row => normalizeRecord(row, key));
      
      // Write to DynamoDB in batches
      await writeToDynamoDB(normalizedRecords);
      
      // Trigger aggregation
      await triggerAggregation();
      
      records.push(...normalizedRecords);
      
    } catch (error) {
      console.error(`Error normalizing ${key}:`, error);
      throw error;
    }
  }
  
  return {
    statusCode: 200,
    body: JSON.stringify({ processed: records.length })
  };
};

function normalizeRecord(row, sourceFile) {
  const timestamp = new Date().toISOString();
  
  return {
    report_id: uuidv4(),
    country_iso: row.country_iso.toUpperCase(),
    country_name: row.country_name,
    category: normalizeCategory(row.category),
    timestamp: row.timestamp,
    title: row.title,
    url: row.url,
    record_count: parseInt(row.record_count, 10) || 1,
    relevance: row.relevance_level,
    doc_path: row.doc_path || null,
    ingest_timestamp: timestamp,
    source_file: sourceFile
  };
}

function normalizeCategory(category) {
  const validCategories = {
    'Seguridad Física': 'Seguridad Física',
    'General': 'General',
    'Ruido/No relevante': 'Ruido/No relevante',
    'Regulatorio': 'Regulatorio'
  };
  
  return validCategories[category] || 'General';
}

async function writeToDynamoDB(records) {
  const chunks = chunkArray(records, 25); // DynamoDB batch limit
  
  for (const chunk of chunks) {
    const params = {
      RequestItems: {
        [process.env.TABLE_NAME]: chunk.map(item => ({
          PutRequest: {
            Item: item
          }
        }))
      }
    };
    
    await dynamodb.batchWrite(params).promise();
  }
}

async function triggerAggregation() {
  // Publish to EventBridge or SNS to trigger aggregation Lambda
  const eventBridge = new AWS.EventBridge();
  
  await eventBridge.putEvents({
    Entries: [{
      Source: 'doru.data-normalizer',
      DetailType: 'DataNormalized',
      Detail: JSON.stringify({ timestamp: new Date().toISOString() }),
      EventBusName: 'default'
    }]
  }).promise();
}

function chunkArray(array, size) {
  const chunks = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}
