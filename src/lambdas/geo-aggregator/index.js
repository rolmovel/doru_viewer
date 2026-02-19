const AWS = require('aws-sdk');

const dynamodb = new AWS.DynamoDB.DocumentClient();
const s3 = new AWS.S3();

exports.handler = async (event) => {
  try {
    // Query DynamoDB for all reports in the last 24 hours
    const reports = await getRecentReports();
    
    // Aggregate by country and category
    const aggregates = aggregateData(reports);
    
    // Generate GeoJSON
    const geojson = generateGeoJSON(aggregates);
    
    // Write to S3
    const date = new Date().toISOString().split('T')[0];
    const key = `date=${date}/geo.json`;
    
    await s3.putObject({
      Bucket: process.env.ANALYTICS_BUCKET,
      Key: key,
      Body: JSON.stringify(geojson),
      ContentType: 'application/json'
    }).promise();
    
    console.log(`Generated aggregation: ${key}`);
    
    return {
      statusCode: 200,
      body: JSON.stringify({ 
        message: 'Aggregation complete',
        records: reports.length,
        file: key
      })
    };
    
  } catch (error) {
    console.error('Aggregation error:', error);
    throw error;
  }
};

async function getRecentReports() {
  const oneDayAgo = new Date();
  oneDayAgo.setDate(oneDayAgo.getDate() - 1);
  
  const params = {
    TableName: process.env.TABLE_NAME,
    IndexName: 'GSI_country',
    KeyConditionExpression: 'country_iso = :country AND #ts > :timestamp',
    ExpressionAttributeNames: {
      '#ts': 'timestamp'
    },
    ExpressionAttributeValues: {
      ':country': 'ES', // This would need to scan all countries
      ':timestamp': oneDayAgo.toISOString()
    }
  };
  
  // For simplicity, doing a scan - in production use parallel scans
  const scanParams = {
    TableName: process.env.TABLE_NAME,
    FilterExpression: 'ingest_timestamp > :timestamp',
    ExpressionAttributeValues: {
      ':timestamp': oneDayAgo.toISOString()
    }
  };
  
  const result = await dynamodb.scan(scanParams).promise();
  return result.Items || [];
}

function aggregateData(reports) {
  const aggregates = {};
  
  for (const report of reports) {
    const key = `${report.country_iso}#${report.category}`;
    
    if (!aggregates[key]) {
      aggregates[key] = {
        country_iso: report.country_iso,
        country_name: report.country_name,
        category: report.category,
        count: 0,
        total_records: 0
      };
    }
    
    aggregates[key].count += 1;
    aggregates[key].total_records += report.record_count || 1;
  }
  
  return Object.values(aggregates);
}

function generateGeoJSON(aggregates) {
  // Simplified GeoJSON structure
  // In production, you'd include actual coordinates
  return {
    type: 'FeatureCollection',
    generated_at: new Date().toISOString(),
    features: aggregates.map(agg => ({
      type: 'Feature',
      properties: {
        country_iso: agg.country_iso,
        country_name: agg.country_name,
        category: agg.category,
        incident_count: agg.count,
        total_records: agg.total_records
      },
      geometry: null // Would be populated with country centroid
    }))
  };
}
