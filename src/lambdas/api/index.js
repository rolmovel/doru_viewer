const AWS = require('aws-sdk');

const dynamodb = new AWS.DynamoDB.DocumentClient();
const s3 = new AWS.S3();

exports.handler = async (event) => {
  const { httpMethod, path, queryStringParameters } = event;
  
  try {
    // Route requests
    if (path === '/map-aggregates') {
      return await getMapAggregates();
    } else if (path === '/reports') {
      return await getReports(queryStringParameters);
    } else if (path.startsWith('/documents/')) {
      const reportId = path.split('/')[2];
      return await getDocumentUrl(reportId);
    }
    
    return {
      statusCode: 404,
      body: JSON.stringify({ error: 'Not found' })
    };
    
  } catch (error) {
    console.error('API Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};

async function getMapAggregates() {
  const date = new Date().toISOString().split('T')[0];
  const key = `date=${date}/geo.json`;
  
  try {
    const result = await s3.getObject({
      Bucket: process.env.ANALYTICS_BUCKET,
      Key: key
    }).promise();
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: result.Body.toString()
    };
  } catch (error) {
    // Return empty feature collection if not found
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        type: 'FeatureCollection',
        features: []
      })
    };
  }
}

async function getReports(params = {}) {
  const { country, category, startDate, endDate, limit = 25 } = params;
  
  let queryParams = {
    TableName: process.env.TABLE_NAME,
    Limit: parseInt(limit)
  };
  
  // Use appropriate index based on filter
  if (country) {
    queryParams.IndexName = 'GSI_country';
    queryParams.KeyConditionExpression = 'country_iso = :country';
    queryParams.ExpressionAttributeValues = { ':country': country };
  } else if (category) {
    queryParams.IndexName = 'GSI_category';
    queryParams.KeyConditionExpression = 'category = :category';
    queryParams.ExpressionAttributeValues = { ':category': category };
  } else {
    // Default scan with filters
    queryParams = {
      TableName: process.env.TABLE_NAME,
      Limit: parseInt(limit)
    };
  }
  
  try {
    let result;
    if (queryParams.IndexName) {
      result = await dynamodb.query(queryParams).promise();
    } else {
      result = await dynamodb.scan(queryParams).promise();
    }
    
    // Filter by date if provided
    let items = result.Items || [];
    if (startDate || endDate) {
      items = items.filter(item => {
        const itemDate = new Date(item.timestamp);
        if (startDate && itemDate < new Date(startDate)) return false;
        if (endDate && itemDate > new Date(endDate)) return false;
        return true;
      });
    }
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        reports: items,
        count: items.length
      })
    };
    
  } catch (error) {
    console.error('DynamoDB Error:', error);
    throw error;
  }
}

async function getDocumentUrl(reportId) {
  try {
    // Get report from DynamoDB
    const result = await dynamodb.get({
      TableName: process.env.TABLE_NAME,
      Key: { report_id: reportId }
    }).promise();
    
    const report = result.Item;
    if (!report || !report.doc_path) {
      return {
        statusCode: 410,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ error: 'Document not available' })
      };
    }
    
    // Generate presigned URL
    const url = await s3.getSignedUrlPromise('getObject', {
      Bucket: process.env.DOCS_BUCKET,
      Key: report.doc_path,
      Expires: 900 // 15 minutes
    });
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ url })
    };
    
  } catch (error) {
    console.error('Document Error:', error);
    throw error;
  }
}
