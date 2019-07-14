
// 物候特征提取的预处理模块,为谐波分析准备数据  
// 刘鑫凯 
// V1.0.0
// 2018.10.27

//  选定所需数据 
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

// 给数据添加常量和时间波段 
exports.timeField = 'system:time_start';

exports.addVariables = function(image, timeField) {
  // Compute time in fractional years since the epoch.
  var date = ee.Date(image.get(timeField));
  var years = date.difference(ee.Date('2016-01-01'), 'year');
  // Return the image with the added bands.
  return image
    // Add a time band.
    .addBands(ee.Image(years).rename('t').float())
    // Add a constant band.
    .addBands(ee.Image.constant(1));
};