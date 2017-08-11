'use strict';
const Koa = require('koa');
const app = new Koa();
const mongoose = require("./config/mongo.config");

// trust proxy
app.proxy = true;

const db = mongoose();
const appConfig = require("./config/app.config");
const backgroundJobsConfig = require("./config/backgroundJobs.config")();
//метод конфигурации самого приложения
//задаем различные настройки и модули
appConfig(app);
// start server
const port = process.env.PORT || 4000
app.listen(port, () => console.log('Server listening on', port))
