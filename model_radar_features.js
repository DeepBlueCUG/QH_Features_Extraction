// 提取后向散射系数特征
// 刘鑫凯 
// v1.0.0
// 2018.11.3

exports.extract_radar_characters = function(characters_multispectral, sentinel){
  return characters_multispectral
    .addBands(sentinel.select('VV').reduce(ee.Reducer.median()))
    .addBands(sentinel.select('VH').reduce(ee.Reducer.median()))
};