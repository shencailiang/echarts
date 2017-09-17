;(function(echarts, window) {
	/**
	   多维图表构造器
	*/
	function MulDimensionChart(dom, data, dimension, measure) {
		this.finalData = data;
		this.chart = echarts.init(dom);
		this.properties = {
			dimension: dimension,
		    measure: measure
		};
		this.dom = dom;
		this.colors = ["#4cc5f4", "#fa5879", "#f8e402", "#4feaef", "#9d58fa", "#5899fa", "#58fa6b", "#fa6b58"];
		this.init();
	}
	MulDimensionChart.prototype = {
		constructor: MulDimensionChart,
		init: function () {
			this.getChartOption();
			this.createChart();
		},
		getWidth: function () {
			return this.dom.style.width.replace('px', '');
		},
		getHeight: function () {
			return this.dom.style.height.replace('px', '');
		},
		/**
		    建立echart多维图表
		*/
		createChart: function () {
			var optionData = this.optionData;
			var option = {
				color:this.colors,
				grid:optionData.gridData,
				tooltip: {
					trigger: 'item'
				},
				legend: {
					show: true,
					orient: 'vertical',
					data: optionData.legendData,
					right: 0,
					top: 60,
					formatter: function (name) {
						return echarts.format.truncateText(name, 80, '14px Microsoft Yahei', '…');
					},
					tooltip:{
						show: true
					}
				},
				calculable: true,
				singleAxis: optionData.singleAxisData,
				xAxis:optionData.xAxisData,
				yAxis: optionData.yAxisData,
				series: optionData.seriesData
			};
			if(optionData.formatter){
				option.tooltip.formatter = optionData.formatter;
			}				
			this.chart.setOption(option);			
		},
		/**
		   获取图表的option配置项 
		*/
		getChartOption: function () {
			var that = this;
			var state = that.properties.state;
			var measure = that.properties.measure;
			var dimension = that.properties.dimension;
			var dLen = dimension.length;
			var mLen = measure.length;
			var visualMLen = mLen === 0 ? 1 : mLen;
			var chart = this.chart;
			var color = this.colors;
			var finalData = that.finalData;
			var legendData = mLen > 0 && measure.map(function(item) {
					return item.alias;
				});
			var continuousKey = that.getContinueKey(dimension, mLen);
			var isContinue = continuousKey.length > 0;
			var categoryData = that.standarHigherData(finalData, measure, dimension);
			var percentData = that.getPercentData(categoryData.chartLabelData, continuousKey.length > 0);
			var chartData = categoryData.chartData;
			var peakValue = categoryData.peakValue;
			//图表到左边的距离
			var LEFT_DISTANCE = mLen === 0 ? 10 : 60;
			var sum = categoryData.chartLabelData[0] && categoryData.chartLabelData[0].sum;
			var showClassNum = categoryData.chartLabelData.length;
			//图表grid到图表最上面的距离
			var TOP_DISTANCE = 28;
			//图表grid的x轴label所占的高度
			var AXIS_LABEL_HEIGHT = 50;
			var RIGHT_DISTANCE = 100;
			var realChartWidth = this.getWidth() - LEFT_DISTANCE - RIGHT_DISTANCE;
			var realChartHeight = this.getHeight() - (showClassNum == 0 ? 14 : TOP_DISTANCE * showClassNum) - (visualMLen - 1 ) * 10 - AXIS_LABEL_HEIGHT;
			//图表grid的x轴label所占的高度
			var perChartWidth = realChartWidth / (isContinue ? chartData.length : sum);
			var xAxisData = [], yAxisData = [], gridData = [], seriesData = [], singleAxisData = [];
			var xAxisObj, gridObj, yAxisObj, seriesObj, singleAxisObj;
			var perGridHeight = realChartHeight / visualMLen, gridWidth = 0;
			var gridIndex = 0, left = LEFT_DISTANCE;
			var category = that.preprocessCategory(percentData, realChartWidth, continuousKey, chartData);
			var categoryIndex = category.categoryIndex;
			var disContinuousKey = that.getDisGroupItem(dLen, continuousKey);
			var formatter = that.curry(that.processTooltipFormatter, dimension, measure, disContinuousKey);		

			for (var j = 0; j < visualMLen; j++) {
				left = LEFT_DISTANCE;
				for (var i = 0, dataItem ; i < chartData.length; i++) {
					 dataItem = chartData[i];
					 gridWidth = isContinue ? perChartWidth : dataItem.count * perChartWidth;
					 if (i >= 1) {
						 if (isContinue) {
							 left += perChartWidth;
						 } else {
							 left += chartData[i - 1].count * perChartWidth;
						 }
					 }
					 gridObj = {
						 width: gridWidth,
						 height: perGridHeight,
						 left: left,
						 top: (showClassNum  == 0 ? 14 : TOP_DISTANCE * showClassNum) + (j * perGridHeight + ((j > 0) &&  j * 10))
					 };
					 xAxisObj = that.getXAxisOption({
						 type: dataItem.type,
						 mLen: mLen,
						 measureIndex: j,
						 axisPeak: dataItem.xAxisPeak,
						 realTimeFormat: dataItem.realTimeFormat,
						 timeFormat: dataItem.timeFormat,
						 axisLabel: dataItem.axisLabel,
						 categoryIndex: categoryIndex,
						 gridIndex: gridIndex,
						 gridWidth: gridWidth,
						 continueIndex: dataItem.continueIndex,					
						 minInterval: dataItem.minInterval,
						 labelData: dataItem.axisLabelData,
						 index: i,
						 dimension:dimension
					 });
					 yAxisObj = that.getYAxisOption({
						 index: i,
						 mLen: mLen,
						 context:  that,
						 measure: measure,					
						 peakValue: peakValue,
						 gridIndex: gridIndex,
						 measureIndex: j
					 });
					 seriesObj = that.getSeriesOption({
						 gridIndex: gridIndex,
						 measureIndex: j,
						 context:  that,
						 measure: measure,
						 xAxisType: dataItem.type,
						 xAxisKeyName: dataItem.xAxisKeyName,
						 xAxisKey: dataItem.xAxisKey,
						 state: state,						
						 realTimeFormat: dataItem.realTimeFormat,
						 dateFormat: dataItem.dateFormat,
						 perChartWidth: perChartWidth,
						 barWidth: '20%',
						 color: color,
						 data: dataItem.data[j]
					 });
					 xAxisData.push(xAxisObj);
					 yAxisData.push(yAxisObj);
					 gridData.push(gridObj);
					 seriesData.push(seriesObj);
					 gridIndex++;
				}
			}
			var labelFormatWidth = [];
			//处理坐标轴上下的label名称显示
			for (i = 0; i < percentData.length; i++) {
				labelFormatWidth[i] = realChartWidth / percentData[i].label.length - 10;
				labelFormatWidth[i] = labelFormatWidth[i] <= 26 ? 26 : labelFormatWidth[i];
				singleAxisObj = that.getSingleAxisOption({
					index: i,
					mLen: mLen,
					realChartWidth: realChartWidth,
					realChartHeight: realChartHeight,
					distance: {
						topDistance: TOP_DISTANCE,
						rightDistance: RIGHT_DISTANCE,
						axisLabelHeight: AXIS_LABEL_HEIGHT,
						leftDistance: mLen === 0 ? 10 : LEFT_DISTANCE
					},
					labelFormatWidth: labelFormatWidth,
					percentData: percentData,
					labelData: category.category
				});
				singleAxisData.push(singleAxisObj);
				seriesObj = that.getSingSeriesOption({index: i});
				seriesData.push(seriesObj);
			}
			that.optionData = {
				xAxisData: xAxisData,
				yAxisData: yAxisData,
				gridData: gridData,
				formatter: formatter,
				legendData: legendData,
				singleAxisData: singleAxisData,
				seriesData: seriesData
			};
		},	
        /**
	  	 * 获取维度数组内连续的keys
	  	 * @param {Array} dimension：维度信息数组
	  	 * @return {Array} continuousIndexs：连续维度信息数组
	  	 */
	  	getContinueKey: function(dimension, mLen) {
	  		var continuousIndexs = [];
	  	    //获取连续的序号
			for (var i = 0; i < dimension.length; i++) {
			    if (dimension[i].continuity == '11') {
				    continuousIndexs.push(i);
				}
			}
			mLen == 0 && (continuousIndexs.length = 0);
			return continuousIndexs;
	  	},
		/**
		    将数据进行分组,以'\&%#@'分割数据
			@param {Array} data: 需要分组的源数据
			@param {Number} dLen: 维度的个数
			@param {Number} mLen: 度量的个数
			@param {Array} groupDimenIndex: 需要分组的维度序号:[0, 1, 2]
			@return {Array} groupData: 分组后的数据
		*/
        groupByData: function(data, dLen, mLen, groupDimenIndex) {
		    var inGroupIndex = getDisGroupItem(dLen, groupDimenIndex);
			var SPLIT_STR = '\&%#@';
			var key;
			var map = {};
			var dataItem;
			var groupDataMap = {};

			if (groupDimenIndex.length < 2) {
				return data;
			}
		    for (var i = 0; i < groupDimenIndex.length; i++) {
			    for (var j = 0 ; j < data.length; j++) {
				    dataItem = data[j];
				    key = getItemKey(dataItem, dLen, groupDimenIndex[i], inGroupIndex, SPLIT_STR);
					if (map[key]) {
					    map[key] = sumMeasureItem(map[key], dataItem.slice(dLen, dLen + mLen));
					} else {
					    map[key] = dataItem.slice(dLen, dLen + mLen);
					}
				}
				groupDataMap[groupDimenIndex[i]] = map;
				map = {};
			}
			return setMapToArray(groupDataMap);
			/**
			   map的数据转为数据
			   @param {Object} map
			   @return 返回处理后的map
			*/
			function setMapToArray(map) {
			    var dimension = [];
				for (var prop in map) {
				    if (map.hasOwnProperty(prop)) {
					    for (var name in map[prop]) {
						    if (map[prop].hasOwnProperty(name)) {
							    dimension.push(name.split(SPLIT_STR).concat(map[prop][name]));
							}
						}
						map[prop] = dimension;
						dimension = [];
					}
				}
			    return map;
			}
			/**
			 用于累加各个度量值
			 @param {Array} curSum: 当前累加值
			 @param {Array} addMeasure: 需要累加的度量值
	         @return {Array} sum: 累加后的值
			*/
			function sumMeasureItem(curSum, addMeasure) {
			   var sum = [];
			   for (var i = 0; i < curSum.length; i++) {
			       sum.push(Number(curSum[i]) + Number(addMeasure[i]));
			   }
			   return sum;
			}
			/**
			     获取分组的key值
				 @param {Array} item：分组的单条数据
				 @param {Number} groupDimenValue:分组字段的序号
				 @param {Array} inGroupIndex：无需分组的序号
				 @return {String} key: 分组的key值
			*/
			function getItemKey(item, dLen, groupDimenValue, inGroupIndex, SPLIT_STR) {
			    var key ;
				var keyIndex = inGroupIndex.concat([groupDimenValue]);
				for (var i = 0; i < dLen; i++) {
				    if (keyIndex.indexOf(i) > -1) {
					   key = key == null ? item[i] : (key + SPLIT_STR + item[i]);
					}
				}
				return key;
			}
			/**
			   获取无需分组的字段序号
			   @param {Number} dLen: 维度的个数
			   @param {Array} groupDimenIndex: 需要分组的维度序号:[0, 1, 2]
			   @return {Array} disGroupIndex: 无需分组的序号
			*/
			function getDisGroupItem(dLen, groupDimenIndex) {
			    var disGroupIndex = [];
			    for (var i = 0; i < dLen; i++) {
				    if (groupDimenIndex.indexOf(i) == -1) {
					    disGroupIndex.push(i);
					}
				}
				return disGroupIndex;
			}
		},
		/**
		    将数据按度量进行分组
			@param {Array} data: 需要分组的源数据
			@param {Number} dLen: 维度的个数
			@param {Number} mLen: 度量的个数
			@return {Array} newData:返回分组后的数据
		*/
		adjustDataOrder: function(data, dLen, mLen) {
		    var newData = [], min, max, measureValue;
			var peakValue = [];
			var visMLen = mLen == 0 ? 1 : mLen;
			var FIXED_VALUE = 10;

			for (var i = 0; i < visMLen; i++) {
			    min = Number(data[0][dLen + i]) || 0;
				max = Number(data[0][dLen + i]) || 0;
				newData[i] = data.map(function (dataItem) {
					var newDataItem = [];
					var len = dataItem.length;
					measureValue = mLen === 0 ? FIXED_VALUE : (Number(dataItem[dLen + i]) || 0);
					//匹配数据的最大值和最小值
					min = measureValue < min ? measureValue : min;
					max = measureValue > max ? measureValue : max;
					newDataItem.push(dataItem[dLen - 1]);
					newDataItem.push(measureValue);
					len = len - visMLen - 1;
					while (len) {
					    newDataItem.push(dataItem[len - 1]);
						len --;
					}
					return newDataItem;
				});
				(mLen === 0) && (max = 2 * FIXED_VALUE);
				peakValue[i] = {
				    min: min,
					max: max
				};
			}
		    return {
			    data: newData,
				peakValue: peakValue
			};
		},
		/**
		   获取图表显示需要的数据，分为坐标轴的series数据和label显示数据
			@param {Array} data: 需要分组的源数据
			@param {Number} dLen: 维度的个数
			@param {Number} mLen: 度量的个数
			@param {Boolean} isContinue: 连续还是离散
			@param {Number} maxClassNum: 最大类别数目
			@return {Object} chartData属性：图表series数据,chartLabelData属性: 图表分类label显示的数据
		*/
		getDimensionCategory: function(data, dLen, mLen, isContinue) {
			var chartData = [];
			var subTypeData = [];
			var axisLabelData = [];
			var chartLabelData = [];
			var that = this;
			var preDataItem, curDataItem, curCompareItem, preCompareItem, count = 0, sum = 0;
			chartData = [];
			curDataItem = data[0];
			count = 1;
			preDataItem = curDataItem;
			subTypeData.push(curDataItem);
			axisLabelData.push(curDataItem[dLen - 1]);
			preCompareItem = curDataItem.slice(0, dLen - 1);
			//求出图表分类数据
			if (data.length >= 2) {
				for (var j = 1; j < data.length; j++) {
					curDataItem = data[j];
					curCompareItem =  curDataItem.slice(0, dLen - 1);
					//判断前后两条数据是否为一类
					if (curCompareItem.every(function (value, index) {
						return value === preCompareItem[index];
					})) {
						count++;
						subTypeData.push(curDataItem);
						axisLabelData.push(curDataItem[dLen - 1]);
					} else {
						subTypeData = addData(chartData, preCompareItem, count, dLen - 2, subTypeData, axisLabelData);
						preCompareItem = curCompareItem;
						subTypeData.push(curDataItem);
						axisLabelData = [];
						axisLabelData.push(curDataItem[dLen - 1]);
						count = 1;
					}
				}
				subTypeData = addData(chartData, preCompareItem, count, dLen - 2, subTypeData, axisLabelData);
			} else {
				subTypeData = addData(chartData, preCompareItem, count, dLen - 2, subTypeData, axisLabelData);
			}
			if (dLen >= 2) {
				chartLabelData[dLen - 2] = {
					labelData:  chartData.map(function (dataItem) {
						sum += dataItem.count;
						return {
							count: dataItem.count,
							labelName: dataItem.labelName,
							dimensionData: dataItem.dimensionData
						};
					}),
					sum: sum
				};
			}
			if (dLen >= 3) {
				for (var i = dLen - 3; i >= 0; i-- ) {
					chartLabelData[i] = getDimensionLabel(chartLabelData[i + 1].labelData, dLen, (i + 1), isContinue);
				}
			}
			peakValue = processMeasureData(chartData, dLen, mLen);
			return {
				chartData: chartData,
				chartLabelData: chartLabelData,
				peakValue: peakValue
			};
			//添加数据
			function addData(data, preCompareItem, count, labelIndex, subTypeData, axisLabelData) {
				data.push({
					labelName: preCompareItem[labelIndex],
					count: count,
					data: subTypeData,
					axisLabelData: axisLabelData,
					dimensionData: preCompareItem
				});
				subTypeData = [];
				return subTypeData;
			}
			/**
			   获取每一个维度需要显示的label
			*/
			function getDimensionLabel (data, dLen, dimenIndex, isContinue) {
				var dimensionLabelData = [], sum = 0;
				var preDataItem, curDataItem, curCompareItem, preCompareItem, count;
				var countIndex = dLen - 2;
				curDataItem = data[0];
				preDataItem = curDataItem;
				preCompareItem = curDataItem.dimensionData.slice(0, dimenIndex);
				count = curDataItem.count;
				sum += count;
				(dimenIndex == countIndex) && isContinue && (count = 1);
				//求出图表分类数据
				if (data.length >= 2) {
					for (var j = 1; j < data.length; j++) {
						curDataItem = data[j];
						curCompareItem =  curDataItem.dimensionData.slice(0, dimenIndex);
						//判断前后两条数据是否为一类
						if (curCompareItem.every(function (value, index) {
							return value === preCompareItem[index];
						})) {
							((dimenIndex == countIndex) && isContinue) ? (count++) : (count += curDataItem.count);
						} else {
							addData(dimensionLabelData, preCompareItem, count, dimenIndex - 1);
							preCompareItem = curCompareItem;
							count = ((dimenIndex == countIndex) && isContinue) ? 1 : curDataItem.count;
						}
						sum += curDataItem.count;
					}
					addData(dimensionLabelData, preCompareItem, count, dimenIndex - 1);
				} else {
					addData(dimensionLabelData, preCompareItem, count, dimenIndex - 1);
				}
				return {
					labelData: dimensionLabelData,
					sum: sum
				};
			}
			/**
			   按照度量个数，对数据进行分组,并求出各度量的最大值的最小值
			   @param {Array} data: 需要分组的源数据
			   @param {Number} dLen: 维度的个数
			   @param {Number} mLen: 度量的个数
			   @return {Array} peakValue：返回存储各度量最大值和最小值的数组
			*/
			function processMeasureData(data, dLen, mLen) {
				var processData, max, min, peakValue;
				var visualMLen = mLen === 0 ? 1 : mLen;
				peakValue = [];
				for(var i = 0; i < data.length; i++) {
					processData = that.adjustDataOrder(data[i].data, dLen, mLen);
					data[i].data = processData.data;
					if (i == 0) {
						for (var j = 0; j < visualMLen; j++) {
							peakValue[j] = {};
							peakValue[j].min = processData.peakValue[j].min;
							peakValue[j].max = processData.peakValue[j].max;
						}
					} else {
						for (var j = 0; j < visualMLen; j++) {
							if (processData.peakValue[j].min < peakValue[j].min) {
								peakValue[j].min = processData.peakValue[j].min;
							}
							if (processData.peakValue[j].max > peakValue[j].max) {
								peakValue[j].max = processData.peakValue[j].max;
							}
						}
					}
				}
				return peakValue;
			}
		},
		/**
		   用于多维数据，获取各个维度上label的名称和位于轴上的比率
		   @param {Array} chartLabelData: 各个维度上的label数据
		   @param {Boolean} isContinue: 是连续还是离散
		   @return {Array} categoryLabel: 返回处理后的label数据
		*/
		getPercentData: function(chartLabelData, isContinue) {
			var categoryLabel = [];
			var sum = 0, labelArray, percentArray, areaArray;
			var curSum = 0, curBit = 0;
			var curBitArray = [];
			//分类数目
			var classNum = chartLabelData.length;
			for (var i = 0; i < classNum; i++) {
				sum = isContinue ? chartLabelData[classNum - 1].labelData.length : chartLabelData[i].sum;
				curSum = 0;
				categoryLabel[i] = {};
				labelArray = categoryLabel[i].label = [];
				percentArray = categoryLabel[i].line = [];
				curBitArray = categoryLabel[i].percent = [];
				areaArray = categoryLabel[i].area = [];
				//求出每一个类别子项的显示位置的值
				for(var j = 0, dataItem; j < chartLabelData[i].labelData.length; j++) {
					 dataItem = chartLabelData[i].labelData[j];
					 if (isContinue && i == (classNum - 1)) {
						curSum = j + 1;
					 } else {
						curSum += dataItem.count;
					 }
					 labelArray.push((dataItem.labelName + '').replace(/\r\n/g, ' '));
					 percentArray.push(curSum / sum);
				 }
				 curBitArray[0] = percentArray[0] / 2;
				 areaArray[0] = percentArray[0];
				 for ( j = 1; j < percentArray.length; j++) {
					 areaArray.push(percentArray[j] - percentArray[j-1]);
					 curBitArray.push(percentArray[j - 1] + (percentArray[j] - percentArray[j - 1]) / 2);
				 }
			}
			return categoryLabel;
		},
        /**
		 * 用于规整高维数据，处理连续和离散情况下数据的内容和格式
		 *@param {Array} data: 需要分组的源数据
		 *@param {Array} measure: 包含度量信息的数组
		 *@param {Array} dimension: 包含维度信息的数据
		 */
		standarHigherData: function (data, measure, dimension) {
			var that = this, axisIndex;
			var continuousIndexs = [], groupedCategoryData = {};
			var dLen = dimension.length;
			var mLen = measure.length;
			var yAxisPeak = [], chartData = [], initChartData ;
			//获取连续的序号
			continuousIndexs = this.getContinueKey(dimension, mLen);
			//是否有连续型数据
			var isContinue = continuousIndexs.length > 0;
			//得到分组数据
			var groupData = this.groupByData(data, dLen, mLen, continuousIndexs);
			//最后一个维度连续
			if (continuousIndexs.length <= 1) {
				groupedCategoryData[dLen - 1] = {};
				groupedCategoryData[dLen - 1].data = that.getDimensionCategory(groupData, dLen, mLen, isContinue);
				(continuousIndexs.length && mLen) && (groupedCategoryData[dLen - 1].xAxisPeak = getDimensionPeak(groupedCategoryData[dLen - 1].data.chartData, dimension, dLen - 1, that));
			//多个维度连续
			} else {
				for (var i = 0; i < continuousIndexs.length; i++) {
					var continuousItem = continuousIndexs[i];
					groupedCategoryData[continuousItem] = {};
					groupedCategoryData[continuousItem].data = that.getDimensionCategory(groupData[continuousItem], dLen - continuousIndexs.length + 1, mLen, isContinue);
					groupedCategoryData[continuousItem].xAxisPeak = getDimensionPeak(groupedCategoryData[continuousItem].data.chartData, dimension, continuousItem, that);
					var curYAxisPeakData = groupedCategoryData[continuousItem].data.peakValue;
					if (i == 0) {
						yAxisPeak = curYAxisPeakData;
					} else {
						for (var j = 0; j < mLen; j++) {
							if (curYAxisPeakData[j].min < yAxisPeak[j].min) {
								yAxisPeak[j].min = curYAxisPeakData[j].min;
							}
							if (curYAxisPeakData[j].max > yAxisPeak[j].max) {
								yAxisPeak[j].max = curYAxisPeakData[j].max;
							}
						}
					}
				}
			}
			//一个连续维度或者无连续维度
			if (continuousIndexs.length <= 1) {
				initChartData = groupedCategoryData[dLen - 1].data.chartData;
				for (var i = 0; i < initChartData.length; i++) {
					addAxisDataItem(groupedCategoryData, dimension, chartData, dLen - 1, i, that);
				}
				groupedCategoryData[dLen - 1].data.chartData = chartData;
				axisIndex = dLen - 1;
			//多个维度连续
			} else {
				initChartData = groupedCategoryData[continuousIndexs[0]].data.chartData;
				for (var i = 0, index; i < initChartData.length; i++) {
					for (var j = 0; j < continuousIndexs.length; j++) {
						index = continuousIndexs[j];
						addAxisDataItem(groupedCategoryData, dimension, chartData, index, i, that);
					}
				}
				groupedCategoryData[continuousIndexs[0]].data.chartData = chartData;
				groupedCategoryData[continuousIndexs[0]].data.peakValue = yAxisPeak;
				axisIndex = continuousIndexs[0];
			}
			return groupedCategoryData[axisIndex].data;
			/**
			 * 每个数据项添加轴数据
			 * @param groupedCategoryData
			 * @param dimension
			 * @param chartData
			 */
			function addAxisDataItem(groupedCategoryData, dimension, chartData, index, dataIndex, context) {
				var gridData = {};
				var xAxisData = {};
				var key = dimension[index];
				var mLen = context.properties.measure.length;
				context.updateAxis('xAxis', xAxisData, key, null, 50);
				gridData = groupedCategoryData[index].data.chartData[dataIndex];
				echarts.util.merge(gridData, xAxisData);
				// ?! 量词对其后没有紧接着":"的"mm"字符串进行搜索
				gridData.realTimeFormat = gridData.realTimeFormat && gridData.realTimeFormat.replace(/m{2}(?!:)/g, 'MM');
				mLen == 0 && (gridData.type = 'category');
				gridData.xAxisKeyName = key.alias;
				gridData.xAxisKey = key.key;
				gridData.continueIndex = index;
				gridData.xAxisPeak = groupedCategoryData[index].xAxisPeak || null;
				chartData.push(gridData);
			}
			/**
			   当轴连续的情况下，求出维度的最大值和最小值
			   @param {Array} chartData:图表x轴维度数据
			   @return {Object} 包含最大值和最小值的数组
			*/
			function getDimensionPeak(chartData, dimension, index, context) {
				var totalData = [];
				var xAxisData = {};
				var key = dimension[index];
				context.updateAxis('xAxis', xAxisData, key);
				dateFormat = key.timeFormat || key.colType;
				if (xAxisData.type == 'category') {
					return;
				} else if (xAxisData.type == 'time') {
					for (var i = 0; i < chartData.length; i++) {
						totalData = totalData.concat(chartData[i].axisLabelData.map(function (item) {
							item = (item === null || item == '' || item == 'null') ? '1970-01-01 00:00:00' : context.processTimeItem(dateFormat, item);
							return new Date(item).getTime();
						}));
					}
				} else {
					for (var i = 0; i < chartData.length; i++) {
						totalData = totalData.concat(chartData[i].axisLabelData.map(function(item) {
							return ((item === null || item == '' || item == 'null') ? 0 : item);
						}));
					}
				}
				var min = Math.min.apply(Array, totalData);
				var max = Math.max.apply(Array, totalData);
				return {
					min: min,
					max: max
				};
			}
		},
        updateAxis: function (axisModel, axis, key, chartType, contentWidth) {
			var dLen = this.properties.dimension.length;
			if (key) {
				var realContinue = key.continuity ? parseInt(key.continuity.substr(0, 1)) : 0;
				var timeFormat = '';
				//是连续还是离散
				if (judgeContinue(realContinue, dLen, key, chartType) ) {
					if (parseInt(key.continuity.substr(1, 1))) {
						if (key.timeFormat || key.colType === 'datetime' || key.colType === 'date' || key.colType === 'time' || key.colType === 'timestamp' || key.colType === 'year') {
							//添加时间格式
							axis.dateFormat = key.timeFormat || key.colType;
							if (key.timeFormat) {
								timeFormat = key.timeFormat.replace(/m{2}(?!:)/g, 'MM') ;
							} else {
								timeFormat = ((key.colType === 'year') && 'yyyy') || ((key.colType === 'date') && 'yyyy-MM-dd') || ((key.colType === 'time') && 'hh:mm:ss')  || ((key.colType === 'datetime' || key.colType === 'timestamp') && 'yyyy-MM-dd hh:mm:ss') ;
							}
							axis.type = 'time';
						} else {
							axis.type = 'value';
						}
					} else {
						axis.type = 'category';
					}
				}
			}
			this.addSpecialEvent ({
				axisModel: axisModel,
				axis: axis,
				timeFormat: timeFormat,
				colType: key && key.colType,
				contentWidth: contentWidth
			});
			return axis;
			/**
			 * 判断能够连续和离散
			 */
			function judgeContinue(realContinue, dLen, keyItem, chartType) {
				if (realContinue || keyItem.key == '__count') {
					if (/waterfall|Stackbar/i.test(chartType) && dLen == 1) {
						return false;
					}
					return true;
				}
			}
		},	
		/**
		 * 处理轴的属性
		 * @param {String} is xAxis or yAxis
		 * @param {Object} axis
		 * @param {String} timeFormat
		 */
		addSpecialEvent: function (params) {
			var axisModel = params.axisModel, axis = params.axis, timeFormat = params.timeFormat,
			colType = params.colType, contentWidth = params.contentWidth, isDimension = params.isDimension;
			var rotate = axisModel == 'xAxis' ? 45 : 0;
			var isXAxis = axisModel == 'xAxis';
			if (axis.type == 'category') {
				axis.axisLabel = {
					interval: axis.data && this.dealLabelInterval(axis.data, axisModel),
					rotate: rotate,
					formatter: function (name) {
						return echarts.format.truncateText(name, contentWidth || 80, '12px Microsoft Yahei', '…');
					},
					tooltip: {
						show: true
					}
				}
			} else if (axis.type == 'time') {
				axis.realTimeFormat = timeFormat;
				axis.rotate = rotate;
				axis.min = 'dataMin';
				axis.max = 'dataMax';
				axis.isDimension = isXAxis ? true : false;
				axis.tickMax = isXAxis ? true : false;
				axis.timeFormat = getTimeType(timeFormat);
				axis.axisLabel = {
					formatter:  this.updateLabelFormatter('time', timeFormat, contentWidth),
					tooltip: {
						show: true,
						formatter: function (value, index) {
							if (timeFormat) {
								var date = new Date(value.name);
								return date.Format(timeFormat);
							} else {
								return value.name;
							}
						}
					}
				};
			} else if (axis.type == 'value') {
				axis.rotate = rotate;
				axis.min = isXAxis ? 'dataMin' : null;
				axis.max = isXAxis ? 'dataMax' : null;
				axis.tickMax = isXAxis ? true : false;
				axis.isDimension = isXAxis ? true : false;
				axis.minInterval = isXAxis && setInteger(colType) ? 1 : null;
				axis.scale = isXAxis ? true : false;
				axis.axisLabel = {
					formatter:  this.updateLabelFormatter('value'),
					margin: 10,
					tooltip: {
						show: true
					}
				};
			}
			axis.silent = false;
			axis.triggerEvent = true;
			return this;
			/**
			 * 设置刻度显示为整数
			 */
			function setInteger(colType) {
				if (/(tinyint)|(mediumint)|(integer)|(bigint)|(int)/.test(colType)) {
					return true;
				}
			}
			/**
			 * 获取timeFormat对应的时间类型
			 * @param {String} timeFormat
			 * @return  {String} type: month、year、second
			 */
			function getTimeType(timeFormat) {
				var type = null;
				if (timeFormat == 'hh:mm:ss') {
					type = 'second';
				} else if (timeFormat == 'yyyy') {
					type = 'year';
				} else if (timeFormat == 'yyyy/MM' || timeFormat == 'yyyyMM' || timeFormat == 'yyyy-MM') {
					type = 'month';
				} else if (/(yyyy\-MM\-dd)|(yyyy\/MM\/dd)|(dd\/MM\/yyyy)|(yyyyMMdd)/i.test(timeFormat)) {
					type = 'day';
				}
				return type;
			}
		},	
        /**
		 *  Todo update axis infomation for continuity
		 * @param {Object} axis
		 * @param {Object} key
		 */
		updateLabelFormatter: function (type, timeFormat, contentWidth) {
			if (type == 'time') {
				return function (value, index) {
					var date = new Date(value);
					return echarts.format.truncateText(date.Format(timeFormat), contentWidth || 80, '12px Microsoft Yahei', '…');
				};
			} else if (type == 'value') {
				return function (value, index) {
					if(Math.abs(value) >= 1.0e+5){
						var p = Math.floor(Math.log(Math.abs(value)) / Math.LN10);
						var n = value * Math.pow(10, -p);
						n = String(n).substr(0, 3);
						return n + 'e+' + p;
					} else {
						return value;
					}
				};
			}
		},
		/**
		 *  Todo update axis infomation for continuity
		 *  设置提示悬浮层内容格式
		 * @param {Object} axis
		 */
		updateTooltipFormatter: function (type) {
			var that = this;

			if (type != 'category') {
				var dimension = this.properties.dimension;
				var colType = dimension[0].colType;
				var timeFormat,getTimeFormater = dimension[0].timeFormat;

				if (
					['yyyymmdd','dd/mm/yyyy','yyyymm','yyyy-mm-dd','yyyy-mm-dd hh:mm:ss'].indexOf(getTimeFormater) >=0 ||
					colType == 'time'
				) {
					if (getTimeFormater) {
						timeFormat = getTimeFormater.replace(/m{2}(?!:)/g, 'MM');
					} else {
						timeFormat = 'hh:mm:ss';
					}
				}
				return function (item) {

					var str = '', itemField , itemHead , itemValue;
					var xystate = that.properties.xystate;
					item = echarts.util.isArray(item) ? item[0] : item;
				
					if (timeFormat) {
						itemField = item.seriesName;
						itemHead = new Date(xystate == 'normal' ? item.data[0] : item.data[1]).Format(timeFormat);
						itemValue = xystate == 'normal' ? item.data[1] : item.data[0];
					} else {
						itemField = item.seriesName;						
						itemHead = item.name || item.data[0];
						itemValue = item.data[1];
					}				
					str += itemField + '<br/>';
					str += '<span style="display:inline-block;margin-right:5px;border-radius:10px;width:9px;height:9px;background-color:' + item.color + '"></span>'+ itemHead +'：' + itemValue;
					return str;
				};
			}
			return '';
		},
        /** 设置x轴的配置项
		    @param {Object} params: 初始化参数
		*/
        getXAxisOption: function(params) {
		    var mLen = params.mLen;
			var measureIndex = params.measureIndex;
			var index = params.index;
			var axisPeak= params.axisPeak;
			var axisLabel = params.axisLabel;
			var labelData = params.labelData;
			var type = params.type;
			type == null && (type = 'category');
			if ((!axisLabel && type == 'category') || mLen === 0) {
				axisLabel = {
					formatter: function (name) {
						return echarts.format.truncateText(name, 50, '12px Microsoft Yahei', '…');
					},
					tooltip: {
	    				show: true
	    			}
				};
			}
		    var xAxisObj = {
				type: type,
				splitLine: {
					show: false,
					hideMaxLine: true,
					hideMinLine: true,
					lineStyle : {
						type: 'solid',
						opacity: 0.4
					}
				},
				axisTick:{
					show: measureIndex == (mLen - 1) ? true : false,
					hideMaxTick: true,
					hideMinTick: true
				},
				axisLine: {
					show: measureIndex == (mLen - 1) ? true : false
				},
				continueIndex: params.continueIndex,
				minInterval: params.minInterval,
				scale : true,
				min : axisPeak && axisPeak.min,
				max : axisPeak && axisPeak.max,
				timeFormat: params.timeFormat,
				realTimeFormat: params.realTimeFormat,
				tickMax: true,			
				boundaryGap: (type == 'category' ||  !type) ? true : null,
				rotate: 45,
				isDimension: true,
				forceLabelShow: true,
				mulDimension: true,
				axisLabel: {
					show: function (i, measureIndex, mLen, categoryIndex) {
						if (mLen === 0) {
							return categoryIndex.indexOf(i) > -1 ? true : false;
						}
						if (measureIndex != (mLen - 1)) {
							return false;
						} else {
							return categoryIndex.indexOf(i) > -1 ? true : false;
						}
					}(index, measureIndex, mLen, params.categoryIndex),
					formatter: axisLabel && axisLabel.formatter,
					rotate: 45,
					showMaxLabel: type == 'category'  ? true : false,
					showMinLabel: type == 'category' ? true : false,
					tooltip: axisLabel && axisLabel.tooltip,
					interval: function (length, gridWidth) {
						var contailNum = Math.floor(gridWidth / 20);
						contailNum = contailNum < 1 ? 1 : contailNum;
					    var interval = Math.ceil(length / contailNum) - 1;
						interval = interval < 0 ? 0 : interval;
					    return interval;
					}(labelData.length, params.gridWidth)
				},
				triggerEvent: true,
				data: labelData,
				gridIndex : params.gridIndex							
			};
			return xAxisObj;
		},
        /**
		  设置y轴的配置项
		  @param {Object} params: 初始化参数
        */
        getYAxisOption: function(params) {
		    var index = params.index;
			var peakValue = params.peakValue;
			var showTickLabel = false;
			var mLen = params.mLen;
			var measureIndex = params.measureIndex;
			var curKeyItem = params.measure[measureIndex];
			var measureKey = (curKeyItem && curKeyItem.key) || '',
			    measureProp = (curKeyItem && curKeyItem.prop) || '';

			var markLineKey = measureKey + measureProp;
			var min = peakValue[measureIndex].min < 0 ? peakValue[measureIndex].min : 0;
			var max = peakValue[measureIndex].max;
			if (params.mLen == 0) {
				showTickLabel = false;
			} else if (index == 0) {
				showTickLabel = true;
			}
		    var yAxisObj = {
				type: 'value',
				show: true,
				splitLine: {
					show: false
				},
				axisTick:{
					show: showTickLabel
				},
				isFirstAxis: index === 0 ? true : false,
				axisLine: {
					show: (mLen === 0 && index == 0) ? false : true,
					onZero: false,
					lineStyle : {
						color: index == 0 ? '#333' : '#d3d3d3',
						type:   'solid' ,
						opacity: index == 0 ? 1 : 0.9
					}
				},
				min: min,
				max: max,
				rawMin: min,
				rawMax: max,
				axisLabel: {
					show: showTickLabel,
					formatter:  params.context.updateLabelFormatter('value'),
					tooltip: {
	    				show: showTickLabel
	    			}
				},
				key: measureKey,
				prop: measureProp,			
				triggerEvent: true,
				gridIndex: params.gridIndex				
			 };
			 return yAxisObj;
		},
		/**
		   设置series的配置项
		   @param {Object} params: 初始化参数
		*/
        getSeriesOption: function(params) {
		    var gridIndex = params.gridIndex;
		    var chartType;
		    var barSpecialWidth = params.perChartWidth * 0.05;
		    var measure = params.measure;
		    var state = params.state;
		    var xAxisType = params.xAxisType;
		    var context = params.context;
		    var measureIndex = params.measureIndex;
		    var curKeyItem = measure[measureIndex];
		    var measureKey = (curKeyItem && curKeyItem.key) || '',
		        measureProp = (curKeyItem && curKeyItem.prop) || '';
		    var yAxisKey = measureKey + measureProp;
		    var yAxisKeyName = curKeyItem && curKeyItem.alias;
		    chartType = measure.length == 0 ? state : measure[measureIndex].state;
		    barSpecialWidth = barSpecialWidth < 2 ? 2 : barSpecialWidth;
		    barSpecialWidth = barSpecialWidth > 6 ? 6 : barSpecialWidth;
		    xAxisType == null && (xAxisType = 'category');
		    (xAxisType == 'category') && (barSpecialWidth = null);
		    chartType = measure.length == 0 ? 'scatter' : chartType;
		    chartType = chartType.replace(/stack/i, '');
		    chartType = (measure.length > 0 && chartType == 'auto') ? (xAxisType == 'category' ? 'bar' : 'line') : chartType;
		    this.sortSeriesData(xAxisType, params.data, params.dateFormat, context);
		    var seriesObj = {
				type: chartType,
				name: curKeyItem && curKeyItem.alias,
				barWidth: params.barWidth,
				measureIndex: measureIndex,
				realTimeFormat: params.realTimeFormat,
				xAxisKeyName: params.xAxisKeyName,
				xAxisKey: params.xAxisKey,
				yAxisKeyName: yAxisKeyName,
				yAxisKey: yAxisKey,
				barSpecialWidth: barSpecialWidth,
				showAllSymbol : true,			
				key: measureKey,
			    prop: curKeyItem && curKeyItem.prop,
				xAxisIndex : gridIndex,
				yAxisIndex : gridIndex,
				itemStyle : {
					normal: {
						color: params.color[measureIndex]
					}
				},
				data: params.data
			};
		    seriesObj = context.joinFeature(seriesObj, chartType);
			return seriesObj;
		},
		joinFeature: function(series, state){
			var that = this;
			var state = state || this.properties.state;
			var mlen = this.properties.measure.length;
			var dimension = that.properties.dimension;
			var dlen = dimension.length;
			if(state == 'auto') {
				if(dlen <= 2 && dimension[0] && dimension[0].continuity == '11' && mlen){
					state = 'line';
				}
			}
			//多维图表，一律将堆积属性去除
			if (mlen >= 2 && dlen == 2 || dlen >= 3 && mlen >= 1) {
				state = state.replace(/stack/i, '');
			}
			if(/auto|bar/.test(state)){
				series.type = 'bar';
			}
			if (dlen <= 2 && dimension[0] && dimension[0].continuity == '11' && mlen && series.type == 'bar' ) {
				series.barWidth  = '16%';
				dlen == 2 && (series.barGap = '-100%');
			}
			if(/line|area|scatter/.test(state)){
				series.type = 'line';
				series.symbol = 'circle';
				series.showAllSymbol = true;
				if (/scatter/i.test(state)) {
					series.showAllSymbol = true;
				}
			}			
			if(/scatter/.test(state)){
				series.lineStyle = {
					normal:{
						color: 'transparent'
					}
				}
			}
			if(/area/.test(state)){
				series.areaStyle = {
					normal: {}
				}
			}
			return series;
		},
        /**
		   设置单轴的配置项
		   @param {Object} params: 初始化参数
		*/
        getSingleAxisOption: function(params) {
		    var index = params.index;
			var distance = params.distance;
			var visualMLen = params.mLen === 0 ? 1 : params.mLen;
			var percentData = params.percentData[index];
			var formatData = params.labelData[index];

		    var singleAxisObj = {
				height: 0,
				width: params.realChartWidth,
				top: index * distance.topDistance,
			//	top: index == 0 ? 0 : (params.realChartHeight + index * distance.topDistance + distance.axisLabelHeight + (visualMLen - 1) * 10),
				left: distance.leftDistance,
				right: distance.rightDistance,
				boundaryGap : false,
				type: 'category',
				data: formatData.label,
				normalizeData: formatData.percent,
				areaData: formatData.area,
				axisLabel: {
					formatter: function (labelFormatWidth) {
						return function (name) {
							return echarts.format.truncateText(name, labelFormatWidth, '12px Microsoft Yahei', '…');
						};
					}(params.labelFormatWidth[index]),
					tooltip: {
						show: true
				    },
					interval: 0
				},
				classSplitLine: {
					show: true,
					data: percentData.line
				},
				splitLine: {
					show: true
				},
				axisTick:{
					show: false
				},
				axisLine: {
					show: false
				}
			};
			return singleAxisObj;
		},
		/**
		    设置单轴的series配置项
		   @param {Object} params: 初始化参数
		*/
        getSingSeriesOption: function(params) {
		    var seriesObj = {
				singleAxisIndex: params.index,
				coordinateSystem: 'singleAxis',
				type: 'scatter',
				data: []
			};
			return seriesObj;
		},
        /**
         * 对series数据进行排序
         * @param {String} type: x轴的类型
         * @param {Array} data: 需要排序的数据
         */
        sortSeriesData: function(type, data, dateFormat, context) {
        	if (type == 'category' || !type) {
        		return;
        	}
        	if (type == 'time') {
        		if (context.isFormatTimeKey('time', dateFormat)) {
        			data.forEach(function (elem, index) {
        				elem[0] = (elem[0] === null || elem[0] == '' || elem[0] == 'null')  ? '1970-01-01 00:00:00' : context.processTimeItem(dateFormat, elem[0]);
        			});
        		} else {
        			data.forEach(function (elem, index) {
        				(elem[0] === null || elem[0] == '' || elem[0] == 'null')  && (elem[0] = '1970-01-01 00:00:00');
        			});
        		}
        		data.sort(function(a, b) {
        			return (new Date(a[0]).getTime() - new Date(b[0]).getTime());
        		});
        	} else if (type == 'value') {
        		data.forEach(function (elem, index) {
        			(elem[0] === null || elem[0] == '' || elem[0] == 'null')  && (elem[0] = 0);
    			});
    			data.sort(function (a,b) {
    				return a[0]-b[0];
    			});
        	}
        },
        /**
		   根据图表宽度求出各个维度应该显示的标签和标签所在位置在所在轴上的比率
		   @param {Array} data: 标签数据
		   @param {Number} realChartWidth: 图表宽度
		   @param {Array} continuousKey:连续维度信息数组
		   @return {Object} 包含各个维度要显示的分组信息和坐标轴上显示的label内容
		*/
		preprocessCategory: function(data, realChartWidth, continuousKey, chartData) {
			var percentData = echarts.util.clone(data);
			var category = [];
			var width = 0;
			var percent, label, categoryItem, area;
			var lastLabelIndex;
			var interval = 1, classNum = percentData.length;
			var categoryIndex = [];
			//var index = percentData.length > 1 ? 1 : 0;
			var index = classNum - 1;
			var length = continuousKey.length;
			for(var i = 0; i < percentData.length; i++) {
				category[i] = {};
				percent = category[i].percent = [];
				label = category[i].label = [];
				area = category[i].area = [];
				categoryItem = percentData[i];
				for(var j = 0; j < categoryItem.percent.length; j++) {
					//前后两个标签是否重叠
					if (j == 0 || calLabelIndex(realChartWidth, categoryItem.percent, j, lastLabelIndex)) {
						percent.push(categoryItem.percent[j]);
						label.push(categoryItem.label[j]);
						area.push(categoryItem.area[j]);
						lastLabelIndex = j;
						//与坐标轴分类一致的类别才放入数组
						if (i == index) {
						   categoryIndex.push(j);
						}
					}
				}
			}
			//如果坐标轴上连续的维度key个数大于1
			if (length >= 2) {
				categoryIndex = calContinueAxisLabelIndex(chartData, length, realChartWidth);
			}
			return {category: category, categoryIndex: categoryIndex};
			/**
			   计算前后两个label是否重叠
			*/
			function calLabelIndex(realChartWidth, data, j, lastLabelIndex) {
				if (Math.round(realChartWidth * (data[j] - data[lastLabelIndex])) >= 26) {
				  return true;
				}
				return false;
			}
			/**
			 * 计算1个以上连续维度时，坐标轴的label显示情况
			 * @param {Array} data ：与坐标轴上最接近的维度标签数据
			 * @param {Number} length: 连续维度的个数
 			 */
			function calContinueAxisLabelIndex(data, length, realChartWidth) {
				var categoryIndex = [];
				var chartBit = [];
                //计算出每一个坐标系的比率
				for (var i = 0, len = data.length; i < len; i++) {
					chartBit[i] = (i + 1) / len;
				}
				for(var j = 0; j < data.length; j++) {
					//前后两个标签是否重叠
					if (j == 0 || calLabelIndex(realChartWidth, chartBit, j, lastLabelIndex)) {
						lastLabelIndex = j;
						categoryIndex.push(j);
					}
				}
				return categoryIndex;
			}
		},
        /**
	  	   处理悬浮框显示的格式
	  	   @param {Array} disContinuousKey:离散字段数组
	  	   @param {Object} params: echarts内部参数
	  	*/
	  	processTooltipFormatter: function(dimension, measure, disContinuousKey, params) {
	  	    var data = params.data;
	  		var len = data.length;
	  		var color = params.color;
	  		var formatter = '';
	  		var continueLen = dimension.length - disContinuousKey.length;
	  		var filterDimension = [];
	  		var timeFormat = params.timeFormat;
	  		var aliasIndex = 0;
	  		if (continueLen == 0) {
	  			//无连续字段
	  			filterDimension = dimension.filter(function (item, index) {
	  				return index != (dimension.length -1)
	  			});
	  		} else {
	  			//有连续字段，并从dimension中删除，并得到新数组
	  			filterDimension = dimension.slice(0, disContinuousKey.length);
	  		}
	  	    while (len - 2) {
	  		    formatter += getFormatter(color, filterDimension[aliasIndex].alias, data[len - 1]);
	  			len -- ;
	  			aliasIndex ++ ;
	  		}
	  		if (params.componentType == 'markLine') {//处理参考线的显示悬浮层
                var getChartOption = that.chart.getOption();
                var getMarkLineOption = getChartOption.series[params.seriesIndex].markLine.data[params.dataIndex];

				var str = getMarkLineOption.field + '<br/>' + getMarkLineOption.name +'：' + getMarkLineOption.value;
				return str;
            } else {
		  		formatter += getFormatter(color, params.xAxisKeyName, timeFormat ? new Date(data[0]).Format(timeFormat) : data[0]);
		  		measure.length > 0 && (formatter += getFormatter(color, measure[params.measureIndex].alias, data[1]));
            }
	        return formatter;
	  		/**
	  		   获取数据的html字符串
	  		*/
	  		function getFormatter(color, name, value) {
	  		     return  ('<span style="display:inline-block;margin-right:5px;border-radius:10px;width:9px;height:9px;background-color:'
	  			           + color + '"></span>'+ name +'：' + value + '</br>');
	  		}
	  	},
	  	/**
		   获取无需分组的字段序号
		   @param {Number} dLen: 维度的个数
		   @param {Array} groupDimenIndex: 需要分组的维度序号:[0, 1, 2]
		   @return {Array} disGroupIndex: 无需分组的序号
		*/
		getDisGroupItem: function(dLen, groupDimenIndex) {
		    var disGroupIndex = [];
		    for (var i = 0; i < dLen; i++) {
			    if (groupDimenIndex.indexOf(i) == -1) {
				    disGroupIndex.push(i);
				}
			}
			return disGroupIndex;
		},
		processTimeItem: function (format, item) {
			var year, month, date, timeArray;

			 switch (format)
			 {
				 case 'yyyymmdd':
					year = parseInt(item.substring(0,4));
					month = parseInt(item.substring(4,6));
					date = parseInt(item.substring(6,8));
					item = year + '/' + month + '/' + date;
					break;
				 case 'dd/mm/yyyy':
					 timeArray = item.split('/');
					 item = timeArray[2] + '/' + timeArray[1] + '/' + timeArray[0];
					 break;
				 case 'yyyymm':
					 year = parseInt(item.substring(0,4));
					 month = parseInt(item.substring(4,6));
					 item = year + '/' + month;
					 break;
				 //当维度的数据类型为time时，"hh:mm:ss"时间类型
				 //由于echart不能处理为连续数据，故加上前缀字符"1970-01-01 "
				 case 'time':
					 item = '1970/01/01 ' + item;
					 break;
				//由于echart不能处理为连续数据，故加上前缀字符"1970-01-01 "
				 case 'hh:mm:ss':
					 item = '1970/01/01 ' + item;
					 break;
				 default: break;
			 }
			 return item;
		},
		/**
		 * 判断该字段是否为需要格式化的时间字段
		 */
		isFormatTimeKey: function (type, item) {
			var timeFormat = echarts.util.isObject(item) ? (item.timeFormat || item.colType) : item;
			if (type == 'time') {
				if (timeFormat == 'yyyymmdd' || timeFormat == 'dd/mm/yyyy' || timeFormat == 'yyyymm' || timeFormat == 'time') {
					return true;
				}
			}
			return false;
		},
		/**
		 * 传递参数
		 */
        curry: function (func) {
			 var nativeSlice = Array.prototype.slice;
			 var args = nativeSlice.call(arguments, 1);

		     return function () {
		         return func.apply(this, args.concat(nativeSlice.call(arguments)));
		     };
		}		
	}
	window.MulDimensionChart = MulDimensionChart;
	/**
	 * Date对象添加format方法
	 * @param {String} fmt 如："yyyy-MM-dd hh:mm:ss"、"hh:mm:ss"等
	 */
	Date.prototype.Format = function (fmt) {
	    var o = {
	        "M+": this.getMonth() + 1, //月份 
	        "d+": this.getDate(), //日 
	        "h+": this.getHours(), //小时 
	        "m+": this.getMinutes(), //分 
	        "s+": this.getSeconds(), //秒 
	        "q+": Math.floor((this.getMonth() + 3) / 3), //季度 
	        "S": this.getMilliseconds() //毫秒 
	    };
	    if (/(y+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
	    for (var k in o){
			if (new RegExp("(" + k + ")").test(fmt)){
				fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
			} 
	    }
	    return fmt;
	}
}(echarts, window));
