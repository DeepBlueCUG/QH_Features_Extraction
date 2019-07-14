// 特征波段的后处理，对于数值范围在0到1范围内的数据进行过滤去除噪声，
// 范围超过0到1的数据进行归一化
// 刘鑫凯
// v1.0.0
// 2018.11.5

exports.normalize = function(characters, boundary){
  var mean = characters.reduceRegion({
    reducer: ee.Reducer.mean(),
    geometry: boundary,
    scale: 30,
    bestEffort: true,
    maxPixels: 1.5e9
  });
  
  var stddev = characters.reduceRegion({
    reducer: ee.Reducer.stdDev(),
    geometry: boundary,
    scale: 30,
    bestEffort: true,
    maxPixels: 1.5e9
  });
  
  /*
  print('characters', characters);
  print('mean', mean);
  print('stddev', stddev);
  */
  
  // Get information about the bands as a list.
  var bandnames = characters.bandNames();
//  print(bandnames, 'bandnames');

  var compute = function(list_mean, list_std, bandname){
    var temp = characters
      .select(ee.List([bandname]))
      .subtract(ee.Number(mean.get(bandname)))
      .divide(ee.Number(stddev.get(bandname)));
    return temp;
  };
  
  var normalize = compute(mean, stddev, bandnames.get(0)).rename(ee.List([bandnames.get(0)]));
  
  return normalize
    .addBands(compute(mean, stddev, bandnames.get(1)).rename(ee.List([bandnames.get(1)])))
    .addBands(compute(mean, stddev, bandnames.get(2)).rename(ee.List([bandnames.get(2)])))
    .addBands(compute(mean, stddev, bandnames.get(3)).rename(ee.List([bandnames.get(3)])))
    .addBands(compute(mean, stddev, bandnames.get(4)).rename(ee.List([bandnames.get(4)])))
    .addBands(compute(mean, stddev, bandnames.get(5)).rename(ee.List([bandnames.get(5)])))
    .addBands(compute(mean, stddev, bandnames.get(6)).rename(ee.List([bandnames.get(6)])))
    .addBands(compute(mean, stddev, bandnames.get(7)).rename(ee.List([bandnames.get(7)])))
    .addBands(compute(mean, stddev, bandnames.get(8)).rename(ee.List([bandnames.get(8)])))
    .addBands(compute(mean, stddev, bandnames.get(9)).rename(ee.List([bandnames.get(9)])))
    .addBands(compute(mean, stddev, bandnames.get(10)).rename(ee.List([bandnames.get(10)])))
    .addBands(compute(mean, stddev, bandnames.get(11)).rename(ee.List([bandnames.get(11)])))
    .addBands(compute(mean, stddev, bandnames.get(12)).rename(ee.List([bandnames.get(12)])))
    .addBands(compute(mean, stddev, bandnames.get(13)).rename(ee.List([bandnames.get(13)])))
    .addBands(compute(mean, stddev, bandnames.get(14)).rename(ee.List([bandnames.get(14)])))
    .addBands(compute(mean, stddev, bandnames.get(15)).rename(ee.List([bandnames.get(15)])))
    .addBands(compute(mean, stddev, bandnames.get(16)).rename(ee.List([bandnames.get(16)])))
    .addBands(compute(mean, stddev, bandnames.get(17)).rename(ee.List([bandnames.get(17)])))
    .addBands(compute(mean, stddev, bandnames.get(18)).rename(ee.List([bandnames.get(18)])))
    .addBands(compute(mean, stddev, bandnames.get(19)).rename(ee.List([bandnames.get(19)])))
    .addBands(compute(mean, stddev, bandnames.get(20)).rename(ee.List([bandnames.get(20)])))
    .addBands(compute(mean, stddev, bandnames.get(21)).rename(ee.List([bandnames.get(21)])))
    .addBands(compute(mean, stddev, bandnames.get(22)).rename(ee.List([bandnames.get(22)])))
    .addBands(compute(mean, stddev, bandnames.get(23)).rename(ee.List([bandnames.get(23)])));
}

    

