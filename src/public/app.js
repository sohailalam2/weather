(function() {
    var ALERTS_UPDATE_INTERVAL_SECONDS = 60;
    var WEATHER_UPDATE_INTERVAL_SECONDS = 60;

    /**
     * Function for fetching all alerts from the server
     * GET /alerts
     */
    function getAlerts() {
        var that = this;

        that.clearError();
        that.clearMessage();
        axios.get('/alerts')
            .then(function(response) {
                that.alerts = response.data.data;
                console.log(that.alerts)
            })
            .catch(function(error) {
                that.error = error.response.data.error
            });
    }

    function getAllSubscribedWeatherInfo() {
        var that = this;

        that.clearError();
        that.clearMessage();
        axios.get('/subscriptions')
            .then(function(response) {
                that.weather = response.data;
            })
            .catch(function(error) {
                that.error = error.response.data.error
            });
    }

    /**
     * Function to subscribe for a weather update
     * POST /subscribe
     */
    function subscribe() {
        var that = this;

        that.clearError();
        that.clearMessage();
        axios.post('/subscribe', that.subscription)
            .then(function(response) {
                var data = response.data.data;

                that.message = 'Subscription successful :)   ';
                that.message += data.summary + ' in ' + data.address + ' with temperature of ' + data.temperature + ' degrees fahrenheit';
                that.weather.push(data);
            })
            .catch(function(error) {
                that.error = error.response.data.error
            });
    }

    /**
     * Function to get the weather information for a given address
     *
     * GET /weather/:address
     */
    function checkWeather() {
        var that = this;

        that.clearError();
        that.clearMessage();
        axios.get('/weather/' + that.subscription.address)
            .then(function(response) {
                var data = response.data.data;

                that.message = data.summary + ' in ' + data.address + ' with temperature of ' + data.temperature + ' degrees fahrenheit';
            })
            .catch(function(error) {
                that.error = error.response.data.error
            });
    }

    /**
     * A function to start timer interval for fetching all alerts
     */
    function checkAlerts() {
        var that = this;

        getAlerts.call(that);
        setInterval(function() { getAlerts.call(that); }, ALERTS_UPDATE_INTERVAL_SECONDS * 1000);
    }

    function checkWeatherUpdate() {
        var that = this;

        getAllSubscribedWeatherInfo.call(that);
        setInterval(function() { getAllSubscribedWeatherInfo.call(that); }, WEATHER_UPDATE_INTERVAL_SECONDS * 1000);
    }

    function formatAlertType(type) {
        switch(type) {
            case 'alert_max_temperature':
                return 'Temperature higher limit breached';
            case 'alert_min_temperature':
                return 'Temperature lower than set minimum';
        }
    }

    function getWeatherIcon(icon) {
        switch(icon) {
            case 'clear-day': return 'fa-sun-o';
            case 'clear-night': return 'fa-moon-o';
            case 'rain': return 'fa-tint';
            case 'snow': return 'fa-snowflake-o';
            case 'sleet': return 'fa-snowflake-o';
            case 'wind': return 'angle-double-up';
            case 'fog': return 'fa-snowflake-o';
            case 'cloudy': return 'fa-cloud';
            case 'partly-cloudy-day': return 'fa-cloud';
            case 'partly-cloudy-night': return 'fa-cloud';
        }
    }

    new Vue({
        el: '#app',
        data: {
            message: undefined,
            error: undefined,
            subscription: {
                address: '',
                alert_min_temperature: '',
                alert_max_temperature: ''
            },
            alerts: [],
            weather: []
        },
        mounted: function() {
            checkAlerts.call(this);
            checkWeatherUpdate.call(this);
        },
        methods: {
            subscribe: function() {
                subscribe.call(this);
            },
            checkWeather: function() {
                checkWeather.call(this);
            },
            clearMessage: function() {
                this.message = undefined;
            },
            clearError: function() {
                this.error = undefined;
            },
            formatAlertType: function(type) {
                return formatAlertType.call(this, type);
            },
            getWeatherIcon: function(icon) {
                return getWeatherIcon.call(this, icon);
            }
        }
    });
})();
