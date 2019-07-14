// 提取雷达数据的后向散射系数特征并加入特征向量
// 刘鑫凯 
// v1.0.0
// 2018.11.3

// 预处理哨兵数据用于提取后向散射系数
// (1) 哨兵数据并不是在所有地区都提供全极化数据下载，例如HH极化就只有冰雪地区才有（https://gis.stackexchange.com/questions/298293/sentinel-1-hh-band-not-loading-in-google-earth-engine）
// (2) 卫星的轨道（升降轨）、 观测角等参数都会造成后向散射系数数据的异质性，这些参数也要统一

exports.prepocess_sentinel_1 = function(raw_sentinel_1, boundary, date){
  return raw_sentinel_1
    .filterBounds(boundary)
    .filterDate(date.get(0), date.get(1))
    // Filter to get images collected in interferometric wide swath mode.
    .filter(ee.Filter.eq('instrumentMode', 'IW'))
    // Filter to get images from different look angles.
    .filter(ee.Filter.eq('orbitProperties_pass', 'DESCENDING'))
} 






