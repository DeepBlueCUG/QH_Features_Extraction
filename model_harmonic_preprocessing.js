// NDVI数据和SAR数据都要进行谐波分析，这个模块进行预处理

//ndvi数据的预处理 
// Use these bands for prediction.
exports.fliter_ndvi = function(raw_ndvi, boundary, date){
  return raw_ndvi
    .filterBounds(boundary)
    .filterDate(date.get(0), date.get(1))
    .select('NDVI');
};

//对MODIS的NDVI产品数据进行预处理，像元值乘0.00001
exports.prepocess_ndvi = function(filtered_ndvi,  boundary){ // 需要输入原始数据和选定的研究区向量  
  var temp = filtered_ndvi.select('NDVI').multiply(0.0001);
  return filtered_ndvi
    .addBands(temp, ['NDVI'], true)
    .clip(boundary);
//    .set(temp);
};

//SAR数据的预处理流程  
exports.prepocess_sentinel_1 = function(raw_sentinel_1, boundary, date){
  return raw_sentinel_1
    .filterBounds(boundary)
    .filterDate(date.get(0), date.get(1))
    // Filter to get images collected in interferometric wide swath mode.
    .filter(ee.Filter.eq('instrumentMode', 'IW'))
    // Filter to get images from different look angles.
    .filter(ee.Filter.eq('orbitProperties_pass', 'DESCENDING'));
//    .clip(boundary);
};