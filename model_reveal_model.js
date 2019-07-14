// 显示模块,显示整个过程中各个阶段的计算结果
// v1.0.0
// 刘鑫凯
// 2018.10.28

// 显示研究区域的ndvi 
exports.plot_ndvi = function(ndvi, boundary){
 var visParam = {
        min: 0,
        max: 1,
        palette: ' FCD163, 99B718, 74A901, 66A000, 529400,' +
                 ' 004C00, 023B01, 012E01, 011D01, 011301'
    };
Map.centerObject(boundary); //显示作为显示中心 
Map.addLayer( ndvi, visParam, "原始NDVI图像"); 
};

// 显示拟合结果（图表形式）
exports.plot_harmonic = function(fittedHarmonic, roi, feature){
  // Plot the fitted model and the original data at the ROI.
  print(ui.Chart.image.series(
  // 这里记得改一下分辨率 
  fittedHarmonic.select(['fitted',feature]), roi, ee.Reducer.mean(), 30)
    .setSeriesNames([feature, 'fitted'])
    .setOptions({
//      title: plot_title,
      lineWidth: 1,
      pointSize: 3,
  }));
};

// 显示拟合结果（图表形式）
exports.plot_spectral = function(multispectral, roi){
  
   // Define customization options.
  var options = {
    //title: 'Landsat 8 TOA spectra at three points near Mexico City',
    hAxis: {title: 'band'},
    vAxis: {title: 'reflectance'},
    lineWidth: 1,
    pointSize: 4,
  };

  var wavelengths = [0.48, 0.56, 0.65, 0.70, 0.86, 1.61, 2.2];

  // Create the chart and set options.
  var spectraChart = ui.Chart.image.regions(
      multispectral, roi, ee.Reducer.mean(), 30, 'label', wavelengths)
          .setChartType('ScatterChart')
          .setOptions(options);
  print(spectraChart);
  
};
 





