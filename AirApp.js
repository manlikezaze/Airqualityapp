$(window).bind('scroll',function(e){
    parallaxScroll();
});

function parallaxScroll(){
   var scrolled = $(window).scrollTop(); 
   $('.container-fluid').css('top',(0-(scrolled*.25))+'px');
   $('.form-group').css('top',(0-(scrolled*.5))+'px');
   $('.container-fluid').css('top',(0-(scrolled*.75))+'px');
}



// create map

var map = new google.maps.Map(document.getElementById('googleMap'), {
    zoom: 7,
    center: new google.maps.LatLng(47.1611615, 19.5057541),
    mapTypeId: google.maps.MapTypeId.ROADMAP
});

//create a DirectionsService object to use the route method and get a result for our request
var directionsService = new google.maps.DirectionsService();

//create a DirectionsRenderer object which we will use to display the route
var directionsDisplay = new google.maps.DirectionsRenderer();

//bind the DirectionsRenderer to the map
directionsDisplay.setMap(map);


// get air pollution response using open weather map API, with latitude and longitude
async function getAirPollution(lat, long){
    res = await fetch(`http://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${long}&appid=d3911659d85604d013c691487fe9d491`)
    return res.json()
}

// takes averages of all steps between start and end air pollution result
function getAverageAirPollution(air_pollution_arr){

    total_steps = air_pollution_arr.length

    var co_t = 0
    var nh3_t = 0
    var no_t = 0
    var no2_t = 0
    var o3_t = 0
    var pm2_5_t = 0
    var pm10_t = 0
    var so2_t = 0
    var aq_t = 0

    air_pollution_arr.forEach((result) => {
        co_t += result.list[0].components.co
        nh3_t += result.list[0].components.nh3
        no_t += result.list[0].components.no
        no2_t += result.list[0].components.no2
        o3_t += result.list[0].components.o3
        pm2_5_t += result.list[0].components.pm2_5
        pm10_t += result.list[0].components.pm10
        so2_t += result.list[0].components.so2
        aq_t += result.list[0].main.aqi
    })

    return {
        'co': co_t/total_steps,
        'nh3': nh3_t/total_steps,
        'no': no_t/total_steps,
        'no2': no2_t/total_steps,
         'o3':o3_t/total_steps,
         'pm2_5': pm2_5_t/total_steps,
         'pm10': pm10_t/total_steps, 
         'so2': so2_t/total_steps, 
         'aq': aq_t/total_steps
    }
}

// function

function calcRoute(){
    // create request
    var request = {
        origin: document.getElementById("from").value,
        destination: document.getElementById("to").value,
        travelMode: google.maps.TravelMode.DRIVING, //WALKING, BYCYCLING, TRANSIT
        unitSystem: google.maps.UnitSystem.IMPERIAL
    
    }

    //pass the request to the route method
    directionsService.route(request, async function (result, status) {

        //  end locations of each step from start to dest
        var steps_end_locations = []
        
        // air pollution of each step
        var steps_air_pollutions = []

        if (status == google.maps.DirectionsStatus.OK) {

            steps_end_locations = result.routes[0].legs[0].steps

            // get air pollution of each step and add it to the steps_air_pollution array
            steps_end_locations.forEach(async (step) => {
                console.log(step.end_location.lat(),step.end_location.lng())
                const air_pollution =  await getAirPollution(step.end_location.lat(), step.end_location.lng())
                steps_air_pollutions.push(air_pollution)
            })

            console.log(steps_air_pollutions)
            
            // start location lat and long
            start_location_lat = result.routes[0].legs[0].start_location.lat()
            start_location_long = result.routes[0].legs[0].start_location.lng()

            // end location lat and long
            end_location_lat = result.routes[0].legs[0].end_location.lat()
            end_location_long = result.routes[0].legs[0].end_location.lng()

            // start and end location air pollution
            const start_air_pollution =  await getAirPollution(start_location_lat, start_location_long)
            const end_air_pollution = await getAirPollution(end_location_lat,end_location_long)

            steps_air_pollutions.push(start_air_pollution)

            // averages of start and end air pollution
            const pollution_averages = getAverageAirPollution(steps_air_pollutions)

            console.log(pollution_averages)

            // Updating HTML Elements
            // TODO: Add all units
            const co_el = document.getElementById('co_el')
            co_el.innerHTML = `${pollution_averages.co} μg/m3`

            const nh3_el = document.getElementById('nh3_el')
            nh3_el.innerHTML = `${pollution_averages.nh3} μg/m3`

            const no_el = document.getElementById('no_el')
            no_el.innerHTML = `${pollution_averages.no} μg/m3`

            const no2_el = document.getElementById('no2_el')
            no2_el.innerHTML = `${pollution_averages.no2} μg/m3`

            const o3_el = document.getElementById('o3_el')
            o3_el.innerHTML = `${pollution_averages.o3} μg/m3`

            const pm2_5_el = document.getElementById('pm2_5_el')
            pm2_5_el.innerHTML = `${pollution_averages.pm2_5} μg/m3`

            const pm10_el = document.getElementById('pm10_el')
            pm10_el.innerHTML = `${pollution_averages.pm10} μg/m3`

            const so2_el = document.getElementById('so2_el')
            so2_el.innerHTML = `${pollution_averages.so2} μg/m3`

            const aq_el = document.getElementById('aq_el')
            aq_el.innerHTML = pollution_averages.aq

            const aq_status = document.getElementById('aq_status')

            switch(pollution_averages.aq){
                case 1:
                    aq_status.innerHTML = "Good"
                    break;
                case 2:
                    aq_status.innerHTML = "Fair"
                    break;
                case 3:
                    aq_status.innerHTML = "Moderate"
                    break;
                case 4:
                    aq_status.innerHTML = "Poor"
                    break;
                case 5:
                    aq_status.innerHTML = "Very Poor"
                    break;   
                
            }






            //Get distance and time
            const output = document.querySelector('#output');
            output.innerHTML = "<div class='alert-info'>From: " + document.getElementById("from").value + ".<br />To: " 
            + document.getElementById("to").value + ".<br /> Driving distance <i class='fas fa-road'></i> : " 
            + result.routes[0].legs[0].distance.text + ".<br />Duration <i class='fas fa-hourglass-start'></i> : " + result.routes[0].legs[0].duration.text + ".</div>";


            //display route
            directionsDisplay.setDirections(result);
        } else {
            //delete route from map
            directionsDisplay.setDirections({ routes: [] });
            //center map in Hungary
            map.setCenter(LatLng);

            //show error message
            output.innerHTML = "<div class='alert-danger'><i class='fas fa-exclamation-triangle'></i> Could not retrieve driving distance.</div>";
        }
    });

}


//create autocomplete objects for all inputs
var options = {
    types: ['(cities)']
}

var input1 = document.getElementById("from");
var autocomplete1 = new google.maps.places.Autocomplete(input1, options);

var input2 = document.getElementById("to");
var autocomplete2 = new google.maps.places.Autocomplete(input2, options);

