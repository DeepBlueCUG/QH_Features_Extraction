// 谐波分析处理函数，这次写成完整的函数形式 

  
// 这里将谐波分析改造成了函数以方便调用 
exports.harmonic_analysis = function(image, boundary, target){
  
  var timeField = 'system:time_start';

  // 选择roi所在的数据并添加时间波段   
  var filteredimage = image
    .filterBounds(boundary)
    // Use this function to add variables for timeseries, time and a constant
    // to imagery.
    .map(function(image) {
      // Compute time in fractional years since the epoch.
      var date = ee.Date(image.get(timeField));
      var years = date.difference(ee.Date('2018-01-01'), 'year');
      // Return the image with the added bands.
      return image
        // Add a time band.
        .addBands(ee.Image(years).rename('t').float())
        // Add a constant band.
        .addBands(ee.Image.constant(1));
  });
  
  //print('filteredsar', filteredsar);

  //The setup for fitting the model is to first add the harmonic variables (the third and fourth terms of equation 2) to the image collection.

  // Use these independent variables in the harmonic regression.
  var harmonicIndependents = ee.List(['constant', 't', 'cos1', 'sin1', 'cos2', 'sin2', 'cos3', 'sin3']);

  // Add harmonic terms as new image bands.
  var harmonicimage = filteredimage.map(function(image) {
    var timeRadians1 = image.select('t').multiply(2 * Math.PI);//第一谐波
    var timeRadians2 = image.select('t').multiply(2 * 2 * Math.PI);// 第二谐波
    var timeRadians3 = image.select('t').multiply(2 * 3 * Math.PI);// 第二谐波 
    return image
      .addBands(timeRadians1.cos().rename('cos1'))
      .addBands(timeRadians1.sin().rename('sin1'))
      .addBands(timeRadians2.cos().rename('cos2'))
      .addBands(timeRadians2.sin().rename('sin2'))
      .addBands(timeRadians3.cos().rename('cos3'))
      .addBands(timeRadians3.sin().rename('sin3'));
  });

  //Fit the model as with the linear trend, using the linearRegression() reducer:

  // The output of the regression reduction is a 4x1 array image.
  var harmonicTrend = harmonicimage
    .select(harmonicIndependents.add(target))
    .reduce(ee.Reducer.linearRegression(harmonicIndependents.length(), 1));

  //Plug the coefficients in to equation 2 in order to get a time series of fitted values:

  // Turn the array image into a multi-band image of coefficients.
  var harmonicTrendCoefficients = harmonicTrend.select('coefficients')
    .arrayProject([0])
    .arrayFlatten([harmonicIndependents]);

  //print('Tarmonic Trend Coefficients', harmonicTrendCoefficients);
  
  // 计算各个谐波的拟合值以备后面的绘制和分析,注意绘制各个谐波的时候应该不加常量t
  //  否则正余弦波形可能出现异常抬升 
  var harmonic1 = ee.List([ 'cos1', 'sin1']);
  var coefficients1 = harmonicTrendCoefficients.select(harmonic1);
  var harmonic2 = ee.List([ 'cos2', 'sin2']);
  var coefficients2 = harmonicTrendCoefficients.select(harmonic2);
  var harmonic3 = ee.List([ 'cos3', 'sin3']);
  var coefficients3 = harmonicTrendCoefficients.select(harmonic3);

  // Compute fitted values.
  var fittedHarmonic = harmonicimage.map(function(image) {
    // 计算最终的拟合值 
    return image
      .addBands(
        image.select(harmonicIndependents)
        .multiply(harmonicTrendCoefficients)
        .reduce('sum')
        .rename('fitted'))
      //  第一谐波拟合值的计算 
      .addBands(
        image.select(harmonic1)
          .multiply(coefficients1)
          .reduce('sum')
          .rename('harmonic1'))
      // 第二谐波拟合值 
      .addBands(
        image.select(harmonic2)
          .multiply(coefficients2)
          .reduce('sum')
          .rename('harmonic2'))
      // 第三谐波拟合值   
      .addBands(
        image.select(harmonic3)
          .multiply(coefficients3)
          .reduce('sum')
          .rename('harmonic3'));
    });

  //print('fittedHarmonic', fittedHarmonic);
    
  var phase1 = harmonicTrendCoefficients.select('cos1').atan2(
                harmonicTrendCoefficients.select('sin1')).rename('phase1').toFloat();

  var phase2 = harmonicTrendCoefficients.select('cos2').atan2(
                harmonicTrendCoefficients.select('sin2')).rename('phase2');
            
  var phase3 = harmonicTrendCoefficients.select('cos3').atan2(
                harmonicTrendCoefficients.select('sin3')).rename('phase2');
            
  var amplitude1 = harmonicTrendCoefficients.select('cos1').hypot(
                harmonicTrendCoefficients.select('sin1')).rename('amplitude2');
                
  var amplitude2 = harmonicTrendCoefficients.select('cos2').hypot(
                harmonicTrendCoefficients.select('sin2')).rename('amplitude2');
                
  var amplitude3 = harmonicTrendCoefficients.select('cos3').hypot(
                harmonicTrendCoefficients.select('sin3')).rename('amplitude2');

  /*
  // Use the HSV to RGB transform to display phase and amplitude
  var rgb1 = phase1.unitScale(-Math.PI, Math.PI).addBands(
            amplitude1.multiply(2.5)).addBands(
            ee.Image(1)).hsvToRgb();
          
  var rgb2 = phase2.unitScale(-Math.PI, Math.PI).addBands(
            amplitude2.multiply(2.5)).addBands(
            ee.Image(1)).hsvToRgb();
          
  var rgb3 = phase3.unitScale(-Math.PI, Math.PI).addBands(
            amplitude3.multiply(2.5)).addBands(
            ee.Image(1)).hsvToRgb();

  Map.addLayer(rgb1, {}, 'phase1 (hue), amplitude1 (saturation)');
  Map.addLayer(rgb2, {}, 'phase2 (hue), amplitude2 (saturation)');
  Map.addLayer(rgb3, {}, 'phase3 (hue), amplitude3 (saturation)');
  */
  
  var out = ee.Image(fittedHarmonic.select('fitted').reduce(ee.Reducer.max()).rename('peak'));

  return out
    .addBands(amplitude1.rename('trend'))
    .addBands(amplitude2.add(amplitude3).rename('fluctuate')) 
    .addBands(phase1.unitScale(-Math.PI, Math.PI).rename('phenology')) 
    .addBands(harmonicTrendCoefficients.select('constant').rename('mean'))
    .toFloat();
};


/*
// 输出计算结果，输出物候特征 
exports.extract_phenology_charcter = function(fitted_harmonic, harmonicTrendCoefficients){
  var phase1 = harmonicTrendCoefficients.select('cos1').atan2(
                harmonicTrendCoefficients.select('sin1')).rename('phase1').toFloat();

  var phase2 = harmonicTrendCoefficients.select('cos2').atan2(
                harmonicTrendCoefficients.select('sin2')).rename('phase2');
            
  var phase3 = harmonicTrendCoefficients.select('cos3').atan2(
                harmonicTrendCoefficients.select('sin3')).rename('phase2');
            
  var amplitude1 = harmonicTrendCoefficients.select('cos1').hypot(
                harmonicTrendCoefficients.select('sin1')).rename('amplitude2');
                
  var amplitude2 = harmonicTrendCoefficients.select('cos2').hypot(
                harmonicTrendCoefficients.select('sin2')).rename('amplitude2');
                
  var amplitude3 = harmonicTrendCoefficients.select('cos3').hypot(
                harmonicTrendCoefficients.select('sin3')).rename('amplitude2');
*/

  /*
  // Use the HSV to RGB transform to display phase and amplitude
  var rgb1 = phase1.unitScale(-Math.PI, Math.PI).addBands(
            amplitude1.multiply(2.5)).addBands(
            ee.Image(1)).hsvToRgb();
          
  var rgb2 = phase2.unitScale(-Math.PI, Math.PI).addBands(
            amplitude2.multiply(2.5)).addBands(
            ee.Image(1)).hsvToRgb();
          
  var rgb3 = phase3.unitScale(-Math.PI, Math.PI).addBands(
            amplitude3.multiply(2.5)).addBands(
            ee.Image(1)).hsvToRgb();

  Map.addLayer(rgb1, {}, 'phase1 (hue), amplitude1 (saturation)');
  Map.addLayer(rgb2, {}, 'phase2 (hue), amplitude2 (saturation)');
  Map.addLayer(rgb3, {}, 'phase3 (hue), amplitude3 (saturation)');
  */
  
/*
  var out = ee.Image(fitted_harmonic.select('fitted').reduce(ee.Reducer.max()).rename('peak'));

  return out
    .addBands(amplitude1.rename('trend'))
    .addBands(amplitude2.add(amplitude3).rename('fluctuate')) 
    .addBands(phase1.unitScale(-Math.PI, Math.PI).rename('phenology')) 
    .addBands(harmonicTrendCoefficients.select('constant').rename('mean'))
    .toFloat();
                
};
*/