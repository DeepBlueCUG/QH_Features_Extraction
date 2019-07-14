// 对Landsat8数据进行裁剪、去云等预处理，为后面提取特征做准备
// 对于更新过的1.1.0般来说，由于多波段数据改用了Landsat的地表反射率数据，
//这里的去云算法使用了G.E.E推荐的Landsat反射率数据的去云算法        
// v1.1.1
// 刘鑫凯
// 2018.10.31

/*
exports.prepocess_landsat = function(image, boundary){
  var landsat_bands = ee.List(['B1', 'B2', 'B3', 'B4', 'B5', 'B6', 'B7']);
  var quality = image.select('BQA');
  var cloud01 = quality.eq(61440);
  var cloud02 = quality.eq(53248);
  var cloud03 = quality.eq(28672);
  var mask = cloud01.or(cloud02).or(cloud03).not();
  return image.updateMask(mask)
    .clip(boundary)
    .select(landsat_bands);
}
*/

// 选定所需的预处理数据
exports.filter_multispectral = function(raw_landsat, boundary, date){
  return raw_landsat
    .filterBounds(boundary)
    .filterDate(date.get(0), date.get(1))
}


// This example demonstrates the use of the pixel QA band to mask
// clouds in surface reflectance (SR) data.  It is suitable
// for use with any of the Landsat SR datasets.

// Function to cloud mask from the pixel_qa band of Landsat 8 SR data.
exports.prepocess_landsat = function(filtered_landsat, boundary){
  // Bits 3 and 5 are cloud shadow and cloud, respectively.
  var cloudShadowBitMask = 1 << 3;
  var cloudsBitMask = 1 << 5;

  // Get the pixel QA band.
  var qa = filtered_landsat.select('pixel_qa');

  // Both flags should be set to zero, indicating clear conditions.
  var mask = qa.bitwiseAnd(cloudShadowBitMask).eq(0)
      .and(qa.bitwiseAnd(cloudsBitMask).eq(0));

  // Return the masked image, scaled to TOA reflectance, without the QA bands.
  return filtered_landsat.updateMask(mask).divide(10000)
      .select("B[0-7]*")
//      .copyProperties(image, ["system:time_start"])
      .clip(boundary);
}
                  

exports.filter_sentinel_2 = function(sentinel_2, boundary, date){
  return sentinel_2
    .filterBounds(boundary)
    .filterDate(date.get(0), date.get(1))
}


exports.prepocess_sentinel_2 = function(sentinel_2, boundary){
  var qa = sentinel_2.select('QA60');

  // Bits 10 and 11 are clouds and cirrus, respectively.
  var cloudBitMask = 1 << 10;
  var cirrusBitMask = 1 << 11;

  // Both flags should be set to zero, indicating clear conditions.
  var mask = qa.bitwiseAnd(cloudBitMask).eq(0)
      .and(qa.bitwiseAnd(cirrusBitMask).eq(0));

  return sentinel_2.updateMask(mask).divide(10000).clip(boundary);
}