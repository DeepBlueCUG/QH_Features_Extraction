// 提取多光谱特征
// v1.0.0
// 刘鑫凯
// 2018.10.31

exports.extract_multispectral_characters = function(ndvi_harmonic, landsat, sentinel_2){
  
  return ndvi_harmonic
//    .addBands(landsat.select('B1').reduce(ee.Reducer.median()))
    .addBands(landsat.select('B2').reduce(ee.Reducer.median()).rename('Blue'))
    .addBands(landsat.select('B3').reduce(ee.Reducer.median()).rename('Green'))
    .addBands(landsat.select('B4').reduce(ee.Reducer.median()).rename('Red'))
    .addBands(sentinel_2.select('B5').reduce(ee.Reducer.median()).rename('Red_Edge'))
    .addBands(landsat.select('B5').reduce(ee.Reducer.median()).rename('NIR'))
    .addBands(landsat.select('B6').reduce(ee.Reducer.median()).rename('SWIR1'))
    .addBands(landsat.select('B7').reduce(ee.Reducer.median()).rename('SWIR2'));
};