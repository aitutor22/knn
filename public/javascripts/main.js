//inspired by http://burakkanber.com/blog/machine-learning-in-js-k-nearest-neighbor-part-1/

//creates a Node with the values passed in
function Node(obj) {
  for (key in obj) {
    this[key] = obj[key];
  }
}

//features represent which fields will be used in the analysis
function NodeList(data, inputFeatures, k) {
  var nodes = [],
    features = inputFeatures,
    numNeighbours,
    ranges = {}, 
    types = {};

  //if k is not passed in, use default of 3
  numNeighbours = (typeof k === 'undefined') ? 3 : k;

  /* code to normalize data */
  function getRange() {
    //for each feature, find maximum and minimum value
    _.each(features, function(feature) {
      //we need to first create a field for each feature being tested
      ranges[feature] = {min: Number.POSITIVE_INFINITY, max: Number.NEGATIVE_INFINITY};

      for (var i = 0; i < data.length; i++) {
        if(typeof data[i][feature] === 'undefined') {
          throw new Error('Could not find feature: ' + feature + '; entry index: ' + i);
        };

        //looks for max
        if (data[i][feature] > ranges[feature]['max']) {
          ranges[feature]['max'] = data[i][feature];
        };

        //looks for min
        if (data[i][feature] < ranges[feature]['min']) {
          ranges[feature]['min'] = data[i][feature];
        };      
      };

    });
  };

  //checks how many possible types there are
  _.each(data, function(element) {
    var type = element['type'];
    //check that type is defined (i.e. ignore points where we are supposed to find the type)
    if (type && typeof types[type] === 'undefined') types[type] = true;      
  });


  getRange();
  //normalize every point
  _.each(data, function(element) {
    var temp = {};
    _.each(features, function(feature) {
      temp[feature] = (element[feature] - ranges[feature]['min']) / (ranges[feature]['max'] - ranges[feature]['min']);
    });

    temp['type'] = element['type'];
    nodes.push(new Node(temp));
  });

  //calculate distance based off pythagoras theorem
  function calculateDistance(nodeA, nodeB) {
    var sum = 0;
    _.each(features, function(feature) {
      sum += Math.pow((nodeA[feature] - nodeB[feature]), 2); 
    });

    return Math.sqrt(sum);
  }

  /* code to calculate distance between nodes */

  //obtain arrays of nodes with and without types
  var nodesWithoutTypes = _.filter(nodes, function(node) {
    return !node['type'];
  });

  var nodesWithTypes = _.filter(nodes, function(node) {
    return node['type'];
  });

  //for each unclassified node, determine distance with nodes that have already been classified
  _.each(nodesWithoutTypes, function(element) {

    var distances = [],
      classifiedTypes = {};

    _.each(nodesWithTypes, function(node) {
      distances.push({
        distance: calculateDistance(element, node),
        type: node['type']
      });
    });

    //sorts according to nearest distance
    distances.sort(function(a, b) {
      return a.distance - b.distance;
    });

    _.each(distances.slice(0, numNeighbours), function(distance) {
      if (typeof classifiedTypes[distance['type']] === 'undefined') classifiedTypes[distance['type']] = 0;
      classifiedTypes[distance['type']] += 1;
    });

    var maxType = _.max(_.pairs(classifiedTypes), function(element) {
      return element[1];
    });
    //saves the guessed type
    element.type = maxType[0];
  });

  return {
    //only for 2 feature graph
    plotPoints: function(canvasID) {
      if (features.length !== 2) throw new Error('Requires exactly 2 features to plot graph');

      var canvas = document.getElementById(canvasID),
        ctx = canvas.getContext('2d'),
        width = 400,
        height = 400,
        colors = [];
      
      canvas.width = width;
      canvas.height = height;
      ctx.clearRect(0, 0, width, height);

      var colors = ['red', 'green', 'blue', 'pink', 'red'],
        colorCounter = 0,
        colorsHash = {}

      for (var key in types) {
        if (colorCounter >= colors.length) throw new Error('Number of types exceed the nuber of colors available');

        colorsHash[key] = colors[colorCounter];
        colorCounter++; 
      };
            
      _.each(nodes, function(node) {
        var xCoord = node[features[0]] * width,
          //rem that y axis increments downwards
          yCoord = height - node[features[1]] * height ;

        //console.log(colorsHash[node['type']])
        ctx.fillStyle = colorsHash[node['type']];
        ctx.fillRect(xCoord, yCoord, 5, 5);
      });

    }
  }
}
var nodeList = new NodeList(data, ['rooms', 'area'], 3);
nodeList.plotPoints('canvas');