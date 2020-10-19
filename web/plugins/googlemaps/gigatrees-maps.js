// uses: mcOption and myPinData - all set in app
if ((typeof mcOptions !== 'undefined') && (typeof myPinData !== 'undefined')) {
	
	var map;
	var myPins=[];
	var myCoords=[];

	function addPin(lat,lng,count,icon,title,content){
		var coords=new google.maps.LatLng(lat,lng);

		var weighting = count;
		weighting /= 50; // reduce the effect of outliers
		weighting = Math.max(1,weighting);
		var weightedCoords = {location: coords, weight: weighting};
		myCoords.push(weightedCoords);
		
		var marker=new google.maps.Marker({map:map,position:coords,icon:icon});
		
		marker.weight=count;
		
		var info=new google.maps.InfoWindow({content:content});
		
		marker.setTitle(title);
		
		google.maps.event.addListener(marker,"mouseover",function(){
			info.open(map,marker);
			var listener=google.maps.event.addListener(marker,"mouseout",function(){info.close()});
			google.maps.event.addListener(marker,"click",function(){
				info.open(map,marker);
				google.maps.event.removeListener(listener,function(){info.open(map,marker)});
			});
		});
		
		myPins.push(marker);
	}

	function showPins(map,markers){for(var i=0;i<markers.length;i++)markers[i].setMap(map)}

	function hidePins(markers){for(var i=0;i<markers.length;i++)markers[i].setMap(null)}

	function initializeCalculator(clusters){
		clusters.setCalculator(function(markers,numStyles){
			var index=0;
			var size=0;
			for(i=0;i<markers.length;i++){
				size += markers[i].weight;
			}
			var count=size.toString();
			var dv=count;
			while(dv!==0){
				dv=parseInt(dv/10,10);
				index++;
			}
			index=Math.min(index,numStyles);
			return{text:count,index:index};
		});
	}

	function initializeMap()
	{
	  var myPinStatus=1;
	  var minZoomLevel = 2;
	  var myLatlng = new google.maps.LatLng(31.264,5.397);
	  var myOptions = {
		  zoom:minZoomLevel,
		  center:myLatlng
		  //, mapTypeId:google.maps.MapTypeId.ROADMAP
	  };
	  
	  // create the google map
	  map = new google.maps.Map(document.getElementById("gt-heat-map"),myOptions);

	  // define map bounds
	  var allowedBounds = new google.maps.LatLngBounds(new google.maps.LatLng(-79,-179),new google.maps.LatLng(79,179));
	  
	  // get map center
	  var lastValidCenter = map.getCenter();
	  
	  // make sure center stays within bounds
	  google.maps.event.addListener(map,"center_changed",function(){
		  if(allowedBounds.contains(map.getCenter())){
			  lastValidCenter=map.getCenter();
			  return;
		  }
		  
		  map.panTo(lastValidCenter);
	  });
	  
	  // add pins to map (myPinData set in app)
	  myPinData.forEach(function(entry) {
		  addPin(entry.lat, entry.lng, entry.c, entry.i, entry.t, entry.n);
	  });
	 
	  // use pins to create clusters (mcOptions set in web page Header)
	  var markerCluster = new MarkerClusterer(map, myPins, mcOptions);
	  // update cluster counts
	  initializeCalculator(markerCluster);
	  
	  document.getElementById("gt-toggle-markers").onclick=function(){
		  if(myPinStatus==1){
			  markerCluster.clearMarkers();
			  showPins(map,myPins);
			  myPinStatus=2;
			 heatmap.setMap(null);
		  }else{
			  hidePins(myPins);
			  markerCluster=new MarkerClusterer(map,myPins,mcOptions);
			  initializeCalculator(markerCluster);
			  myPinStatus=1;
			  if (map.getZoom() < 7)
			  {
				heatmap.setMap(map);
			  }
		  }
	  };
	  
	  // clamp zoom
	  google.maps.event.addListener(map,"zoom_changed",function(){
		  var zoom = map.getZoom();
		  if (zoom < minZoomLevel) {
			  map.setZoom(minZoomLevel);
			  zoom = minZoomLevel;
		  }
		  
		  if (zoom >= 7) {
			 heatmap.setMap(null);
		  } else if ((zoom < 7) && (myPinStatus == 1)) {
			 heatmap.setMap(map);
		  }
	  });
	  
		heatmap = new google.maps.visualization.HeatmapLayer({
			data: myCoords,
			map: map,
			opacity: 0.6,
			radius: 40
		});

		var gradient = [
          'rgba(0, 255, 255, 0)',
          'rgba(0, 255, 255, 1)',
		  'rgb(23, 173, 203)',
		  'rgb(46, 100, 158)',
		  'rgb(24, 53, 103)',
          'rgba(127, 0, 63, 1)',
          'rgba(191, 0, 31, 1)'
        ]		
        heatmap.set('gradient', gradient);
		
	}

	initializeMap();
}
else
{
	throw new Error("Map data not loaded");
}
