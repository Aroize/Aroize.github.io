window.onload = function () {

    updateCurrentCity();

    const storedCitiesCallback = function (cities) {
        cities.forEach(city => {
            const cityWeatherCallback = function (weather) {
                appendCityToFavourites(city, weather, false);
            }
            requestCityWeather(city, cityWeatherCallback);
        });
    }

    getStorageCities(storedCitiesCallback);
}

/**
 * geo utils
 */

function updateCurrentCity() {
    showHeaderLoadingView();
    const currentCityGeoCallback = function (lat, lon) {
        const city = {
            "city_name": null,
            "lat": lat,
            "lon": lon
        }
        const currentCityWeatherCallback = function (weather) {
            showCurrentCityGeo(city, weather);
        }

        requestCityWeather(city, currentCityWeatherCallback)
    }
    getCurrentGeo(currentCityGeoCallback);
}

function getCurrentGeo(callback) {
    const geolocation = navigator.geolocation;
    const positionCallback = function (position) {
        callback(position.coords.latitude, position.coords.longitude);
    }

    const positionErrorCallback = function (positionError) {
        // Hardcoded SP coordinates
        callback(60., 31.);
    }

    geolocation.getCurrentPosition(positionCallback, positionErrorCallback, null);
}

function addCityToFavouritesByName() {
    const inputField = document.getElementById("new-favourite-city");
    const query = inputField.value;

    if (!hasCityNameInStorage(query)) {
        inputField.value = "";

        const city = {
            "city_name": query,
            "lat": null,
            "lon": null
        };

        const requestCallback = function (weather) {
            appendCityToFavourites(city, weather, true);
        };

        requestCityWeather(city, requestCallback);
    } else {
        alert("У вас уже добавлен этот город в избранное!");
    }
}

/**
 * api utils
 */

const apiKey = "16cef8b09402035e00967f9f98573581"

function formatRequestWithGeoCoords(lat, lon) {
    return `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&lang=ru`
}

function formatRequestWithQuery(query) {
    return `https://api.openweathermap.org/data/2.5/weather?q=${query}&appid=${apiKey}&lang=ru`
}

function formatWeatherIcon(iconId) {
    return `http://openweathermap.org/img/wn/${iconId}@4x.png`
}

function requestCityWeather(city, requestCallback) {
    if (city["city_name"] == null) {
        requestCityWeatherByGeoCoords(city, requestCallback);
    } else {
        requestCityWeatherByCityName(city, requestCallback);
    }
}

function requestCityWeatherByGeoCoords(city, callback) {
    const xhr = new XMLHttpRequest();
    const requestUrl = formatRequestWithGeoCoords(city["lat"], city["lon"]);
    xhr.open("GET", requestUrl, true);
    xhr.onload = function (e) {
        if (xhr.readyState === 4) {
            if (xhr.status !== 200) {
                console.log("Bruh moment");
            } else {
                const jsonResponse = JSON.parse(xhr.responseText);
                city['city_name'] = jsonResponse['name'];
                const weather = parseWeather(jsonResponse);
                callback(weather);
            }
        }
    }
    xhr.send();
}

function requestCityWeatherByCityName(city, callback) {
    const xhr = new XMLHttpRequest();
    const requestUrl = formatRequestWithQuery(city['city_name']);
    xhr.open("GET", requestUrl, true);
    xhr.onload = function (event) {
        if (xhr.readyState === 4) {
            if (xhr.status !== 200) {
                console.log("Bruh moment");
            } else {
                const jsonResponse = JSON.parse(xhr.responseText);
                city['lat'] = jsonResponse['coord']['lat'];
                city['lon'] = jsonResponse['coord']['lon'];
                const weather = parseWeather(jsonResponse);
                callback(weather);
            }
        }
    }
    xhr.send();
}

function parseWeather(weatherJson) {
    const weatherMain = weatherJson['main'];
    const weatherAddon = weatherJson['weather'][0];
    const wind = weatherJson['wind']
    return {
        'humidity': weatherMain['humidity'],
        'temperature': convertKelvinToCelsius(weatherMain['temp']),
        'pressure': weatherMain['pressure'],
        'cloudiness': weatherAddon['description'],
        'icon_url': formatWeatherIcon(weatherAddon['icon']),
        'wind_direction': extractWindDirectionFromDegrees(wind['deg']),
        'wind_speed': wind['speed']
    }
}

function convertKelvinToCelsius(kelvin) {
    return Math.floor(kelvin - 273);
}

function extractWindDirectionFromDegrees(deg) {
    if (deg > 348.75 || deg < 11.25) {
        return "North";
    } else if (deg > 11.25 && deg < 33.75) {
        return "North, Northeast";
    } else if (deg > 33.75 && deg < 56.25) {
        return "Northeast";
    } else if (deg > 56.25 && deg < 78.75) {
        return "East, Northeast";
    } else if (deg > 78.75 && deg < 101.25) {
        return "East";
    } else if (deg > 101.25 && deg < 123.75) {
        return "East, Southeast";
    } else if (deg > 123.75 && deg < 146.25) {
        return "Southeast";
    } else if (deg > 146.25 && deg < 168.75) {
        return "South, Southeast";
    } else if (deg > 168.75 && deg < 191.25) {
        return "South";
    } else if (deg > 191.25 && deg < 213.75) {
        return "South, Southwest";
    } else if (deg > 213.75 && deg < 236.25) {
        return "Southwest";
    } else if (deg > 236.25 && deg < 258.75) {
        return "West, Southwest";
    } else if (deg > 258.75 && deg < 281.25) {
        return "West"
    } else if (deg > 281.25 && deg < 303.75) {
        return "West, Northwest";
    } else if (deg > 303.75 && deg < 326.25) {
        return "Northwest";
    } else {
        return "North, Northwest";
    }
}

/**
 * view utils
 */

const headerLoadingViewInnerHtml = `
<div class="loader-placeholder">Подождите, данные загружаются</div>
<img src="img/spinner.gif" alt="loading">
`

function createHeaderLoadingElement() {
    const div = document.createElement("div")
    div.classList.add("loading-container");
    div.id = "loading-view";
    div.innerHTML = headerLoadingViewInnerHtml;
    return div;
}

function showHeaderLoadingView() {
    hideCurrentWeatherBlock();
    const container = document.getElementById("main-root");
    container.insertBefore(createHeaderLoadingElement(), container.firstChild);
}

function hideHeaderLoadingView() {
    const loadingView = document.getElementById("loading-view");
    loadingView.remove();
}

const headerCityBlock = `
<h2 id="geolocation-city-name">Saint Petersburg</h2>
<div class="name">
    <img id="geolocation-city-icon" class="geolocation-city-icon" src="./img/apple-weather.png" alt="weather">
    <span id="geolocation-temperature" class="temp-big">8°C</span>
</div>
`
const headerCityList = `
<ul>
    <li class="favourite-inside">Ветер<span class="info-city">Moderate breeze, 6.0m/s, North-northwest</span></li>
    <li class="favourite-inside">Облачность<span class="info-city">Broken clouds</span></li>
    <li class="favourite-inside">Давление<span class="info-city">1013 hpa</span></li>
    <li class="favourite-inside">Влажность<span class="info-city">52 %</span></li>
    <li class="favourite-inside">Координаты<span class="info-city">[59.88, 30.42]</span></li>
</ul>
`

function showCurrentWeatherBlock() {
    hideHeaderLoadingView();

    const headerBlock = document.createElement("div");
    headerBlock.innerHTML = headerCityBlock;
    const headerList = document.createElement("div");
    headerList.id = "info-by-geolocation";
    headerList.innerHTML = headerCityList;

    const container = document.getElementById("main-root");
    container.insertBefore(headerList, container.firstChild);
    container.insertBefore(headerBlock, headerList);
}

function hideCurrentWeatherBlock() {
    const container = document.getElementById("main-root");
    if (container.children[1].id === "info-by-geolocation") {
        container.firstChild.remove();
        container.firstChild.remove();
    }
}

/**
 * parent div should extend class="weather-by-city"
 */

const favouriteCityBlock = `
<div class="weather-by-city">
    <h4>Moscow</h4>
    <span class="temp">8°C</span>
    <img class="city-icon" src="./img/apple-weather.png" alt="">
    <button class="btn-circle">X</button>
</div>
<ul>
    <li class="favourite-inside">Ветер<span class="info-city">Moderate breeze, 6.0m/s, North-northwest</span></li>
    <li class="favourite-inside">Облачность<span class="info-city">Broken clouds</span></li>
    <li class="favourite-inside">Давление<span class="info-city">1013 hpa</span></li>
    <li class="favourite-inside">Влажность<span class="info-city">52 %</span></li>
    <li class="favourite-inside">Координаты<span class="info-city">[59.88, 30.42]</span></li>
</ul>
`

function createFavouriteCityBlock() {
    const favouritesList = document.getElementById("favourites-list");
    let lastListItem = favouritesList.lastChild;
    if (lastListItem == null || lastListItem.childNodes.length === 2) {
        lastListItem = document.createElement("li");
        lastListItem.classList.add("container");
        favouritesList.appendChild(lastListItem);
    }
    const favouriteCityDiv = document.createElement("div");
    favouriteCityDiv.classList.add("favourite-city");
    favouriteCityDiv.innerHTML = favouriteCityBlock;

    lastListItem.appendChild(favouriteCityDiv);
    return favouriteCityDiv;
}

function appendCityToFavourites(city, weather, needToSaveToStorage) {
    if (needToSaveToStorage) {
        saveCityToStorage(city);
    }
    const cityBlock = createFavouriteCityBlock();

    const cityHeader = cityBlock.children[0];
    fillCityHeader(city, weather, cityHeader);

    const cityList = cityBlock.children[1].children;
    fillCityList(city, weather, cityList);
}

function showCurrentCityGeo(city, weather) {

    showCurrentWeatherBlock()

    const cityName = document.getElementById("geolocation-city-name");
    const cityIcon = document.getElementById("geolocation-city-icon");
    const cityTemperature = document.getElementById("geolocation-temperature");

    const geoInfo = document.getElementById("info-by-geolocation");

    cityName.innerHTML = city['city_name'];
    cityIcon.src = weather['icon_url'];
    cityTemperature.innerHTML = `${weather['temperature']}°C`;

    const geoInfoList = geoInfo.children[0].children;
    fillCityList(city, weather, geoInfoList);
}

function fillCityHeader(city, weather, header) {
    const cityName = header.getElementsByTagName("h4")[0];
    cityName.innerHTML = city['city_name'];
    const cityTemperature = header.getElementsByTagName("span")[0];
    cityTemperature.innerHTML = `${weather['temperature']}°C`;
    const cityIcon = header.getElementsByTagName("img")[0];
    cityIcon.src = weather['icon_url'];
}

function fillCityList(city, weather, geoInfoList) {
    for (let i = 0; i < geoInfoList.length; ++i) {
        const listItem = geoInfoList[i];
        const geoField = listItem.children[0];
        switch (i) {
            case 0:
                geoField.innerHTML = `${weather['wind_speed']}m/s, ${weather['wind_direction']}`;
                break;
            case 1:
                const condition = weather['cloudiness'];
                geoField.innerHTML = capitalizeFirstLetter(condition);
                break;
            case 2:
                const pressure = weather['pressure'];
                geoField.innerHTML = `${pressure} hpa`
                break;
            case 3:
                const humidity = weather['humidity'];
                geoField.innerHTML = `${humidity}%`
                break;
            case 4:
                geoField.innerHTML = `[${Math.floor(city['lat'])}, ${Math.floor(city['lon'])}]`
                break;
        }
    }
}

function capitalizeFirstLetter(string) {
    return string.slice(0, 1).toUpperCase() + string.slice(1);
}

/**
 * storage utils
 */

const storage = window.localStorage;

let citiesList = [];

function getStorageCities(callback) {
    for (let i = 0; i < storage.length; i++) {
        const key = storage.key(i);
        citiesList.push(JSON.parse(storage.getItem(key)));
    }
    console.log(citiesList);
    callback(citiesList);
}

function saveCityToStorage(city) {
    const cityKey = city['city_name'];
    const cityStr = JSON.stringify(city);
    storage.setItem(cityKey, cityStr);
    citiesList.push(city);
}

function removeCityFromStorage(city) {
    citiesList = citiesList.filter((value, index, array) => value['city_name'] !== city['city_name']);
    storage.removeItem(city['city_name']);
}

function hasCityNameInStorage(cityName) {
    const lowerCaseCityName = cityName.toLowerCase();
    const index = citiesList.findIndex(value => value['city_name'].toLowerCase() === lowerCaseCityName);
    return index !== -1;
}