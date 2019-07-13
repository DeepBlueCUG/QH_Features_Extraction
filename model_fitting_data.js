// 数据结合以及谐波分解
// v1.0.0
// 刘鑫凯 
// 2018.10.28

// 计算各个谐波的拟合值以备后面的绘制和分析,注意绘制各个谐波的时候应该不加常量t
  //  否则正余弦波形可能出现异常抬升 

// Compute fitted values.
exports.fittedHarmonic = function(harmonicmodis, harmonicTrendCoefficients, harmonicIndependents) {
// 计算最终的拟合值 
  var harmonic1 = ee.List([ 'cos1', 'sin1']);
  var coefficients1 = harmonicTrendCoefficients.select(harmonic1);
  var harmonic2 = ee.List([ 'cos2', 'sin2']);
  var coefficients2 = harmonicTrendCoefficients.select(harmonic2);
  var harmonic3 = ee.List([ 'cos3', 'sin3']);
  var coefficients3 = harmonicTrendCoefficients.select(harmonic3);
  
  return harmonicmodis
    .addBands(
      harmonicmodis.select(harmonicIndependents)
        .multiply(harmonicTrendCoefficients)
        .reduce('sum')
        .rename('fitted'))
    //  第一谐波拟合值的计算 
    .addBands(
      harmonicmodis.select(harmonic1)
        .multiply(coefficients1)
        .reduce('sum')
        .rename('harmonic1'))
    // 第二谐波拟合值 
    .addBands(
      harmonicmodis.select(harmonic2)
        .multiply(coefficients2)
        .reduce('sum')
        .rename('harmonic2'))
    // 第三谐波拟合值   
    .addBands(
      harmonicmodis.select(harmonic3)
        .multiply(coefficients3)
        .reduce('sum')
        .rename('harmonic3'));
};