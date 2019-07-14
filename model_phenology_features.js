
//   新版的特征提取模块，添加了返回值并可返回完整的物候特征 
// v1.1.0
// 刘鑫凯
// 2018.10.28

  //Although any coefficients can be mapped directly, it is useful and interesting to map the phase and amplitude of the estimated harmonic model.  First, compute phase and amplitude from the coefficients, then map:

  // Compute phase and amplitude.
  
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
  
  var out = ee.Image(fitted_harmonic.select('fitted').reduce(ee.Reducer.max()).rename('peak'));

  return out
    .addBands(amplitude1.rename('trend'))
    .addBands(amplitude2.add(amplitude3).rename('fluctuate')) 
    .addBands(phase1.unitScale(-Math.PI, Math.PI).rename('phenology')) 
    .addBands(harmonicTrendCoefficients.select('constant').rename('mean'))
    .toFloat();
                
};



