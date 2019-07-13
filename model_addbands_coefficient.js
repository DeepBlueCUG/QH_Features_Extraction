// 给数据添加谐波分析的参数波段，并对系数进行解 算 
// v1.0.0
// 刘鑫凯 
// 2018.10.28

//The setup for fitting the model is to first add the harmonic variables (the third and fourth terms of equation 2) to the image collection.

// Use these independent variables in the harmonic regression.
exports.harmonicIndependents = ee.List(['constant', 't', 'cos1', 'sin1', 'cos2', 'sin2', 'cos3', 'sin3']);

// Add harmonic terms as new image bands.
exports.addbands = function(ndvi_date) {
  var timeRadians1 = ndvi_date.select('t').multiply(2 * Math.PI);//第一谐波
  var timeRadians2 = ndvi_date.select('t').multiply(2 * 2 * Math.PI);// 第二谐波
  var timeRadians3 = ndvi_date.select('t').multiply(2 * 3 * Math.PI);// 第二谐波 
  return ndvi_date
    .addBands(timeRadians1.cos().rename('cos1'))
    .addBands(timeRadians1.sin().rename('sin1'))
    .addBands(timeRadians2.cos().rename('cos2'))
    .addBands(timeRadians2.sin().rename('sin2'))
    .addBands(timeRadians3.cos().rename('cos3'))
    .addBands(timeRadians3.sin().rename('sin3'));
};

//Fit the model as with the linear trend, using the linearRegression() reducer:

// The output of the regression reduction is a 4x1 array image.
exports.regression = function(harmonicmodis, harmonicindependents, feature){
  return harmonicmodis
    .select(harmonicindependents.add(feature))
    .reduce(ee.Reducer.linearRegression(harmonicindependents.length(), 1));
}


//Plug the coefficients in to equation 2 in order to get a time series of fitted values:

// Turn the array image into a multi-band image of coefficients.
exports.get_coefficients = function(harmonicTrend, harmonicindependents, harmonicmodis){
  return harmonicTrend
    .select('coefficients')
    .arrayProject([0])
    .arrayFlatten([harmonicindependents]);
} 