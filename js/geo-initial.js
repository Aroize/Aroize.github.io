function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

class Worker {

    apiManager = new ApiManager();

    geolocationUtil = new GeolocationUtils();

    viewManager = new ViewManager();

    latLonCallback = function (lat, lon) {
        mainWorker.apiManager.requestWeather(
            Math.floor(lat),
            Math.floor(lon),
            mainWorker.weatherRequestMainCallback
        );
    }
    defaultCityCallback = function () {
        console.log("Should request default city");
    }

    weatherRequestCallback = function (weather) {
        console.log(weather);
    }

    weatherRequestMainCallback = function (weather) {
        console.log(weather);
        mainWorker.viewManager.showMainCityWeather(weather);
    }

    updateCurrentCity() {
        this.geolocationUtil.initialize(this.latLonCallback, this.defaultCityCallback);
    }

    run() {
        this.updateCurrentCity();
    }
}

class ApiManager {
    weatherManager = new WeatherApiManager();
    searchManager = new SearchApiManager();

    requestWeather(lat, lon, callback) {
        return this.weatherManager.requestWeather(lat, lon, callback);
    }
}

class WeatherApiManager {

    weatherKey = "4e45331b-af93-424b-96d5-50c2f4e72802";

    createHttpRequest(lat, lon) {
        return `https://api.weather.yandex.ru/v2/forecast?lat=${lat}&lon=${lon}&lang=ru_RU`;
    }

    requestWeather(lat, lon, callback) {
        const wholeResponseCallback = function (hugeResponseCallback) {
            if (hugeResponseCallback == null) {
                callback(null);
            } else {
                const factWeather = hugeResponseCallback['fact'];
                const iconName = factWeather['icon'];
                const iconUrl = `https://yastatic.net/weather/i/icons/blueye/color/svg/${iconName}.svg`
                const weatherBlockDto = {
                    "wind": {
                        "wind_dir": factWeather['wind_dir'],
                        "wind_speed": factWeather['wind_speed']
                    },
                    "condition": factWeather['condition'],
                    "pressure": factWeather['pressure_pa'],
                    "humidity": factWeather['humidity'],
                    "coordinates": {
                        'lat': lat,
                        'lon': lon
                    },
                    "icon": iconUrl,
                    "temp": factWeather['temp'],
                    "city": hugeResponseCallback['geo_object']['province']['name']
                };
                callback(weatherBlockDto);
            }
        }
        this.requestCityWeather(lat, lon, wholeResponseCallback);
    }

    requestCityWeather(lat, lon, callback) {
        mainWorker.viewManager.showProgress();
        const requestUrl = this.createHttpRequest(lat, lon);
        const xhr = new XMLHttpRequest();
        xhr.open("GET", requestUrl, true);
        xhr.setRequestHeader("X-Yandex-API-Key", this.weatherKey);
        xhr.onload = function (e) {
            if (xhr.readyState === 4) {
                mainWorker.viewManager.hideProgress();
                if (xhr.status !== 200) {
                    callback(null);
                } else {
                    callback(JSON.parse(xhr.responseText));
                }
            }
        }
        xhr.send()
    }
}

class SearchApiManager {
    searchKey = "46edd134-b17f-43b6-8a70-da5c9841aba6";
}

class GeolocationUtils {
    initialize(successCallback, failureCallback, worker) {
        const geolocation = navigator.geolocation;
        const positionCallback = function (position) {
            console.log(position);
            successCallback(position.coords.latitude, position.coords.longitude);
        }
        const positionErrorCallback = function (positionError) {
            console.log(positionError);
            failureCallback();
        }
        geolocation.getCurrentPosition(positionCallback, positionErrorCallback, null);
    }
}

class ViewManager {
    showMainCityWeather(weather) {
        const cityName = document.getElementById("geolocation-city-name");
        const cityIcon = document.getElementById("geolocation-city-icon");
        const cityTemperature = document.getElementById("geolocation-temperature");

        const geoInfo = document.getElementsByClassName("info-by-geolocation")[0];

        cityName.innerHTML = weather['city'];
        cityIcon.src = weather['icon'];
        cityTemperature.innerHTML = `${weather['temp']}°C`;


        const geoInfoList = geoInfo.children[0].children;
        for (let i = 0; i < geoInfoList.length; ++i) {
            const listItem = geoInfoList[i];
            const geoField = listItem.children[0];
            switch (i) {
                case 0:
                    const wind = weather['wind'];
                    geoField.innerHTML = `${wind['wind_speed']}m/s, ${this.processWindDirection(wind['wind_dir'])}`;
                    break;
                case 1:
                    const condition = weather['condition'];
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
                    const coordinates = weather['coordinates'];
                    geoField.innerHTML = `[${coordinates['lat']}, ${coordinates['lon']}]`
                    break;
            }
        }

    }

    processWindDirection(direction) {
        let expandedDirection = "nowhere";
        switch (direction) {
            case "nw":
                expandedDirection = "Northwest"
                break;
            case "n":
                expandedDirection = "Northern";
                break;
            case "ne":
                expandedDirection = "Northeastern";
                break;
            case "se":
                expandedDirection = "Southeast";
                break;
            case "s":
                expandedDirection = "Southern";
                break;
            case "sw":
                expandedDirection = "Southwest";
                break;
            case "w":
                expandedDirection = "Western";
                break;
            case "с":
                expandedDirection = "Calm";
                break;
        }
        return expandedDirection;
    }

    showProgress() {
        const loadingContainer = document.getElementById("loading-view");
        loadingContainer.style.height = "100%";
        loadingContainer.style.visibility = "visible";
    }

    hideProgress() {
        setTimeout(function () {
            const loadingContainer = document.getElementById("loading-view");
            loadingContainer.style.height = "0";
            loadingContainer.style.visibility = "hidden";
        }, 500)
    }
}

const mainWorker = new Worker();
mainWorker.run();