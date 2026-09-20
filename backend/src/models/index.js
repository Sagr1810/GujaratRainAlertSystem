const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Region = sequelize.define('Region', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING(100), allowNull: false },
  code: { type: DataTypes.STRING(20), allowNull: false, unique: true },
  description: DataTypes.TEXT,
  color: { type: DataTypes.STRING(20), defaultValue: '#3b82f6' },
  lat: DataTypes.DECIMAL(10, 6),
  lng: DataTypes.DECIMAL(10, 6),
}, { tableName: 'regions', timestamps: true });

const City = sequelize.define('City', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING(100), allowNull: false },
  name_gujarati: DataTypes.STRING(100),
  district: DataTypes.STRING(100),
  region_id: { type: DataTypes.INTEGER, allowNull: false },
  lat: { type: DataTypes.DECIMAL(10, 6), allowNull: false },
  lng: { type: DataTypes.DECIMAL(10, 6), allowNull: false },
  elevation_m: DataTypes.INTEGER,
  population: DataTypes.INTEGER,
  owm_city_id: DataTypes.INTEGER,
  is_major: { type: DataTypes.BOOLEAN, defaultValue: false },
}, { tableName: 'cities', timestamps: true });

const RainReading = sequelize.define('RainReading', {
  id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
  city_id: { type: DataTypes.INTEGER, allowNull: false },
  region_id: { type: DataTypes.INTEGER, allowNull: false },
  rainfall_mm: { type: DataTypes.DECIMAL(8, 2), defaultValue: 0 },
  rainfall_1h: { type: DataTypes.DECIMAL(8, 2), defaultValue: 0 },
  rainfall_3h: { type: DataTypes.DECIMAL(8, 2), defaultValue: 0 },
  rainfall_24h: { type: DataTypes.DECIMAL(8, 2), defaultValue: 0 },
  temperature: DataTypes.DECIMAL(5, 2),
  humidity: DataTypes.INTEGER,
  wind_speed: DataTypes.DECIMAL(6, 2),
  wind_direction: DataTypes.INTEGER,
  pressure: DataTypes.DECIMAL(7, 2),
  visibility_km: DataTypes.DECIMAL(6, 2),
  cloud_cover: DataTypes.INTEGER,
  weather_desc: DataTypes.STRING(200),
  weather_icon: DataTypes.STRING(20),
  alert_level: {
    type: DataTypes.ENUM('normal', 'yellow', 'orange', 'red', 'dark_red'),
    defaultValue: 'normal',
  },
  recorded_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  source: { type: DataTypes.STRING(50), defaultValue: 'openweathermap' },
}, { tableName: 'rain_readings', timestamps: false });

const Alert = sequelize.define('Alert', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  city_id: DataTypes.INTEGER,
  region_id: DataTypes.INTEGER,
  alert_type: {
    type: DataTypes.ENUM('yellow', 'orange', 'red', 'dark_red', 'flood', 'cyclone', 'heatwave'),
    allowNull: false,
  },
  title: { type: DataTypes.STRING(200), allowNull: false },
  message: { type: DataTypes.TEXT, allowNull: false },
  rainfall_mm: DataTypes.DECIMAL(8, 2),
  is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
  issued_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  expires_at: DataTypes.DATE,
  source: { type: DataTypes.STRING(100), defaultValue: 'system' },
}, { tableName: 'alerts', timestamps: true });

const HistoricalImpact = sequelize.define('HistoricalImpact', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  year: { type: DataTypes.INTEGER, allowNull: false },
  region_id: DataTypes.INTEGER,
  city_id: DataTypes.INTEGER,
  event_name: DataTypes.STRING(200),
  event_type: {
    type: DataTypes.ENUM('flood', 'cyclone', 'heavy_rain', 'drought'),
    defaultValue: 'flood',
  },
  deaths: { type: DataTypes.INTEGER, defaultValue: 0 },
  displaced: { type: DataTypes.INTEGER, defaultValue: 0 },
  crops_damaged_ha: DataTypes.DECIMAL(12, 2),
  infrastructure_loss_cr: DataTypes.DECIMAL(12, 2),
  max_rainfall_mm: DataTypes.DECIMAL(8, 2),
  description: DataTypes.TEXT,
  started_at: DataTypes.DATE,
  ended_at: DataTypes.DATE,
}, { tableName: 'historical_impacts', timestamps: true });

const Reservoir = sequelize.define('Reservoir', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING(200), allowNull: false },
  district: DataTypes.STRING(100),
  region_id: DataTypes.INTEGER,
  capacity_mcm: DataTypes.DECIMAL(12, 2),
  current_level_mcm: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
  current_percent: { type: DataTypes.DECIMAL(5, 2), defaultValue: 0 },
  lat: DataTypes.DECIMAL(10, 6),
  lng: DataTypes.DECIMAL(10, 6),
  updated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, { tableName: 'reservoirs', timestamps: false });

const AgentConversation = sequelize.define('AgentConversation', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  session_id: { type: DataTypes.STRING(100), allowNull: false },
  user_message: { type: DataTypes.TEXT, allowNull: false },
  agent_response: DataTypes.TEXT,
  context_data: DataTypes.JSON,
  response_time_ms: DataTypes.INTEGER,
  rating: DataTypes.INTEGER,
  language: { type: DataTypes.STRING(10), defaultValue: 'en' },
}, { tableName: 'agent_conversations', timestamps: true });

const ForecastData = sequelize.define('ForecastData', {
  id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
  city_id: { type: DataTypes.INTEGER, allowNull: false },
  forecast_time: { type: DataTypes.DATE, allowNull: false },
  temp_min: DataTypes.DECIMAL(5, 2),
  temp_max: DataTypes.DECIMAL(5, 2),
  rainfall_mm: { type: DataTypes.DECIMAL(8, 2), defaultValue: 0 },
  pop: DataTypes.INTEGER,
  weather_desc: DataTypes.STRING(200),
  weather_icon: DataTypes.STRING(20),
  wind_speed: DataTypes.DECIMAL(6, 2),
  alert_level: {
    type: DataTypes.ENUM('normal', 'yellow', 'orange', 'red', 'dark_red'),
    defaultValue: 'normal',
  },
}, { tableName: 'forecast_data', timestamps: false });

// Associations
Region.hasMany(City, { foreignKey: 'region_id' });
City.belongsTo(Region, { foreignKey: 'region_id' });
City.hasMany(RainReading, { foreignKey: 'city_id' });
RainReading.belongsTo(City, { foreignKey: 'city_id' });
City.hasMany(Alert, { foreignKey: 'city_id' });
City.hasMany(ForecastData, { foreignKey: 'city_id' });
Region.hasMany(Reservoir, { foreignKey: 'region_id' });

module.exports = {
  sequelize,
  Region,
  City,
  RainReading,
  Alert,
  HistoricalImpact,
  Reservoir,
  AgentConversation,
  ForecastData,
};
