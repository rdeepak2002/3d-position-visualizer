let map;

async function initMap() {
    const position = {lat: -25.344, lng: 131.031};
    const {Map} = await google.maps.importLibrary('maps');
    const {AdvancedMarkerElement} = await google.maps.importLibrary('marker');

    // The map, centered at Uluru
    map = new Map(document.getElementById('map'), {
        zoom: 4,
        center: position,
        mapId: 'c4ea8f63cbffe52d',
    });

    // The marker, positioned at Uluru
    const marker = new AdvancedMarkerElement({
        map: map,
        position: position,
        title: 'Uluru',
    });
}

initMap();
