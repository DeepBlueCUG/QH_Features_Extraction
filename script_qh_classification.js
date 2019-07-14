// 青海作物分类脚本 
var cn_shape = ee.FeatureCollection("users/rsliuxk/CN"),
    raw_ndvi = ee.ImageCollection("MODIS/006/MOD13Q1"),
    raw_landsat = ee.ImageCollection("LANDSAT/LC08/C01/T1_SR"),
    raw_sentinel = ee.ImageCollection("COPERNICUS/S1_GRD");
    
var point = ee.Geometry.Point([101.7503, 36.8736]);
var crops_distribution = ee.Image("USGS/GFSAD1000_V0");
var fields = ee.ImageCollection("users/benkelou/fields");
var polygons = ee.FeatureCollection("users/benkelou/SOW/SAMPLE/Qinhai_crop_sample")
var boundary = cn_shape.filter(ee.Filter.inList('State_Name',['Qinghai']));    
//var post_characters = ee.Image('users/benkelou/SOW/IMAGE/post_characters2018');

var qinghai_outline = ee.Image().byte().paint({
  featureCollection: boundary,
  color: 1,
  width: 2
});

Map.addLayer(qinghai_outline, {palette: 'FF0000'}, 'qinghai_outline');
Map.centerObject(boundary,6.5);
//Map.centerObject(point,11)
//Use these bands for prediction.
var bands = ['peak','trend', 'fluctuate', 'phenology', 'mean',
             'vv_peak','vv_trend','vv_fluctuate','vv_phenology','vv_mean',
             'vh_peak','vh_trend','vh_fluctuate','vh_phenology','vh_mean',
             'Blue','Green','Red','Red_Edge' , 'NIR', 'SWIR1','SWIR2',
             
            //'VV_median','VH_median',             
             ];
/*var bands = [//'b1','b2','b3','b4','b5',
            //'b6','b7','b8','b9','b10','b11','b12',
            //'b13','b14','b15',
              'b16','b17','b18','b19','b20','b21','b22'
               // ,'b23','b24'
               ]  */          
//******************
//1 加载分类对象  image
//2 加载全国农田数据,并进行筛选和裁剪 crop_field
//3 制作农田掩摸 crop_mask
//4 对原始影像进行掩摸处理 composite
//5 对掩摸处理后的影像进行随机分成两部分
//**************************

var ndvi = ee.Image("users/rsliuxk/QH/qh_feature_0323_ndvi_normalize"),
    feature = ee.Image("users/rsliuxk/QH/qh_feature_0322_normalize");
    
var post_characters = ndvi
  .addBands(feature.select('vv_peak'))
  .addBands(feature.select('vv_trend'))
  .addBands(feature.select('vv_fluctuate'))
  .addBands(feature.select('vv_phenology'))
  .addBands(feature.select('vv_mean'))
  .addBands(feature.select('vh_peak'))
  .addBands(feature.select('vh_trend'))
  .addBands(feature.select('vh_fluctuate'))
  .addBands(feature.select('vh_phenology'))
  .addBands(feature.select('vh_mean'))
  .addBands(feature.select('Blue'))
  .addBands(feature.select('Green'))
  .addBands(feature.select('Red'))
  .addBands(feature.select('Red_Edge'))
  .addBands(feature.select('NIR'))
  .addBands(feature.select('SWIR1'))
  .addBands(feature.select('SWIR2'))
  .addBands(feature.select('VV_median'))
  .addBands(feature.select('VH_median'));

//var post_characters = ee.Image("users/rsliuxk/QH/qh_feature_0322_normalize");
var org_images = post_characters.select(bands);    
print(org_images);
var crop_field = fields.filterBounds(boundary).mosaic().clipToCollection(boundary).select('b1').eq(2);
                                           
var crop_mask = crops_distribution.select('landcover').eq(2)
                .or(crops_distribution.select('landcover').eq(4))
                .or(crops_distribution.select('landcover').eq(6))
                .or(crops_distribution.select('landcover').eq(7))
                .or(crops_distribution.select('landcover').eq(8))
                .or(crops_distribution.select('landcover').eq(1))
                .or(crops_distribution.select('landcover').eq(3))
                .or(crops_distribution.select('landcover').eq(5))
                .clip(boundary); 

var composite = org_images.mask(crop_field).mask(crop_mask.mask(crop_field).select('landcover').eq(1))           
Map.addLayer(composite,{},'composite')
Map.addLayer(crop_mask,{},'crop_mask')
Map.addLayer(crop_field,{},'crop_field')
//******************************************
// 'class_label ' 存储类别信息,先去掉1105玉米
//******************************************
var class_label = ee.List([1103,1104,/*1105,*/1107,1108,1112,1113,1120,1202,1800,1700,1901,4000,     9000,9001,9002,    6000,0])
/*var polygons2 = ee.FeatureCollection('users/benkelou/SHP/Qinhai_crop_sample')
                                    .filter(ee.Filter.inList('class',[1105]))
                                    .map(function(fea){
                                      return fea.set('class',ee.Number(2))
                                      });
var polygons3 = ee.FeatureCollection('users/benkelou/SHP/Qinhai_crop_sample')
                                    .filter(ee.Filter.inList('class',[1202]))
                                    .map(function(fea){
                                      return fea.set('class',ee.Number(3))
                                      });*/
//var polygons = polygons1.merge(polygons2).merge(polygons3);*/

//********************
//获取polygons对应的值
//********************

var training = composite.sampleRegions({
  collection: polygons,
  properties: ['class'],
  scale: 30
});
//*************************************************
//对training随机分成两部分，一部分训练，一部分验证
//*************************************************
var split = 0.7;
var trainingPartition = training.filter(ee.Filter.inList('class',[1105]))
                                .randomColumn('random')
                                .filter(ee.Filter.lt('random', split));
var testingPartition = training.filter(ee.Filter.inList('class',[1105]))
                               .randomColumn('random')
                               .filter(ee.Filter.gte('random', split));
var i = 0;
for(i ;i < 17;i++){
    var select = training.filter(ee.Filter.inList('class',[class_label.get(i)]));
    var withRandom = select.randomColumn('random');
    var one_trainingPartition = withRandom.filter(ee.Filter.lt('random', split));
    var one_testingPartition = withRandom.filter(ee.Filter.gte('random', split));  
    trainingPartition = trainingPartition.merge(one_trainingPartition);
    testingPartition = testingPartition.merge(one_testingPartition);
    
}
//**********************************************************
//2018年 分成5类，玉米(1105),小麦（1103,1104），青稞（1107）油菜（1202），其他
//**********************************************************
trainingPartition = trainingPartition.remap([1105,1103,1104,/*1107,*/ 1202 ,
                                          // 玉米 小麦 小麦   油菜
                                             4000,1108,9000,9001,1120,1800,1700,6000,1107,  1112,2000,0,9002],
                                             [0,    1 ,  1,   2,   3,   3, 3,  3,3,3,3,3,3,3,3,3,3], 'class');
testingPartition = testingPartition.remap([1105,1103,1104,/*1107,*/1202,  
                                           4000,1108,9000,9001,1120,1800,1700,6000, 1107, 1112,2000, 0,9002],
                                           [0,1,1,2,3,   3, 3,  3,3,3,3,3,3,3,3,3,3], 'class');  
var cart_trained = ee.Classifier.cart().train(trainingPartition, 'class', bands);

var cart_classified = composite.select(bands).classify(cart_trained);
var cart_validated = testingPartition.classify(cart_trained);
print(cart_classified)
var palette =['blue','green', 'yellow', 'red','black']
Map.addLayer(cart_classified, {min: 0, max:4, palette:palette},'cart_classification');

//*************
//面积统计
//**************

//**************************
//cart
//1 训练集的混淆矩阵
//2 训练集的精度评定
//3 训练集的kappa系数
//
//4 测试集的误差矩阵
//5 测试集的进度评定
//6 测试集的Kappa系数
//****************************
// var cart_trained_confusionMatrix = cart_trained.confusionMatrix();
// var cart_trained_confusionMatrix_Accuracy = cart_trained_confusionMatrix.accuracy();
// var cart_trained_confusionMatrix_Kappa = cart_trained_confusionMatrix.kappa();

var cart_test_errorMatrix = cart_validated.errorMatrix('class', 'classification');
var cart_test_errorMatrix_Accuracy = cart_test_errorMatrix.accuracy();
var cart_test_errorMatrix_Kappa = cart_test_errorMatrix.kappa();


// print('cart训练集的混淆矩阵：',cart_trained_confusionMatrix);
// print('cart训练集的精度：',cart_trained_confusionMatrix_Accuracy);
// print('cart训练集的Kappa系数：',cart_trained_confusionMatrix_Kappa);

print('cart测试集的误差矩阵：',cart_test_errorMatrix);
print('cart测试集的精度：',cart_test_errorMatrix_Accuracy);
print('cart测试集的Kappa系数：',cart_test_errorMatrix_Kappa);
var matrix_sum = ee.Array(cart_test_errorMatrix.array())
              .reduce({reducer:ee.Reducer.sum(),axes:[0]}).reduce({reducer:ee.Reducer.sum(),axes:[1]}).get([0,0])
var matrix_new = cart_test_errorMatrix.array().divide(ee.Number(matrix_sum)).multiply(ee.Number(100))

print('混淆矩阵百分比',matrix_new)


