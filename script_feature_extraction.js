var raw_ndvi = ee.ImageCollection("MODIS/006/MOD13Q1"),
    cn_shape = ee.FeatureCollection("users/rsliuxk/CN"),
    raw_landsat = ee.ImageCollection("LANDSAT/LC08/C01/T1_SR"),
    raw_sentinel_1 = ee.ImageCollection("COPERNICUS/S1_GRD"),
    raw_sentinel_2 = ee.ImageCollection("COPERNICUS/S2");
	
//15号为了绘制论文中的时序分析图做了一些小改动  
//3月12 日的更新使用了新的雷达数据特征提取方法，改成最开始的按照时间间隔进行特征提取      
//9 号的更新主要是针对整体归一化爆内存的情况，因此这里分不同特征进行归一化并输出 
//   这个版本更新了后向散射系数的使用方法，同样使用谐波分析的方法从后向散射系数中提取物候信息   
// v3.0.0
// 刘鑫凯 
// 2019.3.9


// 装入模块
var data_prepocess = require('users/rsliuxk/Agrors_Classify:model_harmonic_preprocessing');
var harmonic_analysis = require('users/rsliuxk/Agrors_Classify:model_harmonic_analysis');

var phenology_prepocess = require('users/rsliuxk/Agrors_Classify:model_phenology_prepocessing'); // NDVI预处理模块
var multispectral_prepocess = require('users/rsliuxk/Agrors_Classify:model_multispectral_prepocessing'); // Landsat预处理模块
var radar_prepocess = require('users/rsliuxk/Agrors_Classify:model_radar_prepocessing'); //  哨兵数据预处理模块
var reveal = require('users/rsliuxk/Agrors_Classify:model_reveal_model'); // 可视化模块 
var coefficient = require('users/rsliuxk/Agrors_Classify:model_addbands_coefficient'); // 添加系数波段模块
var fitting = require('users/rsliuxk/Agrors_Classify:model_fitting_data'); // 添加数据拟合模块
var phenology_characters = require('users/rsliuxk/Agrors_Classify:model_phenology_features'); // 添加提取物候特征波段模块
var multispectral_characters = require('users/rsliuxk/Agrors_Classify:model_multispectral_features'); // 添加提取多光谱波段模块
var radar_characters = require('users/rsliuxk/Agrors_Classify:model_radar_features'); // 添加提取后向散射系数特征波段模块
var postprocess = require('users/rsliuxk/Agrors_Classify:model_postpocessing'); // 添加后处理模块 

//********************
// 准备数据
//********************

var date = ee.List(['2018-03-01', '2018-10-31']);


// 选定研究区所在的矢量,处理和筛选NDVI数据**********


var boundary = ee.FeatureCollection(cn_shape). 
  filter(ee.Filter.inList('State_Name',['Qinghai']));

// 选择物候特征提取所需要的原始数据  
var filtered_ndvi = data_prepocess.fliter_ndvi(raw_ndvi, boundary, date);
  
//print('filtered_ndvi', filtered_ndvi);

//MODIS数据的NDVI值还需要除10000,  
var ndvi = filtered_ndvi.map(function(image){
  return phenology_prepocess.prepocess_ndvi(image, boundary);
});

// 显示预处理的数据 
reveal.plot_ndvi(ndvi, boundary);


//*********************


// 预处理landsat数据用于生成多光谱特征

var filtered_landsat = multispectral_prepocess.filter_multispectral(raw_landsat, boundary, date);

var landsat = filtered_landsat.map(function(image){
  return multispectral_prepocess.prepocess_landsat(image, boundary);
});




//  预处理哨兵2数据用于生成红边波段

var filtered_sentinel_2 = multispectral_prepocess.filter_sentinel_2(raw_sentinel_2, boundary, date);

var sentinel_2 = filtered_sentinel_2.map(function(image){
  return multispectral_prepocess.prepocess_sentinel_2(image, boundary);
});


//********************



//********************


// 预处理哨兵数据用于提取后向散射系数


// 预处理哨兵数据用于提取后向散射系数
// (1) 哨兵数据并不是在所有地区都提供全极化数据下载，例如HH极化就只有冰雪地区才有（https://gis.stackexchange.com/questions/298293/sentinel-1-hh-band-not-loading-in-google-earth-engine）
// (2) 卫星的轨道（升降轨）、 观测角等参数都会造成后向散射系数数据的异质性，这些参数也要统一   


var flitered_sentinel_1 = data_prepocess.prepocess_sentinel_1(raw_sentinel_1, boundary, date);

//  裁剪雷达数据 
var sentinel_1 = flitered_sentinel_1.map(function(image){
  return image.clip(boundary);
});


// ********************
// 提取不同类型数据的特征 
// ********************


//**********  对物候特征进行拟合和计算**********

print('sentinel_1', sentinel_1); // 不同的年份极化方式不一样（不知为啥），稳妥起见先检查一下

var sar_vh = sentinel_1.select('VH');
var sar_vv = sentinel_1.select('VV');
var ndvi_harmonic = harmonic_analysis.harmonic_analysis(ndvi, boundary, 'NDVI');
var vv_harmonic = harmonic_analysis.harmonic_analysis(sar_vv, boundary, 'VV');
var vh_harmonic = harmonic_analysis.harmonic_analysis(sar_vh, boundary, 'VH');

//print('ndvi_harmonic', ndvi_harmonic);

//********************


// 提取特征
//Although any coefficients can be mapped directly, it is useful and interesting to map the phase and amplitude of the estimated harmonic model.  First, compute phase and amplitude from the coefficients, then map:

//  添加SAR特征  

// 时间间隔提取特征

/*
var sar_character_extraction = function(sar_data, date){
  var target_date = ee.List(date);
  return sar_data
    //.select(polar)
    .filterDate(target_date.get(0), target_date.get(1))
    .reduce(ee.Reducer.median());
} ;


var character_sar = ndvi_harmonic
  .addBands(sar_character_extraction(sentinel_1,['2018-03-01', '2018-04-30'], 'VV').rename('VV_34'))
  .addBands(sar_character_extraction(sentinel_1,['2018-05-01', '2018-06-30'], 'VV').rename('VV_56'))
  .addBands(sar_character_extraction(sentinel_1,['2018-07-01', '2018-08-31'], 'VV').rename('VV_78'))
  .addBands(sar_character_extraction(sentinel_1,['2018-09-01', '2018-10-30'], 'VV').rename('VV_910'))
  .addBands(sar_character_extraction(sentinel_1,['2018-03-01', '2018-04-30'], 'VH').rename('VH_34'))
  .addBands(sar_character_extraction(sentinel_1,['2018-05-01', '2018-06-30'], 'VH').rename('VH_56'))
  .addBands(sar_character_extraction(sentinel_1,['2018-07-01', '2018-08-31'], 'VH').rename('VH_78'))
  .addBands(sar_character_extraction(sentinel_1,['2018-09-01', '2018-10-30'], 'VH').rename('VH_910'));
*/

/*
var character_sar = ee.Image(sar_character_extraction(sentinel_1,['2018-03-01', '2018-05-31']))
  .addBands(sar_character_extraction(sentinel_1,['2018-06-01', '2018-08-31']))
  .addBands(sar_character_extraction(sentinel_1,['2018-09-01', '2018-10-31']));
  //.addBands(sar_character_extraction(sentinel_1,['2018-03-01', '2018-05-31'], 'VH').rename('VH_345'))
  //.addBands(sar_character_extraction(sentinel_1,['2018-06-01', '2018-08-31'], 'VH').rename('VH_678'))
  //.addBands(sar_character_extraction(sentinel_1,['2018-09-01', '2018-10-31'], 'VH').rename('VH_910'))

/*  
var character_sar = ee.Image(sar_character_extraction(sentinel_1,['2018-03-01', '2018-03-31'], 'VV').rename('VV_3'))
  .addBands(sar_character_extraction(sentinel_1,['2018-04-01', '2018-04-30'], 'VV').rename('VV_4'))
  .addBands(sar_character_extraction(sentinel_1,['2018-05-01', '2018-05-31'], 'VV').rename('VV_5'))
  .addBands(sar_character_extraction(sentinel_1,['2018-06-01', '2018-06-30'], 'VV').rename('VV_6'))
  .addBands(sar_character_extraction(sentinel_1,['2018-07-01', '2018-07-31'], 'VV').rename('VV_7'))
  .addBands(sar_character_extraction(sentinel_1,['2018-08-01', '2018-08-31'], 'VV').rename('VV_8'))
  .addBands(sar_character_extraction(sentinel_1,['2018-09-01', '2018-09-30'], 'VV').rename('VV_9'))
  .addBands(sar_character_extraction(sentinel_1,['2018-10-01', '2018-10-31'], 'VV').rename('VV_10'))
  .addBands(sar_character_extraction(sentinel_1,['2018-03-01', '2018-03-31'], 'VH').rename('VH_3'))
  .addBands(sar_character_extraction(sentinel_1,['2018-04-01', '2018-04-30'], 'VH').rename('VH_4'))
  .addBands(sar_character_extraction(sentinel_1,['2018-05-01', '2018-05-31'], 'VH').rename('VH_5'))
  .addBands(sar_character_extraction(sentinel_1,['2018-06-01', '2018-06-30'], 'VH').rename('VH_6'))
  .addBands(sar_character_extraction(sentinel_1,['2018-07-01', '2018-07-31'], 'VH').rename('VH_7'))
  .addBands(sar_character_extraction(sentinel_1,['2018-08-01', '2018-08-31'], 'VH').rename('VH_8'))
  .addBands(sar_character_extraction(sentinel_1,['2018-09-01', '2018-09-30'], 'VH').rename('VH_9'))
  .addBands(sar_character_extraction(sentinel_1,['2018-10-01', '2018-10-31'], 'VH').rename('VH_10'));
  */


 //谐波分析提取特征 
var character_harmonic = ndvi_harmonic
  .addBands(vv_harmonic.select('peak').rename('vv_peak'))
  .addBands(vv_harmonic.select('trend').rename('vv_trend'))
  .addBands(vv_harmonic.select('fluctuate').rename('vv_fluctuate'))
  .addBands(vv_harmonic.select('phenology').rename('vv_phenology'))
  .addBands(vv_harmonic.select('mean').rename('vv_mean'))
  .addBands(vh_harmonic.select('peak').rename('vh_peak'))
  .addBands(vh_harmonic.select('trend').rename('vh_trend'))
  .addBands(vh_harmonic.select('fluctuate').rename('vh_fluctuate'))
  .addBands(vh_harmonic.select('phenology').rename('vh_phenology'))
  .addBands(vh_harmonic.select('mean').rename('vh_mean'));



/*
var sar_harmonic = ee.Image(vv_harmonic.select('peak').rename('vv_peak'))
  .addBands(vv_harmonic.select('trend').rename('vv_trend'))
  .addBands(vv_harmonic.select('fluctuate').rename('vv_fluctuate'))
  .addBands(vv_harmonic.select('phenology').rename('vv_phenology'))
  .addBands(vv_harmonic.select('mean').rename('vv_mean'))
  .addBands(vh_harmonic.select('peak').rename('vh_peak'))
  .addBands(vh_harmonic.select('trend').rename('vh_trend'))
  .addBands(vh_harmonic.select('fluctuate').rename('vh_fluctuate'))
  .addBands(vh_harmonic.select('phenology').rename('vh_phenology'))
  .addBands(vh_harmonic.select('mean').rename('vh_mean'));
*/
  
//print('character_harmonic', character_harmonic);


// 提取多光谱特征,包括红边波段 
var characters_multispectral = multispectral_characters.extract_multispectral_characters(character_harmonic, landsat, sentinel_2);

print('landsat', landsat);

// 提取后向散射系数特征，形成完整的分类特征数据
var characters = radar_characters.extract_radar_characters(characters_multispectral, sentinel_1);

print('characters', characters);


//var post_characters = postprocess.normalize(characters, boundary);

//print('post_characters', post_characters);


// 数据输出

Export.image.toAsset({
  image: ndvi_harmonic,
  description: 'qh_feature_ndvi_0327',
  assetId: 'QH/qh_feature_ndvi_0327',
  scale: 30,
  region: boundary,
  maxPixels: 1.5e9
});

//Map.addLayer( characters.select('vv_trend'), {}, "characters");



/*
//print('characters', characters);
//print('red_edge', characters.select('red_edge'));

var visParam = {
        min: 0,
        max: 1,
        palette: ' FCD163, 99B718, 74A901, 66A000, 529400,' +
                 ' 004C00, 023B01, 012E01, 011D01, 011301'
};
//Map.centerObject(boundary); //显示作为显示中心 
Map.addLayer( characters.select('red_edge'), visParam, "red_edge"); 


var  post_characters = postprocess.normalize(characters, boundary);

print('post_chatacters', post_characters);

*/



//********************
//  建立建立点击事件，基本逻辑是在点击事件中执行谐波分析处理   
//********************


// 建立点击事件，选择roi点
Map.style().set('cursor','crosshair');//设置地图样式，鼠标样式为十字型
var panel = ui.Panel({style:{width:'400px'}}).add(ui.Label('点击地图影像'));// 创建panel以存放charts
ui.root.add(panel);//将panel加到地图上

// 建立地图点击事件
Map.onClick(function(coords) {
  panel.clear();//清除画布panel
  var roi = ee.Geometry.Point(coords.lon, coords.lat);


  // Plot the fitted model and the original data at the ROI.
  reveal.plot_chart(fitted_harmonic, roi);

}); // 这个是onclick事件的结尾 








