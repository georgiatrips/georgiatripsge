const fs = require('fs');

async function getTours() {
  const url = 'https://firestore.googleapis.com/v1/projects/georgiatripsge/databases/(default)/documents/tours?pageSize=100';
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch tours: ${res.statusText}`);
  }
  const data = await res.json();
  const documents = data.documents || [];
  
  const parsed = documents.map(doc => {
    const fields = doc.fields || {};
    const id = doc.name.split('/').pop();
    
    const getVal = (fieldObj) => {
      if (!fieldObj) return null;
      if ('stringValue' in fieldObj) return fieldObj.stringValue;
      if ('booleanValue' in fieldObj) return fieldObj.booleanValue;
      if ('integerValue' in fieldObj) return parseInt(fieldObj.integerValue);
      if ('doubleValue' in fieldObj) return parseFloat(fieldObj.doubleValue);
      if ('timestampValue' in fieldObj) return fieldObj.timestampValue;
      if ('mapValue' in fieldObj) {
        const mapFields = fieldObj.mapValue.fields || {};
        const res = {};
        for (const k in mapFields) {
          res[k] = getVal(mapFields[k]);
        }
        return res;
      }
      if ('arrayValue' in fieldObj) {
        const values = fieldObj.arrayValue.values || [];
        return values.map(getVal);
      }
      return JSON.stringify(fieldObj);
    };

    return {
      id,
      title: getVal(fields.title),
      type: getVal(fields.type) || getVal(fields.tourType),
      category: getVal(fields.category),
      isBatumi: getVal(fields.isBatumi),
      img: getVal(fields.img),
      createdAt: getVal(fields.createdAt),
      updatedAt: getVal(fields.updatedAt)
    };
  });

  console.log('\n--- DETAILED TOURS LIST ---');
  parsed.forEach((t, i) => {
    console.log(`${i + 1}. [ID: ${t.id}] Title (KA): ${typeof t.title === 'object' ? t.title.ka : t.title}`);
    console.log(`   Type: ${t.type} | Category: ${t.category} | isBatumi: ${t.isBatumi}`);
    console.log(`   Created: ${t.createdAt} | Updated: ${t.updatedAt}`);
    console.log(`   Image URL: ${t.img}\n`);
  });
}

getTours().catch(err => {
  console.error('Error:', err);
});
